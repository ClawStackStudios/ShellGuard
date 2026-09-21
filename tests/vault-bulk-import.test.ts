import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import {
  makePearlPayload,
  makeAttachmentPayload,
  uploadAttachment,
  createLobsterKey,
  PERMISSION_PRESETS,
} from './helpers/testFactories.js';
import { createTestUserWithToken, createSecondUser, getAgentToken } from './helpers/testAuth.js';

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-vault-bulk-import-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64650';
  process.env.DB_ENCRYPTION_KEY = '';
  process.env.TOKEN_TTL_DEFAULT = '30m';
  process.env.AUTH_RATE_LIMIT = '1000000';
  process.env.AUTH_RATE_WINDOW = '600m';
  process.env.API_RATE_LIMIT = '1000000';
  process.env.API_RATE_WINDOW = '600m';
  process.env.ENFORCE_HTTPS = 'false';
});

let srv!: ServerHandle;
let tokenA: string;
let userA: { uuid: string; username: string };
let tokenB: string;
let userB: { uuid: string; username: string };

beforeAll(async () => {
  srv = await loadServer();
  const createdA = await createTestUserWithToken(srv.app);
  tokenA = createdA.token;
  userA = createdA.user;

  const createdB = await createSecondUser(srv.app);
  tokenB = createdB.token;
  userB = createdB.user;
});

afterAll(async () => {
  await releaseServer(srv);
});

