# Lobster Ledger & Cascade Deletion

<CopyPage />

The **Lobsters Overview** sub-section within the SuperLobster Panel provides instance operators with a real-time ledger of all registered user identities.

---

## 📊 The Strict Metadata Ledger

To prevent metadata intelligence leakage, the admin user list (`GET /api/admin/users`) returns strictly aggregated metadata:

```json
{
  "uuid": "4ff11202-d872-4415-99db-1bbad96776d8",
  "username": "lucas",
  "displayName": "Lucas",
  "createdAt": "2026-08-28T20:00:00.000Z",
  "lastLogin": "2026-08-28T20:45:00.000Z",
  "counts": {
    "pearls": 14,
    "notes": 3,
    "sshKeys": 2,
    "attachments": 5,
    "agentKeys": 2
  }
}
```

> **Notice**: Individual item titles, categories, URLs, and filenames are never present in admin API payloads.

---

## 💥 Atomic Cascade User Deletion

When an administrator deletes a user, ShellGuard performs an atomic database transaction:

1. **Confirmation Guard**: The admin must type the exact username to unlock the deletion button.
2. **Server Double-Check**: The backend verifies `expect === target_username` before proceeding.
3. **Atomic Purge**:
   - `DELETE FROM vault_pearls WHERE owner_uuid = ?`
   - `DELETE FROM vault_secure_notes WHERE owner_uuid = ?`
   - `DELETE FROM vault_ssh_keys WHERE owner_uuid = ?`
   - `DELETE FROM vault_secure_attachments WHERE owner_uuid = ?`
   - `DELETE FROM agent_keys WHERE owner_uuid = ?`
   - `DELETE FROM api_tokens WHERE owner_uuid = ?`
   - `DELETE FROM settings WHERE owner_uuid = ?`
   - `DELETE FROM lobsters WHERE uuid = ?`
4. **Forensic Log**: An `ADMIN_USER_DELETED` event is recorded in `audit.sqlite` with the actor sentinel `SUPERLOBSTER` and item counts prior to deletion.
