# Forensic Auditing Reef (`audit.sqlite`)

<CopyPage />

Every security event, mutation, authentication attempt, and administrative action in ShellGuard is recorded in an independent, append-only forensic database: `DATA_DIR/audit.sqlite`.

---

## 🩺 Event Schema

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  action TEXT NOT NULL,
  target_uuid TEXT,
  outcome TEXT NOT NULL,
  details TEXT
);
```

---

## 🔒 Redaction Invariant

The audit logger strictly strips confidential information before writing:
- Passwords, notes, TOTP seeds, and filenames never enter the audit log.
- Only the event metadata, target UUID, actor identity (or `SUPERLOBSTER`), and timestamp are recorded.
- The audit database is **never swapped or truncated by database restores**, preserving forensic truth.
