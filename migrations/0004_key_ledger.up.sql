-- 0004_key_ledger.up.sql — Phase 17 (v0.0.1.9): Key Ledger Hardening & Pod Purity
--
-- Part 1 — Agent key hash ledger:
--   Adds key_hash / key_fingerprint to agent_keys. The SHA-256 backfill of the
--   legacy plaintext api_key column CANNOT run in SQL (no crypto in SQLite),
--   so it is performed in code by migrateAgentKeyLedger() immediately after
--   this migration (src/server/database/keyLedger.ts), which then retires the
--   plaintext column. Live api_tokens whose owner_uuid holds the RAW lb- key
--   are rewritten to the agent row id in the same transaction.
--
-- Part 2 — Pod purity:
--   Drops the hardcoded DEFAULT 'Personal' from every category column
--   (table rebuild — SQLite cannot ALTER a column default). New default is
--   '' (uncategorized), matching normalizePod() client semantics. Existing
--   'Personal'-categorized rows are copied verbatim — no data rewrite.

-- ── Part 1: key ledger columns ──────────────────────────────────────────────
ALTER TABLE agent_keys ADD COLUMN key_hash TEXT;
ALTER TABLE agent_keys ADD COLUMN key_fingerprint TEXT;

-- ── Part 2: category DEFAULT purge (4 table rebuilds) ──────────────────────

CREATE TABLE vault_pearls_new (
  id          TEXT PRIMARY KEY,
  owner_uuid  TEXT NOT NULL,
  title       TEXT NOT NULL,
  secret      TEXT NOT NULL,
  username    TEXT DEFAULT '',
  url         TEXT DEFAULT '',
  type        TEXT DEFAULT 'password',
  category    TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  totp_secret TEXT DEFAULT '',
  attachments TEXT DEFAULT '[]',
  custom_fields TEXT DEFAULT '',
  created_at  TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_pearls_new (id, owner_uuid, title, secret, username, url, type, category, notes, totp_secret, attachments, custom_fields, created_at)
  SELECT id, owner_uuid, title, secret, username, url, type, category, notes, totp_secret, attachments, custom_fields, created_at FROM vault_pearls;
DROP TABLE vault_pearls;
ALTER TABLE vault_pearls_new RENAME TO vault_pearls;
CREATE INDEX IF NOT EXISTS idx_vault_pearls_owner_created ON vault_pearls(owner_uuid, created_at DESC);

CREATE TABLE vault_secure_notes_new (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT DEFAULT '',
  custom_fields TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_secure_notes_new (id, owner_uuid, title, content, category, custom_fields, created_at)
  SELECT id, owner_uuid, title, content, category, custom_fields, created_at FROM vault_secure_notes;
DROP TABLE vault_secure_notes;
ALTER TABLE vault_secure_notes_new RENAME TO vault_secure_notes;
CREATE INDEX IF NOT EXISTS idx_vault_secure_notes_owner_created ON vault_secure_notes(owner_uuid, created_at DESC);

CREATE TABLE vault_ssh_keys_new (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  key_value  TEXT NOT NULL,
  username   TEXT DEFAULT '',
  category   TEXT DEFAULT '',
  custom_fields TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_ssh_keys_new (id, owner_uuid, title, key_value, username, category, custom_fields, created_at)
  SELECT id, owner_uuid, title, key_value, username, category, custom_fields, created_at FROM vault_ssh_keys;
DROP TABLE vault_ssh_keys;
ALTER TABLE vault_ssh_keys_new RENAME TO vault_ssh_keys;
CREATE INDEX IF NOT EXISTS idx_vault_ssh_keys_owner_created ON vault_ssh_keys(owner_uuid, created_at DESC);

CREATE TABLE vault_secure_attachments_new (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  file_data  TEXT NOT NULL,
  file_name  TEXT DEFAULT '',
  mime_type  TEXT DEFAULT '',
  category   TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_secure_attachments_new (id, owner_uuid, title, file_data, file_name, mime_type, category, created_at)
  SELECT id, owner_uuid, title, file_data, file_name, mime_type, category, created_at FROM vault_secure_attachments;
DROP TABLE vault_secure_attachments;
ALTER TABLE vault_secure_attachments_new RENAME TO vault_secure_attachments;
CREATE INDEX IF NOT EXISTS idx_vault_secure_attachments_owner_created ON vault_secure_attachments(owner_uuid, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_keys_key_hash ON agent_keys(key_hash);
