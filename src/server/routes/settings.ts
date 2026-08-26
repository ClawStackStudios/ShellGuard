import { Router } from 'express';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requireHuman } from '../middleware/auth.js';

const router = Router();

// Column naming delta #5: owner_uuid everywhere (CC used user_uuid).
// The settings table's composite PK (owner_uuid, key) scopes every row to
// one identity — preferences can never clobber a sibling account.

const MAX_KEY_LENGTH = 100;
const MAX_VALUE_BYTES = 256 * 1024; // 256KB per preference blob

/** GET /api/settings/:key */
router.get('/:key', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;
  const key = String(req.params.key);
  if (key.length > MAX_KEY_LENGTH) {
    return res.status(400).json({ success: false, error: 'Setting key too long' });
  }
  const row = db.prepare('SELECT value FROM settings WHERE key = ? AND owner_uuid = ?').get(key, authReq.userUuid) as any;
  if (!row) return res.json({ success: true, data: {} }); // Return empty object; let frontend apply defaults
  try {
    res.json({ success: true, data: JSON.parse(row.value) });
  } catch {
    res.json({ success: true, data: {} });
  }
});

/** PUT /api/settings/:key */
router.put('/:key', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;
  const key = String(req.params.key);
  if (key.length > MAX_KEY_LENGTH) {
    return res.status(400).json({ success: false, error: 'Setting key too long' });
  }

  const serialized = JSON.stringify(req.body ?? {});
  if (Buffer.byteLength(serialized) > MAX_VALUE_BYTES) {
    return res.status(413).json({ success: false, error: 'Setting payload too large' });
  }

  db.prepare('INSERT OR REPLACE INTO settings (owner_uuid, key, value) VALUES (?, ?, ?)').run(authReq.userUuid, key, serialized);
  audit.log('SETTINGS_UPDATED', { actor: authReq.userUuid, actor_type: 'human', resource: key, action: 'update', outcome: 'success', ip_address: req.ip, user_agent: String(req.headers['user-agent'] ?? '') });
  res.json({ success: true });
});

export default router;
