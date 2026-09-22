-- Migration 0007: Composite item features (multi-URI and password generation history).
--
-- Adds uris and password_history columns to vault_pearls.
-- Pattern matches the existing zero-knowledge invariant: the server stores
-- payloads byte-for-byte and validates only length/type.

ALTER TABLE vault_pearls ADD COLUMN uris TEXT DEFAULT '[]';
ALTER TABLE vault_pearls ADD COLUMN password_history TEXT DEFAULT '[]';
