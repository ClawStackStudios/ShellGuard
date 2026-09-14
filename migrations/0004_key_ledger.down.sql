-- 0004_key_ledger.down.sql — restore pre-Phase-17 shape.
-- NOTE: hashed key material cannot be reversed; api_key is restored NULL and
-- existing ledger rows become inert after rollback (documented data loss).

ALTER TABLE agent_keys ADD COLUMN api_key TEXT;
ALTER TABLE agent_keys DROP COLUMN key_hash;
ALTER TABLE agent_keys DROP COLUMN key_fingerprint;
DROP INDEX IF EXISTS idx_agent_keys_key_hash;

CREATE TABLE vault_pearls_new (
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
  custom_fields TEXT DEFAULT '',
  created_at  TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_pearls_new SELECT id, owner_uuid, title, secret, username, url, type, category, notes, totp_secret, attachments, custom_fields, created_at FROM vault_pearls;
DROP TABLE vault_pearls;
ALTER TABLE vault_pearls_new RENAME TO vault_pearls;
CREATE INDEX IF NOT EXISTS idx_vault_pearls_owner_created ON vault_pearls(owner_uuid, created_at DESC);

CREATE TABLE vault_secure_notes_new (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT DEFAULT 'Personal',
  custom_fields TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_secure_notes_new SELECT id, owner_uuid, title, content, category, custom_fields, created_at FROM vault_secure_notes;
DROP TABLE vault_secure_notes;
ALTER TABLE vault_secure_notes_new RENAME TO vault_secure_notes;
CREATE INDEX IF NOT EXISTS idx_vault_secure_notes_owner_created ON vault_secure_notes(owner_uuid, created_at DESC);

CREATE TABLE vault_ssh_keys_new (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  key_value  TEXT NOT NULL,
  username   TEXT DEFAULT '',
  category   TEXT DEFAULT 'Personal',
  custom_fields TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_ssh_keys_new SELECT id, owner_uuid, title, key_value, username, category, custom_fields, created_at FROM vault_ssh_keys;
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
  category   TEXT DEFAULT 'Personal',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_secure_attachments_new SELECT id, owner_uuid, title, file_data, file_name, mime_type, category, created_at FROM vault_secure_attachments;
DROP TABLE vault_secure_attachments;
ALTER TABLE vault_secure_attachments_new RENAME TO vault_secure_attachments;
CREATE INDEX IF NOT EXISTS idx_vault_secure_attachments_owner_created ON vault_secure_attachments(owner_uuid, created_at DESC);
