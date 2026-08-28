/**
 * restore.ts — ShellGuard©™ scuttle:restore
 *
 * Read-only backup validator. NEVER auto-swaps the live database.
 * Verifies the file opens with the provided DB_ENCRYPTION_KEY (against a
 * throwaway copy), checks the schema version, then prints the exact
 * operator instructions (ADMIN.md §5).
 *
 * Usage:
 *   npm run scuttle:restore -- --file data/backups/db-....sqlite --key <DB_ENCRYPTION_KEY>
 *
 * Maintained by CrustAgent©™
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const file = getArg('file');
  const key = getArg('key');

  if (!file) {
    console.error('Usage: npm run scuttle:restore -- --file <path/to/backup.sqlite> [--key <DB_ENCRYPTION_KEY>]');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`✖ File not found: ${filePath}`);
    process.exit(1);
  }

  // Dynamic import so DATA_DIR resolution happens after dotenv loads.
  const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '..', 'data');
  const { verifyBackup } = await import('../src/server/utils/backupManager.js');
  const result = verifyBackup(filePath, key);

  if (!result.valid) {
    console.error(`✖ ${result.error}`);
    console.error('  (The file may be corrupt, not a ShellGuard backup, or the key is wrong for it.)');
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  console.log(`✔ Backup verified — schema version ${result.schemaVersion}, ${stat.size.toLocaleString()} bytes`);
  console.log('');
  console.log('To restore this backup (offline by design — ADMIN.md §5):');
  console.log('');
  console.log(`  1. Stop ShellGuard:            npm run scuttle:stop  (or: docker stop <container>)`);
  console.log(`  2. Clear stale WAL files:      rm ${DATA_DIR}/db.sqlite-wal ${DATA_DIR}/db.sqlite-shm`);
  console.log(`  3. Swap the database:          cp ${filePath} ${DATA_DIR}/db.sqlite`);
  console.log(`  4. Set DB_ENCRYPTION_KEY to the key this backup was taken with`);
  console.log(`  5. Start ShellGuard:           npm run scuttle:prod-start  (or: docker start <container>)`);
  console.log('');
  console.log('  Users log in with their own hu- keys — no re-registration needed.');
  console.log('  The audit reef (audit.sqlite) is never swapped by a restore.');
  console.log('');
  console.log('This script NEVER modifies or replaces the live database.');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
