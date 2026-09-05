# System Patterns — ShellGuard

## Architecture

```
Browser (React) → Express 5 API → SQLite (better-sqlite3-multiple-ciphers)
     ↓                    ↓                    ↓
ShellCryption      Per-Row Encryption     SQLCipher
(client-side)      (server-side)          (whole-DB)
```

## Triple-Layer Encryption Model

| Layer | Scope | Key Source | Algorithm | What It Encrypts |
|---|---|---|---|---|
| ShellCryption | Client-side | `hu-` key via HKDF | AES-GCM-256 | secret, totp_secret, content, key_value, file_data |
| Per-Row Metadata | Server-side | `DB_ENCRYPTION_KEY` via HKDF | AES-256-GCM | title, username, url, category, notes, file_name |
| SQLCipher | Whole-DB | `DB_ENCRYPTION_KEY` | AES-256 | Entire SQLite file |

## Key System

| Prefix | Type | Purpose |
|---|---|---|
| `hu-` | Human Identity Key | One-field login + ShellCryption seed. SHA-256 hash stored server-side only. |
| `lb-` | Lobster/Agent Key | Scoped automated access. Granular permissions, expiry, rate limits. |
| `api-` | Session Token | Short-lived bearer (default 24h TTL). |

## Request Pipeline

Every mutation follows this gauntlet (no shortcuts):
1. ShellCryption encrypts fields client-side
2. RestAdapter adds Bearer token, sends request
3. Middleware chain: TRUST_PROXY → httpsRedirect → helmet → cors → body-parser → rate-limiter → requireAuth → requirePermission → validateBody
4. Route handler: ownership-scoped SQL → audit.log() → {success, data} response
5. Per-row encryption: prepareWrite encrypts metadata before INSERT/UPDATE, prepareRead decrypts on SELECT

## Design Patterns

- **In-place encryption**: Encrypted JSON envelopes stored in same TEXT columns as plaintext. No schema changes.
- **Backward compatibility**: `isEncryptedField()` check — non-SG-META values pass through unchanged.
- **WebCrypto Fallback Pattern**: `window.crypto.subtle` is undefined on plain HTTP browser origins. `src/lib/webCryptoFallback.ts` provides pure TypeScript fallback implementations (SHA-256, HMAC-SHA256, HKDF, AES-GCM-256) that transparently replace crypto.subtle methods when unavailable.
- **Blob download pattern**: Replace `data:` URI links with `Blob` + `URL.createObjectURL(blob)` to avoid Chromium insecure-connection download blocks on HTTP LAN.
- **UUID entropy fallback**: Multi-tier RFC 4122 v4 UUID generation for environments where `crypto.randomUUID` is unavailable.
- **Singleton cipher**: `fieldCipher` initialized once at startup, null when `DB_ENCRYPTION_KEY` unset.
- **Ownership scoping**: Every query filters `owner_uuid`. Missing scope = security bug.
- **Reference-model attachments**: pearls link files via a JSON ID array in `attachments`; each file lives in its own `vault_secure_attachments` row (ShellCrypted file_data, per-row encrypted metadata). Pearl DELETE cascade-deletes linked attachments with ownership scope.
- **SuperLobster admin plane**: separate cookie-session auth (`sg_admin_session`, volatile in-memory store) — never the user Bearer restAdapter. Strict-metadata user list, whitelist settings, server-side-only backups. Admin actor sentinel: `SUPERLOBSTER`.
- **Online Backup API backups**: `db.backup()` from better-sqlite3-multiple-ciphers — WAL-safe, live-consistent; SQLCipher copies stay encrypted with the same key.
- **Audit on mutation**: Every write emits to segregated `audit.sqlite` with extended redaction.
- **Envelope contract**: All responses use `{success, data}`. RestAdapter unwraps centrally.

## Critical Implementation Paths

- `src/server/utils/fieldEncryption.ts` — Core crypto: HKDF + AES-256-GCM, singleton fieldCipher
- `src/server/utils/metadataGuard.ts` — Column registry + prepareWrite/prepareRead helpers
- `src/lib/shellCryption.ts` — Client-side HKDF + AES-GCM-256
- `src/server/middleware/auth.ts` — requireAuth, requirePermission, requireHuman
- `server.ts` — Express 5 entrypoint, exports `app` for test seam
