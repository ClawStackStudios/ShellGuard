-- Rollback Migration 0006: Vault Tagging System
--
-- Drops tags indices and columns across pearls, notes, and SSH keys.

DROP INDEX IF EXISTS idx_vault_ssh_keys_owner_tags;
DROP INDEX IF EXISTS idx_vault_secure_notes_owner_tags;
DROP INDEX IF EXISTS idx_vault_pearls_owner_tags;

ALTER TABLE vault_ssh_keys DROP COLUMN tags;
ALTER TABLE vault_secure_notes DROP COLUMN tags;
ALTER TABLE vault_pearls DROP COLUMN tags;
