/**
 * backupManager.ts — ShellGuard©™ Instance Failsafe Backups
 *
 * Tier 2 backup system (ADMIN.md §3.2): SQLCipher-consistent copies of both
 * db.sqlite and audit.sqlite via SQLite's Online Backup API
 * (better-sqlite3 .backup() — WAL-safe, live-consistent, no restart).
 *
 * Security properties:
 *   - Files are written server-side to DATA_DIR/backups/ ONLY (T6).
 *     There is no download path anywhere.
 *   - A copy of a SQLCipher-encrypted DB is itself encrypted with the same
 *     key — zero extra key management.
 *   - Every backup gets a manifest (timestamp, version, key note, SHA-256)
 *     and rotation keeps the last N.
 *
 * Maintained by CrustAgent©™
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3-multiple-ciphers';
import type { Database as DB } from 'better-sqlite3-multiple-ciphers';
import { DATA_DIR } from '../database/connection.js';

export const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export interface BackupResult {
  ok: boolean;
  files: string[];
  manifestPath?: string;
  error?: string;
}

export interface BackupManifest {
  timestamp: string;
  version: string;
  files: Array<{ name: string; sha256: string; bytes: number }>;
  /** Whether DB_ENCRYPTION_KEY was set at backup time (SQLCipher active). */
  encryptionActive: boolean;
  note: string;
}

// Concurrency guard: skip a scheduler tick if a backup is already running.
let backupInProgress = false;

/** Filesystem-safe timestamp: 2026-08-28T02-34-56Z */
function backupTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sha256File(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Performs a consistent backup of both databases into DATA_DIR/backups/.
 * Uses the SQLite Online Backup API — safe against live WAL writes.
 * Rotation trims old backups beyond `retentionCount`.
 */
export async function performBackup(
  db: DB,
  auditDb: DB,
  options: { retentionCount?: number; trigger?: string } = {},
): Promise<BackupResult> {
  if (backupInProgress) {
    return { ok: false, files: [], error: 'A backup is already in progress.' };
  }
  backupInProgress = true;

  const stamp = backupTimestamp();
  const retention = options.retentionCount ?? 7;
  const filesWritten: string[] = [];

  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });

    // Online Backup API — WAL-safe, live-consistent snapshots.
    const dbDest = path.join(BACKUP_DIR, `db-${stamp}.sqlite`);
    const auditDest = path.join(BACKUP_DIR, `audit-${stamp}.sqlite`);

    await db.backup(dbDest);
    await auditDb.backup(auditDest);

    // Restrictive permissions — these files may contain plaintext tokens.
    fs.chmodSync(dbDest, 0o600);
    fs.chmodSync(auditDest, 0o600);
    filesWritten.push(dbDest, auditDest);

    const manifest: BackupManifest = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
      files: filesWritten.map(f => ({
        name: path.basename(f),
        sha256: sha256File(f),
        bytes: fs.statSync(f).size,
      })),
      encryptionActive: Boolean(process.env.DB_ENCRYPTION_KEY),
      note: process.env.DB_ENCRYPTION_KEY
        ? 'SQLCipher copy — opens with DB_ENCRYPTION_KEY in force at backup time.'
        : 'WARNING: instance was unencrypted at backup time — this file contains plaintext tokens.',
    };

    const manifestPath = path.join(BACKUP_DIR, `manifest-${stamp}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 });

    rotateBackups(retention);

    return { ok: true, files: filesWritten, manifestPath };
  } catch (err: any) {
    return { ok: false, files: filesWritten, error: err?.message ?? 'Unknown backup failure' };
  } finally {
    backupInProgress = false;
  }
}

/**
 * Rotation: keeps the newest `retentionCount` backup sets (db-* + audit-* +
 * manifest-* sharing a timestamp), deletes older ones.
 */
export function rotateBackups(retentionCount: number): number {
  if (!fs.existsSync(BACKUP_DIR)) return 0;

  const stamps = new Set<string>();
  for (const f of fs.readdirSync(BACKUP_DIR)) {
    if (/^(?:db|audit|manifest)-20\d{2}-/.test(f)) {
      stamps.add(f.replace(/^(?:db|audit|manifest)-/, ''));
    }
  }

  const sorted = [...stamps].sort().reverse(); // newest first
  const doomed = sorted.slice(retentionCount);
  let deleted = 0;

  for (const stamp of doomed) {
    for (const f of fs.readdirSync(BACKUP_DIR)) {
      if (f.endsWith(stamp)) {
        fs.rmSync(path.join(BACKUP_DIR, f), { force: true });
        deleted++;
      }
    }
  }
  return deleted;
}

/**
 * Read-only validation used by `scuttle:restore` (never an HTTP endpoint).
 * Opens a THROWAWAY copy of the file with the provided key and verifies the
 * schema_migrations table exists. Never mutates the original file.
 */
export function verifyBackup(filePath: string, key?: string): { valid: boolean; schemaVersion?: number; error?: string } {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'File not found' };
  }

  // Work on a copy so a corrupt/malicious file can never touch the original.
  const tmp = `${filePath}.verify-${process.pid}-${Date.now()}`;
  fs.copyFileSync(filePath, tmp);

  let handle: Database.Database | null = null;
  try {
    handle = new Database(tmp);
    if (key) handle.pragma(`key = '${key}'`);

    const row = handle.prepare('SELECT MAX(version) as v FROM schema_migrations').get() as { v: number | null } | undefined;
    return { valid: true, schemaVersion: row?.v ?? 0 };
  } catch {
    // Uniform error — never reveal which part failed (key-oracle posture).
    return { valid: false, error: 'Backup rejected — invalid file or wrong key' };
  } finally {
    try { handle?.close(); } catch { /* already closed */ }
    fs.rmSync(tmp, { force: true });
  }
}

/** Lists backup sets (newest first) for the panel's Backups section. */
export function listBackups(): Array<{ name: string; bytes: number; created: string }> {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('db-') && f.endsWith('.sqlite'))
    .sort()
    .reverse()
    .map(f => {
      const st = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, bytes: st.size, created: st.mtime.toISOString() };
    });
}

