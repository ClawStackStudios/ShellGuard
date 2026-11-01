import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import {
  registerListener,
  getEventsSince,
  formatSseEvent,
  RiverEvent,
} from '../utils/reactiveRiver.js';

const router = Router();

/**
 * Middleware enabling token auth via query parameter (?token=...)
 * for browser native EventSource clients that cannot send custom HTTP headers.
 */
function queryTokenAdapter(req: Request, _res: Response, next: NextFunction): void {
  if (!req.headers.authorization && req.query.token && typeof req.query.token === 'string') {
    req.headers.authorization = `Bearer ${req.query.token.trim()}`;
  }
  next();
}

/**
 * 🌊 GET /api/sync/events — Server-Sent Events stream for reactive mutation updates.
 *
 * Scoped by owner_uuid (strict tenant isolation).
 * Emits vault_mutation frames (<50ms delivery), replays missed events via Last-Event-ID,
 * and maintains keepalive heartbeat comments every 25s.
 */
router.get('/events', queryTokenAdapter, requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const ownerUuid = authReq.userUuid;

  // Enforce unbuffered, streaming SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Initial connection acknowledgement
  res.write(': river connected\n\n');

  // Replay missed events if client reconnected with a cursor
  const lastEventId =
    (req.headers['last-event-id'] as string | undefined) ||
    (typeof req.query.lastEventId === 'string' ? req.query.lastEventId : undefined);

  if (lastEventId) {
    const missedEvents = getEventsSince(ownerUuid, lastEventId);
    for (const ev of missedEvents) {
      res.write(formatSseEvent(ev));
    }
  }

  // Live listener callback
  const onMutation = (ev: RiverEvent) => {
    try {
      res.write(formatSseEvent(ev));
    } catch (err) {
      console.error('[SyncRoute] ⚠️ Failed to write SSE frame:', err);
    }
  };

  const unsubscribe = registerListener(ownerUuid, onMutation);

  // 25s heartbeat keepalive to prevent proxy socket termination
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeatInterval);
      unsubscribe();
    }
  }, 25000);

  // Clean teardown on socket close
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    unsubscribe();
  });
});

export default router;
