# Decision Log — ShellGuard

*Episodic memory: how I moved through the codebase. Semantic truth lives in the Brain; walls, detours, and instincts live here. Sliding window: 20 entries.*

---

## 2026-10-18 — /learn protocol: Post-review verification & adjacency sweep ratified
Lucas executed `/learn` on post-review verification mechanics preceding PR merge. Codified Phase 5.5 in `working-with-jules/SKILL.md`, enhanced `git-review-pr/SKILL.md` (target base alignment check and post-review checklist), and updated Gate 1 in `cadence-and-lifecycle-prompts.md`. Ratified the 4 Post-Review Gates: (1) Target base alignment (`gh pr edit --base stage/*`), (2) Live task tracker reconciliation (flagging omitted sub-tasks as candidate gaps), (3) 4-question adjacency & unarticulated operational sweep (OWASP vs YAGNI), and (4) Epistemic doubt ratification against native platform truth.

## 2026-10-17 — Phase 24 dispatched to Jules & stage branch grounded
Pushed `stage/phase-24-crypto-hardening` to origin with pre-heated `.jules/knowledge/KNOWLEDGE.md`, Tasks 47 & 48 anchored, and 5 inline `TODO(jules)` markers across code and tests. Dispatched Google Jules CLI (Session `1532409642078832614`) with atomic prompt enforcing `.jules/` discovery, sovereign `.agents/` exclusion, and the Epistemic Escape Hatch (`// TODO(uncertainty):`). Live tracking matrix active.

## 2026-10-17 — /learn protocol: prep-jules-work skill & epistemic escape hatch
Lucas executed `/learn` on the structural staging workflow preceding Jules dispatch. Codified the self-contained `prep-jules-work` skill enforcing the 4-Gate Preparation Pipeline (Map Gate → Artifacts Gate → Pre-Heat Gate → User Trigger Gate). Established two mandatory prompt invariants: explicit `.jules/` discovery (Jules does not read it by default) and sovereign `.agents/` exclusion. Authored Lucas's profound insight—the Epistemic Escape Hatch Protocol (`// TODO(uncertainty):`)—authorizing Jules to flag low-confidence compromises and removing RLHF faked-confidence bias. Added Gate 0 to `cadence-and-lifecycle-prompts.md`, updated `.jules/JULES.md`, and pre-heated `.jules/knowledge/KNOWLEDGE.md`.

## 2026-10-17 — Jules TODO mapping, stale milestone cleanup & Phase 24 task anchoring
Lucas requested a repository-wide audit and map of Jules TODO comments, eliminating stale milestone indicators while keeping active TODOs current. Verified production code and test suites contain zero dangling TODO comments. Stamped Stage 24 / Sub-Stage 25.1 as complete in `project/meta-prompt-ai-studio.md`, marked `.jules/tasks/task-45.md` & `task-46.md` completed, advanced `.jules/JULES.md` to Phase 24, authored `task-47.md` and `task-48.md`, and placed 5 actionable, current `TODO(jules)` anchors across code and docs to enable autonomous co-pilot execution.

## 2026-10-17 — Tossing superseded PR #3 and clean PR closure
Lucas queried whether to merge or toss lingering open PR #3 from the earlier Jules Phase 23 iteration. Inspected branch topology and commit diff: PR #3 (`stage/phase-23-item-integrity-8580131941674843399`) was Jules's preliminary draft, completely superseded by PR #4 and PR #5 (`stage-phase-23-item-integrity-8580131941674843399`), which brought in Sub-Stage 25.1 and were already merged into `main`. Closed PR #3 via `gh pr close 3` with an auditable summary, leaving zero open PRs.

