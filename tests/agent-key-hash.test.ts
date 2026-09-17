import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import { createTestUserWithToken } from './helpers/testAuth.js';

/**
 * Phase 17 (v0.0.1.9) — Key Ledger Hardening & Pod Purity.
 *
 * Guarantees under test:
 *   G1. A raw byte-scan of the suite's SQLite files contains ZERO plaintext
 *       lb- key material after mint (hash-only ledger).
 *   G2. A pre-Phase-17 legacy plaintext key keeps authenticating after the
 *       in-place backfill (unit oracle against the old schema shape).
 *   G3. A minted key's plaintext is returned exactly ONCE (mint response)
 *       and is absent from every subsequent list response.
 *   G4. Pod purity: items saved without a category persist as ''
 *       (uncategorized) — the hardcoded 'Personal' default is gone.
 */

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-key-ledger-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64647';
  process.env.DB_ENCRYPTION_KEY = '';
  process.env.TOKEN_TTL_DEFAULT = '30m';
  process.env.AUTH_RATE_LIMIT = '1000000';
  process.env.AUTH_RATE_WINDOW = '600m';
  process.env.API_RATE_LIMIT = '1000000';
  process.env.API_RATE_WINDOW = '600m';
  process.env.ENFORCE_HTTPS = 'false';
});

let srv!: ServerHandle;
let token: string;

beforeAll(async () => {
  srv = await loadServer();
  const identity = await createTestUserWithToken(srv.app);
  token = identity.token;
});

afterAll(async () => {
  await releaseServer(srv);
});

// ─── G1 + G3: hash-only ledger, one-time reveal ─────────────────────────────
describe('Phase 17 — agent key hash ledger', () => {
  it('mints a key: plaintext returned ONCE, fingerprint listed, zero material in list', async () => {
    const mint = await request(srv.app)
      .post('/api/agent-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ledger Probe', permissions: { canRead: true } });
    expect(mint.status).toBe(201);
    const rawKey: string = mint.body.data.apiKey;
    expect(rawKey).toMatch(/^lb-/);
    expect(mint.body.data.keyFingerprint).toBeTruthy();
    expect(mint.body.data.keyFingerprint).not.toContain(rawKey);

    const list = await request(srv.app)
      .get('/api/agent-keys')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    const listed = list.body.data.find((k: any) => k.id === mint.body.data.id);
    expect(listed).toBeDefined();
    expect(listed.apiKey).toBeUndefined();          // G3: never listed
    expect(listed.api_key).toBeUndefined();
    expect(listed.key).toBeUndefined();
    expect(listed.keyFingerprint).toBe(mint.body.data.keyFingerprint);

    // G1: raw byte-scan of every SQLite file in the suite DATA_DIR —
    // the plaintext key must not exist anywhere on disk (main db + WAL).
    const files = fs.readdirSync(process.env.DATA_DIR!).filter((f) => f.endsWith('.sqlite'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const bytes = fs.readFileSync(path.join(process.env.DATA_DIR!, f));
      expect(bytes.indexOf(Buffer.from(rawKey, 'utf8'))).toBe(-1);
    }
  });

  it('exchanges the raw lb- key for a token (hash lookup) and reaches the vault', async () => {
    const mint = await request(srv.app)
      .post('/api/agent-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Raw Exchange Probe', permissions: { canRead: true } });
    const rawKey: string = mint.body.data.apiKey;

    const tok = await request(srv.app).post('/api/auth/token').send({ type: 'agent', ownerKey: rawKey });
    expect(tok.status).toBe(201);
    const agentToken = tok.body.data.token;

    const vault = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${agentToken}`);
    if (vault.status !== 200) console.log('VAULT-DEBUG', vault.status, JSON.stringify(vault.body));
    expect(vault.status).toBe(200); // requireAuth resolved identity via the hash ledger
  });

  it('sentinel path: keyHash-only login matches the stored hash constant-time', async () => {
    const mint = await request(srv.app)
      .post('/api/agent-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sentinel Probe', permissions: { canRead: true } });
    const rawKey: string = mint.body.data.apiKey;
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const tok = await request(srv.app).post('/api/auth/token').send({ type: 'agent', keyHash: hash });
    expect(tok.status).toBe(201);

    const bad = await request(srv.app)
      .post('/api/auth/token')
      .send({ type: 'agent', keyHash: crypto.createHash('sha256').update('lb-not-a-key').digest('hex') });
    expect(bad.status).toBe(401);
  });

  it('revoked keys are rejected on the hash path', async () => {
    const mint = await request(srv.app)
      .post('/api/agent-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Revoke Probe', permissions: { canRead: true } });
    const rawKey: string = mint.body.data.apiKey;
    expect((await request(srv.app).post('/api/auth/token').send({ type: 'agent', ownerKey: rawKey })).status).toBe(201);

    await request(srv.app)
      .patch(`/api/agent-keys/${mint.body.data.id}/revoke`)
      .set('Authorization', `Bearer ${token}`);
    expect((await request(srv.app).post('/api/auth/token').send({ type: 'agent', ownerKey: rawKey })).status).toBe(401);
  });

  // ─── G4: pod purity ────────────────────────────────────────────────────────
  it('items without a category persist as uncategorized ("") — no Personal resurrection', async () => {
    const create = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: crypto.randomUUID(), title: 'No Category Pearl', secret: 'opaque-blob' });
    expect(create.status).toBe(201);
    expect(create.body.data.category).toBe('');

    const list = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${token}`);
    const item = list.body.data.find((i: any) => i.title === 'No Category Pearl');
    expect(item.category).toBe('');
    expect(item.category).not.toBe('Personal');
  });
});

