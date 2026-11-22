import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import fs from 'fs';

const dataDir: string = vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-bulk-idemp-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.DB_ENCRYPTION_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  return dir;
});

const srv = await import('../../server.js');
const { db, auditDb } = srv;

describe('Bulk-Import Idempotent Upsert, Cross-Owner Isolation & MetadataGuard URIs Parity (Issue #34)', () => {
  let aliceToken: string;
  let bobToken: string;

  const pearlId = '11111111-1111-4111-8111-111111111111';
  const identityId = '22222222-2222-4222-8222-222222222222';
  const noteId = '33333333-3333-4333-8333-333333333333';
  const keyId = '44444444-4444-4444-8444-444444444444';

  beforeAll(async () => {
    await request(srv.app).post('/api/auth/register').send({
      uuid: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      username: 'alice_idemp',
      displayName: 'Alice',
      keyHash: 'a'.repeat(64),
    });
    const aliceLogin = await request(srv.app).post('/api/auth/token').send({
      uuid: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      keyHash: 'a'.repeat(64),
    });
    aliceToken = aliceLogin.body.data.token;

    await request(srv.app).post('/api/auth/register').send({
      uuid: 'bbbb2222-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      username: 'bob_idemp',
      displayName: 'Bob',
      keyHash: 'b'.repeat(64),
    });
    const bobLogin = await request(srv.app).post('/api/auth/token').send({
      uuid: 'bbbb2222-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      keyHash: 'b'.repeat(64),
    });
    bobToken = bobLogin.body.data.token;
  });

  afterAll(() => {
    db.close();
    auditDb.close();
    fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  it('upserts existing same-owner UUIDs cleanly across password, identity, note, and key domains', async () => {
    const initialRes = await request(srv.app)
      .post('/api/vault/bulk-import')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        items: [
          {
            id: pearlId,
            title: 'Bank v1',
            secret: 'enc_secret_1',
            uris: '["https://bank.example"]',
            type: 'password',
          },
          {
            id: identityId,
            title: 'Jane Identity v1',
            secret: 'enc_iden_1',
            type: 'identity',
          },
          {
            id: noteId,
            title: 'Note v1',
            secret: 'enc_note_1',
            type: 'note',
          },
          {
            id: keyId,
            title: 'SSH Key v1',
            secret: 'enc_key_1',
            type: 'key',
          },
        ],
      });

    expect(initialRes.status).toBe(201);
    expect(initialRes.body.data.inserted).toHaveLength(4);
    expect(initialRes.body.data.errors).toBeUndefined();

    // Re-import exact same UUIDs with updated metadata/secrets
    const reimportRes = await request(srv.app)
      .post('/api/vault/bulk-import')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        items: [
          {
            id: pearlId,
            title: 'Bank v2',
            secret: 'enc_secret_2',
            uris: '["https://bank.example/v2"]',
            type: 'password',
          },
          {
            id: identityId,
            title: 'Jane Identity v2',
            secret: 'enc_iden_2',
            type: 'identity',
          },
          {
            id: noteId,
            title: 'Note v2',
            secret: 'enc_note_2',
            type: 'note',
          },
          {
            id: keyId,
            title: 'SSH Key v2',
            secret: 'enc_key_2',
            type: 'key',
          },
        ],
      });

    expect(reimportRes.status).toBe(201);
    expect(reimportRes.body.data.inserted).toEqual([pearlId, identityId, noteId, keyId]);
    expect(reimportRes.body.data.errors).toBeUndefined();

    // Verify Layer-2 MetadataGuard encrypted uris on disk AND decrypted on GET /api/vault
    const rawRow = db.prepare('SELECT uris FROM vault_pearls WHERE id = ?').get(pearlId) as { uris: string };
    expect(rawRow.uris).not.toBe('["https://bank.example/v2"]');
    expect(rawRow.uris).toContain('"ct"');

    const getVault = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(getVault.status).toBe(200);
    const updatedPearl = getVault.body.data.find((p: any) => p.id === pearlId);
    expect(updatedPearl.title).toBe('Bank v2');
    expect(updatedPearl.uris).toBe('["https://bank.example/v2"]');
  });

  it('rejects cross-owner UUID collisions fail-closed without overwriting target owner data', async () => {
    const bobRes = await request(srv.app)
      .post('/api/vault/bulk-import')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        items: [
          {
            id: pearlId,
            title: 'Hijacked Bank',
            secret: 'evil_secret',
            type: 'password',
          },
        ],
      });

    expect(bobRes.status).toBe(207);
    expect(bobRes.body.data.inserted).toEqual([]);
    expect(bobRes.body.data.errors[0].reason).toContain('belongs to another owner');

    // Alice's record remains untouched
    const aliceGet = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer ${aliceToken}`);
    const alicePearl = aliceGet.body.data.find((p: any) => p.id === pearlId);
    expect(alicePearl.title).toBe('Bank v2');
  });
});
