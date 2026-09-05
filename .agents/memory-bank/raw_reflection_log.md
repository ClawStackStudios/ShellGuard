---
Date: 2026-09-04
TaskRef: "Prepare ShellGuard Release v0.0.1.8 (Privacy Policy, Mobile Companion Portal, Bridge Parity)"

Learnings:
- Synchronized release version across all touchpoints: `package.json`, `README.md` badge, `CHANGELOG.md`, `docs/deployment/index.md`, `docs/getting-started/quickstart.md`, and generated `RELEASE-v0.0.1.8.md`.
- Rolling release documentation model cleanly preserves one current `RELEASE-vX.Y.Z.N.md` in the root repository for GitHub Actions release automation.
- Realigning the 3-step onboarding workflow to Configure & Generate Keys &rarr; Start Container &rarr; Launch Vault & Molt Identity provides an actionable, linear path for end-users across all documentation entry points.

Difficulties:
- None; the verification gates and memory bank updates followed standard protocol.

Successes:
- Prepared `RELEASE-v0.0.1.8.md` adhering to ClawStack Studios release template.
- 100% green test oracle (202 passed across 13 suites) and clean documentation build.

Improvements_Identified_For_Consolidation:
- Formalize linear 3-phase onboarding pattern in `productContext.md`.
---

---
Date: 2026-09-04
TaskRef: "Bridge Parity Audit: Complete Missing Docs Pages and Database Schema Ground Truth"

Learnings:
- Two-sided bridge mapping revealed that top-level navbar items (`/vault-features/`, `/deployment/`, `/reference/`) lacked corresponding `index.md` files, resulting in 404s when navigating through the main bar. Creating designated index hubs with `<CardGrid>` navigation restores structural integrity.
- `blueprint-schema.md` had drifted from runtime reality: documented `users` instead of `lobsters`, `lobster_keys` instead of `agent_keys`, missed `custom_fields` column, and had incorrect primary key types (`uuid` vs `id`). Verifying directly against `migrations/` and `schema.ts` restored ground-truth parity.
- `docs/deployment/reverse-proxy.md` and `unraid.md` needed documentation for Native LAN TLS (`TLS_ENABLED=true` self-signed EC P-256 cert generation) and pure TypeScript `webCryptoFallback.ts` for non-secure HTTP LAN contexts.
- Documenting `sgtotp.bak` (`shellguard-totp-backup-v1`) client-side decryption and AAD verification in `vault-features/import-export.md` connects web vault capabilities to mobile companion documentation.

Difficulties:
- Syntax highlighting tag in VitePress: using unrecognized language tags like `caddy` triggers fallback warnings. Using `nginx` or `txt` maintains clean zero-warning builds.

Successes:
- Created 3 new index hubs: `docs/vault-features/index.md`, `docs/deployment/index.md`, `docs/reference/index.md`.
- Updated `blueprint-schema.md`, `the-grotto.md`, `import-export.md`, `docker.md`, `reverse-proxy.md`, `unraid.md`, `design-system.md`, `glossary.md`, and `quickstart.md`.
- Passed 100% clean 4-layer verification loop: docs:build 0 warnings, lint clean, vite build clean, 202/202 tests.

Improvements_Identified_For_Consolidation:
- Add Ground Truth SQLite schema and Table mapping to `systemPatterns.md`.
---

---
Date: 2026-09-04
TaskRef: "Create comprehensive documentation suite for ShellGuard-TOTP Native Android Companion"

Learnings:
- VitePress `CardGrid` with `cols-3` automatically scales gracefully using CSS grid `repeat(auto-fit, minmax(240px, 1fr))`, allowing seamless inclusion of additional cards (such as the Mobile Companion card) without visual distortion.
- Real-time CameraX analysis pipeline requires zero disk caching and strict in-memory buffer closure (`imageProxy.close()`) to avoid frame buffer exhaustion in Android.
- Android 13+ Photo Picker API (`ActivityResultContracts.PickVisualMedia()`) provides a privacy-preserving mechanism for scanning QR codes from the photo gallery without requesting legacy broad storage permissions (`READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES`).
- Documenting companion architectures alongside main web vault documentation in canonical VitePress creates cohesive documentation for both end-users and app store review processes.

