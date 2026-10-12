-- Migration 0009: Attachment Integrity & Quarantine

-- Add parent linkage and quarantine fields to attachments
ALTER TABLE vault_secure_attachments ADD COLUMN parent_id TEXT;
ALTER TABLE vault_secure_attachments ADD COLUMN parent_type TEXT;
ALTER TABLE vault_secure_attachments ADD COLUMN is_quarantined INTEGER DEFAULT 0;
ALTER TABLE vault_secure_attachments ADD COLUMN quarantined_at TEXT;

-- Add attachments JSON array to vault_ssh_keys for parity
ALTER TABLE vault_ssh_keys ADD COLUMN attachments TEXT DEFAULT '[]';