describe('Phase 21: Bulk Import Endpoint & Batch Operations', () => {
  describe('POST /api/vault/bulk-import', () => {
    it('imports 100% valid items with HTTP 201 and proper envelope', async () => {
      const items = Array.from({ length: 5 }, () => makePearlPayload({ category: 'Finance' }));

      const res = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.inserted).toHaveLength(5);

      const db = srv.db;
      if (!db) throw new Error('Database handle missing');
      for (const item of items) {
        const row = db.prepare('SELECT id, owner_uuid, category FROM vault_pearls WHERE id = ?').get(item.id) as any;
        expect(row).toBeDefined();
        expect(row.owner_uuid).toBe(userA.uuid);
      }
    });

    it('handles partial failures with HTTP 207 Multi-Status (100 items / 2 malformed / 98 persisted)', async () => {
      const items: any[] = [];
      const malformedIndices = [12, 54];

      for (let i = 0; i < 100; i++) {
        if (i === 12) {
          // Missing required title
          items.push({
            id: `malformed-${i}-${Date.now()}`,
            secret: 'enc-secret-xyz',
            username: 'user12',
            type: 'password',
          });
        } else if (i === 54) {
          // Empty secret
          items.push({
            id: `malformed-${i}-${Date.now()}`,
            title: 'Malformed Item 54',
            secret: '',
            type: 'password',
          });
        } else {
          items.push(makePearlPayload({ title: `Bulk Pearl #${i}` }));
        }
      }

      const res = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items });

      expect(res.status).toBe(207);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.inserted).toHaveLength(98);
      expect(res.body.data.errors).toHaveLength(2);

      const errorIndices = res.body.data.errors.map((e: any) => e.index);
      expect(errorIndices).toContain(12);
      expect(errorIndices).toContain(54);

      const db = srv.db;
      if (!db) throw new Error('Database handle missing');

      // Verify 98 were actually written to database
      for (const id of res.body.data.inserted) {
        const row = db.prepare('SELECT id, owner_uuid FROM vault_pearls WHERE id = ?').get(id) as any;
        expect(row).toBeDefined();
        expect(row.owner_uuid).toBe(userA.uuid);
      }

      // Verify 2 malformed items were not inserted
      const malformedRow1 = db.prepare('SELECT id FROM vault_pearls WHERE id = ?').get(items[12].id);
      expect(malformedRow1).toBeUndefined();
      const malformedRow2 = db.prepare('SELECT id FROM vault_pearls WHERE id = ?').get(items[54].id);
      expect(malformedRow2).toBeUndefined();
    });

    it('enforces Layer 1 ciphertext opacity roundtrip', async () => {
      const customCiphertext = JSON.stringify({
        v: 1,
        alg: 'AES-GCM-256',
        iv: 'custom-iv-opaque-layer1',
        ct: 'secret-ciphertext-verbatim-roundtrip-content',
        aad: 'vault_pearls:custom-id',
      });

      const item = makePearlPayload({ secret: customCiphertext });

      const res = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [item] });

      expect(res.status).toBe(201);
      expect(res.body.data.inserted).toContain(item.id);

      const db = srv.db;
      if (!db) throw new Error('Database handle missing');
      const row = db.prepare('SELECT secret FROM vault_pearls WHERE id = ?').get(item.id) as any;
      expect(row.secret).toBe(customCiphertext);
    });

    it('rejects empty payload, oversized payloads, and invalid schemas with HTTP 400', async () => {
      // Empty array rejected by .min(1)
      const emptyRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [] });
      expect(emptyRes.status).toBe(400);

      // Non-array items
      const nonArrayRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: 'not-an-array' });
      expect(nonArrayRes.status).toBe(400);

      // Missing items
      const missingRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});
      expect(missingRes.status).toBe(400);

      // Invalid item type (e.g. attempting to import notes or attachments through pearl bulk import) rejected per-record
      const invalidTypeRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [{ ...makePearlPayload(), type: 'attachment' }] });
      expect(invalidTypeRes.status).toBe(207);
      expect(invalidTypeRes.body.data.inserted).toHaveLength(0);
      expect(invalidTypeRes.body.data.errors).toHaveLength(1);
    });

    it('enforces tenant isolation — User B cannot see User A bulk imports', async () => {
      const item = makePearlPayload({ title: 'Tenant A Secret Pearl' });

      await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [item] });

      const resB = await request(srv.app)
        .get('/api/vault')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      const bItemIds = resB.body.data.map((i: any) => i.id);
      expect(bItemIds).not.toContain(item.id);
    });

    it('enforces permission gate (canWrite required)', async () => {
      const readOnlyAgent = await createLobsterKey(srv.app, tokenA, PERMISSION_PRESETS.readOnly, 'Read-Only Agent');
      const agentToken = await getAgentToken(srv.app, readOnlyAgent.apiKey);

      const res = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ items: [makePearlPayload()] });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/vault/bulk', () => {
    it('deletes multiple owned pearls and returns HTTP 200 with deleted array', async () => {
      const items = [makePearlPayload(), makePearlPayload(), makePearlPayload()];

      await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items });

      const ids = items.map(i => i.id);
      const res = await request(srv.app)
        .delete('/api/vault/bulk')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ids });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toHaveLength(3);

      const db = srv.db;
      if (!db) throw new Error('Database handle missing');
      for (const id of ids) {
        const row = db.prepare('SELECT id FROM vault_pearls WHERE id = ?').get(id);
        expect(row).toBeUndefined();
      }
    });

    it('cascades bulk deletion to referenced secure attachments', async () => {
      // 1. Upload an attachment
      const attPayload = makeAttachmentPayload();
      const uploadRes = await uploadAttachment(srv.app, tokenA, attPayload);
      expect(uploadRes.status).toBe(201);

      // 2. Create a pearl referencing this attachment
      const pearl = makePearlPayload();
      const createRes = await request(srv.app)
        .post('/api/vault')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...pearl,
          attachments: JSON.stringify([attPayload.id]),
        });
      expect(createRes.status).toBe(201);

      const db = srv.db;
      if (!db) throw new Error('Database handle missing');

      // Verify attachment exists in db
      const preAtt = db.prepare('SELECT id FROM vault_secure_attachments WHERE id = ?').get(attPayload.id);
      expect(preAtt).toBeDefined();

      // 3. Bulk delete the pearl
      const delRes = await request(srv.app)
        .delete('/api/vault/bulk')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ids: [pearl.id] });

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.deleted).toContain(pearl.id);

      // 4. Verify cascade: both pearl and attachment are gone
      const postPearl = db.prepare('SELECT id FROM vault_pearls WHERE id = ?').get(pearl.id);
      expect(postPearl).toBeUndefined();

      const postAtt = db.prepare('SELECT id FROM vault_secure_attachments WHERE id = ?').get(attPayload.id);
      expect(postAtt).toBeUndefined();
    });

    it('returns HTTP 207 Multi-Status when some IDs do not exist', async () => {
      const existing = makePearlPayload();
      await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [existing] });

      const fakeId1 = '00000000-0000-0000-0000-000000000001';
      const fakeId2 = '00000000-0000-0000-0000-000000000002';

      const res = await request(srv.app)
        .delete('/api/vault/bulk')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ids: [existing.id, fakeId1, fakeId2] });

      expect(res.status).toBe(207);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toContain(existing.id);
      expect(res.body.data.errors).toHaveLength(2);
      const errorIds = res.body.data.errors.map((e: any) => e.id);
      expect(errorIds).toContain(fakeId1);
      expect(errorIds).toContain(fakeId2);
    });

    it('enforces cross-tenant protection — User B cannot delete User A pearls', async () => {
      const itemA = makePearlPayload({ title: 'Untouchable Pearl' });
      await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [itemA] });

      const resB = await request(srv.app)
        .delete('/api/vault/bulk')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ ids: [itemA.id] });

      // User B receives 207 with error 'Not found' because the item is not owned by B
      expect(resB.status).toBe(207);
      expect(resB.body.data.deleted).toHaveLength(0);
      expect(resB.body.data.errors).toHaveLength(1);
      expect(resB.body.data.errors[0].id).toBe(itemA.id);

      // Verify User A item is still intact
      const db = srv.db;
      if (!db) throw new Error('Database handle missing');
      const row = db.prepare('SELECT id FROM vault_pearls WHERE id = ?').get(itemA.id);
      expect(row).toBeDefined();
    });

    it('enforces permission gate (canDelete required)', async () => {
      const readWriteAgent = await createLobsterKey(srv.app, tokenA, PERMISSION_PRESETS.readWrite, 'Read-Write Agent');
      const agentToken = await getAgentToken(srv.app, readWriteAgent.apiKey);

      const res = await request(srv.app)
        .delete('/api/vault/bulk')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ ids: ['some-id'] });

      expect(res.status).toBe(403);
    });
  });
});
