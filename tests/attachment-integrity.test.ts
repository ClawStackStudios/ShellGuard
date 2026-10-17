import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { loadServer, releaseServer } from './helpers/testDb.js';
import { makeAttachmentPayload, uploadAttachment, makePearlPayload } from './helpers/testFactories.js';
import { createTestUserWithToken } from './helpers/testAuth.js';
import type { ServerHandle } from './helpers/testDb.js';

vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-attachment-integrity-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64645';
});

let srv: ServerHandle;
let token: string;
let userUuid: string;

beforeAll(async () => {
  srv = await loadServer();
  const auth = await createTestUserWithToken(srv.app);
  token = auth.token;
  userUuid = auth.user.uuid;
});

afterAll(async () => {
  await releaseServer(srv);
});

describe('Phase 23: Attachment Integrity & Contracts', () => {
  it('standalone attachment upload fails closed', async () => {
    const payload = makeAttachmentPayload(); // No parent_id
    const res = await uploadAttachment(srv.app, token, payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Attachments require a valid parent/);
  });

  it('attachment upload with non-existent parent fails', async () => {
    const payload = makeAttachmentPayload({ parent_id: 'no-exist', parent_type: 'password' });
    const res = await uploadAttachment(srv.app, token, payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Parent item not found/);
  });

  it('successful attachment linkage and retrieval', async () => {
    const pearl = makePearlPayload();
    await request(srv.app).post('/api/vault').set('Authorization', `Bearer ${token}`).send(pearl);

    const payload = makeAttachmentPayload({ parent_id: pearl.id, parent_type: 'password' });
    const res = await uploadAttachment(srv.app, token, payload);
    expect(res.status).toBe(201);

    // Check parent was updated
    const pRes = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${token}`);
    const parent = pRes.body.data.find((i: any) => i.id === pearl.id);
    expect(parent.attachments).toContain(payload.id);

    // Check retrieval
    const gRes = await request(srv.app).get('/api/attachments').set('Authorization', `Bearer ${token}`);
    const att = gRes.body.data.find((i: any) => i.id === payload.id);
    expect(att).toBeDefined();
    expect(att.parent_id).toBe(pearl.id);
    expect(att.parent_type).toBe('password');
  });

  it('notes reject secret payload', async () => {
    const res = await request(srv.app).post('/api/notes').set('Authorization', `Bearer ${token}`).send({
      id: 'note-secret', title: 'Note', content: 'xx', category: 'test', secret: 'xx'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation Error/i);
    expect(res.body.details[0].message).toMatch(/Notes cannot contain secret credentials/i);
  });

  it('quarantineOrphanAttachments links unparented attachments when found in parent lists, and marks unlinked ones as quarantined', async () => {
      // 1. Manually insert unlinked attachments
      const db = srv.db;
      if (!db) throw new Error('Database not found');

      db.prepare(`
          INSERT INTO vault_secure_attachments (id, owner_uuid, title, file_data, size_bytes, file_name, mime_type, category, created_at, is_quarantined)
          VALUES ('orphan-1', ?, 'Orphan 1', x'00', 4, 'o1.txt', 'text/plain', '', '2026-10-12T00:00:00Z', 0)
      `).run(userUuid);

      db.prepare(`
          INSERT INTO vault_secure_attachments (id, owner_uuid, title, file_data, size_bytes, file_name, mime_type, category, created_at, is_quarantined)
          VALUES ('orphan-2', ?, 'Orphan 2', x'00', 4, 'o2.txt', 'text/plain', '', '2026-10-12T00:00:00Z', 0)
      `).run(userUuid);

      // 2. Add orphan-1 to a parent's JSON
      const p2 = makePearlPayload();
      p2.type = 'identity';
      db.prepare(`
          INSERT INTO vault_pearls (id, owner_uuid, title, secret, username, url, type, category, notes, attachments, created_at)
          VALUES (?, ?, ?, 'sec', '', '', 'identity', '', '', '["orphan-1"]', '2026-10-12T00:00:00Z')
      `).run(p2.id, userUuid, p2.title);

      // 3. Run quarantine
      const { quarantineOrphanAttachments } = await import('../src/server/database/attachmentIntegrity.js');
      const result = quarantineOrphanAttachments(db);
      expect(result.linked).toBe(1);
      expect(result.quarantined).toBe(1);

      // 4. Verify orphan-1 is linked
      const att1 = db.prepare('SELECT parent_id, parent_type FROM vault_secure_attachments WHERE id = ?').get('orphan-1') as any;
      expect(att1.parent_id).toBe(p2.id);
      expect(att1.parent_type).toBe('identity');

      // 5. Verify orphan-2 is quarantined
      const att2 = db.prepare('SELECT is_quarantined FROM vault_secure_attachments WHERE id = ?').get('orphan-2') as any;
      expect(att2.is_quarantined).toBe(1);
  });

  it('quarantined attachments are excluded from GET /api/attachments and GET /api/attachments/:id/file', async () => {
       const db = srv.db;
      if (!db) throw new Error('Database not found');

      // Create quarantined attachment
      db.prepare(`
          INSERT INTO vault_secure_attachments (id, owner_uuid, title, file_data, size_bytes, file_name, mime_type, category, created_at, is_quarantined)
          VALUES ('quarantined-1', ?, 'Q 1', x'00', 4, 'q1.txt', 'text/plain', '', '2026-10-12T00:00:00Z', 1)
      `).run(userUuid);

      // Excluded from GET
      const res = await request(srv.app).get('/api/attachments').set('Authorization', `Bearer ${token}`);
      const found = res.body.data.find((a: any) => a.id === 'quarantined-1');
      expect(found).toBeUndefined();

      // Excluded from GET /:id/file
      const fileRes = await request(srv.app).get('/api/attachments/quarantined-1/file').set('Authorization', `Bearer ${token}`);
      expect(fileRes.status).toBe(404);
  });

  it('DELETE /api/attachments/:id purges ID from parent item JSON array', async () => {
    // 1. Create a parent item
    const pearl = makePearlPayload();
    await request(srv.app).post('/api/vault').set('Authorization', `Bearer ${token}`).send(pearl);

    // 2. Upload an attachment
    const payload = makeAttachmentPayload({ parent_id: pearl.id, parent_type: 'password' });
    const res = await uploadAttachment(srv.app, token, payload);
    expect(res.status).toBe(201);

    // 3. Verify it exists in parent's array
    let pRes = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${token}`);
    let parent = pRes.body.data.find((i: any) => i.id === pearl.id);
    expect(parent.attachments).toContain(payload.id);

    // 4. Delete the attachment
    const delRes = await request(srv.app).delete(`/api/attachments/${payload.id}`).set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);

    // 5. Verify it was removed from parent's array
    pRes = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${token}`);
    parent = pRes.body.data.find((i: any) => i.id === pearl.id);
    expect(parent.attachments).not.toContain(payload.id);
  });

  it('POST /api/attachments/quarantine/sweep runs isolation without reboot', async () => {
    const db = srv.db;
    if (!db) throw new Error('Database not found');

    // Create unparented attachment directly in DB
    db.prepare(`
        INSERT INTO vault_secure_attachments (id, owner_uuid, title, file_data, size_bytes, file_name, mime_type, category, created_at, is_quarantined)
        VALUES ('orphan-sweep', ?, 'Orphan Sweep', x'00', 4, 'sweep.txt', 'text/plain', '', '2026-10-12T00:00:00Z', 0)
    `).run(userUuid);

    // Call sweeper endpoint
    const res = await request(srv.app).post('/api/attachments/quarantine/sweep').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quarantined).toBeGreaterThanOrEqual(1);

    // Verify it was quarantined
    const row = db.prepare('SELECT is_quarantined FROM vault_secure_attachments WHERE id = ?').get('orphan-sweep') as any;
    expect(row.is_quarantined).toBe(1);
  });

  it('GET /api/attachments/quota accurately computes used and remaining capacity', async () => {
    const res = await request(srv.app).get('/api/attachments/quota').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.used_bytes).toBe('number');
    expect(typeof res.body.data.quota_bytes).toBe('number');
    expect(typeof res.body.data.remaining_bytes).toBe('number');
    expect(res.body.data.used_bytes + res.body.data.remaining_bytes).toBe(res.body.data.quota_bytes);
  });
});
