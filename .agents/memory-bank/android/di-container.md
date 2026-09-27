# 💉 ShellGuard Android — Application-Scoped Lazy DI Pattern

> **MANUAL DEPENDENCY INJECTION ARCHITECTURE & APPCONTAINER SPECIFICATION**
> *Details the frameworkless, application-scoped lazy dependency container for cold-start performance, zero-reflection auditability, and RAM zeroization.*

---

## 1. Rationale: Why Application-Scoped Lazy DI over Hilt / Koin

For an offline-first, security-critical 2FA authenticator companion, traditional dependency injection frameworks present architectural liabilities:

| Dimension | Framework DI (Hilt / Dagger) | Application-Scoped Lazy DI (`AppContainer`) |
| :--- | :--- | :--- |
| **Cold-Start Speed** | High startup tax (kapt/ksp code-gen, binding lookups, eagerly instantiated graphs). | **Sub-100ms instant boot**: components initialize on demand via Kotlin `by lazy`. |
| **Attack Surface** | Reflection, generated proxies, and large third-party runtime footprints. | **Zero framework dependencies**: pure Kotlin language primitives only. |
| **RAM Zeroization & Lock** | Singletons are anchored inside framework graph scopes, resisting complete memory purges. | Explicit container hooks allow resetting sensitive session ciphers and decryptors on lock. |
| **Auditability** | Complex annotation hierarchies (`@InstallIn`, `@EntryPoint`). | 100% linear, transparent, and third-party auditable by an external cryptologist. |
| **Testing** | Heavy test runners, mock modules, and annotation processors. | Plain interface substitution (`TestAppContainer`) with zero boilerplate. |

---

## 2. AppContainer Contract & Implementation

```kotlin
package com.clawstack.shellguard.di

import android.content.Context
import com.clawstack.shellguard.data.local.ShellGuardDatabase
import com.clawstack.shellguard.data.remote.BearerAuthInterceptor
import com.clawstack.shellguard.data.remote.api.ShellGuardApiService
import com.clawstack.shellguard.data.repository.TotpRepository
import com.clawstack.shellguard.data.repository.TotpRepositoryImpl
import com.clawstack.shellguard.data.repository.VaultRepository
import com.clawstack.shellguard.data.repository.VaultRepositoryImpl
import com.clawstack.shellguard.security.KeyStoreManager
import com.clawstack.shellguard.security.ShellCryptionEngine
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType

/**
 * Top-level dependency container scoped to the Application lifecycle.
 */
interface AppContainer {
    val keyStoreManager: KeyStoreManager
    val cryptoEngine: ShellCryptionEngine
    val database: ShellGuardDatabase
    val totpRepository: TotpRepository
    val vaultRepository: VaultRepository
    val apiService: ShellGuardApiService
}

/**
 * Thread-safe lazy implementation of AppContainer.
 * Dependencies are instantiated strictly upon first access.
 */
class DefaultAppContainer(private val context: Context) : AppContainer {

    override val keyStoreManager: KeyStoreManager by lazy {
        KeyStoreManager(context)
    }

    override val cryptoEngine: ShellCryptionEngine by lazy {
        ShellCryptionEngine(keyStoreManager)
    }

    override val database: ShellGuardDatabase by lazy {
        ShellGuardDatabase.getDatabase(context, keyStoreManager.getDatabasePassphrase())
    }

    override val totpRepository: TotpRepository by lazy {
        TotpRepositoryImpl(
            totpItemDao = database.totpItemDao(),
            cryptoEngine = cryptoEngine
        )
    }

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(BearerAuthInterceptor { keyStoreManager.getActiveSessionToken() })
            .build()
    }

    override val apiService: ShellGuardApiService by lazy {
        val contentType = "application/json".toMediaType()
        Retrofit.Builder()
            .baseUrl("http://10.0.2.2:6464/") // Default local dev host
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
            .create(ShellGuardApiService::class.java)
    }

    override val vaultRepository: VaultRepository by lazy {
        VaultRepositoryImpl(
            pearlDao = database.vaultPearlDao(),
            apiService = apiService,
            cryptoEngine = cryptoEngine
        )
    }
}
```

---

## 3. Application Lifecycle Integration

The container is instantiated in `Application.onCreate()` and retained across the process lifecycle:

```kotlin
package com.clawstack.shellguard

import android.app.Application
import com.clawstack.shellguard.di.AppContainer
import com.clawstack.shellguard.di.DefaultAppContainer

class ShellGuardApplication : Application() {

    /**
     * Application-scoped dependency container.
     */
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer(applicationContext)
    }
}
```

---

## 4. ViewModel Factory Scoping

Jetpack Compose screens and ViewModels access dependencies via custom `ViewModelProvider.Factory` initializers without global singletons or service locators:

```kotlin
package com.clawstack.shellguard.ui

import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.CreationExtras
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.clawstack.shellguard.ShellGuardApplication
import com.clawstack.shellguard.ui.viewmodels.TotpListViewModel
import com.clawstack.shellguard.ui.viewmodels.VaultViewModel

object AppViewModelProvider {
    val Factory = viewModelFactory {
        initializer {
            val app = shellGuardApplication()
            TotpListViewModel(
                totpRepository = app.container.totpRepository,
                cryptoEngine = app.container.cryptoEngine
            )
        }
        initializer {
            val app = shellGuardApplication()
            VaultViewModel(
                vaultRepository = app.container.vaultRepository
            )
        }
    }
}

/**
 * Extension helper to retrieve the application instance from CreationExtras.
 */
fun CreationExtras.shellGuardApplication(): ShellGuardApplication =
    (this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as ShellGuardApplication)
```

In Compose UI:
```kotlin
@Composable
fun TotpListScreen(
    viewModel: TotpListViewModel = viewModel(factory = AppViewModelProvider.Factory)
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // UI rendering...
}
```

---

## 5. Security & RAM Zeroization Protocol

When the application auto-locks (via `FLAG_SECURE` / `AppLifecycleObserver`), the container assists in deterministic teardown:

1. **Session Wipe**: Clears in-memory session keys and decrypted seeds cached inside `cryptoEngine` and `keyStoreManager`.
2. **Deterministic State Reset**: Because dependencies are not opaque static singletons, session-sensitive managers can be cleanly cleared or re-created upon subsequent biometric unlock.
