import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import {
  encryptField,
  decryptField,
  deriveMetadataKey,
  isEncryptedField,
} from '../src/server/utils/fieldEncryption.js';

/**
 * Metadata encryption: per-row AES-256-GCM field encryption of title,
 * username, url, category, notes columns.  Two layers:
 *
 *   1. Unit tests against the crypto primitives (no server needed)
 *   2. API round-trip with DB_ENCRYPTION_KEY set (fieldCipher active)
 *   3. Backward-compatible passthrough (legacy plaintext rows)
 */

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-metadata-encryption-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64648';
  // Exactly 32 bytes → valid AES-256 key material after base64 decode
  process.env.DB_ENCRYPTION_KEY = Buffer.from('test-metadata-key-exactly-32bytes!').toString('base64');
  process.env.TOKEN_TTL_DEFAULT = '30m';
  process.env.AUTH_RATE_LIMIT = '1000000';
  process.env.AUTH_RATE_WINDOW = '600m';
  process.env.API_RATE_LIMIT = '1000000';
  process.env.API_RATE_WINDOW = '600m';
  process.env.ENFORCE_HTTPS = 'false';
});

let srv!: ServerHandle;

beforeAll(async () => {
  srv = await loadServer();
});

afterAll(async () => {
  await releaseServer(srv);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateTestIdentity() {
  return {
    uuid: crypto.randomUUID(),
    key: `hu-${crypto.randomBytes(32).toString('hex').slice(0, 64)}`,
  };
}

async function hashToken(key: string) {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(key).digest('hex');
}

async function getAuthToken(app: Parameters<typeof request>[0], uuid: string, keyHash: string) {
  const res = await request(app)
    .post('/api/auth/token')
    .send({ uuid, keyHash });
  return res.body.data.token as string;
}

function fakeShellCryption(id: string) {
  return JSON.stringify({
    v: 1,
    alg: 'AES-GCM-256',
    iv: Buffer.from(`fake-iv-${id}`).toString('base64'),
    ct: Buffer.from(`fake-ct-secret-data-${id}`).toString('base64'),
    aad: `vault_pearls:${id}`,
  });
}

// ─── Unit: fieldEncryption primitives ────────────────────────────────────────

describe('Unit: fieldEncryption', () => {
  const keyB64 = Buffer.from('test-metadata-key-exactly-32bytes!').toString('base64');

  test('deriveMetadataKey is deterministic', async () => {
    const key1 = await deriveMetadataKey(keyB64);
    const key2 = await deriveMetadataKey(keyB64);

    // Encrypt with key1, decrypt with key2 — same key material should succeed
    const ct = await encryptField('determinism-check', key1);
    const pt = await decryptField(ct, key2);
    expect(pt).toBe('determinism-check');

    // Different base64 input → different key → decrypt fails
    const otherB64 = crypto.randomBytes(32).toString('base64');
    const otherKey = await deriveMetadataKey(otherB64);
    const pt2 = await decryptField(ct, otherKey);
    expect(pt2).toBe('[decryption failed]');
  });

  test('encryptField -> decryptField round-trip', async () => {
    const key = await deriveMetadataKey(keyB64);
    const result = await encryptField('hello', key);

    // Parse the envelope and check structure
    const envelope = JSON.parse(result);
    expect(envelope.v).toBe(1);
    expect(envelope.alg).toBe('SG-META');
    expect(typeof envelope.iv).toBe('string');
    expect(envelope.iv.length).toBeGreaterThan(0);
    expect(typeof envelope.ct).toBe('string');
    expect(envelope.ct.length).toBeGreaterThan(0);

    // Round-trip
    const decrypted = await decryptField(result, key);
    expect(decrypted).toBe('hello');
  });

  test('decryptField passes plaintext unchanged', async () => {
    const key = await deriveMetadataKey(keyB64);
    const plaintext = 'not-encrypted-json';
    const result = await decryptField(plaintext, key);
    expect(result).toBe('not-encrypted-json');
  });

  test('tampered ciphertext returns [decryption failed]', async () => {
    const key = await deriveMetadataKey(keyB64);
    const result = await encryptField('test', key);
    const envelope = JSON.parse(result);

    // Corrupt the ct field
    envelope.ct = Buffer.from('tampered-data').toString('base64');
    const corrupted = JSON.stringify(envelope);

    const decrypted = await decryptField(corrupted, key);
    expect(decrypted).toBe('[decryption failed]');
  });

  test('wrong key returns [decryption failed]', async () => {
    const key1 = await deriveMetadataKey(keyB64);
    const otherB64 = crypto.randomBytes(32).toString('base64');
    const key2 = await deriveMetadataKey(otherB64);

    const ct = await encryptField('secret', key1);
    const decrypted = await decryptField(ct, key2);
    expect(decrypted).toBe('[decryption failed]');
  });

  test('empty string passes through', async () => {
    const key = await deriveMetadataKey(keyB64);
    const result = await encryptField('', key);
    expect(result).toBe('');
  });

  test('isEncryptedField identifies SG-META envelopes', () => {
    expect(isEncryptedField('{"v":1,"alg":"SG-META","iv":"xxx","ct":"xxx"}')).toBe(true);
  });

  test('isEncryptedField rejects ShellCryption blobs', () => {
    expect(isEncryptedField('{"v":1,"alg":"AES-GCM-256","iv":"xxx","ct":"xxx","aad":"xxx"}')).toBe(false);
  });

  test('isEncryptedField rejects other alg values', () => {
    expect(isEncryptedField('{"v":1,"alg":"other","iv":"xxx"}')).toBe(false);
  });

  test('isEncryptedField rejects plaintext', () => {
    expect(isEncryptedField('plaintext')).toBe(false);
  });

  test('isEncryptedField rejects empty string', () => {
    expect(isEncryptedField('')).toBe(false);
  });
});

// ─── API: metadata encryption active ────────────────────────────────────────

describe('API: metadata encryption active', () => {
  let token: string;

  beforeAll(async () => {
    const identity = generateTestIdentity();
    const keyHash = await hashToken(identity.key);

    // Register via the API
    const regRes = await request(srv.app)
      .post('/api/auth/register')
      .send({ uuid: identity.uuid, username: `enc_${identity.uuid.slice(0, 8)}`, keyHash });
    expect(regRes.status).toBe(201);

    // Exchange for a token
    token = await getAuthToken(srv.app, identity.uuid, keyHash);
    expect(token).toMatch(/^api-/);
  });

  test('vault pearl POST -> GET returns plaintext metadata', async () => {
    const id = crypto.randomUUID();
    const blob = fakeShellCryption(id);

    const postRes = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id,
        title: 'My Bank Password',
        secret: blob,
        username: 'bankuser',
        url: 'https://bank.example',
        type: 'password',
        category: 'Finance',
        notes: 'checking account',
      })
      .expect(201);

    // POST response should return plaintext metadata
    expect(postRes.body.data.title).toBe('My Bank Password');
    expect(postRes.body.data.category).toBe('Finance');

    // GET should also return plaintext
    const getRes = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const found = (getRes.body.data as any[]).find((r: any) => r.id === id);
    expect(found).toBeDefined();
    expect(found!.title).toBe('My Bank Password');
    expect(found!.username).toBe('bankuser');
    expect(found!.url).toBe('https://bank.example');
    expect(found!.category).toBe('Finance');
    expect(found!.notes).toBe('checking account');
  });

  test('vault pearl title is SG-META encrypted in direct SQL', async () => {
    const id = crypto.randomUUID();
    const blob = fakeShellCryption(id);

    await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id,
        title: 'Encrypted In DB',
        secret: blob,
        category: 'Secret',
      })
      .expect(201);

    // Read directly from the database — should be a SG-META envelope
    expect(srv.db).toBeDefined();
    const row = srv.db!
      .prepare('SELECT title FROM vault_pearls WHERE id = ?')
      .get(id) as { title: string };

    expect(isEncryptedField(row.title)).toBe(true);
    const envelope = JSON.parse(row.title);
    expect(envelope.v).toBe(1);
    expect(envelope.alg).toBe('SG-META');
    expect(typeof envelope.iv).toBe('string');
    expect(typeof envelope.ct).toBe('string');
  });

  test('ShellCryption blob is NOT re-encrypted by metadata layer', async () => {
    const id = crypto.randomUUID();
    const blob = fakeShellCryption(id);

    await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id,
        title: 'Blob Integrity Check',
        secret: blob,
      })
      .expect(201);

    // The secret column should be EXACTLY the blob we posted
    const row = srv.db!
      .prepare('SELECT secret FROM vault_pearls WHERE id = ?')
      .get(id) as { secret: string };

    expect(row.secret).toBe(blob);
  });

  test('non-empty category default is encrypted when cipher is active', async () => {
    const id = crypto.randomUUID();
    const blob = fakeShellCryption(id);

    await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id,
        title: 'Category Test',
        secret: blob,
        category: '',
      })
      .expect(201);

    // The route does `category || 'Personal'`, so 'Personal' is the stored value.
    // Since 'Personal' is non-empty, metadataGuard encrypts it.
    const row = srv.db!
      .prepare('SELECT category FROM vault_pearls WHERE id = ?')
      .get(id) as { category: string };

    expect(row.category).not.toBe('');
    expect(isEncryptedField(row.category)).toBe(true);

    // But the API response should have returned plaintext 'Personal'
    const getRes = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const pearl = (getRes.body.data as any[]).find((r: any) => r.id === id);
    expect(pearl.category).toBe('Personal');
  });
});

