# Consolidated Learnings

> Refined, actionable, long-term knowledge derived from `raw_reflection_log.md`. Organized for retrieval. Prune raw log after consolidation.

---

## Documentation Systems

**Pattern: Reverse-Documentation (Genome Reconstruction)**
- To give an existing app a build-pipeline genome: walk `git log --reverse` between tags, read each gap's diffs, transcribe 2-task pairs (Task A engine / Task B surface) with commit receipts, and write spec oracles only when a phase references them.
- Draft phase tables are hypotheses; the git receipts are truth. Always boundary-check the draft against the actual commit list before writing phases.
- Verify the finished chain by traversal: a cold reader must resolve spine → roadmap → spec sections making zero design decisions; every dangling reference found by traversal is a real bug.
- *Rationale:* The docs become the app's genome — anyone can rebuild the organism from them. Drift between docs and code becomes structurally impossible when docs are receipt-backed.

**Pattern: GitHub Anchor Slug Rules (markdown link targets)**
- Slugs lowercase, strip punctuation WITHOUT replacement (dots gone: `v0.0.0.1` → `v0001`), spaces → `-`, consecutive spaces → consecutive `-`.
- Emoji in headings: the base glyph is stripped but the **variation selector (U+FE0F) can survive** in the slug — unpredictable and untestable. Never put emoji in headings that are link targets.
- Verify anchors programmatically (slug every heading, diff against every link) — eyeball checks miscount multi-dot version strings and silently propagate for many passes.
- *Rationale:* One miscounted character in one anchor fix propagated through 8 links for 11 passes before a programmatic audit caught it.

**Pattern: Mermaid Graph Atomic Maintenance**
- Updating a flowchart NODE without rewiring its EDGES leaves orphaned paths — invisible in diffs, caught only by counting edges. Count invariant: edges = nodes + entry + summit (for a linear chain).
- Bundle node update + edge rewiring + frontmatter + section-count check into ONE edit pass per change.
- *Rationale:* Drift between node text and edges accumulated twice in one session before being caught.

**Pattern: Oracle-File Section Integrity**
- Large replace-edits on spec files can consume trailing sections when `old_text` boundaries are stale; `insert_line` at EOF fails silently with stale counts.
- After any oracle edit: re-read ±15 lines around the boundary AND verify the `## §` header count.
- *Rationale:* Two §-sections were silently consumed in one session; header-count checks made the failure class detectable in-pass.

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

**Pattern: SSH Dual-Key Serialization Envelope (Phase 20)**
- The in-browser SSH keypair generator produces a `{publicKey, privateKey}` JSON object that, when unmasked, must yield clean PEM text — not a stringified envelope.
- `parseSshKeySecret`/`serializeSshKeySecret` in `src/lib/keyGen.ts` provides a dual-key envelope with backward compatibility: legacy raw PEMs pass through, clean RFC 7468 PKCS#8 is extracted for unmasking display.
- Strict PKCS#8 framing (PKCS#8 SHAY headers, proper line wrapping) prevents JSON envelope leakage at the unmask boundary.
- *Rationale:* Always inspect the raw secret string at the unmask boundary — a JSON envelope that looks like "a key" is actually two keys concatenated; the fix is at the serialization layer, not the display layer.

**Pattern: Deliberate Algorithm Distinction**
- Use distinct `alg` values for different encryption systems (`"AES-GCM-256"` for client, `"SG-META"` for server).
- *Rationale:* Prevents confusion between encryption layers. Each system can identify its own envelopes.

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

---

## Express / API

**Pattern: Route Async Wrapping for Encryption**
- All vault routes become async when adding metadata encryption.
- GET: `await prepareReadAll(table, rows, cipher)` before response.
- POST/PUT: `await prepareWrite(table, body, cipher)` before INSERT/UPDATE.
- Response echoes original plaintext (req.body), NOT encrypted values (toStore).
- *Rationale:* Client always receives plaintext. Encryption is transparent to the API consumer.

---

## Project-Specific

**ShellGuard Port Allocation:**
- Development: Frontend :6464, API :6565
- Production: Single port :6464
- Tests: 64641 (auth-flow), 64642 (security), 64643 (vault-crud), 64644 (settings), 64645 (admin), 64648 (metadata-encryption)

**ShellGuard Key System:**
- `hu-` key: 67 chars (`hu-` + 64 hex). Identity + ShellCryption seed. SHA-256 hash stored server-side only.
- `lb-` key: 67 chars (`lb-` + 64 hex). Agent access. Granular permissions, expiry, rate limits.
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

---

## React & Frontend

**Anti-Pattern: Event Listener Leaks in `useEffect`**
- Passing `addEventListener` in the return cleanup function instead of `removeEventListener` leads to massive listener leaks.
- *Rationale:* This is especially fatal for global events like `mousemove` and `scroll` on high-frequency triggers (like inactivity timers). Always double-check cleanup functions.

