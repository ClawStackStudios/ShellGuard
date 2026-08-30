# 🌐 ShellGuard-TOTP — Routes, API Contracts & Sync Protocol

> **Specification of REST Endpoints, DTO Schemas, Network Interceptors & Reconciliation Algorithms**  
> *Aligned with the ClawStack Mobile Standard (`ClawChives-Mobile`).*

---

## 1. Uniform Response Envelope

All API endpoints exposed by the ShellGuard Express server return a uniform response envelope. The Android client unwraps this envelope centrally:

```kotlin
package com.clawstack.shellguard.totp.data.remote.models

import kotlinx.serialization.Serializable

@Serializable
data class ShellResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val code: String? = null,
    val details: List<ValidationIssue>? = null,
    val suggestion: String? = null
)

@Serializable
data class ValidationIssue(
    val path: String? = null,
    val message: String
)
```

---

## 2. API Endpoints & Request / Response Models

### A. Authentication: `POST /api/auth/token`
Generates a short-lived Bearer API token (`api-...`) from the SHA-256 hash of the user's `hu-` Human Identity Key.

**Request**:
```json
{
  "type": "human",
  "keyHash": "3b2c...64hexChars"
}
```

**Response (`ShellResponse<AuthTokenResponse>`)**:
```json
{
  "success": true,
  "data": {
    "token": "api-abc123xyz...",
    "type": "human",
    "createdAt": "2026-08-30T00:00:00.000Z",
    "expiresAt": "2026-08-31T00:00:00.000Z",
    "user": {
      "uuid": "8f3b6c2a-9e1d-4f5a-b6c8-1d2e3f4a5b6c",
      "username": "lucas",
      "displayName": "Lucas"
    }
  }
}
```

**Kotlin DTOs**:
```kotlin
@Serializable
data class TokenRequest(
    val type: String = "human",
    val keyHash: String
)

@Serializable
data class UserProfileDto(
    val uuid: String,
    val username: String,
    val displayName: String? = null
)

@Serializable
data class SessionData(
    val token: String,
    val type: String,
    val createdAt: String,
    val expiresAt: String,
    val user: UserProfileDto
)

@Serializable
data class TokenResponse(
    val success: Boolean,
    val data: SessionData? = null,
    val error: String? = null
)
```

---

### B. Vault Fetch: `GET /api/vault`
Retrieves all vault pearls owned by the authenticated user. The server decrypts per-row metadata (`title`, `username`, `category`) server-side when `DB_ENCRYPTION_KEY` is configured, while secret fields (`secret`, `totp_secret`) remain encrypted in client-side ShellCryption envelopes.

**Headers**:
`Authorization: Bearer api-abc123xyz...`

**Kotlin DTO**:
```kotlin
@Serializable
data class PearlDto(
    val id: String,
    val owner_uuid: String,
    val title: String,
    val username: String? = null,
    val url: String? = null,
    val category: String? = null,
    val notes: String? = null,
    val secret: String, // ShellCryption envelope for password
    val totp_secret: String? = null, // ShellCryption envelope for TOTP seed
    val attachments: String = "[]",
    val custom_fields: String? = null,
    val created_at: String,
    val updated_at: String? = null
)

@Serializable
data class VaultResponse(
    val success: Boolean,
    val data: List<PearlDto> = emptyList(),
    val error: String? = null
)
```

---

## 3. ClawStack Standardized Client & Network Diagnostics (Ktor Engine)

Aligned with `ClawChives-Mobile`, the networking layer provides dynamic base URL binding, client version telemetry, and 400 validation diagnostics:

```kotlin
package com.clawstack.shellguard.totp.data.remote

import android.util.Log
import com.clawstack.shellguard.totp.data.remote.models.*
import io.ktor.client.HttpClient
import io.ktor.client.HttpClientConfig
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json

suspend fun handleNetworkDiagnostics(response: HttpResponse) {
    if (response.status.value == 400) {
        val responseBody = response.bodyAsText()
        try {
            val errorDetails = Json { ignoreUnknownKeys = true }.decodeFromString<ShellResponse<Unit>>(responseBody)
            Log.e("ShellGuardClient", "🚨 [VALIDATION ERROR 400]: ${errorDetails.error}")
            errorDetails.details?.forEach { issue ->
                Log.e("ShellGuardClient", "  → Field [${issue.path}]: ${issue.message}")
            }
        } catch (e: Exception) {
            Log.e("ShellGuardClient", "🚨 [HTTP 400 RAW]: $responseBody", e)
        }
    }
}

class ShellGuardTotpClient(
    private val baseUrl: String, // e.g. http://192.168.1.50:6464 or https://vault.example.com
    private val onUnauthorized: (() -> Unit)? = null
) {
    private val jsonConfig = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        encodeDefaults = true
    }

    private val client = HttpClient {
        install(ContentNegotiation) {
            json(jsonConfig)
        }
        defaultRequest {
            url {
                val base = baseUrl.removeSuffix("/")
                takeFrom("$base/")
            }
            header("X-Client-Version", "1.0.0")
            header("Accept-Version", "1.0.0")
            header("Accept", "application/json")
        }
        HttpResponseValidator {
            validateResponse { response ->
                if (response.status == HttpStatusCode.Unauthorized || response.status == HttpStatusCode.Forbidden) {
                    onUnauthorized?.invoke()
                }
            }
        }
    }

    /**
     * 1. Public Health Check
     */
    suspend fun getHealth(): Result<Boolean> = withContext(Dispatchers.IO) {
        runCatching {
            val response: HttpResponse = client.get("api/health")
            response.status == HttpStatusCode.OK
        }
    }

    /**
     * 2. Authentication Handshake (POST /api/auth/token)
     */
    suspend fun authenticate(keyHash: String): Result<SessionData> = withContext(Dispatchers.IO) {
        runCatching {
            val requestBody = TokenRequest(type = "human", keyHash = keyHash)
            val response: HttpResponse = client.post("api/auth/token") {
                contentType(ContentType.Application.Json)
                setBody(requestBody)
            }
            handleNetworkDiagnostics(response)

            if (response.status == HttpStatusCode.Created || response.status == HttpStatusCode.OK) {
                val res = response.body<TokenResponse>()
                if (res.success && res.data != null) {
                    res.data
                } else {
                    throw Exception(res.error ?: "Authentication failed")
                }
            } else {
                throw Exception("Auth request failed: ${response.status.value}")
            }
        }
    }

    /**
     * 3. Fetch Vault Items (GET /api/vault)
     */
    suspend fun fetchVault(sessionToken: String): Result<List<PearlDto>> = withContext(Dispatchers.IO) {
        runCatching {
            val response: HttpResponse = client.get("api/vault") {
                header(HttpHeaders.Authorization, "Bearer $sessionToken")
            }
            handleNetworkDiagnostics(response)

            if (response.status == HttpStatusCode.OK) {
                val res = response.body<VaultResponse>()
                res.data
            } else {
                throw Exception("Fetch vault failed with status: ${response.status.value}")
            }
        }
    }

    /**
     * 4. Create Vault Item (POST /api/vault) — Upstream Sync Push
     */
    suspend fun createVaultItem(sessionToken: String, payload: CreatePearlDto): Result<PearlDto> = withContext(Dispatchers.IO) {
        runCatching {
            val response: HttpResponse = client.post("api/vault") {
                header(HttpHeaders.Authorization, "Bearer $sessionToken")
                contentType(ContentType.Application.Json)
                setBody(payload)
            }
            handleNetworkDiagnostics(response)

            if (response.status == HttpStatusCode.Created || response.status == HttpStatusCode.OK) {
                val res = response.body<ShellResponse<PearlDto>>()
                if (res.success && res.data != null) res.data
                else throw Exception(res.error ?: "Failed to push 2FA secret to server")
            } else {
                throw Exception("Create vault item failed with status: ${response.status.value}")
            }
        }
    }

    /**
     * 5. Update Vault Item (PUT /api/vault/:id) — Upstream Edit Push
     */
    suspend fun updateVaultItem(sessionToken: String, id: String, payload: UpdatePearlDto): Result<PearlDto> = withContext(Dispatchers.IO) {
        runCatching {
            val response: HttpResponse = client.put("api/vault/$id") {
                header(HttpHeaders.Authorization, "Bearer $sessionToken")
                contentType(ContentType.Application.Json)
                setBody(payload)
            }
            handleNetworkDiagnostics(response)

            if (response.status == HttpStatusCode.OK) {
                val res = response.body<ShellResponse<PearlDto>>()
                if (res.success && res.data != null) res.data
                else throw Exception(res.error ?: "Failed to update 2FA secret on server")
            } else {
                throw Exception("Update vault item failed with status: ${response.status.value}")
            }
        }
    }

    fun close() {
        client.close()
    }
}

@Serializable
data class CreatePearlDto(
    val id: String,
    val title: String,
    val secret: String, // Encrypted empty password or placeholder
    val username: String? = null,
    val url: String? = null,
    val type: String = "password",
    val category: String? = "Personal",
    val notes: String? = null,
    val totp_secret: String? = null // Encrypted Base32 TOTP Seed
)

@Serializable
data class UpdatePearlDto(
    val title: String,
    val secret: String,
    val username: String? = null,
    val url: String? = null,
    val type: String = "password",
    val category: String? = "Personal",
    val notes: String? = null,
    val totp_secret: String? = null
)
```

