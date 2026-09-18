import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import { makeAttachmentPayload, uploadAttachment, oversizedBytes } from './helpers/testFactories.js';
import { createTestUserWithToken } from './helpers/testAuth.js';
import { migrateAttachmentBlobs } from '../src/server/database/attachmentBlobs.js';

/**
 * Phase 19 — Attachment BLOB migration & streaming oracle.
 *
 * Isolation: private DATA_DIR + reduced limits so the 413 paths are cheap:
 *   ATTACHMENT_MAX_MB=4 (per-file ceiling), GROTTO_QUOTA_MB=8 (per-owner quota).
 *
 * Asserts:
 *   - migration 0005 applied (size_bytes column + schema version 5)
 *   - legacy TEXT rows re-encoded to BLOB by migrateAttachmentBlobs (idempotent)
 *   - multi-chunk streamed download round-trips >1MB ciphertext exactly
 *   - 413 on per-file ceiling breach (mid-stream abort)
 *   - 413 on grotto quota breach
 */

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-attachments-blob-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64644';
  process.env.DB_ENCRYPTION_KEY = '';
  process.env.TOKEN_TTL_DEFAULT = '30m';
  process.env.AUTH_RATE_LIMIT = '1000000';
  process.env.AUTH_RATE_WINDOW = '600m';
  process.env.API_RATE_LIMIT = '1000000';
  process.env.API_RATE_WINDOW = '600m';
  process.env.ENFORCE_HTTPS = 'false';
  process.env.ATTACHMENT_MAX_MB = '4';
  process.env.GROTTO_QUOTA_MB = '8';
});

let srv!: ServerHandle;
let token: string;
let ownerUuid: string;

beforeAll(async () => {
  srv = await loadServer();
  const user = await createTestUserWithToken(srv.app);
  token = user.token;
  ownerUuid = user.user.uuid;
});

afterAll(async () => {
  await releaseServer(srv);
});

function expectErrorEnvelope(body: Record<string, unknown>): void {
  expect(body.success).toBe(false);
  expect(typeof body.error).toBe('string');
  expect((body.error as string).length).toBeGreaterThan(0);
}

