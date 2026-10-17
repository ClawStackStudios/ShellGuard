# ⏱️ ShellGuard Android — TOTP Engine & Authenticator Protocol

> **RFC 6238 COMPLIANT TOTP GENERATOR & AUTHENTICATOR APP SPECIFICATION**
> *Details the cryptographic TOTP algorithm, Base32 decoding, live countdown StateFlow, and synchronization between Vault and standalone Authenticator.*

---

## 1. RFC 6238 TOTP Computation Engine

```kotlin
package com.clawstack.shellguard.totp

import java.nio.ByteBuffer
import java.security.GeneralSecurityException
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.math.pow

object TotpEngine {
    private const val DEFAULT_TIME_STEP_SECONDS = 30L
    private const val DEFAULT_DIGITS = 6

    enum class Algorithm(val hmacName: String) {
        SHA1("HmacSHA1"),
        SHA256("HmacSHA256"),
        SHA512("HmacSHA512")
    }

    /**
     * Generates a dynamic TOTP code from a secret key.
     */
    fun generateTotp(
        secretBase32: String,
        timestampMillis: Long = System.currentTimeMillis(),
        timeStepSeconds: Long = DEFAULT_TIME_STEP_SECONDS,
        digits: Int = DEFAULT_DIGITS,
        algorithm: Algorithm = Algorithm.SHA1
    ): String {
        val cleanSecret = secretBase32.replace(" ", "").uppercase()
        val keyBytes = Base32Decoder.decode(cleanSecret)
        val timeWindow = timestampMillis / 1000L / timeStepSeconds

        val counterBytes = ByteBuffer.allocate(8).putLong(timeWindow).array()

        val mac = Mac.getInstance(algorithm.hmacName)
        mac.init(SecretKeySpec(keyBytes, algorithm.hmacName))
        val hash = mac.doFinal(counterBytes)

        // Dynamic truncation (RFC 4226)
        val offset = hash[hash.size - 1].toInt() and 0x0F
        val binary = ((hash[offset].toInt() and 0x7F) shl 24) or
                ((hash[offset + 1].toInt() and 0xFF) shl 16) or
                ((hash[offset + 2].toInt() and 0xFF) shl 8) or
                (hash[offset + 3].toInt() and 0xFF)

        val otp = binary % (10.0.pow(digits.toDouble())).toInt()
        return otp.toString().padStart(digits, '0')
    }

    /**
     * Returns remaining seconds in the current 30-second window (0 to 30)
     */
    fun getRemainingSeconds(
        timestampMillis: Long = System.currentTimeMillis(),
        timeStepSeconds: Long = DEFAULT_TIME_STEP_SECONDS
    ): Int {
        val currentSecond = (timestampMillis / 1000L) % timeStepSeconds
        return (timeStepSeconds - currentSecond).toInt()
    }
}
```

---

## 2. Base32 Decoder (RFC 4648)

```kotlin
package com.clawstack.shellguard.totp

object Base32Decoder {
    private const val ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

    fun decode(base32: String): ByteArray {
        val clean = base32.trim().replace("=", "").uppercase()
        var buffer = 0
        var bitsLeft = 0
        val output = mutableListOf<Byte>()

        for (char in clean) {
            val charValue = ALPHABET.indexOf(char)
            if (charValue < 0) continue // Skip invalid/whitespace

            buffer = (buffer shl 5) or charValue
            bitsLeft += 5

            if (bitsLeft >= 8) {
                output.add(((buffer shr (bitsLeft - 8)) and 0xFF).toByte())
                bitsLeft -= 8
            }
        }
        return output.toByteArray()
    }
}
```

---

## 3. Authenticator App Sync Protocol

For the dedicated **ShellGuard Authenticator** Android application:
1. **Targeted TOTP Sync Endpoint**: The Authenticator app connects using a read-only `lb-` key or user `hu-` key scoped exclusively to login entries that have non-null `totp_secret`.
2. **Local Decryption & KeyStore**: When synced, decrypted TOTP seeds are stored exclusively in the device's SQLCipher-encrypted Room database using a hardware-backed AES key from the Android KeyStore.
3. **Zero Network Exposure on Code Generation**: Code computation happens 100% locally and offline on device.
