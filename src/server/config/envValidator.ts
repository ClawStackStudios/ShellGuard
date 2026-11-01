/**
 * envValidator.ts — ShellGuard©™
 *
 * Central Boot Validator & Operational Diagnostic Suite.
 * Validates Group 1 (Core Crypto & Admin) and Group 5 (Auth & System)
 * environment variables before Express binds network ports.
 *
 * Invariants:
 * - DB_ENCRYPTION_KEY entropy >= 32 bytes (256 bits) in Base64 or Base64URL.
 * - ADMIN_TOKEN >= 16 characters, rejects weak/boolean-confused tokens.
 * - DISABLE_SIGNUPS normalized boolean parsing ('true', '1', 'yes').
 * - TOKEN_TTL_DEFAULT validated with fallback to '1440' (24h) on invalid input.
 * - Catch-22 lockout warning if DISABLE_SIGNUPS=true while ADMIN_TOKEN is missing/weak.
 */

import crypto from 'crypto';
import { getSafeAttachmentMaxMb, getSafeGrottoQuotaMb } from './storageConfig.js';

export interface EnvarDiagnostic {
  level: 'info' | 'warn' | 'error';
  variable: string;
  message: string;
}

export interface ValidationSummary {
  isValid: boolean;
  diagnostics: EnvarDiagnostic[];
  dbEncryptionStatus: 'active' | 'unencrypted' | 'invalid';
  adminPanelStatus: 'enabled' | 'sealed' | 'invalid';
  signupStatus: 'open' | 'invite_only' | 'genesis_only';
  ttlDefault: string;
  storageQuotas: {
    attachmentMaxMb: number;
    grottoQuotaMb: number;
  };
}

const WEAK_ADMIN_TOKENS = new Set([
  'true',
  'false',
  'admin',
  'administrator',
  '123456',
  '12345678',
  'password',
  'secret',
  'superlobster',
  'root',
  'change_me',
  'changeme',
]);

/**
 * Normalizes boolean strings: true, 1, yes (case-insensitive, trimmed).
 */
export function isDisableSignupsEnforced(): boolean {
  const val = String(process.env.DISABLE_SIGNUPS ?? '').trim().toLowerCase();
  return val === 'true' || val === '1' || val === 'yes';
}

/**
 * Validates if an ADMIN_TOKEN meets security invariants (length >= 16, not weak/boolean).
 */
export function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const trimmed = token.trim();
  if (trimmed.length < 16) return false;
  if (WEAK_ADMIN_TOKENS.has(trimmed.toLowerCase())) return false;
  return true;
}

/**
 * Validates DB_ENCRYPTION_KEY entropy (Base64/Base64URL and decoded length >= 32 bytes).
 */
export function validateDbEncryptionKey(key: string | undefined): {
  valid: boolean;
  byteLength: number;
  error?: string;
} {
  if (!key) {
    return { valid: false, byteLength: 0, error: 'DB_ENCRYPTION_KEY is unset' };
  }
  const trimmed = key.trim();
  const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[a-zA-Z0-9+/=]+$/.test(normalized)) {
    return {
      valid: false,
      byteLength: 0,
      error: 'Key contains invalid characters (must be standard Base64 or Base64URL)',
    };
  }
  const buf = Buffer.from(normalized, 'base64');
  if (buf.length < 32) {
    return {
      valid: false,
      byteLength: buf.length,
      error: `Insufficient entropy: decoded length is ${buf.length} bytes (minimum 32 bytes / 256 bits required)`,
    };
  }
  return { valid: true, byteLength: buf.length };
}

/**
 * Validates a TTL string without throwing.
 */
