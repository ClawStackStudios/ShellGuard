import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { sha256, hmacSha256, hkdfSha256, aesGcmEncrypt, aesGcmDecrypt } from '../../src/lib/webCryptoFallback.ts';
import { deriveShellKey, encryptField, decryptField } from '../../src/lib/shellCryption.ts';
import { hashToken } from '../../src/lib/crypto.ts';

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
    const originalSubtle = (globalThis.crypto as any)?.subtle;
    try {
      delete (globalThis.crypto as any).subtle;
      
      const hash = await hashToken(huKey);
      expect(hash).toHaveLength(64);

      const shellKey = await deriveShellKey(huKey, uuid);
      expect(shellKey).toBeDefined();

      const encrypted = await encryptField("MySecretPassphrase42!", shellKey, "vault_items", "item-123");
      expect(encrypted).toContain('"alg":"AES-GCM-256"');

      const decrypted = await decryptField(encrypted, shellKey, "vault_items", "item-123");
      expect(decrypted).toBe("MySecretPassphrase42!");
    } finally {
      if (originalSubtle) {
        (globalThis.crypto as any).subtle = originalSubtle;
      }
    }
  });
});
