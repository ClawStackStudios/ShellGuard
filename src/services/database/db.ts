import Database from "better-sqlite3-multiple-ciphers";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🐚 Bedrock initialization
const dbPath = path.resolve(process.cwd(), "shellguard.db");
const db = new Database(dbPath);

// 🏗️ Schema Construction
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lobsters (
      uuid TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      key_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vault_pearls (
      id TEXT PRIMARY KEY,
      owner_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      secret TEXT NOT NULL,
      username TEXT,
      url TEXT,
      type TEXT DEFAULT 'password',
      category TEXT DEFAULT 'Personal',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
    );

    CREATE TABLE IF NOT EXISTS lobster_keys (
      id TEXT PRIMARY KEY,
      owner_uuid TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      permissions TEXT NOT NULL, -- JSON string
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      token TEXT PRIMARY KEY,
      owner_uuid TEXT NOT NULL,
      owner_type TEXT NOT NULL, -- 'human' | 'lobster'
      permissions TEXT, -- JSON string for lobsters
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vault_secure_notes (
      id TEXT PRIMARY KEY,
      owner_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'Personal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
    );

    CREATE TABLE IF NOT EXISTS vault_ssh_keys (
      id TEXT PRIMARY KEY,
      owner_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      key_value TEXT NOT NULL,
      username TEXT,
      category TEXT DEFAULT 'Personal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
    );

    CREATE TABLE IF NOT EXISTS vault_secure_attachments (
      id TEXT PRIMARY KEY,
      owner_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      file_data TEXT NOT NULL,
      file_name TEXT,
      mime_type TEXT,
      category TEXT DEFAULT 'Personal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
    );
  `);

  // Migrations for existing databases
  try {
    db.exec(`ALTER TABLE lobsters ADD COLUMN display_name TEXT;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE vault_pearls ADD COLUMN username TEXT;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE vault_pearls ADD COLUMN url TEXT;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE vault_pearls ADD COLUMN type TEXT DEFAULT 'password';`);
  } catch {}

  try {
    db.exec(`ALTER TABLE vault_pearls ADD COLUMN notes TEXT;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE vault_pearls ADD COLUMN totp_secret TEXT;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE vault_pearls ADD COLUMN attachments TEXT DEFAULT '[]';`);
  } catch {}

} catch (e) {
  console.error("Schema init warning:", e);
}

export default db;
