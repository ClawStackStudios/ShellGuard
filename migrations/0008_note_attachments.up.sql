-- Migration 0008: Note attachments support.
--
-- Adds attachments column to vault_secure_notes to achieve 1:1 parity with vault_pearls.
-- The attachments column holds an opaque JSON array of vault_secure_attachments IDs.

ALTER TABLE vault_secure_notes ADD COLUMN attachments TEXT DEFAULT '[]';
