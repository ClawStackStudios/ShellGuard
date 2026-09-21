// tests/unit/vault-export.test.ts — Unit tests for ShellGuard export suite.
import { describe, it, expect } from 'vitest';
import {
  generateVaultCsv,
  encryptBackupPayload,
  decryptBackupPayload,
  isShellGuardEncryptedBackup,
} from '../../src/lib/vaultExport.ts';
import { VaultItem } from '../../src/types.ts';

describe('Vault Export & Encryption Suite', () => {
  const sampleItems: VaultItem[] = [
    {
      id: 'item-1',
      title: 'GitHub Personal',
      type: 'password',
      username: 'disperser',
      secret: 'super-secret-password-123!',
      url: 'https://github.com',
      category: 'Development',
      tags: JSON.stringify(['Work', 'Critical']),
      notes: 'Contains comma, and "quotes" here',
      totp_secret: 'JBSWY3DPEHPK3PXP',
      created_at: new Date().toISOString(),
    },
    {
      id: 'item-2',
      title: 'Server Root Note',
      type: 'note',
      secret: 'Server recovery procedures\nLine 2 info',
      category: 'Infrastructure',
      created_at: new Date().toISOString(),
    },
  ];

  it('generates compliant RFC 4180 CSV with passwords included', () => {
    const csv = generateVaultCsv(sampleItems, { includePasswords: true });

    expect(csv).toContain('Title,Category,Type,Username,Password,URL,Notes,TOTP,Tags,CustomFields');
    expect(csv).toContain('GitHub Personal,Development,password,disperser,super-secret-password-123!,https://github.com');
    expect(csv).toContain('"Contains comma, and ""quotes"" here"');
    expect(csv).toContain('JBSWY3DPEHPK3PXP');
    expect(csv).toContain('"Work, Critical"');
  });

  it('generates sanitized audit CSV with passwords omitted', () => {
    const csv = generateVaultCsv(sampleItems, { includePasswords: false });

    expect(csv).toContain('GitHub Personal,Development,password,disperser,,https://github.com');
    expect(csv).not.toContain('super-secret-password-123!');
  });

  it('encrypts and round-trips decrypted JSON payload via ClawKey', () => {
    const jsonStr = JSON.stringify(sampleItems);
    const clawKey = 'hu-abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

    const envelope = encryptBackupPayload(jsonStr, clawKey, 'json');
    expect(isShellGuardEncryptedBackup(envelope)).toBe(true);
    expect(envelope.v).toBe(1);
    expect(envelope.version).toBe(1);
    expect(envelope.kdf).toBe('hkdf');
    expect(envelope.kind).toBe('json');
    expect(envelope.payload).toBeDefined();

    const result = decryptBackupPayload(envelope, clawKey);
    expect(result.kind).toBe('json');
    expect(result.data).toBe(jsonStr);

    const parsed = JSON.parse(result.data);
    expect(parsed.length).toBe(2);
    expect(parsed[0].title).toBe('GitHub Personal');
  });

  it('encrypts and round-trips decrypted CSV payload via custom passphrase with PBKDF2', () => {
    const csvStr = generateVaultCsv(sampleItems);
    const passphrase = 'my-super-strong-custom-passphrase-2026';

    const envelope = encryptBackupPayload(csvStr, passphrase, 'csv');
    expect(isShellGuardEncryptedBackup(envelope)).toBe(true);
    expect(envelope.v).toBe(1);
    expect(envelope.version).toBe(1);
    expect(envelope.kdf).toBe('pbkdf2');
    expect(envelope.kdfIterations).toBe(100000);
    expect(envelope.kind).toBe('csv');

    const result = decryptBackupPayload(JSON.stringify(envelope), passphrase);
    expect(result.kind).toBe('csv');
    expect(result.data).toBe(csvStr);
  });

  it('rejects decryption with the wrong passphrase or key', () => {
    const jsonStr = JSON.stringify({ test: 'hello' });
    const envelope = encryptBackupPayload(jsonStr, 'correct-passphrase', 'json');

    expect(() => {
      decryptBackupPayload(envelope, 'wrong-passphrase');
    }).toThrow(/Decryption failed/i);
  });

  it('rejects tampered ciphertext envelopes', () => {
    const jsonStr = JSON.stringify({ test: 'hello' });
    const envelope = encryptBackupPayload(jsonStr, 'passphrase', 'json');

    // Tamper with base64 payload
    const tampered = { ...envelope, payload: envelope.payload.slice(0, -4) + 'AAAA' };

    expect(() => {
      decryptBackupPayload(tampered, 'passphrase');
    }).toThrow();
  });
});
