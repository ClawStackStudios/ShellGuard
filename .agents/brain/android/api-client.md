# 🌐 ShellGuard Android — API Client & Sync Engine

> **REST NETWORKING & WORKMANAGER SYNC SPECIFICATION**
> *Details Retrofit/Ktor service interfaces, token interceptors, response envelopes, and offline-first synchronization.*

---

## 1. Network Response Envelope

All endpoints return a uniform envelope matching the ShellGuard server:

```kotlin
package com.clawstack.shellguard.data.remote.models

import kotlinx.serialization.Serializable

@Serializable
data class ShellResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val code: String? = null,
    val details: List<String>? = null
)
```

---

## 2. Remote DTO Models

```kotlin
package com.clawstack.shellguard.data.remote.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PearlDto(
    val uuid: String,
    @SerialName("owner_uuid") val ownerUuid: String,
    val title: String,
    val username: String? = null,
    val url: String? = null,
    val category: String? = null,
    val notes: String? = null,
    val secret: String, // Raw ShellCryption JSON envelope
    @SerialName("totp_secret") val totpSecret: String? = null,
    val attachments: List<String> = emptyList(),
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String
)

@Serializable
data class CreatePearlRequest(
    val uuid: String? = null,
    val title: String,
    val username: String? = null,
    val url: String? = null,
    val category: String? = null,
    val notes: String? = null,
    val secret: String, // Encrypted ShellCryption blob
    @SerialName("totp_secret") val totpSecret: String? = null,
    val attachments: List<String> = emptyList()
)

@Serializable
data class AuthTokenRequest(
    val keyHash: String // SHA-256 hash of hu- or lb- key
)

@Serializable
data class AuthTokenResponse(
    val token: String, // Short-lived api- bearer token
    val ownerUuid: String,
    val username: String,
    val expiresAt: String
)
```

---

## 3. Retrofit Service Interface

```kotlin
package com.clawstack.shellguard.data.remote.api

import com.clawstack.shellguard.data.remote.models.*
import retrofit2.Response
import retrofit2.http.*

interface ShellGuardApiService {
    // Auth
    @POST("api/auth/token")
    suspend fun createSessionToken(
        @Body request: AuthTokenRequest
    ): Response<ShellResponse<AuthTokenResponse>>

    @GET("api/auth/validate")
    suspend fun validateToken(): Response<ShellResponse<Map<String, String>>>

    // Vault Pearls (Logins)
    @GET("api/vault")
    suspend fun getVaultPearls(): Response<ShellResponse<List<PearlDto>>>

    @POST("api/vault")
    suspend fun createVaultPearl(
        @Body pearl: CreatePearlRequest
    ): Response<ShellResponse<PearlDto>>

    @PUT("api/vault/{uuid}")
    suspend fun updateVaultPearl(
        @Path("uuid") uuid: String,
        @Body pearl: CreatePearlRequest
    ): Response<ShellResponse<PearlDto>>

    @DELETE("api/vault/{uuid}")
    suspend fun deleteVaultPearl(
        @Path("uuid") uuid: String
    ): Response<ShellResponse<Map<String, Boolean>>>

    // Secure Notes
    @GET("api/notes")
    suspend fun getSecureNotes(): Response<ShellResponse<List<NoteDto>>>

    // SSH Keys
    @GET("api/ssh-keys")
    suspend fun getSshKeys(): Response<ShellResponse<List<SshKeyDto>>>
}
```

---

## 4. Auth Interceptor

```kotlin
package com.clawstack.shellguard.data.remote

import okhttp3.Interceptor
import okhttp3.Response

class BearerAuthInterceptor(
    private val tokenProvider: () -> String?
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = tokenProvider()

        val request = if (token != null && !original.url.encodedPath.contains("api/auth/token")) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .header("Accept", "application/json")
                .build()
        } else {
            original.newBuilder()
                .header("Accept", "application/json")
                .build()
        }

        return chain.proceed(request)
    }
}
```

---

## 5. WorkManager Offline Sync Worker

```kotlin
package com.clawstack.shellguard.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.clawstack.shellguard.data.repository.VaultRepository

class VaultSyncWorker(
    context: Context,
    params: WorkerParameters,
    private val vaultRepository: VaultRepository
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            // 1. Push local changes (PENDING_INSERT, PENDING_UPDATE, PENDING_DELETE)
            vaultRepository.flushOutboxChanges()

            // 2. Pull remote updates and update Room cache
            vaultRepository.fetchAndReconcileRemoteVault()

            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}
```
