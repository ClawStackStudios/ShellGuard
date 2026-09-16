# 📦 Task Handoff Package — Phase 22: Reef Polish Pass

**Created**: 2026-09-13
**Session Context**: ~85% utilized — NEW SESSION REQUIRED
**Next Task**: Phase 22 — Reef Polish Pass, Unified Search & Control Ergonomics (Tasks 43/44)
**Execution state**: QUEUED & GATED — Lucas is collecting additional polish items; confirm the phase is final (Task 44 slot may absorb more) and get an explicit green-light before writing code.

---

## Current State

- **v0.0.1.9 (Build 18) is RELEASED & LIVE**: tag `v0.0.1.9` (commit `027506a`), GitHub Release body = `RELEASE-v0.0.1.9.md` verbatim, `main` = `c86c10a` on origin, tree clean.
- **Genome (`/project/`) is current**: spine Stage 0→21; 10 spec oracles incl. `shellcryption-spec.md`; 0 dangling references; ROADMAP molted (Phase 14 → HISTORY archive; Phase 17 → Completed Releases with receipts; queue = Phase 22 → 23).
- **Post-release hotfix merged**: `07ccd61` — vault master-detail headers pinned `h-16` (flush T-junction) + `tests/unit/version.test.ts` de-hardcoded (was a latent failure inside v0.0.1.9).
- **Learnings persisted**: full-mask NEVER-list rule, `skills/sqlite-security-migration.md`, `skills/editor-large-inserts.md` (batch-patch discipline) — both roots (`.clinerules/` + `.agents/`).

## Next Task Specification (Phase 22)

- **Task 43 [Functionality]**: robust unified vault search engine — client-side over the ALREADY-DECRYPTED `vaultItems` corpus (App.tsx decrypts pearls/notes content/customs/attachments post-fetch). Match titles, keywords (usernames/URLs/note text), attachment file names, note contents, custom-field values. 🛡️ Query NEVER transmitted (no `?q=`, no server endpoint); search state purged on lock with the shellKey; memoize the corpus; composes with pod/type filters (AND).
- **Task 44 [UI]**: search-bar consolidation — remove `Layout/Header.tsx` top-right search (input + dropdown + `searchInputRef`/`searchDropdownRef` + App.tsx consumers, ~lines 160–170) and `Vault/SidebarFolderTree.tsx` pod-search input (`podSearch`, ~lines 49/62–65/264 — note: it filtered the POD TREE, so the tree renders unfiltered afterward); `ItemListPane`'s search becomes the single surface. Control ergonomics: `ItemDetailPane.tsx` Custom Fields — hidden-field Eye toggle moves from inline-with-value (~269–279) into the right-hand action cluster immediately LEFT of Copy (~286–293), matching the password field pairing; full-value mask invariant (NEVER-list).
- **Version**: work-driven; provisional `v0.0.2.4 (Build 23)` — decide the digit at release time.
- **Behind it**: Phase 23 — Bitwarden-model item integrity (Tasks 45/46): attachment parent enforcement + orphan QUARANTINE (never delete) + form-contract (notes reject `secret` payloads) + add-menu '📎 Attachment' removal + type-truthful dashboard.

## Continuity Instructions (immediate steps for the new session)

1. Load this memory bank (`activeContext.md` → `progress.md` → `consolidated_learnings.md`), then the genome: `project/README.md` → `ROADMAP.md` Phase 22 → `meta-prompt-ai-studio.md` Stage 20.
2. Confirm with Lucas: is Task 44's slot final? Any more polish items? Get the explicit green-light.
3. Start on a fresh branch from `main` (e.g., `feat/phase22-reef-polish`).
4. Execute Task 43 → Task 44 → gates (`tsc`, full oracle, build) → docs sync → two-layer commit grammar.
5. Known environment facts: `npm` PATH = `/config/Applications/node-v22.23.0-linux-x64/bin`; Docker daemon unavailable (record container checks as env-blocked); shell heredocs swallow stdout intermittently — redirect to a file and cat; verify pushes with `git ls-remote`.

## Context Preservation

- Locked decisions (do not re-litigate): zero hardcoded pods; `normalizePod()` for all category comparisons; full-value masking (NEVER-list); hash-only `lb-` ledger; quarantine-never-delete for orphans; notes cannot embed password credentials.
- Verification loop: tests (15 files / 210 passing) + `tsc` + `vite build` are the gates; the version unit test asserts package.json ground truth — never re-hardcode a version literal.

## Learning Integration

- Patterns to apply: batch-patch discipline (skills/editor-large-inserts.md); measured code geometry in task specs; ls-remote push verification; env-blocked checks recorded honestly.
- Efficiency: heredoc-heavy file writes → redirect output to /tmp logs and cat; assertion-guarded python patches with per-file writes.

Handoff_Package_Prepared: true
