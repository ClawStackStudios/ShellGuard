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
