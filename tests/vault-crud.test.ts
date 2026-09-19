import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer, SG_TABLES } from './helpers/testDb.js';
import {
  makePearlPayload,
  makeNotePayload,
  makeSshKeyPayload,
  makeAttachmentPayload,
  oversizedBytes,
  uploadAttachment,
} from './helpers/testFactories.js';
import { createTestUserWithToken } from './helpers/testAuth.js';
import { isEncryptedField } from '../src/server/utils/fieldEncryption.js';

/**
 * Vault CRUD ×3 primary entity types (pearls / secure notes / SSH keys) plus
 * the Phase 19 attachment BLOB contract (multipart POST, metadata-only list,
 * streamed GET /:id/file, 50MB ceiling, grotto quota).
 *
 * Asserts:
 *   - the EXACT {success,data} envelope on every response
 *   - THE OPACITY INVARIANT: whatever opaque ShellCryption blob the client
 *     posts is stored byte-for-byte. The server never transforms, decrypts
 *     or re-serialises payload fields — it cannot, it has no key.
 *   - metadata (category etc.) round-trips untouched
 *   - attachments: ciphertext BLOB round-trips via streamed download;
 *     the list endpoint NEVER carries file_data
 */

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-vault-crud-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64643';
  process.env.DB_ENCRYPTION_KEY = '';
  process.env.TOKEN_TTL_DEFAULT = '30m';
  process.env.AUTH_RATE_LIMIT = '1000000';
  process.env.AUTH_RATE_WINDOW = '600m';
  process.env.API_RATE_LIMIT = '1000000';
  process.env.API_RATE_WINDOW = '600m';
  process.env.ENFORCE_HTTPS = 'false';
  process.env.ATTACHMENT_MAX_MB = '50';
});

let srv!: ServerHandle;
let token: string;

beforeAll(async () => {
  srv = await loadServer();
  const user = await createTestUserWithToken(srv.app);
  token = user.token;
});

afterAll(async () => {
  await releaseServer(srv);
});

// ─── Envelope helpers ────────────────────────────────────────────────────────

function expectSuccessEnvelope(body: Record<string, unknown>): void {
  expect(body.success).toBe(true);
  expect('data' in body).toBe(true);
  expect(body.error).toBeUndefined();
}

function expectErrorEnvelope(body: Record<string, unknown>): void {
  expect(body.success).toBe(false);
  expect(typeof body.error).toBe('string');
  expect((body.error as string).length).toBeGreaterThan(0);
}

interface EntitySpec {
  label: string;
  basePath: string;
  /** field carrying the opaque client blob */
  blobField: string;
  makePayload: () => Record<string, unknown>;
  /** direct-SQL pin for the storage-layer half of the opacity invariant */
  storage: { table: string; blobColumn: string };
}

const ENTITIES: EntitySpec[] = [
  {
    label: 'vault pearls',
    basePath: '/api/vault',
    blobField: 'secret',
    makePayload: () => makePearlPayload(),
    storage: { table: SG_TABLES.pearls.table, blobColumn: SG_TABLES.pearls.blobColumn },
  },
  {
    label: 'secure notes',
    basePath: '/api/notes',
    blobField: 'content',
    makePayload: () => makeNotePayload(),
    storage: { table: SG_TABLES.notes.table, blobColumn: SG_TABLES.notes.blobColumn },
  },
  {
    label: 'ssh keys',
    basePath: '/api/keys',
    blobField: 'key_value',
    makePayload: () => makeSshKeyPayload(),
    storage: { table: SG_TABLES.sshKeys.table, blobColumn: SG_TABLES.sshKeys.blobColumn },
  },
];

// Phase 19: attachments left the generic CRUD matrix — their POST is multipart,
// their list response is metadata-only (file_data never leaves via GET /), and
// payloads stream from GET /:id/file. Dedicated suite below.

interface CreatedRecord {
  id: string;
  payload: Record<string, unknown>;
  blob: string;
}

