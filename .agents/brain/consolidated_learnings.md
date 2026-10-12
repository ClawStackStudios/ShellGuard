# Consolidated Learnings

> Refined, actionable, long-term knowledge derived from `raw_reflection_log.md`. Organized for retrieval. Prune raw log after consolidation.

---

## Crypto & Encryption

**Pattern: Native `crypto` over `webcrypto.subtle`**
- `crypto.webcrypto.subtle` hangs on certain Linux/Node combinations (confirmed on Linux 6.12.24-Unraid / Node v22.23.0).
- Always use native `crypto` module: `crypto.hkdfSync` for key derivation, `crypto.createCipheriv`/`createDecipheriv` for AES-256-GCM.
- `crypto.hkdfSync` is synchronous and returns a Buffer directly.
- *Rationale:* Native crypto is universally available and doesn't have the async/hanging issues of webcrypto.subtle in server environments.

**Pattern: In-Place Encryption with Self-Describing Envelopes**
- Store encrypted data as JSON envelopes in the same TEXT column as plaintext: `{v:1, alg:"SG-META", iv, ct}`.
- Use `isEncryptedField()` type guard to detect envelopes vs plaintext on read.
- Legacy plaintext passes through unchanged — backward compatible without migration.
- *Rationale:* No schema changes, no ALTER TABLE, no new columns. Encrypted and plaintext rows coexist seamlessly.

**Pattern: Deliberate Algorithm Distinction**
- Use distinct `alg` values for different encryption systems (`"AES-GCM-256"` for client, `"SG-META"` for server).
- *Rationale:* Prevents confusion between encryption layers. Each system can identify its own envelopes.

**Pattern: Hash-Only Agent Key Ledger (`0004_key_ledger`)**
- Never persist plaintext `api_key` in the database. Store SHA-256 `key_hash` and `key_fingerprint` (`lb-***-XXXX`).
- Verify incoming keys via constant-time `crypto.timingSafeEqual(incomingHash, storedHash)`.
- Deliver plaintext once at minting time; card display uses full masking (`maskKey()`) over the fingerprint.
- *Rationale:* Eliminates database-leak exposure for agent keys; even a raw database dump yields zero actionable API credentials.

**Pattern: The ClawKey Canon**
- `ClawKey©™`: Sovereign 67-character `hu-` identity key (and downloaded JSON identity file).
- `ShellCryption©™`: Client-side zero-knowledge encryption engine (HKDF + AES-GCM-256).
- `LobsterKeys`: Granular, scoped agent API keys (`lb-` prefix) minted for automated AI agents.
- *Rationale:* Verbatim terminology parity across Web and Android companion eliminates cross-platform user confusion.

**Pattern: Branched KDF & Caller-Side Native Acceleration**
- For high-entropy machine keys (ClawKey `hu-` with 256 bits entropy), HKDF-SHA256 provides instant expansion.
- For human-supplied passphrases, PBKDF2-HMAC-SHA256 (600,000 iterations per OWASP guidance) provides essential GPU brute-force resistance.
- In browser clients, compute PBKDF2 via caller-side async feature detection (`globalThis.crypto?.subtle.deriveBits`) to run off-thread in ~1s without UI freezing, falling back to pure-TS `pbkdf2Sha256` for non-secure HTTP origins.
- Enforce fail-closed CSPRNG (`crypto.getRandomValues`) for all nonces/salts — never fallback to PRNG under AES-GCM.
- *Rationale:* Eliminates main-thread blocking on client export/import while maintaining cryptographic defense against offline brute force.

---

## Testing

**Pattern: Test Isolation with `vi.hoisted()`**
- Set `DATA_DIR`, `PORT`, and env vars in `vi.hoisted()` BEFORE dynamic server import.
- Each test suite gets a unique PORT (e.g., 64641-64645) to avoid conflicts in parallel workers.
- Database singleton evaluates at module load — hoisting order is load-bearing.
- *Rationale:* Ensures complete isolation between test suites. No shared state, no port conflicts.

