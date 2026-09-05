# 🔐 ShellGuard Android — Cryptography Specification

> **SHELLCRYPTION ANDROID IMPLEMENTATION SPECIFICATION**
> *Matches web client `crypto.ts` and server `fieldEncryption.ts` with 100% mathematical and envelope-level parity.*

---

## 1. Cryptographic Primitive Envelopes

Every client-encrypted field stored on the server adheres to the **ShellCryption v1** JSON envelope format:

```json
{
  "v": 1,
  "alg": "AES-GCM-256",
  "iv": "<base64-encoded-12-byte-iv>",
  "ct": "<base64-encoded-ciphertext-plus-16-byte-auth-tag>",
  "aad": "<aad-binding-string>"
}
```

---

## 2. Key Derivation (HKDF-SHA-256)

To prevent cross-item key reuse, each item's AES-256-GCM key is derived from the Human Master Key (`hu-...`) and the item's UUID.

### Derivation Invariant
- **IKM (Input Key Material)**: Raw bytes of the `hu-` key string (UTF-8).
- **Salt**: Item UUID (ASCII bytes).
- **Info**: `"ShellGuard-ShellCryption-v1"` (ASCII bytes).
- **Length**: 32 bytes (256 bits).

### Kotlin Implementation

```kotlin
package com.clawstack.shellguard.crypto

import java.nio.charset.StandardCharsets
import java.security.GeneralSecurityException
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object ShellKeyDerivation {
    private const val HMAC_ALGORITHM = "HmacSHA256"
    private const val INFO_STRING = "ShellGuard-ShellCryption-v1"

    fun deriveItemKey(masterKeyString: String, itemUuid: String): SecretKeySpec {
        val ikm = masterKeyString.toByteArray(StandardCharsets.UTF_8)
        val salt = itemUuid.toByteArray(StandardCharsets.UTF_8)
        val info = INFO_STRING.toByteArray(StandardCharsets.UTF_8)

        val prk = hkdfExtract(salt, ikm)
        val okm = hkdfExpand(prk, info, 32)

        return SecretKeySpec(okm, "AES")
    }

    private fun hkdfExtract(salt: ByteArray, ikm: ByteArray): ByteArray {
        val mac = Mac.getInstance(HMAC_ALGORITHM)
        val actualSalt = if (salt.isEmpty()) ByteArray(32) else salt
        mac.init(SecretKeySpec(actualSalt, HMAC_ALGORITHM))
        return mac.doFinal(ikm)
    }

    private fun hkdfExpand(prk: ByteArray, info: ByteArray, length: Int): ByteArray {
        val mac = Mac.getInstance(HMAC_ALGORITHM)
        mac.init(SecretKeySpec(prk, HMAC_ALGORITHM))

        val result = ByteArray(length)
        var previousT = ByteArray(0)
        var offset = 0
        var blockIndex: Byte = 1

        while (offset < length) {
            mac.update(previousT)
            mac.update(info)
            mac.update(blockIndex)
            previousT = mac.doFinal()

            val toCopy = minOf(previousT.size, length - offset)
            System.arraycopy(previousT, 0, result, offset, toCopy)
            offset += toCopy
            blockIndex++
        }
        return result
    }
}
```

---

## 3. AES-GCM-256 Encryption & Decryption

### AAD (Additional Authenticated Data) Binding Rule
To mathematically bind ciphertext to its entity type and ID:
- **Vault Pearls (Logins)**: `aad = "vault_pearls:$pearlId"`
- **Secure Notes**: `aad = "vault_secure_notes:$noteId"`
- **SSH Keys**: `aad = "vault_ssh_keys:$keyId"`
- **Attachments**: `aad = "vault_secure_attachments:$attachmentId"`

### Kotlin Implementation

```kotlin
package com.clawstack.shellguard.crypto

import android.util.Base64
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.nio.charset.StandardCharsets
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

@Serializable
data class ShellCryptionEnvelope(
    val v: Int = 1,
    val alg: String = "AES-GCM-256",
    val iv: String,
    val ct: String,
    val aad: String
)

object ShellCryptionEngine {
    private const val GCM_IV_LENGTH_BYTES = 12
    private const val GCM_TAG_LENGTH_BITS = 128
    private const val CIPHER_TRANSFORMATION = "AES/GCM/NoPadding"
    private val secureRandom = SecureRandom()

    fun encryptField(
        plaintext: String,
        itemKey: SecretKeySpec,
        aad: String
    ): ShellCryptionEnvelope {
        val iv = ByteArray(GCM_IV_LENGTH_BYTES)
        secureRandom.nextBytes(iv)

        val cipher = Cipher.getInstance(CIPHER_TRANSFORMATION)
        val spec = GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv)
        cipher.init(Cipher.ENCRYPT_MODE, itemKey, spec)
        cipher.updateAAD(aad.toByteArray(StandardCharsets.UTF_8))

        val ciphertext = cipher.doFinal(plaintext.toByteArray(StandardCharsets.UTF_8))

        return ShellCryptionEnvelope(
            v = 1,
            alg = "AES-GCM-256",
            iv = Base64.encodeToString(iv, Base64.NO_WRAP),
            ct = Base64.encodeToString(ciphertext, Base64.NO_WRAP),
            aad = aad
        )
    }

    fun decryptField(
        envelope: ShellCryptionEnvelope,
        itemKey: SecretKeySpec,
        expectedAad: String
    ): String {
        require(envelope.aad == expectedAad) {
            "AAD mismatch! Possible ciphertext substitution attack."
        }

        val iv = Base64.decode(envelope.iv, Base64.NO_WRAP)
        val ciphertext = Base64.decode(envelope.ct, Base64.NO_WRAP)

        val cipher = Cipher.getInstance(CIPHER_TRANSFORMATION)
        val spec = GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv)
        cipher.init(Cipher.DECRYPT_MODE, itemKey, spec)
        cipher.updateAAD(envelope.aad.toByteArray(StandardCharsets.UTF_8))

        val plaintextBytes = cipher.doFinal(ciphertext)
        return String(plaintextBytes, StandardCharsets.UTF_8)
    }
}
```

---

## 4. Hardware-Backed Master Key Storage (Android Keystore + Biometrics)

When the user unlocks the vault using their `hu-...` key on Android, they can opt to enable **Biometric Quick Unlock** (Fingerprint / Face ID).

```kotlin
package com.clawstack.shellguard.crypto

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

object AndroidKeystoreManager {
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val MASTER_KEY_ALIAS = "sg_biometric_master_wrapper"

    fun getOrCreateBiometricKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        if (keyStore.containsAlias(MASTER_KEY_ALIAS)) {
            val entry = keyStore.getEntry(MASTER_KEY_ALIAS, null) as KeyStore.SecretKeyEntry
            return entry.secretKey
        }

        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        )

        val spec = KeyGenParameterSpec.Builder(
            MASTER_KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setUserAuthenticationRequired(true) // Enforces Biometric/Device Auth
            .setKeySize(256)
            .build()

        keyGenerator.init(spec)
        return keyGenerator.generateKey()
    }
}
```