export function validateTtl(ttl: string | undefined): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  if (!ttl) return { valid: true, normalized: '1440' };
  const trimmed = ttl.trim();
  if (trimmed === 'never' || trimmed === '1year') {
    return { valid: true, normalized: trimmed };
  }
  const relative = /^(\d+)\s*(m|h|d|days?|w|weeks?)?$/i.exec(trimmed);
  if (relative) {
    const amount = parseInt(relative[1], 10);
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, normalized: '1440', error: `Invalid numeric amount in TTL: ${trimmed}` };
    }
    const unit = (relative[2] || '').toLowerCase();
    let ms: number;
    switch (unit) {
      case 'm': ms = amount * 60 * 1000; break;
      case 'h': ms = amount * 60 * 60 * 1000; break;
      case 'd':
      case 'day':
      case 'days': ms = amount * 24 * 60 * 60 * 1000; break;
      case 'w':
      case 'week':
      case 'weeks': ms = amount * 7 * 24 * 60 * 60 * 1000; break;
      default: ms = amount * 60 * 1000; break;
    }
    const targetMs = Date.now() + ms;
    if (!Number.isFinite(targetMs) || targetMs > 8640000000000000) {
      return { valid: false, normalized: '1440', error: `TTL causes JavaScript date overflow: ${trimmed}` };
    }
    return { valid: true, normalized: trimmed };
  }
  const customDate = new Date(trimmed);
  if (isNaN(customDate.getTime())) {
    return { valid: false, normalized: '1440', error: `Invalid date format: ${trimmed}` };
  }
  if (customDate.getTime() <= Date.now()) {
    return { valid: false, normalized: '1440', error: `Custom date must be in the future: ${trimmed}` };
  }
  return { valid: true, normalized: trimmed };
}

/**
 * Runs the central boot validation check across Group 1 & Group 5 environment variables.
 */
