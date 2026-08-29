# Offline Database Restoration

<CopyPage />

Because of ShellGuard's secrets-aware threat model, **there is deliberately no web-based restore endpoint**.

---

## 🛠️ Step-by-Step Operator Restoration Procedure

Restorations are performed safely offline at the shell level.

### Step 1: Stop ShellGuard
```bash
# Docker:
docker stop shellguard

# Local Node:
npm run scuttle:stop
```

### Step 2: Validate the Backup Integrity
Use the built-in validator script to ensure the backup file is healthy and unlocks with your key:
```bash
npm run scuttle:restore -- --file data/backups/db-2026-08-28T20-00-00Z.sqlite --key <DB_ENCRYPTION_KEY>
```

Output:
```text
✔ Backup verified — schema version 2, 135,168 bytes
```

### Step 3: Clear Stale SQLite WAL Files
```bash
rm -f data/db.sqlite-wal data/db.sqlite-shm
```

### Step 4: Swap the Database File
```bash
cp data/backups/db-2026-08-28T20-00-00Z.sqlite data/db.sqlite
```

### Step 5: Verify Environment Key
Ensure `DB_ENCRYPTION_KEY` in `.env` matches the key in effect when the snapshot was taken.

### Step 6: Start ShellGuard
```bash
# Docker:
docker start shellguard

# Local Node:
npm run scuttle:prod-start
```

---

## 🔒 Post-Restore State

- Users immediately log back in with their existing `hu-` keys (no token resetting or account recreation required).
- The historical audit log (`audit.sqlite`) remains continuous and intact.
