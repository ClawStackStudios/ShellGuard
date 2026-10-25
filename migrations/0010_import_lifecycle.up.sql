-- Migration 0010: Import Lifecycle & Ephemeral Quarantine
--
-- Adds `imported_at` (ISO timestamp) and `import_batch_id` (prefixed uuid string)
-- across vault_pearls, vault_secure_notes, and vault_ssh_keys to track import provenance
-- and support progressive disclosure quarantine and atomic batch rollback.
-- Also adds indexed lookups on `import_batch_id`.

ALTER TABLE vault_pearls ADD COLUMN imported_at TEXT DEFAULT NULL;
ALTER TABLE vault_pearls ADD COLUMN import_batch_id TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_pearls_import_batch ON vault_pearls(import_batch_id);

ALTER TABLE vault_secure_notes ADD COLUMN imported_at TEXT DEFAULT NULL;
ALTER TABLE vault_secure_notes ADD COLUMN import_batch_id TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_secure_notes_import_batch ON vault_secure_notes(import_batch_id);

ALTER TABLE vault_ssh_keys ADD COLUMN imported_at TEXT DEFAULT NULL;
ALTER TABLE vault_ssh_keys ADD COLUMN import_batch_id TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_ssh_keys_import_batch ON vault_ssh_keys(import_batch_id);
