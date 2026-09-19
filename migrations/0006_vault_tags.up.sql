-- Migration 0006: Vault Tagging System
--
-- Adds a `tags` TEXT column (default '[]') across vault_pearls,
-- vault_secure_notes, and vault_ssh_keys for multi-dimensional item tagging.
-- Also adds owner indices to accelerate scoped queries and tag filtering.

ALTER TABLE vault_pearls ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE vault_secure_notes ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE vault_ssh_keys ADD COLUMN tags TEXT DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_vault_pearls_owner_tags ON vault_pearls(owner_uuid);
CREATE INDEX IF NOT EXISTS idx_vault_secure_notes_owner_tags ON vault_secure_notes(owner_uuid);
CREATE INDEX IF NOT EXISTS idx_vault_ssh_keys_owner_tags ON vault_ssh_keys(owner_uuid);
