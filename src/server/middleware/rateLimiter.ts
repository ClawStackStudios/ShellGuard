import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import db from '../database/index.js';
import { AuthRequest } from './auth.js';


function parseWindow(windowStr: string | undefined): number | null {
  if (!windowStr) return null;
  if (windowStr.endsWith('m')) return parseInt(windowStr) * 60 * 1000;
  if (windowStr.endsWith('s')) return parseInt(windowStr) * 1000;
  return parseInt(windowStr);
}

export const authLimiter = rateLimit({
  windowMs: parseWindow(process.env.AUTH_RATE_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT || '10', 10),
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
  max: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "The reef is crowded! You've exceeded your rate limit. Please slow down your requests.",
  },
});

export const createAgentKeyRateLimiter = () => {
  const limiterCache = new Map<string, ReturnType<typeof rateLimit>>();
  const MAX_CACHE_SIZE = 100; // ⚡ LRU: keep only last 100 agent keys to prevent unbounded memory growth

  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (
      authReq.keyType === 'human' ||
      !authReq.apiKey
    ) return next();

    let limit: number | null = null;
    let agentApiKey: string | null = null;

    if (authReq.keyType === 'agent') {
      const agent = db.prepare('SELECT api_key, rate_limit FROM agent_keys WHERE api_key = ? AND is_active = 1').get(authReq.apiKey) as any;
      if (agent?.rate_limit) { limit = agent.rate_limit; agentApiKey = agent.api_key; }
    } else if (authReq.keyType === 'api') {
      const token = db.prepare('SELECT owner_uuid, owner_type FROM api_tokens WHERE key = ?').get(authReq.apiKey) as any;
      if (token?.owner_type === 'agent') {
        const agent = db.prepare('SELECT api_key, rate_limit FROM agent_keys WHERE api_key = ? AND is_active = 1').get(token.owner_uuid) as any;
        if (agent?.rate_limit) { limit = agent.rate_limit; agentApiKey = agent.api_key; }
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
