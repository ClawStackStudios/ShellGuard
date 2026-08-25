import { Database } from 'better-sqlite3-multiple-ciphers';

export function initializeAuditSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp   TEXT NOT NULL,
      event_type  TEXT NOT NULL,
      actor       TEXT,
      actor_type  TEXT,
      resource    TEXT,
      action      TEXT NOT NULL,
      outcome     TEXT NOT NULL,
      ip_address  TEXT,
      user_agent  TEXT,
      details     TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor);
    CREATE INDEX IF NOT EXISTS idx_audit_outcome ON audit_logs(outcome);
  `);
}
