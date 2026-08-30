import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs, { existsSync } from 'fs';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

import { getCorsConfig } from './src/config/corsConfig.js';
import { apiLimiter, createAgentKeyRateLimiter, adminAuthLimiter } from './src/server/middleware/rateLimiter.js';
import { errorHandler } from './src/server/middleware/errorHandler.js';
import { httpsRedirect } from './src/server/middleware/httpsRedirect.js';
import { purgeExpiredTokens } from './src/server/database/index.js';
import { scheduleTokenCleanup } from './src/server/utils/tokenExpiry.js';
import { generateId, generateString } from './src/server/utils/crypto.js';
import { initFieldCipher } from './src/server/utils/fieldEncryption.js';
import db, { audit, auditDb } from './src/server/database/index.js';

import authRoutes      from './src/server/routes/auth.js';
import vaultRoutes       from './src/server/routes/vault.js';
import notesRoutes       from './src/server/routes/notes.js';
import keysRoutes        from './src/server/routes/sshKeys.js';
import attachmentsRoutes from './src/server/routes/attachments.js';
import agentKeyRoutes    from './src/server/routes/agentKeys.js';
import settingsRoutes    from './src/server/routes/settings.js';
import adminRoutes       from './src/server/routes/admin.js';
import { performBackup } from './src/server/utils/backupManager.js';
import { ensureTlsMaterials } from './src/server/utils/tlsManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT = parseInt(process.env.PORT ?? '6565', 10);
const isProduction = process.env.NODE_ENV === 'production';

// ─── Export for tests ────────────────────────────────────────────────────────
export { db, audit, auditDb, generateId, generateString };
export const app = express();

const SESSION_ID = crypto.randomUUID();

// ─── Startup tasks ───────────────────────────────────────────────────────────
purgeExpiredTokens();
scheduleTokenCleanup(db);

/** Initialize per-row field encryption (BLOCKS until key derivation is complete). */
try {
  await initFieldCipher();
} catch (err) {
  console.error('[FieldEncryption] ⚠️ Failed to initialize metadata cipher:', err);
  console.warn('[FieldEncryption] Metadata encryption DISABLED for this session.');
}

async function performCleanup() {
  try {
    const auditRetentionRow = db.prepare("SELECT value FROM system_settings WHERE key = 'audit_retention_days'").get() as any;
    const uptimeRetentionRow = db.prepare("SELECT value FROM system_settings WHERE key = 'uptime_retention_days'").get() as any;

    const auditDays = auditRetentionRow ? parseInt(auditRetentionRow.value, 10) : 90;
    const uptimeDays = uptimeRetentionRow ? parseInt(uptimeRetentionRow.value, 10) : 30;

    audit.cleanup(auditDays, uptimeDays);
  } catch (err) {
    console.error('[Cleanup] Error:', err);
  }
}

performCleanup(); // Run immediately on startup
setInterval(performCleanup, 24 * 60 * 60 * 1000); // Daily cleanup

// ─── Scheduled Backups (SuperLobster / ADMIN.md §3.2) ────────────────────────
// Reads backup_enabled / backup_interval_minutes / backup_retention_count from
// system_settings at every tick — settings changes apply without a restart.
// The ticker checks every 60s whether the interval has elapsed.
const BACKUP_TICK_MS = 60 * 1000;
async function runScheduledBackup() {
  try {
    const getSetting = (key: string) =>
      (db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key) as any)?.value;

    if (getSetting('backup_enabled') !== 'true') return;

    const intervalMin = parseInt(getSetting('backup_interval_minutes') ?? '1440', 10);
    if (Number.isNaN(intervalMin) || intervalMin < 15) return;

    const backups = (await import('./src/server/utils/backupManager.js')).listBackups();
    const newest = backups[0];
    const elapsedMs = newest ? Date.now() - new Date(newest.created).getTime() : Infinity;
    if (elapsedMs < intervalMin * 60 * 1000) return; // not due yet

    const retention = parseInt(getSetting('backup_retention_count') ?? '7', 10);
    const result = await performBackup(db, auditDb, { retentionCount: retention, trigger: 'scheduled' });
    if (result.ok) {
      audit.log('BACKUP_COMPLETED', {
        actor: 'SUPERLOBSTER', actor_type: 'admin', action: 'backup_completed', outcome: 'success',
        details: { files: result.files.map(f => f.split('/').pop()), trigger: 'scheduled' },
      });
      console.log(`[Backup] ✅ Scheduled backup written (${result.files.length} files).`);
    } else {
      audit.log('BACKUP_FAILED', {
        actor: 'SUPERLOBSTER', actor_type: 'admin', action: 'backup_failed', outcome: 'failure',
        details: { error: result.error, trigger: 'scheduled' },
      });
      console.error('[Backup] ⚠️ Scheduled backup failed:', result.error);
    }
  } catch (err: any) {
    console.error('[Backup] Scheduler error:', err?.message);
  }
}
const backupTicker = setInterval(runScheduledBackup, BACKUP_TICK_MS);
backupTicker.unref();

// ─── Trust proxy ─────────────────────────────────────────────────────────────
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(httpsRedirect);

// Delta #3: ShellGuard has no reader-mode feature — no jina/microlink connect-src
// HSTS activates when TLS termination happens here (native TLS or ENFORCE_HTTPS
// behind a proxy). Browsers ignore the header over plain HTTP, so it is inert
// in LAN-HTTP mode.
const hstsEnabled = process.env.ENFORCE_HTTPS === 'true' || process.env.TLS_ENABLED === 'true';
app.use(helmet({
  strictTransportSecurity: hstsEnabled ? undefined : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc:      ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:       ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:        ["'self'", 'data:', 'https:'],
      connectSrc:    ["'self'", 'wss:', 'ws:'],
      frameAncestors: isProduction ? ["'self'"] : ["'self'", "*"],
      upgradeInsecureRequests: process.env.ENFORCE_HTTPS === 'true' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy:   false,
  originAgentCluster:        false,
  frameguard: isProduction ? { action: 'sameorigin' } : false,
}));

