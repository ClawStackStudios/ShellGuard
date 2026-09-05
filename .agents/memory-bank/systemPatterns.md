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
- **Singleton cipher**: `fieldCipher` initialized once at startup, null when `DB_ENCRYPTION_KEY` unset.
- **Ownership scoping**: Every query filters `owner_uuid`. Missing scope = security bug.
- **Reference-model attachments**: pearls link files via a JSON ID array in `attachments`; each file lives in its own `vault_secure_attachments` row (ShellCrypted file_data, per-row encrypted metadata). Pearl DELETE cascade-deletes linked attachments with ownership scope.
- **SuperLobster admin plane**: separate cookie-session auth (`sg_admin_session`, volatile in-memory store) — never the user Bearer restAdapter. Strict-metadata user list, whitelist settings, server-side-only backups. Admin actor sentinel: `SUPERLOBSTER`.
- **Online Backup API backups**: `db.backup()` from better-sqlite3-multiple-ciphers — WAL-safe, live-consistent; SQLCipher copies stay encrypted with the same key.
- **User-Driven Pods & Hierarchical Categories**: Pods are 100% user-created paths (e.g. `Work/Finance`), with zero hardcoded defaults. Normalization cleans leading/trailing/multiple slashes. Sub-pod queries match parent prefixes (`targetPod + "/"`). Local color assignments persist in `localStorage`. Mutations use optimistic local React updates, batched async PUTs with `skipScuttle=true`, and single terminal reconciliation via `scuttleVault()`. Deleted pods cascade member items to uncategorized (`""`).
- **Unified Item Composition (Bitwarden Model)**: Vault items are rich, primary records (logins with embedded usernames, passwords, URIs, rich notes, TOTP seeds, and attached files). Child attachments belong to parent items and do not inflate Pod top-level item counts.
- **Bitwarden-Style Custom Fields**: JSON array encrypted client-side with AES-256-GCM under item-scoped AAD namespaces (`vault_pearls_custom:{id}`, `vault_secure_notes_custom:{id}`, `vault_ssh_keys_custom:{id}`). Omitted from server `metadataGuard.ts` to prevent double-encryption under `DB_ENCRYPTION_KEY`. Supports `Text`, `Hidden` (masked with reveal), `Checkbox` (boolean), and dynamic `Linked` properties (resolved at render time from core item properties).
- **Modal Form UX & Internal Element Scrolling**: Dialogs with rich multi-field forms lock the outer backdrop (`overflow-hidden`) while the dialog card takes fixed viewport height (`h-[90vh] md:h-[85vh]` with `max-w-3xl`) with a pinned header (title/icon/close), pinned footer (actions), and internal element scrolling (`flex-1 overflow-y-auto custom-scrollbar`). Secondary action menus near the modal bottom expand upward (`bottom-full mb-2`) with click-outside dismissal backdrops.
- **Antigravity Customization Architecture (`.agents/`)**: Rigorous segregation dividing operational behavioral invariants (`rules/`), on-demand procedural capabilities with YAML frontmatter (`skills/`, e.g. `skills/ui-webdev/SKILL.md`), standardized document scaffolds and ASCII art (`templates/`, e.g. `release-template.md`), and interactive slash commands (`workflows/`, e.g. `draft-release.md`, `version-update.md`).
- **Automated Claurst-Style Release Pipeline**: GitHub Actions (`.github/workflows/release.yml`) parses `--release vX.Y.Z.N` from commit messages on push to `main` (or tag push `v*`), automatically creates the remote tag, locates `RELEASE-vX.Y.Z.N.md`, publishes the GitHub Release, and triggers multi-arch Docker image builds.
- **Cross-Platform Native Android Client Ecosystem**: Pure Kotlin + Jetpack Compose + Room DAO + Biometric Android KeyStore clients interoperate seamlessly with the backend REST API, utilizing the exact same `ShellCryption` HKDF + AES-GCM-256 envelope spec.
- **Cross-Ecosystem One-Way Mirror Sync (`sgtotp.bak`)**: Web vault is the upstream authority. Native Android companion app mirrors remote TOTP pearls downstream (`GET /api/vault`) into a read-only group, while local codes created on-device are isolated (`isLocalOnly = true`). The Android app exports local codes via `sgtotp.bak` (encrypted via HKDF + AES-GCM-256 with AAD `totp_backup:{ownerUuid}` and SHA-256 checksum). The web client decrypts this format client-side, normalizes Base32 seeds, maps fresh UUIDs and pods, and commits to `vault_pearls` which then mirror downstream.
- **Audit on mutation**: Every write emits to segregated `audit.sqlite` with extended redaction.
- **Envelope contract**: All responses use `{success, data}`. RestAdapter unwraps centrally.

## Critical Implementation Paths

- `src/server/utils/fieldEncryption.ts` — Core crypto: HKDF + AES-256-GCM, singleton fieldCipher
- `src/server/utils/metadataGuard.ts` — Column registry + prepareWrite/prepareRead helpers
- `src/lib/shellCryption.ts` — Client-side HKDF + AES-GCM-256
- `src/lib/sgtotpBackup.ts` — Android `sgtotp.bak` format sniffer, HKDF/AES-GCM client decryptor, AAD + checksum verification
- `src/server/middleware/auth.ts` — requireAuth, requirePermission, requireHuman
- `server.ts` — Express 5 entrypoint, exports `app` for test seam
