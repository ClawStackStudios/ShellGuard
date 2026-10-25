-- Rollback Migration 0010: Import Lifecycle & Ephemeral Quarantine
--
-- Drops import batch indices and columns across pearls, notes, and SSH keys.

DROP INDEX IF EXISTS idx_vault_ssh_keys_import_batch;
DROP INDEX IF EXISTS idx_vault_secure_notes_import_batch;
DROP INDEX IF EXISTS idx_vault_pearls_import_batch;

ALTER TABLE vault_ssh_keys DROP COLUMN import_batch_id;
ALTER TABLE vault_ssh_keys DROP COLUMN imported_at;
ALTER TABLE vault_secure_notes DROP COLUMN import_batch_id;
ALTER TABLE vault_secure_notes DROP COLUMN imported_at;
ALTER TABLE vault_pearls DROP COLUMN import_batch_id;
ALTER TABLE vault_pearls DROP COLUMN imported_at;
