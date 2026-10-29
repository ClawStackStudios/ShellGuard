# 05.01 — Import/Export Habitat: Bitwarden Harvester, Dual-Mode Export & `sgtotp.bak`

[`ImportExportView.tsx`](../../../../../src/components/ImportExportView.tsx) executes all backup parsing, decryption, and re-encryption 100% client-side before invoking `POST /api/vault/bulk-import` (up to 1000 items per batch, 10MB route-scoped body parser). The Bitwarden importer ([`bitwarden.ts`](../../../../../src/lib/importers/bitwarden.ts)) maps folders to normalized pods (`normalizePod()`), converts all 4 Bitwarden item types (`login`, `card`, `identity`, `secureNote`), preserves custom fields (`text`, `hidden`, `boolean`, `linked`), and runs the **Zero-Loss Residual Harvester**—capturing unmapped properties (`reprompt`, `folderId`, collection IDs, URI match modes, password history) into structured custom fields so zero user data is ever silently dropped.

For exports and mobile 2FA bridges, [`vaultExport.ts`](../../../../../src/lib/vaultExport.ts) supports dual-mode encrypted JSON exports: **ShellKey Mode** (HKDF-SHA256 keyed from the user's `hu-` key) and **Custom Password Mode** (PBKDF2-HMAC-SHA256 with 600,000 iterations and a 16-byte random salt). The cross-project Android 2FA bridge ([`sgtotpBackup.ts`](../../../../../src/lib/sgtotpBackup.ts)) ingests `sgtotp.bak` files (`shellguard-totp-backup-v1`, `shellguard-totp-plain-export-v1`, or bare `BackupItemDto[]`), decrypting via the pure-TS fallback engine with HKDF `info = "clawchives-shellcryption-v1"` and AAD `totp_backup:{ownerUuid}`, verifying the post-decrypt SHA-256 JSON string checksum, assigning fresh web UUIDs while preserving Android `localUpdatedAt` timestamps, and re-encrypting `totp_secret` under `vault_pearls_totp:{id}`.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/ImportExportView.tsx`
- **Client Libraries**: `src/lib/importers/bitwarden.ts`, `src/lib/vaultExport.ts`, `src/lib/sgtotpBackup.ts`, `src/lib/backupManager.ts`
- **Deep Specs**:
  - [Import/Export & Compatibility Specification (§1–§3)](../../../specs/storage/import-export-spec.md)
  - [ShellCryption™ Client-Side Encryption Specification (§3.A AAD Namespace Registry)](../../../specs/crypto/shellcryption-spec.md)
- **Verification Oracles**: `tests/unit/sgtotpBackup.test.ts`, `tests/unit/bitwardenImporter.test.ts`, `tests/unit/vaultExport.test.ts`
