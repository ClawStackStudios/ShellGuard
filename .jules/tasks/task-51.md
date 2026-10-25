# Task 51: Ephemeral Import Ledger, Time-to-Live (TTL) Engine & Multi-Batch Tracking

> **Milestone**: Stage 27 / Phase 26 (Task 51 of 52) — **COMPLETED ✅ (v0.0.2.8 / Build 30)**  
> **Domain**: Backend Schema, Ingestion Fingerprinting, Auto-Graduation & Atomic Batch Rollback  
> **Target Branch**: `stage/phase-26-import-lifecycle`  
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User:` / `AI:`)  

---

## 🎯 Objective & Architectural Seam

Implement the data layer, ingestion stamping, auto-graduation semantics, and batch rollback API:

1. **Database Migration (`0010_import_lifecycle.up.sql` & `0010_import_lifecycle.down.sql`)**:
   - Add `imported_at TEXT DEFAULT NULL` (ISO-8601 timestamp) and `import_batch_id TEXT DEFAULT NULL` (prefixed identifier `imp_<uuid>`) across:
     - `vault_pearls`
     - `vault_secure_notes`
     - `vault_ssh_keys`
   - Create indices:
     - `idx_pearls_import_batch ON vault_pearls(import_batch_id)`
     - `idx_notes_import_batch ON vault_secure_notes(import_batch_id)`
     - `idx_keys_import_batch ON vault_ssh_keys(import_batch_id)`
   - Author reversible `.down.sql` migration.
   - ⚠️ **CRITICAL ADJACENCY INVARIANT**: DO NOT add `imported_at` or `import_batch_id` to `METADATA_COLUMNS` in `src/server/utils/metadataGuard.ts`. They must remain queryable/indexable relational SQL columns, not ciphertext.

2. **Ingestion Ledger & Batch Fingerprinting**:
   - In `src/server/routes/vault.ts`, update `POST /api/vault/bulk-import`:
     - Generate a single unique `import_batch_id = 'imp_' + crypto.randomUUID()`.
     - Timestamp `imported_at = new Date().toISOString()`.
     - Stamp these values on all inserted pearls, notes, and SSH keys in the transaction.
     - Return `import_batch_id` and `imported_at` in the 200/207 response payload.

3. **Auto-Graduate on Edit Adoption Semantics**:
   - When an imported item is updated via `PUT /api/vault/:id`, `PUT /api/notes/:id`, or `PUT /api/keys/:id`:
     - Set `imported_at = NULL` and `import_batch_id = NULL` in the SQL update.
     - The item instantly transitions from ephemeral quarantine to permanent vault citizen.

4. **Batch Operations API**:
   - `POST /api/vault/import-batches/:id/graduate`:
     - Updates all records in `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys` matching `import_batch_id = :id` to set `imported_at = NULL, import_batch_id = NULL`.
     - Returns `{ success: true, graduated_count: number }`.
   - `DELETE /api/vault/import-batches/:id`:
     - Transactionally deletes all items matching `import_batch_id = :id`.
     - Cascades deletion of linked attachments in `vault_secure_attachments` (along with BLOB data).
     - Logs event in `audit.sqlite`.
     - Returns `{ success: true, deleted_count: number, deleted_attachments: number }`.

5. **TTL Evaluation & Automated Test Oracle**:
   - Implement lazy graduation calculation: if `now - imported_at > retention_minutes`, the item is treated as graduated.
   - Author `tests/vault-imported-tracking.test.ts` verifying:
     - Batch creation & stamping across pearls, notes, and keys.
     - Auto-graduate on edit for passwords, notes, and keys.
     - Batch graduation endpoint (`POST .../graduate`).
     - Atomic batch rollback endpoint (`DELETE .../:id`) with cascade attachment deletion.
     - TTL expiration logic.

---

## 📁 Files in Scope

- `migrations/0010_import_lifecycle.up.sql` (New)
- `migrations/0010_import_lifecycle.down.sql` (New)
- `src/types.ts`
- `src/server/routes/vault.ts`
- `src/server/routes/notes.ts`
- `src/server/routes/sshKeys.ts`
- `src/server/validation/schemas.ts`
- `tests/vault-imported-tracking.test.ts` (New)

---

## 🔒 Invariants & Acceptance Criteria

1. **Zero Data Loss**: Existing permanent vault items remain NULL for imported fields.
2. **Relational Integrity**: Batch rollback purges all batch items and cascades child attachments without leaving orphaned records.
3. **Multi-Type Parity**: Stamping, auto-graduation, and batch rollback apply uniformly across passwords, notes, and SSH keys.
4. **All Tests Green**: `npm test` passes 100% green.
