# Failsafe Backups Engine

<CopyPage />

ShellGuard's backup engine provides atomic, non-blocking instance snapshots using SQLite's native `Online Backup API`.

---

## 💾 Snapshot Mechanics

- **API**: Calls `db.backup(destPath)` from the native driver.
- **Concurrency Safe**: Takes snapshots cleanly during live traffic in SQLite WAL (Write-Ahead Logging) mode without table locks.
- **Coupled Snapshots**: Captures atomic copies of both `db.sqlite` and `audit.sqlite`.
- **Destination**: Saved directly to `DATA_DIR/backups/` with ISO timestamps:
  ```text
  data/backups/
  ├── db-2026-08-28T20-00-00Z.sqlite
  ├── audit-2026-08-28T20-00-00Z.sqlite
  └── manifest.json
  ```

---

## 📋 The Backup Manifest (`manifest.json`)

Every backup cycle updates `manifest.json` with cryptographic verification hashes:

```json
{
  "backups": [
    {
      "timestamp": "2026-08-28T20:00:00.000Z",
      "version": "0.0.1",
      "dbFile": "db-2026-08-28T20-00-00Z.sqlite",
      "dbSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "dbSizeBytes": 135168,
      "auditFile": "audit-2026-08-28T20-00-00Z.sqlite",
      "auditSha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      "auditSizeBytes": 32768,
      "encrypted": true
    }
  ]
}
```

---

## 🔄 Retention & Pruning

The scheduler automatically prunes older backups to keep the most recent **N** snapshots (configurable in the UI, default: **7**).
