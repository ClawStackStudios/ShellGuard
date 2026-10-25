import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { loadServer, releaseServer, ServerHandle } from './helpers/testDb.js';

vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-tls-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64646';
  process.env.ADMIN_TOKEN = 'test-admin-token-tls';
  process.env.DB_ENCRYPTION_KEY = '';
  process.env.TLS_ENABLED = 'true';
  process.env.DISABLE_SIGNUPS = 'true';
  process.env.ENFORCE_HTTPS = 'false';
  process.env.API_RATE_LIMIT = '1000000';
  process.env.AUTH_RATE_LIMIT = '1000000';
});

let srv!: ServerHandle;

beforeAll(async () => {
  srv = await loadServer();
  const { ensureTlsMaterials } = await import('../src/server/utils/tlsManager.js');
  await ensureTlsMaterials();
});

afterAll(async () => {
  await releaseServer(srv);
});

describe('TLS Control Plane & Share Signups', () => {
  it('serves tls manifest via public endpoint', async () => {
    const res = await request(srv.app).get('/api/public/tls-manifest');
    if (res.status !== 200) console.error(res.body);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('certFingerprint');
    // expect(res.headers).toHaveProperty('x-shellguard-rotation-proof');
  });

  // Genesis Rule check: User #1 registers on empty DB
  it('allows genesis user #1 to register when DISABLE_SIGNUPS=true', async () => {
    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: 'genesis_admin_tls_1',
        displayName: 'Genesis Admin',
        keyHash: '0000000000000000000000000000000000000000000000000000000000000000',
      });
    if (res.status !== 201) console.error(res.body);
    expect(res.status).toBe(201);
  });

  // User #2 blocked without invite
  it('blocks user #2 without an invite when signups disabled', async () => {
    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        username: 'intruder_tls_2',
        displayName: 'Intruder',
        keyHash: '1111111111111111111111111111111111111111111111111111111111111111',
      });
    if (res.status !== 403) console.error(res.body);
    expect(res.status).toBe(403);
  });
});
