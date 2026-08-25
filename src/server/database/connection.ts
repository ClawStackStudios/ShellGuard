import Database from 'better-sqlite3-multiple-ciphers';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DATA_DIR: use env var or fall back to ./data in project root
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '..', '..', '..', 'data');

if (!fs.existsSync(DATA_DIR) && process.env.NODE_ENV !== 'test') {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

// ─── Database Encryption (SQLCipher / ShellCryption™) ──────────────────────────
const encryptionKey = process.env.DB_ENCRYPTION_KEY;

// Validate encryption key at startup
if (encryptionKey) {
  if (!/^[a-zA-Z0-9+/=]+$/.test(encryptionKey)) {
    throw new Error('[DB] DB_ENCRYPTION_KEY must be base64-encoded (alphanumeric, +, /, = only).');
  }
}

function encryptExistingDatabase(dbPath: string, key: string) {
  const resolvedDbPath = path.resolve(dbPath);
  const tempPath = resolvedDbPath + '.tmp';

  try {
    const plain = new Database(resolvedDbPath);
    plain.exec(`
      ATTACH DATABASE '${tempPath}' AS encrypted KEY '${key}';
      SELECT sqlcipher_export('encrypted');
      DETACH DATABASE encrypted;
    `);
    plain.close();
    fs.renameSync(tempPath, resolvedDbPath);
    console.log(`[DB] ✅ Database ${path.basename(dbPath)} encrypted successfully.`);
  } catch (e) {
    try { fs.unlinkSync(tempPath); } catch {}
    throw e;
  }
}

function ensureDbPermissions(targetPath: string) {
  if (targetPath === ':memory:') return;
  try {
    if (fs.existsSync(targetPath)) fs.chmodSync(targetPath, 0o600);
    ['shm', 'wal'].forEach(ext => {
      const sidecar = `${targetPath}-${ext}`;
      if (fs.existsSync(sidecar)) fs.chmodSync(sidecar, 0o600);
    });
  } catch (e) {
    console.warn('[DB] Warning: could not set permissions:', e);
  }
}

export function createConnection(filename: string, key?: string): Database.Database {
  const dbPath = filename === ':memory:' ? ':memory:' : path.join(DATA_DIR, filename);

  // Set restrictive umask for DB file creation (0o077 = owner only)
  const originalUmask = process.umask(0o077);

  try {
    const db = new Database(dbPath);

    if (key) {
      db.pragma(`key = '${key}'`);
      try {
        db.prepare('SELECT count(*) FROM sqlite_master').get();
      } catch (e: any) {
        if (e.message.includes('not a database') || e.message.includes('is not a database')) {
          console.log(`[DB] Detected unencrypted database ${filename} — migrating to encrypted...`);
          db.close();
          encryptExistingDatabase(dbPath, key);
          const encrypted = new Database(dbPath);
          encrypted.pragma(`key = '${key}'`);
          ensureDbPermissions(dbPath);
          return encrypted;
        }
        throw e;
      }
    } else if (filename === 'db.sqlite') {
      console.warn('[DB] WARNING: DB_ENCRYPTION_KEY is not set — database is unencrypted at rest.');
    }

    ensureDbPermissions(dbPath);

    // Standard Pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');

    return db;
  } finally {
    process.umask(originalUmask);
  }
}

export const dbInstance = createConnection('db.sqlite', process.env.DB_ENCRYPTION_KEY);
export default dbInstance;
