// src/lib/totpUtils.ts — Dynamic RFC 6238 TOTP utilities with URI & parameter parsing.
import * as OTPAuth from 'otpauth';

export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface TotpConfig {
  secret: string; // Uppercase Base32 secret without spaces
  algorithm: TotpAlgorithm;
  digits: number;
  period: number;
  issuer?: string;
  label?: string;
}

/**
 * Normalizes and extracts TOTP parameters from a raw secret string or an `otpauth://totp/...` URI.
 */
export function parseTotpSecret(raw?: string | null): TotpConfig | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase().startsWith('otpauth://')) {
    try {
      const parsed = OTPAuth.URI.parse(trimmed);
      if (parsed instanceof OTPAuth.TOTP) {
        let alg: TotpAlgorithm = 'SHA1';
        const upperAlg = (parsed.algorithm || 'SHA1').toUpperCase();
        if (upperAlg === 'SHA256') alg = 'SHA256';
        else if (upperAlg === 'SHA512') alg = 'SHA512';

        return {
          secret: parsed.secret.base32.replace(/\s+/g, '').toUpperCase(),
          algorithm: alg,
          digits: parsed.digits || 6,
          period: parsed.period || 30,
          issuer: parsed.issuer || undefined,
          label: parsed.label || undefined,
        };
      }
    } catch {
      // If OTPAuth.URI.parse fails, attempt resilient URL query parameter extraction
      try {
        const url = new URL(trimmed);
        const secretParam = url.searchParams.get('secret');
        if (secretParam) {
          let alg: TotpAlgorithm = 'SHA1';
          const upperAlg = (url.searchParams.get('algorithm') || 'SHA1').toUpperCase();
          if (upperAlg === 'SHA256') alg = 'SHA256';
          else if (upperAlg === 'SHA512') alg = 'SHA512';

          const rawDigits = parseInt(url.searchParams.get('digits') || '6', 10);
          const digits = (rawDigits === 8 || rawDigits === 6) ? rawDigits : 6;
          const rawPeriod = parseInt(url.searchParams.get('period') || '30', 10);
          const period = rawPeriod > 0 ? rawPeriod : 30;

          return {
            secret: secretParam.replace(/[\s-]+/g, '').toUpperCase(),
            algorithm: alg,
            digits,
            period,
            issuer: url.searchParams.get('issuer') || undefined,
            label: decodeURIComponent(url.pathname.replace(/^\/totp\/?/i, '')) || undefined,
          };
        }
      } catch {
        // Fall back to clean Base32
      }
    }
  }

  // Raw Base32 secret
  const clean = trimmed.replace(/[\s-]+/g, '').toUpperCase();
  const base32Regex = /^[A-Z2-7=]+$/;
  if (!base32Regex.test(clean)) {
    return null;
  }

  return {
    secret: clean,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  };
}

/**
 * Formats a TotpConfig into a standard otpauth://totp/ URI or canonical string.
 * If non-default parameters are used (algorithm !== 'SHA1', digits !== 6, or period !== 30),
 * an otpauth:// URI is generated to retain the variables across sync and backups.
 */
export function formatTotpSecret(config: TotpConfig, title: string = 'Vault'): string {
  const isCustom = config.algorithm !== 'SHA1' || config.digits !== 6 || config.period !== 30;
  if (!isCustom) {
    return config.secret;
  }

  const label = encodeURIComponent(config.label || title || 'Vault');
  const params = new URLSearchParams();
  params.set('secret', config.secret);
  if (config.algorithm !== 'SHA1') params.set('algorithm', config.algorithm);
  if (config.digits !== 6) params.set('digits', String(config.digits));
  if (config.period !== 30) params.set('period', String(config.period));
  if (config.issuer) params.set('issuer', config.issuer);

  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Generates an active OTP token and countdown status given a TotpConfig.
 * Optionally accepts a timestamp in ms for deterministic testing.
 */
export function generateTotp(
  config: TotpConfig,
  timestampMs?: number
): {
  code: string;
  progressPercent: number;
  remainingSeconds: number;
  period: number;
} | null {
  try {
    const cleanSecret = config.secret.replace(/\s+/g, '').toUpperCase();
    if (!cleanSecret) return null;

    const totp = new OTPAuth.TOTP({
      issuer: config.issuer || 'Vault',
      label: config.label || 'TOTP',
      algorithm: config.algorithm,
      digits: config.digits,
      period: config.period,
      secret: OTPAuth.Secret.fromBase32(cleanSecret),
    });

    const now = typeof timestampMs === 'number' ? timestampMs : Date.now();
    const code = totp.generate({ timestamp: now });
    const seconds = Math.floor(now / 1000);
    const period = config.period;
    const remaining = period - (seconds % period);
    const progressPercent = (remaining / period) * 100;

    return {
      code,
      progressPercent,
      remainingSeconds: remaining,
      period,
    };
  } catch {
    return null;
  }
}
