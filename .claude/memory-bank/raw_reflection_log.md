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
Date: 2026-08-29
TaskRef: "Pod deletion state sync & category normalization fix"

Learnings:
- Category string comparisons between tree paths and items must always use `normalizePod()` because unnormalized strings with spaces or slash differences silently fail strict equality.
- Sub-pods must be matched using `.startsWith(targetPod + "/")` so child items in nested pods are properly cascaded to "Personal".
- Optimistic local state updates (`setVaultItems(prev => prev.map(...))`) are vital for instant UI responsiveness and to prevent race conditions with server GET re-fetches.
- Batch mutations must use `skipScuttle=true` during the iteration loop and perform a single `scuttleVault` call at the end to prevent redundant, concurrent GET requests from overwriting in-flight PUT requests.

---
Date: 2026-08-29
TaskRef: "Zero Hardcoded Default Pods (100% User-Created Pods)"

Learnings:
- Hardcoded default arrays (`DEFAULT_ROOT_PODS = ["Personal", "Work"]`, `DEFAULT_SUGGESTED_PODS`, and `INITIAL_DEFAULT_COLORS`) caused phantom pods to resurrect on every render cycle even after deletion, because `getAllUniquePods` and `getStoredPodColors` forcefully injected them into the active `podSet`.
- Removing all hardcoded defaults from `podUtils.ts` and updating `normalizePod` to return `""` when empty cleanly allows the application to operate with zero pods initially, showing only pods explicitly created by the user or associated with vault items.
- Uncategorized items cleanly have `category: ""` or `undefined` rather than a fallback to `"Personal"`. When a pod is deleted, items inside it become uncategorized.
- `FolderInputGroup.tsx` seamlessly switches to custom input mode when `availablePods` is empty, and shows existing user pods in the select dropdown / quick chips when they exist.

---
Date: 2026-08-29
TaskRef: "Vault Lock Hardening & Unified NavIntent State Routing"

Learnings:
- Hardening against client-side state mutation while locked: Even if individual HTTP handlers check `if (!shellKey)`, client-side components (like `SidebarFolderTree`, `PodModal`, search dropdowns) must receive `isLocked` and guard against triggering local storage color mutations, optimistic state updates, or opening action modals.
- Reload navigation intent fidelity: Tracking explicit user intent (`sg_nav_intent: "landing" | "dashboard"`) solves the page refresh ambiguity between Landing and Dashboard. When logging out ("Claw Out"), `sg_nav_intent` is set to `"landing"`, so subsequent reloads stay on the marketing landing view even if user profiles exist in `localStorage`. When logging in or locking, `sg_nav_intent` is set to `"dashboard"`, so reloading preserves the locked dashboard and opens `QuickLoginModal` for seamless re-authentication.

Difficulties:
- Identifying all implicit triggers for pod creation, editing, and deletion in the sidebar and ensuring zero UI mutation elements are rendered when `isLocked === true`.

Successes:
- Full 3-layer verification loop succeeded: `tsc --noEmit` (0 errors), 9 test suites / 162 unit & integration tests passing (100%), and Vite production build clean (52.75s).
---
