# 🦞 SuperLobster Panel — ShellGuard Instance Management

> The admin control plane for ShellGuard instances. Clean-room design derived from the Vaultwarden admin panel model, adapted through ClawChives' SuperAdmin architecture, and hardened for a zero-knowledge secrets vault.
>
> Maintained by CrustAgent©™

---

## 1. Design Lineage

| Project | Admin Panel | Key Properties |
|---|---|---|
| **Vaultwarden** | `/admin` | `ADMIN_TOKEN` auth (Argon2id PHC option), 20-min sessions, Users/Orgs/Diagnostics/Settings, backup via Online Backup API, restore by offline file swap |
| **ClawChives** | `/admin` (SuperAdmin) | `ADMIN_TOKEN` auth (SHA-256 + constant-time), volatile in-memory sessions (no JWT), React UI via `react-router-dom`, metadata-only user list, cascade user delete |
| **ShellGuard** | `/superlobster` (**SuperLobster Panel**) | ClawChives session model + Vaultwarden backup model, plus secrets-aware hardening: strict-metadata-only user list, no download surface, no HTTP restore endpoint |

### Why this model (and not Vaultwarden's full config editor)

Vaultwarden gave its admin panel full config-editing power because container operators often lack shell access. ShellGuard's delta: our database file contains **plaintext session tokens and Lobster Keys** (server-side secrets), so an admin-mediated backup-download channel would be a credential-exfiltration affordance. All backup writes are server-side; restore stays offline (Vaultwarden's own practice — it never shipped in-panel restore either).

### The Vaultwarden model we deliberately *don't* copy

- ❌ Full Settings editor (`POST /admin/config`) — crypto config editing = mass data-loss path (T5)
- ❌ Admin-mediated backup download — plaintext credential exfiltration surface
- ❌ In-panel restore — Vaultwarden itself never shipped it

---

## 2. Threat Model

### Actors

| Actor | Capability | Trust |
|---|---|---|
| Instance operator | Holds `ADMIN_TOKEN` + `DB_ENCRYPTION_KEY` + shell access | Self-hosting owner — ultimate trust by design |
| Malicious admin (token-leaked) | Can list/delete users, trigger backups (server-side), read diagnostics | Mitigated: strict metadata, audit trail, no crypto access |
| Malicious restore | Offline — requires shell access to swap files | Correct trust tier |
| XSS in vault app | XSS leaks `shellKey` (total user vault compromise); admin cookie has `SameSite=Strict` + `httpOnly` | Admin-plane escalation is marginal (vault already lost) |

### Threat Table

| ID | Threat | Mitigation |
|---|---|---|
| **T1** | Admin token brute-force | Dedicated stricter rate limiter on `/api/admin/auth`; constant-time compare; SHA-256 hashed comparison; **no token = no panel** (503, routes inert) |
| **T2** | Admin session theft | Volatile in-memory session store (ClawChives pattern), 20-min sliding expiry, `httpOnly` + `Secure` + `SameSite=Strict` cookie (`sg_admin_session`), separate namespace from user sessions |
| **T3** | Metadata inference ("My Bank" reveals banking) | **Strict-metadata only**: uuid, username, displayName, created_at, item counts by type, active key count, last login. No titles, categories, URLs, file names, or notes anywhere in admin responses |
| **T4** | Nuclear user deletion | Type-to-confirm modal (must type username); server-side `expect` param double-check; `ADMIN_USER_DELETED` audit event with before-counts; explicit warning: unrecoverable |
| **T5** | Crypto config editing via UI | **Panel is read-only except a whitelist** (retention days + backup settings). `DB_ENCRYPTION_KEY`, `ADMIN_TOKEN`, TTLs never editable |
| **T6** | Backup download exfiltration | No download endpoint. Backups written server-side to `DATA_DIR/backups/` only |
| **T7** | Restore abuse (rollback, evidence erasure) | Restore is offline (shell trust tier). `audit.sqlite` never swapped (append-only reef) |
| **T8** | Audit evasion | Every admin mutation logged with actor sentinel `SUPERLOBSTER`, IP, UA, target uuid, outcome |
| **T9** | Panel discovery via nav links | Zero-discovery stance: URL-only entry, no UI links in user interface |

### Trust Architecture — the Three Secrets

| Secret | Purpose | Storage |
|---|---|---|
| `ADMIN_TOKEN` | Opens the SuperLobster panel only. **Never decrypts anything.** | env var |
| `DB_ENCRYPTION_KEY` | Opens the database file (SQLCipher) + per-row metadata encryption | env var; operator tucks away safely |
| `hu-` key (per user) | Identity + decrypts user secrets | User's Vault Access File; lose it = lose that user's vault |

---

## 3. Feature Scope

### 3.1 SuperLobster Panel — `/superlobster` (URL-only entry, no UI links)

