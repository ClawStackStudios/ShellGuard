// tests/unit/sgtotpBackup.test.ts — sgtotp.bak compatibility layer tests.
// The encrypted fixture below replicates the Android ShellCryptionEngine contract:
// HKDF-SHA256 (ikm = export key, salt = ownerUuid, info = "clawchives-shellcryption-v1")
// → AES-GCM-256 with AAD "totp_backup:{ownerUuid}", envelope {v, alg, iv, ct, aad}.

import { describe, it, expect } from 'vitest';
import {
  sniffSgTotpBackup,
  parseSgTotpBackup,
  normalizeBase32Seed,
  mapSgTotpItemsToVaultItems,
  SGTOTP_BACKUP_TYPE,
  SGTOTP_PLAIN_FORMAT,
  type SgTotpBackupItem
} from '../../src/lib/sgtotpBackup.ts';
import { hkdfSha256, aesGcmEncrypt, sha256 } from '../../src/lib/webCryptoFallback.ts';

const enc = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function b64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function buildEncryptedEnvelope(items: SgTotpBackupItem[], exportKey: string, ownerUuid = 'local') {
  const plainJson = JSON.stringify(items, null, 4); // kotlinx prettyPrint-style
  const checksum = toHex(sha256(enc.encode(plainJson)));
  const aad = `totp_backup:${ownerUuid}`;
  const rawKey = hkdfSha256(enc.encode(exportKey), enc.encode(ownerUuid), enc.encode('clawchives-shellcryption-v1'), 32);
  const iv = enc.encode('0123456789ab').slice(0, 12); // deterministic test IV
  const ct = aesGcmEncrypt(rawKey, iv, enc.encode(plainJson), enc.encode(aad));
  return JSON.stringify({
    version: 1,
    type: SGTOTP_BACKUP_TYPE,
    format: 'sgtotp.bak',
    protectionMode: 'PIN',
    isBiometricEnabled: false,
    pinLength: 6,
    createdAt: 1725243851000,
    ownerUuid,
    itemCount: items.length,
    checksumSha256: checksum,
    encryptedEnvelopeJson: JSON.stringify({ v: 1, alg: 'AES-GCM-256', iv: b64(iv), ct: b64(ct), aad })
  });
}

const SAMPLE: SgTotpBackupItem = {
  id: 'android-uuid-1',
  ownerUuid: 'local',
  title: 'GitHub',
  username: 'lucas@example.com',
  category: 'Development',
  secret: 'JBSWY3DPEHPK3PXP',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  isLocalOnly: true,
  syncState: 'LOCAL',
  remoteUpdatedAt: null,
  localUpdatedAt: 1725243851000
};

describe('sniffSgTotpBackup', () => {
  it('detects encrypted envelopes', () => {
    expect(sniffSgTotpBackup(buildEncryptedEnvelope([SAMPLE], '123456'))).toBe('encrypted');
  });

  it('detects plain exports', () => {
    const raw = JSON.stringify({
      version: 1,
      format: SGTOTP_PLAIN_FORMAT,
      createdAt: 1,
      itemCount: 1,
      checksumSha256: 'x',
      items: [SAMPLE]
    });
    expect(sniffSgTotpBackup(raw)).toBe('plain');
  });

  it('detects bare item arrays', () => {
    expect(sniffSgTotpBackup(JSON.stringify([SAMPLE]))).toBe('array');
  });

  it('rejects non-JSON content', () => {
    expect(() => sniffSgTotpBackup('not json')).toThrow(/not valid JSON/);
  });

  it('rejects unrecognized JSON', () => {
    expect(() => sniffSgTotpBackup('{"hello":"world"}')).toThrow(/Not a recognized/);
  });
});

describe('parseSgTotpBackup — encrypted', () => {
  it('round-trips an encrypted envelope with the correct export key', () => {
    const raw = buildEncryptedEnvelope([SAMPLE], '123456');
    const parsed = parseSgTotpBackup(raw, '123456');
    expect(parsed.kind).toBe('encrypted');
    expect(parsed.ownerUuid).toBe('local');
    expect(parsed.protectionMode).toBe('PIN');
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].title).toBe('GitHub');
    expect(parsed.items[0].secret).toBe('JBSWY3DPEHPK3PXP');
  });

  it('rejects a wrong export key (GCM tag failure)', () => {
    const raw = buildEncryptedEnvelope([SAMPLE], '123456');
    expect(() => parseSgTotpBackup(raw, '999999')).toThrow();
  });

  it('requires an export key for encrypted envelopes', () => {
    const raw = buildEncryptedEnvelope([SAMPLE], '123456');
    expect(() => parseSgTotpBackup(raw)).toThrow('SGTOTP_MISSING_KEY');
  });

  it('rejects tampered checksums after successful decryption', () => {
    const raw = buildEncryptedEnvelope([SAMPLE], '123456');
    const obj = JSON.parse(raw);
    obj.checksumSha256 = '0'.repeat(64);
    expect(() => parseSgTotpBackup(JSON.stringify(obj), '123456')).toThrow(/checksum mismatch/);
  });

  it('rejects AAD substitution attacks', () => {
    const raw = buildEncryptedEnvelope([SAMPLE], '123456');
    const obj = JSON.parse(raw);
    const env = JSON.parse(obj.encryptedEnvelopeJson);
    env.aad = 'totp_backup:other-user';
    obj.encryptedEnvelopeJson = JSON.stringify(env);
    expect(() => parseSgTotpBackup(JSON.stringify(obj), '123456')).toThrow(/AAD mismatch/);
  });

  it('honours a non-default ownerUuid as HKDF salt and AAD record id', () => {
    const raw = buildEncryptedEnvelope([SAMPLE], '123456', 'user-abc');
    const parsed = parseSgTotpBackup(raw, '123456');
    expect(parsed.ownerUuid).toBe('user-abc');
    expect(parsed.items).toHaveLength(1);
  });
});

