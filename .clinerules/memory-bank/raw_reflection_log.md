---
Date: 2026-09-03
TaskRef: "Prepare ShellGuard Release v0.0.1.7 & Session Learnings Consolidation"

Learnings:
- Running `git add <file> && git commit` commits the entire staged index, not just the recently added file. A pre-commit check using `git diff --cached --stat` prevents accidentally sweeping in co-author or in-flight staged changes.
- Large boundary code insertions without bounded anchors can clip multi-line interface/JSX tails. Always replace bounded `old_text` anchors, re-read ±15 lines around the insertion point, and run compiler/linter transform checks before committing.
- When committing work that incorporates in-flight user edits, running the project's test and build gates on the merged working tree ensures the collective changes ship 100% green without regressions.
- The Verification Loop layer 3 (`tsc --noEmit` and production build) caught 2 compiler errors that passed unit tests, proving that a passing test oracle does not guarantee compiled correctness.

Difficulties:
- Non-standard Node path in `/config/Applications/node-v22.23.0-linux-x64/bin` required explicit PATH export.
- Multiple debug cycles were incurred from editor insertion clipping before standardizing bounded anchor replacements.

Successes:
- Successfully released v0.0.1.7 with automated Claurst-style `--release` workflow on GitHub Actions.
- Synchronized rules and skills across both `.clinerules/` and `.agents/` roots.
- All 13 test suites / 202 tests passed, with 0 errors on production Vite build.

Improvements_Identified_For_Consolidation:
- Staged-vs-untracked pre-commit check in `git-hygiene.md`.
- In-flight edit verification in `git-hygiene.md`.
- Large editor inserts skill in `.clinerules/skills/` and `.agents/skills/`.

---
Date: 2026-08-28
TaskRef: "Multi-User Frontend Architecture (Bitwarden-style lock, QuickLoginModal, Memory Leaks)"

Learnings:
- The Bitwarden shared-device multi-account pattern keeps all known accounts visible in a dropdown, marking them as Locked or Unlocked, rather than strictly isolating them. The security boundary relies entirely on the Master Password (or ShellKey) requirement to decrypt the vault, rather than hiding the existence of other accounts.
- We implemented a seamless UI pattern for re-authentication by rendering an overlay `QuickLoginModal` directly on top of the locked dashboard, rather than forcefully routing the user to a full-screen landing view. This prevents navigation context loss.
- React `useEffect` event listener cleanup bug: passing `addEventListener` in the return cleanup function instead of `removeEventListener` leads to massive listener leaks, especially for global events like `mousemove` and `scroll` on high-frequency triggers (like inactivity timers).

Difficulties:
- Initial approach tried to implement strict per-session account isolation using a "Primary Account" model and grouping in `localStorage`. This broke the convenience of the account switcher and conflicted with Bitwarden's established UX expectations. Resolved by abandoning strict isolation in favor of explicit lock/unlock states in the UI.
- The React router in `App.tsx` kicked users back to the blank `LandingView` upon logout, making the account switcher invisible. Fixed by maintaining the dashboard `view` but passing an `isLocked` prop to render a secure lock screen inside the vault view instead.

Successes:
- The implementation of individual background-account locking from the dropdown switcher. Because ShellGuard supports multiple unlocked sessions simultaneously in `sessionStorage` (unlike Bitwarden), allowing users to lock inactive accounts granularly is a major privacy win.
- Initial load routing now correctly defaults to the locked dashboard of the first known account if the user has expired sessions but known accounts.

Improvements_Identified_For_Consolidation:
- UX Pattern: "Locked Dashboard" vs "Logged Out Landing". When known accounts exist, default to a locked dashboard overlaying the app to maintain context.
- UX Pattern: Multi-account session management. Supporting multiple simultaneous unlocked sessions allows for powerful micro-interactions like granular background-account locking.
- React Anti-Pattern: Event listener leaks in `useEffect` cleanup. Always double-check `removeEventListener`.

---
Date: 2026-08-28
TaskRef: "SuperLobster Panel (admin plane) + failsafe backups"