async function createRecord(spec: EntitySpec, overrides?: Record<string, unknown>): Promise<CreatedRecord> {
  const payload = { ...spec.makePayload(), ...overrides };
  const res = await request(srv.app)
    .post(spec.basePath)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  if (res.status !== 201) {
    throw new Error(`setup POST ${spec.basePath} failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  expectSuccessEnvelope(res.body);
  return { id: payload.id as string, payload, blob: payload[spec.blobField] as string };
}

async function listRecords(basePath: string): Promise<Record<string, unknown>[]> {
  const res = await request(srv.app).get(basePath).set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expectSuccessEnvelope(res.body);
  expect(Array.isArray(res.body.data)).toBe(true);
  return res.body.data;
}

function findRecord(records: Record<string, unknown>[], id: string): Record<string, unknown> {
  const found = records.find((r) => r.id === id);
  expect(found, `record ${id} missing from listing`).toBeDefined();
  return found!;
}

// ─── The matrix ──────────────────────────────────────────────────────────────

describe.each(ENTITIES)('$label — CRUD × envelope × opacity', (spec) => {
  it('POST creates a record and echoes the {success,data} envelope', async () => {
    const payload = spec.makePayload();

    const res = await request(srv.app)
      .post(spec.basePath)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expectSuccessEnvelope(res.body);
    expect((res.body.data as Record<string, unknown>).id).toBe(payload.id);
  });

  it('OPACITY INVARIANT: GET list returns the posted blob byte-for-byte', async () => {
    const created = await createRecord(spec);

    const records = await listRecords(spec.basePath);
    const stored = findRecord(records, created.id);

    // exactly what the client sent — no re-encryption, no normalisation
    expect(stored[spec.blobField]).toStrictEqual(created.blob);
    expect(typeof stored[spec.blobField]).toBe('string');
  });

  it('OPACITY INVARIANT: storage layer holds the identical blob (direct-SQL half)', async () => {
    const created = await createRecord(spec);

    if (!srv.db) {
      throw new Error('server module does not export `db` — cannot verify storage-layer opacity');
    }
    const row = srv.db
      .prepare(`SELECT ${spec.storage.blobColumn} AS blob FROM ${spec.storage.table} WHERE id = ?`)
      .get(created.id) as { blob: string } | undefined;

    expect(row, `row ${created.id} not found in ${spec.storage.table}`).toBeDefined();
    expect(row!.blob).toStrictEqual(created.blob);
  });

  it('PUT updates metadata while preserving the blob byte-for-byte', async () => {
    const created = await createRecord(spec);
    const newTitle = `${spec.label} — updated`;

    const res = await request(srv.app)
      .put(`${spec.basePath}/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...created.payload, title: newTitle });

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res.body);

    const records = await listRecords(spec.basePath);
    const updated = findRecord(records, created.id);
    expect(updated.title).toBe(newTitle);
    // the blob survived the update untransformed
    expect(updated[spec.blobField]).toStrictEqual(created.blob);
  });

  it('metadata columns stored plaintext when DB_ENCRYPTION_KEY not set', async () => {
    // This suite runs without DB_ENCRYPTION_KEY, so fieldCipher is null.
    // After POST, title in DB should be the exact plaintext value.
    // The dedicated metadata-encryption.test.ts suite tests the encrypted case.
    const title = `Plaintext Metadata Test`;
    const entity = await createRecord(spec, { title });

    if (!srv.db) {
      throw new Error('server module does not export `db` — cannot verify storage-layer metadata');
    }
    const raw = srv.db
      .prepare(`SELECT title FROM ${spec.storage.table} WHERE id = ?`)
      .get(entity.id) as { title: string };

    expect(raw.title).toBe(title);
    expect(isEncryptedField(raw.title)).toBe(false);
  });

  it('category/folder metadata round-trips create → read', async () => {
    const created = await createRecord(spec);

    const records = await listRecords(spec.basePath);
    const found = findRecord(records, created.id);
    expect(found.category).toBe(created.payload.category);
  });

  it('DELETE removes the record from the listing', async () => {
    const created = await createRecord(spec);

    const del = await request(srv.app)
      .delete(`${spec.basePath}/${created.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expectSuccessEnvelope(del.body);

    const remaining = await listRecords(spec.basePath);
    expect(remaining.some((r) => r.id === created.id)).toBe(false);
  });

  it('DELETE of a nonexistent id is a 404 with an error envelope', async () => {
    const ghost = spec.makePayload();
    const res = await request(srv.app)
      .delete(`${spec.basePath}/${ghost.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expectErrorEnvelope(res.body);
  });
});

