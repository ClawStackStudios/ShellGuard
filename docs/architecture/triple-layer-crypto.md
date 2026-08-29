# Triple-Layer Encryption Architecture

<CopyPage />

ShellGuard provides **defense-in-depth** by enforcing three separate, mathematically decoupled layers of cryptographic protection.

---

## 🔐 Layer 1: Zero-Knowledge ShellCryption©™ (Client-Side)

- **Execution**: Runs 100% inside the user's web browser using the Web Crypto API.
- **Key Derivation**: `HKDF-SHA-256(ikm: huKey, salt: itemUuid, info: "shellguard-vault-item-v1")` &rarr; 256-bit AES-GCM CryptoKey.
- **Cipher**: AES-GCM-256 with random 96-bit IV and Additional Authenticated Data (AAD) bound to the item's UUID.
- **Encrypted Fields**:
  - `secret` (Password)
  - `totp_secret` (TOTP seed)
  - `content` (Secure note Markdown)
  - `key_value` (SSH Private/Public Key)
  - `file_data` (Base64 file payload up to 10 MB)
- **Zero-Knowledge Guarantee**: The server stores only `{ v, alg, iv, ct, aad }` blobs and CANNOT decrypt them under any circumstance.

---

## 🔒 Layer 2: Per-Row Metadata Encryption©™ (Server-Side)

- **Execution**: Runs in Node.js within Express middleware before SQL execution.
- **Key Derivation**: `HKDF-SHA-256(ikm: DB_ENCRYPTION_KEY, salt: itemUuid, info: "shellguard-metadata-v1")` &rarr; 256-bit AES-256-GCM key.
- **Encrypted Fields**: `title`, `username`, `url`, `category`, `notes`, `file_name`.
- **Payload Format**: `SG-META:v1:<iv_b64>:<tag_b64>:<ct_b64>`
- **Why this exists**: In a secrets vault, metadata like `"My Bank"` or `"root@bastion.internal"` is security intelligence. Layer 2 shields this metadata on disk while allowing authorized API responses to echo plaintext metadata to clients and AI agents.

---

## 🛡️ Layer 3: SQLCipher Whole-Database Encryption (At-Rest Bedrock)

- **Execution**: Implemented at the SQLite C-driver level via `better-sqlite3-multiple-ciphers`.
- **Keying**: When `DB_ENCRYPTION_KEY` is provided, `PRAGMA key = '...'` encrypts every SQLite database page on disk.
- **Protection**: Defends against raw disk theft, offline filesystem scans, and unauthenticated physical access.

---

## Summary Matrix

| Property | Layer 1 (ShellCryption) | Layer 2 (Metadata Encryption) | Layer 3 (SQLCipher) |
|---|---|---|---|
| **Location** | Browser (Client) | Express API (Server) | SQLite Engine (Disk) |
| **Key Source** | User's `hu-` Key | `DB_ENCRYPTION_KEY` | `DB_ENCRYPTION_KEY` |
| **Scope** | Passwords, TOTP, Files, Notes | Titles, Usernames, URLs | All `.sqlite` database pages |
| **Server Trust** | **Zero trust** (Server never sees keys) | Server decrypts in RAM for authorized sessions | Transparent disk I/O |