describe('Migration 0005 — BLOB storage & legacy backfill', () => {
  it('applied: schema version 5 recorded and size_bytes column exists', () => {
    if (!srv.db) throw new Error('server module does not export `db`');
    const ver = srv.db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get() as { v: number };
    expect(ver.v).toBeGreaterThanOrEqual(5);

    const cols = srv.db.prepare('PRAGMA table_info(vault_secure_attachments)').all() as { name: string }[];
    const names = cols.map((c) => c.name);
    expect(names).toContain('size_bytes');
    expect(names).toContain('file_data');
  });

  it('re-encodes legacy TEXT rows to BLOB with exact size_bytes, idempotently', () => {
    if (!srv.db) throw new Error('server module does not export `db`');

    // Simulate a pre-0005 row that survived migration 0005's verbatim copy as TEXT.
    const legacyCiphertext = Buffer.from('legacy-shellcryption-envelope-{"v":1,"alg":"AES-GCM-256"}', 'utf8');
    const legacyId = 'legacy-text-row-0001';
    srv.db!
      .prepare(`INSERT INTO vault_secure_attachments (id, owner_uuid, title, file_data, file_name, mime_type, category, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .run(legacyId, ownerUuid, 'Legacy Row', legacyCiphertext.toString('utf8'), 'legacy.enc', '', '');

    // First pass: re-encodes.
    migrateAttachmentBlobs(srv.db!);

    const row1 = srv.db!
      .prepare("SELECT file_data, size_bytes, typeof(file_data) AS kind FROM vault_secure_attachments WHERE id = ?")
      .get(legacyId) as { file_data: Buffer; size_bytes: number; kind: string };
    expect(row1.kind).toBe('blob');
    expect(row1.file_data).toStrictEqual(legacyCiphertext);
    expect(row1.size_bytes).toBe(legacyCiphertext.length);

    // Second pass: no-op (idempotent — BLOB rows are skipped).
    migrateAttachmentBlobs(srv.db!);
    const row2 = srv.db!
      .prepare("SELECT file_data, size_bytes FROM vault_secure_attachments WHERE id = ?")
      .get(legacyId) as { file_data: Buffer; size_bytes: number };
    expect(row2.file_data).toStrictEqual(legacyCiphertext);
    expect(row2.size_bytes).toBe(legacyCiphertext.length);
  });
});

describe('Streaming & limits', () => {
  let fill1Id = ''; // set by the quota test; reused by the DELETE test

  it(
    'streams a >1MB ciphertext back in exact chunks (substr-based BLOB reads)',
    async () => {
      // 1.5MB of ciphertext — spans 2 × 1MB chunk reads.
      const payload = makeAttachmentPayload({ file_data: oversizedBytes(1.5 * 1024 * 1024) });
      const up = await uploadAttachment(srv.app, token, payload);
      expect(up.status).toBe(201);

      const down = await request(srv.app)
        .get(`/api/attachments/${payload.id}/file`)
        .set('Authorization', `Bearer ${token}`);

      expect(down.status).toBe(200);
      expect(down.headers['content-length']).toBe(String(payload.file_data.length));
      expect(Buffer.compare(down.body as Buffer, payload.file_data as Buffer)).toBe(0);
    },
    30_000
  );

  it(
    'rejects a per-file breach (4MB ceiling) with 413 and stores nothing',
    async () => {
      const payload = makeAttachmentPayload({ file_data: oversizedBytes(4 * 1024 * 1024 + 1024) });
      const res = await uploadAttachment(srv.app, token, payload);

      expect(res.status).toBe(413);
      expectErrorEnvelope(res.body);

      if (!srv.db) throw new Error('server module does not export `db`');
      const row = srv.db.prepare('SELECT id FROM vault_secure_attachments WHERE id = ?').get(payload.id);
      expect(row).toBeUndefined();
    },
    30_000
  );

  it(
    'rejects a grotto-quota breach with 413',
    async () => {
      // Quota = 8MB. Prior usage ≤ 1.5MB; two 3MB uploads stay under
      // (≤7.5MB), the next 1MB upload breaches.
      const fill1 = makeAttachmentPayload({ file_data: oversizedBytes(3 * 1024 * 1024) });
      const fill2 = makeAttachmentPayload({ file_data: oversizedBytes(3 * 1024 * 1024) });
      expect((await uploadAttachment(srv.app, token, fill1)).status).toBe(201);
      expect((await uploadAttachment(srv.app, token, fill2)).status).toBe(201);
      fill1Id = fill1.id;

      const breach = makeAttachmentPayload({ file_data: oversizedBytes(1024 * 1024) });
      const res = await uploadAttachment(srv.app, token, breach);

      expect(res.status).toBe(413);
      expectErrorEnvelope(res.body);
      expect(res.body.error).toContain('quota');

      // The breaching upload stored nothing.
      if (!srv.db) throw new Error('server module does not export `db`');
      const row = srv.db.prepare('SELECT id FROM vault_secure_attachments WHERE id = ?').get(breach.id);
      expect(row).toBeUndefined();
    },
    60_000
  );

  it('DELETE frees grotto quota (the deleted bytes count no more)', async () => {
    // The grotto is at 7.5MB after the quota test — a fresh 512KB upload
    // would breach (413). Delete fill1 (3MB) first; the same upload then fits.
    const probe = makeAttachmentPayload({ file_data: oversizedBytes(512 * 1024) });
    const before = await uploadAttachment(srv.app, token, probe);
    expect(before.status).toBe(413);

    const del = await request(srv.app)
      .delete(`/api/attachments/${fill1Id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const after = await uploadAttachment(srv.app, token, probe);
    expect(after.status).toBe(201);
  });
});