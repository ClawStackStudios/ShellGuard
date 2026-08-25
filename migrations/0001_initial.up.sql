-- 0001_initial.up.sql
-- Baseline consolidated database schema for ShellGuard (schema v1)
-- Fresh-start baseline: no legacy data is migrated.
--
-- Zero-knowledge note: vault payload columns (secret, content, key_value,
-- file_data, totp_secret, attachments) hold opaque client-side ShellCryption™
-- ciphertext. The server stores these byte-for-byte and never inspects them.

CREATE TABLE IF NOT EXISTS lobsters (
  uuid         TEXT PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT,
  key_hash     TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lobsters_key_hash ON lobsters(key_hash);

CREATE TABLE IF NOT EXISTS api_tokens (
  key        TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  owner_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_expires_at ON api_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_tokens_owner ON api_tokens(owner_uuid, owner_type);

CREATE TABLE IF NOT EXISTS vault_pearls (
  id          TEXT PRIMARY KEY,
  owner_uuid  TEXT NOT NULL,
  title       TEXT NOT NULL,
  secret      TEXT NOT NULL,
  username    TEXT DEFAULT '',
  url         TEXT DEFAULT '',
  type        TEXT DEFAULT 'password',
  category    TEXT DEFAULT 'Personal',
  notes       TEXT DEFAULT '',
  totp_secret TEXT DEFAULT '',
  attachments TEXT DEFAULT '[]',
  created_at  TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE INDEX IF NOT EXISTS idx_vault_pearls_owner_created ON vault_pearls(owner_uuid, created_at DESC);

CREATE TABLE IF NOT EXISTS vault_secure_notes (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT DEFAULT 'Personal',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE INDEX IF NOT EXISTS idx_vault_secure_notes_owner_created ON vault_secure_notes(owner_uuid, created_at DESC);

CREATE TABLE IF NOT EXISTS vault_ssh_keys (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  key_value  TEXT NOT NULL,
  username   TEXT DEFAULT '',
  category   TEXT DEFAULT 'Personal',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE INDEX IF NOT EXISTS idx_vault_ssh_keys_owner_created ON vault_ssh_keys(owner_uuid, created_at DESC);

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

-- Per-owner key/value preference store (non-secret UI prefs only).
-- Primary key is scoped to the owner so identities never clobber each other.
CREATE TABLE IF NOT EXISTS settings (
  owner_uuid TEXT NOT NULL DEFAULT '',
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  PRIMARY KEY (owner_uuid, key)
);

CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO system_settings (key, value, updated_at)
  VALUES ('audit_retention_days', '90', datetime('now'));

INSERT OR IGNORE INTO system_settings (key, value, updated_at)
  VALUES ('uptime_retention_days', '30', datetime('now'));
