---
title: Database Schema Ground Truth
description: Authoritative SQLite Schema Definitions for ShellGuard & Forensic Audit DB
---

# 🗄️ Database Schema Ground Truth

<CopyPage />

The database tables are initialized via versioned SQLite migrations located in `migrations/` and executed at server boot by `MigrationRunner`.

ShellGuard maintains two separate SQLite database files:
1. **`DATA_DIR/db.sqlite`**: The primary operational database, encrypted whole-DB with SQLCipher (Layer 3) and per-row metadata encryption (Layer 2).
2. **`DATA_DIR/audit.sqlite`**: The forensic audit log database, append-only and strictly isolated from data backups and restores.

---

## 🐚 Primary Database (`db.sqlite`)

### 1. `lobsters` (Human Identities)
Stores registered users. The `key_hash` is a constant-time SHA-256 hash of the sovereign `hu-` identity key.

```sql
CREATE TABLE IF NOT EXISTS lobsters (
  uuid         TEXT PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT,
  key_hash     TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lobsters_key_hash ON lobsters(key_hash);
```

### 2. `api_tokens` (Session Bearer Tokens)
Tracks active bearer sessions issued during user authentication.

```sql
CREATE TABLE IF NOT EXISTS api_tokens (
  key        TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  owner_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_expires_at ON api_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_tokens_owner ON api_tokens(owner_uuid, owner_type);
```

### 3. `vault_pearls` (Logins & Credentials)
Stores login credentials. `secret`, `totp_secret`, `attachments`, and `custom_fields` contain client-side ShellCryption ciphertext envelopes.

```sql
CREATE TABLE IF NOT EXISTS vault_pearls (
  id            TEXT PRIMARY KEY,
  owner_uuid    TEXT NOT NULL,
  title         TEXT NOT NULL,
  secret        TEXT NOT NULL,
  username      TEXT DEFAULT '',
  url           TEXT DEFAULT '',
  type          TEXT DEFAULT 'password',
  category      TEXT DEFAULT 'Personal',
  notes         TEXT DEFAULT '',
  totp_secret   TEXT DEFAULT '',
  attachments   TEXT DEFAULT '[]',
  custom_fields TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE INDEX IF NOT EXISTS idx_vault_pearls_owner_created ON vault_pearls(owner_uuid, created_at DESC);
```

### 4. `vault_secure_notes` (Markdown Notes)
Encrypted free-form text and markdown documentation.

```sql
CREATE TABLE IF NOT EXISTS vault_secure_notes (
  id            TEXT PRIMARY KEY,
  owner_uuid    TEXT NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  category      TEXT DEFAULT 'Personal',
  custom_fields TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE INDEX IF NOT EXISTS idx_vault_secure_notes_owner_created ON vault_secure_notes(owner_uuid, created_at DESC);
```

### 5. `vault_ssh_keys` (SSH Private Keys)
Encrypted SSH keys and certificates.

```sql
CREATE TABLE IF NOT EXISTS vault_ssh_keys (
  id            TEXT PRIMARY KEY,
  owner_uuid    TEXT NOT NULL,
  title         TEXT NOT NULL,
  key_value     TEXT NOT NULL,
  username      TEXT DEFAULT '',
  category      TEXT DEFAULT 'Personal',
  custom_fields TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE INDEX IF NOT EXISTS idx_vault_ssh_keys_owner_created ON vault_ssh_keys(owner_uuid, created_at DESC);
```

### 6. `vault_secure_attachments` (File Attachments)
Stores binary file attachments under the **Reference Model**. Linked from `vault_pearls.attachments` JSON array.

```sql
CREATE TABLE IF NOT EXISTS vault_secure_attachments (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  file_data  TEXT NOT NULL,
  file_name  TEXT DEFAULT '',
  mime_type  TEXT DEFAULT '',
  category   TEXT DEFAULT 'Personal',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE INDEX IF NOT EXISTS idx_vault_secure_attachments_owner_created ON vault_secure_attachments(owner_uuid, created_at DESC);
```

### 7. `agent_keys` (LobsterKeys / AI Agent Delegation)
Issued API keys (`lb-` prefix) allowing scoped, programmatic access to autonomous agents.

```sql
CREATE TABLE IF NOT EXISTS agent_keys (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  api_key         TEXT NOT NULL UNIQUE,
  permissions     TEXT NOT NULL,
  expiration_type TEXT NOT NULL,
  expiration_date TEXT,
  rate_limit      INTEGER,
  is_active       INTEGER DEFAULT 1,
  owner_uuid      TEXT NOT NULL DEFAULT '',
  revoked_at      TEXT,
  revoked_by      TEXT,
  revoke_reason   TEXT,
  created_at      TEXT NOT NULL,
  last_used       TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_keys_api_key ON agent_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_agent_keys_active ON agent_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_keys_owner ON agent_keys(owner_uuid);
```

### 8. Preferences & System Settings
Stores non-secret user preferences and instance configuration.

```sql
-- Per-owner UI preferences
CREATE TABLE IF NOT EXISTS settings (
  owner_uuid TEXT NOT NULL DEFAULT '',
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  PRIMARY KEY (owner_uuid, key)
);

-- SuperLobster instance settings (backup schedule, retention policies)
CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 9. `schema_migrations`
Tracks applied schema migrations.

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
```

---

## 🩺 Forensic Audit Database (`audit.sqlite`)

Stored as an independent, append-only SQLite database initialized by `src/server/database/schema.ts`.

### `audit_logs`
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  actor       TEXT,
  actor_type  TEXT,
  resource    TEXT,
  action      TEXT NOT NULL,
  outcome     TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  details     TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_outcome ON audit_logs(outcome);
```
