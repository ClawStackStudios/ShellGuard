import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { sha256, hmacSha256, hkdfSha256, pbkdf2Sha256, aesGcmEncrypt, aesGcmDecrypt } from '../../src/lib/webCryptoFallback.ts';
import { deriveShellKey, encryptField, decryptField } from '../../src/lib/shellCryption.ts';
import { hashToken } from '../../src/lib/crypto.ts';
import { encryptBackupPayload, decryptBackupPayload } from '../../src/lib/vaultExport.ts';

describe('WebCrypto Fallback Engine for Non-Secure LAN HTTP', () => {
  it('computes byte-exact SHA-256 compared to Node crypto', () => {
    const inputs = [
      '',
      'hello world',
      'hu-gjb0IFFw4ioTuYhcKcYhjY0IOMPx3QaNIoFYfasp9W43sRYq9wksq6yt90Y5P3hj',
      'The quick brown fox jumps over the lazy dog',
      JSON.stringify({ username: "lucas", uuid: "12345" })
    ];

    for (const input of inputs) {
      const nodeHash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
      const fallbackBytes = sha256(Buffer.from(input, 'utf8'));
      const fallbackHex = Array.from(fallbackBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      expect(fallbackHex).toBe(nodeHash);
    }
  });

  it('computes byte-exact HMAC-SHA256 compared to Node crypto', () => {
    const key = Buffer.from('sovereign-secret-key-12345', 'utf8');
    const data = Buffer.from('message-to-authenticate', 'utf8');
    const nodeHmac = crypto.createHmac('sha256', key).update(data).digest('hex');
    const fallbackHmac = hmacSha256(key, data);
    const fallbackHex = Array.from(fallbackHmac).map(b => b.toString(16).padStart(2, '0')).join('');
    expect(fallbackHex).toBe(nodeHmac);
  });

  it('computes byte-exact HKDF-SHA256 key derivation', () => {
    const ikm = Buffer.from('hu-gjb0IFFw4ioTuYhcKcYhjY0IOMPx3QaNIoFYfasp9W43sRYq9wksq6yt90Y5P3hj', 'utf8');
    const salt = Buffer.from('1c8705b8-c31c-4b12-aa71-6da046a357ba', 'utf8');
    const info = Buffer.from('clawchives-shellcryption-v1', 'utf8');

    const nodeHkdf = crypto.hkdfSync('sha256', ikm, salt, info, 32);
    const fallbackHkdf = hkdfSha256(ikm, salt, info, 32);

    expect(Buffer.from(fallbackHkdf).toString('hex')).toBe(Buffer.from(nodeHkdf).toString('hex'));
  });

  it('encrypts and decrypts AES-256-GCM payload with AAD verification', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const plaintext = Buffer.from('super-secret-password-123!', 'utf8');
    const aad = Buffer.from('vault_items:record-uuid-999', 'utf8');

    // 1. Encrypt with fallback
    const ctAndTag = aesGcmEncrypt(key, iv, plaintext, aad);

    // 2. Decrypt with Node crypto
    const ciphertext = ctAndTag.subarray(0, ctAndTag.length - 16);
    const tag = ctAndTag.subarray(ctAndTag.length - 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    const decryptedNode = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    expect(decryptedNode.toString('utf8')).toBe('super-secret-password-123!');

    // 3. Decrypt with fallback
    const decryptedFallback = aesGcmDecrypt(key, iv, ctAndTag, aad);
    expect(Buffer.from(decryptedFallback).toString('utf8')).toBe('super-secret-password-123!');
  });

  it('fails GCM decryption when AAD or ciphertext is tampered', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const plaintext = Buffer.from('secret', 'utf8');
    const aad = Buffer.from('table:id1', 'utf8');
    const ctAndTag = aesGcmEncrypt(key, iv, plaintext, aad);

    // Wrong AAD
    expect(() => {
      aesGcmDecrypt(key, iv, ctAndTag, Buffer.from('table:id2', 'utf8'));
    }).toThrow();

    // Tampered ciphertext
    const tampered = new Uint8Array(ctAndTag);
    tampered[0] ^= 0xff;
    expect(() => {
      aesGcmDecrypt(key, iv, tampered, aad);
    }).toThrow();
  });

  it('derives and round-trips ShellCryption even when crypto.subtle is absent', async () => {
    const huKey = "hu-gjb0IFFw4ioTuYhcKcYhjY0IOMPx3QaNIoFYfasp9W43sRYq9wksq6yt90Y5P3hj";
    const uuid = "1c8705b8-c31c-4b12-aa71-6da046a357ba";

    // Simulate non-secure context where crypto.subtle is undefined
    const cryptoProto = Object.getPrototypeOf(globalThis.crypto);
    const originalDescriptor = Object.getOwnPropertyDescriptor(cryptoProto, 'subtle');
    try {
      Object.defineProperty(cryptoProto, 'subtle', {
        get: () => undefined,
        configurable: true,
      });
      
      const hash = await hashToken(huKey);
      expect(hash).toHaveLength(64);

      const shellKey = await deriveShellKey(huKey, uuid);
      expect(shellKey).toBeDefined();
      expect((shellKey as any)._rawKey).toBeDefined();

      const encrypted = await encryptField("MySecretPassphrase42!", shellKey, "vault_items", "item-123");
      expect(encrypted).toContain('"alg":"AES-GCM-256"');

      const decrypted = await decryptField(encrypted, shellKey, "vault_items", "item-123");
      expect(decrypted).toBe("MySecretPassphrase42!");
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(cryptoProto, 'subtle', originalDescriptor);
      }
    }
  });

  it('computes byte-exact PBKDF2-SHA256 compared to Node crypto and standard RFC 6070 vectors', () => {
    // Vector 1: Standard RFC 6070 test vector 1 (c = 1)
    const pw1 = Buffer.from('password', 'utf8');
    const salt1 = Buffer.from('salt', 'utf8');
    const fallback1 = pbkdf2Sha256(pw1, salt1, 1, 32);
    const node1 = crypto.pbkdf2Sync(pw1, salt1, 1, 32, 'sha256');
    expect(Buffer.from(fallback1).toString('hex')).toBe(node1.toString('hex'));

    // Vector 2: RFC 6070 test vector 2 (c = 2)
    const fallback2 = pbkdf2Sha256(pw1, salt1, 2, 32);
    const node2 = crypto.pbkdf2Sync(pw1, salt1, 2, 32, 'sha256');
    expect(Buffer.from(fallback2).toString('hex')).toBe(node2.toString('hex'));

    // Vector 3: RFC 6070 test vector 3 (c = 4096)
    const fallback4096 = pbkdf2Sha256(pw1, salt1, 4096, 32);
    const node4096 = crypto.pbkdf2Sync(pw1, salt1, 4096, 32, 'sha256');
    expect(Buffer.from(fallback4096).toString('hex')).toBe(node4096.toString('hex'));

    // Vector 4: Longer key / salt with non-32 byte length (RFC 6070 vector 4, dkLen = 40)
    const pw4 = Buffer.from('passwordPASSWORDpassword', 'utf8');
    const salt4 = Buffer.from('saltSALTsaltSALTsaltSALTsaltSALTsalt', 'utf8');
    const fallbackLong = pbkdf2Sha256(pw4, salt4, 4096, 40);
    const nodeLong = crypto.pbkdf2Sync(pw4, salt4, 4096, 40, 'sha256');
    expect(Buffer.from(fallbackLong).toString('hex')).toBe(nodeLong.toString('hex'));
  });

  it('computes byte-exact PBKDF2-SHA256 parity between fallback engine and WebCrypto subtle.deriveBits', async () => {
    const password = Buffer.from('sovereign-backup-passphrase-2026', 'utf8');
    const salt = Buffer.from('1c8705b8-c31c-4b12-aa71-6da046a357ba', 'utf8');
    const iterations = 5000;
    const keyLength = 32;

    const fallbackBytes = pbkdf2Sha256(password, salt, iterations, keyLength);

    const baseKey = await globalThis.crypto.subtle.importKey(
      'raw',
      password,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await globalThis.crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      baseKey,
      keyLength * 8
    );
    const nativeBytes = new Uint8Array(bits);

    expect(Buffer.from(fallbackBytes).toString('hex')).toBe(Buffer.from(nativeBytes).toString('hex'));
  });

  it('guarantees cross-origin backup interoperability: HTTPS (WebCrypto) export decrypts on HTTP LAN (fallback) and vice-versa', async () => {
    const payload = JSON.stringify([{ id: 'pearl-1', title: 'GitHub', username: 'lucas', password: 'secret-password-123!' }]);
    const passphrase = 'test-disaster-recovery-passphrase';

    // 1. Export under HTTPS/secure context using native WebCrypto Subtle
    const httpsEnvelope = await encryptBackupPayload(payload, passphrase, 'json', { iterations: 2000 });
    expect(httpsEnvelope.kdf).toBe('pbkdf2');
    expect(httpsEnvelope.kdfIterations).toBe(2000);

    // 2. Mock plain HTTP LAN origin (crypto.subtle is undefined)
    const cryptoProto = Object.getPrototypeOf(globalThis.crypto);
    const originalDescriptor = Object.getOwnPropertyDescriptor(cryptoProto, 'subtle');
    try {
      Object.defineProperty(cryptoProto, 'subtle', {
        get: () => undefined,
        configurable: true,
      });

      // Decrypt HTTPS-generated backup on insecure LAN origin using pure-TS fallback
      const lanDecrypted = await decryptBackupPayload(httpsEnvelope, passphrase);
      expect(lanDecrypted.kind).toBe('json');
      expect(lanDecrypted.data).toBe(payload);

      // Encrypt a backup on insecure LAN origin using pure-TS fallback
      const lanEnvelope = await encryptBackupPayload(payload, passphrase, 'json', { iterations: 2000 });
      expect(lanEnvelope.v).toBe(1);
      expect(lanEnvelope.kdf).toBe('pbkdf2');
      expect(lanEnvelope.kdfIterations).toBe(2000);

      // Restore native WebCrypto Subtle
      Object.defineProperty(cryptoProto, 'subtle', originalDescriptor);

      // Decrypt LAN-generated backup on HTTPS origin using native WebCrypto Subtle
      const httpsDecrypted = await decryptBackupPayload(lanEnvelope, passphrase);
      expect(httpsDecrypted.kind).toBe('json');
      expect(httpsDecrypted.data).toBe(payload);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(cryptoProto, 'subtle', originalDescriptor);
      }
    }
  });
});
