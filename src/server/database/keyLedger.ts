import crypto from 'crypto';
import type { Database } from 'better-sqlite3-multiple-ciphers';

/**
 * Agent Key Ledger migration (Phase 17, v0.0.1.9).
 *
 * Runs in code immediately after migration 0004 because SQLite has no
 * SHA-256 primitive. Order is load-bearing:
 *
 *   1. Rewrite live agent api_tokens: owner_uuid currently holds the RAW
 *      lb- key (pre-Phase-17 contract) — re-point it to the agent row id
 *      while the plaintext join is still possible.
 *   2. Hash every legacy plaintext api_key in place (SHA-256 hex), deriving
 *      a key_fingerprint — live keys keep authenticating unchanged.
 *   3. Retire the plaintext column (DROP COLUMN api_key) and its index.
 *
 * Idempotent: exits early when the plaintext column is already gone.
 * Fail-closed: the whole sequence is one transaction — a partial ledger
 * (some rows hashed, plaintext dropped) is structurally impossible.
 */
export function migrateAgentKeyLedger(db: Database): void {
  const cols = (db.prepare('PRAGMA table_info(agent_keys)').all() as any[]).map((c) => c.name);
  if (!cols.includes('api_key')) return; // already migrated
  if (!cols.includes('key_hash')) {
    throw new Error('[Key Ledger] ❌ agent_keys.api_key exists but key_hash does not — run migration 0004 first.');
  }

  const legacy = db.prepare("SELECT id, api_key FROM agent_keys WHERE key_hash IS NULL OR key_hash = ''").all() as { id: string; api_key: string }[];

  const tx = db.transaction(() => {
    // 1. Re-point live agent tokens from raw-key owner_uuid → agent row id.
    db.prepare(
      `UPDATE api_tokens SET owner_uuid = (
         SELECT ak.id FROM agent_keys ak WHERE ak.api_key = api_tokens.owner_uuid
       )
       WHERE owner_type = 'agent'
         AND EXISTS (SELECT 1 FROM agent_keys ak WHERE ak.api_key = api_tokens.owner_uuid)`
    ).run();

    // 2. Hash legacy plaintext in place (live keys keep authenticating).
    const upd = db.prepare('UPDATE agent_keys SET key_hash = ?, key_fingerprint = ? WHERE id = ?');
    for (const row of legacy) {
      const hash = crypto.createHash('sha256').update(row.api_key).digest('hex');
      upd.run(hash, hash.slice(0, 12), row.id);
    }

    // 3. Retire the plaintext column. api_key carries a UNIQUE auto-index
    // (sqlite_autoindex), which SQLite refuses to DROP COLUMN past — so the
    // ledger is rebuilt without the column instead (same pattern as the
    // 0004 category rebuilds).
    db.exec('DROP INDEX IF EXISTS idx_agent_keys_api_key;');
    db.exec(`
      CREATE TABLE agent_keys_new (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        description     TEXT,
        key_hash        TEXT,
        key_fingerprint TEXT,
        permissions     TEXT NOT NULL,
        expiration_type TEXT NOT NULL,
        expiration_date TEXT,
        rate_limit      INTEGER,
        is_active       INTEGER DEFAULT 1,
        owner_uuid      TEXT NOT NULL DEFAULT '',
        revoked_at      TEXT,
        revoked_by      TEXT,
        revoke_reason   TEXT,
        created_at      TEXT NOT NULL,
        last_used       TEXT
      );
      INSERT INTO agent_keys_new (id, name, description, key_hash, key_fingerprint, permissions, expiration_type, expiration_date, rate_limit, is_active, owner_uuid, revoked_at, revoked_by, revoke_reason, created_at, last_used)
        SELECT id, name, description, key_hash, key_fingerprint, permissions, expiration_type, expiration_date, rate_limit, is_active, owner_uuid, revoked_at, revoked_by, revoke_reason, created_at, last_used FROM agent_keys;
      DROP TABLE agent_keys;
      ALTER TABLE agent_keys_new RENAME TO agent_keys;
      CREATE INDEX IF NOT EXISTS idx_agent_keys_key_hash ON agent_keys(key_hash);
      CREATE INDEX IF NOT EXISTS idx_agent_keys_active ON agent_keys(is_active);
      CREATE INDEX IF NOT EXISTS idx_agent_keys_owner ON agent_keys(owner_uuid);
    `);
  });
  tx();

  // VACUUM after commit: the rebuilt table leaves the plaintext in freed
  // pages until then — a byte-level ghost of the key material we just
  // retired. Cannot run inside the transaction.
  db.exec('VACUUM;');

  console.log(`[Key Ledger] 🔐 Hashed ${legacy.length} agent key(s) in place; plaintext api_key column retired.`);
}
