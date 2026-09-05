# 🛡️ ShellGuard©™ Blueprint

> Schema v1 and topology truth for the post-migration architecture. The authoritative DDL lives in [`migrations/`](./migrations/) (`0001_initial.up.sql`, `0002_metadata_encryption.up.sql`, `0003_custom_fields.up.sql`) — this document is the map, not the territory.

## 🏛️ Construction Map (ASCII)

```text
┌──────────────────────────┐         ┌─────────────────────────────────────┐
│  [ CLIENT — BROWSER ]    │         │  [ CARAPACE GATEWAY — Express 5 ]   │
│                          │         │                                     │
│  Reef Modernist UI       │  HTTPS  │  helmet → cors → zod → rate limits  │
│        │                 │  Bearer │        │                            │
│  ShellCryption©™         │ api-*   │        ▼                            │
│  HKDF(hu-) → AES-GCM-256 │ ──────► │  [ VAULT CORE — route handlers ]    │
│  {v, alg, iv, ct, aad}   │         │    │              │                 │
│        │                 │         │    ▼              ▼                 │
│  sessionStorage          │         │  [ SQLITE BEDROCK ] [ AUDIT REEF ]  │
│  sg_api_token            │         │   db.sqlite          audit.sqlite  │
└──────────────────────────┘         └─────────────────────────────────────┘
        ▲                                          ▲
        │                                          │
  [ CLAWKEYS©™ ]                        [ SQLCipher (optional) ]
  hu- / lb- / api-                      DB_ENCRYPTION_KEY encrypts
  identity + agent scoping              whole-DB at rest; warns-not-blocks
```

- **Three layers of encryption**: client-side ShellCryption AES-GCM-256 (zero-knowledge secrets and custom fields) + server-side per-row AES-256-GCM (metadata encryption) + optional SQLCipher whole-DB at rest
- **Zero-knowledge by design**: passwords, TOTP seeds, SSH keys, file data, and hidden custom fields are encrypted client-side and the server never sees plaintext. When `DB_ENCRYPTION_KEY` is set, metadata columns (title, username, url, category, notes, file_name) are also encrypted at the field level with AES-256-GCM.
- **Agent isolation**: AI agents can organize vault items (rename, categorize, move) but NEVER see actual passwords, TOTP seeds, SSH keys, hidden custom fields, or file contents — those remain opaque ShellCryption blobs

**Runtime topology:** development runs twin ports (Vite `:6464` strict-port proxying `/api` → API `:6565`); production serves the compiled `dist/` and the API from a single port (`:6464`) inside one container (optionally with native EC P-256 LAN TLS via `TLS_ENABLED=true`).

## 🐚 Data Reefs (Schema v1)