**Pattern: Encryption Test Dual-Mode**
- Test with `DB_ENCRYPTION_KEY` set (cipher active) AND unset (passthrough mode).
- Both modes must pass — passthrough is the default, encryption is opt-in.
- *Rationale:* Ensures backward compatibility and that encryption is truly optional.

**Pattern: The Dual-Lock Protocol (Automated Oracle + Physical Human Live Handshake)**
- Automated test suites verify isolated syntactic and algorithmic correctness, but are blind to *macro-gestalt* friction (animation layout unmounts, visual affordance gaps, ontological ghost categories).
- Work is never marked complete until both automated pre-flight gates (types, tests, build) AND the physical human live verification handshake pass.
- *Rationale:* Green test suites provide false confidence when operational glue and interaction seams remain unexercised in reality.

**Pattern: Template-Scaffolded Verification Canvases**
- Structure verification using formal templates (`verificationChecklist-basic.md`, `verificationChecklist-advanced`) and write them to an active file canvas (`.agents/scratch/verificationChecklist.md`).
- The scratchpad serves as an asynchronous, persistent collaboration workbench between the human operator and the agent across context compactions and sessions.
- *Rationale:* Chat prompts vanish in scrollback and token pruning; a dedicated checklist file tracks exact testing notes, reproduction cases, and pass/fail states until 100% verified.

---

## Git & Workflow

**Pattern: Conventional Commits with Two-Layer Attribution Format**
- Structure commit headers strictly as `<type>(<scope>): <summary under 72 chars>` using imperative mood without trailing periods.
- Map types directly to changelog sections: `feat` $\rightarrow$ `Added`, `fix` $\rightarrow$ `Fixed`, `refactor`/`perf` $\rightarrow$ `Changed`, `revert` $\rightarrow$ `Removed`.
- Indicate breaking changes with `!` on the type (`feat(api)!:`) or a `BREAKING CHANGE:` footer with migration notes.
- Layer ShellGuard's two-layer attribution (`User:` for intent/architecture, `AI:` for concrete implementation) directly under the Conventional Commit header.
- *Rationale:* Bridges automated tooling (`commitlint`, `git-cliff`, `standard-version`) with human-readable authorship and structural intent.

