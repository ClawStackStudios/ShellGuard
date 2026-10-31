import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import db from '../database/index.js';
import { AuthRequest } from './auth.js';


/**
 * Parse human rate limit window strings into milliseconds.
 * Supports: 'ms', 's', 'm', 'h', 'd' (e.g. '1h' -> 3600000, '30m' -> 1800000, '15s' -> 15000, '500ms' -> 500).
 * Plain numbers are treated as milliseconds.
 */
export function parseWindow(windowStr: string | undefined): number | null {
  if (!windowStr) return null;
  const str = windowStr.trim().toLowerCase();
  if (!str) return null;

  // Days: '1d', '2days', 'day'
  const dayMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:d|day|days)$/);
  if (dayMatch) {
    const val = parseFloat(dayMatch[1]);
    return val > 0 ? Math.round(val * 24 * 60 * 60 * 1000) : null;
  }

  // Hours: '1h', '2hours', 'hour'
  const hourMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)$/);
  if (hourMatch) {
    const val = parseFloat(hourMatch[1]);
    return val > 0 ? Math.round(val * 60 * 60 * 1000) : null;
  }

  // Minutes: '15m', '15min', 'minutes'
  const minMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)$/);
  if (minMatch) {
    const val = parseFloat(minMatch[1]);
    return val > 0 ? Math.round(val * 60 * 1000) : null;
  }

  // Milliseconds: '500ms'
  const msMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:ms|msec|millisec|milliseconds)$/);
  if (msMatch) {
    const val = parseFloat(msMatch[1]);
    return val > 0 ? Math.round(val) : null;
  }

  // Seconds: '30s', '30sec', 'seconds'
  const secMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)$/);
  if (secMatch) {
    const val = parseFloat(secMatch[1]);
    return val > 0 ? Math.round(val * 1000) : null;
  }

  // Plain numeric string (milliseconds)
  const numeric = parseFloat(str);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return Math.round(numeric);
  }

  return null;
}

/**
 * Clamp rate limit max value so 0, negative, or NaN values safely fall back
 * to defaults rather than locking out 100% of requests with HTTP 429.
 */
export function getSafeRateLimit(limitStr: string | undefined, defaultLimit: number, varName?: string): number {
  if (!limitStr) return defaultLimit;
  const parsed = parseInt(limitStr, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(`[RateLimiter] ⚠️ Invalid or non-positive ${varName || 'rate limit'} value ("${limitStr}"). Falling back to safe default ${defaultLimit}.`);
    return defaultLimit;
  }
  return parsed;
}

export const authLimiter = rateLimit({
  windowMs: parseWindow(process.env.AUTH_RATE_WINDOW) || 15 * 60 * 1000,
  max: getSafeRateLimit(process.env.AUTH_RATE_LIMIT || '10', 10, 'AUTH_RATE_LIMIT'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'The reef is crowded! Too many login attempts. Please rest your claws and try again later.',
  },
  skipSuccessfulRequests: true,
});

export const apiLimiter = rateLimit({
  windowMs: parseWindow(process.env.API_RATE_WINDOW) || 1 * 60 * 1000,
  max: getSafeRateLimit(process.env.API_RATE_LIMIT || '100', 100, 'API_RATE_LIMIT'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "The reef is crowded! You've exceeded your rate limit. Please slow down your requests.",
  },
});


/**
 * Stricter limiter for the SuperLobster panel's token auth endpoint (T1).
 * Brute-forcing ADMIN_TOKEN through HTTP should be slow and loud.
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many SuperLobster login attempts. The reef has gone dark for a while.' },
  skipSuccessfulRequests: true,
});

export const createAgentKeyRateLimiter = () => {
  const limiterCache = new Map<string, ReturnType<typeof rateLimit>>();
  const MAX_CACHE_SIZE = 100; // ⚡ LRU: keep only last 100 agent keys to prevent unbounded memory growth

  return async (req: Request, res: Response, next: NextFunction) => {
    // We cannot rely on authReq.keyType because this middleware runs BEFORE requireAuth.
    // We must manually parse the Bearer token here.
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    
    const key = authHeader.substring(7).trim();
    if (key.startsWith('hu-')) return next(); // Humans bypass this limiter
    
    let limit: number | null = null;
    let agentApiKey: string | null = null;

    // Phase 17 (Key Ledger): agent buckets key on the key_fingerprint —
    // api_key no longer exists and plaintext never reaches this middleware.
    if (key.startsWith('lb-')) {
      const keyHash = crypto.createHash('sha256').update(key).digest('hex');
      const agent = db.prepare('SELECT id, key_fingerprint, rate_limit FROM agent_keys WHERE key_hash = ? AND is_active = 1').get(keyHash) as any;
      if (agent?.rate_limit) { limit = agent.rate_limit; agentApiKey = agent.key_fingerprint; }
    } else if (key.startsWith('api-')) {
      const token = db.prepare('SELECT owner_uuid, owner_type FROM api_tokens WHERE key = ?').get(key) as any;
      if (token?.owner_type === 'agent') {
        const agent = db.prepare('SELECT id, key_fingerprint, rate_limit FROM agent_keys WHERE id = ? AND is_active = 1').get(token.owner_uuid) as any;
        if (agent?.rate_limit) { limit = agent.rate_limit; agentApiKey = agent.key_fingerprint; }
      }
    }

    if (!limit || !agentApiKey) return next();

    if (!limiterCache.has(agentApiKey)) {
      // ⚡ Evict oldest entry if cache is full (LRU)
      if (limiterCache.size >= MAX_CACHE_SIZE) {
        const firstKey = limiterCache.keys().next().value as string;
        limiterCache.delete(firstKey);
      }

      limiterCache.set(agentApiKey, rateLimit({
        windowMs: 60 * 1000,
        max: limit,
        keyGenerator: () => agentApiKey as string,
        message: { success: false, error: 'Your carapace lacks the capacity! Agent rate limit exceeded.' },
      }));
    }

    limiterCache.get(agentApiKey)!(req, res, next);
  };
};