---

## 4. Standard `ApiClient` Dynamic Provider

```kotlin
package com.clawstack.shellguard.totp.data.remote

object ApiClient {
    private var currentClient: ShellGuardTotpClient? = null
    var authToken: String? = null
        private set
    var currentServerUrl: String? = null
        private set

    var onUnauthorizedCallback: (() -> Unit)? = null

    fun updateAuthToken(token: String?) {
        authToken = token
    }

    fun getCurrentClient(): ShellGuardTotpClient {
        return currentClient ?: throw IllegalStateException("API Client not initialized with base URL.")
    }

    @Synchronized
    fun getClient(baseUrl: String): ShellGuardTotpClient {
        if (currentServerUrl == baseUrl && currentClient != null) {
            return currentClient!!
        }

        currentClient?.close()
        currentServerUrl = baseUrl
        currentClient = ShellGuardTotpClient(
            baseUrl = baseUrl,
            onUnauthorized = { onUnauthorizedCallback?.invoke() }
        )
        return currentClient!!
    }
}
```

---

## 5. Bidirectional (Two-Way) Delta Reconciliation Algorithm

```kotlin
package com.clawstack.shellguard.totp.data.repository

import com.clawstack.shellguard.totp.crypto.ClawCrypto
import com.clawstack.shellguard.totp.crypto.ShellCryptionEngine
import com.clawstack.shellguard.totp.data.local.dao.TotpItemDao
import com.clawstack.shellguard.totp.data.local.entities.TotpItemEntity
import com.clawstack.shellguard.totp.data.remote.ApiClient
import com.clawstack.shellguard.totp.data.remote.CreatePearlDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class TotpRepository(
    private val totpItemDao: TotpItemDao
) {
    suspend fun syncRemoteVault(serverUrl: String, rawHuKey: String, userUuid: String): Result<Int> = withContext(Dispatchers.IO) {
        runCatching {
            val client = ApiClient.getClient(serverUrl)
            
            // ── Step 1. Ensure Active Session Token ──────────────────
            var token = ApiClient.authToken
            if (token == null) {
                val keyHash = ClawCrypto.hashHumanKey(rawHuKey)
                val session = client.authenticate(keyHash).getOrThrow()
                token = session.token
                ApiClient.updateAuthToken(token)
            }

            val itemKey = ShellCryptionEngine.deriveShellKey(rawHuKey, userUuid)

            // ── Step 2. UPSTREAM PUSH: Push Local/Pending Items to Server ──
            val pendingItems = totpItemDao.getPendingSyncItems(userUuid)
            for (item in pendingItems) {
                try {
                    // Encrypt TOTP seed with AAD "vault_pearls_totp:{id}"
                    val encryptedTotp = ShellCryptionEngine.encryptField(
                        plaintext = item.secret,
                        shellKey = itemKey,
                        table = "vault_pearls_totp",
                        recordId = item.id
                    )

                    // Encrypt placeholder empty password with AAD "vault_pearls:{id}"
                    val encryptedEmptySecret = ShellCryptionEngine.encryptField(
                        plaintext = "",
                        shellKey = itemKey,
                        table = "vault_pearls",
                        recordId = item.id
                    )

                    val payload = CreatePearlDto(
                        id = item.id,
                        title = item.title,
                        username = item.username ?: "",
                        secret = encryptedEmptySecret,
                        totp_secret = encryptedTotp,
                        type = "password",
                        category = item.category ?: "Personal"
                    )

                    client.createVaultItem(token, payload).getOrThrow()

                    // Mark as synced locally
                    totpItemDao.upsertItem(item.copy(isLocalOnly = false, syncState = "SYNCED"))
                } catch (e: Exception) {
                    // If item already exists on server, proceed to pull/merge
                }
            }

            // ── Step 3. DOWNSTREAM PULL: Fetch & Merge Remote Items ──
            val remotePearls = client.fetchVault(token).getOrThrow()
            
            // Filter items that have a non-empty totp_secret
            val totpPearls = remotePearls.filter { !it.totp_secret.isNullOrBlank() }

            // Decrypt seeds and map to Room entities
            val entities = totpPearls.mapNotNull { pearl ->
                try {
                    val decryptedSeed = ShellCryptionEngine.decryptField(
                        encryptedJson = pearl.totp_secret!!,
                        shellKey = itemKey,
                        table = "vault_pearls_totp",
                        recordId = pearl.id
                    )
                    TotpItemEntity(
                        id = pearl.id,
                        ownerUuid = pearl.owner_uuid,
                        title = pearl.title,
                        username = pearl.username,
                        category = pearl.category,
                        secret = decryptedSeed,
                        isLocalOnly = false,
                        syncState = "SYNCED",
                        remoteUpdatedAt = pearl.updated_at
                    )
                } catch (e: Exception) {
                    null // Skip corrupted envelopes
                }
            }

            // ── Step 4. Upsert into Room DB and prune deleted remote items ──
            totpItemDao.upsertItems(entities)
            val remoteIds = entities.map { it.id }
            totpItemDao.pruneDeletedRemoteItems(userUuid, remoteIds)

            entities.size
        }
    }
}
```