Difficulties:
- None; the documentation topology cleanly extends VitePress's existing markdown components (`<CardGrid>`, `<Card>`, `<CopyPage />`).

Successes:
- Built 4 in-depth companion documentation guides: Overview/Topology, Security/Enclaves, Backups/Sync, and RFC 6238 TOTP Engine.
- Updated `docs/.vitepress/config.ts`, `docs/index.md`, and `CHANGELOG.md`.
- All verification layers (VitePress build, TypeScript linting, Vite client build, 13 test suites / 202 unit tests) passed 100% clean.

Improvements_Identified_For_Consolidation:
- Document VitePress component library patterns (`<CardGrid>`, `<Card>`, `<Steps>`) in `techContext.md`.
---

---
Date: 2026-09-04
TaskRef: "Create official Privacy Policy for ShellGuard & ShellGuard-TOTP Companion"

Learnings:
- Google Play Store guidelines require an unauthenticated, publicly accessible URL for privacy policies, which cannot be satisfied by LAN-only/self-hosted endpoints. Canonical hosting in the public VitePress documentation site (`docs/privacy.md` -> `/privacy`) provides permanent accessibility via GitHub Pages.
- App store compliance requires explicit disclosure of specific device permissions: Camera (`android.permission.CAMERA` for local in-memory QR scanning), Biometrics (hardware secure enclave isolation via Android Keystore), and local storage/SAF for backups (`sgtotp.bak`).
- Running 13 Vitest integration suites in parallel spawned multiple Express servers and concurrent SQLite migrations, leading to hook timeouts on resource-constrained environments. Setting `fileParallelism: false` in `vitest.config.ts` stabilized the entire suite to run 100% green sequentially.

Difficulties:
- Port and resource contention during parallel test suite runs. Diagnosed via single suite isolation and resolved systemically in `vitest.config.ts`.

Successes:
- Structured a dedicated, comprehensive Privacy Policy covering both ShellGuard and ShellGuard-TOTP under ClawStack Studios.
- Full 4-layer verification loop succeeded: `docs:build` clean, `lint` clean, `build` clean, and all 13 test suites (202 tests) 100% passing.
- Connected touchpoints in VitePress sidebar, footer, and landing view footer.

Improvements_Identified_For_Consolidation:
- Keep `fileParallelism: false` in `vitest.config.ts` for integration suites running embedded servers and SQLite migrations.
---

---
Date: 2026-09-03
TaskRef: "Prepare ShellGuard Release v0.0.1.7 (ShellGuard-TOTP Companion Compatibility & Sync)"

