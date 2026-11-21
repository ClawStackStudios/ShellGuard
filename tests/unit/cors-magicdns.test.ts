import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import cors from 'cors';
import request from 'supertest';
import { getCorsConfig, isPrivateNetworkHostname } from '../../src/config/corsConfig.js';

describe('CORS Mesh & Origin Authorization for *.ts.net (Issue #22)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ORIGIN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('recognizes *.ts.net MagicDNS hosts, LAN IPs, and Tailscale IPs while rejecting lookalikes', () => {
    expect(isPrivateNetworkHostname('my-vault.tailscale.ts.net')).toBe(true);
    expect(isPrivateNetworkHostname('shellguard-01.tail1234.ts.net')).toBe(true);
    expect(isPrivateNetworkHostname('[fd7a:115c:a1e0::1]')).toBe(true);
    expect(isPrivateNetworkHostname('100.92.14.88')).toBe(true);
    expect(isPrivateNetworkHostname('192.168.1.50')).toBe(true);
    expect(isPrivateNetworkHostname('localhost')).toBe(true);

    expect(isPrivateNetworkHostname('ts.net')).toBe(false);
    expect(isPrivateNetworkHostname('evil.ts.net.attacker.com')).toBe(false);
    expect(isPrivateNetworkHostname('evil.com')).toBe(false);
  });

  it('allows credentialed requests and preflight from https://my-vault.tailscale.ts.net:6565 in LAN mode', async () => {
    const config = getCorsConfig();
    expect(config.credentials).toBe(true);

    const app = express();
    app.use(cors(config));
    app.get('/api/health', (_req, res) => res.json({ ok: true }));

    const origin = 'https://my-vault.tailscale.ts.net:6565';
    const res = await request(app).get('/api/health').set('Origin', origin);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');

    const preflight = await request(app)
      .options('/api/vault')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST');

    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe(origin);
    expect(preflight.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects arbitrary public domains in LAN mode', async () => {
    const config = getCorsConfig();
    const originFn = config.origin as (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => void;

    await expect(
      new Promise((resolve, reject) => {
        originFn('https://evil.com', (err, allow) => (err ? reject(err) : resolve(allow)));
      }),
    ).rejects.toThrow(/Public origins not allowed in LAN mode/);

    await expect(
      new Promise((resolve, reject) => {
        originFn('https://my-vault.ts.net.attacker.com', (err, allow) => (err ? reject(err) : resolve(allow)));
      }),
    ).rejects.toThrow(/Public origins not allowed in LAN mode/);
  });

  it('enforces explicit CORS_ORIGIN strictness when configured', async () => {
    process.env.CORS_ORIGIN = 'https://vault.example.com';
    const config = getCorsConfig();
    const originFn = config.origin as (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => void;

    const allowed = await new Promise((resolve, reject) => {
      originFn('https://vault.example.com', (err, allow) => (err ? reject(err) : resolve(allow)));
    });
    expect(allowed).toBe(true);

    await expect(
      new Promise((resolve, reject) => {
        originFn('https://my-vault.tailscale.ts.net:6565', (err, allow) => (err ? reject(err) : resolve(allow)));
      }),
    ).rejects.toThrow(/Origin not in allowed list/);
  });
});
