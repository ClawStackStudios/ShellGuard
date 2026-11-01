import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { httpsRedirect, getSafeHttpsPort } from '../../src/server/middleware/httpsRedirect.js';
import { parseWindow, getSafeRateLimit } from '../../src/server/middleware/rateLimiter.js';
import { getCorsConfig } from '../../src/config/corsConfig.js';
import {
  isTlsServerActive,
  setTlsServerActive,
  isByoCertConfigured,
  getActiveCertPath,
} from '../../src/server/utils/tlsManager.js';

describe('Stage 28.2: Network Topology, TLS Fallback Safety & Rate Limiter Hardening', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    setTlsServerActive(false);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setTlsServerActive(false);
  });

  describe('httpsRedirect & Fail-Safe TLS State', () => {
    it('exempts /api/health from HTTPS redirection even when ENFORCE_HTTPS=true', () => {
      process.env.ENFORCE_HTTPS = 'true';
      const req: any = {
        path: '/api/health',
        secure: false,
        headers: {},
        hostname: 'localhost',
        originalUrl: '/api/health',
      };
      const res: any = {
        redirect: vi.fn(),
      };
      const next = vi.fn();

      httpsRedirect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('does not redirect plain HTTP traffic when TLS_ENABLED failed and fell back to HTTP', () => {
      // Simulate fallback: TLS_ENABLED=true in env, but isTlsServerActive() is false and ENFORCE_HTTPS is not set
      process.env.TLS_ENABLED = 'true';
      process.env.NODE_ENV = 'production';
      delete process.env.ENFORCE_HTTPS;
      setTlsServerActive(false);

      const req: any = {
        path: '/api/vault',
        secure: false,
        headers: {},
        hostname: 'localhost',
        originalUrl: '/api/vault',
      };
      const res: any = {
        redirect: vi.fn(),
      };
      const next = vi.fn();

      httpsRedirect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('redirects to HTTPS when isTlsServerActive() is true and connection is insecure', () => {
      setTlsServerActive(true);
      process.env.NODE_ENV = 'production';

      const req: any = {
        path: '/api/vault',
        secure: false,
        headers: {},
        hostname: 'localhost',
        originalUrl: '/api/vault',
      };
      const res: any = {
        redirect: vi.fn(),
      };
      const next = vi.fn();

      httpsRedirect(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(301, 'https://localhost/api/vault');
      expect(next).not.toHaveBeenCalled();
    });

    it('parses comma-separated X-Forwarded-Proto headers correctly for multi-proxy chains', () => {
      process.env.ENFORCE_HTTPS = 'true';
      const req: any = {
        path: '/api/vault',
        secure: false,
        headers: {
          'x-forwarded-proto': 'https, http',
        },
        hostname: 'vault.reef.local',
        originalUrl: '/api/vault',
      };
      const res: any = {
        redirect: vi.fn(),
      };
      const next = vi.fn();

      httpsRedirect(req, res, next);

      // Since client-facing first hop is 'https', request is secure; should not redirect
      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('redirects when client-facing first hop in X-Forwarded-Proto is http', () => {
      process.env.ENFORCE_HTTPS = 'true';
      const req: any = {
        path: '/api/vault',
        secure: false,
        headers: {
          'x-forwarded-proto': 'http, https',
        },
        hostname: 'vault.reef.local',
        originalUrl: '/api/vault',
      };
      const res: any = {
        redirect: vi.fn(),
      };
      const next = vi.fn();

      httpsRedirect(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(301, 'https://vault.reef.local/api/vault');
      expect(next).not.toHaveBeenCalled();
    });

    it('validates HTTPS_PORT and falls back to 443 on invalid values', () => {
      process.env.HTTPS_PORT = '8443';
      expect(getSafeHttpsPort()).toBe(8443);

      process.env.HTTPS_PORT = 'invalid';
      expect(getSafeHttpsPort()).toBe(443);

      process.env.HTTPS_PORT = '70000';
      expect(getSafeHttpsPort()).toBe(443);

      process.env.HTTPS_PORT = '0';
      expect(getSafeHttpsPort()).toBe(443);
    });
  });

  describe('Rate Limiter Window & Max Clamping (Bug Fixes)', () => {
    it('parses hours ("1h") as 3600000ms instead of 1ms', () => {
      expect(parseWindow('1h')).toBe(60 * 60 * 1000);
      expect(parseWindow('2h')).toBe(2 * 60 * 60 * 1000);
      expect(parseWindow('24h')).toBe(24 * 60 * 60 * 1000);
      expect(parseWindow('1.5h')).toBe(1.5 * 60 * 60 * 1000);
    });

    it('parses days ("1d") as 86400000ms', () => {
      expect(parseWindow('1d')).toBe(24 * 60 * 60 * 1000);
      expect(parseWindow('7d')).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('parses minutes ("15m") and seconds ("30s") and milliseconds ("500ms")', () => {
      expect(parseWindow('15m')).toBe(15 * 60 * 1000);
      expect(parseWindow('30s')).toBe(30 * 1000);
      expect(parseWindow('500ms')).toBe(500);
      expect(parseWindow('60000')).toBe(60000);
    });

    it('returns null for undefined, empty, or negative window strings', () => {
      expect(parseWindow(undefined)).toBeNull();
      expect(parseWindow('')).toBeNull();
      expect(parseWindow('   ')).toBeNull();
      expect(parseWindow('-10m')).toBeNull();
      expect(parseWindow('invalid')).toBeNull();
    });

    it('clamps rate limit max: falls back to safe default if 0, negative, or NaN', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(getSafeRateLimit('0', 10, 'AUTH_RATE_LIMIT')).toBe(10);
      expect(getSafeRateLimit('-5', 10, 'AUTH_RATE_LIMIT')).toBe(10);
      expect(getSafeRateLimit('invalid', 100, 'API_RATE_LIMIT')).toBe(100);
      expect(getSafeRateLimit(undefined, 100, 'API_RATE_LIMIT')).toBe(100);
      expect(getSafeRateLimit('50', 100, 'API_RATE_LIMIT')).toBe(50);

      warnSpy.mockRestore();
    });
  });

  describe('CORS Normalization & Inverted NODE_ENV', () => {
    it('normalizes CORS_ORIGIN trailing slashes', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'https://vault.example.com/, https://admin.example.com';
      const cors = getCorsConfig();
      expect(typeof cors.origin).toBe('function');

      const originFn = cors.origin as Function;

      // Inbound origin without slash
      const cb1 = vi.fn();
      originFn('https://vault.example.com', cb1);
      expect(cb1).toHaveBeenCalledWith(null, true);

      // Inbound origin with slash
      const cb2 = vi.fn();
      originFn('https://vault.example.com/', cb2);
      expect(cb2).toHaveBeenCalledWith(null, true);

      // Inbound origin for second item
      const cb3 = vi.fn();
      originFn('https://admin.example.com', cb3);
      expect(cb3).toHaveBeenCalledWith(null, true);

      // Disallowed origin
      const cb4 = vi.fn();
      originFn('https://evil.attacker.com', cb4);
      expect(cb4).toHaveBeenCalledWith(expect.any(Error));
    });

    it('supports CORS_ORIGIN="*" wildcard explicitly', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = '*';
      const cors = getCorsConfig();
      const originFn = cors.origin as Function;

      const cb = vi.fn();
      originFn('https://random.client.app', cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('inverts dev mode check so typos like NODE_ENV=prod or staging default strictly to production hardening', () => {
      process.env.NODE_ENV = 'prod'; // Typo for production
      delete process.env.CORS_ORIGIN;
      const cors = getCorsConfig();
      const originFn = cors.origin as Function;

      // In strict LAN mode (no CORS_ORIGIN set and production hardened), public origins must be rejected
      const cb = vi.fn();
      originFn('https://public.internet.domain.com', cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('BYO Certificate Parity & Active Cert Path', () => {
    it('detects BYO certificate only when BOTH TLS_CERT_PATH and TLS_KEY_PATH are set', () => {
      delete process.env.TLS_CERT_PATH;
      delete process.env.TLS_KEY_PATH;
      expect(isByoCertConfigured()).toBe(false);

      process.env.TLS_CERT_PATH = '/custom/cert.pem';
      delete process.env.TLS_KEY_PATH;
      expect(isByoCertConfigured()).toBe(false);

      process.env.TLS_KEY_PATH = '/custom/key.pem';
      expect(isByoCertConfigured()).toBe(true);
    });

    it('returns custom cert path when TLS_CERT_PATH is defined', () => {
      process.env.TLS_CERT_PATH = '/etc/ssl/custom-cert.pem';
      expect(getActiveCertPath()).toBe('/etc/ssl/custom-cert.pem');
    });

    it('tracks live isTlsServerActive state', () => {
      expect(isTlsServerActive()).toBe(false);
      setTlsServerActive(true);
      expect(isTlsServerActive()).toBe(true);
      setTlsServerActive(false);
      expect(isTlsServerActive()).toBe(false);
    });
  });
});
