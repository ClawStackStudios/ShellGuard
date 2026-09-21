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

---

## Git & Workflow

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
- Agent directories (`.agents/`, `.claude/`, `.clinerules/`) containing rules, skills, workflows, templates, and memory bank files are tracked in Git and never ignored in `.gitignore`.
- Commit memory bank updates (`activeContext.md`, `progress.md`) alongside corresponding feature code and release tasks.
- *Rationale:* Preserves agent architectural memory, behavioral guardrails, and automated release workflows across resets, workstations, CI runners, and collaborators.

**Pattern: Docs Bow to Code (The Governance Ruling)**
- When verified, secure runtime code contradicts documentation prose, docs bow to code.
- Stale prose is the defect; never alter working, secure code to match an out-of-date document claim.
- Verify against the code first (and its test fixtures); then correct the documentation.
- *Rationale:* Prevents security degradation from retrofitting code to obsolete or misremembered documentation specs.

**Pattern: Agent Memory Bank Isolation Boundary**
- Antigravity operates strictly in `.agents/memory-bank/`.
- Cline operates strictly in `.clinerules/memory-bank/`.
- Strict isolation: never write, edit, stage, or mirror files to the other agent's memory bank directory.
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
