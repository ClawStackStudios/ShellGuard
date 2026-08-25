import type { Database } from 'better-sqlite3-multiple-ciphers';

/**
 * 🛡️ Delta #1 — hardened TTL parser.
 *
 * Accepts (case-insensitive): 'never', '<n>m' minutes, '<n>h' hours,
 * '<n>d'/'<n>day'/'<n>days', a bare number (interpreted as MINUTES —
 * e.g. the documented default '1440' = 24 hours), '1year', or any
 * parseable ISO 8601 / RFC 2822 datetime in the future.
 */
export function calculateExpiry(ttl: string | null | undefined): string | null {
  if (!ttl || ttl === 'never') return null;

  const now = Date.now();
  const normalized = String(ttl).trim();

  const relative = /^(\d+)\s*(m|h|d|days?)?$/i.exec(normalized);
  if (relative) {
    const amount = parseInt(relative[1], 10);
    if (isNaN(amount) || amount <= 0) throw new Error(`Invalid TTL format: ${ttl}`);
    const unit = (relative[2] || '').toLowerCase();

    let ms: number;
    switch (unit) {
      case 'm': ms = amount * 60 * 1000; break;              // minutes
      case 'h': ms = amount * 60 * 60 * 1000; break;         // hours
      case 'd':
      case 'day':
      case 'days': ms = amount * 24 * 60 * 60 * 1000; break; // days
      default:   ms = amount * 60 * 1000; break;             // bare number = minutes
    }
    return new Date(now + ms).toISOString();
  }

  if (normalized === '1year') {
    return new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  const customDate = new Date(normalized);
  if (isNaN(customDate.getTime())) throw new Error(`Invalid custom date: ${ttl}`);
  if (customDate.getTime() <= now) throw new Error('Custom expiry date must be in the future');

  return customDate.toISOString();
}

export function checkTokenExpiry(expiresAt: string | null | undefined): boolean {
  // Returns true if token is VALID (not expired)
  // Compared as JS dates — ISO8601 strings do not order correctly against SQLite's CURRENT_TIMESTAMP format.
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
}

export function getTimeUntilExpiry(expiresAt: string | null | undefined) {
  if (!expiresAt) return { days: Infinity, hours: Infinity, minutes: Infinity, expired: false };

  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };

  return {
    days: Math.floor(diff / (24 * 60 * 60 * 1000)),
    hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
    minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
    expired: false,
  };
}

export function formatExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'Never expires';
  const { days, hours, expired } = getTimeUntilExpiry(expiresAt);
  if (expired) return 'Expired';
  if (days > 30) return `Expires in ${Math.floor(days / 30)} month(s)`;
  if (days > 0) return `Expires in ${days} day(s)`;
  return `Expires in ${hours} hour(s)`;
}

export function cleanupExpiredTokens(db: Database): number {
  // ISO timestamps written by this app compare lexicographically & chronologically with ISO params
  const now = new Date().toISOString();
  const result = db.prepare(`
    DELETE FROM api_tokens
    WHERE expires_at IS NOT NULL AND expires_at < ?
  `).run(now);
  if (result.changes > 0) console.log(`🐚 Cleaned up ${result.changes} expired token(s)`);
  return result.changes;
}

export function scheduleTokenCleanup(db: Database): void {
  const DAILY_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const next3am = new Date(
    now.getFullYear(), now.getMonth(),
    now.getDate() + (now.getHours() >= 3 ? 1 : 0),
    3, 0, 0, 0
  );
  const msUntil3am = next3am.getTime() - now.getTime();

  cleanupExpiredTokens(db);

  setTimeout(() => {
    cleanupExpiredTokens(db);
    setInterval(() => cleanupExpiredTokens(db), DAILY_MS);
  }, msUntil3am);

  console.log(`⏰ Token cleanup scheduled for ${next3am.toISOString()}`);
}

export function extendTokenExpiry(db: Database, token: string, ttl = '90d'): string | null {
  const newExpiry = calculateExpiry(ttl);
  db.prepare(`UPDATE api_tokens SET expires_at = ? WHERE key = ?`).run(newExpiry, token);
  return newExpiry;
}
