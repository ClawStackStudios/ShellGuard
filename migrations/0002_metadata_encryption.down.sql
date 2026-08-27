-- Rollback migration 0002: Reverts the encryption feature flag.
--
-- WARNING: After running this down-migration and restarting with the
-- older codebase, any rows that were encrypted by the v0.3.0 server
-- will contain unreadable JSON envelopes in their metadata columns.
--
-- BEFORE DOWNGRADING: run the batch decrypt script to restore plaintext:
--
--   DB_ENCRYPTION_KEY=<your-key> npx tsx scripts/decrypt-existing-metadata.ts
--
-- Idempotent — skips rows that are not SG-META encrypted.

SELECT 1;