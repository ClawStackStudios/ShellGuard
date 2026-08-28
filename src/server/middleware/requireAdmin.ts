/**
 * requireAdmin.ts — ShellGuard©™ SuperLobster Panel
 *
 * Middleware for validating SuperLobster (admin) sessions.
 * In-memory, volatile, and isolated from user auth — twin of the
 * ClawChives requireAdmin pattern (itself adapted from PinchPad).
 *
 * Threat-model notes (ADMIN.md §2):
 *   T1 — no ADMIN_TOKEN env => panel does not exist (routes return 503)
 *   T2 — sessions are volatile (gone on restart), 20-min sliding expiry,
 *        httpOnly + SameSite=Strict cookie in a separate namespace
 *        (sg_admin_session) from user Bearer tokens.
 *
 * Maintained by CrustAgent©™
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// In-memory admin session store (intentionally volatile — a restart
// invalidates every admin session, which is exactly what we want).
const adminSessions = new Map<string, { expiresAt: number }>();

// Cleanup interval (every minute) — mirrors ClawChives pattern.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, session] of adminSessions) {
    if (session.expiresAt <= now) adminSessions.delete(key);
  }
}, 60_000);
cleanupTimer.unref(); // never hold the process open for cleanup alone

const SESSION_TTL_MS = 20 * 60 * 1000; // 20 minutes, sliding

/** Extracts the admin session token from cookie or X-Admin-Session header. */
export function getAdminSessionToken(req: Request): string | undefined {
  return (req.headers['x-admin-session'] as string) || req.cookies?.['sg_admin_session'];
}

/**
 * Middleware: rejects requests without a valid, unexpired admin session.
 * Refreshes the session on activity (20 more minutes).
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionToken = getAdminSessionToken(req);

  if (!sessionToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: SuperLobster session required.' });
  }

  const session = adminSessions.get(sessionToken);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) adminSessions.delete(sessionToken);
    return res.status(401).json({ success: false, error: 'Session expired. Please re-authenticate.' });
  }

  // Sliding expiry — activity keeps the session alive.
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  next();
}

/**
 * Quiet validity check without erroring — used by the verify handshake
 * to keep the browser console clean.
 */
export function isAdminSessionValid(token: string | undefined): boolean {
  if (!token) return false;
  const session = adminSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) adminSessions.delete(token);
    return false;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return true;
}

/** Creates a new volatile admin session and returns its token. */
export function createAdminSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

/** Destroys an admin session. */
export function destroyAdminSession(token: string | undefined) {
  if (token) adminSessions.delete(token);
}

/** True when the SuperLobster panel is enabled (ADMIN_TOKEN env is set). */
export function isAdminPanelEnabled(): boolean {
  return Boolean(process.env.ADMIN_TOKEN && process.env.ADMIN_TOKEN.length > 0);
}