| Section | Contents |
|---|---|
| **Login** | `ADMIN_TOKEN` input → session cookie. If `ADMIN_TOKEN` unset → 503 |
| **Reef Status** | Version, mode, encryption flags, DB type, port, retention (read-only), uptime history, recent security events |
| **Transport & Pairing** | Real-time TLS status, SHA-256 fingerprint, zero-downtime cert regeneration (`setSecureContext`), Reef Handshake QR pairing card, and Decoupled Share Signups engine |
| **Lobsters Overview** | Strict-metadata user table + cascade delete with type-to-confirm |
| **System Settings** | Editable whitelist: retention days, backup toggle/interval/retention, `allow_signups` toggle. Everything else read-only |
| **Backups** | Toggle On/Off, schedule + retention config, "Back up now" one-shot (returns path). **No download** |
| **Audit Reef Viewer** | Filtered recent admin/security events |

### 3.2 Backup System (Tier 2 — Instance Failsafe)

- Trigger: admin toggle → scheduler (existing `setInterval` pattern) + "Back up now" one-shot
- Method: `db.backup()` — SQLite Online Backup API (WAL-safe). Both `db.sqlite` and `audit.sqlite`
- Encryption: inherits SQLCipher automatically (copy of encrypted file stays encrypted)
- Location: `DATA_DIR/backups/`, timestamped + `manifest.json` (timestamp, version, key note, SHA-256)
- Rotation: keep last N (default 7)

### 3.3 Restore (Offline — Vaultwarden-style)

**No HTTP restore endpoint.** Stop → place file in `DATA_DIR` → set `DB_ENCRYPTION_KEY` → start. `scuttle:restore` helper validates (file opens with key, schema check) and prints instructions; never auto-swaps. WAL hygiene documented. `audit.sqlite` survives restores.

### 3.4 User Export/Import (Tier 1 — Recovery & Sync)

`ImportExportView.tsx`: CSV metadata export + hu-key-gated decrypted/encrypted JSON export/import, plus native `sgtotp.bak` backup container import from the [ShellGuard-TOTP](https://github.com/ClawStackStudios/ShellGuard-TOTP) Android companion. Primary user-level recovery and offline sync path.

### 3.5 Transport Control Plane & Share Signups (Tier 3 — Transport Armor & Onboarding)

`TlsManagementTab.tsx`:
- **Native TLS 1.3 Engine**: Built-in 10-year EC P-256 self-signed leaf certificate with local IP SAN reflection and zero-downtime socket hot-reloading (`server.setSecureContext`).
- **Immutable Instance Root Key**: `DATA_DIR/instance.key` with `0o600` permissions. Permanently anchors host identity and signs rotation manifests (`manifest.json`) via ECDSA-SHA256.
- **The Reef Handshake**: Dynamic vector QR pairing card embedding `shellguard://pair` URI for zero-touch mobile client onboarding.
- **Decoupled Share Signups**: Admin mints single-use invite tokens (`inv_<32 chars>`) with configurable TTLs (1h, 6h, 24h, 7d). Reuses `api_tokens` table (`owner_type = 'invite'`). Atomic single-use burn inside registration transaction (`DELETE` + `INSERT`).
- **Genesis User #1 Immunity**: When `SELECT COUNT(*) FROM lobsters === 0`, registration is unconditionally open, preventing instance lockout on initial setup.
- **Address Bar Scrubber**: Client shell purges `?invite=...` via `window.history.replaceState` immediately upon mounting.

---

## 4. Residual Risks (Accepted)

1. Rollback inherently resurrects old state — loud audit + manifest age display
2. Same-origin XSS escalation — marginal over existing total-compromise posture
3. Restore disconnects live users — inherent, documented
4. `ADMIN_TOKEN` single gate credential — Argon2id documented as upgrade path
5. Backup on unencrypted instance is plaintext — panel warns when encryption is OFF

## 5. Restoring a Backup (Operator Procedure)

1. Stop the ShellGuard container/process (`npm run scuttle:stop` or `docker stop`)
2. Delete any stale `db.sqlite-wal` / `db.sqlite-shm` files in `DATA_DIR` (WAL hygiene)
3. Copy the chosen `backups/db-*.sqlite` into `DATA_DIR/db.sqlite` (and `audit-*.sqlite` → `audit.sqlite` if you also want the historical audit reef — optional, the live reef is never auto-swapped)
4. Ensure `DB_ENCRYPTION_KEY` env matches the key in force **when the backup was taken**
5. Start the instance. Users log in with their own `hu-` keys — no re-registration needed.

To validate a backup before restoring: `npm run scuttle:restore -- --file backups/db-....sqlite --key <DB_ENCRYPTION_KEY>` (read-only check + instructions; never auto-swaps).

