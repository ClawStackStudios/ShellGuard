# Task 50: Two-Stage Ingestion Pipeline & Reactive Abyssal Ingestion Dock

> **Milestone**: Stage 26 / Phase 25 (Task 50 of 52) — **ACTIVE**
> **Domain**: Two-Stage Archive Ingestion, Reactive Dock & Real-Time Item State
> **Target Branch**: `stage/phase-25-habitat-mobility`
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User:` / `AI:`)

---

## 🎯 Objective & Architectural Seam

Deliver the universal archive ingestion interface in `ImportExportView.tsx` and `VaultShell.tsx`:

1. **Universal Dropzone & Stage 1 Instant Ingestion**:
   - In `ImportExportView.tsx`, dropzone accepts `.zip` files or unzipped folders (via `webkitdirectory`).
   - Implement sniffer logic in `src/lib/habitatImport.ts` to identify Habitat ZIP archives.
   - Extract root `shellguard_vault_export.json`, parse item manifest, and render the Batch Import Preview modal (breakdown of passwords, notes, keys, cards, identities, detected attachments count & total MB).
   - Commit primary vault items atomically via `POST /api/vault/bulk-import` in under 2 seconds.
   - Modal closes immediately upon primary commit, unlocking the vault for normal user work.
2. **Abyssal Ingestion Dock (`VaultShell.tsx`)**:
   - Mount a floating Reef Modernist dock in the bottom-right viewport of `VaultShell.tsx`.
   - Hand off detected attachment files to a background upload queue streaming multipart uploads via `uploadAttachmentMultipart` from `src/lib/attachmentUtils.ts`.
   - Real-time progress bar: `Ingesting Attachments • 3 of 12 completed (28%) [████░░░░]`.
   - Ergonomic controls: expand / minimize dock, pause queue, resume queue, cancel all, and per-item retry on network errors.
3. **Reactive Item State Synchronization (`ItemDetailPane.tsx` / `ItemListPane.tsx`)**:
   - In `ItemDetailPane.tsx`, render glowing pulsing indicator chips on items with attachments currently in transit:
     `📎 filename (Uploading 45%...)`.
   - Upon upload completion and parent attachment linkage, reactively transition chip state to `📎 filename (Verified)` without requiring a page reload.
   - In `ItemListPane.tsx`, display subtle in-flight indicator badges on rows whose attachments are actively uploading.
4. **Browser Safety Guard**:
   - Register a window `beforeunload` listener that warns the user if they attempt to close or navigate away while background attachment uploads are in-flight.
5. **Auditor Battery Codification (L2 & L6)**:
   - In `tests/build-gates.test.ts`, add test assertions for:
     - **Class L2**: Database schema tables match active migration files.
     - **Class L6**: Storage limits in documentation and code match (`ATTACHMENT_MAX_MB = 500`, `GROTTO_QUOTA_MB = 1000`).

---

## 📁 Files in Scope

- `src/lib/habitatImport.ts` (New file — archive sniffer & ingestion queue manager)
- `src/components/ImportExportView.tsx` (Habitat dropzone & Stage 1 preview)
- `src/components/VaultShell.tsx` (Abyssal Ingestion Dock mount)
- `src/components/ItemDetailPane.tsx` (Reactive pulsing attachment chips)
- `src/components/ItemListPane.tsx` (List item ingestion status indicators)
- `tests/build-gates.test.ts` (Claim battery checks L2 & L6)

---

## 🔒 Invariants & Acceptance Criteria

1. **Sub-2-Second Ingestion**: Stage 1 bulk-inserts primary credentials and closes the modal in $<2\text{s}$.
2. **Non-Blocking UI**: Vault remains fully browsable and editable while Stage 2 processes uploads in the background.
3. **Reactivity**: In-flight attachment chips reflect real-time progress and update to verified ready state without page refresh.
4. **Safety**: `beforeunload` prevents accidental data loss during active ingestion.
5. **Gates Green**: `npm run lint` and `npm test` pass 100% green.
