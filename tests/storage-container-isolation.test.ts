import { describe, it, expect, vi, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { resolveDataDir } from '../src/server/database/connection.js';
import { getSafeAttachmentMaxMb, getSafeGrottoQuotaMb } from '../src/server/config/storageConfig.js';
import { validateEnvironment } from '../src/server/config/envValidator.js';

describe('Storage & Container Isolation Battery (Phase 28.3 / Tasks 59 & 60)', () => {
  describe('1. DATA_DIR Sanitization (resolveDataDir)', () => {
    const defaultDataDir = path.resolve(process.cwd(), 'data');

    it('falls back to default data directory when undefined or null', () => {
      expect(resolveDataDir(undefined)).toBe(defaultDataDir);
      expect(resolveDataDir()).toBe(defaultDataDir);
    });

    it('sanitizes empty strings and whitespace strings to default data directory', () => {
      expect(resolveDataDir('')).toBe(defaultDataDir);
      expect(resolveDataDir('   ')).toBe(defaultDataDir);
      expect(resolveDataDir('\t\n')).toBe(defaultDataDir);
    });

    it('resolves valid relative paths to absolute paths', () => {
      const resolved = resolveDataDir('./custom-data-dir');
      expect(resolved).toBe(path.resolve(process.cwd(), 'custom-data-dir'));
    });

    it('preserves valid absolute paths', () => {
      const absPath = path.resolve('/tmp/shellguard-test-data');
      expect(resolveDataDir(absPath)).toBe(absPath);
    });
  });

  describe('2. Safe Storage Quotas Clamping (storageConfig)', () => {
    describe('getSafeAttachmentMaxMb', () => {
      it('returns default 500MB when undefined, empty, or non-numeric', () => {
        expect(getSafeAttachmentMaxMb(undefined)).toBe(500);
        expect(getSafeAttachmentMaxMb('')).toBe(500);
        expect(getSafeAttachmentMaxMb('invalid')).toBe(500);
        expect(getSafeAttachmentMaxMb('NaN')).toBe(500);
      });

      it('clamps negative or zero values to default 500MB', () => {
        expect(getSafeAttachmentMaxMb('-5')).toBe(500);
        expect(getSafeAttachmentMaxMb('0')).toBe(500);
        expect(getSafeAttachmentMaxMb('-100')).toBe(500);
      });

      it('clamps values above the 2000MB hard ceiling to 2000MB', () => {
        expect(getSafeAttachmentMaxMb('2001')).toBe(2000);
        expect(getSafeAttachmentMaxMb('5000')).toBe(2000);
        expect(getSafeAttachmentMaxMb('999999')).toBe(2000);
      });

      it('accepts valid integers within 1–2000MB range', () => {
        expect(getSafeAttachmentMaxMb('1')).toBe(1);
        expect(getSafeAttachmentMaxMb('100')).toBe(100);
        expect(getSafeAttachmentMaxMb('1024')).toBe(1024);
        expect(getSafeAttachmentMaxMb('2000')).toBe(2000);
      });
    });

    describe('getSafeGrottoQuotaMb', () => {
      it('returns default 1000MB when undefined, empty, or non-numeric', () => {
        expect(getSafeGrottoQuotaMb(undefined)).toBe(1000);
        expect(getSafeGrottoQuotaMb('')).toBe(1000);
        expect(getSafeGrottoQuotaMb('corrupted')).toBe(1000);
      });

      it('clamps negative or zero values to default 1000MB', () => {
        expect(getSafeGrottoQuotaMb('-1')).toBe(1000);
        expect(getSafeGrottoQuotaMb('0')).toBe(1000);
      });

      it('clamps values above 100,000MB ceiling to 100,000MB', () => {
        expect(getSafeGrottoQuotaMb('100001')).toBe(100000);
        expect(getSafeGrottoQuotaMb('500000')).toBe(100000);
      });

      it('accepts valid integers within 1–100,000MB range', () => {
        expect(getSafeGrottoQuotaMb('50')).toBe(50);
        expect(getSafeGrottoQuotaMb('2048')).toBe(2048);
        expect(getSafeGrottoQuotaMb('100000')).toBe(100000);
      });
    });
  });

  describe('3. Boot Validator Diagnostics for Quotas & VITE Runtime Detection', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('includes storageQuotas in ValidationSummary', () => {
      process.env.ATTACHMENT_MAX_MB = '250';
      process.env.GROTTO_QUOTA_MB = '500';
      const summary = validateEnvironment();
      expect(summary.storageQuotas).toBeDefined();
      expect(summary.storageQuotas.attachmentMaxMb).toBe(250);
      expect(summary.storageQuotas.grottoQuotaMb).toBe(500);
    });

    it('emits a warning diagnostic when ATTACHMENT_MAX_MB exceeds GROTTO_QUOTA_MB', () => {
      process.env.ATTACHMENT_MAX_MB = '1500';
      process.env.GROTTO_QUOTA_MB = '500';
      const summary = validateEnvironment();
      const warning = summary.diagnostics.find(
        (d) => d.variable === 'ATTACHMENT_MAX_MB' && d.message.includes('exceeds GROTTO_QUOTA_MB')
      );
      expect(warning).toBeDefined();
      expect(warning?.level).toBe('warn');
    });

    it('emits a warning when VITE_* variables are detected at runtime in production mode', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_SHELLCRYPTION_ENABLED = 'false';
      process.env.VITE_API_URL = 'http://localhost:6565';
      const summary = validateEnvironment();

      const viteWarning = summary.diagnostics.find(
        (d) => d.variable === 'VITE_SHELLCRYPTION_ENABLED' && d.message.includes('compiled into static assets at build time')
      );
      expect(viteWarning).toBeDefined();
      expect(viteWarning?.level).toBe('warn');
    });
  });

  describe('4. Container Healthcheck & Entrypoint Invariants', () => {
    const rootDir = process.cwd();

    it('ensures Dockerfile healthcheck uses dynamic ${PORT:-6464}', () => {
      const dockerfilePath = path.join(rootDir, 'Dockerfile');
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(dockerfileContent).toContain('localhost:${PORT:-6464}');
      expect(dockerfileContent).not.toMatch(/https:\/\/localhost:6464\/api\/health/);
    });

    it('ensures docker-entrypoint.sh implements positive integer validation for PUID/PGID', () => {
      const entrypointPath = path.join(rootDir, 'docker-entrypoint.sh');
      const entrypointContent = fs.readFileSync(entrypointPath, 'utf-8');

      // Checks integer regex matching
      expect(entrypointContent).toContain('TARGET_UID');
      expect(entrypointContent).toContain('TARGET_GID');
      expect(entrypointContent).toContain("''|*[!0-9]*)");

      // Checks independent remapping condition
      expect(entrypointContent).toContain('[ "$TARGET_UID" != "1000" ] || [ "$TARGET_GID" != "1000" ]');

      // Checks safe fallback for DATA_DIR
      expect(entrypointContent).toContain('TARGET_DATA_DIR="${DATA_DIR:-/app/data}"');
    });
  });
});
