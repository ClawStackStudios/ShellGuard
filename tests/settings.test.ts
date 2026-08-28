import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import { createTestUserWithToken, createTestUserWithAgent } from './helpers/testAuth.js';

/**
 * Settings — per-user server-side preference KV (/api/settings/:key).
 * Human-only (requireHuman), arbitrary JSON objects up to the 256KB cap,
 * scoped strictly per identity.
 */

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-settings-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '54544';
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
let agentToken: string;

beforeAll(async () => {
  srv = await loadServer();
  const { token: t } = await createTestUserWithToken(srv.app);
  token = t;
  const { agentToken: at } = await createTestUserWithAgent(srv.app);
  agentToken = at;
});

afterAll(async () => {
  await releaseServer(srv);
});

describe('GET /api/settings/:key', () => {
  it('returns an empty object for an unset key (client applies defaults)', async () => {
    const res = await request(srv.app)
      .get('/api/settings/appearance')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({});
  });

  it('requires authentication (401)', async () => {
    const res = await request(srv.app).get('/api/settings/appearance');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('forbids Lobster Keys — settings are a human-only surface (403)', async () => {
    const res = await request(srv.app)
      .get('/api/settings/appearance')
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/settings/:key', () => {
  it('stores an arbitrary JSON object and returns the success envelope', async () => {
    const value = {
      theme: 'abyss',
      generator: { length: 24, symbols: true },
      pods: ['pearls', 'notes'],
      nested: { deep: { deeper: [1, 2, 3] } },
    };

    const put = await request(srv.app)
      .put('/api/settings/generator')
      .set('Authorization', `Bearer ${token}`)
      .send(value);
    expect(put.status).toBe(200);
    expect(put.body.success).toBe(true);

    const get = await request(srv.app)
      .get('/api/settings/generator')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.data).toEqual(value); // JSON round-trip fidelity
  });

  it('overwrites an existing key wholesale', async () => {
    await request(srv.app)
      .put('/api/settings/security')
      .set('Authorization', `Bearer ${token}`)
      .send({ timeoutMinutes: 5 });

    const overwrite = await request(srv.app)
      .put('/api/settings/security')
      .set('Authorization', `Bearer ${token}`)
      .send({ timeoutMinutes: 15, clipboardClearSeconds: 30 });
    expect(overwrite.status).toBe(200);

    const get = await request(srv.app)
      .get('/api/settings/security')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.data).toEqual({ timeoutMinutes: 15, clipboardClearSeconds: 30 });
  });

  it('forbids Lobster Keys (403, requireHuman)', async () => {
    const res = await request(srv.app)
      .put('/api/settings/generator')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ hacked: true });
    expect(res.status).toBe(403);
  });

  it('accepts a large-but-legal payload (~200KB)', async () => {
    const padding = 'x'.repeat(200 * 1024);
    const res = await request(srv.app)
      .put('/api/settings/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ padding });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  }, 20_000);

  it('rejects a payload beyond the 256KB cap (400/413)', async () => {
    const padding = 'x'.repeat(300 * 1024);
    const res = await request(srv.app)
      .put('/api/settings/toobig')
      .set('Authorization', `Bearer ${token}`)
      .send({ padding });

    expect([400, 413]).toContain(res.status);
    expect(res.body.success).toBe(false);
  }, 20_000);

  it('settings are per-user: another identity reads its own empty state', async () => {
    // seed under first identity
    await request(srv.app)
      .put('/api/settings/private-pref')
      .set('Authorization', `Bearer ${token}`)
      .send({ mine: true });

    const other = await createTestUserWithToken(srv.app);
    const res = await request(srv.app)
      .get('/api/settings/private-pref')
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });
});