app.use(cors(getCorsConfig()));

// Delta #4: 1mb global body ceiling; dedicated 32mb ceiling for encrypted
// attachment uploads only (base64 ciphertext needs headroom, nothing else does).
// The scoped parser runs first; the global one no-ops on already-parsed bodies.
app.use('/api/attachments', express.json({ limit: '32mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Agent rate limiter (applied after requireAuth populates req.keyType)
const agentRateLimiter = createAgentKeyRateLimiter();
app.use('/api', agentRateLimiter);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const counts = {
    vaultPearls:   (db.prepare('SELECT COUNT(*) as c FROM vault_pearls').get() as any).c,
    secureNotes:   (db.prepare('SELECT COUNT(*) as c FROM vault_secure_notes').get() as any).c,
    sshKeys:       (db.prepare('SELECT COUNT(*) as c FROM vault_ssh_keys').get() as any).c,
    attachments:   (db.prepare('SELECT COUNT(*) as c FROM vault_secure_attachments').get() as any).c,
    agentKeys:     (db.prepare("SELECT COUNT(*) as c FROM agent_keys WHERE is_active = 1").get() as any).c,
  };
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkgVersion = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version : 'unknown';

  res.json({
    success: true, service: 'ShellGuard API', version: pkgVersion,
    mode: 'sqlite', uptime: process.uptime(), counts,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/vault',        vaultRoutes);
app.use('/api/notes',        notesRoutes);
app.use('/api/keys',         keysRoutes);
app.use('/api/attachments',  attachmentsRoutes);
app.use('/api/agent-keys',   agentKeyRoutes);
app.use('/api/settings',     settingsRoutes);
// SuperLobster Panel — cookie-session auth isolated from user Bearer tokens.
// The stricter token-auth rate limiter is applied inside routes/admin.ts (T1).
app.use('/api/admin',        adminRoutes);

// Skill doc: public, no auth — registered before static files and SPA catch-all
app.get(['/skill.md', '/SKILL.md'], (_req, res) => {
  const paths = [
    path.join(__dirname, 'skills/shellguard/SKILL.md'),
    path.join(process.cwd(), 'skills/shellguard/SKILL.md'),
  ];
  const found = paths.find(p => existsSync(p));
  if (!found) return res.status(404).send('Skill document not found.');
  res.sendFile(found);
});

// ─── Static Files (Production) ────────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath, {
  maxAge: '1y',  // Default cache header for hashed assets
  immutable: true, // Tells browsers hashed assets never change
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      // Bypass cache for index.html — always fetch fresh on new releases
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Hashed assets (JS/CSS chunks) can be cached indefinitely
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// SPA catch-all: serve index.html for any non-API, non-asset route
// ⚠️ Do NOT change this regex — Express 5 rejects '*' paths, and it prevents CSS/JS from being served as index.html
app.get(/^(?!\/api\/)(?!\/assets\/)(?!\/skill\.md).*/, (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  // Delta #13: dotfiles:'allow' — repos checked out under dot-directories (e.g. .claude-worktrees/*)
  // otherwise trip send's default dotfile policy, which 404s before stat on ANY path segment.
  res.sendFile(path.join(distPath, 'index.html'), { dotfiles: 'allow' });
});

// ─── 404 + Error Handler ─────────────────────────────────────────────────────
app.use('/api', (_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const HOST = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1');
const tlsEnabled = process.env.TLS_ENABLED === 'true';

function onListening(protocol: 'http' | 'https', tls?: { generated: boolean; fingerprint: string; certPath: string }) {
  audit.log('SYSTEM_START', { action: 'system_start', outcome: 'success', details: { session_id: SESSION_ID, protocol } });
  console.log(`\n🐚 ShellGuard©™ API scuttling on port ${PORT}${protocol === 'https' ? ' (TLS)' : ''}`);
  if (tls) {
    console.log(`   Certificate: ${tls.generated ? 'generated' : 'loaded'} — ${tls.certPath}`);
    console.log(`   Fingerprint: ${tls.fingerprint}`);
    console.log(`   First visit: accept the self-signed certificate warning once — the cert persists across restarts.`);
  }
  console.log(`   Health: ${protocol}://localhost:${PORT}/api/health\n`);
}

let server: http.Server | https.Server;

if (tlsEnabled) {
  try {
    const tls = await ensureTlsMaterials();
    server = https.createServer({ key: tls.key, cert: tls.cert }, app).listen(PORT, HOST, () =>
      onListening('https', { generated: tls.generated, fingerprint: tls.fingerprint, certPath: tls.certPath }),
    );
  } catch (err: any) {
    console.error(`[TLS] ⚠️ Failed to start with TLS: ${err.message}`);
    console.error('[TLS]    Falling back to plain HTTP. Fix TLS_CERT_PATH/TLS_KEY_PATH or unset TLS_ENABLED.');
    server = app.listen(PORT, HOST, () => onListening('http'));
  }
} else {
  server = app.listen(PORT, HOST, () => onListening('http'));
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
function handleShutdown(signal: string) {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  audit.log('SYSTEM_SHUTDOWN', { action: 'system_shutdown', outcome: 'success', details: { session_id: SESSION_ID, reason: signal } });
  server.close(() => {
    console.log('HTTP server closed.');
    db.close();
    auditDb.close();
    console.log('Database connections closed.');
    process.exit(0);
  });

  // Force close if taking too long
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
