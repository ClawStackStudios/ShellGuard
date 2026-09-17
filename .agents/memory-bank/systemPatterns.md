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

## Auditability Invariants (Cryptographer's Lens — 2026-09-16)

Established by the bidirectional docs<->code audit (8 lies corrected; docs bow to code). These are standing patterns, verified against code:

- **Three limiters, never conflated**: `authLimiter` 10/15m default (`AUTH_RATE_LIMIT`-tunable, `skipSuccessfulRequests: true`) · `adminAuthLimiter` 5/10m · `apiLimiter` 100/min — in-process (restart resets; multi-instance shares nothing)
- **Five permission masks** (not four): `canRead/canWrite/canEdit/canMove/canDelete` — enumerate the zod schema (`schemas.ts`), never recall; wizard presets READ/WRITE/EDIT/MOVE/ECOSYSTEM/FULL/CUSTOM
- **Rekey = `PRAGMA rekey`** (better-sqlite3-multiple-ciphers), NOT SQLCipher's `sqlcipher_export`
- **Identity file contract**: `shellguard_identity_<username>.json` = `{username, displayName, uuid, token, createdAt}` — per-username filename; never infer shape from redaction lists
- **Custom-field AAD**: `<table>_custom:{id}` (e.g. `vault_pearls_custom:{id}`) — when a crypto claim has no literal code hit, the TEST fixtures are the oracle
- **The claim battery**: grep enforcing code first, assert doc second; every documented invariant must trace to code and a witnessing test (Phase 24 makes it executable)

## The ClawKey Canon & Ecosystem Terminology (2026-09-16)

- **`ClawKey©™`**: The human user's sovereign 67-character `hu-` identity key (and downloaded `shellguard_identity_<username>.json`).
- **`ShellCryption©™`**: The client-side zero-knowledge encryption engine (HKDF + AES-GCM-256) running entirely inside the user's browser.
- **`LobsterKeys`**: Granular, scoped agent API keys (`lb-` prefix) minted for automated AI agent interactions.
- User-facing UI strings across Web and Android companion use verbatim identical terms (`ClawKey™`, `ShellCryption™`, `LobsterKeys`).

## Hash-Only Agent Key Ledger (Phase 17 — 2026-09-13)

- **Migration `0004_key_ledger.sql`**: Completely retired the plaintext `api_key` column from `agent_keys`.
- Stored representations: `key_hash` (SHA-256) and `key_fingerprint` (`lb-***-XXXX`).
- Verification: Constant-time `crypto.timingSafeEqual()` on incoming SHA-256 hash vs stored `key_hash`.
- Minted-once secret delivery: Plaintext `lb-` key is returned exactly once upon creation and never stored or displayed again.
- Card row display: Full key row masking by default (`maskKey()` showing first 6 + •••••••••••• + last 4), Eye toggle, Copy with 2s feedback.

## Brand Asset System & Twin Parity Invariant (2026-09-17)

- **CaraBase Woodcut Engraving Aesthetic**: Mascot and icons adhere to symmetrical crimson carapace with stippled shading, cream highlights, and gold combination dials.
- **Mascot Orientation**: Forward/downward crab gaze clasping the vault safe door with 3D 'S' crest.
- **Web Server Favicon Distinction**: Notched carapace crest shield perimeter with dropped inner arch, enclosing a multi-grid Web Globe themed to the ShellGuard purple/pink palette (`#e4048a`, `#ec4899`, `#c026d3`, `#ffffff`).
- **Asset Twin Parity**: Strict 1:1 mirroring between web app root (`public/`) and documentation portal (`docs/public/assets/`).

## Agent Memory Bank Isolation Invariant (2026-09-17)

- **Strict Boundary**: Antigravity's cognitive memory bank is strictly `.agents/memory-bank/`. Cline's cognitive memory bank is strictly `.clinerules/memory-bank/`.
- **Zero Cross-Mirroring**: Never edit, mirror, stage, or commit files in the other agent's bank directory. Each agent maintains its own dedicated cognitive substrate.
