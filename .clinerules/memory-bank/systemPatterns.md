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
- **Tag metadata encryption**: Tag payloads (`tags TEXT` on `vault_pearls`, `vault_secure_notes`, `vault_ssh_keys`) are registered in `metadataGuard.ts` for Layer 2 per-row AES-256-GCM encryption — same envelope as title/username, distinct from ShellCryption's client-side field encryption.
- **Server-side tag intersection filtering**: `?tags=a,b` performs set intersection at the SQL layer (all tags must match); AND/OR logic resolved client-side in `ItemListPane.tsx`; ownership scoping applied before tag filtering.
- **Unified color engine**: `hashStringToColor` in `podUtils.ts` generates deterministic HSL colors for pods AND tags with explicit user overrides; `typeof localStorage === 'undefined'` guards keep it headless-safe in Node test environments.
- **SSH dual-key serialization**: `parseSshKeySecret`/`serializeSshKeySecret` envelope handles both legacy raw PEM `{publicKey, privateKey}` JSON and clean RFC 7468 PKCS#8; backward compat detects shape on read.
- **Attachment streaming (Phase 19 tightened in Phase 20)**: 500MB per-file ceiling (`ATTACHMENT_MAX_MB`) + 1000MB per-owner grotto quota (`GROTTO_QUOTA_MB`); Busboy mid-stream 413 abort; 1MB chunked `substr()` downloads; write path peaks at ciphertext size (no `openBlob()`).
- **Bulk operations with per-record partial failure (Phase 21)**: validate the *container* (`items: 1..1000`) in middleware, then `VaultSchemas.bulkImportItem.safeParse()` **per record inside the route** — failures aggregate into `errors: [{ index, reason }]` (field-qualified) while valid records persist in a single `db.transaction()`. Declining middleware-level item typing is deliberate: `validateBody` would reject the entire payload with 400 and make 207 impossible.
- **207 Multi-Status envelope**: partial success still returns `{ success: true, data: { inserted: string[], errors: [...] } }` — errors MUST live inside `data` because `restAdapter` unwraps `{success, data}` → `data` and treats every 2xx as success. Bulk delete mirrors it with `{ deleted: string[], errors: [{ id, reason }] }`.
- **Literal-path route ordering invariant**: bulk/literal routes (`/bulk-import`, `/bulk`) MUST register ABOVE parameterized `/:id` siblings — otherwise Express captures the literal as the param value (`id="bulk"`) and 404s. This was a shipped P0 in Phase 21.
- **Scoped body parser pattern**: `app.use('/api/vault/bulk-import', express.json({ limit: '10mb' }))` mounted BEFORE the global 1MB parser — the first parser consumes JSON and the global one no-ops, so one route gets headroom without weakening the global ceiling.
- **Bitwarden ingestion mapping (Phase 21 sub-phase)**: `src/lib/bitwarden.ts` sniffs JSON vs CSV, resolves folders to pods via `normalizePod()` (folderId→name map), maps custom fields by Bitwarden type (0 text / 1 hidden / 2 boolean / 3 linked), serializes compound SSH keypairs through `serializeSshKeySecret()`, and extracts `otpauth://` TOTP params. Encrypted exports (`encrypted === true` or ciphertext beginning `2.`) are **detected and refused with guidance**, never imported.
- **Dynamic TOTP contract (Phase 21 sub-phase)**: `src/lib/totpUtils.ts` is the single parser/formatter/generator for RFC 6238 — algorithm (SHA1/256/512), digits (6/8), and period (15/30/60/custom) flow through `otpauth://` URIs with raw-Base32 backward compatibility. Invalid (non-Base32) secrets return `null` rather than a garbage config.
- **Envelope v1 with persisted KDF parameters (Phase 21 sub-phase)**: the encrypted backup envelope carries `v`, `version`, `kdf`, and `kdfIterations`, so the reader honors whatever the writer used — iteration-count bumps stay backward-compatible. GCM salt (16B) / IV (12B) are **fail-closed**: the export throws if `crypto.getRandomValues` is absent rather than degrading a nonce.
- **Dual-path key derivation (Phase 21 sub-phase)**: `deriveKeyForEnvelope` in `src/lib/vaultExport.ts` selects native `crypto.subtle.deriveBits` on secure origins and pure-TS `pbkdf2Sha256` on plain-HTTP LAN; HKDF serves the 256-bit ClawKey, PBKDF2-SHA256 @600k serves human passphrases. **This makes the two implementations a portability contract** — they must derive identical bytes or backups seal on one origin and fail to open on the other.

