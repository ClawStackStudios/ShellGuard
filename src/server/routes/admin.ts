/**
 * admin.ts — ShellGuard©™ SuperLobster Panel
 *
 * Admin API for the SuperLobster control plane. Clean-room from the
 * ClawChives SuperAdmin pattern (itself adapted from PinchPad), hardened
 * for a zero-knowledge secrets vault per ADMIN.md §2:
 *
 *   - Panel inert unless ADMIN_TOKEN env is set (503 everywhere)
 *   - Strict-metadata-only user list — NO vault payload columns ever
 *     leave through this router (T3, enforced by tests)
 *   - Cascade delete requires server-side `expect` confirmation (T4)
 *   - Backups are server-side writes only — no download (T6)
 *   - Settings editing is whitelist-only (T5)
 *
 * Maintained by CrustAgent©™
 */

import { Router } from 'express';
import crypto from 'crypto';
import db, { audit, auditDb } from '../database/index.js';
import {
  requireAdmin,
  createAdminSession,
  destroyAdminSession,
  getAdminSessionToken,
  isAdminPanelEnabled,
  isAdminSessionValid,
} from '../middleware/requireAdmin.js';
import { constantTimeCompare } from '../utils/crypto.js';
import { validateBody } from '../middleware/validate.js';
import { AdminSchemas } from '../validation/schemas.js';
import { adminAuthLimiter } from '../middleware/rateLimiter.js';
import { performBackup, listBackups } from '../utils/backupManager.js';

const router = Router();