---

## 6. Transport Security, LAN, Tailscale VPN & Cleartext HTTP Configuration

Self-hosted deployments require first-class support for diverse networking topologies:
1. **Cleartext HTTP over Local LAN**: `http://192.168.1.150:6464`, `http://unraid.local:6464`, `http://10.0.0.50:6464`.
2. **Private Mesh VPNs (Tailscale / WireGuard / Headscale / OpenVPN)**: `http://100.x.y.z:6464` or `http://my-nas:6464`.
3. **Public or Private HTTPS / TLS**: `https://vault.example.com` or custom self-signed certs.

### A. Android Manifest & Network Security Config (`res/xml/network_security_config.xml`)

By default, Android 9+ (API 28+) blocks all unencrypted HTTP traffic. To support local servers and VPN mesh networks, we define `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- 
      Foolproof Base Configuration for Self-Hosted & Local Development:
      Enables cleartext HTTP for ALL hostnames and raw IP addresses (LAN 192.168.x.x, 10.x.x.x, Tailscale 100.x.y.z)
    -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

Referenced in `AndroidManifest.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true"
        android:allowBackup="false"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.ShellGuard">
        <!-- Activities -->
    </application>
</manifest>
```

### B. Ktor OkHttp Engine with VPN, Cleartext & Self-Signed TLS Support

```kotlin
package com.clawstack.shellguard.totp.data.remote

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import okhttp3.ConnectionSpec
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

