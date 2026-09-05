# 🔐 ShellGuard — Encryption Layers Specification

> **The triple-layer model, server-side metadata encryption & the double-encryption firewall**
> *Pulled into existence by Phase 5. Grows with the walk.*

---

## §1. The Triple-Layer Encryption Model

```mermaid
flowchart TD
    subgraph L1 ["Layer 1 — Client-Side (zero-knowledge)"]
        SC["ShellCryption™<br/>HKDF-SHA256 + AES-GCM-256<br/>envelope {v, alg:'AES-GCM-256', iv, ct, aad}"]
    end
    subgraph L2 ["Layer 2 — Server-Side per-row metadata"]
        FE["fieldEncryption.ts<br/>AES-256-GCM<br/>envelope {v:1, alg:'SG-META', iv, ct}"]
    end
    subgraph L3 ["Layer 3 — At Rest (whole-DB)"]
        SQLC["SQLCipher via better-sqlite3-multiple-ciphers<br/>keyed from DB_ENCRYPTION_KEY"]
    end
    SC -->|"opaque ciphertext stored byte-for-byte"| SQLC
    FE -->|"same TEXT columns, self-describing envelopes"| SQLC
```

| Layer | Governs | Key | Sees plaintext? |
|:---|:---|:---|:---|
| 1. ShellCryption | Secrets (`secret`, `content`, `key_value`, `file_data`, `totp_secret`) | Client-derived from `hu-` | Only the client |
| 2. Field encryption | Metadata (`title`, `username`, `url`, `category`, `notes`, `file_name`) | HKDF from `DB_ENCRYPTION_KEY` | Server, in memory, transiently |
| 3. SQLCipher | Everything on disk | `DB_ENCRYPTION_KEY` | Nobody |

---

## §2. Server-Side Field Encryption (`fieldEncryption.ts`)

- **Key derivation**: `crypto.hkdfSync('sha256', rawKey, 'shellguard-metadata-encryption-v1', 'sg-meta-aes-256-gcm', 32)` — deterministic from `DB_ENCRYPTION_KEY` (base64). The same env var governs layers 2 and 3.
- **Envelope**: self-describing JSON **in the same TEXT column** — no schema migration of column types:
  `{ "v": 1, "alg": "SG-META", "iv": "<b64>", "ct": "<b64>" }` (auth tag appended to `ct`).
- **IV**: 96-bit random per encryption. Empty/falsy strings pass through unencrypted.
- **No-op mode**: without `DB_ENCRYPTION_KEY`, every function is a passthrough — the app runs plaintext (legacy rows decrypt transparently on read).
- **Implementation note**: Node native `crypto` (`createCipheriv`/`hkdfSync`), never `crypto.webcrypto.subtle` (environment compatibility).

---

## §3. The metadataGuard Registry & the Double-Encryption Firewall

`metadataGuard.ts` is the **single registry** of which columns layer 2 may touch:

| Table | Guarded metadata columns |
|:---|:---|
| `vault_pearls` | `title`, `username`, `url`, `category`, `notes` |
| `vault_secure_notes` | `title`, `category` |
| `vault_ssh_keys` | `title`, `username`, `category` |
| `vault_secure_attachments` | `title`, `file_name`, `category` |

**⛔ THE FIREWALL (inviolable):** client-ShellCryption columns — `secret`,
`content`, `key_value`, `file_data`, `totp_secret`, and later
`custom_fields` — are **NEVER registered in metadataGuard**. They are already
zero-knowledge ciphertext; re-encrypting them under `DB_ENCRYPTION_KEY`
would (a) double-encrypt, (b) break the zero-knowledge model, and (c) make
server-side reads impossible to satisfy without the client key.

`prepareWrite(tableName, body, cipher)` encrypts only registered columns;
`prepareRead(tableName, row, cipher)` decrypts only them — legacy plaintext
and empty strings pass through unchanged. Unknown tables are passthrough.

---

## §4. Migration & Tooling

- `migrations/0002_metadata_encryption.{up,down}.sql` — the schema-side accompaniment.
- `scripts/encrypt-existing-metadata.ts` / `scripts/decrypt-existing-metadata.ts` —
  one-shot in-place converters for existing rows (idempotent via envelope detection).
- Migration 0003 in a later phase extends this pattern to custom fields
  (`custom_fields` TEXT column) — which must **stay off the registry**
  (client-encrypted via ShellCryption AAD namespaces).

---