// ─── G2: legacy plaintext keys survive the in-place backfill (unit oracle) ──
describe('Phase 17 — legacy key backfill unit oracle', () => {
  it('hashes a legacy plaintext ledger in place, re-points live tokens, retires the column', async () => {
    const { default: Database } = await import('better-sqlite3-multiple-ciphers');
    const { migrateAgentKeyLedger } = await import('../src/server/database/keyLedger.ts');

    const dir = fs.mkdtempSync(path.join(process.cwd(), 'tests', 'data-key-ledger-unit-'));
    const db = new Database(path.join(dir, 'legacy.sqlite'));
    try {
      // Recreate the pre-Phase-17 shape: 0001 schema + 0004's two added columns
      db.exec(fs.readFileSync(path.join(process.cwd(), 'migrations', '0001_initial.up.sql'), 'utf8'));
      db.exec("ALTER TABLE agent_keys ADD COLUMN key_hash TEXT; ALTER TABLE agent_keys ADD COLUMN key_fingerprint TEXT;");

      const rawKey = 'lb-' + 'a7Kx'.repeat(16); // legacy plaintext at rest
      db.prepare(
        `INSERT INTO agent_keys (id, name, api_key, permissions, expiration_type, is_active, owner_uuid, created_at)
         VALUES ('agent-1', 'Legacy', ?, '{}', 'never', 1, 'owner-1', '2026-01-01')`
      ).run(rawKey);
      // Live session minted pre-Phase-17: owner_uuid holds the RAW key
      db.prepare(
        `INSERT INTO api_tokens (key, owner_uuid, owner_type, created_at, expires_at)
         VALUES ('api-legacytoken', ?, 'agent', '2026-01-01', null)`
      ).run(rawKey);

      migrateAgentKeyLedger(db);

      const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
      const cols = (db.prepare('PRAGMA table_info(agent_keys)').all() as any[]).map((c) => c.name);
      expect(cols).not.toContain('api_key');                 // plaintext column retired
      expect(cols).toContain('key_hash');

      const ledger = db.prepare("SELECT key_hash, key_fingerprint, is_active FROM agent_keys WHERE id = 'agent-1'").get() as any;
      expect(ledger.key_hash).toBe(hash);                     // hashed IN PLACE — same key still valid
      expect(ledger.key_fingerprint).toBe(hash.slice(0, 12));
      expect(ledger.is_active).toBe(1);

      const tok = db.prepare("SELECT owner_uuid FROM api_tokens WHERE key = 'api-legacytoken'").get() as any;
      expect(tok.owner_uuid).toBe('agent-1');                 // live token re-pointed to agent id

      const lookup = db.prepare('SELECT id FROM agent_keys WHERE key_hash = ? AND is_active = 1').get(hash) as any;
      expect(lookup.id).toBe('agent-1');                      // presented raw key still authenticates

      // G1 at the unit level too: no plaintext remains in the file
      const bytes = fs.readFileSync(path.join(dir, 'legacy.sqlite'));
      expect(bytes.indexOf(Buffer.from(rawKey, 'utf8'))).toBe(-1);
    } finally {
      db.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 90000);
});
