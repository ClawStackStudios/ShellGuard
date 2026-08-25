-- 0001_initial.down.sql
-- Baseline schema teardown for ShellGuard

DROP TABLE IF EXISTS system_settings;

DROP TABLE IF EXISTS settings;

DROP INDEX IF EXISTS idx_agent_keys_owner;
DROP INDEX IF EXISTS idx_agent_keys_active;
DROP INDEX IF EXISTS idx_agent_keys_api_key;
DROP TABLE IF EXISTS agent_keys;

DROP INDEX IF EXISTS idx_vault_secure_attachments_owner_created;
DROP TABLE IF EXISTS vault_secure_attachments;

DROP INDEX IF EXISTS idx_vault_ssh_keys_owner_created;
DROP TABLE IF EXISTS vault_ssh_keys;

DROP INDEX IF EXISTS idx_vault_secure_notes_owner_created;
DROP TABLE IF EXISTS vault_secure_notes;

DROP INDEX IF EXISTS idx_vault_pearls_owner_created;
DROP TABLE IF EXISTS vault_pearls;

DROP INDEX IF EXISTS idx_api_tokens_owner;
DROP INDEX IF EXISTS idx_api_tokens_expires_at;
DROP TABLE IF EXISTS api_tokens;

DROP INDEX IF EXISTS idx_lobsters_key_hash;
DROP TABLE IF EXISTS lobsters;
