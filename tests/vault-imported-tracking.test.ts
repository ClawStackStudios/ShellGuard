import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import {
  makePearlPayload,
  makeNotePayload,
  makeSshKeyPayload,
  makeAttachmentPayload,
  uploadAttachment,
  createLobsterKey,
  PERMISSION_PRESETS,
} from './helpers/testFactories.js';
import {
  createTestUserWithToken,
  createSecondUser,
  getAgentToken,
} from './helpers/testAuth.js';

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-vault-imported-tracking-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64658';
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

describe('Phase 26: Import Lifecycle Tracking, Ephemeral Quarantine & Batch Operations', () => {
  describe('Gate 1 & 2: Schema Migration & Bulk Import Stamping', () => {
    it('stamps import_batch_id and imported_at on POST /api/vault/bulk-import', async () => {
      const items = [makePearlPayload(), makePearlPayload()];

      const res = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inserted).toHaveLength(2);
      expect(res.body.data.import_batch_id).toMatch(/^imp_[0-9a-f-]+$/);
      expect(new Date(res.body.data.imported_at).getTime()).toBeGreaterThan(0);

      // Verify direct database persistence
      const row = srv.db?.prepare('SELECT imported_at, import_batch_id FROM vault_pearls WHERE id = ?').get(items[0].id) as any;
      expect(row.import_batch_id).toBe(res.body.data.import_batch_id);
      expect(row.imported_at).toBe(res.body.data.imported_at);

      // Verify GET /api/vault returns the stamped fields
      const getRes = await request(srv.app)
        .get('/api/vault')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.status).toBe(200);
      const fetchedItem = getRes.body.data.find((i: any) => i.id === items[0].id);
      expect(fetchedItem).toBeDefined();
      expect(fetchedItem.import_batch_id).toBe(res.body.data.import_batch_id);
      expect(fetchedItem.imported_at).toBe(res.body.data.imported_at);
    });
  });

  describe('Gate 3: Auto-Graduate on Edit Semantics', () => {
    it('clears imported_at and import_batch_id when updating an imported pearl via PUT /api/vault/:id', async () => {
      const item = makePearlPayload({ category: 'Personal' });
      const importRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [item] });

      expect(importRes.status).toBe(201);
      expect(importRes.body.data.import_batch_id).toBeTruthy();

      // Edit the pearl
      const updateRes = await request(srv.app)
        .put(`/api/vault/${item.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Graduated Pearl',
          secret: item.secret,
          username: item.username,
          category: 'Adopted',
        });

      expect(updateRes.status).toBe(200);

      // Verify database record has cleared import timestamps to NULL
      const row = srv.db?.prepare('SELECT imported_at, import_batch_id FROM vault_pearls WHERE id = ?').get(item.id) as any;
      expect(row.imported_at).toBeNull();
      expect(row.import_batch_id).toBeNull();
    });

    it('clears imported_at and import_batch_id when updating an imported note via PUT /api/notes/:id', async () => {
      const note = makeNotePayload();
      const batchId = 'imp_test_note_batch';
      const importedAt = new Date().toISOString();

      // Insert directly as if imported
      srv.db?.prepare(`
        INSERT INTO vault_secure_notes (id, owner_uuid, title, content, category, tags, custom_fields, attachments, created_at, imported_at, import_batch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(note.id, userA.uuid, note.title, note.content, note.category, '[]', '', '[]', new Date().toISOString(), importedAt, batchId);

      // Edit the note
      const updateRes = await request(srv.app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Graduated Note',
          content: note.content,
          category: 'Work',
        });

      expect(updateRes.status).toBe(200);

      const row = srv.db?.prepare('SELECT imported_at, import_batch_id FROM vault_secure_notes WHERE id = ?').get(note.id) as any;
      expect(row.imported_at).toBeNull();
      expect(row.import_batch_id).toBeNull();
    });

    it('clears imported_at and import_batch_id when updating an imported SSH key via PUT /api/keys/:id', async () => {
      const key = makeSshKeyPayload();
      const batchId = 'imp_test_key_batch';
      const importedAt = new Date().toISOString();

      srv.db?.prepare(`
        INSERT INTO vault_ssh_keys (id, owner_uuid, title, key_value, username, category, tags, custom_fields, attachments, created_at, imported_at, import_batch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(key.id, userA.uuid, key.title, key.key_value, key.username, key.category, '[]', '', '[]', new Date().toISOString(), importedAt, batchId);

      // Edit the SSH key
      const updateRes = await request(srv.app)
        .put(`/api/keys/${key.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Graduated SSH Key',
          key_value: key.key_value,
          username: 'deploy',
          category: 'Servers',
        });

      expect(updateRes.status).toBe(200);

      const row = srv.db?.prepare('SELECT imported_at, import_batch_id FROM vault_ssh_keys WHERE id = ?').get(key.id) as any;
      expect(row.imported_at).toBeNull();
      expect(row.import_batch_id).toBeNull();
    });
  });

  describe('Gate 4: Batch Operations API (Graduate & Revert)', () => {
    it('POST /api/vault/import-batches/:id/graduate atomically graduates all items in the batch', async () => {
      const item1 = makePearlPayload();
      const item2 = makePearlPayload();

      const importRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [item1, item2] });

      const batchId = importRes.body.data.import_batch_id;

      // Add a note and key to the same batch
      const note = makeNotePayload();
      const key = makeSshKeyPayload();
      srv.db?.prepare(`
        INSERT INTO vault_secure_notes (id, owner_uuid, title, content, category, tags, custom_fields, attachments, created_at, imported_at, import_batch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(note.id, userA.uuid, note.title, note.content, 'Personal', '[]', '', '[]', new Date().toISOString(), importRes.body.data.imported_at, batchId);

      srv.db?.prepare(`
        INSERT INTO vault_ssh_keys (id, owner_uuid, title, key_value, username, category, tags, custom_fields, attachments, created_at, imported_at, import_batch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(key.id, userA.uuid, key.title, key.key_value, 'deploy', 'Servers', '[]', '', '[]', new Date().toISOString(), importRes.body.data.imported_at, batchId);

      // Graduate the batch
      const gradRes = await request(srv.app)
        .post(`/api/vault/import-batches/${batchId}/graduate`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(gradRes.status).toBe(200);
      expect(gradRes.body.success).toBe(true);
      expect(gradRes.body.data.graduated_count).toBe(4);

      // Verify all 4 items have NULL imported fields
      const p1 = srv.db?.prepare('SELECT import_batch_id FROM vault_pearls WHERE id = ?').get(item1.id) as any;
      const p2 = srv.db?.prepare('SELECT import_batch_id FROM vault_pearls WHERE id = ?').get(item2.id) as any;
      const n1 = srv.db?.prepare('SELECT import_batch_id FROM vault_secure_notes WHERE id = ?').get(note.id) as any;
      const k1 = srv.db?.prepare('SELECT import_batch_id FROM vault_ssh_keys WHERE id = ?').get(key.id) as any;

      expect(p1.import_batch_id).toBeNull();
      expect(p2.import_batch_id).toBeNull();
      expect(n1.import_batch_id).toBeNull();
      expect(k1.import_batch_id).toBeNull();
    });

    it('enforces cross-owner isolation on batch graduation', async () => {
      const item = makePearlPayload();
      const importRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [item] });

      const batchId = importRes.body.data.import_batch_id;

      // User B attempts to graduate User A's batch
      const gradResB = await request(srv.app)
        .post(`/api/vault/import-batches/${batchId}/graduate`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(gradResB.status).toBe(200);
      expect(gradResB.body.data.graduated_count).toBe(0);

      // Item remains quarantined under User A
      const row = srv.db?.prepare('SELECT import_batch_id FROM vault_pearls WHERE id = ?').get(item.id) as any;
      expect(row.import_batch_id).toBe(batchId);
    });

    it('DELETE /api/vault/import-batches/:id transactionally reverts batch and cascades linked attachments', async () => {
      const itemWithAtt = makePearlPayload();
      const importRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [itemWithAtt] });

      const batchId = importRes.body.data.import_batch_id;

      // Upload attachment linked to the imported parent item
      const att = makeAttachmentPayload({ parent_id: itemWithAtt.id, parent_type: 'password' });
      const uploadRes = await uploadAttachment(srv.app, tokenA, att);
      expect(uploadRes.status).toBe(201);

      // Revert the batch
      const revertRes = await request(srv.app)
        .delete(`/api/vault/import-batches/${batchId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(revertRes.status).toBe(200);
      expect(revertRes.body.success).toBe(true);
      expect(revertRes.body.data.deleted_count).toBe(1);
      expect(revertRes.body.data.deleted_attachments).toBeGreaterThanOrEqual(1);

      // Verify item deleted
      const pearlRow = srv.db?.prepare('SELECT * FROM vault_pearls WHERE id = ?').get(itemWithAtt.id);
      expect(pearlRow).toBeUndefined();

      // Verify attachment deleted
      const attRow = srv.db?.prepare('SELECT * FROM vault_secure_attachments WHERE id = ?').get(att.id);
      expect(attRow).toBeUndefined();

      // Verify audit event
      const auditRow = srv.auditDb?.prepare("SELECT * FROM audit_logs WHERE action = 'import_batch_reverted' ORDER BY id DESC LIMIT 1").get() as any;
      expect(auditRow).toBeDefined();
    });

    it('enforces cross-owner isolation on batch revert (returns 404)', async () => {
      const item = makePearlPayload();
      const importRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [item] });

      const batchId = importRes.body.data.import_batch_id;

      // User B attempts to delete User A's batch
      const revertResB = await request(srv.app)
        .delete(`/api/vault/import-batches/${batchId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(revertResB.status).toBe(404);

      // Item still exists for User A
      const pearlRow = srv.db?.prepare('SELECT * FROM vault_pearls WHERE id = ?').get(item.id);
      expect(pearlRow).toBeDefined();
    });
  });

  describe('Permission Gates', () => {
    it('enforces canEdit for graduation and canDelete for reversion', async () => {
      const item = makePearlPayload();
      const importRes = await request(srv.app)
        .post('/api/vault/bulk-import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [item] });

      const batchId = importRes.body.data.import_batch_id;

      // Read-only agent cannot graduate or delete
      const readOnlyAgent = await createLobsterKey(srv.app, tokenA, PERMISSION_PRESETS.readOnly, 'Read-Only Agent');
      const readOnlyToken = await getAgentToken(srv.app, readOnlyAgent.apiKey);

      const gradRes = await request(srv.app)
        .post(`/api/vault/import-batches/${batchId}/graduate`)
        .set('Authorization', `Bearer ${readOnlyToken}`);
      expect(gradRes.status).toBe(403);

      const revertRes = await request(srv.app)
        .delete(`/api/vault/import-batches/${batchId}`)
        .set('Authorization', `Bearer ${readOnlyToken}`);
      expect(revertRes.status).toBe(403);

      // Write-only agent cannot graduate (needs canEdit) or delete (needs canDelete)
      const writeOnlyAgent = await createLobsterKey(srv.app, tokenA, PERMISSION_PRESETS.writeOnly, 'Write-Only Agent');
      const writeOnlyToken = await getAgentToken(srv.app, writeOnlyAgent.apiKey);

      const gradResWrite = await request(srv.app)
        .post(`/api/vault/import-batches/${batchId}/graduate`)
        .set('Authorization', `Bearer ${writeOnlyToken}`);
      expect(gradResWrite.status).toBe(403);
    });
  });
});
