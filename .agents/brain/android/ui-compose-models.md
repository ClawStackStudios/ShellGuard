# 🎨 ShellGuard Android — Jetpack Compose UI & Design System

> **REEF MODERNIST ("BIOLUMINESCENT DEFENSE") JETPACK COMPOSE SPECIFICATION**
> *Defines Compose UI themes, color tokens, typography, navigation routes, and ViewModel MVI state models.*

---

## 1. Reef Modernist Theme & Colors

```kotlin
package com.clawstack.shellguard.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color

// Brand Palette — Bioluminescent Defense
val AbyssalDeep = Color(0xFF030712)       // Main Background (Deep Trench)
val ShellSurface = Color(0xFF0F172A)      // Card / Container Surface
val ShellBorder = Color(0xFF1E293B)       // Border / Divider
val ClawCyan = Color(0xFF06B6D4)          // Primary Brand Accent (Electric Bioluminescence)
val ClawCyanGlow = Color(0x3306B6D4)      // Glow / Selection Background
val LobsterRed = Color(0xFFEF4444)        // Danger / Action Accent
val CoralOrange = Color(0xFFF97316)       // Warning / Attention
val TextPearl = Color(0xFFF8FAFC)         // Primary Foreground Text
val TextMuted = Color(0xFF94A3B8)         // Secondary / Muted Text

val ShellGuardColorScheme = darkColorScheme(
    primary = ClawCyan,
    onPrimary = AbyssalDeep,
    primaryContainer = ClawCyanGlow,
    onPrimaryContainer = ClawCyan,
    secondary = LobsterRed,
    onSecondary = TextPearl,
    background = AbyssalDeep,
    onBackground = TextPearl,
    surface = ShellSurface,
    onSurface = TextPearl,
    outline = ShellBorder
)
```

---

## 2. Navigation Architecture

```kotlin
package com.clawstack.shellguard.ui.navigation

sealed class Screen(val route: String) {
    object LockScreen : Screen("lock")
    object SetupScreen : Screen("setup")
    object VaultScreen : Screen("vault")
    object ItemDetailScreen : Screen("vault/{uuid}") {
        fun createRoute(uuid: String) = "vault/$uuid"
    }
    object ItemEditScreen : Screen("vault/edit?uuid={uuid}&type={type}") {
        fun createRoute(uuid: String? = null, type: String = "login") =
            "vault/edit?uuid=${uuid ?: ""}&type=$type"
    }
    object GeneratorScreen : Screen("generator")
    object SettingsScreen : Screen("settings")
    object LobsterKeysScreen : Screen("lobster_keys")
}
```

---

## 3. Vault MVI ViewModel & State

```kotlin
package com.clawstack.shellguard.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.clawstack.shellguard.data.local.entities.VaultPearlEntity
import com.clawstack.shellguard.data.repository.VaultRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class VaultUiState(
    val isLoading: Boolean = false,
    val isLocked: Boolean = true,
    val selectedPod: String? = null,
    val items: List<VaultPearlEntity> = emptyList(),
    val availablePods: List<String> = emptyList(),
    val searchQuery: String = "",
    val errorMessage: String? = null
)

class VaultViewModel(
    private val vaultRepository: VaultRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(VaultUiState())
    val uiState: StateFlow<VaultUiState> = _uiState.asStateFlow()

    init {
        observeVaultItems()
    }

    private fun observeVaultItems() {
        viewModelScope.launch {
            vaultRepository.observeAllItems()
                .collect { itemList ->
                    val pods = itemList.mapNotNull { it.category }
                        .filter { it.isNotBlank() }
                        .distinct()
                        .sorted()

                    _uiState.update { current ->
                        current.copy(
                            items = itemList,
                            availablePods = pods,
                            isLoading = false
                        )
                    }
                }
        }
    }

    fun selectPod(podPath: String?) {
        _uiState.update { it.copy(selectedPod = podPath) }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }
}
```
