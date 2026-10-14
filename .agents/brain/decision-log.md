# Decision Log — ShellGuard

*Episodic memory: how I moved through the codebase. Semantic truth lives in the Brain; walls, detours, and instincts live here. Sliding window: 20 entries.*

---

## 2026-10-13 — Autonomous deep architectural inquiry dispatched to Jules
Lucas paused the merge sequence to test Jules's independent cognitive perception without spoon-fed steering. Dispatched a 4-part architectural inquiry on PR #4 (issuecomment-6162322896): (1) What is adjacent? (2) What does this imply that is unarticulated? (3) Unseen gaps across settings, feature debt, security, auth, and DB? (4) Does OWASP or YAGNI apply? We hold the orchestrator boundary while awaiting Jules's raw analytical findings to audit his system comprehension.

## 2026-10-12 — 100% Jules steering offload & complete Walk-the-Docs delegation
Lucas directed fully steering by review comments on PR #3, offloading 100% of the remaining Phase 23 execution onto Jules: fixing both UI seams (Header Add Item dropdown menu array and App.tsx parent-before-attachment creation sequencing) and executing the full /walk-the-docs pass across VitePress (attachments.md, blueprint-schema.md, api-reference.md, the-grotto.md, glossary.md) and root manifests (ROADMAP.md, meta-prompt, CHANGELOG.md, README.md). We hold the sovereign orchestrator boundary, discarding all .agents/ modifications upon final merge.

## 2026-10-12 — Sovereign .agents boundary & disregard Jules .agents modifications
Lucas explicitly mandated that all modifications in `.agents/` on Jules's PR branch (specifically 9 legacy workflow files in `.agents/workflows/`) must be completely disregarded and never pulled or merged into stage. `.agents/` is orchestrator sovereign territory. When merging Jules's Phase 23 PR, `.agents/` is checked out clean from stage HEAD, preventing any cross-agent contamination.

## 2026-10-12 — Dedicated PR CI runner workflow & universal test/build gate
Codified `.github/workflows/pr-check.yml` establishing a dedicated cloud CI test and build gate for all pull requests matching sibling ShellGuard-Mobile architecture. Updated `.github/workflows/ci.yml` with `stage/*` branch pattern matching and offloaded PR events to `pr-check.yml`. Universal PR trigger without branch restrictions guarantees Jules's PRs and multi-agent stage branches run full Vitest suites, Vite builds, and VitePress docs compilation automatically.

