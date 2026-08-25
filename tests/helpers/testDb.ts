import type { Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Per-suite database environment for ShellGuard integration suites.
 *
 * Isolation contract (mirrors ClawChives' house pattern):
 *
 *   1. At the very top of the suite, BEFORE any import of the server module,
 *      a self-contained `vi.hoisted(() => {...})` block mkdtemps a unique
 *      `tests/data-<suite>-XXXXXX` directory, points `process.env.DATA_DIR`
 *      at it and neutralises rate limits. Vitest hoists this call above all
 *      static imports, so it always runs first.
 *
 *   2. The suite then loads the server via `loadServer()` — a DYNAMIC
 *      `await import('../server.js')`. The database singleton (connection +
 *      migrations + audit db) evaluates at that moment, against the suite's
 *      private DATA_DIR.
 *
 *   3. `afterAll` calls `releaseServer(handle)` which closes the SQLite
 *      handles and `rm -rf`s the temp directory. Nothing is ever written
 *      outside `tests/data-*`.
 */

/** Minimal structural surface of the better-sqlite3(-multiple-ciphers) handle we rely on. */
export interface SqliteDb {
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): { changes: number };
  };
  close(): void;
}

export interface ServerHandle {
  /** Express app exported by server.ts (`export const app`) */
  app: Express;
  /** Main SQLite handle (`db`), if the module exposes one */
  db?: SqliteDb;
  /** Segregated audit DB handle (`auditDb`), if exposed */
  auditDb?: SqliteDb;
  /** The private DATA_DIR backing this suite */
  dataDir: string;
  /** Raw server module namespace (for extra exports like generateString) */
  module: Record<string, unknown>;
}

/**
 * Schema v1 pins used by direct-SQL assertions (opacity invariant).
 * If a Phase 1 rename lands, fix it HERE and nowhere else.
 */
export const SG_TABLES = {
  lobsters: 'lobsters',
  pearls: { table: 'vault_pearls', blobColumn: 'secret' },
  notes: { table: 'vault_secure_notes', blobColumn: 'content' },
  sshKeys: { table: 'vault_ssh_keys', blobColumn: 'key_value' },
  attachments: { table: 'vault_secure_attachments', blobColumn: 'file_data' },
} as const;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Loads the post-migration server module for the current suite.
 *
 * Expected export surface (plan §Phase 2, CC twin layout):
 *   server.ts → `export const app`, plus `db` / `auditDb` / `generateString`.
 * The `.js` specifier matches the TypeScript ESM convention used across the
 * repo; if only the bare specifier differs after merge, adjust here.
 */
export async function loadServer(): Promise<ServerHandle> {
  const dataDir = process.env.DATA_DIR;
  if (!dataDir || !dataDir.includes(`${path.sep}data-`)) {
    throw new Error(
      '[testDb] process.env.DATA_DIR is not a tests/data-* directory — ' +
        'the vi.hoisted isolation preamble must run before loadServer()'
    );
  }

  let mod: Record<string, unknown>;
  try {
    // House specifier (CC-verbatim): TS source imported with .js extension.
    mod = (await import('../server.js')) as Record<string, unknown>;
  } catch (err) {
    if (isModuleNotFound(err)) {
      // Resolution failure happens before evaluation — safe to retry the
      // literal .ts path in case the compiled-extension convention changed.
      mod = (await import('../server.ts')) as Record<string, unknown>;
    } else {
      throw err;
    }
  }

  const app = mod.app as Express | undefined;
  if (!app) {
    throw new Error(
      '[testDb] server module did not export `app` — expected `export const app` in server.ts'
    );
  }

  return {
    app,
    db: mod.db as SqliteDb | undefined,
    auditDb: mod.auditDb as SqliteDb | undefined,
    dataDir,
    module: mod,
  };
}

function isModuleNotFound(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === 'ERR_MODULE_NOT_FOUND' ||
    e?.code === 'ERR_UNSUPPORTED_DIR_IMPORT' ||
    (typeof e?.message === 'string' && e.message.includes('Cannot find module'))
  );
}

/**
 * Closes the suite's database handles and removes its temp DATA_DIR.
 * Safe to call even when loading failed halfway (all steps are guarded).
 */
export async function releaseServer(handle: ServerHandle | undefined): Promise<void> {
  if (!handle) return;

  for (const db of [handle.db, handle.auditDb]) {
    try {
      db?.close();
    } catch {
      // already closed / never opened — nothing to salvage
    }
  }

  try {
    if (handle.dataDir.startsWith(path.join(__dirname, '..'))) {
      fs.rmSync(handle.dataDir, { recursive: true, force: true });
    }
  } catch {
    // best-effort cleanup; CI sweeps tests/data-* anyway
  }
}