fun createKtorClient(): HttpClient {
    return HttpClient(OkHttp) {
        engine {
            config {
                // 1. Explicitly allow Plaintext HTTP alongside Modern TLS
                connectionSpecs(
                    listOf(
                        ConnectionSpec.MODERN_TLS,
                        ConnectionSpec.COMPATIBLE_TLS,
                        ConnectionSpec.CLEARTEXT
                    )
                )

                // 2. Relaxed TrustManager allowing self-signed certs in private self-hosted labs
                val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
                    override fun checkClientTrusted(chain: Array<X509Certificate>?, authType: String?) {}
                    override fun checkServerTrusted(chain: Array<X509Certificate>?, authType: String?) {}
                    override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
                })
                val sslContext = SSLContext.getInstance("SSL")
                sslContext.init(null, trustAllCerts, SecureRandom())
                sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
                hostnameVerifier { _, _ -> true }
                
                // 3. Follow redirects and route across active VPN tunnels (Tailscale/WireGuard)
                followRedirects(true)
                followSslRedirects(true)
            }
        }
        install(ContentNegotiation) {
            json()
        }
    }
}
```

---

## 7. Periodic Background Delta Synchronization (`TotpSyncWorker.kt`)

Leverages **AndroidX WorkManager** to execute periodic 15-minute delta synchronizations without waking the device unnecessarily or blocking the main UI thread. It respects the `AuthRepository` concurrency mutex:

```kotlin
package com.clawstack.shellguard.totp.data.sync

import android.content.Context
import android.util.Log
import androidx.work.*
import com.clawstack.shellguard.totp.data.local.dao.SyncMetadataDao
import com.clawstack.shellguard.totp.data.local.dao.TotpItemDao
import com.clawstack.shellguard.totp.data.local.entities.SyncMetadataEntity
import com.clawstack.shellguard.totp.data.repository.AuthRepository
import com.clawstack.shellguard.totp.data.repository.TotpRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

class TotpSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters,
    private val authRepository: AuthRepository,
    private val totpRepository: TotpRepository,
    private val syncMetadataDao: SyncMetadataDao
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val serverUrl = authRepository.serverUrl.value ?: return@withContext Result.success()
        val userUuid = authRepository.currentUserUuid.value ?: return@withContext Result.success()
        val rawHuKey = authRepository.currentRawHuKey.value ?: return@withContext Result.success()

        Log.d("TotpSyncWorker", "🔄 Starting background vault delta sync with $serverUrl")

        try {
            // Guard with mutex to avoid race conditions with user-triggered syncs
            authRepository.withSyncLock {
                val syncedCount = totpRepository.syncRemoteVault(
                    serverUrl = serverUrl,
                    rawHuKey = rawHuKey,
                    userUuid = userUuid
                ).getOrThrow()

                syncMetadataDao.updateMetadata(
                    SyncMetadataEntity(
                        id = 1,
                        serverUrl = serverUrl,
                        ownerUuid = userUuid,
                        lastSyncTimestamp = System.currentTimeMillis(),
                        lastSyncStatus = "SUCCESS",
                        itemCount = syncedCount,
                        lastErrorMessage = null
                    )
                )

                Log.d("TotpSyncWorker", "✅ Background sync completed: $syncedCount items synced.")
            }
            Result.success()
        } catch (e: Exception) {
            Log.e("TotpSyncWorker", "❌ Background sync failed: ${e.message}", e)
            syncMetadataDao.updateMetadata(
                SyncMetadataEntity(
                    id = 1,
                    serverUrl = serverUrl,
                    ownerUuid = userUuid,
                    lastSyncTimestamp = System.currentTimeMillis(),
                    lastSyncStatus = "FAILED",
                    lastErrorMessage = e.message
                )
            )
            Result.retry()
        }
    }

    companion object {
        private const val SYNC_WORK_NAME = "shellguard_totp_periodic_sync"

        fun schedulePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<TotpSyncWorker>(
                repeatInterval = 15,
                repeatIntervalTimeUnit = TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                SYNC_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
        }

        fun cancelPeriodicSync(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(SYNC_WORK_NAME)
        }
    }
}
```



