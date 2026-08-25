import { Database } from 'better-sqlite3-multiple-ciphers';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  version: number;
  name: string;
  upPath: string;
  downPath: string;
}

/**
 * High-Integrity SQLite Migration Runner
 * Manages transactional UP/DOWN schemas and tracks history
 */
export class MigrationRunner {
  private db: Database;
  private migrationsDir: string;

  constructor(db: Database) {
    this.db = db;
    this.migrationsDir = path.join(process.cwd(), 'migrations');
  }

  /**
   * Initialize migrations log table
   */
  private initSchemaTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    INTEGER PRIMARY KEY,
        name       TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);
  }

  /**
   * Scan /migrations folder and assemble sorted up/down lists
   */
  private discoverMigrations(): Migration[] {
    if (!fs.existsSync(this.migrationsDir)) {
      console.warn(`[DB Migration] ⚠️  Migrations folder not found at ${this.migrationsDir}. Creating folder...`);
      fs.mkdirSync(this.migrationsDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir);
    const migrationMap = new Map<number, Partial<Migration>>();

    const fileRegex = /^(\d{4})_(.+)\.(up|down)\.sql$/;

    for (const file of files) {
      const match = file.match(fileRegex);
      if (!match) continue;

      const version = parseInt(match[1], 10);
      const name = match[2];
      const type = match[3];
      const fullPath = path.join(this.migrationsDir, file);

      if (!migrationMap.has(version)) {
        migrationMap.set(version, { version, name });
      }

      const m = migrationMap.get(version)!;
      if (type === 'up') {
        m.upPath = fullPath;
      } else {
        m.downPath = fullPath;
      }
    }

    const migrations: Migration[] = [];
    for (const [version, partial] of migrationMap.entries()) {
      if (!partial.upPath || !partial.downPath) {
        throw new Error(
          `[DB Migration] ❌ Orphaned migration detected for version ${version}. Both .up.sql and .down.sql are required.`
        );
      }
      migrations.push({
        version,
        name: partial.name!,
        upPath: partial.upPath,
        downPath: partial.downPath,
      });
    }

    return migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Run all pending UP migrations to reach latest schema version
   */
  public migrateToLatest() {
    this.initSchemaTable();
    const migrations = this.discoverMigrations();

    const appliedRow = this.db.prepare('SELECT MAX(version) as max_ver FROM schema_migrations').get() as { max_ver: number | null };
    const currentVersion = appliedRow.max_ver || 0;

    const pending = migrations.filter((m) => m.version > currentVersion);

    if (pending.length === 0) {
      console.log(`[DB Migration] ✅  Database schema is up to date (Version ${currentVersion}).`);
      return;
    }

    console.log(`[DB Migration] 🚀 Found ${pending.length} pending migration(s). Upgrading from Version ${currentVersion}...`);

    for (const migration of pending) {
      console.log(`[DB Migration] Applying version ${migration.version} (${migration.name})...`);
      const sql = fs.readFileSync(migration.upPath, 'utf8');

      // Execute SQL and log version in a single Transaction
      const applyTx = this.db.transaction((queries: string, ver: number, mName: string) => {
        this.db.exec(queries);
        this.db.prepare(`
          INSERT INTO schema_migrations (version, name, applied_at)
          VALUES (?, ?, datetime('now'))
        `).run(ver, mName);
      });

      try {
        applyTx(sql, migration.version, migration.name);
        console.log(`[DB Migration] ✅  Applied migration v${migration.version} successfully.`);
      } catch (err) {
        console.error(`[DB Migration] ❌ Failed to apply migration v${migration.version}:`, err);
        throw err;
      }
    }
  }

  /**
   * Rollback schema migrations by a specified number of steps
   */
  public migrateDown(steps: number = 1) {
    this.initSchemaTable();
    const migrations = this.discoverMigrations();

    const applied = this.db.prepare('SELECT version FROM schema_migrations ORDER BY version DESC').all() as { version: number }[];

    if (applied.length === 0) {
      console.log('[DB Migration] ✅  No migrations applied. Nothing to rollback.');
      return;
    }

    const stepsToRollback = Math.min(steps, applied.length);
    const targetVersions = applied.slice(0, stepsToRollback).map(a => a.version);

    console.log(`[DB Migration] ⚠️  Rolling back ${stepsToRollback} migration(s): [${targetVersions.join(', ')}]...`);

    for (const ver of targetVersions) {
      const migration = migrations.find(m => m.version === ver);
      if (!migration) {
        throw new Error(`[DB Migration] ❌ Migration configuration for version ${ver} not found in codebase.`);
      }

      console.log(`[DB Migration] Rolling back version ${migration.version} (${migration.name})...`);
      const sql = fs.readFileSync(migration.downPath, 'utf8');

      const rollbackTx = this.db.transaction((queries: string, v: number) => {
        this.db.exec(queries);
        this.db.prepare('DELETE FROM schema_migrations WHERE version = ?').run(v);
      });

      try {
        rollbackTx(sql, migration.version);
        console.log(`[DB Migration] ✅  Rolled back migration v${migration.version} successfully.`);
      } catch (err) {
        console.error(`[DB Migration] ❌ Failed to rollback migration v${migration.version}:`, err);
        throw err;
      }
    }
  }
}

/**
 * Standard server entrypoint for migrating database
 */
export function runMigrations(db: Database) {
  const runner = new MigrationRunner(db);
  runner.migrateToLatest();
}
