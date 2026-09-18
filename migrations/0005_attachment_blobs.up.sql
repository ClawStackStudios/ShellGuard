-- 0005_attachment_blobs.up.sql — Phase 19 (v0.0.2.1): Attachment BLOB Migration
--
-- Moves attachment ciphertext storage from base64 TEXT (`file_data TEXT`) to a
-- native SQLite BLOB column, eliminating base64 inflation on the wire and in
-- storage, and raising the per-file ceiling to 50MB.
--
--   - `file_data` column type becomes BLOB (table rebuild — SQLite cannot
--     ALTER a column type). Legacy rows are copied verbatim: SQLite is
--     dynamically typed, so existing TEXT ciphertext stays TEXT until the
--     in-code backfill (migrateAttachmentBlobs(), src/server/database/
--     attachmentBlobs.ts) re-encodes each string to raw bytes and records its
--     true byte length in `size_bytes`.
--   - New `size_bytes INTEGER NOT NULL DEFAULT 0` column: exact byte length of
--     the stored ciphertext. Powers the per-owner grotto quota
--     (SUM(size_bytes)) with a single indexed aggregate instead of scanning
--     payload blobs.
--
-- Backward compatibility: legacy TEXT rows decrypt transparently — the client
-- treats both TEXT-shaped envelopes (legacy) and raw envelope bytes (new)
-- identically after utf8 decoding.
-- ROLLBACK WARNING (down): rows written as raw binary after this migration
-- cannot be re-encoded to base64 TEXT meaningfully — down restores the old
-- TEXT column shape via CAST and is best-effort (documented data risk).

CREATE TABLE vault_secure_attachments_new (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  file_data  BLOB NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  file_name  TEXT DEFAULT '',
  mime_type  TEXT DEFAULT '',
  category   TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
INSERT INTO vault_secure_attachments_new (id, owner_uuid, title, file_data, size_bytes, file_name, mime_type, category, created_at)
  SELECT id, owner_uuid, title, file_data, LENGTH(CAST(file_data AS BLOB)), file_name, mime_type, category, created_at
    FROM vault_secure_attachments;
DROP TABLE vault_secure_attachments;
ALTER TABLE vault_secure_attachments_new RENAME TO vault_secure_attachments;
CREATE INDEX IF NOT EXISTS idx_vault_secure_attachments_owner_created ON vault_secure_attachments(owner_uuid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_secure_attachments_owner ON vault_secure_attachments(owner_uuid);