Learnings:
- Express mount order gotcha: `app.use('/api/admin', router)` AFTER a later `app.use('/api/admin/auth', limiter)` means the limiter never fires (router matches first, never calls next). Fix: apply the limiter inside the route file, same as auth.ts does.
- `better-sqlite3-multiple-ciphers` exposes `db.backup(dest)` — Online Backup API, WAL-safe, live-consistent. A copy of a SQLCipher DB stays encrypted with the same key (zero extra key management).
- Vaultwarden's admin panel exists because container operators lack shell access; its backup button is an escape hatch. ShellGuard's DB contains PLAINTEXT api_tokens + agent_keys (unlike Vaultwarden's E2E ciphers), so HTTP-mediated backup download = credential exfiltration channel. Backups are server-side writes only; restore is offline (Vaultwarden itself never shipped in-panel restore).
- `lobsters` table PK column is `uuid` (no owner_uuid); all other vault tables use `owner_uuid`.
- `createTestUserWithToken(app)` requires the supertest app argument.

Difficulties:
- Test debugging: rotation test initially used 2026 timestamps that lost to the real backup's 2026-08 timestamp → used future 2027 stamps. Also `lobsters` UUID column mismatch.
- Editor 6k-char limit: wrote admin.test.ts and panel sections in marker-based chunks.

Successes:
- Three-layer verification: 155 tests pass (15 new admin), vite build clean, live smoke (login/401s/users/backup-on-disk/status/audit/whitelist/scuttle:restore validate).
- ADMIN.md canonical threat model doc created.

Improvements_Identified_For_Consolidation:
- Pattern: admin-plane isolation = separate auth mechanism (cookie session, volatile store) + strict-metadata responses + env-owned crypto config.
- Argon2id ADMIN_TOKEN hashing = documented upgrade path (currently SHA-256+constant-time like ClawChives).

---
Date: 2026-08-28
TaskRef: "Password attachments rework (reference model + 10MB cap)"

Learnings:
- vault_pearls.attachments is now a JSON array of vault_secure_attachments IDs; file payloads are ShellCrypted client-side under AAD `vault_secure_attachments:{attachmentId}` and POSTed individually before the pearl is created.
- 10MB raw ≈ 13.3MB base64 + envelope → zod cap set to 14,000,000 chars (was 28,000,000). Live-verified: 400 with validation details.
- Cascade delete in vault.ts DELETE handler parses the JSON defensively (malformed column = no-op) and deletes with owner scope; audit logs each cascaded attachment.
- `createTestUserWithToken(app)` requires the supertest app argument — calling it bare crashes with a confusing "Cannot read properties of undefined (reading 'address')".

Difficulties:
- Editor tool 6000-char limit forced splitting the edit-form UI into two calls with a marker comment — worked cleanly.
- Live smoke server startup takes >4s before health responds; initial curl failed with exit 7 but the log confirmed boot.

Successes:
- Three-layer verification: 140 tests pass (incl. 3 new cascade tests), vite build succeeds, live E2E smoke (register → upload ×2 → link → pearl DELETE → attachments list empty → oversize 400).
- Cross-owner cascade isolation test proves the ownership scoping.

Improvements_Identified_For_Consolidation:
- General pattern: parent-child reference model with ownership-scoped cascade delete (parent stores JSON ID array; child DELETE always `AND owner_uuid = ?`).
- Project: attachment helpers in `src/lib/attachmentUtils.ts`; zod cap 14M chars = 10MB file.

# Raw Reflection Log

---
Date: 2026-08-29
TaskRef: "SuperLobster UI alignment (routing gate fix + CaraBase polish)"

Learnings:
- The v0.3.0 SuperLobster session shipped `SuperLobsterGate` (auth check → login/panel) but App.tsx rendered `SuperLobsterPanel` directly, bypassing the gate — the panel mounted without auth state, appearing blank/bugged at `#/super-lobster` when unauthenticated.
- CaraBase's BouncyBrand uses a hand-rolled rAF spring class (stiffness=400, damping=10, mass=1) with per-letter mouseenter/leave; transforms applied directly to `elRef.current.style` to avoid React re-render per frame. Variants: subtle (y:-3, scale:1.05, damping:30), prominent (y:-12, scale:1.15, damping:12).
- ShellGuard theming: brand split is Shell=lobster-red `#e4048a`, Guard=claw-cyan `#06b6d4`; theme tokens are bg-theme-base/surface, text-theme-main/muted, border-theme-subtle.

Difficulties:
- tsc --noEmit shows 6 pre-existing errors on main (LoginView.tsx pasteUuid/pasteUsername undefined, SetupView.tsx X undefined) — confirmed via git stash baseline. Memory bank only documented the fieldEncryption one. Verified with `git stash && tsc && git stash pop` — my changes add zero new errors; vite build remains the gate and passes.
- First curl after vite boot failed (exit 7) at 6s despite "ready in 2295ms" in log — retry after 5s succeeded. Consistent with previous session's note that live smoke needs patience.

Successes:
- Three-layer verification: 155 tests pass, vite build clean (52.8s), live smoke (HTTP 200 index + module transforms for BouncyBrand.tsx and SuperLobsterLogin.tsx resolve with BouncyBrand import present).

Improvements_Identified_For_Consolidation:
- Pattern: when wiring a new gated view, check the render site against the gate component — shipping both but forgetting to connect them is a silent auth bypass.
- Verification pattern: git-stash baseline tsc diff to prove new errors vs pre-existing.
- Remaining Phase 3 (deferred): apply CaraBase card-grid/dashboard patterns across SuperLobsterPanel sub-sections (Status/Users/Settings/Backups/Audit).

---
Date: 2026-08-29
TaskRef: "SuperLobster CaraBase Design Alignment Phase 3 (Sub-sections Polish)"

Learnings:
- CaraBase dashboard alignment across admin sub-sections brings high visual cohesion:
  - Container (`SuperLobsterPanel.tsx`): BouncyBrand header integration, live status indicators ("Reef Online"), and pill-style navigation tabs with Framer Motion section transitions.
  - Status (`SuperLobsterStatus.tsx`): 3-card hero metric grid (Instance Engine, Triple-Layer Armor, Retention), ambient defense-in-depth warning callout, and live uptime timeline.
  - Users (`SuperLobsterUsers.tsx`): 6-metric summary ribbon (Lobsters, Pearls, Notes, Keys, Files, Agent Keys), search toolbar with instant match counts, avatar badge glass table, and strict cascade delete modal.
  - Settings (`SuperLobsterSettings.tsx`): Env-locked crypto keys notice, grouped configuration cards with preset quick-chips, and animated save toast.
  - Backups (`SuperLobsterBackups.tsx`): Hero backup switch card, offline recovery CLI protocol card (`scuttle:restore`), and backup manifest ledger.
  - Audit (`SuperLobsterAudit.tsx`): Filter chips (All, Admin, Auth, Mutations, Failures), color-coded event badges, and sovereign `SUPERLOBSTER` actor pill.

Difficulties:
- Maintaining strict visual alignment across 6 distinct sub-sections while strictly preserving the zero-knowledge security boundary, strict-metadata invariants, and offline restore guarantees.

Successes:
- Three-layer verification passed completely: 15/15 admin tests passed, all 155 full suite tests passed, and Vite production bundle built cleanly in 53.25s.

Improvements_Identified_For_Consolidation:
- UX Pattern: Metric ribbon + Filter chips on data-dense tables (e.g. Users and Audit Reef) significantly elevates scannability without cluttering layout.
- UX Pattern: Preset quick-chips on number inputs (e.g. retention days, backup intervals) reduce cognitive load for administrators.

> Detailed, timestamped, task-referenced entries. Candidates for consolidation into `consolidated_learnings.md`. Prune after consolidation.
---
Date: 2026-08-29
TaskRef: "Fix PodModal build error and enforce verification"

Learnings:
- Discovered that `npm` is located in `/config/Applications/node-v22.23.0-linux-x64/bin` and MUST be added to `PATH` explicitly when running build tasks from my environment.
- The `npm run build` command is essential to ensure syntax and build integrity before presenting work to the user.

Difficulties:
- Initial "command not found" error for `npm` led to an incorrect assumption that the environment didn't support building, resulting in a failure to verify the code and a broken build.

Improvements_Identified_For_Consolidation:
- General pattern: ALWAYS find the correct `node`/`npm` executable and run `npm run build` to verify every change. Never assume the environment prevents verification.
- Project Alpha: Include `/config/Applications/node-v22.23.0-linux-x64/bin` in PATH when executing commands.
---
---
Date: 2026-08-29
TaskRef: "Project scan & memory bank update after 3-agent awareness"

Learnings:
- The project is on branch `fix/sidebar-and-pod-management` with 3 commits ahead of `main`:
  1. `6e33694` — Pod management UI, sidebar polish, removed suggested pods from getAllUniquePods
  2. `930375c` — Category normalization via normalizePod, optimistic state updates, skipScuttle pattern, restAdapter generics + PATCH
  3. `2dfa76c` — Zero hardcoded default pods, normalizePod returns "" when empty, FolderInputGroup dynamic adaptation
- Git checkpoint branches exist (`aa62d69`, `3a95c56`) created by previous agent sessions.
- The `.agents/memory-bank/` directory contains the most up-to-date project knowledge from Gemini's perspective.
- My `.clinerules/memory-bank/` was stale from 2026-08-29 07:23 and did not reflect Gemini's pod management work.
- There are now 3 agents working on this project — each with their own memory bank.
- `buildPodTree` in `podUtils.ts` and all downstream components now handle uncategorized items with empty string instead of "Personal" fallback.
- `getStoredPodColors()` returns `{}` instead of merging `INITIAL_DEFAULT_COLORS`.
- All vault item decryption in `scuttleVault` changed `p.category || "Personal"` to `p.category || ""`.
- The `npm` executable is at `/config/Applications/node-v22.23.0-linux-x64/bin` — not in default PATH.

Difficulties:
- Initial git commands had shell integration issues; had to redirect output to files and read them separately.
- Had to piece together work from 3 separate commits plus Gemini's memory bank to get the full picture.

Successes:
- Successfully reconstructed all changes from 3 commits by reading full diffs.
- Captured all new patterns (category normalization, optimistic updates, skipScuttle, zero defaults) into consolidated_learnings.
- Updated all memory bank files (activeContext, changelog, progress, consolidated_learnings) to reflect current state.

Improvements_Identified_For_Consolidation:
- Pattern: Category normalization required for ALL pod comparisons.
- Pattern: Optimistic state updates with skipScuttle for batch operations.
- Anti-Pattern: Hardcoded defaults causing phantom pod tree entries.
- Project: npm path must be explicitly added to PATH.
---
Date: 2026-08-29
---
Date: 2026-08-30
TaskRef: "Version bump to 0.0.1.6 (native LAN TLS release)"

Learnings:
- Explicit user version input overrides changelog inference (highest priority per semantic-versioning rule).
- 4th-digit increments (0.0.1.5 → 0.0.1.6) are hotfix/iteration class — RELEASE-vX.Y.Z.md doc is NOT required per version-update workflow (that's for full major/minor); release.yml falls back to auto-generated notes when no RELEASE file exists.
- Version anchors live in exactly 2 files besides CHANGELOG: package.json `"version"` and README.md badge line 22.
- Note: v0.0.1.5 tag confirmed to exist (visible via `git tag`); the earlier session's changelog/package.json bump for 0.0.1.5 was tagged upstream. v0.0.1.6 now continues the sequence.

Improvements_Identified_For_Consolidation:
- Pattern: version-anchor sweep = package.json + README badge + CHANGELOG section header. Nothing else carries the version.
---

TaskRef: "Native LAN TLS — self-signed cert generation (TLS_ENABLED)"

Learnings:
- Node cannot generate X.509 certs natively; `selfsigned` v5 (pure JS, @peculiar/x509 under the hood) ships its own TypeScript types and is async-only in v5. `days` option was replaced by `notAfterDate: Date` in v5.
- EC P-256 (`keyType: 'ec'`) generates dramatically faster than RSA-2048 in pure JS — use it for boot-time frictionless generation.
- `crypto.X509Certificate.validTo/validFrom` are UTC **strings** (YYMMDDHHMMSSZ), not Dates — wrap in `new Date()` before arithmetic.
- selfsigned's `GenerateResult.fingerprint` is SHA-1 (20 bytes); Node's `x509.fingerprint256` is SHA-256 (32 bytes). Never mix them — derive the fingerprint consistently from the PEM on every code path so generated and loaded certs report identically.
- Test isolation gotcha: when a suite's module-under-test transitively imports the DB singleton, afterAll MUST `db.close()` + `auditDb.close()` before `rmSync` — an open SQLite handle recreates WAL/shm files mid-delete and cleanup throws ENOTEMPTY.
- SANs from `os.networkInterfaces()` (non-internal, deduplicated) auto-cover the LAN IP — test run picked up 192.168.1.40 without any config.
- Helmet HSTS: passing `undefined` falls through to helmet's default (enabled); `false` disables. Enable when TLS terminates in-process OR ENFORCE_HTTPS=true behind a proxy.

Difficulties:
- Terminal shell integration degraded mid-session (commands stopped reporting completion even for `echo`), blocking the live TLS smoke test and the git commit. Test suite + build verification had already completed successfully beforehand.

Successes:
- 8/8 new TLS tests pass, including a real HTTPS handshake over a real socket with the generated materials.
- Full suite: 12 files, 180 passed, 0 failed — including the previously-flaky webCryptoFallback suite.
- Production build clean.

Improvements_Identified_For_Consolidation:
- Pattern: TLS lifecycle (generate → persist 0o600 → reuse → BYO override) mirrors the DB connection's encrypt-existing-database pattern.
- pending: live smoke of `TLS_ENABLED=true` server boot + curl -k health probe + commit on feat/lan-tls-self-signed.
---

Learnings:
- `window.crypto.randomUUID` is undefined on HTTP origins — built a multi-tier fallback chain: `crypto.randomUUID` → `crypto.getRandomValues` UUID v4 → `Math.random` UUID v4 (last resort).
- Same for secure entropy: `crypto.getRandomValues` may be undefined on HTTP — fallback to `Math.random` based rejection sampling.
- Chromium blocks `data:` URI downloads on insecure connections — replaced with `Blob` + `URL.createObjectURL`.

---
Date: 2026-08-29
TaskRef: "v0.0.1.3 release — Iconography, docs hygiene"

Learnings:
- Official shellguard-icon.svg now lives at `public/favicon.svg` — the root favicon for the project.
- Unraid Community Applications template uses an Icon URL field pointing to the raw GitHub icon asset.
- Legacy migration warnings and breaking-change docs accumulate quickly — docs hygiene needs to be part of the release checklist.

---
Date: 2026-08-29
TaskRef: "v0.0.1.4 release — WebCrypto fallback engine, drag-drop shield, TOTP Blob downloads"

Learnings:
- `window.crypto.subtle` is undefined on plain HTTP browser origins (LAN IPs like Unraid) — browsers restrict WebCrypto API to secure contexts (HTTPS/localhost).
- Built pure TypeScript fallback implementations of SHA-256, HMAC-SHA256, HKDF, and AES-GCM-256 in `src/lib/webCryptoFallback.ts`. No dependencies — uses BigInt for bit ops, TextEncoder for encoding.
- The `crypto.subtle` API returns ArrayBuffers; the fallback returns Uint8Arrays. The ShellCryption layer and crypto.ts callers needed to handle this transparently — wrapping the fallback to match the async interface of the real `crypto.subtle`.
- `data:` URI downloads are blocked on Chromium insecure connections — must use `Blob` + `URL.createObjectURL(blob)` instead.
- Global drag-and-drop shield must be attached with `{capture: true}` to ensure it fires before child handlers.

Difficulties:
- The `crypto.subtle` stubbing approach in vitest for testing the fallback path is tricky — `window.crypto` is read-only in some environments, and vitest's jsdom may not properly simulate HTTP origins.

Successes:
- All three v0.0.1.x releases shipped clean on git tags.

---
Date: 2026-08-29
TaskRef: "Bitwarden-Style Custom Fields (Text, Hidden, Checkbox, Linked)"

Learnings:
- Custom fields follow the existing ShellCryption pattern: serialize to JSON on the client, encrypt via `encryptField()`, store as opaque blob in DB column, decrypt via `decryptField()` on read.
- AAD namespaces must be distinct per item type: `vault_pearls_custom`, `vault_secure_notes_custom`, `vault_ssh_keys_custom` — prevents envelope shuffling between tables.
- Migration 0003 uses `ALTER TABLE ADD COLUMN custom_fields TEXT DEFAULT ''` for 3 tables. SQLite doesn't support DROP COLUMN in a practical way, so the down migration is a no-op (same pattern as 0002).
- Custom fields are NOT registered in `metadataGuard.ts` — the whole blob is already client-encrypted via ShellCryption. Registering it would cause double-encryption with `DB_ENCRYPTION_KEY`.
- `CustomFieldLinkedProperty` resolves to item properties via a switch statement: `username`, `password` (item.secret), `url`, `notes`, `totp`. TOTP-linked fields use the `TotpDisplay` component for live 6-digit codes.
- Checkbox values use `"true"` / `"false"` strings — simple, JSON-serializable.
- The `CustomField.value` field is always a string. Booleans serialize as `"true"`/`"false"`.
- ItemFormModal: custom fields are parsed from `initialItem.custom_fields` (decrypted JSON string → `CustomField[]`), edited as state, serialized back to JSON on save.
- ItemDetailPane: custom fields are parsed and rendered per type, with copy buttons for text/hidden/linked, and an individual eye-toggle for hidden fields.
- `revealedHiddenFields: Set<string>` tracks per-field visibility for hidden custom fields.
- Import/Export: JSON export (`items: items`) automatically includes custom_fields since they're on VaultItem. CSV excludes them (metadata-only). Import through `lockTheClaw` encrypts them transparently.
- Pod rename/delete operations pass `custom_fields: item.custom_fields` through `updateTheClaw` to avoid data loss during category reassignment.

Difficulties:
- The lockTheClaw and updateTheClaw handlers had to be updated in 3 code paths (notes, keys, pearls) for both create and update — missing any one would silently drop custom_fields on that item type.
- handleRenamePod and handleDeletePod also needed custom_fields passed through — they reconstruct items from vaultItems state and call updateTheClaw.

Successes:
- All 167 existing tests still pass (no regressions).
- Build compiles cleanly (2173 modules).
- Implementation handles all 4 field types across all 3 vault item types.
- Custom fields round-trip correctly through the full ShellCryption lifecycle.

Improvements_Identified_For_Consolidation:
- Pattern: Adding optional string fields to vault items follows a consistent pattern: types → Zod schemas → migration → routes → client encrypt/decrypt → UI.
- Pattern: AAD namespace uniqueness per-table-per-field prevents envelope shuffling.
---
Improvements_Identified_For_Consolidation:
- Pattern: Pure TypeScript crypto fallback for HTTP origins
- Pattern: Blob download over data: URI for insecure contexts
- Pattern: Multi-tier UUID fallback chain
---
---

---
Date: 2026-09-03
TaskRef: "Release v0.0.1.7 — sgtotp.bak compatibility layer + landing header fix"

Learnings:
- Release protocol ran end-to-end cleanly: lint (tsc --noEmit, pre-existing fieldEncryption.ts error now resolved), 13/13 suites (202 passed / 1 skipped), vite build ✓
- release.yml hard-gate worked as designed: tag v0.0.1.7 pushed → Release Pipeline ✓ → doc mirrored verbatim to GitHub release body
- Docker publish workflow triggers on the same tag push (separate from Release Pipeline)

Successes:
- Working tree was already release-synced (Lucas rolled RELEASE doc + versions pre-merge); protocol reduced to verify → tag → push → confirm mirror

Improvements_Identified_For_Consolidation:
- Pre-release: confirm "exactly one RELEASE-vX.md" + version triple (package.json/README badge/CHANGELOG) before tagging — caught here in one pass
