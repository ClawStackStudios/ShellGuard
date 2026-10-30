import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isDisableSignupsEnforced,
  isValidAdminToken,
  validateDbEncryptionKey,
  validateTtl,
  validateEnvironment,
} from '../../src/server/config/envValidator.js';
import { calculateExpiry, getSafeTokenTtlDefault } from '../../src/server/utils/tokenExpiry.js';
import { deriveMetadataKey } from '../../src/server/utils/fieldEncryption.js';

describe('Central Boot Validator & Envar Hardening (Stage 28.1)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('ADMIN_TOKEN Hardening', () => {
    it('rejects unset, empty, or whitespace-only admin tokens', () => {
      expect(isValidAdminToken(undefined)).toBe(false);
      expect(isValidAdminToken('')).toBe(false);
      expect(isValidAdminToken('   ')).toBe(false);
      expect(isValidAdminToken('\t\n')).toBe(false);
    });

    it('rejects short tokens (< 16 characters)', () => {
      expect(isValidAdminToken('short-token')).toBe(false);
      expect(isValidAdminToken('123456789012345')).toBe(false); // 15 chars
    });

    it('rejects weak or boolean-confused tokens regardless of length', () => {
      expect(isValidAdminToken('admin')).toBe(false);
      expect(isValidAdminToken('true')).toBe(false);
      expect(isValidAdminToken('false')).toBe(false);
      expect(isValidAdminToken('123456')).toBe(false);
      expect(isValidAdminToken('password')).toBe(false);
      expect(isValidAdminToken('superlobster')).toBe(false);
      expect(isValidAdminToken('ADMIN')).toBe(false);
    });

    it('accepts strong tokens with >= 16 characters', () => {
      expect(isValidAdminToken('a-very-strong-admin-token-1234')).toBe(true);
      expect(isValidAdminToken('  4f8b2c1e9a0d3e5f7b1c3a5d7e9f0a2b  ')).toBe(true); // trims
    });
  });

  describe('DB_ENCRYPTION_KEY Entropy Guard', () => {
    it('rejects non-base64 characters', () => {
      const res = validateDbEncryptionKey('not-valid-base64!@#$%^&*()');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('invalid characters');
    });

    it('rejects short base64 strings with insufficient decoded entropy (< 32 bytes)', () => {
      // "cGFzc3dvcmQ=" is Base64 for "password" (8 bytes)
      const res = validateDbEncryptionKey('cGFzc3dvcmQ=');
      expect(res.valid).toBe(false);
      expect(res.byteLength).toBe(8);
      expect(res.error).toContain('minimum 32 bytes');
    });

    it('accepts valid 32-byte Base64 key', () => {
      // 32 zero bytes in Base64: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
      const key32 = Buffer.alloc(32, 0xaa).toString('base64');
      const res = validateDbEncryptionKey(key32);
      expect(res.valid).toBe(true);
      expect(res.byteLength).toBe(32);
    });

    it('accepts Base64URL encoding with - and _', () => {
      const raw32 = Buffer.alloc(32, 0xff);
      const b64url = raw32.toString('base64url');
      const res = validateDbEncryptionKey(b64url);
      expect(res.valid).toBe(true);
      expect(res.byteLength).toBe(32);

      // Verify fieldEncryption can derive metadata key with Base64URL
      const derived = deriveMetadataKey(b64url);
      expect(derived.length).toBe(32);
    });

    it('deriveMetadataKey throws if decoded length < 32 bytes', () => {
      expect(() => deriveMetadataKey('cGFzc3dvcmQ=')).toThrow('entropy too low');
    });
  });

  describe('DISABLE_SIGNUPS Boolean Normalization & Catch-22 Detection', () => {
    it('normalizes truthy strings: true, 1, yes (case-insensitive, trimmed)', () => {
      process.env.DISABLE_SIGNUPS = 'true';
      expect(isDisableSignupsEnforced()).toBe(true);

      process.env.DISABLE_SIGNUPS = 'TRUE';
      expect(isDisableSignupsEnforced()).toBe(true);

      process.env.DISABLE_SIGNUPS = ' 1 ';
      expect(isDisableSignupsEnforced()).toBe(true);

      process.env.DISABLE_SIGNUPS = 'yes';
      expect(isDisableSignupsEnforced()).toBe(true);

      process.env.DISABLE_SIGNUPS = 'YES';
      expect(isDisableSignupsEnforced()).toBe(true);
    });

    it('treats other values as false: false, 0, no, unset', () => {
      delete process.env.DISABLE_SIGNUPS;
      expect(isDisableSignupsEnforced()).toBe(false);

      process.env.DISABLE_SIGNUPS = 'false';
      expect(isDisableSignupsEnforced()).toBe(false);

      process.env.DISABLE_SIGNUPS = '0';
      expect(isDisableSignupsEnforced()).toBe(false);

      process.env.DISABLE_SIGNUPS = 'no';
      expect(isDisableSignupsEnforced()).toBe(false);
    });

    it('surfaces Catch-22 lockout warning when DISABLE_SIGNUPS=true and ADMIN_TOKEN is missing', () => {
      process.env.DISABLE_SIGNUPS = 'true';
      delete process.env.ADMIN_TOKEN;

      const summary = validateEnvironment();
      const catch22 = summary.diagnostics.find(d => d.message.includes('CATCH-22 REEF LOCKOUT'));
      expect(catch22).toBeDefined();
      expect(catch22?.level).toBe('warn');
    });

    it('does NOT surface Catch-22 lockout warning when ADMIN_TOKEN is valid', () => {
      process.env.DISABLE_SIGNUPS = 'true';
      process.env.ADMIN_TOKEN = 'a-valid-admin-token-with-sufficient-length';

      const summary = validateEnvironment();
      const catch22 = summary.diagnostics.find(d => d.message.includes('CATCH-22 REEF LOCKOUT'));
      expect(catch22).toBeUndefined();
    });
  });

  describe('TOKEN_TTL_DEFAULT Parsing & Fallback', () => {
    it('supports weeks units (w, week, weeks)', () => {
      const now = Date.now();
      const oneWeek = calculateExpiry('1w');
      expect(oneWeek).toBeDefined();
      const diffOneWeek = new Date(oneWeek!).getTime() - now;
      // 7 days +/- 10 seconds
      expect(diffOneWeek).toBeGreaterThanOrEqual(7 * 24 * 3600 * 1000 - 10000);
      expect(diffOneWeek).toBeLessThanOrEqual(7 * 24 * 3600 * 1000 + 10000);

      const twoWeeks = calculateExpiry('2weeks');
      expect(twoWeeks).toBeDefined();
      const diffTwoWeeks = new Date(twoWeeks!).getTime() - now;
      expect(diffTwoWeeks).toBeGreaterThanOrEqual(14 * 24 * 3600 * 1000 - 10000);
    });

    it('guards against JavaScript Date overflow without unhandled crashes', () => {
      expect(() => calculateExpiry('99999999999999999999d')).toThrow('overflow');
    });

    it('validateTtl returns invalid with safe fallback for malformed TTLs', () => {
      expect(validateTtl('0').valid).toBe(false);
      expect(validateTtl('-5m').valid).toBe(false);
      expect(validateTtl('forever').valid).toBe(false);
      expect(validateTtl('24h').valid).toBe(true);
      expect(validateTtl('1440').valid).toBe(true);
    });

    it('getSafeTokenTtlDefault falls back to 1440 when environment variable is invalid', () => {
      process.env.TOKEN_TTL_DEFAULT = 'invalid-gibberish';
      expect(getSafeTokenTtlDefault()).toBe('1440');

      process.env.TOKEN_TTL_DEFAULT = '0';
      expect(getSafeTokenTtlDefault()).toBe('1440');

      process.env.TOKEN_TTL_DEFAULT = '7d';
      expect(getSafeTokenTtlDefault()).toBe('7d');
    });
  });
});
