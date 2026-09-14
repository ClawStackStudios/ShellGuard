# 🗄️ ShellGuard — SQLite Bedrock: Database Schema & Storage

> **DATA_DIR layout, migration system, schema v1, audit segregation & redaction**
> *Pulled into existence by Phase 2. Grows with the walk.*

---

## §1. DATA_DIR Layout & Driver

The storage subsystem is the **Bedrock**: a `DATA_DIR`-rooted sandbox with the
vault database and the audit database strictly segregated.

```
$DATA_DIR/
├── db.sqlite        # vault database (lobsters, tokens, vault payloads)
├── db.sqlite-wal    # WAL journal (WAL mode)
├── audit.sqlite     # segregated append-only audit database
└── audit.sqlite-wal
```

- **Driver**: `better-sqlite3-multiple-ciphers` (enables optional SQLCipher
  encryption-at-rest keyed from `DB_ENCRYPTION_KEY` in a later phase).
- **Pragmas**: `WAL`, `NORMAL` synchronous, `foreign_keys = ON`.
- **Reset tooling**: `scripts/scuttle-reset.ts` wipes the sandbox for fresh starts.

---

## §2. Transactional Migration System

- Migrations live in `migrations/` as paired `NNNN_name.{up,down}.sql` files.
- `migrationRunner.ts` tracks applied migrations in `schema_migrations`;
  each migration runs inside a transaction (all-or-nothing).
- Baseline is **schema v1** (`0001_initial`) — a fresh-start consolidation;
  no legacy data migration is attempted. Legacy inline-DDL singletons are deleted.

---

## §3. Schema v1 (`0001_initial.up.sql`)

> **Zero-knowledge note (load-bearing)**: vault payload columns
> (`secret`, `content`, `key_value`, `file_data`, `totp_secret`, `attachments`)
> hold opaque client-side ShellCryption™ ciphertext. The server stores these
> byte-for-byte and never inspects them.

```sql
CREATE TABLE IF NOT EXISTS lobsters (
  uuid         TEXT PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT,
  key_hash     TEXT NOT NULL UNIQUE,   -- SHA-256(hu- key); plaintext NEVER stored
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_tokens (
  key        TEXT PRIMARY KEY,          -- api- bearer token
  owner_uuid TEXT NOT NULL,
  owner_type TEXT NOT NULL,             -- 'human' | 'agent'
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS vault_pearls (
  id          TEXT PRIMARY KEY,
  owner_uuid  TEXT NOT NULL,            -- tenant isolation: ALWAYS scoped
  title       TEXT NOT NULL,
  secret      TEXT NOT NULL,            -- ShellCryption blob (opaque)
  username    TEXT DEFAULT '',
  url         TEXT DEFAULT '',
  type        TEXT DEFAULT 'password',
  category    TEXT DEFAULT 'Personal',
  notes       TEXT DEFAULT '',
  totp_secret TEXT DEFAULT '',
  attachments TEXT DEFAULT '[]',
  created_at  TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE TABLE IF NOT EXISTS vault_secure_notes (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,             -- ShellCryption blob (opaque)
  category   TEXT DEFAULT 'Personal',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);

CREATE TABLE IF NOT EXISTS vault_ssh_keys (
  id         TEXT PRIMARY KEY,
  owner_uuid TEXT NOT NULL,
  title      TEXT NOT NULL,
  key_value  TEXT NOT NULL,             -- ShellCryption blob (opaque)
  username   TEXT DEFAULT '',
  category   TEXT DEFAULT 'Personal',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_uuid) REFERENCES lobsters(uuid)
);
```

Every owner-bearing index is composed as `(owner_uuid, ...)` — tenant scoping is
physical, not merely conventional.

---

## §4. Audit Segregation & Zero-Knowledge Redaction

- `audit.sqlite` is a **separate database file** — never joined, never swapped.
- `createAuditLogger(db)` inserts into `audit_logs` (timestamp, event_type, actor,
  actor_type, resource, action, outcome, ip_address, user_agent, details).
- **Redaction invariant**: audit rows must NEVER carry vault payload material or
  identity artifacts. `redactDetail()` fails closed on lookalike field names too:

```ts
const SENSITIVE_DETAIL_KEY =
  /keyhash|humankey|raw_?key|api_?key|^key$|token|owner_?key|secret|password|passphrase|content|keyvalue|key_value|filedata|file_data|totp|cipher|title|url|username|displayname/i;
// Any match → '***REDACTED***', recursively, depth-capped at 4.
```

---
