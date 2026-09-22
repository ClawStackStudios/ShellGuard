// tests/unit/totpUtils.test.ts — Unit tests for RFC 6238 TOTP engine.
import { describe, it, expect } from 'vitest';
import {
  parseTotpSecret,
  formatTotpSecret,
  generateTotp,
  TotpConfig
} from '../../src/lib/totpUtils.ts';

describe('TOTP Engine (RFC 6238)', () => {
  // RFC 6238 Appendix B test vector keys:
  // SHA1: 20 bytes ASCII "12345678901234567890"
  const rfcSha1Seed = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  // SHA256: 32 bytes ASCII "12345678901234567890123456789012"
  const rfcSha256Seed = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA';
  // SHA512: 64 bytes ASCII "1234567890123456789012345678901234567890123456789012345678901234"
  const rfcSha512Seed = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA';

  describe('RFC 6238 Published Reference Test Vectors', () => {
    it('generates exact RFC 6238 vectors at T = 59 seconds', () => {
      const timestampMs = 59 * 1000;

      // SHA1 (8 digits) -> 94287082
      const resSha1 = generateTotp(
        { secret: rfcSha1Seed, algorithm: 'SHA1', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha1?.code).toBe('94287082');

      // SHA256 (8 digits) -> 46119246
      const resSha256 = generateTotp(
        { secret: rfcSha256Seed, algorithm: 'SHA256', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha256?.code).toBe('46119246');

      // SHA512 (8 digits) -> 90693936
      const resSha512 = generateTotp(
        { secret: rfcSha512Seed, algorithm: 'SHA512', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha512?.code).toBe('90693936');
    });

    it('generates exact RFC 6238 vectors at T = 1111111109 seconds', () => {
      const timestampMs = 1111111109 * 1000;

      // SHA1 (8 digits) -> 07081804
      const resSha1 = generateTotp(
        { secret: rfcSha1Seed, algorithm: 'SHA1', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha1?.code).toBe('07081804');

      // SHA256 (8 digits) -> 68084774
      const resSha256 = generateTotp(
        { secret: rfcSha256Seed, algorithm: 'SHA256', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha256?.code).toBe('68084774');

      // SHA512 (8 digits) -> 25091201
      const resSha512 = generateTotp(
        { secret: rfcSha512Seed, algorithm: 'SHA512', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha512?.code).toBe('25091201');
    });

    it('generates exact RFC 6238 vectors at T = 1111111111 seconds', () => {
      const timestampMs = 1111111111 * 1000;

      // SHA1 (8 digits) -> 14050471
      const resSha1 = generateTotp(
        { secret: rfcSha1Seed, algorithm: 'SHA1', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha1?.code).toBe('14050471');

      // SHA256 (8 digits) -> 67062674
      const resSha256 = generateTotp(
        { secret: rfcSha256Seed, algorithm: 'SHA256', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha256?.code).toBe('67062674');

      // SHA512 (8 digits) -> 99943326
      const resSha512 = generateTotp(
        { secret: rfcSha512Seed, algorithm: 'SHA512', digits: 8, period: 30 },
        timestampMs
      );
      expect(resSha512?.code).toBe('99943326');
    });

    it('generates standard 6-digit SHA1 code at T = 59 seconds', () => {
      const timestampMs = 59 * 1000;
      const res = generateTotp(
        { secret: rfcSha1Seed, algorithm: 'SHA1', digits: 6, period: 30 },
        timestampMs
      );
      expect(res?.code).toBe('287082');
    });
  });

  describe('Custom Intervals and Period Calculation', () => {
    it('calculates accurate remaining seconds and period countdown', () => {
      const period = 30;
      const testMs = (30 * 100 + 12) * 1000; // 12 seconds into a 30s window
      const res = generateTotp(
        { secret: rfcSha1Seed, algorithm: 'SHA1', digits: 6, period },
        testMs
      );
      expect(res?.remainingSeconds).toBe(18);
      expect(res?.period).toBe(30);
    });

    it('supports 15-second and 60-second intervals', () => {
      const res15 = generateTotp(
        { secret: rfcSha1Seed, algorithm: 'SHA1', digits: 6, period: 15 },
        15000
      );
      expect(res15).not.toBeNull();
      expect(res15?.period).toBe(15);

      const res60 = generateTotp(
        { secret: rfcSha1Seed, algorithm: 'SHA1', digits: 6, period: 60 },
        60000
      );
      expect(res60).not.toBeNull();
      expect(res60?.period).toBe(60);
    });
  });

  describe('parseTotpSecret validation and formatting', () => {
    it('parses raw Base32 secret string with cleaning', () => {
      const parsed = parseTotpSecret(' jbsw-y3dp ehpk 3pxp ');
      expect(parsed).not.toBeNull();
      expect(parsed?.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(parsed?.algorithm).toBe('SHA1');
      expect(parsed?.digits).toBe(6);
      expect(parsed?.period).toBe(30);
    });

    it('parses full otpauth URI with custom parameters', () => {
      const uri = 'otpauth://totp/GitHub:octocat?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&algorithm=SHA256&digits=8&period=60';
      const parsed = parseTotpSecret(uri);
      expect(parsed).not.toBeNull();
      expect(parsed?.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(parsed?.issuer).toBe('GitHub');
      expect(parsed?.label).toBe('octocat');
      expect(parsed?.algorithm).toBe('SHA256');
      expect(parsed?.digits).toBe(8);
      expect(parsed?.period).toBe(60);
    });

    it('rejects invalid non-Base32 secrets and empty strings', () => {
      expect(parseTotpSecret('')).toBeNull();
      expect(parseTotpSecret('   ')).toBeNull();
      expect(parseTotpSecret('Not a valid base32 string 1890!')).toBeNull();
    });

    it('roundtrips custom config through formatTotpSecret and parseTotpSecret', () => {
      const original: TotpConfig = {
        secret: 'JBSWY3DPEHPK3PXP',
        algorithm: 'SHA512',
        digits: 8,
        period: 45,
        issuer: 'ShellGuard',
        label: 'admin',
      };

      const formatted = formatTotpSecret(original, 'ShellGuard');
      expect(formatted).toContain('otpauth://totp/');
      expect(formatted).toContain('algorithm=SHA512');
      expect(formatted).toContain('digits=8');
      expect(formatted).toContain('period=45');

      const reParsed = parseTotpSecret(formatted);
      expect(reParsed).not.toBeNull();
      expect(reParsed?.secret).toBe(original.secret);
      expect(reParsed?.algorithm).toBe(original.algorithm);
      expect(reParsed?.digits).toBe(original.digits);
      expect(reParsed?.period).toBe(original.period);
    });

    it('formats default configuration as clean raw secret', () => {
      const defaultConfig: TotpConfig = {
        secret: 'JBSWY3DPEHPK3PXP',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      };

      const formatted = formatTotpSecret(defaultConfig);
      expect(formatted).toBe('JBSWY3DPEHPK3PXP');
    });
  });
});
