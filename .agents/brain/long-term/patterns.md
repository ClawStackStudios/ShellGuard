# Ratified System Patterns — ShellGuard

> Crystallized system patterns proven through repeated navigation, friction, and verification. These patterns have held under pressure across multiple releases and sessions.

---

## native-crypto-over-webcrypto
**weight**: 4 | **last validated**: 2026-09-17 | **first observed**: 2026-08-29

Always use Node.js's native synchronous `crypto` module (`crypto.hkdfSync`, `crypto.createCipheriv`) for server operations, never `crypto.webcrypto.subtle`.

**History:**
- 2026-08-29: Initial discovery during test suite setup — `webcrypto.subtle` operations hung indefinitely on Linux 6.12.24-Unraid with Node v22.23.0.
- 2026-09-04: Confirmed during native LAN TLS and bridge parity testing; async webcrypto in server context stalled test runner execution.
- 2026-09-13: Validated during Phase 17 Key Ledger Hardening; constant-time hash comparisons and HKDF derivations completed in sub-millisecond synchronous ticks with native crypto.
- 2026-09-17: Verified across all 15 test suites (210 tests passing); zero hangs or threadpool deadlocks.

**Shaped perspective:** The webcrypto standard is designed for sandboxed browser runtimes with event loops that handle asynchronous promises gracefully. In a headless Node.js service running on Linux under custom kernel builds (e.g. Unraid), native crypto is not just a performance optimization — it is the boundary between an operational daemon and an unresponsive zombie process. To change this would require proving that Node's V8 webcrypto implementation no longer starves worker threads under crypto loads.

---

## in-place-encryption-envelopes
**weight**: 4 | **last validated**: 2026-09-16 | **first observed**: 2026-08-28

Store per-row encrypted metadata as self-describing JSON envelopes (`{v:1, alg:"SG-META", iv, ct}`) directly within existing TEXT columns, accompanied by an `isEncryptedField()` detection guard.

**History:**
- 2026-08-28: Implemented in Phase 5 to avoid ALTER TABLE schema migrations on production databases.
- 2026-09-04: Validated during bridge parity audit; legacy plaintext rows continued to pass through unencrypted on read while new writes were encrypted automatically.
- 2026-09-13: Confirmed during Phase 17 when `agent_keys` underwent schema evolution; existing envelope parsers handled envelope detection without regression.
- 2026-09-16: Tested during bidirectional docs-code audit; envelope contract remained transparent to client consumers.

**Shaped perspective:** Relational database migrations are high-stress seams that risk data loss, lock contention, and version fragmentation across self-hosted instances. By decoupling data encryption from column schemas through self-describing envelopes, the storage layer becomes resilient to version skew. What broke when we didn't have this was migration anxiety and dual-column sprawl (`title` vs `title_encrypted`). The pattern holds because reading code is cheaper than migrating tables.

---

## zero-hardcoded-pod-purity
**weight**: 3 | **last validated**: 2026-09-13 | **first observed**: 2026-09-02

Vault categories and pods must never fall back to hardcoded default strings like `'Personal'` or `'Default'`. Unassigned items must cleanly evaluate to `""` (uncategorized).

**History:**
- 2026-09-02: Hardcoded `'Personal'` fallbacks caused user-deleted categories to resurrect upon every subsequent vault render and broke custom folder hierarchies.
- 2026-09-04: Purged hardcoded defaults from `podUtils.ts` and normalized comparisons with `normalizePod()`.
- 2026-09-13: Ratified during Phase 17 Key Ledger Hardening: dropped `DEFAULT 'Personal'` from database schema migrations and route handlers, proving uncategorized purity across all 4 item types.

**Shaped perspective:** Hardcoded defaults are a false affordance that presumes to know the user's organizational ontology. In a privacy-first vault, phantom state is indistinguishable from data corruption. When code injects `'Personal'`, it violates user intent and generates phantom synchronization noise. The empty string `""` is the only honest representation of the unassigned state.

---

## test-isolation-via-hoisting
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-08-30

Every integration test suite must hoist its unique `DATA_DIR` and port configuration using `vi.hoisted()` prior to dynamic application imports.

**History:**
- 2026-08-30: Initial suites suffered from cross-test SQLite database lock contention and port collisions when run in parallel.
- 2026-09-04: Formalized dedicated port blocks (64641–64645) and hoisted isolated temp directories for each suite.
- 2026-09-17: Verified across 15 test files with `fileParallelism: false`; complete zero-leak test isolation achieved across 210 tests.

