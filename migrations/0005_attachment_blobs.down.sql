-- 0005_attachment_blobs.down.sql — restore pre-Phase-19 TEXT shape (best-effort).
-- Rows stored as raw binary BLOBs after the migration cannot be meaningfully
-- re-encoded to the legacy TEXT shape; they come through as CAST garbage.
-- Legacy TEXT rows (backfilled from strings) round-trip losslessly.

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
  SELECT id, owner_uuid, title, CAST(file_data AS TEXT), file_name, mime_type, category, created_at
    FROM vault_secure_attachments;
DROP TABLE vault_secure_attachments;
ALTER TABLE vault_secure_attachments_new RENAME TO vault_secure_attachments;
CREATE INDEX IF NOT EXISTS idx_vault_secure_attachments_owner_created ON vault_secure_attachments(owner_uuid, created_at DESC);
DROP INDEX IF EXISTS idx_vault_secure_attachments_owner;