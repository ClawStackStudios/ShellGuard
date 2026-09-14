# 📥 ShellGuard — Import/Export & Compatibility Specification

> **Backup intake, format sniffing & the cross-project `sgtotp.bak` bridge**
> *Pulled into existence by Phase 15. Grows with the walk.*

---

## §1. Backup Engine

- **Export**: `backupManager.ts` serializes the user's vault to JSON
  (client-decrypted then re-envelope, or metadata mirror depending on
  scope) — the web-native backup format.
- **Import**: `ImportExportView.tsx` (Settings) sniffs incoming formats and
  routes to the right parser. Every import is **client-side**: keys and
  plaintext seeds never reach the server.

## §2. The `sgtotp.bak` Compatibility Layer (Phase 15)

**Contract source of truth**: [`/compatibility_layer.md`](../compatibility_layer.md)
(the cross-project format spec) and the Android twins — ShellGuard-TOTP
`BackupManager.kt` + `ShellCryptionEngine.kt`.

### Accepted inputs (sniffed in order)
1. Encrypted envelope — `shellguard-totp-backup-v1`
2. Plaintext export — `shellguard-totp-plain-export-v1`
3. Bare `BackupItemDto[]` array

### Decryption contract (encrypted envelopes)
- **HKDF-SHA256**: `ikm` = export key string, `salt` = `envelope.ownerUuid`,
  `info` = `clawchives-shellcryption-v1`, 32 bytes → **AES-GCM-256** with
  AAD **`totp_backup:{ownerUuid}`**.
- **Checksum**: SHA-256 hex over the **exact decrypted JSON string** of the
  item array — enforced post-decrypt (byte-reproducible only there, since
  the exporter's inner JSON is pretty-printed).
- All crypto runs through the **pure TypeScript fallback primitives** —
  works on plain-HTTP LAN origins where `crypto.subtle` is undefined.

### Mapping rules (invariants)
- Imported items receive **fresh web UUIDs** — Android ids are never reused.
- `category` is normalized via `normalizePod()` per the locked pod decision.
- **Original TOTP timestamps are preserved** (`created_at` carries the
  Android `localUpdatedAt`, not import time).
- Items map to full `vault_pearls` with `totp_secret` re-encrypted under
  `vault_pearls_totp:{id}` on save.
- Interactive UX: format sniff → PIN/export-key modal for encrypted
  envelopes → count preview → import.

### Architecture context: One-Way Mirror Sync
Per the compatibility layer: Android pulls `vault_pearls` (where
`totp_secret` exists) read-only; Android-local codes (`isLocalOnly`) are
the only exports; `sgtotp.bak` is the canonical 2FA export format — the web
server imports it directly.

## §3. Import Security Invariants

1. Server never sees export keys, plaintext seeds, or decrypted backups.
2. Corrupt/unsupported files fail with sanitized errors (no schema leakage).
3. Checksum mismatch aborts before any persistence.
4. Every import writes an audit entry.

---