Learnings:
- TypeScript compiler (`tsc --noEmit`) uncovered critical structural type gaps that escaped unit tests: missing `ParsedSgTotpBackup` type in `src/lib/sgtotpBackup.ts` and missing `created_at` timestamp in `SgTotpImportCandidate` for `VaultItem[]` assignment in `ImportExportView.tsx`.
- The Verification Loop's layer 3 (running the compiler and build before claiming completion) proved indispensable: unit tests passed 100% despite the TypeScript compiler failing. Building the floor before the ceiling caught this immediately.
- Established One-Way Mirror Sync cross-ecosystem architecture between the ShellGuard Web Vault and the native ShellGuard-TOTP Android application (releases at https://github.com/ClawStackStudios/ShellGuard-TOTP/releases).
- Rolling-file release model in `.github/workflows/release.yml` mandates renaming upward (e.g. `RELEASE-v0.0.1.6.md` -> `RELEASE-v0.0.1.7.md`) rather than keeping duplicate older release files in the root.

Difficulties:
- Identifying path and environment variables for Node/npm in the non-standard `/config/Applications/node-v22.23.0-linux-x64/bin` installation directory. Resolved by inspecting `/config/.bashrc`.

Successes:
- Restored 100% clean TypeScript type check and production Vite compilation.
- Synchronized all central version files (`package.json`, `README.md`, `CHANGELOG.md`, `RELEASE-v0.0.1.7.md`).
- Documented cross-ecosystem topology and wire-format specifications cleanly in `ARCHITECTURE.md` and `compatibility_layer.md`.

Improvements_Identified_For_Consolidation:
- Add One-Way Mirror Sync and Cross-Ecosystem Companion pattern to `systemPatterns.md`.

---
Date: 2026-08-30
TaskRef: "ShellGuard-TOTP Android Design System & Dynamic Theme Accent Selection Engine"

Learnings:
- Harmonized the Android companion design specifications in `android/DESIGN.md` and `android/ui-ux-design-system.md` 1:1 with ShellGuard's Reef Modernist web tokens (`DESIGN.md`).
- Implemented a dynamic dual-mode color token schema (`#0F1419` base canvas, `#171C21` surface card, `#1E252C` elevated, `#DEE3EA` text main, `#879298` muted, `#3D484E` border) with `LocalShellGuardColors` staticCompositionLocalOf for zero-jank dynamic Compose inheritance.
- Created 6 curated bioluminescent theme accent palettes (`REEF_DEFAULT`, `CYAN_VENT`, `PURPLE_SHELL`, `EMERALD_TRENCH`, `AMBER_FLARE`, `MONOCHROME`) allowing users to customize their vault accent from Settings while preserving the iconic ShellGuard aesthetic.
- Designed `ThemeColorSelectorCard` in `SettingsScreen.kt` featuring mode toggles (System, Dark, Light) and circular gradient palette swatches with active selection indicators.

Difficulties:
- Ensuring all child composables (`TotpCard`, `TotpCountdownRing`, `PodFilterChips`, `ScannerFab`, `ClipboardToastPill`, `TotpEmptyState`) dynamically inherit custom colors rather than relying on static theme globals. Resolved with `LocalShellGuardColors.current`.

Successes:
- Fully aligned `android/DESIGN.md` and `android/ui-ux-design-system.md` with complete, copy-paste Kotlin Compose code snippets.

Improvements_Identified_For_Consolidation:
- General Jetpack Compose Pattern: Multi-accent dynamic theme engine via `CompositionLocalProvider` and `LocalShellGuardColors`.

---
Date: 2026-08-29
TaskRef: "ShellGuard-TOTP Android Architecture & Google AI Studio Master Meta-Prompt"

Learnings:
- Google AI Studio Suggestions Synthesis: Wove the 4 live AI Studio UI suggestions (AndroidX Biometric 1.2.0-alpha05 gating before code revelation via AndroidKeyStoreHelper, thread-safe RFC 6238 TOTP engine with SHA1/256/512 and 6/8 digits, CameraX + ML Kit barcode scanning composable preview with URI parsing, and AndroidX Room + SQLCipher secure persistence initialized in Application class) directly into the multi-stage prompts and 3-Phase roadmap.
- ClawStack Mobile Standard (`ClawChives-Mobile`): Analyzed working client-server architecture in ClawStackStudios/ClawChives-Mobile. Identified core standard patterns: Ktor dynamic `ApiClient` singleton with `HttpResponseValidator` on 401/403, `handleNetworkDiagnostics` for rich 400 validation telemetry, `ClawCrypto.hashHumanKey` (`SHA-256` lowercase hex), `AppConfig` Room table for session persistence, and `AuthRepository` with `Mutex` for concurrency-safe auto-reauth.
- Bitwarden Authenticator pattern for Android: A specialized 2FA companion client requires a strict offline-first cache architecture. Instead of blocking the UI or failing code generation when the vault server is offline, the client must decrypt and cache TOTP seeds in a hardware-backed SQLCipher Room database on initial sync, continuously generating valid RFC 6238 codes offline without re-auth.
- Room DB delta reconciliation with local-only records: Scanned or imported QR codes stored locally with `is_local_only = true` must be strictly shielded from remote deletion pruning during delta sync with `/api/vault`.
- Android KeyStore Master Key Sealing: Using `AndroidKeyStore` with `setUserAuthenticationRequired(true)` enables `BiometricPrompt` (Fingerprint/Face) to unwrap the user's `hu-` master key or decrypt the local SQLCipher passphrase seamlessly on launch.
- Roadmap Structure (2 tasks per phase): Scaffolding complex cross-platform clients in Google AI Studio requires a deterministic phased progression where each phase contains exactly 2 high-precision, verifiable tasks with strict success criteria.

Difficulties:
- Ensuring 100% cryptographic parity across platforms: Derivation salt (`userUuid`), info string (`"clawchives-shellcryption-v1"`), and AAD format (`"vault_pearls_totp:<pearlId>"`) must exactly mirror the web client and backend Express implementations.

Successes:
- Constructed a comprehensive, production-ready specification corpus of 9 modular markdown documents in `/android`, including a master Meta-Prompt for Google AI Studio and a 3-Phase deterministic roadmap.

Improvements_Identified_For_Consolidation:
- Add Android Authenticator offline cache pattern to `systemPatterns.md`.

---

Learnings:
- Antigravity Customization Architecture operates on a clean 4-tier model: `rules/` for universal behavioral constraints and negative invariants; `skills/` for on-demand procedural capability guides with YAML frontmatter (e.g. `skills/ui-webdev/SKILL.md`); `templates/` for reusable document scaffolds and ASCII art; and `workflows/` for interactive slash-command runbooks.
- Git Tracking Index Invariant: Adding a folder to `.gitignore` does not untrack files that were previously staged or committed to the Git index. Executing `git rm -r --cached <dir>` cleans the index while preserving physical files on disk intact.
- Claurst-Style Release Pipeline: Parsing `--release[ =]+v?[0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?` in GitHub Actions (`release.yml`) enables one-shot release publication directly from commit messages on `main`, automatically tagging the commit, locating `RELEASE-vX.Y.Z.N.md`, and triggering multi-arch container builds.

Difficulties:
- Legacy tracked files in `.agents/` caused unexpected `modified:` statuses despite `.agents/` being listed in `.gitignore`. Resolved by clearing the cached index.

Successes:
- Synthesized CaraBase and ShellGuard release templates into a comprehensive master `release-template.md` featuring Architectural Topology Maps, Layer Changes Matrices, and Commit Ledgers.
- Successfully converted `ui-webdev.md` from a static rule to an on-demand Antigravity skill.

Improvements_Identified_For_Consolidation:
- Customization topology structure in `systemPatterns.md`.
- Git cache untrack command and release workflow regex in `techContext.md`.

---
Date: 2026-08-29
TaskRef: "Bitwarden-Style Custom Fields (Text, Hidden, Checkbox, Linked) & ItemFormModal Polish"

Learnings:
- Custom fields require zero-knowledge client-side encryption with distinct AAD namespaces (`vault_pearls_custom:{id}`, `vault_secure_notes_custom:{id}`, `vault_ssh_keys_custom:{id}`) to ensure cryptographic isolation across entity types.
- To prevent server-side double-encryption under `DB_ENCRYPTION_KEY`, the `custom_fields` column is intentionally excluded from `metadataGuard.ts`, allowing opaque client ciphertext to pass through untouched.
- Node.js 22 WebCrypto mocking in tests: `crypto.subtle` is a prototype getter on `Crypto.prototype`. Directly deleting or reassigning `crypto.subtle` throws or fails silently in modern Node. Mocking via `Object.defineProperty(Object.getPrototypeOf(globalThis.crypto), 'subtle', ...)` provides reliable non-secure context emulation.
- Modal UX: Pinning header and action footer while enabling internal element scrolling (`h-[90vh] max-h-[90vh] overflow-hidden` on dialog card, `flex-1 overflow-y-auto` on body) creates a significantly more ergonomic editing experience than scrolling the outer page.

Difficulties:
- Initial modal placement of custom fields had an independent add button that crowded the footer. Resolved by consolidating custom fields into the unified "+ Add Extra Field" dropup menu with upward animated pop-in and click-outside dismissal.

Successes:
- All 4 Bitwarden custom field types (`Text`, `Hidden`, `Checkbox`, `Linked`) implemented across vault items, notes, and SSH keys with 100% test coverage and zero regressions across 172 tests in 11 test suites.

Improvements_Identified_For_Consolidation:
- UX Pattern: Internal modal element scrolling with pinned header/footer for rich data entry modals.
- Cryptography Pattern: Client-side JSON array encryption with entity-scoped AAD namespaces.

---
Date: 2026-08-29
TaskRef: "Version update v0.0.1.4 (pure TypeScript WebCrypto fallback for HTTP LAN origins)"

Learnings:
- In non-secure contexts (such as LAN HTTP `http://192.168.x.x:6464` on Unraid), Chromium and Firefox completely disable `window.crypto.subtle`. Any direct call to `crypto.subtle.digest`, `crypto.subtle.importKey`, `crypto.subtle.deriveKey`, or `crypto.subtle.encrypt` crashes with `Cannot read properties of undefined (reading 'digest')`.
- Implementing pure TypeScript fallback engines (SHA-256, HMAC-SHA256, HKDF-SHA256, and AES-256-GCM) ensures total cryptographic parity and zero crashes on local self-hosted instances while retaining hardware-accelerated WebCrypto on HTTPS.

Difficulties:
- Non-secure context restrictions in modern browsers are strict: WebCrypto `subtle` is omitted, and file navigations to `data:` URIs are blocked. Resolved by combining in-memory Blobs and pure TypeScript crypto fallbacks.

Successes:
- Fully implemented and verified byte-exact pure TS SHA-256, HKDF, and AES-GCM engine in `src/lib/webCryptoFallback.ts`.
- Polyfilled `hashToken`, `deriveShellKey`, `encryptField`, and `decryptField`.

Improvements_Identified_For_Consolidation:
- General pattern: WebCrypto polyfill / pure fallback for self-hosted LAN web applications.

---
Date: 2026-08-29
TaskRef: "Version update v0.0.1.3 (hotfix increment, SVG icons, docs hygiene)"

Learnings:
- Incrementing hotfix versions (4th digit `0.0.1.3`) allows tight iterations for initial deployment polish without exhausting semantic minor/patch digits.
- Standardizing the version update protocol across `package.json`, `README.md`, `CHANGELOG.md`, `RELEASE-vX.Y.Z.md`, and memory bank ensures zero documentation drift across team transitions.

Difficulties:
- Legacy docs contained stale references to non-existent historical versions (`v0.2.0`) from previous templates. Swept and purged to establish `v0.0.1` as the true Genesis version.

Successes:
- Successfully linked SVG icons into the Unraid template and browser favicon.
- Fully automated version bump loop verified and synced.

Improvements_Identified_For_Consolidation:
- Maintain 4th-digit hotfix convention (`0.0.1.x`) for rapid unraid / self-host deployment verification phases.

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

---
Date: 2026-08-29
TaskRef: "Master-Detail UI Refactor & Undefined Reference Fix"

Learnings:
- Complete removal of legacy 2,400-line monolithic `PasswordVaultView.tsx` and replacement with modular `VaultShell.tsx` (orchestrator), `ItemListPane.tsx` (stream list), `ItemDetailPane.tsx` (inspector), and `ItemFormModal.tsx` (modal).
- During large refactors where state variable names are modernized (e.g. `activeVaultTab` -> `activeTypeFilter`), verify and lint with `tsc --noEmit` to catch any remaining references in JSX expressions or callbacks that rollup might bundle without failing syntax checks.
- When sorting dates in TypeScript, explicitly wrap `created_at` in `new Date(x || 0).getTime()` since string-typed timestamps cannot be subtracted directly with arithmetic operators.

Difficulties:
- Encountered `Uncaught ReferenceError: activeVaultTab is not defined` in `App.tsx` due to renamed state variable during JSX props wiring. Resolved immediately by updating references to `activeTypeFilter`.

---
Date: 2026-08-29
TaskRef: "Reactive Vault & Agent ShellKey Loader"

Learnings:
- Decrypted vault items and agent keys were previously fetched only on explicit imperative action triggers (item CRUD, account switch), leaving initial login, setup, and session recovery renders empty until an item mutation occurred.
- Introducing a reactive `useEffect` watching `shellKey` ensures that as soon as a `CryptoKey` becomes available from any auth source (mount restore, login, quick unlock, account switch), `scuttleVault(shellKey)` and `scuttleAgents()` execute automatically.
---
Date: 2026-08-29
TaskRef: "ShellGuard v0.0.1 Genesis Release"

Learnings:
- Execution of full verification loop prior to tagging: `npm run lint` (0 TypeScript errors), `npm run test` (9 test suites / 162 unit & integration tests passing 100%), and `npm run build` (Vite production bundle compiled cleanly).
- Release orchestration workflow: Generated `RELEASE-v0.0.1.md` adhering to ClawStack Studios release specification, synced `CHANGELOG.md` with explicit release headers, updated `README.md` badge links, and aligned `package.json` version to `0.0.1`.

Successes:
- Clean 100% verification pass across all test assertions, compilation, and security contracts.
---


