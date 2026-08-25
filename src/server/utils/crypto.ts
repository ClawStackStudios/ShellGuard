import crypto from 'crypto';

/**
 * 🛡️ Sentinel Security Fix (v2):
 * crypto.randomInt avoids modulo bias that occurs when mapping
 * crypto.randomBytes values (0-255) to a 62-character charset.
 */
export function generateString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[crypto.randomInt(chars.length)];
  }
  return result;
}

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Compares two strings in constant time to prevent timing side-channel attacks.
 * Required for securely verifying password hashes or session tokens.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');

  // Must be same length for timingSafeEqual
  if (aBuffer.length !== bBuffer.length) {
    // We still do a constant-time compare against a dummy buffer
    // to mask the early return time difference
    crypto.timingSafeEqual(aBuffer, aBuffer);
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}