Defined by migrations in `migrations/`; tracked in `schema_migrations`. Every user-data row carries `owner_uuid` (delta #5 naming). Secret-bearing columns store client-side ShellCryption blobs only.

### 1. `lobsters` (Identities)
| Column | Type | Notes |
|---|---|---|
| `uuid` | TEXT PK | Generated client-side |
| `username` | TEXT | UNIQUE |
| `display_name` | TEXT | Editable via `/api/auth/profile` |
| `key_hash` | TEXT | SHA-256 of `hu-` key — UNIQUE index, never plaintext |
| `created_at` | TEXT | ISO timestamp |

### 2. `api_tokens` (Sessions)
| Column | Type | Notes |
|---|---|---|
| `key` | TEXT PK | `api-` token (32 chars) |
| `owner_uuid` | TEXT | Owning lobster or agent |
| `owner_type` | TEXT | `human` \| `agent` |
| `created_at` / `expires_at` | TEXT | TTL via `TOKEN_TTL_DEFAULT`; expiry compared in JS ISO time |

### 3. `agent_keys` (LobsterKeys©™ / Agent Keys)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `name` | TEXT | Display label |
| `api_key` | TEXT | `lb-` key — UNIQUE, hashed |
| `permissions` | TEXT | JSON claw strengths (canRead/canWrite/canEdit/canDelete) |
| `expiration_type` / `expiration_date` | TEXT | `never` \| `30d` \| `90d` \| `1y` |
| `rate_limit` | INTEGER | Requests per minute, 1–10000 |
| `is_active` | INTEGER | Soft-disable flag |
| `owner_uuid` | TEXT FK | Creator |
| `revoked_at` / `revoked_by` / `revoke_reason` | TEXT | Revocation trail |
| `created_at` / `last_used` | TEXT | |

### 4. `vault_pearls` (Logins)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `owner_uuid` | TEXT FK | Isolation scope — every query filters this |
| `title` | TEXT | ShellCryption blob |
| `secret` | TEXT | ShellCryption blob (password) |
| `totp_secret` | TEXT | ShellCryption blob (TOTP seed) |
| `username` / `url` / `notes` | TEXT | ShellCryption blobs |
| `type` | TEXT | `password` \| `note` \| `totp` \| `key` \| `attachment` |
| `category` | TEXT | Pod assignment (plaintext metadata) |
| `attachments` | TEXT | JSON reference array |
| `custom_fields` | TEXT | JSON array of 4 typed custom fields (default `'[]'`) |
| `created_at` | TEXT | |

### 5. `vault_secure_notes`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `owner_uuid` | TEXT FK | |
| `title` / `content` | TEXT | ShellCryption blobs |
| `category` | TEXT | Plaintext metadata |
| `custom_fields` | TEXT | JSON array of 4 typed custom fields (default `'[]'`) |
| `created_at` | TEXT | |

### 6. `vault_ssh_keys`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `owner_uuid` | TEXT FK | |
| `title` / `key_value` | TEXT | ShellCryption blobs (key material sealed client-side) |
| `username` / `category` | TEXT | Metadata |
| `custom_fields` | TEXT | JSON array of 4 typed custom fields (default `'[]'`) |
| `created_at` | TEXT | |

### 7. `vault_secure_attachments`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `owner_uuid` | TEXT FK | |
| `title` / `file_data` | TEXT | `file_data` = base64 ShellCryption blob (10 MB per-file hard cap; dedicated 32mb body limit on `/api/attachments`) |
| `file_name` / `mime_type` / `category` | TEXT | Plaintext metadata |
| `created_at` | TEXT | |

### 8. `settings` (Per-Lobster Preferences)
| Column | Type | Notes |
|---|---|---|
| `owner_uuid` + `key` | TEXT | Composite PRIMARY KEY `(owner_uuid, key)` |
| `value` | TEXT | JSON ≤ 256KB (`appearance/theme`, `generator`, `pods`, `security`) |
| `updated_at` | TEXT | ISO timestamp |

### 9. `system_settings` (Server-Wide)
| Column | Type | Notes |
|---|---|---|
| `key` | TEXT PK | e.g. `audit_retention_days` (default `90`) |
| `value` | TEXT | |
| `updated_at` | TEXT | |

### Supporting Reefs & Migrations

- **`migrations/0001_initial.up.sql`** — Schema v1 baseline (`lobsters`, `api_tokens`, `agent_keys`, `vault_pearls`, `vault_secure_notes`, `vault_ssh_keys`, `vault_secure_attachments`, `settings`, `system_settings`).
- **`migrations/0002_metadata_encryption.up.sql`** — Migration support for per-row metadata encryption.
- **`migrations/0003_custom_fields.up.sql`** — Adds `custom_fields TEXT DEFAULT '[]'` column to `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys`.
- **`schema_migrations`** *(in `db.sqlite`)* — version tracking for the transactional migration runner.
- **`audit_logs`** *(in the segregated append-only `audit.sqlite` — NOT schema v1's data bedrock)* — `timestamp, event_type, actor, actor_type, resource, action, outcome, ip_address, user_agent, details`. Redacted per delta #2; pruned daily against `system_settings.audit_retention_days`, capped at 10k rows.

---

Maintained by CrustAgent©™