**Pattern: Keep a Changelog 1.1.0 & Single Active Release Draft Architecture**
- Maintain `CHANGELOG.md` following Keep a Changelog v1.1.0 with an `## [Unreleased]` buffer and standardized sections (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`), anchored by comparison links at the footer.
- Maintain the Single Active Release Draft Invariant: exactly one `RELEASE-vX.Y.Z.W.md` document exists in the repository root at any time, mirrored directly into GitHub Releases upon tag creation.
- *Rationale:* Eliminates conflicting release artifacts and guarantees clean synchronization between Git history, release documentation, and CI/CD pipelines.

**Pattern: Agent File Staging Discipline**
- When agents modify files, verify staged files before committing.
- Agents may stage unrelated files (docs, config) alongside their target changes.
- Use `git reset HEAD <file>` to unstage unrelated changes.
- *Rationale:* Keeps commits atomic and focused. One logical change per commit.

**Pattern: Staged-vs-Untracked Pre-Commit Check**
- Before any `git commit`, run `git diff --cached --stat` to inspect what is already staged in the index.
- If the index contains staged changes you did not author, stop and ask whether to unstage, bundle deliberately, or commit separately.
- *Rationale:* `git add <file> && git commit` commits the entire index, not just `<file>`.

**Pattern: Verification of Merged In-Flight Edits**
- When committing work that includes in-flight user edits, run the project's test + build gates on the merged working tree before committing.
- *Rationale:* User edits ride the commit and attribution; they must ride the verification loop too.

**Pattern: Large Code Inserts Without Boundary Clipping**
- Prefer replacing bounded `old_text` anchors over bare line inserts at boundaries.
- Re-read ±15 lines around the insertion point afterward to confirm syntax boundaries survived intact.
- *Rationale:* Boundary inserts can clip multi-line closing brackets or type annotations.

**Pattern: Zero-Waste GitHub Actions Release & Chained Mirror Pipeline**
- In `.github/workflows/release.yml`, enforce job-level server-evaluated `if:` conditions (`startsWith(github.ref, 'refs/tags/v') || github.event_name == 'workflow_dispatch' || contains(github.event.head_commit.message, '--release')`).
- Standard non-release development commits skip before VM runner allocation, consuming 0 billable runner minutes.
- Chain the `mirror` job sequentially after `release` (`needs: [release]` with `always()` and success/skipped guards) to run on `--release` and tag pushes, updating the GitHub Release body via `gh release edit "$TAG" --notes-file "$FILE"`. Exclude manual `workflow_dispatch`.
- *Rationale:* Ensures root `RELEASE-v*.md` is the single source of truth mirrored automatically without race conditions or wasted CI runner resources.

**Pattern: First-Class Git Persistence for Agent Customizations (`.agents/`)**
- Agent directories (`.agents/`, `.claude/`, `.clinerules/`) containing rules, skills, workflows, templates, and brain files are tracked in Git and never ignored in `.gitignore`.
- Commit brain updates (`activeContext.md`, `progress.md`) alongside corresponding feature code and release tasks.
- *Rationale:* Preserves agent architectural memory, behavioral guardrails, and automated release workflows across resets, workstations, CI runners, and collaborators.

**Pattern: Docs Bow to Code (The Governance Ruling & Tri-Layer Truth)**
- When verified, secure runtime code contradicts documentation prose, docs bow to code: the document is the defect, never the code.
- Stale prose is the defect; never alter working, secure code to match an out-of-date document claim.
- Source of truth operates in 3 layers: (1) Enforcing Code (Primary Oracle), (2) Test Fixtures & Vectors (Behavioral Oracle), (3) Living Documentation (Faithful Mirror).
- Apply the Claim Battery Method: grep enforcing code first; if no literal hit, grep test fixtures; assert documentation matches code truth.
- *Rationale:* Prevents security degradation from retrofitting code to obsolete or misremembered documentation specs.

**Pattern: Automated Multi-Class Link & Mermaid Syntax Test Oracles for VitePress**
- Enforce documentation integrity via automated machine tests (`docsLinks.test.ts` and `mermaidDiagrams.test.ts`) in CI.
- Validate all 3 link classes: Config links (`link: '/...'`), Markdown links (`](/...)`), and Raw HTML hrefs (`href="/..."` in custom Vue components).
- Guard against base-prefix regression in custom Vue theme components by enforcing `withBase()` and `:href="normalizedHref"`.
- Validate Mermaid diagram syntax: assert every fence is closed and detect fatal unquoted brackets/braces in node labels (`Node[label {with} braces]`).
- *Rationale:* Eliminates documentation drift, broken deployed subpaths, and broken diagram rendering mechanically without manual proofreading.

**Pattern: Agent Brain Isolation Boundary**
- Antigravity operates strictly in `.agents/brain/`.
- Cline operates strictly in `.clinerules/brain/`.
- Strict isolation: never write, edit, stage, or mirror files to the other agent's brain directory.
- *Rationale:* Each agent has its own distinct cognitive substrate and workflow lifecycle; cross-contamination destroys state consistency.

**Pattern: Brand Asset Twin Parity**
- Brand assets must maintain strict 1:1 parity between web application root (`public/`) and documentation portal (`docs/public/assets/`).
- *Rationale:* Eliminates broken links, ensures consistent visual branding between the live web app and the VitePress docs portal.

---

## Express / API

**Pattern: Route Async Wrapping for Encryption**
- All vault routes become async when adding metadata encryption.
- GET: `await prepareReadAll(table, rows, cipher)` before response.
- POST/PUT: `await prepareWrite(table, body, cipher)` before INSERT/UPDATE.
- Response echoes original plaintext (req.body), NOT encrypted values (toStore).
- *Rationale:* Client always receives plaintext. Encryption is transparent to the API consumer.

**Pattern: Route Ordering Hygiene (Static / Bulk Subpaths Before Parameterized Handlers)**
- In Express routers, declare static and sub-resource routes (e.g. `POST /bulk-import`, `DELETE /bulk`) strictly *before* parameterized pattern routes (e.g. `PUT /:id`, `DELETE /:id`).
- Placing `/bulk` after `/:id` causes Express router to match `/bulk` as `req.params.id = 'bulk'`, silently shadowing the bulk endpoint.
- *Rationale:* Prevents critical P0 routing defects where batch operations are misinterpreted as single-entity mutations on a literal ID.

**Pattern: 207 Multi-Status Partial Failure Reporting & Ingestion Engine**
- When designing batch operations where individual records can fail without aborting valid ones:
  - Validate array container bounds in middleware (`validateBody(z.array(z.any()).min(1).max(1000))`).
  - Validate individual records per-item in the route handler via `safeParse()`.
  - Execute valid inserts inside an atomic database transaction (`db.transaction(...)`).
  - Return `201 Created` with `{ inserted: string[] }` when all records succeed.
  - Return `207 Multi-Status` with `{ inserted: string[], errors: [{ index, reason }] }` on partial success.
  - Mount a dedicated scoped body parser (e.g. 10MB on `/bulk-import`) before global 1MB limits.
- *Rationale:* Enables robust high-volume data ingestion, granular error reporting, and prevents single-record failures from blocking large migrations.

**Pattern: Wire-Exact Documentation Contract Alignment (Docs Bow to Code)**
- Document endpoint return payloads with exact TypeScript types matching the controller (e.g., distinguishing between an array of IDs `inserted: string[]` versus a count `inserted: number`, and exact HTTP status codes `201 Created` vs `207 Multi-Status`).
- *Rationale:* Automated agents and API consumers depend on literal contract fidelity; subtle type mismatches cause client parser failures.

---

## Project-Specific

**ShellGuard Port Allocation:**
- Development: Frontend :6464, API :6565
- Production: Single port :6464
- Tests: 64641 (auth-flow), 64642 (security), 64643 (vault-crud), 64644 (settings), 64645 (admin), 64648 (metadata-encryption), 64650 (vault-bulk-import)

**ShellGuard Key System:**
- `hu-` key: 67 chars (`hu-` + 64 base62). Identity + ShellCryption seed. SHA-256 hash stored server-side only.
- `lb-` key: 67 chars (`lb-` + 64 base62). Agent access. SHA-256 hash stored server-side in key ledger (`0004_key_ledger.sql`), plaintext never stored.
- `api-` token: 36 chars (`api-` + 32 hex). Short-lived session bearer.

**ShellGuard DB_ENCRYPTION_KEY Dual Role:**
- Governs BOTH SQLCipher whole-DB encryption AND per-row metadata encryption.
- Both activate together when set. Both are no-ops when unset.
- Generate with: `openssl rand -base64 32`

---

## UX Patterns

**Pattern: "Locked Dashboard" vs "Logged Out Landing"**
- When a user logs out or a session expires, but there are known accounts stored in local memory, default to a locked dashboard overlaying the app to maintain navigation context.
- Only show a completely blank "Landing" page if zero accounts are known.
- *Rationale:* Mimics Bitwarden's shared-device pattern. Prevents jarring navigation state loss and allows for immediate re-authentication from the exact context the user was in.

**Pattern: Granular Background Account Locking**
- If an app architecture supports multiple simultaneous unlocked sessions in `sessionStorage` (unlike traditional strict singlet-session password managers), expose granular lock controls in the account switcher.
- *Rationale:* Major privacy win for multi-tenant users (e.g. keeping Work vault locked while Personal is active).

**Pattern: Reef Modernist UI Modals over Native Browser Dialogs**
- Never invoke native browser `window.prompt()` or `window.confirm()`.
- Implement accessible, dark-mode inline input cards and modal dialogs (`ConfirmDialog`) for user input, batch confirmations, and deletion warnings.
- *Rationale:* Browser native prompts block JavaScript execution, break automated headless testing (Vitest / Playwright / Puppeteer), and destroy dark-mode theme fidelity.

**Pattern: Mutation Field Preservation in Bulk Operations**
- When updating a subset of item attributes across multiple items (e.g. bulk moving items to a pod or assigning tags), ensure existing metadata fields (such as `tags: item.tags`) are explicitly preserved in the payload sent to the update endpoint.
- *Rationale:* Endpoints that update records by overwriting column values will silently clear unmentioned fields if not preserved by the client adapter.

**Pattern: Thoughtful Systems & User Interface Symbiosis (Two-Stage Ingestion & Ambient Docking)**
- When architecting heavy, multi-resource client-side workflows (e.g. multi-gigabyte vault mobility with binary attachments up to 500MB):
  - Decouple the operation into a fast transactional phase and an ambient streaming phase.
  - **Stage 1 (Transactional Core)**: Persist lightweight relational metadata immediately (<2s) to liberate the UI and fulfill human intent without delay.
  - **Stage 2 (Non-Blocking Ingestion Dock)**: Offload heavy streaming I/O to a persistent, minimized ambient tray/dock with explicit pause/cancel/retry controls.
  - **Reactive Visual Grounding**: Reflect in-flight background state directly within the primary workspace (e.g. pulsing status chips on item detail cards) so the UI remains dynamic and truthful, never static or detached.
- *Rationale:* Eliminates the false dilemma between blocking modal progress traps (which freeze the user) and disconnected background tasks (which cause stale/ghost state confusion). Architecture and interface must be co-designed as a single grain.

---

## React & Frontend

**Anti-Pattern: Event Listener Leaks in `useEffect`**
- Passing `addEventListener` in the return cleanup function instead of `removeEventListener` leads to massive listener leaks.
- *Rationale:* This is especially fatal for global events like `mousemove` and `scroll` on high-frequency triggers (like inactivity timers). Always double-check cleanup functions.

**Pattern: Category Normalization & Hierarchical Pod Matching**
- Always normalize category strings (trimming whitespace, deduplicating slashes, stripping leading/trailing slashes) before comparisons.
- Sub-pods must be matched using `.startsWith(targetPod + "/")` to guarantee that nested items cascade correctly on rename or deletion.
- *Rationale:* Unnormalized string comparison fails silently across systems with slight whitespace or formatting discrepancies.

**Pattern: Optimistic State Updates with Batched Server Synchronization**
- When executing multi-item operations (e.g. reassigning items from a deleted pod), mutate the local React state immediately (`setVaultItems(prev => prev.map(...))`).
- Execute individual item updates with `skipScuttle=true` to prevent intermediate `GET` requests from pulling stale data and reverting optimistic UI changes.
- Perform a single trailing `scuttleVault()` after all asynchronous mutations complete.
- *Rationale:* Prevents race conditions between in-flight mutations and re-fetching, providing instant UI feedback without phantom state flickering.

**Pattern: Zero Hardcoded Default Categories**
- Never hardcode static default categories into root arrays or getter fallbacks unless explicitly designed as permanent system primitives.
- When categories are user-defined, unassigned items should cleanly map to `""` (uncategorized), and deletion of a pod must cleanly clear the category rather than reassigning to a phantom default.
- *Rationale:* Hardcoded defaults resurrect deleted items/folders on every render cycle and prevent users from maintaining an empty, customized structure.

**Pattern: Vault Lock Hardening & Client-Side Mutation Denial**
- Thread `isLocked` state down to all navigation sidebars, folder trees, and modals.
- When `isLocked === true`, suppress all creation/edit/delete buttons, suppress live search dropdowns, and add early-return lock guards (`if (isLocked || !shellKey) return;`) to prevent local storage color mutations or race conditions before server verification.
- *Rationale:* Sensitive password manager UI must strictly prohibit mutation interactions while locked to avoid desynchronizing client state from encrypted backend data.

**Pattern: Explicit NavIntent for Reload Fidelity**
- Store explicit navigation intent (`sg_nav_intent: "landing" | "dashboard"`) across authentication actions.
- Manual logout ("Claw Out") sets `sg_nav_intent = "landing"`, ensuring reloads stay on the marketing/landing page.
- Inactivity timeouts, locking, and logins set `sg_nav_intent = "dashboard"`, ensuring reloads maintain the locked dashboard overlay context.
- *Rationale:* Eliminates reload ambiguity when user identities exist in persistent storage while session keys are volatile in `sessionStorage`.

---

## Documentation & Repository Hygiene

**Pattern: The "Docs Bow to Code" Tri-Layer Truth Architecture**
- **Layer 1: Enforcing Code (Primary Oracle)** — Zod schemas, Express route controllers, DB migrations, and ShellCryption routines.
- **Layer 2: Test Fixtures (Behavioral Oracle)** — Vitest unit and integration suites testing invariants and wire shapes.
- **Layer 3: Living Documentation (Faithful Mirror)** — VitePress portal, README, ARCHITECTURE, and brain.
- When prose contradicts shipped, verified code, the document is the defect; never mutate secure code to match stale text.
- *Rationale:* Eliminates documentation drift and guarantees documentation truthfulness across human developers and autonomous AI agents.

**Pattern: The Living Security Contract (`SECURITY.md`)**
- Root `SECURITY.md` is a binding contract, not an aspirational marketing brochure.
- Must include OpenSSF-compliant Supported Versions Matrix (`0.0.2.x`), Coordinated Vulnerability Disclosure protocol, private reporting SLA (72h), and formal Safe Harbor legal protections for good-faith security researchers.
- Every cryptographic claim (Layer 1 ShellCryption AES-GCM-256, Layer 2 SG-META, Layer 3 SQLCipher, hash-only LobsterKey ledger) must be verified against literal code hits via the Claim Battery Protocol.
- *Rationale:* Zero-knowledge vaults require absolute honesty and transparent boundaries between client assurances, storage guarantees, and transport tradeoffs.

**Pattern: Ephemeral Worktrees for Zero-Friction Task Isolation**
- When working on concurrent tasks, urgent hotfixes, or multi-agent parallel branches without disturbing in-flight working trees, utilize Git Worktrees (`git worktree add ../<path> -b <branch>`). Clean up with `git worktree remove` and `git worktree prune`.
- *Rationale:* Eliminates risky stash operations, branch switching thrashing, and dirty working tree accidents.

**Pattern: The Reflog Safety Net & Pre-Rebase Snapshot Protocol**
- Always create a temporary safety branch (`git branch backup/<branch>-$(date +%s)`) before executing an interactive rebase, squashing, or resetting history.
- Git retains all ref movements for at least 90 days in `git reflog`; any accidentally dropped commit or deleted branch can be fully recovered.
- Master universal `--abort` escape hatches (`git rebase --abort`, `git cherry-pick --abort`, `git merge --abort`) to escape cleanly if conflicts occur.
- *Rationale:* Transforms history rewriting from a high-risk venture into a deterministic, completely reversible operation.

**Pattern: Automated Test-Driven Regression Bisect**
- Use `git bisect run <test-command>` (e.g. `git bisect run npx vitest run ...`) to isolate regressions across large commit histories in $O(\log N)$ time.
- *Rationale:* Eliminates speculative manual checkout loops and pinpoints exact commit faults automatically.