**Shaped perspective:** In an application anchored to SQLite and SQLCipher, the database connection is a stateful singleton bound at module import time. If environment variables are set inside `beforeAll()` instead of hoisted before import, the singleton evaluates against the default path, silently polluting dev databases. Hoisting enforces that configuration precedes evaluation, making tests true independent witnesses.

---

## dual-verification-and-the-live-handshake
**weight**: 4 | **last validated**: 2026-09-22 | **first observed**: 2026-09-21

Automated test suites and human operational verification are orthogonal, non-interchangeable layers of truth. A feature is only verified when both automated gates (typecheck, tests, build) and the human Live Verification Handshake confirm it holds.

**History:**
- 2026-09-21: Automated test suites passed 100% green while vault item deletion failed in the browser due to glue code misrouting and a background port listener collision.
- 2026-09-21: Instituted `.agents/rules/project-hygiene.md` mandating that before marking any task complete, the agent must formulate a concrete, step-by-step Live Verification Checklist for Lucas to physically test in the browser.
- 2026-09-21: Aligned `cadence-and-lifecycle-prompts.md` Gate 1 so the live test handshake precedes any final commit approval.
- 2026-09-22: Live verification handshake on Phase 21 surfaced 3 subtle interaction faults (ghost pod 'Attachment' in bulk modals, lack of note attachment schema parity, and detail pane unmounting on save due to AnimatePresence mode='wait') despite 100% green automated test suites (306 tests). After rapid remediation, physical re-testing confirmed all 3 items passed.

**Shaped perspective:** Machine gates prove internal syntactic and algorithmic consistency within the boundaries of what the author remembered to test. Human live verification proves that the software meets reality at the surface of use. One without the other is half-blind. Pairing automated test oracles with the human project manager's live witness forms the dual lock that prevents silent regression.

---

## template-scaffolded-verification-canvases
**weight**: 3 | **last validated**: 2026-09-22 | **first observed**: 2026-09-21

Standardized verification templates (`verificationChecklist-basic.md`, `verificationChecklist-advanced`) paired with an active scratchpad file (`.agents/scratch/verificationChecklist.md`) establish a resilient, asynchronous contract between the AI agent and the human project manager across resets and compactions.

**History:**
- 2026-09-21: Formulated the first dedicated checklist artifact in `.agents/scratch/verificationChecklist.md` covering 4 functional areas.
- 2026-09-21: Lucas reorganized root templates into structured basic and advanced tiers (`.agents/templates/verificationChecklist-basic.md`, `verificationChecklist-advanced`).
- 2026-09-22: The scratchpad persisted across context window compactions, preserving test notes, reproduction steps, and pass/fail statuses seamlessly until 100% verification was achieved.

**Shaped perspective:** An ad-hoc verification prompt in chat vanishes into conversational scrollback and token compaction. A file-backed verification canvas, structured by a formal template, creates an immutable audit artifact. It forces the agent to formulate unambiguous, numbered operational steps, and empowers the human to record experiential feedback in place. The template is the scaffold; the scratchpad is the shared workbench.

---

## eye-beside-copy-control-ergonomics
**weight**: 4 | **last validated**: 2026-09-23 | **first observed**: 2026-09-18
**pinned**: false

Every masked secret field (passwords, SSH private keys, hidden custom fields, API tokens) must place the unmask toggle (Eye/EyeOff) immediately to the left of the Copy action, and enforce full-value bullet masking (`••••••••••••••••`) by default with zero partial character leakage.

**History:**
- 2026-09-18: Established during Phase 19 (folded forward from Phase 22) across primary login cards and detail panes to prevent accidental visual exposure during copy gestures.
- 2026-09-19: Applied in Phase 20 to the SSH Key dual-key manager, replacing raw JSON unmasking with formatted PKCS#8 PEM blocks paired with Eye/EyeOff toggles and copy feedback.
- 2026-09-21: Lucas's physical live verification of Area 2 surfaced that staged custom fields in `ItemFormModal` lacked eye toggles; rectified by embedding identical Eye-beside-Copy clusters on custom hidden inputs.
- 2026-09-23: Ratified during Phase 22 Reef Polish pass across all dashboard rows and master-detail views, ensuring unified zero-leakage masking invariants.