// ─── Backward compatibility: plaintext passthrough ───────────────────────────

describe('Backward compatibility', () => {
  let token: string;
  const legacyId = crypto.randomUUID();

  beforeAll(async () => {
    const identity = generateTestIdentity();
    const keyHash = await hashToken(identity.key);

    const regRes = await request(srv.app)
      .post('/api/auth/register')
      .send({ uuid: identity.uuid, username: `legacy_${identity.uuid.slice(0, 8)}`, keyHash });
    expect(regRes.status).toBe(201);

    token = await getAuthToken(srv.app, identity.uuid, keyHash);
    expect(token).toMatch(/^api-/);

    // Insert a plaintext row directly into DB (simulating a legacy row)
    expect(srv.db).toBeDefined();
    srv.db!.prepare(`
      INSERT INTO vault_pearls (id, owner_uuid, title, secret, username, url, type, category, notes, totp_secret, attachments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      legacyId,
      identity.uuid,
      'Legacy Plaintext Title',
      fakeShellCryption(legacyId),
      'legacy_user',
      'https://legacy.example',
      'password',
      'Legacy',
      'pre-encryption data',
      '',
      '[]',
      new Date().toISOString(),
    );
  });

  test('plaintext metadata passthrough (legacy row)', async () => {
    const getRes = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const found = (getRes.body.data as any[]).find((r: any) => r.id === legacyId);
    expect(found).toBeDefined();
    // Plaintext should come back as-is — the decrypt path is a no-op for non-SG-META
    expect(found!.title).toBe('Legacy Plaintext Title');
    expect(found!.username).toBe('legacy_user');
    expect(found!.url).toBe('https://legacy.example');
    expect(found!.category).toBe('Legacy');
    expect(found!.notes).toBe('pre-encryption data');
  });
});