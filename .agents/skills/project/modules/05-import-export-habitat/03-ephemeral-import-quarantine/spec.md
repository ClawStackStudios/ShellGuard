# 05.03 — Import/Export Habitat: Ephemeral Import Quarantine & Batch Rollback

Every batch import executed through `POST /api/vault/bulk-import` stamps incoming records across `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys` with a shared `import_batch_id` (`imp_<uuid>`) and an ISO `imported_at` timestamp (Migration 0010, indexed via `idx_*_import_batch`). Quarantined records remain fully functional in the vault but carry an ephemeral **Imported** indicator pill (`ItemListPane.tsx` and `ItemDetailPane.tsx`), following progressive disclosure so the workspace stays uncluttered while giving the user an immediate safety net against malformed or unwanted bulk imports.

Quarantine lifecycle resolves through three paths: (1) **Auto-Graduation on Edit**—saving any modification to an item via `PUT /api/vault/:id` (or `/api/notes/:id`, `/api/keys/:id`) automatically clears `imported_at = NULL` and `import_batch_id = NULL` for that record; (2) **Batch Graduation**—calling `POST /api/vault/import-batches/:id/graduate` (`requirePermission('canEdit')`) promotes all remaining items in the batch to permanent native status (`{ graduated_count }`); or (3) **Atomic Batch Rollback**—calling `DELETE /api/vault/import-batches/:id` (`requirePermission('canDelete')`) purges every still-quarantined item in that batch across all three tables and cascades deletion to their linked attachments (`{ deleted_count, deleted_attachments }`) while leaving already-graduated items untouched.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/ImportExportView.tsx`, `src/components/vault/ItemListPane.tsx`, `src/components/vault/ItemDetailPane.tsx`
- **Backend Routes & Schema**: `src/server/routes/vault.ts`, `migrations/0010_import_quarantine.up.sql`
- **Deep Specs**:
  - [SQLite Bedrock Database Schema (§3 Migration 0010)](../../../specs/storage/database-schema.md)
  - [Routes & API Contracts (§3 Batch Operations)](../../../specs/network/routes-and-contracts.md)
- **Verification Oracles**: `tests/import-quarantine.test.ts`, `tests/vault-crud.test.ts`