**Pattern: Category Normalization for Pod Comparison**
- Always use `normalizePod()` before comparing item categories to tree paths. Unnormalized strings with spaces or slash differences silently fail strict equality.
- Sub-pods must be matched using `.startsWith(targetPod + "/")` so child items in nested pods are properly cascaded.
- `normalizePod` now returns `""` for empty/null input (was `"Personal"`). All downstream functions guard against empty values.
- *Rationale:* Raw categories from server responses may have formatting differences. Normalizing ensures robust matching.

**Pattern: Optimistic Local State Updates with `skipScuttle`**
- Use `setVaultItems(prev => prev.map(...))` for immediate UI responsiveness on pod delete/rename, then sync to server.
- Batch multiple server mutations with `skipScuttle=true`, then call a single `scuttleVault` at the end.
- *Rationale:* Prevents race conditions where concurrent `scuttleVault` GET re-fetches overwrite in-flight PUT requests and confirm stale server state.

**Pattern: Zero Hardcoded Default Categories**
- Never hardcode static default categories into root arrays or getter fallbacks unless explicitly designed as permanent system primitives.
- When categories are user-defined, unassigned items should cleanly map to `""` (uncategorized), and deletion of a pod must cleanly clear the category rather than reassigning to a phantom default.
- *Rationale:* Hardcoded defaults resurrect deleted items/folders on every render cycle and prevent users from maintaining an empty, customized structure.
- Having hardcoded arrays (`DEFAULT_ROOT_PODS`, `DEFAULT_SUGGESTED_PODS`) forced into `getAllUniquePods` and `getStoredPodColors` caused phantom pods to resurrect on every render cycle even after deletion.
- *Fix:* Remove all hardcoded defaults. Draw pods from `getStoredPodColors()` and actual item categories only.
- *Rationale:* Users control their own pod structure. No forced defaults.

**Pattern: Unified Tag Color Engine with Headless Safety (Phase 20)**
- `hashStringToColor` in `src/lib/podUtils.ts` generates deterministic HSL colors for **both pods and tags** from a shared engine — no separate color logic.
- Explicit user overrides stored in `localStorage` take precedence over hashed defaults.
- `typeof localStorage === 'undefined'` guards ensure client utilities remain headless-safe in Node test environments (where `localStorage` is undefined).
- *Rationale:* Node test environments crash on unguarded `localStorage` access; the same `vi.hoisted()` DATA_DIR/PORT isolation pattern applies here — guard before access, test against both modes.

**Pattern: Attachment Ceiling Escalation with Env-Driven Limits (Phase 20)**
- Storage limits are env-tunable and fail-closed: `ATTACHMENT_MAX_MB` (50→500MB default) and `GROTTO_QUOTA_MB` (500→1000MB default), both returning 413 on breach.
- Busboy mid-stream abort prevents partial writes at the ceiling — the request is torn down before bytes hit disk.
- *Rationale:* Ceiling escalation is not just a config change — it requires updating nginx body hints (60M), docs/ README API tables, and the blueprint-schema header in lockstep (docs bow to code).

---

## API, Express & Partial-Failure Patterns

**Pattern: Literal routes must register ABOVE parameterized siblings (Phase 21)**
- Express matches in registration order. `router.delete('/bulk')` placed *after* `router.delete('/:id')` is unreachable — the param route captures `id="bulk"` and 404s.
- Symptom is silent: the handler compiles, the route exists in the file, and only a live request reveals the shadow.
- Rule: register every literal-path route (`/bulk`, `/bulk-import`, `/export`, …) above the `/:id` family in the same router, and assert it with an integration test that actually calls the literal path.
- *Rationale:* shipped as a P0 in Phase 21 — the entire bulk-delete feature was dead on arrival despite passing code review.

**Pattern: Partial-failure APIs need per-record validation, not a middleware schema gate (Phase 21)**
- Middleware-level `validateBody(schema)` rejects the whole payload with 400 on the first bad field — structurally incompatible with 207 Multi-Status.
- Correct shape: middleware validates only *container bounds* (`items: 1..1000`); each record goes through `itemSchema.safeParse()` inside the handler, aggregating failures into `errors: [{index, reason}]` while valid records persist in one transaction.
- Malformed-example arithmetic is the cheapest oracle: "100 items / 2 malformed → 207 + 98 persisted" catches both over-rejection and silent drops in a single assertion.
- *Rationale:* review asked for "per-record validation"; the naive implementation would have been a fully-typed array schema that 400s on one bad record and never returns 207.

**Pattern: 207 envelope must keep errors INSIDE `data` (Phase 21)**
- `restAdapter` unwraps `{success, data}` → `data` and treats every 2xx (including 207) as success. Errors returned at the top level (`{success:false, errors}`) are silently discarded by the client.
- Contract: `res.status(207).json({ success: true, data: { inserted: string[], errors: [...] } })`.
- `inserted` is an **array of IDs**, not a count — an agent built against a "count" contract breaks on every `await`.
- *Rationale:* the SKILL.md shipped documenting `200`/count/`{index,id,title,reason}`; only a line-by-line doc-vs-code check caught it.