export function validateEnvironment(): ValidationSummary {
  const diagnostics: EnvarDiagnostic[] = [];
  let isValid = true;

  // 1. DB_ENCRYPTION_KEY
  const rawDbKey = process.env.DB_ENCRYPTION_KEY;
  let dbStatus: 'active' | 'unencrypted' | 'invalid' = 'unencrypted';
  if (!rawDbKey || !rawDbKey.trim()) {
    diagnostics.push({
      level: 'warn',
      variable: 'DB_ENCRYPTION_KEY',
      message: 'Unset — database and metadata rows are stored UNENCRYPTED at rest.',
    });
  } else {
    const keyCheck = validateDbEncryptionKey(rawDbKey);
    if (!keyCheck.valid) {
      isValid = false;
      dbStatus = 'invalid';
      diagnostics.push({
        level: 'error',
        variable: 'DB_ENCRYPTION_KEY',
        message: `${keyCheck.error}. Server refusing startup to prevent cryptographic misconfiguration.`,
      });
    } else {
      dbStatus = 'active';
      diagnostics.push({
        level: 'info',
        variable: 'DB_ENCRYPTION_KEY',
        message: `Validated (${keyCheck.byteLength} bytes / 256-bit AES-GCM & SQLCipher enabled).`,
      });
    }
  }

  // 2. ADMIN_TOKEN
  const rawAdminToken = process.env.ADMIN_TOKEN;
  let adminStatus: 'enabled' | 'sealed' | 'invalid' = 'sealed';
  if (!rawAdminToken || !rawAdminToken.trim()) {
    diagnostics.push({
      level: 'info',
      variable: 'ADMIN_TOKEN',
      message: 'Unset — SuperLobster Admin Panel is sealed (HTTP 503).',
    });
  } else {
    const trimmedToken = rawAdminToken.trim();
    if (trimmedToken.length < 16) {
      adminStatus = 'invalid';
      diagnostics.push({
        level: 'warn',
        variable: 'ADMIN_TOKEN',
        message: `Too short (${trimmedToken.length} chars, minimum 16 required). SuperLobster Panel sealed. Generate with: openssl rand -hex 24`,
      });
    } else if (WEAK_ADMIN_TOKENS.has(trimmedToken.toLowerCase())) {
      adminStatus = 'invalid';
      diagnostics.push({
        level: 'warn',
        variable: 'ADMIN_TOKEN',
        message: `Token "${trimmedToken}" is weak or boolean-confused. SuperLobster Panel sealed. Generate with: openssl rand -hex 24`,
      });
    } else {
      adminStatus = 'enabled';
      diagnostics.push({
        level: 'info',
        variable: 'ADMIN_TOKEN',
        message: 'Validated (SuperLobster Control Plane active).',
      });
    }
  }

  // 3. DISABLE_SIGNUPS & Catch-22 lockout check
  const disableSignups = isDisableSignupsEnforced();
  let signupStatus: 'open' | 'invite_only' | 'genesis_only' = 'open';
  if (disableSignups) {
    signupStatus = 'invite_only';
    diagnostics.push({
      level: 'info',
      variable: 'DISABLE_SIGNUPS',
      message: 'Enforced (public registration disabled; single-use invites required).',
    });

    if (adminStatus !== 'enabled') {
      diagnostics.push({
        level: 'warn',
        variable: 'DISABLE_SIGNUPS',
        message: 'CATCH-22 REEF LOCKOUT: DISABLE_SIGNUPS is true, but ADMIN_TOKEN is unset or invalid! Genesis User #1 can hatch, but cannot invite additional users until ADMIN_TOKEN is configured.',
      });
    }
  }

  // 4. TOKEN_TTL_DEFAULT
  const rawTtl = process.env.TOKEN_TTL_DEFAULT;
  let ttlDefault = '1440';
  if (rawTtl) {
    const ttlCheck = validateTtl(rawTtl);
    if (!ttlCheck.valid) {
      diagnostics.push({
        level: 'warn',
        variable: 'TOKEN_TTL_DEFAULT',
        message: `${ttlCheck.error}. Falling back to default '1440' (24 hours).`,
      });
    } else {
      ttlDefault = ttlCheck.normalized;
      diagnostics.push({
        level: 'info',
        variable: 'TOKEN_TTL_DEFAULT',
        message: `Validated session TTL: ${ttlDefault}.`,
      });
    }
  }

  // 5. Storage Quotas (ATTACHMENT_MAX_MB & GROTTO_QUOTA_MB)
  const rawAttachmentMax = process.env.ATTACHMENT_MAX_MB;
  const rawGrottoQuota = process.env.GROTTO_QUOTA_MB;
  const safeAttachmentMb = getSafeAttachmentMaxMb(rawAttachmentMax);
  const safeGrottoMb = getSafeGrottoQuotaMb(rawGrottoQuota);

  if (rawAttachmentMax !== undefined && rawAttachmentMax !== '') {
    const parsed = parseInt(rawAttachmentMax, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 2000) {
      diagnostics.push({
        level: 'warn',
        variable: 'ATTACHMENT_MAX_MB',
        message: `Value "${rawAttachmentMax}" is invalid or out of bounds (1–2000 MB). Clamped to safe ceiling: ${safeAttachmentMb}MB.`,
      });
    } else {
      diagnostics.push({
        level: 'info',
        variable: 'ATTACHMENT_MAX_MB',
        message: `Configured per-file ceiling: ${safeAttachmentMb}MB.`,
      });
    }
  }

  if (rawGrottoQuota !== undefined && rawGrottoQuota !== '') {
    const parsed = parseInt(rawGrottoQuota, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100000) {
      diagnostics.push({
        level: 'warn',
        variable: 'GROTTO_QUOTA_MB',
        message: `Value "${rawGrottoQuota}" is invalid or out of bounds (1–100000 MB). Clamped to safe quota: ${safeGrottoMb}MB.`,
      });
    } else {
      diagnostics.push({
        level: 'info',
        variable: 'GROTTO_QUOTA_MB',
        message: `Configured grotto quota: ${safeGrottoMb}MB.`,
      });
    }
  }

  if (safeAttachmentMb > safeGrottoMb) {
    diagnostics.push({
      level: 'warn',
      variable: 'ATTACHMENT_MAX_MB',
      message: `ATTACHMENT_MAX_MB (${safeAttachmentMb}MB) exceeds GROTTO_QUOTA_MB (${safeGrottoMb}MB). A single file upload could exhaust the user's entire grotto quota.`,
    });
  }

  // 6. Runtime detection of build-time VITE_* envars in production
  if (process.env.NODE_ENV === 'production') {
    const viteVars = ['VITE_API_URL', 'VITE_SHELLCRYPTION_ENABLED'];
    for (const v of viteVars) {
      if (process.env[v] !== undefined) {
        diagnostics.push({
          level: 'warn',
          variable: v,
          message: `Variable "${v}" was provided to a production container at runtime. Note: VITE_* client variables are compiled into static assets at build time (npm run build). Passing this at container launch has no effect on client bundles unless rebuilt.`,
        });
      }
    }
  }

  return {
    isValid,
    diagnostics,
    dbEncryptionStatus: dbStatus,
    adminPanelStatus: adminStatus,
    signupStatus,
    ttlDefault,
    storageQuotas: {
      attachmentMaxMb: safeAttachmentMb,
      grottoQuotaMb: safeGrottoMb,
    },
  };
}

