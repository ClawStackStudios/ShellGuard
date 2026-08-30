-- Migration 0003: Custom fields for vault items.
--
-- Adds a custom_fields TEXT column to vault_pearls, vault_secure_notes,
-- and vault_ssh_keys to store ShellCrypted CustomField[] JSON blobs.
-- The column holds opaque client-side ciphertext — server never inspects it.
--
-- Pattern matches the existing zero-knowledge invariant: the server stores
-- encrypted payloads byte-for-byte and validates only length/type.

ALTER TABLE vault_pearls ADD COLUMN custom_fields TEXT DEFAULT '';
ALTER TABLE vault_secure_notes ADD COLUMN custom_fields TEXT DEFAULT '';
ALTER TABLE vault_ssh_keys ADD COLUMN custom_fields TEXT DEFAULT '';