## 2026-10-12 — Pre-Work Assumptions workflow & anticipatory multi-agent orchestration
Codified `.agents/workflows/pre-work-assumptions.md` establishing the anticipatory stance: when an in-flight stage is actively running (e.g. Jules on PR #3 or cloud CI), project forward into the assumed-complete state, trigger `/work-stage-reflection` for the next stage (Phase N+1), audit downstream seams early, and pre-stage reflection artifacts, test oracles, and micro-stages without idle waiting or conflicting code edits. Physical validation confirmed Jules responded to PR #3 inline feedback with commit `d69d11c` fixing parent-before-attachment creation sequencing in `App.tsx` and SQLite cipher type import in `attachmentIntegrity.ts`.

## 2026-10-12 — Work Stage Reflection workflow & Jules PR #3 inline diff review
Codified the Work Stage Reflection protocol in `.agents/workflows/work-stage-reflection.md` and `.agents/workflows/plan.md`, formalizing the 6-section structural completeness inspection and zero-touch mandate. Committed (`f974ffb`), pushed to stage, and verified via GitHub Actions CI (Run `38302734807` passed 100% green in 2m 19s). Conducted diff inspection of Jules PR #3 commit `f9e6b2a` and posted inline comments on `attachmentIntegrity.ts` (SQLite cipher import fix) and `routes/attachments.ts` (parent creation sequencing requirement) plus an auditable review summary guiding base branch sync (to enable cloud CI on PR #3) and Task 46 frontend requirements.

## 2026-10-12 — Cloud-offloaded CI verification & zero local build/test mandate
Lucas established a strict operational boundary mirroring ShellGuard-Mobile and ShellGuard-TOTP: host machine resources are tightly constrained, so all testing (`vitest`) and production building (`vite build`, `docs:build`) are strictly offloaded to GitHub Actions (`.github/workflows/ci.yml`). Never build or test locally on the development machine. Codified this across `git-hygiene.md`, `cadence-and-lifecycle-prompts.md`, and `project-hygiene.md` with a push-and-tail workflow via `gh run watch`.

## 2026-10-12 — PR #2 Phantom implementation audit & Jules co-pilot recursive feedback
Physical diff inspection of Jules PR #2 revealed commit `9035b82` was a phantom implementation (+1452 / -303 across 12 files): zero lines of code in `src/`, `migrations/`, or `tests/` while encroaching into `.agents/workflows/` and targeting `main`. Realigned PR base to `stage/phase-23-item-integrity`, and posted an auditable review comment layering the original dispatch prompt with 6 granular memory units (Migration 0009, orphan quarantine, fail-closed parent linkage, note secret rejection, header add-menu removal, deterministic type-sorting, and test oracle). Jules acknowledged and transitioned to `Planning` to re-execute.

## 2026-10-11 — Era 1 archival, Era 2 genesis & pre-walk-the-docs protocol
Lucas refined the master sequence: stopping the active Era 1 meta-prompt and roadmap at Phase 26 (Import Lifecycle Quarantine), archiving both into `.agents/internal/` (`era-1-meta-prompt-ai-studio.md` and `era-1-ROADMAP.md`), and birthing Era 2 (`meta-prompt-ai-studio-era2.md` and `ROADMAP-ERA2.md`) with Phase 27 as flagship Stage 1. Executed a comprehensive pre-/walk-the-docs sweep across all 4 zones, baking 3 new VitePress pages (`https-tls.md`, `transport.md`, `pairing.md`), 5 updated docs, root docs, and skills directly into Task 54 acceptance criteria so documentation 100% bows to code without drift.

## 2026-10-03 — Git Advanced Workflows skill synthesis & hygiene rule bolster
Integrated the Git Advanced Workflows skill into our ecosystem. Formulated `.agents/skills/git-advanced-workflows/SKILL.md` covering interactive rebase, autosquash, worktrees, precision cherry-picking, automated bisect, and reflog recovery. Bolstered `git-hygiene.md` with explicit worktree isolation, pre-rebase safety branches, autosquash workflows, and the 90-day reflog safety net, and updated `project-hygiene.md` with worktree task branching and automated regression isolation.

## 2026-10-03 — Living security contract & OpenSSF SECURITY.md governance
Lucas requested adding a dedicated `SECURITY.md` pattern to our skills and rules. Codified Section 10 in `docs-hygiene.md`, Template 3 and Core Concept 5 in `doc-automation`, and `fix(security)` Conventional Commit mappings in `changelog-automation` and `git-hygiene.md`. Audited and upgraded root `SECURITY.md` with an OpenSSF-compliant Supported Versions matrix (`v0.0.2.x (Build 26+)`) and a CFAA/DMCA Safe Harbor legal clause for good-faith researchers, tying our documentation directly to code reality.

## 2026-09-27 — Native Credit Card & Identity models, smart auto-spacing & checkout clipboard invariant
Implemented first-class `card` and `identity` types across the entire vault stack using the polymorphic `vault_pearls` table. Engineered `cardUtils.ts` providing network-aware smart auto-spacing (Amex 4-6-5, others 4-4-4-4), real-time brand detection, length-truthful proportional masking, and clean digit copying to the clipboard so third-party payment forms never reject on spaces. Designed dedicated visual Credit Card and Identity Contact Sheet widgets in `ItemDetailPane` strictly maintaining the Eye-beside-Copy invariant on all sensitive fields.

## 2026-09-26 — Bitwarden linked ID mapping & residual field harvesting
Discovered Bitwarden exports linked custom fields via numeric `linkedId` (100–104) without property names; mapped these directly to ShellGuard's `linkedProperty` so linked fields resolve cleanly in `ItemDetailPane`. Created an automated `harvestResidualFields` sweeper with key exclusion sets and empty collection filtering (`[]`/`{}`) to capture unmapped identity fields (`username`, `address2`, `address3`, etc.) and ensure zero data loss on future exports.

## 2026-09-25 — Android companion dependency injection: Application-Scoped Lazy DI
Aligned Android companion architecture with Lucas to formalize the Application-Scoped Lazy DI pattern (`AppContainer` with thread-safe `by lazy` properties) over Hilt or Koin. Confirmed this belongs strictly in internal specifications (`.agents/brain/android/` and `di-container.md`) rather than public `/docs/companion/`, preserving VitePress clarity while guaranteeing sub-100ms cold start, zero reflection attack surface, and deterministic RAM zeroization upon vault lock.

## 2026-09-23 — Phase 26 formalization: Import lifecycle, ephemeral TTL & progressive disclosure
Lucas conceived an underlying organizational system for imported items to combat import remorse and accidental bulk migrations. Formulated Phase 26 ("Import Lifecycle Tracking, Ephemeral Retention Window & Batch Ingestion Quarantine") across ROADMAP.md and project/meta-prompt-ai-studio.md: Task 51 establishes multi-batch fingerprinting (import_batch_id), cross-type parity (pearls, notes, SSH keys), and configurable TTL self-destruct (30m/60m/90m/manual) with auto-graduation upon item edit; Task 52 delivers the "Config" settings surface, dynamic bioluminescent countdown chips, and an atomic batch revert action hatch adhering strictly to Lucas's progressive disclosure invariant (the UI remains 100% silent unless active imported items exist).

## 2026-09-23 — Phase 22: Search surface consolidation & pod search retention
Lucas's ergonomic intuition refined Phase 22: while header search and sidebar top search duplicate the master vault item search, the dedicated pod search in SidebarFolderTree.tsx pays its rent by allowing rapid filtering of large pod hierarchies directly where the user looks. Retained podSearch in the tree while purging redundant global search bars from Header.tsx and Sidebar.tsx, unifying vault item search into ItemListPane.tsx via vaultSearch.ts.

## 2026-09-23 — Phase 25 formalization & full-archive mobility architecture
Recognized that client-side attachment archive export and non-blocking ingestion is an industry-wide blindspot (Bitwarden produces export ZIPs but cannot import them, forcing manual item-by-item uploads). Elevated from a sub-task into dedicated Phase 25 ("Habitat Full-Archive Mobility & Reactive Ingestion Dock") across ROADMAP.md and project/meta-prompt-ai-studio.md: Task 49 establishes collision-proof streaming ZIP packaging with decrypted attachments, and Task 50 delivers a Two-Stage Ingestion Pipeline (<2s instant bulk-import + floating non-blocking reactive Abyssal Ingestion Dock in VaultShell with live item badge synchronization).

## 2026-09-22 — Release v0.0.2.3 (Build 25) & ClawStack release protocol execution
Executed release protocol for v0.0.2.3 ("The Deep Ingestion & Vault Parity Molt"). Maintained Single Active Release Draft invariant by drafting RELEASE-v0.0.2.3.md and purging RELEASE-v0.0.2.2.md. Archived Phase 18 to ROADMAP-HISTORY.md preserving the 3-completed-phases sliding window in ROADMAP.md. Synchronized version anchors across package.json, README badge, CHANGELOG.md, and ARCHITECTURE.md with 100% green test oracle.

## 2026-09-22 — Note attachments parity, ghost pod purging & detail pane selection preservation
Physical verification of Areas 3 & 4 surfaced 3 friction points: standalone attachments defaulting to category 'Attachment' created ghost pods in bulk modals; notes lacked binary attachment support across db schema and routes; and saving an item unmounted VaultShell because uploadProgress was rendered inside mode="wait", dropping selectedItemId. Resolved by pruning ghost pods in podUtils and VaultShell, executing Migration 0008 to add attachments to vault_secure_notes with cascade deletion in notes.ts, lifting selectedItemId to App.tsx, and decoupling progress/error banners into their own non-blocking container.

## 2026-09-21 — Live verification friction points & decoupling preview complexity
Lucas's physical verification surfaced 4 critical joints: switching accounts to a locked user trapped the modal in a re-render loop if `activeLobsterId` changed prematurely, while switching between unlocked accounts required an un-reactive page reload; hidden custom fields gave zero visual feedback before saving; bulk modals lacked pod/tag chips; and binary attachments suffered 415 errors and preview bloat. Decoupled preview complexity in favor of pure encrypted BLOB storage with direct download and delete, staged switch targets safely, added eye toggles to custom fields, and derived chip pickers directly from vault items.

## 2026-09-21 — UI action seams & pod metadata defense
Direct inspection of `App.tsx` handlers revealed that pod renames and bulk updates were sending payloads missing `tags`, `uris`, and `password_history`, risking silent data loss if the backend handler does not defensively read `existing` values. Hardened `handleRenamePod`, `handleDeletePod`, `onBulkMoveToPod`, and `onBulkAssignTags` to pass complete data models, wrapped operations in `try/catch` with reactive error reporting and `scuttleVault` recovery, and built `tests/unit/uiSeams.test.ts` (11 tests) verifying glue logic and endpoint dispatch.