/**
 * Formats and prints the ShellGuard Startup Security & Envar Diagnostic Banner.
 */
export function printStartupBanner(summary: ValidationSummary): void {
  const line = '═'.repeat(68);
  const thin = '─'.repeat(68);

  console.log(`\n╔${line}╗`);
  console.log(`║ 🛡️  ShellGuard©™ Startup Security & Envar Diagnostic Banner        ║`);
  console.log(`╠${thin}╣`);
  console.log(`║  Storage Engine : ${summary.dbEncryptionStatus === 'active' ? '🔒 SQLCipher (256-bit AES) + Layer 2 FieldCipher' : summary.dbEncryptionStatus === 'invalid' ? '❌ INVALID KEY (Startup Blocked)' : '⚠️  Plaintext (Unencrypted at rest)'}`.padEnd(69) + '║');
  console.log(`║  Storage Quotas : 📦 Per-File: ${summary.storageQuotas.attachmentMaxMb}MB · Grotto: ${summary.storageQuotas.grottoQuotaMb}MB`.padEnd(69) + '║');
  console.log(`║  Control Plane  : ${summary.adminPanelStatus === 'enabled' ? '✅ SuperLobster Active' : summary.adminPanelStatus === 'invalid' ? '⚠️  Sealed (Weak/Short ADMIN_TOKEN)' : '🔒 Sealed (ADMIN_TOKEN Unset)'}`.padEnd(69) + '║');
  console.log(`║  Signup Policy  : ${summary.signupStatus === 'invite_only' ? '✉️  Invite-Only (DISABLE_SIGNUPS=true)' : '🌐 Open Public Registration'}`.padEnd(69) + '║');
  console.log(`║  Session TTL    : ⏱️  ${summary.ttlDefault}`.padEnd(69) + '║');
  console.log(`╠${thin}╣`);

  for (const diag of summary.diagnostics) {
    const icon = diag.level === 'error' ? '❌' : diag.level === 'warn' ? '⚠️ ' : 'ℹ️ ';
    const prefix = `║  ${icon} [${diag.variable}]: `;
    const indent = '║      ';
    const maxLineLen = 66;

    const words = diag.message.split(' ');
    let currentLine = prefix;

    for (const w of words) {
      if ((currentLine + (currentLine.endsWith(': ') ? '' : ' ') + w).length <= maxLineLen) {
        currentLine += (currentLine.endsWith(': ') ? '' : ' ') + w;
      } else {
        console.log(currentLine.padEnd(69) + '║');
        currentLine = indent + w;
      }
    }
    if (currentLine) {
      console.log(currentLine.padEnd(69) + '║');
    }
  }

  console.log(`╚${line}╝\n`);
}
