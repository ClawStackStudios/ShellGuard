# Database Schema Ground Truth

<CopyPage />

The database tables are initialized via versioned SQLite migrations in `src/server/db/migrations/`.

---

## 🗄️ Core Tables

### `users`
```sql
CREATE TABLE IF NOT EXISTS users (
  uuid TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_login TEXT
);
```

### `vault_pearls` (Logins)
```sql
CREATE TABLE IF NOT EXISTS vault_pearls (
  uuid TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title TEXT NOT NULL,
  username TEXT,
  url TEXT,
  category TEXT DEFAULT 'Personal',
  secret TEXT NOT NULL,
  totp_secret TEXT,
  notes TEXT,
  attachments TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES users (uuid) ON DELETE CASCADE
);
```

### `vault_secure_attachments`
```sql
CREATE TABLE IF NOT EXISTS vault_secure_attachments (
  uuid TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_data TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES users (uuid) ON DELETE CASCADE
);
```

### `lobster_keys` (Agent Delegation)
```sql
CREATE TABLE IF NOT EXISTS lobster_keys (
  uuid TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT NOT NULL,
  expires_at TEXT,
  rate_limit INTEGER DEFAULT 60,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  FOREIGN KEY (owner_uuid) REFERENCES users (uuid) ON DELETE CASCADE
);
```
