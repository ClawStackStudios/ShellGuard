import { Router } from 'express';
import crypto from 'crypto';
import db, { audit } from '../database/index.js';
import { calculateExpiry } from '../utils/tokenExpiry.js';
import { generateString } from '../utils/crypto.js';
import { requireAuth, requireHuman, AuthRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { AuthSchemas } from '../validation/schemas.js';

const router = Router();

function detectKeyType(key: string) {
  if (key?.startsWith('hu-'))  return 'human';
  if (key?.startsWith('lb-'))  return 'agent';
  if (key?.startsWith('api-')) return 'api';
  return null;
}

/** POST /api/auth/register */
router.post('/register', authLimiter, validateBody(AuthSchemas.register), (req, res) => {
  const { uuid, username, displayName, keyHash } = req.body;
  try {
    db.prepare('INSERT INTO lobsters (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(uuid, username, displayName ?? null, keyHash, new Date().toISOString());
    audit.log('AUTH_REGISTER', {
      actor: uuid, actor_type: 'human', action: 'register', outcome: 'success', resource: 'lobster',
      details: { username, lobster_uuid: uuid },
      ip_address: req.ip, user_agent: req.headers['user-agent'] as string,
    });
    res.status(201).json({ success: true });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed: lobsters.username')) {
      return res.status(409).json({ success: false, error: 'Username already taken.' });
    }
    audit.log('AUTH_REGISTER', {
      actor: uuid, actor_type: 'human', action: 'register', outcome: 'failure', resource: 'lobster',
      details: { reason: 'Registration failed' },
      ip_address: req.ip, user_agent: req.headers['user-agent'] as string,
    });
    return res.status(409).json({ success: false, error: 'Failed to register identity.' });
  }
});

/** POST /api/auth/token */
router.post('/token', authLimiter, validateBody(AuthSchemas.token), (req, res) => {
  const { type, uuid, keyHash, ownerKey } = req.body;
  // Delta #1: bare values ('1440') are MINUTES; also accepts '30m'/'12h'/'24h'/'7d'/ISO
  const ttl = process.env.TOKEN_TTL_DEFAULT || '1440';
  const expiresAt = calculateExpiry(ttl);

  if (type === 'agent' || (ownerKey && detectKeyType(ownerKey) === 'agent')) {
    let agent: any = null;
    let agentKey = ownerKey;

    if (keyHash && !uuid) {
      // 🛡️ Sentinel: Safe search for an active agent key whose SHA-256 hash matches the provided keyHash
      const activeAgents = db.prepare('SELECT * FROM agent_keys WHERE is_active = 1').all() as any[];
      let providedKeyHash: Buffer;
      try {
        providedKeyHash = Buffer.from(keyHash, 'hex');
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid key hash encoding' });
      }

      for (const a of activeAgents) {
        try {
          const storedKeyHash = crypto.createHash('sha256').update(a.api_key).digest();
          if (crypto.timingSafeEqual(storedKeyHash, providedKeyHash)) {
            agent = a;
            agentKey = a.api_key;
          }
        } catch {}
      }
    } else {
      if (!agentKey?.startsWith('lb-')) return res.status(400).json({ success: false, error: 'Invalid agent key' });
      agent = db.prepare('SELECT * FROM agent_keys WHERE api_key = ? AND is_active = 1').get(agentKey) as any;
    }

    // 🛡️ Sentinel Security Patch: Timing-safe comparison with pre-hashing
    let keyMatch = false;
    if (agent && agentKey) {
      try {
        const storedKeyHash = crypto.createHash('sha256').update(agent.api_key).digest();
        const providedKeyHash = keyHash
          ? Buffer.from(keyHash, 'hex')
          : crypto.createHash('sha256').update(agentKey).digest();
        keyMatch = crypto.timingSafeEqual(storedKeyHash, providedKeyHash);
      } catch {
        keyMatch = false;
      }
    }

    if (!agent || !keyMatch) {
      audit.log('AUTH_FAILURE', { action: 'login', outcome: 'failure', actor_type: 'agent', ip_address: req.ip, user_agent: req.headers['user-agent'] as string });
      return res.status(401).json({ success: false, error: 'Invalid or revoked agent key' });
    }

    const token = `api-${generateString(32)}`;
    db.prepare('INSERT INTO api_tokens (key, owner_uuid, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(token, agentKey, 'agent', new Date().toISOString(), expiresAt);
    audit.log('AUTH_SUCCESS', { actor: agent.id, actor_type: 'agent', action: 'login', outcome: 'success', ip_address: req.ip, user_agent: req.headers['user-agent'] as string });
    return res.status(201).json({ success: true, data: { token, type: 'agent', createdAt: new Date().toISOString(), expiresAt } });
  }

  // Human flow (default)
  let lobster: any;
  if (uuid)         lobster = db.prepare('SELECT * FROM lobsters WHERE uuid = ?').get(uuid);
  else if (keyHash) lobster = db.prepare('SELECT * FROM lobsters WHERE key_hash = ?').get(keyHash);

  if (!lobster) {
    audit.log('AUTH_FAILURE', { action: 'login', outcome: 'failure', actor_type: 'human', ip_address: req.ip, user_agent: req.headers['user-agent'] as string });
    return res.status(404).json({ success: false, error: 'Identity not registered on this node', suggestion: 'Hatch an identity first, or check the UUID in your Vault Access File.' });
  }

  let keyMatch = false;
  try { keyMatch = crypto.timingSafeEqual(Buffer.from(lobster.key_hash), Buffer.from(keyHash)); } catch { keyMatch = false; }

  if (!keyMatch) {
    audit.log('AUTH_FAILURE', { action: 'login', outcome: 'failure', actor_type: 'human', ip_address: req.ip, user_agent: req.headers['user-agent'] as string, details: { lobster_uuid: lobster.uuid } });
    return res.status(401).json({ success: false, error: 'Invalid identity key', suggestion: 'Ensure you are using the correct ShellKey©™ for this server instance.' });
  }

  const token = `api-${generateString(32)}`;
  db.prepare('INSERT INTO api_tokens (key, owner_uuid, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(token, lobster.uuid, 'human', new Date().toISOString(), expiresAt);
  audit.log('AUTH_SUCCESS', { actor: lobster.uuid, actor_type: 'human', action: 'login', outcome: 'success', ip_address: req.ip, user_agent: req.headers['user-agent'] as string });

  return res.status(201).json({
    success: true,
    data: {
      token,
      type: 'human',
      createdAt: new Date().toISOString(),
      expiresAt,
      user: { uuid: lobster.uuid, username: lobster.username, displayName: lobster.display_name || lobster.username },
    },
  });
});

/** GET /api/auth/validate */
router.get('/validate', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  res.json({ success: true, data: { valid: true, keyType: authReq.keyType, userUuid: authReq.userUuid } });
});

/** GET /api/auth/me — ShellGuard-only profile fetch */
router.get('/me', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const lobster = db.prepare('SELECT uuid, username, display_name, created_at FROM lobsters WHERE uuid = ?').get(authReq.userUuid) as any;
  if (!lobster) {
    return res.status(404).json({ success: false, error: 'Identity not found.' });
  }
  res.json({
    success: true,
    data: {
      uuid: lobster.uuid,
      username: lobster.username,
      displayName: lobster.display_name || lobster.username,
      createdAt: lobster.created_at,
    },
  });
});

/** PUT /api/auth/profile — ShellGuard-only display-name update */
router.put('/profile', requireAuth, requireHuman, validateBody(AuthSchemas.profile), (req, res) => {
  const authReq = req as AuthRequest;
  const displayName = req.body.displayName.trim();

  const info = db.prepare('UPDATE lobsters SET display_name = ? WHERE uuid = ?').run(displayName, authReq.userUuid);
  if (info.changes === 0) {
    return res.status(404).json({ success: false, error: 'Identity not found.' });
  }

  const lobster = db.prepare('SELECT uuid, username, display_name FROM lobsters WHERE uuid = ?').get(authReq.userUuid) as any;
  audit.log('PROFILE_UPDATED', { actor: authReq.userUuid, actor_type: 'human', action: 'update', outcome: 'success', resource: 'lobster', ip_address: req.ip, user_agent: req.headers['user-agent'] as string });

  res.json({
    success: true,
    data: { uuid: lobster.uuid, username: lobster.username, displayName: lobster.display_name || lobster.username },
  });
});

export default router;
