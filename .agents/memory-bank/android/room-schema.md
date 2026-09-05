# 🗄️ ShellGuard Android — Room Database Schema & DAOs

> **OFFLINE-FIRST ENCRYPTED CACHE SPECIFICATION**
> *Defines Room Entities, DAOs, Converters, and relational models for the native Android client.*

---

## 1. Room Entity Models

### A. `VaultPearlEntity` (Logins / Passwords)

```kotlin
package com.clawstack.shellguard.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "vault_pearls",
    indices = [
        Index(value = ["owner_uuid"]),
        Index(value = ["category"]),
        Index(value = ["sync_state"])
    ]
)
data class VaultPearlEntity(
    @PrimaryKey
    @ColumnInfo(name = "uuid")
    val uuid: String,

    @ColumnInfo(name = "owner_uuid")
    val ownerUuid: String,

    @ColumnInfo(name = "title")
    val title: String,

    @ColumnInfo(name = "username")
    val username: String? = null,

    @ColumnInfo(name = "url")
    val url: String? = null,

    @ColumnInfo(name = "category")
    val category: String? = null, // Pod path: e.g. "Work/Email" or null

    @ColumnInfo(name = "notes")
    val notes: String? = null,

    // Raw ShellCryption JSON Envelope String
    @ColumnInfo(name = "encrypted_secret_blob")
    val encryptedSecretBlob: String,

    // Raw ShellCryption JSON Envelope String (if TOTP exists)
    @ColumnInfo(name = "encrypted_totp_blob")
    val encryptedTotpBlob: String? = null,

    // List of attachment UUIDs stored as JSON array string
    @ColumnInfo(name = "attachments_json")
    val attachmentsJson: String = "[]",

    @ColumnInfo(name = "created_at")
    val createdAt: String,

    @ColumnInfo(name = "updated_at")
    val updatedAt: String,

    // Local Sync State: "SYNCED", "PENDING_INSERT", "PENDING_UPDATE", "PENDING_DELETE"
    @ColumnInfo(name = "sync_state")
    val syncState: String = "SYNCED"
)
```

### B. `SecureNoteEntity`

```kotlin
package com.clawstack.shellguard.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "vault_secure_notes")
data class SecureNoteEntity(
    @PrimaryKey
    val uuid: String,
    @ColumnInfo(name = "owner_uuid") val ownerUuid: String,
    val title: String,
    val category: String? = null,
    @ColumnInfo(name = "encrypted_content_blob") val encryptedContentBlob: String,
    @ColumnInfo(name = "created_at") val createdAt: String,
    @ColumnInfo(name = "updated_at") val updatedAt: String,
    @ColumnInfo(name = "sync_state") val syncState: String = "SYNCED"
)
```

### C. `SshKeyEntity`

```kotlin
package com.clawstack.shellguard.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "vault_ssh_keys")
data class SshKeyEntity(
    @PrimaryKey
    val uuid: String,
    @ColumnInfo(name = "owner_uuid") val ownerUuid: String,
    val title: String,
    val category: String? = null,
    @ColumnInfo(name = "key_type") val keyType: String = "ED25519", // RSA, ED25519, ECDSA
    @ColumnInfo(name = "public_key") val publicKey: String? = null,
    @ColumnInfo(name = "encrypted_private_key_blob") val encryptedPrivateKeyBlob: String,
    @ColumnInfo(name = "fingerprint") val fingerprint: String? = null,
    @ColumnInfo(name = "created_at") val createdAt: String,
    @ColumnInfo(name = "updated_at") val updatedAt: String,
    @ColumnInfo(name = "sync_state") val syncState: String = "SYNCED"
)
```

### D. `SecureAttachmentEntity`

```kotlin
package com.clawstack.shellguard.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "vault_secure_attachments")
data class SecureAttachmentEntity(
    @PrimaryKey
    val uuid: String,
    @ColumnInfo(name = "owner_uuid") val ownerUuid: String,
    @ColumnInfo(name = "file_name") val fileName: String,
    @ColumnInfo(name = "mime_type") val mimeType: String,
    @ColumnInfo(name = "file_size") val fileSize: Long,
    @ColumnInfo(name = "encrypted_file_blob") val encryptedFileBlob: String,
    @ColumnInfo(name = "parent_pearl_uuid") val parentPearlUuid: String? = null,
    @ColumnInfo(name = "created_at") val createdAt: String,
    @ColumnInfo(name = "sync_state") val syncState: String = "SYNCED"
)
```

---

## 2. Room Data Access Objects (DAOs)

```kotlin
package com.clawstack.shellguard.data.local.dao

import androidx.room.*
import com.clawstack.shellguard.data.local.entities.VaultPearlEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface VaultPearlDao {
    @Query("SELECT * FROM vault_pearls WHERE owner_uuid = :ownerUuid ORDER BY updated_at DESC")
    fun observeAllPearls(ownerUuid: String): Flow<List<VaultPearlEntity>>

    @Query("SELECT * FROM vault_pearls WHERE uuid = :uuid LIMIT 1")
    suspend fun getPearlById(uuid: String): VaultPearlEntity?

    @Query("SELECT * FROM vault_pearls WHERE category = :category AND owner_uuid = :ownerUuid")
    fun observePearlsByPod(ownerUuid: String, category: String): Flow<List<VaultPearlEntity>>

    @Query("SELECT * FROM vault_pearls WHERE sync_state != 'SYNCED'")
    suspend fun getPendingSyncPearls(): List<VaultPearlEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPearls(pearls: List<VaultPearlEntity>)

    @Query("DELETE FROM vault_pearls WHERE uuid = :uuid")
    suspend fun deletePearlById(uuid: String)

    @Query("DELETE FROM vault_pearls WHERE owner_uuid = :ownerUuid")
    suspend fun clearVault(ownerUuid: String)
}
```

---

## 3. Database Builder with SQLCipher Encryption

```kotlin
package com.clawstack.shellguard.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.clawstack.shellguard.data.local.dao.*
import com.clawstack.shellguard.data.local.entities.*
import net.sqlcipher.database.SupportFactory

@Database(
    entities = [
        VaultPearlEntity::class,
        SecureNoteEntity::class,
        SshKeyEntity::class,
        SecureAttachmentEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class ShellGuardDatabase : RoomDatabase() {
    abstract fun pearlDao(): VaultPearlDao
    abstract fun noteDao(): SecureNoteDao
    abstract fun sshKeyDao(): SshKeyDao
    abstract fun attachmentDao(): SecureAttachmentDao

    companion object {
        fun buildEncryptedDatabase(context: Context, passphraseBytes: ByteArray): ShellGuardDatabase {
            val factory = SupportFactory(passphraseBytes)
            return Room.databaseBuilder(
                context.applicationContext,
                ShellGuardDatabase::class.java,
                "shellguard_offline.db"
            )
                .openHelperFactory(factory)
                .fallbackToDestructiveMigration()
                .build()
        }
    }
}
```
