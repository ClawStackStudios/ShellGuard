/**
 * TLS Manager — self-signed certificate generation for LAN HTTPS.
 *
 * Isolation model (same as every suite): DATA_DIR is set via vi.hoisted()
 * BEFORE the module under test is imported, so the connection singleton and
 * CERT_DIR resolve inside a throwaway directory.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ─── Isolation preamble: MUST stay self-contained (see tests/README.md) ──────
const tlsDataDir: string = vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-tls-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  return dir;
});

const { ensureTlsMaterials, collectSubjectAltNames } = await import('../src/server/utils/tlsManager.js');
// The tlsManager pulls DATA_DIR from the connection singleton — keep a handle
// so afterAll can close the DB before rmdir (otherwise WAL files are recreated
// mid-delete and the cleanup throws ENOTEMPTY).
const { db, auditDb } = await import('../src/server/database/index.js');

describe('TLS Manager — self-signed certificate lifecycle', () => {
  let materials: Awaited<ReturnType<typeof ensureTlsMaterials>>;

  afterAll(() => {
    db.close();
    auditDb.close();
    fs.rmSync(tlsDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  it('generates a self-signed certificate pair on first call', async () => {
    materials = await ensureTlsMaterials();

    expect(materials.generated).toBe(true);
    expect(fs.existsSync(materials.certPath)).toBe(true);
    expect(fs.existsSync(materials.keyPath)).toBe(true);
    expect(materials.cert).toContain('-----BEGIN CERTIFICATE-----');
    expect(materials.key).toMatch(/-----BEGIN (EC |)PRIVATE KEY-----/);
  });

  it('writes certs with owner-only permissions', () => {
    const certMode = fs.statSync(materials.certPath).mode & 0o777;
    const keyMode = fs.statSync(materials.keyPath).mode & 0o777;
    expect(certMode & 0o077).toBe(0); // no group/other bits
    expect(keyMode & 0o077).toBe(0);
  });

  it('embeds SANs covering localhost and detected LAN interfaces', () => {
    const x509 = new crypto.X509Certificate(materials.cert);
    const sans = x509.subjectAltName ?? '';

    expect(sans).toContain('localhost');
    expect(sans).toContain('IP Address:127.0.0.1');

    const collected = collectSubjectAltNames().map(n => n.ip ?? n.value);
    expect(collected).toContain('localhost');
  });

  it('is valid for ~10 years', () => {
    const x509 = new crypto.X509Certificate(materials.cert);
    // Node exposes validTo/validFrom as UTC strings (YYMMDDHHMMSSZ).
    const validFrom = new Date(x509.validFrom).getTime();
    const validTo = new Date(x509.validTo).getTime();
    const validityDays = (validTo - validFrom) / (24 * 60 * 60 * 1000);
    expect(validityDays).toBeGreaterThan(3600);
  });

  it('reuses the persisted certificate on subsequent calls (stable fingerprint)', async () => {
    const second = await ensureTlsMaterials();

    expect(second.generated).toBe(false);
    expect(second.fingerprint).toBe(materials.fingerprint);
    expect(second.cert).toBe(materials.cert);
  });

  it('honours BYO TLS_CERT_PATH / TLS_KEY_PATH over the generated pair', async () => {
    process.env.TLS_CERT_PATH = materials.certPath;
    process.env.TLS_KEY_PATH = materials.keyPath;
    try {
      const byo = await ensureTlsMaterials();
      expect(byo.generated).toBe(false);
      expect(byo.fingerprint).toBe(materials.fingerprint);
    } finally {
      delete process.env.TLS_CERT_PATH;
      delete process.env.TLS_KEY_PATH;
    }
  });

  it('rejects half-configured BYO paths', async () => {
    process.env.TLS_CERT_PATH = materials.certPath;
    try {
      await expect(ensureTlsMaterials()).rejects.toThrow(/must be set together/);
    } finally {
      delete process.env.TLS_CERT_PATH;
    }
  });

  it('serves a working HTTPS handshake with the generated materials', async () => {
    const srv = https.createServer({ key: materials.key, cert: materials.cert }, (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { status: 'ok' } }));
    });
    await new Promise<void>(resolve => srv.listen(0, '127.0.0.1', resolve));
    const addr = srv.address() as { port: number };

    try {
      const body = await new Promise<string>((resolve, reject) => {
        // rejectUnauthorized: false — the whole point of a self-signed cert.
        const req = https.get(
          { host: '127.0.0.1', port: addr.port, path: '/', rejectUnauthorized: false },
          res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve(data));
          },
        );
        req.on('error', reject);
      });
      expect(JSON.parse(body).data.status).toBe('ok');
    } finally {
      await new Promise<void>(resolve => srv.close(() => resolve()));
    }
  });
});