## 2026-10-17 — Phase 23 stage merge, sovereign boundary enforcement & release v0.0.2.5 preparation
Executed the final stage merge of Phase 23 / Sub-Stage 25.1 into main. Mechanically checked out orchestrator HEAD for `.agents/` (`git checkout HEAD -- .agents/`) during stage merge, resolving all contaminated co-pilot workflow modifications cleanly while taking 100% of Jules's verified code in `src/`, `tests/`, `migrations/`, and `docs/`. Merged stage into `main` with `--no-ff`. Authored `RELEASE-v0.0.2.5.md`, purged old `RELEASE-v0.0.2.4.md`, retired Phase 20 into `ROADMAP-HISTORY.md`, advanced `ROADMAP.md` 3-version sliding window (Phases 21, 22, 23), and synchronized version anchors across all manifests and architecture diagrams.

## 2026-10-17 — High-agency root AGENTS.md skill-seed creation
Lucas and I authored a root-level `AGENTS.md` following the Agent Driven Planning onboarding framework. Transformed a ~3,500-token verbose specification into a ~550-token generative invariant seed using the "compress the constraint, not the procedure" doctrine, assuming agent search competence and multi-agent delegation to replace fragile static trees with on-demand boundary mapping. Preserved `.agents/AGENTS.md` completely sovereign and untouched.

## 2026-10-16 — /learn protocol execution: Real Finishers, Co-Pilot Prompting & Sovereign Gate
Lucas executed `/learn` to crystallize core lessons from Phase 23 / Sub-Stage 25.1 co-pilot coordination. Ratified: (1) The "Real Finishers" Quality Gate in `docs-hygiene.md` (user-facing VitePress reading cohesion, seamless feature slotting with explicit session token / auth contracts); (2) Self-Review Checklist v4 (`self-review-checklist.md`) adding Items 16 (Co-Pilot PR Ingestion & Sovereign Gate), 17 (Terminal Phrasing & Co-Pilot Prompting), and 18 (Core Merging Invariable & Health Stack); and (3) Task Completion Gate 1 in `cadence-and-lifecycle-prompts.md` backed by stacked cryptographic, relational, and isolation proofs.

## 2026-10-16 — Phase 4 Sub-Stage 25.1 Directive Dispatched to Jules
Audited Jules's physical git state and confirmed commit 2fc608b on stage/phase-23-item-integrity-8580131941674843399 (PR #3) incorporating the formal Sub-Stage 25.1 prompt block into project/meta-prompt-ai-studio.md. Formulated and dispatched the complete Phase 4 operational directive: relational cascade on DELETE /api/attachments/:id, runtime quarantine sweeper POST /api/attachments/quarantine/sweep, pre-flight quota GET /api/attachments/quota, dedicated vitest assertions in tests/attachment-integrity.test.ts, and walk-the-docs synchronization.

## 2026-10-16 — Rigorous PR #4 Review, Base Branch Realignment & Remediation Dispatch
Executed /git-review-pr on Jules PR #4 and documented evidence-graded findings in pr_review_4_2026_10_16_0545.md. Found that while implementation in ac5dfd2 passed cloud CI green, PR #4 misdirected its target base to main, breached sovereign .agents/ in commit 9035b82, and failed to push the promised Sub-Stage 25.1 prompt. Realigned PR base to stage/phase-23-item-integrity via GitHub CLI and dispatched a Lucas-approved invariable-centered remediation directive (issuecomment-6209118929) to collapse Jules's work into strict relational integrity and sovereign boundaries.

## 2026-10-14 — Actionable Sub-Stage codification from Jules's architectural findings
Operationalized Jules's independent architectural discoveries into a formal 5-phase Sub-Stage for Stage 25 on PR #4 (issuecomment-6163022390). Rather than leaving insights on the floor or hand-crafting solutions ourselves, we directed Jules to execute Phase 1 (/walk-the-docs), Phase 2 (meta-prompt sub-stage definition & prompt draft), Phase 4 (relational array cascade purge, runtime quarantine sweeper, pre-flight quota endpoint, and test suite), and Phase 5 (final doc pass), while reserving Phase 3 for orchestrator branch merge and sovereign .agents/ protection.

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