**Pattern: Scoped body parser ahead of the global ceiling (Phase 21)**
- `app.use('/api/vault/bulk-import', express.json({ limit: '10mb' }))` mounted BEFORE `express.json({ limit: '1mb' })` — the first parser consumes the stream and the global one no-ops.
- Gives one high-volume route headroom without weakening the global ceiling or resurrecting a wide-open parser.
- *Rationale:* Phase 19 retired the 32mb scoped parser; Phase 21 reintroduced the pattern deliberately and narrowly (one path, documented reason).

---

## Cross-Agent Review & Crypto Boundaries

**Pattern: Review the artifact, not the report (Phase 21)**
- Treat another author's summary as a set of *claims to verify*, never as facts. Every finding that mattered in the Phase 21 review came from reading code; one walkthrough claim ("zero `.clinerules/` files staged or touched") was flatly false and a single grep proved it.
- Attach `file:line` evidence and the exact reproduction command to every finding. A review that says "trust me" cannot be audited; one that says "here is how to check me" can.
- Verify the *fix*, not the intention: `git show HEAD:<path>`. Five blockers were once all correct on disk and all absent from the commit.
- *Rationale:* a peer review is worth exactly what its evidence is worth. And the reviewer is fallible too — record your own near-misses (I read `password_history` as plaintext and was wrong) so the reader can calibrate the rest.

**Pattern: Dual-path crypto needs a parity test (Phase 21)**
- When one primitive has two implementations selected by environment (native `crypto.subtle` vs a pure-TS fallback), they are a **portability contract**: bytes sealed under one must open under the other.
- The fallback branch usually executes in **no suite** — tests run in Node, where `subtle` exists. A divergence therefore ships with every gate green and fails only for the user on the origin CI cannot reach.
- Assert both: a known-answer vector (RFC, or a trusted local oracle) **and** native-vs-fallback byte equality.
- *Rationale:* a backup sealed over HTTPS that refuses to open on a plain-HTTP LAN origin fails at the worst possible moment — during recovery from loss.

**Pattern: Test fixtures must be synthetic, committed, and path-relative (Phase 21)**
- Fixtures live in a committed `tests/fixtures/`, hold obviously-fake data, and resolve via `__dirname` — never `process.cwd()`.
- Two real-shaped Bitwarden exports once sat un-gitignored in the repo root with the suite reading them from `process.cwd()`: the oracle was unreproducible from a clean clone, and one `git add .` (`finish-task.md`'s own instruction) from publishing credential-shaped files.
- *Rationale:* a suite that passes only because of untracked local files is not a suite — it is a local ritual.

**Pattern: Prefer the documented no-op down-migration (Phase 21)**
- Rolling back a column-add is not worth user data. `0007.down.sql` began as `ALTER TABLE … DROP COLUMN` — silently destroying password history and secondary URIs — and was corrected to `SELECT 1;`, matching the 0002/0003 precedent.
- *Rationale:* a down-migration executes precisely when something has already gone wrong. It must never become the second failure.

---

## Release Protocol

**Pattern: Review the committed diff (HEAD), not the working tree (Phase 21)**
- A PR review that reads the working tree can pass on code that was never committed. In Phase 21 the fixes sat uncommitted while `HEAD` still held the broken commit — merging then would have shipped the P0.
- Before declaring a PR reviewable: `git status --porcelain` (is it clean?), `git log --oneline origin/main..HEAD` (what is actually in the PR?), and grep the fix by name inside `git show HEAD:<file>`.
- *Rationale:* the gap between "the file on disk is fixed" and "the commit is fixed" is invisible to every static code read.

**Pattern: Verify Pushes and Tag Position (v0.0.1.9, 2026-09-13)**
- Read the previous tag's target commit before writing the release ledger — tags can point at merge commits, making the honest ledger longer than the visible story.
- After `git push`, verify with `git ls-remote origin <ref>` — shell capture can report "Everything up-to-date" for a push that did not land.
- Tag the release-prep commit itself so the tag points at a commit that CONTAINS the exact-version RELEASE file (release.yml hard-fails otherwise); the --no-ff merge to main comes after.
- Environment-blocked verifications (e.g., Docker daemon unavailable) are recorded as blocked with justification — never claimed as run.
- *Rationale:* the v0.0.1.9 release published correctly on the first try after these three checks; the catch-and-repush avoided a silent divergence between local main and origin.

**Pattern: Release Build-Label Sweep (v0.0.1.10 → v0.0.2.2)**
- Consuming Build N shifts every queued phase's provisional `(Build N+x)` label by +1 in BOTH `ROADMAP.md` and `project/meta-prompt-ai-studio.md` — INCLUDING anchor hrefs that embed build numbers, which would silently dangle otherwise.
- Sweep with version-prefixed regex patterns (disambiguation), assert each replacement count, then re-run the anchor battery afterwards.
- *Rationale:* Build-number drift in anchor hrefs is invisible in diffs but breaks every TOC link; assert-counted sweeps + anchor re-battery are the only reliable catch.
