-- Migration 0002: Per-row server-side metadata encryption.
--
-- No DDL changes — encrypted JSON envelopes are stored in the same TEXT
-- columns as plaintext was.  SQLite TEXT columns have no practical length
-- limit, and the in-place format ({v:1,alg:"SG-META",iv,ct}) is compatible
-- with all existing queries.
--
-- This migration records version 2 in schema_migrations so the application
-- can detect that the encryption feature is active.  Existing plaintext
-- metadata will be transparently encrypted on next write, and decrypted
-- at read time regardless.
--
-- One-time batch encrypt script: scripts/encrypt-existing-metadata.ts

SELECT 1;