/** Audit helper — every admin mutation is attributable (T8). */
function adminAudit(eventType: string, req: any, data: Record<string, unknown>, outcome: 'success' | 'failure' = 'success') {
  audit.log(eventType, {
    actor: 'SUPERLOBSTER',
    actor_type: 'admin',
    action: eventType.toLowerCase(),
    outcome,
    ip_address: Array.isArray(req.ip) ? req.ip[0] : req.ip,
    user_agent: String(req.headers['user-agent'] ?? ''),
    ...data,
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** POST /api/admin/auth — exchange ADMIN_TOKEN for a volatile session cookie. */
router.post('/auth', adminAuthLimiter, validateBody(AdminSchemas.auth), (req, res) => {
  if (!isAdminPanelEnabled()) {
    return res.status(503).json({ success: false, error: 'SuperLobster Panel is not enabled' });
  }

  const expectedHash = crypto.createHash('sha256').update(process.env.ADMIN_TOKEN!).digest('hex');
  const providedHash = crypto.createHash('sha256').update(req.body.token).digest('hex');

  if (!constantTimeCompare(providedHash, expectedHash)) {
    audit.log('ADMIN_AUTH', {
      actor: 'SUPERLOBSTER', actor_type: 'admin', action: 'admin_login', outcome: 'failure',
      ip_address: Array.isArray(req.ip) ? req.ip[0] : req.ip,
      user_agent: String(req.headers['user-agent'] ?? ''),
    });
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  const sessionToken = createAdminSession();
  res.cookie('sg_admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.ENFORCE_HTTPS === 'true',
    sameSite: 'strict',
    maxAge: 20 * 60 * 1000,
  });
  res.json({ success: true, data: { sessionToken } });
});

/** GET /api/admin/verify — quiet session handshake. */
router.get('/verify', (req, res) => {
  if (!isAdminPanelEnabled()) {
    return res.status(503).json({ success: false, error: 'SuperLobster Panel is not enabled' });
  }
  const sessionToken = getAdminSessionToken(req);
  res.json({ success: isAdminSessionValid(sessionToken) });
});

/** POST /api/admin/logout — destroy the session. */
router.post('/logout', (req, res) => {
  destroyAdminSession(getAdminSessionToken(req));
  res.clearCookie('sg_admin_session');
  res.json({ success: true });
});

// ─── Users (strict metadata only — T3) ────────────────────────────────────────

/**
 * GET /api/admin/users — Lobsters overview.
 * Explicit column whitelist; counts via subqueries; last login from tokens.
 * NEVER select title/category/file_name/url/notes or any payload column.
 */
router.get('/users', requireAdmin, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const users = db.prepare(`
    SELECT
      l.uuid,
      l.username,
      l.display_name,
      l.created_at,
      (SELECT COUNT(*) FROM vault_pearls WHERE owner_uuid = l.uuid) as pearl_count,
      (SELECT COUNT(*) FROM vault_secure_notes WHERE owner_uuid = l.uuid) as note_count,
      (SELECT COUNT(*) FROM vault_ssh_keys WHERE owner_uuid = l.uuid) as key_count,
      (SELECT COUNT(*) FROM vault_secure_attachments WHERE owner_uuid = l.uuid) as attachment_count,
      (SELECT COUNT(*) FROM agent_keys WHERE owner_uuid = l.uuid AND is_active = 1) as active_keys,
      (SELECT MAX(created_at) FROM api_tokens WHERE owner_uuid = l.uuid AND owner_type = 'human') as last_login
    FROM lobsters l
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM lobsters').get() as any;

  res.json({
    success: true,
    data: users,
    pagination: { total: total.count, limit, offset },
  });
});

/**
 * DELETE /api/admin/users/:uuid — cascade delete a lobster and ALL their data.
 * Requires body { expect } matching the target's username OR uuid (T4).
 * Transactional; audit event carries before-counts.
 */
router.delete('/users/:uuid', requireAdmin, validateBody(AdminSchemas.deleteUser), (req, res) => {
  const { uuid } = req.params;
  const { expect } = req.body;

  const lobster = db.prepare('SELECT uuid, username FROM lobsters WHERE uuid = ?').get(uuid) as any;
  if (!lobster) {
    return res.status(404).json({ success: false, error: 'Lobster not found' });
  }

  if (expect !== lobster.uuid && expect !== lobster.username) {
    return res.status(400).json({ success: false, error: 'Confirmation mismatch — type the username exactly.' });
  }

  const counts = (table: string) =>
    (db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE owner_uuid = ?`).get(uuid) as any).c;

  const before = {
    pearls: counts('vault_pearls'),
    notes: counts('vault_secure_notes'),
    keys: counts('vault_ssh_keys'),
    attachments: counts('vault_secure_attachments'),
    agentKeys: counts('agent_keys'),
    tokens: counts('api_tokens'),
  };

  try {
    db.transaction(() => {
      db.prepare('DELETE FROM vault_pearls WHERE owner_uuid = ?').run(uuid);
      db.prepare('DELETE FROM vault_secure_notes WHERE owner_uuid = ?').run(uuid);
      db.prepare('DELETE FROM vault_ssh_keys WHERE owner_uuid = ?').run(uuid);
      db.prepare('DELETE FROM vault_secure_attachments WHERE owner_uuid = ?').run(uuid);
      db.prepare('DELETE FROM agent_keys WHERE owner_uuid = ?').run(uuid);
      db.prepare('DELETE FROM api_tokens WHERE owner_uuid = ?').run(uuid);
      db.prepare('DELETE FROM settings WHERE owner_uuid = ?').run(uuid);
      db.prepare('DELETE FROM lobsters WHERE uuid = ?').run(uuid);
    })();

    adminAudit('ADMIN_USER_DELETED', req, {
      resource: 'lobster',
      details: { targetUuid: uuid, targetUsername: lobster.username, deletedCounts: before },
    });

    res.json({ success: true, data: { deleted: uuid } });
  } catch (err: any) {
    console.error('[SuperLobster] Cascade delete failed:', err);
    res.status(500).json({ success: false, error: 'Cascade delete failed — transaction rolled back.' });
  }
});

// ─── Status / Settings / Uptime / Audit / Backups ────────────────────────────

/** GET /api/admin/status — read-only instance fingerprint. No secrets (T5). */
router.get('/status', requireAdmin, (_req, res) => {
  const settings = Object.fromEntries(
    (db.prepare('SELECT key, value FROM system_settings').all() as any[]).map(r => [r.key, r.value]),
  );
  res.json({
    success: true,
    data: {
      version: process.env.npm_package_version ?? '0.0.0',
      nodeEnv: process.env.NODE_ENV ?? 'development',
      dbType: 'sqlite (better-sqlite3-multiple-ciphers)',
      sqlcipherActive: Boolean(process.env.DB_ENCRYPTION_KEY),
      metadataEncryptionActive: Boolean(process.env.DB_ENCRYPTION_KEY),
      httpsEnforced: process.env.ENFORCE_HTTPS === 'true',
      systemSettings: settings,
    },
  });
});

/** GET /api/admin/settings — current whitelist-relevant system settings. */
router.get('/settings', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM system_settings').all() as any[];
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  res.json({ success: true, data: settings });
});