describe('Attachment BLOB contract (Phase 19)', () => {
  it('POST multipart creates an attachment and echoes the {success,data} envelope', async () => {
    const payload = makeAttachmentPayload();
    const res = await uploadAttachment(srv.app, token, payload);

    expect(res.status).toBe(201);
    expectSuccessEnvelope(res.body);
    expect((res.body.data as Record<string, unknown>).id).toBe(payload.id);
  });

  it('LIST is metadata-only: file_data never leaves via GET /', async () => {
    const payload = makeAttachmentPayload();
    await uploadAttachment(srv.app, token, payload);

    const records = await listRecords('/api/attachments');
    const stored = findRecord(records, payload.id);
    expect(stored).toBeDefined();
    expect('file_data' in stored).toBe(false);
    expect(stored.size_bytes).toBe((payload.file_data as Buffer).length);
  });

  it('OPACITY INVARIANT: storage layer holds the posted ciphertext bytes verbatim (direct-SQL half)', async () => {
    const payload = makeAttachmentPayload();
    await uploadAttachment(srv.app, token, payload);

    if (!srv.db) {
      throw new Error('server module does not export `db` — cannot verify storage-layer opacity');
    }
    const row = srv.db
      .prepare(`SELECT ${SG_TABLES.attachments.blobColumn} AS blob FROM ${SG_TABLES.attachments.table} WHERE id = ?`)
      .get(payload.id) as { blob: Buffer } | undefined;

    expect(row, `row ${payload.id} not found in ${SG_TABLES.attachments.table}`).toBeDefined();
    expect(Buffer.isBuffer(row!.blob)).toBe(true);
    expect(row!.blob).toStrictEqual(payload.file_data);
  });

  it('GET /:id/file streams the exact ciphertext bytes back', async () => {
    const payload = makeAttachmentPayload();
    await uploadAttachment(srv.app, token, payload);

    const res = await request(srv.app)
      .get(`/api/attachments/${payload.id}/file`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/octet-stream');
    expect(Buffer.compare(res.body as Buffer, payload.file_data as Buffer)).toBe(0);
  });

  it('PUT updates metadata only — the ciphertext blob survives untransformed', async () => {
    const payload = makeAttachmentPayload();
    await uploadAttachment(srv.app, token, payload);
    const newTitle = 'attachment — renamed';

    const res = await request(srv.app)
      .put(`/api/attachments/${payload.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: newTitle, file_name: payload.file_name, mime_type: payload.mime_type, category: payload.category });

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res.body);

    if (!srv.db) {
      throw new Error('server module does not export `db` — cannot verify storage-layer opacity');
    }
    const row = srv.db
      .prepare(`SELECT ${SG_TABLES.attachments.blobColumn} AS blob FROM ${SG_TABLES.attachments.table} WHERE id = ?`)
      .get(payload.id) as { blob: Buffer };
    expect(row.blob).toStrictEqual(payload.file_data);

    const records = await listRecords('/api/attachments');
    expect(findRecord(records, payload.id).title).toBe(newTitle);
  });

  it('rejects a JSON (non-multipart) POST with 415', async () => {
    const payload = makeAttachmentPayload();
    const res = await request(srv.app)
      .post('/api/attachments')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...payload, file_data: 'x' });

    expect(res.status).toBe(415);
    expectErrorEnvelope(res.body);
  });

  it(
    'rejects an upload past the 50MB per-file ceiling with 413',
    async () => {
      const payload = makeAttachmentPayload({ file_data: oversizedBytes(50 * 1024 * 1024 + 1024) });
      const res = await uploadAttachment(srv.app, token, payload);

      expect(res.status).toBe(413);
      expectErrorEnvelope(res.body);
    },
    60_000
  );

  it('stores arbitrary opaque bytes verbatim (server must NOT validate blob contents)', async () => {
    const payload = makeAttachmentPayload({ file_data: Buffer.from('definitely-not-a-real-envelope !!!', 'utf8') });
    const res = await uploadAttachment(srv.app, token, payload);
    expect(res.status).toBe(201);

    if (!srv.db) {
      throw new Error('server module does not export `db` — cannot verify storage-layer opacity');
    }
    const row = srv.db
      .prepare(`SELECT ${SG_TABLES.attachments.blobColumn} AS blob FROM ${SG_TABLES.attachments.table} WHERE id = ?`)
      .get(payload.id) as { blob: Buffer };
    expect(row.blob.toString('utf8')).toBe('definitely-not-a-real-envelope !!!');
  });
});

describe('Pearl → attachment cascade delete', () => {
  it('deleting a pearl removes every attachment it references', async () => {
    // Two attachments owned by the caller…
    const att1 = makeAttachmentPayload();
    const att2 = makeAttachmentPayload();
    expect((await uploadAttachment(srv.app, token, att1)).status).toBe(201);
    expect((await uploadAttachment(srv.app, token, att2)).status).toBe(201);

    // …linked from a pearl via the attachments JSON column (IDs only).
    const pearlPayload = makePearlPayload({
      attachments: JSON.stringify([att1.id, att2.id]),
    });
    const pearl = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .send(pearlPayload);
    expect(pearl.status).toBe(201);

    const del = await request(srv.app)
      .delete(`/api/vault/${pearlPayload.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expectSuccessEnvelope(del.body);

    const remaining = await listRecords('/api/attachments');
    expect(remaining.some((r) => r.id === att1.id)).toBe(false);
    expect(remaining.some((r) => r.id === att2.id)).toBe(false);
  });

  it('deleting a pearl with a malformed attachments column still succeeds', async () => {
    const pearlPayload = makePearlPayload({ attachments: 'not-json-at-all' });
    const pearl = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .send(pearlPayload);
    expect(pearl.status).toBe(201);

    const del = await request(srv.app)
      .delete(`/api/vault/${pearlPayload.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expectSuccessEnvelope(del.body);
  });

  it('cascade never crosses owner scope', async () => {
    // Attachments owned by the caller…
    const att = makeAttachmentPayload();
    expect((await uploadAttachment(srv.app, token, att)).status).toBe(201);

    // …but the pearl belongs to another owner referencing them.
    const other = await createTestUserWithToken(srv.app);
    const otherPearl = makePearlPayload({
      attachments: JSON.stringify([att.id]),
    });
    const created = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${other.token}`)
      .send(otherPearl);
    expect(created.status).toBe(201);

    await request(srv.app)
      .delete(`/api/vault/${otherPearl.id}`)
      .set('Authorization', `Bearer ${other.token}`);

    // The caller's attachment must survive the other owner's cascade delete.
    const remaining = await listRecords('/api/attachments');
    expect(remaining.some((r) => r.id === att.id)).toBe(true);
  });

  it('custom_fields roundtrips byte-for-byte on vault pearls, secure notes, and ssh keys', async () => {
    const customFieldsBlob = JSON.stringify([
      { id: 'cf-1', name: 'PIN', type: 'hidden', value: '1234' },
      { id: 'cf-2', name: 'Auto-renew', type: 'checkbox', value: 'true' }
    ]);

    // 1. Vault Pearl
    const pearlPayload = makePearlPayload({ custom_fields: customFieldsBlob });
    const pearlRes = await request(srv.app).post('/api/vault').set('Authorization', `Bearer ${token}`).send(pearlPayload);
    expect(pearlRes.status).toBe(201);
    const pearls = await listRecords('/api/vault');
    const storedPearl = findRecord(pearls, pearlPayload.id);
    expect(storedPearl.custom_fields).toBe(customFieldsBlob);

    // 2. Secure Note
    const notePayload = makeNotePayload({ custom_fields: customFieldsBlob });
    const noteRes = await request(srv.app).post('/api/notes').set('Authorization', `Bearer ${token}`).send(notePayload);
    expect(noteRes.status).toBe(201);
    const notes = await listRecords('/api/notes');
    const storedNote = findRecord(notes, notePayload.id);
    expect(storedNote.custom_fields).toBe(customFieldsBlob);

    // 3. SSH Key
    const keyPayload = makeSshKeyPayload({ custom_fields: customFieldsBlob });
    const keyRes = await request(srv.app).post('/api/keys').set('Authorization', `Bearer ${token}`).send(keyPayload);
    expect(keyRes.status).toBe(201);
    const keys = await listRecords('/api/keys');
    const storedKey = findRecord(keys, keyPayload.id);
    expect(storedKey.custom_fields).toBe(customFieldsBlob);
  });
});
