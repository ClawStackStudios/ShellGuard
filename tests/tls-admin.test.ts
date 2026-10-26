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
let adminCookie: string;

function sessionCookie(res: any): string {
  const setCookie: string[] = res.headers['set-cookie'] ?? [];
  const found = setCookie.find(c => c.startsWith('sg_admin_session='));
  if (!found) throw new Error('no sg_admin_session cookie in response');
  return found.split(';')[0];
}

beforeAll(async () => {
  srv = await loadServer();
  const { ensureTlsMaterials } = await import('../src/server/utils/tlsManager.js');
  await ensureTlsMaterials();

  const authRes = await request(srv.app)
    .post('/api/admin/auth')
    .send({ token: 'test-admin-token-tls' });
  expect(authRes.status).toBe(200);
  adminCookie = sessionCookie(authRes);
});

afterAll(async () => {
  await releaseServer(srv);
});

describe('TLS Control Plane & Share Signups', () => {
  let createdInviteToken: string;

  it('serves tls manifest via public endpoint', async () => {
    const res = await request(srv.app).get('/api/public/tls-manifest');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('certFingerprint');
    expect(res.body.data).toHaveProperty('instancePublicKey');
    expect(res.body.data).toHaveProperty('signature');
  });

  // Genesis Rule check: User #1 registers on empty DB
  it('allows genesis user #1 to register when DISABLE_SIGNUPS=true', async () => {
    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({
        uuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        username: 'genesis_admin',
        displayName: 'Genesis Admin',
        keyHash: '0000000000000000000000000000000000000000000000000000000000000000',
      });
    expect(res.status).toBe(201);
  });

  // User #2 blocked without invite
  it('blocks user #2 without an invite when signups disabled', async () => {
    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({
        uuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        username: 'intruder',
        displayName: 'Intruder',
        keyHash: '1111111111111111111111111111111111111111111111111111111111111111',
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Registration is invite-only');
  });

  it('allows SuperLobster admin to generate an invite token', async () => {
    const res = await request(srv.app)
      .post('/api/admin/invites')
      .set('Cookie', adminCookie)
      .send({ label: 'Test User Invite', ttl: '24h' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('inviteToken');
    expect(res.body.data.inviteToken).toMatch(/^inv_[a-f0-9]{48}$/);
    createdInviteToken = res.body.data.inviteToken;
  });

  it('validates invite token via /api/public/signup-status', async () => {
    const res = await request(srv.app)
      .get(`/api/public/signup-status?invite=${encodeURIComponent(createdInviteToken)}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.signupsAllowed).toBe(true);
    expect(res.body.data.reason).toBe('valid_invite');
  });

  it('allows user #2 to register with valid inviteToken', async () => {
    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({
        uuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        username: 'invited_lobster',
        displayName: 'Invited Lobster',
        keyHash: '2222222222222222222222222222222222222222222222222222222222222222',
        inviteToken: createdInviteToken,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('enforces atomic single-use burn: reused invite token is rejected with 403', async () => {
    const res = await request(srv.app)
      .post('/api/auth/register')
      .send({
        uuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        username: 'replayer',
        displayName: 'Replay Attacker',
        keyHash: '3333333333333333333333333333333333333333333333333333333333333333',
        inviteToken: createdInviteToken,
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Invalid or expired invite token');
  });

  it('returns active TLS status with pairing URI in SuperLobster admin', async () => {
    const res = await request(srv.app)
      .get('/api/admin/tls/status')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.enabled).toBe(true);
    expect(res.body.data.pairingUri).toContain('shellguard://pair?');
    expect(res.body.data.pairingUri).toContain('&fp=');
    expect(res.body.data.pairingUri).toContain('&ik=');
  });

  it('downloads public certificate without leaking private key', async () => {
    const res = await request(srv.app)
      .get('/api/admin/tls/cert')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.text).toContain('-----BEGIN CERTIFICATE-----');
    expect(res.text).not.toContain('PRIVATE KEY');
  });
});