describe('parseSgTotpBackup — plaintext inputs', () => {
  it('parses plain exports', () => {
    const raw = JSON.stringify({ version: 1, format: SGTOTP_PLAIN_FORMAT, itemCount: 1, checksumSha256: 'x', items: [SAMPLE] });
    const parsed = parseSgTotpBackup(raw);
    expect(parsed.kind).toBe('plain');
    expect(parsed.items[0].secret).toBe('JBSWY3DPEHPK3PXP');
  });

  it('parses bare arrays with lenient optional fields', () => {
    const parsed = parseSgTotpBackup(JSON.stringify([{ id: 'a', title: 'T', secret: 'JBSWY3DPEHPK3PXP' }]));
    expect(parsed.kind).toBe('array');
    expect(parsed.items[0].algorithm).toBe('SHA1');
    expect(parsed.items[0].digits).toBe(6);
  });

  it('skips malformed entries instead of failing the whole import', () => {
    const parsed = parseSgTotpBackup(JSON.stringify([
      { title: 'no id', secret: 'JBSWY3DPEHPK3PXP' },
      SAMPLE,
      { id: 'x', title: 'no secret', secret: '' },
      null
    ]));
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].title).toBe('GitHub');
  });
});

describe('normalizeBase32Seed', () => {
  it('strips spaces, hyphens, and uppercases', () => {
    expect(normalizeBase32Seed('jbsw y3dp-ehp k3pxp')).toBe('JBSWY3DPEHPK3PXP');
  });

  it('rejects non-Base32 characters', () => {
    expect(() => normalizeBase32Seed('0189!@#$')).toThrow(/Invalid Base32/);
  });

  it('rejects too-short seeds', () => {
    expect(() => normalizeBase32Seed('JBSW')).toThrow(/too short/);
  });

  it('allows padding characters', () => {
    expect(normalizeBase32Seed('JBSWY3DP======')).toBe('JBSWY3DP======');
  });
});

describe('mapSgTotpItemsToVaultItems', () => {
  it('assigns fresh ids, normalizes categories, and produces password items with totp seeds', () => {
    let counter = 0;
    const mapped = mapSgTotpItemsToVaultItems([SAMPLE], () => `fresh-${++counter}`);
    expect(mapped).toHaveLength(1);
    const item = mapped[0];
    expect(item.id).toBe('fresh-1');
    expect(item.id).not.toBe(SAMPLE.id);
    expect(item.type).toBe('password');
    expect(item.title).toBe('GitHub');
    expect(item.username).toBe('lucas@example.com');
    expect(item.category).toBe('Development');
    expect(item.totp_secret).toBe('JBSWY3DPEHPK3PXP');
    expect(item.totpMeta).toEqual({ algorithm: 'SHA1', digits: 6, period: 30 });
    expect(item.secret).toBe('');
  });

  it('normalizes messy categories via normalizePod', () => {
    const mapped = mapSgTotpItemsToVaultItems(
      [{ ...SAMPLE, category: '  Work / DevOps  ' }],
      () => 'fresh'
    );
    expect(mapped[0].category).toBe('Work / DevOps');
  });

  it('normalizes the seed through the Base32 sanitizer', () => {
    const mapped = mapSgTotpItemsToVaultItems(
      [{ ...SAMPLE, secret: 'jbsw y3dpeh pk3pxp' }],
      () => 'fresh'
    );
    expect(mapped[0].totp_secret).toBe('JBSWY3DPEHPK3PXP');
  });

  it('rejects invalid seeds during mapping', () => {
    expect(() => mapSgTotpItemsToVaultItems([{ ...SAMPLE, secret: '!!!' }], () => 'fresh')).toThrow(/Invalid Base32/);
  });
});
