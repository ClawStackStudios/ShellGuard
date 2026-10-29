# 🔄 Stage 30 Execution Prompt — Offline Encrypted Delta Journal & Conflict Resolution

> **Milestone**: Provisional `v0.0.3.2 (Build 34)` — Phase 30 (Tasks 65 & 66)  
> **Execution Law**: Strict 2-Task Pairing (Task 65 [Functionality] + Task 66 [UI Component & Walk-the-Docs]).

---

## 📖 Context & Spec Oracles (Read First)

Before writing code, inspect:
- [`.agents/skills/project/specs/architecture/architecture.md`](../../specs/architecture/architecture.md): §5.3–§5.4 (Offline storage failover & Reactive River revision markers).
- [`.agents/skills/project/specs/crypto/shellcryption-spec.md`](../../specs/crypto/shellcryption-spec.md): §3 (Zero-knowledge `{v, alg, iv, ct, aad}` envelopes).
- [`.agents/skills/project/specs/storage/database-schema.md`](../../specs/storage/database-schema.md): §3 (Vault domain schemas).

---

## 🛠️ Execution Tasks (Strict 2-Task Pairing)

### Task 65: [Functionality] Offline Encrypted Sync Queue & Bi-Directional Delta Journal

- **Encrypted Delta Journal (`src/lib/syncJournal.ts` & `src/server/routes/sync.ts`)**:
  - Implement a persistent client-side encrypted `sync_queue` journal storing offline mutations (create, update, delete) as sealed ShellCryption envelopes tagged with base revision numbers (`base_rev`) and causal timestamps.
  - Expose `POST /api/sync/delta` (`requireAuth`) to replay queued mutations atomically upon network reconnection, returning clean commits or structured conflict descriptors when `server_rev > base_rev`.
- **Automated Verification**:
  - Author `tests/sync-delta-journal.test.ts` proving offline queue persistence, ordered delta replay, idempotency on retry, and conflict detection on concurrent edits.

### Task 66: [UI Component & Walk-the-Docs] Conflict Review Dialog & Sync Queue Inspector

- **Conflict Resolution Modal & Queue Drawer (`src/components/vault/ConflictReviewModal.tsx`)**:
  - Render an offline queue counter badge in the header when pending deltas exist.
  - When a concurrent edit conflict is detected during delta replay, present a side-by-side Reef Modernist **Conflict Review Modal** (decrypted entirely client-side) allowing the user to keep local changes, accept remote server state, or merge fields cleanly.
- **4-Zone Walk-the-Docs**:
  - Synchronize `ARCHITECTURE.md`, `docs/companion/sync-and-backups.md`, and `CHANGELOG.md`.
