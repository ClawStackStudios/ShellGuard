# Import & Sovereign Export

<CopyPage />

ShellGuard believes in absolute data portability. Your secrets belong to you, and you can export or restore your vault across any ShellGuard instance.

---

## 📤 Export Formats

Navigate to **Settings &rarr; Import & Export**:

1. **Sovereign JSON Export (Full Vault Backup)**:
   - Requires re-authenticating with your `hu-` identity key.
   - Exports all logins, TOTP seeds, secure notes, and SSH keys in decrypted or encrypted format.
   - Ideal for personal backups and moving to another ShellGuard instance.

2. **Metadata CSV Export**:
   - Generates a plaintext CSV containing titles, usernames, URLs, and categories (passwords and secret fields omitted for security).
   - Useful for auditing your password catalog and checking for duplicates.

---

## 📥 JSON Vault Import

1. Upload your exported `shellguard-vault-backup.json` file.
2. ShellGuard validates schema compatibility and batch-creates all items inside your vault.
3. Every imported secret is immediately re-sealed client-side with your active `hu-` key before transmitting to the server.