## Critical Implementation Paths

- `src/server/utils/fieldEncryption.ts` — Core crypto: HKDF + AES-256-GCM, singleton fieldCipher
- `src/server/utils/metadataGuard.ts` — Column registry + prepareWrite/prepareRead helpers
- `src/lib/shellCryption.ts` — Client-side HKDF + AES-GCM-256
- `src/server/middleware/auth.ts` — requireAuth, requirePermission, requireHuman
- `server.ts` — Express 5 entrypoint, exports `app` for test seam
- `src/lib/podUtils.ts` — Unified color engine (`hashStringToColor`) for pods + tags (Phase 20)
- `src/lib/tagUtils.ts` — Client-side tag utilities (`TagSelectorInput` autocomplete chips, color picker integration)
- `src/server/utils/tagUtils.ts` — Server-side tag filtering (`?tags=a,b` intersection, SQL-layer scoping)
- `src/lib/keyGen.ts` — SSH dual-key serialization envelope (`parseSshKeySecret`/`serializeSshKeySecret`) with backward compat (Phase 20)
- `src/server/routes/vault.ts` — `POST /bulk-import` + `DELETE /bulk` (Phase 21; registered ABOVE `/:id`)
- `src/server/validation/schemas.ts` — `VaultSchemas.bulkImport` (container) + `bulkImportItem` (per-record) + `bulkDelete`
- `src/components/Vault/VaultShell.tsx` — tri-state selection state + floating bulk action bar (Phase 21)
- `src/lib/bitwarden.ts` — Bitwarden JSON/CSV ingestion engine (Phase 21 sub-phase)
- `src/lib/totpUtils.ts` — dynamic RFC 6238 TOTP parse/format/generate (Phase 21 sub-phase)
- `src/lib/vaultExport.ts` — encrypted backup envelope v1 + branched KDF + RFC 4180 CSV export (Phase 21 sub-phase)

## Auditability Invariants (Cryptographer's Lens — 2026-09-16)

Established by the bidirectional docs<->code audit (8 lies corrected; docs bow to code). These are standing patterns, verified against code:

- **Three limiters, never conflated**: `authLimiter` 10/15m default (`AUTH_RATE_LIMIT`-tunable, `skipSuccessfulRequests: true`) · `adminAuthLimiter` 5/10m · `apiLimiter` 100/min — in-process (restart resets; multi-instance shares nothing)
- **Five permission masks** (not four): `canRead/canWrite/canEdit/canMove/canDelete` — enumerate the zod schema (`schemas.ts`), never recall; wizard presets READ/WRITE/EDIT/MOVE/ECOSYSTEM/FULL/CUSTOM
- **Rekey = `PRAGMA rekey`** (better-sqlite3-multiple-ciphers), NOT SQLCipher's `sqlcipher_export`
- **Identity file contract**: `shellguard_identity_<username>.json` = `{username, displayName, uuid, token, createdAt}` — per-username filename; never infer shape from redaction lists
- **Custom-field AAD**: `<table>_custom:{id}` (e.g. `vault_pearls_custom:{id}`) — when a crypto claim has no literal code hit, the TEST fixtures are the oracle
- **The claim battery**: grep enforcing code first, assert doc second; every documented invariant must trace to code and a witnessing test (Phase 24 makes it executable)
