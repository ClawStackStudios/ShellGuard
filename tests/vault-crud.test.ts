import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer, SG_TABLES } from './helpers/testDb.js';
import {
  makePearlPayload,
  makeNotePayload,
  makeSshKeyPayload,
  makeAttachmentPayload,
  oversizedBase64,
} from './helpers/testFactories.js';
import { createTestUserWithToken } from './helpers/testAuth.js';
import { isEncryptedField } from '../src/server/utils/fieldEncryption.js';

/**
 * Vault CRUD ×4 entity types (pearls / secure notes / SSH keys / attachments).
 *
 * Asserts:
 *   - the EXACT {success,data} envelope on every response
 *   - THE OPACITY INVARIANT: whatever opaque ShellCryption blob the client
 *     posts is stored and returned byte-for-byte. The server never transforms,
 *     decrypts or re-serialises payload fields — it cannot, it has no key.
 *   - metadata (category etc.) round-trips untouched
 *   - the ~10MB base64 attachment cap rejects oversize payloads
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
  {
    label: 'secure attachments',
    basePath: '/api/attachments',
    blobField: 'file_data',
    makePayload: () => makeAttachmentPayload(),
    storage: { table: SG_TABLES.attachments.table, blobColumn: SG_TABLES.attachments.blobColumn },
  },
];

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

describe('Attachment size cap', () => {
  it(
    'rejects an attachment whose file_data exceeds the ~10MB base64 cap',
    async () => {
      // ≈11MB raw → ≈15.4MB of base64 chars: past the 14M-char cap (10MB raw
      // + envelope overhead), still under the dedicated 32mb body limit so
      // the app-level validator fires (not express).
      const payload = makeAttachmentPayload({
        file_data: oversizedBase64(11 * 1024 * 1024),
        title: 'Too Big For The Shell',
      });

      const res = await request(srv.app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      // 400 = zod/file_data cap; 413 = framework body guard. Both are honest rejections.
      expect([400, 413]).toContain(res.status);
      expectErrorEnvelope(res.body);
    },
    30_000
  );

  it('stores arbitrary opaque strings verbatim (server must NOT validate blob contents)', async () => {
    const spec = ENTITIES[3];

    const res = await request(srv.app)
      .post(spec.basePath)
      .set('Authorization', `Bearer ${token}`)
      .send(makeAttachmentPayload({ file_data: 'definitely-not-base64 !!!' }));
    expect(res.status).toBe(201);

    const records = await listRecords(spec.basePath);
    const junk = records.filter((r) => r.file_data === 'definitely-not-base64 !!!');
    expect(junk.length).toBeGreaterThan(0);
  });
});

describe('Pearl → attachment cascade delete', () => {
  it('deleting a pearl removes every attachment it references', async () => {
    // Two attachments owned by the caller…
    const att1 = await createRecord(ENTITIES[3]);
    const att2 = await createRecord(ENTITIES[3]);

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
    const att = await createRecord(ENTITIES[3]);

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
});
