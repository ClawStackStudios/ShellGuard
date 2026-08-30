/**
 * TLS certificate manager — self-signed cert generation for LAN HTTPS.
 *
 * When TLS_ENABLED=true and no explicit cert paths are provided, a stable
 * self-signed certificate is generated on first boot and persisted under
 * DATA_DIR/certs/. The certificate is REUSED on every subsequent boot so the
 * browser exception the user grants once stays valid indefinitely (TOFU).
 *
 * Subject Alternative Names cover localhost + every detected LAN interface so
 * a single warning is shown regardless of how the user reaches the instance.
 * BYO certs (TLS_CERT_PATH / TLS_KEY_PATH) take precedence when both are set.
 */

import selfsigned from 'selfsigned';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { DATA_DIR } from '../database/connection.js';

export interface TlsMaterials {
  key: string;
  cert: string;
  certPath: string;
  keyPath: string;
  /** SHA-256 fingerprint of the DER-encoded certificate (colon-hex). */
  fingerprint: string;
  /** true when the cert was freshly generated during this call. */
  generated: boolean;
}

const CERT_DIR = path.join(DATA_DIR, 'certs');
const DEFAULT_CERT_PATH = path.join(CERT_DIR, 'cert.pem');
const DEFAULT_KEY_PATH = path.join(CERT_DIR, 'key.pem');
const TEN_YEARS_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;

/** SHA-256 fingerprint of a PEM cert, colon-separated hex (browser style). */
function certFingerprint(pem: string): string {
  const x509 = new crypto.X509Certificate(pem);
  return x509.fingerprint256;
}

/**
 * Collect SAN entries: localhost + loopback + every non-internal interface
 * address (LAN IPv4/IPv6). Deduplicated. This is what keeps the browser
 * warning to exactly one per origin.
 */
export function collectSubjectAltNames(): Array<{ type: 2 | 7; value?: string; ip?: string }> {
  const altNames: Array<{ type: 2 | 7; value?: string; ip?: string }> = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
    { type: 7, ip: '::1' },
  ];
  const seen = new Set(['localhost', '127.0.0.1', '::1']);

  for (const iface of Object.values(os.networkInterfaces())) {
    for (const addr of iface ?? []) {
      if (!addr || addr.internal || seen.has(addr.address)) continue;
      seen.add(addr.address);
      // type 7 = IP address (v4 and v6), type 2 = DNS name
      altNames.push({ type: 7, ip: addr.address });
    }
  }
  return altNames;
}

/** Generate a fresh 10-year EC P-256 self-signed certificate pair. */
async function generateCertificate(): Promise<{ cert: string; key: string; fingerprint: string }> {
  const pems = await selfsigned.generate(
    [{ name: 'commonName', value: 'ShellGuard Self-Signed' }],
    {
      keyType: 'ec',
      curve: 'P-256',
      algorithm: 'sha256',
      notAfterDate: new Date(Date.now() + TEN_YEARS_MS),
      extensions: [
        { name: 'basicConstraints', cA: false, critical: true },
        { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
        { name: 'extKeyUsage', serverAuth: true },
        { name: 'subjectAltName', altNames: collectSubjectAltNames(), critical: false },
      ],
    },
  );
  const cert = pems.cert;
  const key = pems.private;
  // Always derive via certFingerprint (SHA-256) so generated and loaded
  // certs report the identical fingerprint format.
  return { cert, key, fingerprint: certFingerprint(cert) };
}

function persist(cert: string, key: string, certPath: string, keyPath: string): void {
  fs.mkdirSync(path.dirname(certPath), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.dirname(keyPath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(certPath, cert, { mode: 0o600 });
  fs.writeFileSync(keyPath, key, { mode: 0o600 });
  // Belt-and-braces: enforce perms on pre-existing files too (BYO case).
  fs.chmodSync(certPath, 0o600);
  fs.chmodSync(keyPath, 0o600);
}

/**
 * Resolve TLS materials in priority order:
 *   1. BYO: TLS_CERT_PATH + TLS_KEY_PATH (both required when either is set)
 *   2. Existing generated pair in DATA_DIR/certs/ (reused — stable fingerprint)
 *   3. Generate a new self-signed pair and persist it
 */
export async function ensureTlsMaterials(): Promise<TlsMaterials> {
  const byoCert = process.env.TLS_CERT_PATH;
  const byoKey = process.env.TLS_KEY_PATH;

  if (byoCert || byoKey) {
    if (!byoCert || !byoKey) {
      throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must be set together.');
    }
    const cert = fs.readFileSync(byoCert, 'utf8');
    const key = fs.readFileSync(byoKey, 'utf8');
    return { key, cert, certPath: byoCert, keyPath: byoKey, fingerprint: certFingerprint(cert), generated: false };
  }

  if (fs.existsSync(DEFAULT_CERT_PATH) && fs.existsSync(DEFAULT_KEY_PATH)) {
    const cert = fs.readFileSync(DEFAULT_CERT_PATH, 'utf8');
    const key = fs.readFileSync(DEFAULT_KEY_PATH, 'utf8');
    return { key, cert, certPath: DEFAULT_CERT_PATH, keyPath: DEFAULT_KEY_PATH, fingerprint: certFingerprint(cert), generated: false };
  }

  const { cert, key, fingerprint } = await generateCertificate();
  persist(cert, key, DEFAULT_CERT_PATH, DEFAULT_KEY_PATH);
  console.log(`[TLS] 🔐 Self-signed certificate generated at ${DEFAULT_CERT_PATH}`);
  console.log(`[TLS]    Fingerprint: ${fingerprint}`);
  console.log(`[TLS]    SANs: ${collectSubjectAltNames().map(n => n.ip ?? n.value).join(', ')}`);
  return { key, cert, certPath: DEFAULT_CERT_PATH, keyPath: DEFAULT_KEY_PATH, fingerprint, generated: true };
}