**Shaped perspective:** The copy gesture and the reveal gesture serve opposite human intents. Copying is for transferring secrets into an external application; revealing is for human cognitive verification. Placing the unmask toggle adjacent to Copy gives the user complete intentional control: they can copy without ever exposing plaintext on screen (crucial in shared workspaces or screen shares), or unmask deliberately before copying. Full-value masking preserves the invariant that secret length or entropy is never visually leaked until explicit interaction.

---

## two-agent-co-pilot-orchestration
**weight**: 6 | **last validated**: 2026-10-17 | **first observed**: 2026-10-12
**pinned**: false

A sovereign orchestrator (Antigravity) directs an asynchronous containerized co-pilot (Jules) through strict physical diff audits, explicit invariant steering, and absolute sovereign domain boundaries. Co-pilot output is never trusted from metadata or pull request summaries; it is verified line-by-line in code, and co-pilot modifications to the orchestrator's cognitive home (`.agents/`) are strictly purged upon merge.

**History:**
- 2026-10-12: Audited Jules PR #2; identified a phantom implementation (+1452 / -303 across 12 files with zero production code) and realigned PR base to stage.
- 2026-10-12: Dispatched 100% steering review on PR #3 offloading Walk-the-Docs and UI polish onto Jules while locking `.agents/` as sovereign orchestrator territory.
- 2026-10-14: Codified Jules's architectural findings into a 5-phase Sub-Stage 25.1 directive on PR #4.
- 2026-10-16: Executed `/git-review-pr` on PR #4; caught base branch misdirection, missing prompt commits, and `.agents/` boundary breaches; dispatched remediation directive.
- 2026-10-16: Enforced sovereign `.agents/` boundary on Jules's workspace, ordering `.agents/` unstaged prior to branch push.
- 2026-10-17: Executed final stage merge of Phase 23 into main; resolved merge conflicts mechanically via `git checkout HEAD -- .agents/` to maintain 100% boundary sovereignty while absorbing 100% of Jules's verified code. Closed superseded ancestor PR #3 with full audit trace.

**Shaped perspective:** When multiple AI agents collaborate on a codebase, ambiguity over cognitive ownership destroys coherence. If the remote worker is permitted to alter the conductor's instructions, workflows, and memories, the control loop destabilizes. By enforcing that the remote worker operates strictly in the code domain (`src/`, `tests/`, `migrations/`, `docs/`) while the orchestrator maintains sovereign dominion over `.agents/`, multi-agent leverage scales without cognitive drift. Trust is never granted to a PR description; proof exists only in the physical git diff.

---

## cloud-offloaded-ci-verification
**weight**: 4 | **last validated**: 2026-10-17 | **first observed**: 2026-10-12
**pinned**: false

All heavy test suites (`vitest`), production bundlers (`vite build`), and documentation compilers (`vitepress build docs`) are strictly offloaded to cloud runners via GitHub Actions (`.github/workflows/ci.yml`). The local host development machine executes only lightweight static checks (`npm run lint`), preserving CPU, RAM, and disk locks while ensuring pristine containerized verification.

**History:**
- 2026-10-12: Local test runs and production Vite builds choked host resources and generated orphaned SQLite database locks; established cloud CI pipeline matching `ShellGuard-Mobile` and `ShellGuard-TOTP`.
- 2026-10-12: Codified universal PR check runner (`.github/workflows/pr-check.yml`) ensuring incoming co-pilot PRs trigger full containerized test matrices automatically.
- 2026-10-16: Verified Sub-Stage 25.1 implementation remotely; cloud runner completed 29 suites (341 tests) 100% green without touching host resources.
- 2026-10-17: Verified release v0.0.2.5 (Build 27) preparation in GitHub Actions Run #39044301919 (100% green across 29 suites in 2m 3s).

**Shaped perspective:** The local machine is the workbench, not the proving ground. When an agent runs resource-intensive test suites and production builds locally on constrained host hardware (e.g. self-hosted Unraid home servers), it starves the environment, deadlocks processes, and invites subtle environment-specific test artifacts. Offloading heavy compilation to isolated cloud containers guarantees reproducible builds from a known-good baseline while keeping the local workstation whisper-quiet and responsive. Verification is achieved by pushing code and tailing the remote runner, never by grinding the host machine.


