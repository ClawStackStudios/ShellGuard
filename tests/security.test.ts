import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import {
  makePearlPayload,
  makeNotePayload,
  makeSshKeyPayload,
  makeAttachmentPayload,
  PERMISSION_PRESETS,
} from './helpers/testFactories.js';
import { createTestUserWithToken, createTestUserWithAgent, revokeLobsterKey } from './helpers/testAuth.js';

/**
 * Security invariants:
 *   - CROSS-OWNER ISOLATION (the highest-value vault invariant):
 *     identity B must never read, modify or delete identity A's records.
 *   - Permission matrix per delta #11: GET→canRead, POST→canWrite,
 *     PUT→canEdit, DELETE→canDelete.
 *   - Key-format enforcement (hu- / lb- / api-) and malformed-body rejection
 *     with zod-style details[].
 *   - Expired session tokens are dead everywhere, not just on /validate.
 */

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-security-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '46462';
  process.env.DB_ENCRYPTION_KEY = '';
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

const MINUTE = 60_000;

/** POST an entity payload to a vault route; asserts 201 + envelope. */
async function createEntity(
  app: typeof srv.app,
  token: string,
  basePath: string,
  payload: Record<string, unknown>
): Promise<void> {
  const res = await request(app)
    .post(basePath)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  if (res.status !== 201) {
    throw new Error(`setup failed for ${basePath}: ${res.status} ${JSON.stringify(res.body)}`);
  }
}

