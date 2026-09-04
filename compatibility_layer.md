# ShellGuard TOTP Compatibility Layer: `sgtotp.bak` Unified Format

This document outlines the standard 2-way import/export format to maintain seamless interoperability between the ShellGuard Web Server and the ShellGuard-TOTP Android application.

## Architectural Paradigm: One-Way Sync & Isolated Local Vault

To eliminate complexity and cognitive load, we adhere to the **One-Way Mirror Sync** architecture:
1. **Remote Connection**: The Android app acts as a read-only mirror for the web server's vault. It pulls `vault_pearls` (where `totp_secret` is present) down to the Android app and displays them in a distinct "☁️ Synced from ShellGuard" dashboard group.
2. **Local Creation**: Any new TOTP secrets added directly inside the Android app are designated as strictly **Local Codes** (`isLocalOnly = true`). They are never pushed upstream.
3. **Unified Exports**: Only Local Codes are exported into the `sgtotp.bak` backup files. Remote codes are skipped to avoid duplication.

## Data Interoperability: `sgtotp.bak`

Because the Android app only exports Local codes, the `sgtotp.bak` format is now the canonical 2FA export format. The Web Server must be capable of directly importing this format, translating the TOTP items into fully-fledged `vault_pearls`.

### Plaintext JSON Structure (`shellguard-totp-plain-export-v1`)

When exported unencrypted, the format follows this schema:

```json
{
  "version": 1,
  "format": "shellguard-totp-plain-export-v1",
  "createdAt": 1725243851000,
  "itemCount": 1,
  "checksumSha256": "abcdef...",
  "items": [
    {
      "id": "uuid-string",
      "ownerUuid": "local",
      "title": "GitHub",
      "username": "lucas@example.com",
      "category": "Development",
      "secret": "JBSWY3DPEHPK3PXP",
      "algorithm": "SHA1",
      "digits": 6,
      "period": 30,
      "isLocalOnly": true,
      "syncState": "LOCAL",
      "remoteUpdatedAt": null,
      "localUpdatedAt": 1725243851000
    }
  ]
}
```

### Encrypted Envelope (`sgtotp.bak` / `shellguard-totp-backup-v1`)

When exported encrypted, the file wraps the serialized `items` array above using the standard `ShellCryptionEngine` (HKDF-SHA256 + AES-GCM-256):

```json
{
  "version": 1,
  "type": "shellguard-totp-backup-v1",
  "format": "sgtotp.bak",
  "protectionMode": "PIN",
  "isBiometricEnabled": false,
  "pinLength": 6,
  "createdAt": 1725243851000,
  "ownerUuid": "local",
  "itemCount": 1,
  "checksumSha256": "abcdef...",
  "encryptedEnvelopeJson": "v1:aes-gcm:iv:ciphertext:tag"
}
```

### Web Server Import Behavior

When a user imports an `sgtotp.bak` into the ShellGuard Web Application:
1. **Decrypt** the envelope using the user's `hu-` key (or prompt for the PIN used to export).
2. **Parse** the JSON array of `BackupItemDto`.
3. **Map** each item to a new `vault_pearl` record:
   - `title` -> `title`
   - `username` -> `username`
   - `category` -> `category`
   - `totp_secret` -> Ensure the Base32 `secret` is packed into the standard web TOTP envelope, then encrypted via the web's `ShellCryptionEngine` using the user's web `shellKey` and `vault_pearls_totp:{id}` AAD.
4. **Insert** the records. On the next Android sync cycle, these new items will securely mirror back down to the Android app within the "☁️ Synced from ShellGuard" group!
