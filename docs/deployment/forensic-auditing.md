# Forensic Auditing Reef (`audit.sqlite`)

<CopyPage />

Every security event, mutation, authentication attempt, and administrative action in ShellGuard is recorded in an independent, append-only forensic database: `DATA_DIR/audit.sqlite`.

---

## 🩺 Event Schema (`audit_logs`)

```sql
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
```

---

## 📋 Tracked Event Families

| Event Family | Representative Event Types | Tracked Metadata |
| :--- | :--- | :--- |
| **Vault Mutations** | `VAULT_ITEM_CREATED`, `VAULT_ITEM_UPDATED`, `VAULT_ITEM_DELETED` | `itemId`, `itemType`, `category`, `tags`, `bulk`, `importBatchId` |
| **Import Lifecycle** | `IMPORT_BATCH_GRADUATED`, `IMPORT_BATCH_REVERTED` | `batchId`, `graduatedCount`, `deletedCount`, `deletedAttachments` |
| **Attachment Operations** | `ATTACHMENT_UPLOADED`, `ATTACHMENT_DELETED`, `ATTACHMENT_QUARANTINED` | `itemId`, `parentId`, `sizeBytes`, `cascadeFrom` |
| **Authentication & Keys** | `AUTH_LOGIN`, `AUTH_LOGOUT`, `AGENT_KEY_MINTED`, `AGENT_KEY_REVOKED` | `actor`, `outcome`, `keyFingerprint` |
| **System & SuperLobster** | `SYSTEM_BACKUP_CREATED`, `SYSTEM_SETTINGS_UPDATED` | `actor` (`SUPERLOBSTER`), setting keys |

---

## 🔒 Redaction Invariant

The audit logger strictly strips confidential information before writing:
- Passwords, notes, TOTP seeds, and filenames never enter the audit log.
- Only the event metadata, target UUID, actor identity (or `SUPERLOBSTER`), and timestamp are recorded.
- The audit database is **never swapped or truncated by database restores**, preserving forensic truth.