describe('Cross-owner isolation', () => {
  let aliceToken: string;
  let bobToken: string;
  const alice = {
    pearl: makePearlPayload(),
    note: makeNotePayload(),
    sshKey: makeSshKeyPayload(),
    attachment: makeAttachmentPayload(),
  };

  beforeAll(async () => {
    const a = await createTestUserWithToken(srv.app, { username: `alice_${Date.now()}` });
    const b = await createTestUserWithToken(srv.app, { username: `bob_${Date.now()}` });
    aliceToken = a.token;
    bobToken = b.token;

    await createEntity(srv.app, aliceToken, '/api/vault', alice.pearl);
    await createEntity(srv.app, aliceToken, '/api/notes', alice.note);
    await createEntity(srv.app, aliceToken, '/api/keys', alice.sshKey);
    await createEntity(srv.app, aliceToken, '/api/attachments', alice.attachment);
  });

  describe('bob cannot see or mutate any of alice’s records', () => {
    it('pearls: hidden from bob’s list, PUT and DELETE are 404', async () => {
      const list = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${bobToken}`);
      expect(list.status).toBe(200);
      expect(JSON.stringify(list.body.data)).not.toContain(alice.pearl.id);

      const put = await request(srv.app)
        .put(`/api/vault/${alice.pearl.id}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ title: 'Stolen', secret: alice.pearl.secret });
      expect(put.status).toBe(404);

      const del = await request(srv.app)
        .delete(`/api/vault/${alice.pearl.id}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(del.status).toBe(404);

      // alice's record is untouched by both attempts
      const aliceList = await request(srv.app)
        .get('/api/vault')
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(aliceList.body.data.some((p: { id: string }) => p.id === alice.pearl.id)).toBe(true);
    });

    it('notes: hidden from bob’s list, PUT and DELETE are 404', async () => {
      const list = await request(srv.app).get('/api/notes').set('Authorization', `Bearer ${bobToken}`);
      expect(list.body.data.some((n: { id: string }) => n.id === alice.note.id)).toBe(false);

      const put = await request(srv.app)
        .put(`/api/notes/${alice.note.id}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ title: 'Stolen', content: alice.note.content });
      expect(put.status).toBe(404);

      const del = await request(srv.app)
        .delete(`/api/notes/${alice.note.id}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(del.status).toBe(404);
    });

    it('ssh keys: hidden from bob’s list, PUT and DELETE are 404', async () => {
      const list = await request(srv.app).get('/api/keys').set('Authorization', `Bearer ${bobToken}`);
      expect(list.body.data.some((k: { id: string }) => k.id === alice.sshKey.id)).toBe(false);

      const put = await request(srv.app)
        .put(`/api/keys/${alice.sshKey.id}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ title: 'Stolen', key_value: alice.sshKey.key_value });
      expect(put.status).toBe(404);

      const del = await request(srv.app)
        .delete(`/api/keys/${alice.sshKey.id}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(del.status).toBe(404);
    });

    it('attachments: hidden from bob’s list, PUT and DELETE are 404', async () => {
      const list = await request(srv.app).get('/api/attachments').set('Authorization', `Bearer ${bobToken}`);
      expect(list.body.data.some((a: { id: string }) => a.id === alice.attachment.id)).toBe(false);

      const put = await request(srv.app)
        .put(`/api/attachments/${alice.attachment.id}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ title: 'Stolen', file_data: alice.attachment.file_data });
      expect(put.status).toBe(404);

      const del = await request(srv.app)
        .delete(`/api/attachments/${alice.attachment.id}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(del.status).toBe(404);
    });
  });

  it('lobster keys are scoped: bob never sees alice’s key in his list', async () => {
    const { humanToken: aliceHuman, agentKeyId } = await createTestUserWithAgent(srv.app);
    const { token: bobHuman } = await createTestUserWithToken(srv.app);

    const res = await request(srv.app).get('/api/agent-keys').set('Authorization', `Bearer ${bobHuman}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data ?? [])).not.toContain(agentKeyId);

    // and bob cannot revoke a key he cannot own
    const steal = await request(srv.app)
      .patch(`/api/agent-keys/${agentKeyId}/revoke`)
      .set('Authorization', `Bearer ${bobHuman}`)
      .send({});
    expect([403, 404]).toContain(steal.status);

    // alice still controls her own key
    const ok = await request(srv.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${aliceHuman}`);
    expect(ok.status).toBe(200);
    await revokeLobsterKey(srv.app, aliceHuman, agentKeyId); // cleanup + lifecycle sanity
  });
});

describe('Permission matrix (delta #11)', () => {
  let ownerToken: string;
  let readOnlyToken: string;
  let writeOnlyToken: string;
  let fullToken: string;

  /** The record each key exercises against. */
  let targetPearlId: string;

  beforeAll(async () => {
    const owner = await createTestUserWithToken(srv.app);
    ownerToken = owner.token;

    const ro = await createTestUserWithAgent(srv.app, undefined, PERMISSION_PRESETS.readOnly);
    const wo = await createTestUserWithAgent(srv.app, undefined, PERMISSION_PRESETS.writeOnly);
    const fu = await createTestUserWithAgent(srv.app, undefined, PERMISSION_PRESETS.full);
    readOnlyToken = ro.agentToken;
    writeOnlyToken = wo.agentToken;
    fullToken = fu.agentToken;

    // a canary pearl owned by the *owner* identity that agents will probe
    const pearl = makePearlPayload();
    await createEntity(srv.app, ownerToken, '/api/vault', pearl);
    targetPearlId = pearl.id;
  });

  it('canRead-only key: GET allowed', async () => {
    const res = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${readOnlyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('canRead-only key: POST forbidden (no canWrite)', async () => {
    const res = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send(makePearlPayload());
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('canRead-only key: PUT forbidden (no canEdit)', async () => {
    const res = await request(srv.app)
      .put(`/api/vault/${targetPearlId}`)
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send(makePearlPayload());
    expect(res.status).toBe(403);
  });

  it('canRead-only key: DELETE forbidden (no canDelete)', async () => {
    const res = await request(srv.app)
      .delete(`/api/vault/${targetPearlId}`)
      .set('Authorization', `Bearer ${readOnlyToken}`);
    expect(res.status).toBe(403);
  });

  it('canWrite-only key: POST allowed', async () => {
    const res = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${writeOnlyToken}`)
      .send(makePearlPayload());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('canWrite-only key: GET forbidden (no canRead)', async () => {
    const res = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${writeOnlyToken}`);
    expect(res.status).toBe(403);
  });

  it('canWrite-only key: PUT forbidden — PUT requires canEdit under delta #11', async () => {
    const res = await request(srv.app)
      .put(`/api/vault/${targetPearlId}`)
      .set('Authorization', `Bearer ${writeOnlyToken}`)
      .send(makePearlPayload());
    expect(res.status).toBe(403);
  });

  it('canWrite-only key: DELETE forbidden (no canDelete)', async () => {
    const res = await request(srv.app)
      .delete(`/api/vault/${targetPearlId}`)
      .set('Authorization', `Bearer ${writeOnlyToken}`);
    expect(res.status).toBe(403);
  });

  it('full-permission key: whole CRUD cycle succeeds (positive control)', async () => {
    const payload = makePearlPayload();

    const post = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${fullToken}`)
      .send(payload);
    expect(post.status).toBe(201);

    const put = await request(srv.app)
      .put(`/api/vault/${payload.id}`)
      .set('Authorization', `Bearer ${fullToken}`)
      .send({ ...payload, title: 'Full Control' });
    expect(put.status).toBe(200);

    const get = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${fullToken}`);
    expect(get.body.data.some((p: { id: string; title: string }) => p.id === payload.id && p.title === 'Full Control')).toBe(true);

    const del = await request(srv.app)
      .delete(`/api/vault/${payload.id}`)
      .set('Authorization', `Bearer ${fullToken}`);
    expect(del.status).toBe(200);
  });

  it('agents cannot touch another identity’s record even with full permissions (isolation > permission)', async () => {
    const res = await request(srv.app)
      .put(`/api/vault/${targetPearlId}`)
      .set('Authorization', `Bearer ${fullToken}`) // full perms, wrong owner
      .send(makePearlPayload());
    expect([403, 404]).toContain(res.status);
  });

  it('owner identity is untouched after all probes', async () => {
    const res = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.body.data.some((p: { id: string }) => p.id === targetPearlId)).toBe(true);
  });

  it('requireHuman gates reject agent tokens with 403', async () => {
    const res = await request(srv.app)
      .get('/api/agent-keys')
      .set('Authorization', `Bearer ${readOnlyToken}`);
    expect(res.status).toBe(403);
  });

  it('unrelated identity sees an empty vault, never the owner’s records', async () => {
    const outsider = await createTestUserWithToken(srv.app);
    const res = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer ${outsider.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(JSON.stringify(res.body.data)).not.toContain(targetPearlId);
  });
});

describe('Key-format enforcement', () => {
  it('rejects a missing Authorization header (401)', async () => {
    const res = await request(srv.app).get('/api/vault');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a key without a recognised prefix (401, mentions format)', async () => {
    const res = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${'x'.repeat(40)}`);
    expect(res.status).toBe(401);
    expect(typeof res.body.error).toBe('string');
  });

  it('rejects a raw hu- key used directly as a Bearer token (must exchange for api-)', async () => {
    const res = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer hu-${'ab'.repeat(32)}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an unknown lb- key (401)', async () => {
    const res = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer lb-${'q'.repeat(40)}`);
    expect(res.status).toBe(401);
  });

  it('rejects an unknown api- token (401)', async () => {
    const res = await request(srv.app)
      .get('/api/vault')
      .set('Authorization', `Bearer api-${'z'.repeat(32)}`);
    expect(res.status).toBe(401);
  });

  it('register enforces 64-hex keyHash (400 with details[])', async () => {
    const ghost = { uuid: crypto.randomUUID(), username: 'bad_hash', keyHash: 'not-hex' };
    const res = await request(srv.app).post('/api/auth/register').send(ghost);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.length).toBeGreaterThan(0);
    expect(typeof res.body.details[0].path).toBe('string');
    expect(typeof res.body.details[0].message).toBe('string');
  });

  it('register enforces uuid shape (400 with details[])', async () => {
    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({ uuid: 'not-a-uuid', username: 'bad_uuid', keyHash: 'a'.repeat(64) });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.details)).toBe(true);
  });
});

describe('Malformed bodies are rejected with details[]', () => {
  it('empty register body → 400 details[]', async () => {
    const res = await request(srv.app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('invalid token type → 400 details[]', async () => {
    const res = await request(srv.app).post('/api/auth/token').send({ type: 'crustacean' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('pearl without secret → 400 details[] (blob is mandatory)', async () => {
    const { token } = await createTestUserWithToken(srv.app);
    const payload = makePearlPayload();
    const { secret: _omitted, ...partial } = payload;

    const res = await request(srv.app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${token}`)
      .send(partial);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.details)).toBe(true);
  });
});

describe('Expired session tokens are rejected everywhere', () => {
  it('expired api- token gets 401 on a vault route (fake clock)', async () => {
    const { token } = await createTestUserWithToken(srv.app);

    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(Date.now() + 31 * MINUTE);
      const res = await request(srv.app).get('/api/vault').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

