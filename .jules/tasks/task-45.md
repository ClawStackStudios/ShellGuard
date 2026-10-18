# Task 45: Attachment Parent Enforcement, Orphan Quarantine & Form-Contract Rules [COMPLETED ✅]

> **Milestone**: Stage 24 / Phase 23 (Task 45 of 52) — **COMPLETED & SHIPPED in v0.0.2.5 (Build 27)**
> **Domain**: Bedrock Database, Security Membrane & API Contracts
> **Target Branch**: `stage/phase-23-item-integrity`
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User:` / `AI:`)

---

## 🎯 Objective & Architectural Seam

Align ShellGuard's attachment model with the Bitwarden pattern: **attachments are NEVER standalone vault items**. They are encrypted children bound to a parent item.

Enforce parent linkage at the Bedrock:
1. `POST /api/attachments` requires a valid parent item reference (`parent_id` and `parent_type`). Standalone creation MUST fail closed with `400 Bad Request`.
2. Parent item's `attachments` JSON ID array gains the child ID in the same database transaction.
3. Migration `0009_attachment_integrity.{up,down}.sql` adds `parent_id`, `parent_type`, `is_quarantined`, and `quarantined_at` to `vault_secure_attachments`, and adds `attachments TEXT DEFAULT '[]'` to `vault_ssh_keys`.
4. In-code backfill `quarantineOrphanAttachments()` resolves existing orphan attachments: relinks where a parent is determinable, otherwise marks `is_quarantined = 1` (hidden from user lists, NEVER deleted). Quarantine events are logged to `audit.sqlite`.
5. Form-contract validation in `src/server/validation/schemas.ts`: Secure Notes CANNOT carry password credentials (any `secret` payload on notes is rejected server-side with `400 Bad Request`).
6. Zero-knowledge opacity invariant: `file_data` remains an opaque ShellCryption blob — the server enforces linkage and quotas, never content.

---

## 📁 Files in Scope

- `migrations/0009_attachment_integrity.up.sql` (new)
- `migrations/0009_attachment_integrity.down.sql` (new)
- `src/server/database/attachmentIntegrity.ts` (new)
- `src/server/database/index.ts` (wire backfill)
- `src/server/validation/schemas.ts` (NoteSchemas form-contract & SshKeySchemas attachments)
- `src/server/routes/attachments.ts` (parent_id enforcement, transactional link, quarantine filter)
- `src/server/routes/notes.ts` (ensure secret rejection)
- `tests/attachment-integrity.test.ts` (new verification suite)
- `tests/attachments-blob.test.ts` (regression update: provide parent item in upload fixtures)
- `tests/helpers/testFactories.ts` (update uploadAttachment helper if needed)

---

## 🔒 Invariants & Acceptance Criteria

1. **Standalone Attachment Rejection**:
   - Calling `POST /api/attachments` without `parent_id` returns `400 Bad Request` with `{ success: false, error: "Attachments require a valid parent vault item reference. Standalone attachments are forbidden." }`.
2. **Atomic Parent Linkage**:
   - On successful upload, the parent item (`vault_pearls`, `vault_secure_notes`, or `vault_ssh_keys`) has its `attachments` JSON array updated to include the new attachment's ID in the same SQLite transaction.
3. **Quarantine Invariant (Never Delete User Data)**:
   - Orphan attachment rows are flagged `is_quarantined = 1` with a `quarantined_at` timestamp.
   - `GET /api/attachments` filters out quarantined rows (`WHERE owner_uuid = ? AND is_quarantined = 0`).
   - Every quarantine action emits an audit log event (`ATTACHMENT_QUARANTINED`) into `audit.sqlite`.
4. **Form Contract Rule (Notes Reject Secret)**:
   - `POST /api/notes` or `PUT /api/notes/:id` containing a `secret` field returns `400 Bad Request`.
5. **Zero-Knowledge Opacity**:
   - `file_data` is treated strictly as an opaque BLOB. The server never inspects or transforms file content.
6. **Verification Suite**:
   - `npm test` runs 100% green including the new `tests/attachment-integrity.test.ts`.
   - `npm run lint` and `npm run build` pass with zero errors.