const SETTINGS_WHITELIST = [
  'audit_retention_days',
  'uptime_retention_days',
  'backup_enabled',
  'backup_interval_minutes',
  'backup_retention_count',
];

/** PATCH /api/admin/settings — whitelist-only writes (T5). */
router.patch('/settings', requireAdmin, validateBody(AdminSchemas.settings), (req, res) => {
  const updates = req.body;
  const applied: Record<string, unknown> = {};

  const upsert = db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  const now = new Date().toISOString();

  db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      if (!SETTINGS_WHITELIST.includes(key)) continue; // silently ignore non-whitelisted
      upsert.run(key, String(value), now);
      applied[key] = value;
    }
  })();

  adminAudit('ADMIN_SETTINGS_UPDATED', { ip: req.ip, headers: req.headers }, { resource: 'system_settings', details: applied });
  res.json({ success: true, data: { applied } });
});

/** GET /api/admin/uptime — historical uptime sessions from the audit reef. */
router.get('/uptime', requireAdmin, (_req, res) => {
  try {
    const events = auditDb.prepare(`
      SELECT timestamp, event_type, details FROM audit_logs
      WHERE event_type IN ('SYSTEM_START', 'SYSTEM_SHUTDOWN')
      ORDER BY timestamp ASC
    `).all() as any[];

    const sessions: Array<{ id: string; start: string; end: string | null; duration: number | null }> = [];
    let current: any = null;

    for (const event of events) {
      const details = JSON.parse(event.details || '{}');
      const sessionId = details.session_id;
      if (event.event_type === 'SYSTEM_START') {
        if (current) sessions.unshift(current);
        current = { id: sessionId, start: event.timestamp, end: null, duration: null };
      } else if (current && current.id === sessionId) {
        current.end = event.timestamp;
        current.duration = Math.floor((new Date(current.end).getTime() - new Date(current.start).getTime()) / 1000);
        sessions.unshift(current);
        current = null;
      }
    }
    if (current) {
      current.duration = Math.floor((Date.now() - new Date(current.start).getTime()) / 1000);
      sessions.unshift(current);
    }

    res.json({ success: true, data: sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch uptime history' });
  }
});

/** GET /api/admin/audit — recent admin/security events from the audit reef. */
router.get('/audit', requireAdmin, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const events = auditDb.prepare(`
    SELECT timestamp, event_type, actor, actor_type, action, outcome, ip_address, details
    FROM audit_logs
    WHERE event_type LIKE 'ADMIN%' OR event_type LIKE 'AUTH%' OR event_type LIKE 'BACKUP%'
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);
  res.json({ success: true, data: events });
});

/** POST /api/admin/backup — one-shot backup (server-side write only, T6). */
router.post('/backup', requireAdmin, async (req, res) => {
  const retentionRow = db.prepare("SELECT value FROM system_settings WHERE key = 'backup_retention_count'").get() as any;
  const retention = retentionRow ? parseInt(retentionRow.value, 10) : 7;

  const result = await performBackup(db, auditDb, { retentionCount: retention, trigger: 'manual' });

  if (!result.ok) {
    adminAudit('BACKUP_FAILED', req, { resource: 'backup', details: { error: result.error } }, 'failure');
    return res.status(500).json({ success: false, error: result.error });
  }

  adminAudit('BACKUP_COMPLETED', req, {
    resource: 'backup',
    details: { files: result.files.map(f => f.split('/').pop()), manifestPath: result.manifestPath?.split('/').pop() },
  });
  res.json({ success: true, data: { files: result.files.map(f => f.split('/').pop()), manifestPath: result.manifestPath?.split('/').pop() } });
});

/** GET /api/admin/backups — list backup sets. No download (T6). */
router.get('/backups', requireAdmin, (_req, res) => {
  res.json({ success: true, data: listBackups() });
});

export default router;


