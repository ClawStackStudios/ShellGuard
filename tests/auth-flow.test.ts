import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import { newIdentity } from './helpers/testFactories.js';
import {
  getHumanToken,
  getAgentToken,
  createTestUser,
  createTestUserWithToken,
  createTestUserWithAgent,
  revokeLobsterKey,
} from './helpers/testAuth.js';

/**
 * Auth flow — registration, token exchange, TOKEN_TTL semantics (delta #1),
 * timing-safe rejection, validation endpoint, Lobster Key lifecycle and the
 * SG-only profile endpoints.
 */

// ─── Isolation preamble: MUST stay self-contained (see tests/README.md) ──────
// Runs BEFORE the dynamic server import below; the DB singleton evaluates
// against THIS suite's private DATA_DIR, and the module-level app.listen()
// claims THIS suite's own port so parallel suite files never collide.
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-auth-flow-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '46461';
  process.env.DB_ENCRYPTION_KEY = '';
  process.env.TOKEN_TTL_DEFAULT = '30m';
  // Neutralise rate limits so failure-path tests stay deterministic.
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

describe('POST /api/auth/register', () => {
  it('registers a fresh identity (201, success envelope)', async () => {
    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({ uuid: newIdentity().uuid, username: newIdentity().username, keyHash: newIdentity().keyHash });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.error).toBeUndefined();
  });

  it('rejects a duplicate username with 409', async () => {
    const first = await createTestUser(srv.app);

    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({
        uuid: newIdentity().uuid, // different uuid…
        username: first.username, // …same username
        keyHash: newIdentity().keyHash,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });
});

describe('POST /api/auth/token — human (hu-) exchange', () => {
  it('issues an api- token honouring TOKEN_TTL (30m)', async () => {
    const user = await createTestUser(srv.app);
    const before = Date.now();

    const res = await request(srv.app)
      .post('/api/auth/token')
      .send({ type: 'human', uuid: user.uuid, keyHash: user.keyHash });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toMatch(/^api-/);
    expect(res.body.data.type).toBe('human');

    const expiresAt = Date.parse(res.body.data.expiresAt);
    expect(Number.isNaN(expiresAt)).toBe(false);
    const ttl = expiresAt - before;
    expect(ttl).toBeGreaterThanOrEqual(30 * MINUTE - 2_000);
    expect(ttl).toBeLessThanOrEqual(30 * MINUTE + 10_000);
  });

  it("honours bare integer minutes — '1440' ≈ 24h (delta #1)", async () => {
    const user = await createTestUser(srv.app);
    process.env.TOKEN_TTL_DEFAULT = '1440';
    try {
      const before = Date.now();
      const res = await request(srv.app)
        .post('/api/auth/token')
        .send({ type: 'human', uuid: user.uuid, keyHash: user.keyHash });

      expect(res.status).toBe(201);
      const ttl = Date.parse(res.body.data.expiresAt) - before;
      expect(ttl).toBeGreaterThanOrEqual(24 * 60 * MINUTE - 2_000);
      expect(ttl).toBeLessThanOrEqual(24 * 60 * MINUTE + 10_000);
    } finally {
      process.env.TOKEN_TTL_DEFAULT = '30m';
    }
  });

  it("treats 'never' as a non-expiring token (expiresAt null)", async () => {
    const user = await createTestUser(srv.app);
    process.env.TOKEN_TTL_DEFAULT = 'never';
    try {
      const res = await request(srv.app)
        .post('/api/auth/token')
        .send({ type: 'human', uuid: user.uuid, keyHash: user.keyHash });

      expect(res.status).toBe(201);
      expect(res.body.data.expiresAt ?? null).toBeNull();
    } finally {
      process.env.TOKEN_TTL_DEFAULT = '30m';
    }
  });

  it('rejects a wrong keyHash with 401 (timing-safe path)', async () => {
    const user = await createTestUser(srv.app);
    const wrongHash = 'f'.repeat(64);

    const res = await request(srv.app)
      .post('/api/auth/token')
      .send({ type: 'human', uuid: user.uuid, keyHash: wrongHash });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });

  it('rejects a malformed-length keyHash with 401 (never 500)', async () => {
    const user = await createTestUser(srv.app);

    const res = await request(srv.app)
      .post('/api/auth/token')
      .send({ type: 'human', uuid: user.uuid, keyHash: 'tooshort' });

    expect([400, 401]).toContain(res.status); // schema-level 400 or compare-level 401 — never a crash
    expect(res.body.success).toBe(false);
  });

  it('returns 404 for an unregistered identity', async () => {
    const ghost = newIdentity();
    const res = await request(srv.app)
      .post('/api/auth/token')
      .send({ type: 'human', uuid: ghost.uuid, keyHash: ghost.keyHash });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/auth/validate', () => {
  it('validates a live human token', async () => {
    const { user, token } = await createTestUserWithToken(srv.app);

    const res = await request(srv.app).get('/api/auth/validate').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.keyType).toBe('human');
    expect(res.body.data.userUuid).toBe(user.uuid);
  });

  it('rejects a missing Authorization header with 401', async () => {
    const res = await request(srv.app).get('/api/auth/validate');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an expired token with 401 (fake-clock, no sleeps)', async () => {
    const { token } = await createTestUserWithToken(srv.app);

    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(Date.now() + 31 * MINUTE); // past the 30m TTL
      const res = await request(srv.app).get('/api/auth/validate').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('POST /api/auth/token — agent (lb-) issuance', () => {
  it('exchanges a Lobster Key for an agent api- token', async () => {
    const { agentApiKey } = await createTestUserWithAgent(srv.app);

    const res = await request(srv.app).post('/api/auth/token').send({ type: 'agent', ownerKey: agentApiKey });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toMatch(/^api-/);
    expect(res.body.data.type).toBe('agent');
  });

  it('validates the agent token as keyType "agent"', async () => {
    const { agentToken } = await createTestUserWithAgent(srv.app);

    const res = await request(srv.app).get('/api/auth/validate').set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.keyType).toBe('agent');
  });
});

describe('Lobster Key revocation lifecycle', () => {
  it('rejects the api- token AND the raw lb- key after revoke (401)', async () => {
    const { humanToken, agentApiKey, agentKeyId, agentToken } = await createTestUserWithAgent(srv.app);

    // sanity: live before revocation
    expect((await request(srv.app).get('/api/auth/validate').set('Authorization', `Bearer ${agentToken}`)).status).toBe(200);

    await revokeLobsterKey(srv.app, humanToken, agentKeyId);

    const viaToken = await request(srv.app)
      .get('/api/auth/validate')
      .set('Authorization', `Bearer ${agentToken}`);
    expect(viaToken.status).toBe(401);
    expect(viaToken.body.success).toBe(false);

    const viaRawKey = await request(srv.app)
      .get('/api/auth/validate')
      .set('Authorization', `Bearer ${agentApiKey}`);
    expect(viaRawKey.status).toBe(401);
  });

  it('refuses token issuance for an unknown lb- key (401)', async () => {
    const res = await request(srv.app)
      .post('/api/auth/token')
      .send({ type: 'agent', ownerKey: `lb-${'z'.repeat(40)}` });

    expect([400, 401]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

describe('SG-only profile endpoints (/api/auth/me, PUT /api/auth/profile)', () => {
  it('me returns the authenticated identity', async () => {
    const { user, token } = await createTestUserWithToken(srv.app);

    const res = await request(srv.app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uuid).toBe(user.uuid);
    expect(res.body.data.username).toBe(user.username);
    expect(res.body.data.displayName).toBeDefined();
  });

  it('PUT profile renames displayName and me reflects it', async () => {
    const { token } = await createTestUserWithToken(srv.app);

    const put = await request(srv.app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Renamed Lobster' });
    expect(put.status).toBe(200);
    expect(put.body.success).toBe(true);

    const me = await request(srv.app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.data.displayName).toBe('Renamed Lobster');
  });

  it('PUT profile rejects an empty displayName with 400', async () => {
    const { token } = await createTestUserWithToken(srv.app);

    const res = await request(srv.app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('forbids agent keys from profile endpoints (403, requireHuman)', async () => {
    const { agentToken } = await createTestUserWithAgent(srv.app);

    const me = await request(srv.app).get('/api/auth/me').set('Authorization', `Bearer ${agentToken}`);
    expect(me.status).toBe(403);

    const put = await request(srv.app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ displayName: 'Impostor' });
    expect(put.status).toBe(403);
  });

  it('me without a token is 401', async () => {
    const res = await request(srv.app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('token helper round-trip', () => {
  it('getHumanToken + getAgentToken succeed against the running app', async () => {
    const user = await createTestUser(srv.app);
    const token = await getHumanToken(srv.app, user.uuid, user.keyHash);
    expect(token).toMatch(/^api-/);

    const agent = await request(srv.app)
      .post('/api/agent-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'RoundTrip', permissions: { canRead: true } });
    expect(agent.status).toBe(201);
    const agentToken = await getAgentToken(srv.app, agent.body.data.apiKey);
    expect(agentToken).toMatch(/^api-/);
  });
});
