# 02.03 — Vault Workspace: Item Form Modal, Custom Fields & Grotto Attachments

[`ItemFormModal.tsx`](../../../../../src/components/vault/ItemFormModal.tsx) provides a unified, lock-guarded creation and editing modal with a pinned header/footer and scrollable body across Passwords, Cards, Identities, Secure Notes, and SSH Keys. When a user rotates an existing Pearl's password, the previous plaintext secret is prepended to the item's `password_history` array (capped and sealed client-side under `vault_pearls_history:{id}` AAD) before the new secret is encrypted under `vault_pearls:{id}`. Tags are entered via [`TagSelectorInput.tsx`](../../../../../src/components/vault/TagSelectorInput.tsx) with live autocomplete from existing vault tags and deterministic 16-color bioluminescent pill assignment.

The modal's Custom Fields engine supports four field types (`text`, `hidden`, `checkbox`, and `linked` referencing `username | password | url | notes | totp`). The entire `CustomField[]` array is serialized to JSON and encrypted client-side via `encryptField` under its table-specific AAD namespace (`vault_pearls_custom:{id}`, `vault_secure_notes_custom:{id}`, or `vault_ssh_keys_custom:{id}`), staying strictly **off** `metadataGuard.ts` to preserve the Double-Encryption Firewall. File attachments on Passwords and Secure Notes encrypt client-side under `vault_secure_attachments:{id}` and stream via multipart upload into native SQLite `BLOB` storage (`attachmentBlobs.ts`), enforcing a 500MB per-file ceiling, a 1000MB (1GB) per-owner Grotto quota, and mandatory `parent_id`/`parent_type` linkage (Migration 0009).

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/vault/ItemFormModal.tsx`, `src/components/vault/TagSelectorInput.tsx`
- **Backend Routes & Storage**: `src/server/routes/vault.ts`, `src/server/routes/notes.ts`, `src/server/routes/sshKeys.ts`, `src/server/routes/attachments.ts`, `src/server/utils/attachmentBlobs.ts`, `src/server/utils/metadataGuard.ts`
- **Deep Specs**:
  - [Encryption Layers Specification (§3 Double-Encryption Firewall, §4.A Custom Fields)](../../../specs/crypto/encryption-layers-spec.md)
  - [SQLite Bedrock Database Schema (§3 Migrations 0005–0009)](../../../specs/storage/database-schema.md)
- **Verification Oracles**: `tests/unit/customFields.test.ts`, `tests/attachments.test.ts`, `tests/metadata-encryption.test.ts`
