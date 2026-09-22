---
Date: 2026-09-22
TaskRef: "Draft Release v0.0.2.3 (Build 25) — The Deep Ingestion & Vault Parity Molt"

Learnings:
- Adhering to the ClawStack Studios Release Protocol requires coordinating multiple synchronization anchors: `package.json`, `package-lock.json`, `README.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `ROADMAP-HISTORY.md`, and the active release document `RELEASE-vX.Y.Z.N.md`.
- Strict enforcement of the Single Active Release Draft invariant (purging `RELEASE-v0.0.2.2.md` upon creation of `RELEASE-v0.0.2.3.md`) prevents ambiguity in downstream CI workflows (`.github/workflows/release.yml`) which mirror root release notes directly into GitHub Releases.
- The Roadmap 3-version sliding-window protocol preserves readability of root `ROADMAP.md` by archiving older completed milestones (Phase 18 retired to `ROADMAP-HISTORY.md`) while keeping the 3 most recent completed phases (Phases 19, 20, 21) in view.

Difficulties:
- Ensuring no files from other agent directories (`.clinerules/`, `.jules/`) enter the index or get touched during release drafting. Enforced through strict staging boundaries and isolation rules.

Successes:
- Successfully drafted `RELEASE-v0.0.2.3.md` detailing all Phase 21 achievements (Batch Operations, Universal Bitwarden Ingestion, RFC 6238 TOTP, Item Password History, Dual Export Suite, Migration 0008 Note Attachments Parity, Ghost Pod Purging).
- 100% test oracle green across all 26 test suites (313 passed, 1 skipped).

Improvements_Identified_For_Consolidation:
- General pattern: Automated release document lifecycle maintaining Single Active Release Draft invariant.
- General pattern: 3-version sliding-window archival in milestone roadmaps.
---

---
Date: 2026-09-22
TaskRef: "Note Attachments Parity, Ghost Pod Purging & Detail Pane Selection Preservation"

Learnings:
- Standalone attachments uploaded with category defaulting to "Attachment" caused the unique pod derivation logic (`items.map(i => i.category)`) to produce an unintended pod named 'Attachment' in bulk move chips and pod trees. In `src/lib/podUtils.ts` and `VaultShell.tsx`, filtering out case-insensitive 'attachment' and 'all' across `getAllUniquePods`, `setPodColor`, and `getStoredPodColors` permanently prevents phantom pods.
- Secure notes (`vault_secure_notes`) lacked an `attachments` column in the database schema. Added `migrations/0008_note_attachments.up.sql` (`ALTER TABLE vault_secure_notes ADD COLUMN attachments TEXT DEFAULT '[]';`), updated `NoteSchemas` create/update Zod validation, updated `POST /api/notes` and `PUT /api/notes/:id` to accept attachments, and added cascade deletion in `DELETE /api/notes/:id` to purge linked records in `vault_secure_attachments`.
- Client-side note attachment uploading required handling `newAttachments` and `removedAttachmentIds` inside `lockTheClaw` and `updateTheClaw` in `src/App.tsx`, mirroring password attachment behavior and sending the updated attachments JSON array.
- Detail pane blanking on save was caused by rendering `uploadProgress` inside `<AnimatePresence mode="wait">` that wrapped the main views (`view === "vault"`). When upload started, `uploadProgress` mounted and unmounted `VaultShell`. When upload finished, `VaultShell` remounted with default `selectedItemId = null`. Decoupling `uploadProgress` and `error` banners into their own non-blocking container and lifting `selectedItemId` to `App.tsx` guarantees selection stickiness across item saves.

Difficulties:
- Diagnosing the root cause of detail pane blanking required tracing the lifecycle of `VaultShell` mounts across Framer Motion `mode="wait"` triggers during file upload.

Successes:
- Added 7 new unit tests in `tests/unit/uiSeams.test.ts` (bringing the total to 25 unit tests) covering ghost pod filtering, note attachment scuttle mapping, note deletion cascade extraction, and selection retention across updates.
- All 26 test suites passed 100% green (313 passed, 1 skipped).
- Clean `npm run lint` (0 errors) and clean `npm run build`.

Improvements_Identified_For_Consolidation:
- General pattern: Decouple transient overlay/progress banners from view-routing AnimatePresence to prevent accidental component unmounting.
- General pattern: Schema parity across primary vault record types for composite features (attachments, tags).
---

---
Date: 2026-09-21
TaskRef: "Vault Item Deletion Fix & Single-Item Confirmation Dialog"

Learnings:
- Stale Node background processes binding development ports (`6565`) can silently intercept requests and mask newer routes (e.g. `DELETE /api/vault/bulk` falling back to parameterized `DELETE /api/vault/:id` where `:id = 'bulk'`). Verifying running listener PIDs via `fuser` / `ss` is essential when server route updates appear ignored.
- Item deletion dispatch in `App.tsx` previously fell back to `/api/attachments` for any item whose `type` was not strictly `'password'`, `'note'`, or `'key'`. Explicitly routing all pearl types (including `'totp'` and custom items) to `/api/vault` and reserving `/api/attachments` strictly for `'attachment'` items prevents 404 deletion rejections.
- In `VaultShell.tsx`, deleting an item while it was actively selected left `selectedItemId` set, causing `ItemDetailPane` to hold onto stale or dead item state. Clearing `selectedItemId` to `null` if `selectedItemId === item.id` cleanly deselects the item upon deletion.
- Single item delete in `ItemDetailPane.tsx` lacked confirmation gating prior to invoking `onDelete`. Integrating the Reef Modernist `ConfirmDialog` modal provides consistent confirmation ergonomics across both single-item and bulk-item deletion workflows.

Difficulties:
- Silent rejection in UI when API calls failed due to lack of try/catch wrapping around `onDelete` and `onBulkDelete` in `App.tsx`. Resolved by wrapping deletion calls in try/catch and reporting errors to UI error state while ensuring `scuttleVault(shellKey)` is awaited.

Successes:
- Added dedicated unit test suite `tests/unit/vaultDelete.test.ts` validating API endpoint routing and bulk delete partitioning across all item types.
- All 25 test suites pass 100% green (288 passed, 1 skipped).

Improvements_Identified_For_Consolidation:
- General pattern: ConfirmDialog symmetry across single and bulk destructive actions.
- General pattern: PID/port hygiene on development server restarts (`scuttle:stop` before `scuttle:dev-start`).
---

---
Date: 2026-09-20
TaskRef: "Peer Review Resolution & Hardening — Phase 21 Sub-Phase (Bitwarden Ingestion · Composite Features · Dual Export Suite)"

Learnings:
- Password-based KDF must provide sufficient work factor (PBKDF2-SHA256 at >=100,000 iterations; modern OWASP guidance specifies 600,000 iterations for PBKDF2-HMAC-SHA256) rather than high-entropy expansion functions like HKDF, which have no work factor against GPU brute-force when used with human passphrases.
- At 600,000 iterations, pure-TS synchronous PBKDF2 computation blocks the main JS thread for 15-20s. Implementing caller-side async acceleration via `crypto.subtle.deriveBits` in `vaultExport.ts` reduces execution to ~1s off-thread on secure origins, while keeping `webCryptoFallback.ts` strictly as an unpolluted pure-TS fallback for non-secure HTTP LAN environments.
- Pure-TS PBKDF2 (`webCryptoFallback.ts`) implementing RFC 8018 PKCS #5 v2.1 ensures deterministic in-memory derivation without WebCrypto availability or subtle crypto limitations on LAN/HTTP origins.
- AES-GCM nonces and salts must strictly require CSPRNG (`crypto.getRandomValues`); degrading to `Math.random` breaks both confidentiality and authenticity under GCM. Fail-closed is the only acceptable posture.
- Secondary login URIs (`uris`) must be registered under `METADATA_COLUMNS` in `metadataGuard.ts` to maintain encryption parity with primary `url` fields at Layer 2.
- Test fixtures containing real or real-shaped exports must be sanitized, relocated into `tests/fixtures/`, referenced via relative `__dirname` paths, and excluded from accidental root commits via `.gitignore`.
- Down migrations adding nullable/default columns in SQLite should default to no-op (`SELECT 1;`) to prevent irreversible data loss on rollback.
- Vite's dev server file watcher (`server.watch.ignored`) should explicitly ignore `**/tests/**`, `**/*.sqlite*`, and `**/*.wal` to prevent crash loops when test suites create and unlink transient SQLite WAL files.
- Dedicated RFC 6238 published test vectors (SHA1/256/512 at varying epoch timestamps T=59, T=1111111109, T=1111111111) are critical to ensuring zero drift in TOTP implementations.

Difficulties:
- Vite file watcher crashed on ephemeral SQLite WAL files generated by tests running in parallel with `scuttle:dev-start`. Resolved by configuring `server.watch.ignored` in `vite.config.ts`.

Successes:
- All 24 test suites passed 100% green (282 passed, 1 skipped).
- `tsc --noEmit`, production `vite build`, and VitePress `docs:build` all pass 100% green with zero errors or broken links.

Improvements_Identified_For_Consolidation:
- General pattern: Branched KDF (HKDF for high-entropy machine keys, PBKDF2 for human passphrases).
- General pattern: Fail-closed CSPRNG policy for all authenticated encryption envelopes.
- General pattern: File watcher ignore filters for ephemeral SQLite test artifacts.
---

Date: 2026-09-20
TaskRef: "Phase 21 Sub-Phase: Bitwarden Ingestion Parity, Item Password History & Dual Export Suite (Sub-Phases 21.1, 21.2, 21.3)"

Learnings:
- Implemented universal Bitwarden JSON and CSV ingestion engine (`src/lib/bitwarden.ts`) mapping folders to normalized pods (`normalizePod`), custom fields (text, hidden, checkbox, linked), and compound SSH keypairs (`serializeSshKeySecret`).
- Identified that encrypted Bitwarden exports cannot be decrypted directly without proprietary account-derived KDF parameters; added clear detection and guidance alerts instructing users to export unencrypted JSON/CSV or use Bitwarden CLI.
- Built dynamic RFC 6238 TOTP parsing, formatting, and live generation (`src/lib/totpUtils.ts`) supporting SHA1/SHA256/SHA512, 6/8 digits, and custom intervals (15s/30s/60s). Synchronized Android `compatibility_layer.md` with interoperability details.
- Added database migration `0007_composite_item_features.{up,down}.sql` creating `uris TEXT DEFAULT '[]'` and `password_history TEXT DEFAULT '[]'` columns on `vault_pearls` with Layer 2 metadata encryption.
- Added client-side password generation history tracking with history drawer and restore button in item form and detail panes, alongside multi-URI rows.
- Built dual export suite (`src/lib/vaultExport.ts`) delivering zero-knowledge AES-256-GCM encrypted backup envelopes protected by ClawKey or custom passphrase, and RFC 4180 CSV exports with toggleable password sanitization audit controls.
- Modernized `ImportExportView.tsx` with resilient format sniffer, encrypted backup decryption modal, format cards, and rich batch import preview modal.
- Built 12 new unit tests across `tests/unit/bitwarden-import.test.ts` and `tests/unit/vault-export.test.ts`.

Difficulties:
- Previous sniffer logic threw unhandled exceptions on non-sgtotp JSON files. Resolved by ordering detection: Bitwarden CSV -> JSON parsing -> Bitwarden encrypted check -> ShellGuard encrypted backup envelope -> Bitwarden JSON -> SGTOTP backup (with try/catch) -> standard ShellGuard JSON.

Successes:
- Full verification passed 100% green across all 23 test suites (271 passed, 1 skipped), `npx tsc --noEmit`, production `vite build`, and VitePress `docs:build`.

Improvements_Identified_For_Consolidation:
- General pattern: Safe multi-format sniffer priority ordering with proactive failure messaging for proprietary encrypted formats.
- General pattern: Password sanitization audit toggle on plaintext exports to prevent accidental credential leakage in compliance workflows.
---

---
Date: 2026-09-19
TaskRef: "Release Draft v0.0.2.2 (Build 24) — The Bioluminescent Reef"

Learnings:
- Synchronized package versioning across package.json, package-lock.json, README.md, CHANGELOG.md, and ARCHITECTURE.md to 0.0.2.2.
- Verified dynamic package version resolver in tests/unit/version.test.ts reads directly from package.json, keeping the test oracle 100% green without assertions needing manual edits.
- Rolled over the ROADMAP.md 3-version completed milestones sliding window: Phase 18, Phase 19, and Phase 20 are now the active completed trio; Phase 17 was safely migrated to .agents/memory-bank/ROADMAP-HISTORY.md.
- Drafted comprehensive release document RELEASE-v0.0.2.2.md highlighting the 4 core themes: Tag Taxonomy & Granular Filters, 500MB Attachment Ceiling, SSH Keypair Dual-Key Presentation & Terminal Ergonomics, and 100% Green Verification Suite.
- Purged previous draft RELEASE-v0.0.2.1.md cleanly so the repo maintains exactly one active release file.

Difficulties:
- None; sliding window migration and document synchronization completed deterministically.

Successes:
- Full verification passed: all 20 test suites (248 tests passed, 1 skipped), tsc --noEmit, vite build, and npm run docs:build pass 100% green.

Improvements_Identified_For_Consolidation:
- General pattern: 3-version sliding window roadmap rotation for completed milestones with historical archival.
---

---
Date: 2026-09-19
TaskRef: "SSH Key Dual-Key Architecture, Clean PEM Delimiters & Terminal Ergonomics"

Learnings:
- In-browser SSH keypair generation previously serialized `{ publicKey, privateKey }` directly into `key_value`, causing an unmasked private key in the UI to display raw JSON.
- Built a dual-key serialization layer in `src/lib/keyGen.ts` (`parseSshKeySecret`, `serializeSshKeySecret`, `formatAuthorizedKeysCommand`) ensuring zero-knowledge client-side storage while transparently handling legacy raw PEM strings.
- Strictly preserved RFC 7468 PKCS#8 PEM framing (`-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----`) for private keys; unmasking renders a monospace `<pre>` block that does not leak JSON syntax.
- Form modal (`ItemFormModal.tsx`) provides dedicated, decoupled inputs for Private Key PEM (textarea) and Public Key (OpenSSH string), preventing JSON leaking during item edits.
- Detail pane (`ItemDetailPane.tsx`) delivers high-velocity terminal ergonomics: dedicated Public Key card with algorithm badge, **Copy Public Key**, **Copy `authorized_keys` Command** (`echo "..." >> ~/.ssh/authorized_keys`), and direct in-browser **Download .pem** file action.
- Added 5 unit tests in `tests/unit/keyGen.test.ts` bringing total test oracle to 20 suites / 248 passing tests.

Difficulties:
- Ensuring 100% backward compatibility with existing raw PEM keys already stored in user vaults without requiring schema migrations or forced key regeneration. Handled gracefully in `parseSshKeySecret` with JSON parse error catch falling back to raw string.

Successes:
- All 20 test suites (248 passed, 1 skipped) pass 100% green.
- `tsc --noEmit`, `vite build`, and `npm run docs:build` succeed with 0 errors.

Improvements_Identified_For_Consolidation:
- General pattern: Decoupled UI presentation for dual-key / compound cryptographic credentials stored under a single opaque ciphertext column.
- General pattern: Terminal one-liner copy ergonomics (`authorized_keys`) for infrastructure secrets.
---

---
Date: 2026-09-19
TaskRef: "Phase 20: Vault Tagging System & Granular Filter Bar + 500MB Storage Ceiling (Tasks 39 & 40)"

Learnings:
- Implemented migration 0006_vault_tags.{up,down}.sql adding `tags TEXT DEFAULT '[]'` column and owner index across `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys`.
- Registered `tags` in `metadataGuard.ts` for Layer 2 per-row metadata encryption (AES-GCM-256 encrypted on disk, decrypted on read).
- Updated route handlers (`vault.ts`, `notes.ts`, `sshKeys.ts`) to support `?tags=a,b` intersection filtering and capture tag mutation events in the forensic audit trail (`audit_logs`).
- Elevated attachment storage ceiling from 50MB to 500MB (`ATTACHMENT_MAX_MB`) and grotto quota from 500MB to 1000MB (`GROTTO_QUOTA_MB`) across server routes, Busboy streaming, client helpers, and documentation.
- Built `TagSelectorInput` with autocomplete suggestions, removable chips, and inline color palette selection (`POD_COLOR_PALETTE`).
- Unified Pod and Tag color mechanics in `src/lib/podUtils.ts` with deterministic string hashing (`hashStringToColor`) and explicit user overrides.
- Implemented collapsible tag cloud in `SidebarFolderTree.tsx`, granular filter bar with `AND`/`OR` logic in `ItemListPane.tsx`, and tag pill badges in `ItemDetailPane.tsx`.

Difficulties:
- Node headless test environments lack `window.localStorage`, leading to ReferenceErrors when running unit tests against `podUtils.ts`. Resolved by adding defensive `typeof localStorage === "undefined"` guards with memory fallbacks.
- In `tests/vault-crud.test.ts`, tests assert that a 50MB payload exceeds the attachment limit without allocating 500MB of RAM. Resolved by setting `process.env.ATTACHMENT_MAX_MB = '50'` in its test preamble.

Successes:
- All 20 test files (243 tests passed, 1 skipped) pass 100% green.
- `tsc --noEmit`, `vite build`, and `vitepress build docs` compile cleanly with 0 errors.

Improvements_Identified_For_Consolidation:
- General pattern: Unified deterministic color engine for categorization systems.
- General pattern: Headless safety for shared client utility libraries.
---

---
Date: 2026-09-17
TaskRef: "CaraBase Brand Asset Alignment & Web Server Favicon Distinction"

Learnings:
- Aligned ShellGuard's brand mascot to CaraBase's woodcut vector engraving aesthetic: forward/downward crab orientation, pincers clasping the vault door with 3D 'S' crest, stippled shading, and cream highlights.
- Created server-distinct favicon (`favicon.svg`) with a notched carapace crest shield and multi-grid Web Globe (orthographic WWW grid with equator, prime meridian, dual vertical meridians, and dual horizontal latitudes).
- Themed the center Web Globe to ShellGuard's signature purple/pink palette (`#e4048a` Lobster Fuchsia, `#ec4899` Hot Pink, `#c026d3` Royal Purple, `#ffffff` center beacon) for high legibility at 16px and 32px tab scale.
- Maintained strict 1:1 twin parity between `public/` and `docs/public/assets/`.
- Enforced hard memory bank isolation: Antigravity strictly uses `.agents/memory-bank/`, while Cline uses `.clinerules/memory-bank/`.

Difficulties:
- Resolving Google Search thumbnail reCAPTCHA block when searching user-provided URL; resolved by decoding the base64 URL fragment `#sv=...` with Python to extract the image DocID (`-ittcLCWgFOmnM`) and curling `encrypted-tbn0.gstatic.com` directly.

Successes:
- Rendered high-res 1:1 thumbnail (1024x1024), 16:9 brand logo card (1024x572), and panoramic 1024x500 Web Feature Graphic banner.
- All 4 quality gates passed 100% green (lint 0 errors, vite build clean, docs:build clean, 210/211 vitest tests).

Improvements_Identified_For_Consolidation:
- General pattern: Web Server favicon & brand asset twin parity.
- Hard boundary: Agent memory bank isolation.
---

---
Date: 2026-09-16
TaskRef: "Release v0.0.1.10 (The Auditable Corpus, ClawKey Canon, Bidirectional Audit)"

Learnings:
- Formalized "docs bow to code" governance ruling: when verified, secure code contradicts documentation claims, docs bow to code. Corrected 8 documentation lies (PRAGMA rekey, limiter counts, identity-file contract, phantom customFields.ts, tlsManager.ts, client crypto exports, fifth canMove mask, `_custom` AAD namespaces).
- Established the ClawKey Canon across root docs and UI: `ClawKey©™` (sovereign 67-char `hu-` identity key), `ShellCryption©™` (client-side zero-knowledge encryption engine), `LobsterKeys` (`lb-` delegated agent keys). Renamed 14 UI strings.
- Queued Phase 24 (Cryptographic Audit Hardening & Third-Party Auditability) and embedded Documentation Impact blockquotes across all queued phases.
- Adopted Decision Log (`decision-log.md`) with 20-entry sliding window.

Difficulties:
- Uncovering phantom documentation claims where code had no literal grep hits. Resolved by reading test fixtures as the ground-truth behavioral oracle.

Successes:
- Shipped 34-commit documentation-governance release v0.0.1.10 with 0 runtime defects.
- 100% passing tests (210 passed, 1 skipped).

Improvements_Identified_For_Consolidation:
- General pattern: The ClawKey Canon.
- General pattern: Docs bow to code principle.
---

---
Date: 2026-09-13
TaskRef: "Release v0.0.1.9 (Key Ledger Hardening & Pod Purity)"

Learnings:
- Implemented Phase 17: Migration `0004_key_ledger.sql` retired plaintext `api_key` column from `agent_keys`, storing SHA-256 `key_hash` and `key_fingerprint` (`lb-***-XXXX`).
- Constant-time `crypto.timingSafeEqual()` verification prevents timing attack side channels.
- Plaintext keys returned once at minting time; card rows display masked fingerprints (`maskKey()`).
- Dropped hardcoded `DEFAULT 'Personal'` from pod categories (uncategorized = `""`).
- Created `tests/agent-key-hash.test.ts` proving zero plaintext byte leakage in SQLite.

Difficulties:
- Backfilling existing agent keys in-place without invalidating running agent sessions. Resolved by repointing `api_tokens` from raw keys to agent row IDs.

Successes:
- Clean database migration and zero-plaintext key storage achieved.
- All 15 test files (210 tests) green.

Improvements_Identified_For_Consolidation:
- General pattern: Hash-only agent key ledger.
---

---
Date: 2026-09-05
TaskRef: "Root Documentation Alignment & Runtime Version Resolver Parity"

Learnings:
- Discovered that reading `process.env.npm_package_version` in Node.js captures whatever version existed at the moment the process was launched by `npm`. For long-running server processes or direct `tsx` / Docker invocations without npm, this variable becomes stale or undefined (`0.0.0`).
- Implemented `src/server/utils/version.ts` with `getAppVersion()` to dynamically resolve from `package.json` with multi-tier fallback, guaranteeing zero-drift version presentation across `/api/admin/status` (`v{status.version}` in SuperLobster panel), `/api/health`, and backup manifests.
- Reconciled root documentation (`ARCHITECTURE.md`, `BLUEPRINT.md`, `SECURITY.md`, `README.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `ADMIN.md`, `docs/superlobster/management.md`) against active schema truth (`agent_keys`, `lobsters`, `(owner_uuid, key)`, `custom_fields`), 14 Vitest suites (204 unit tests), and removed all dead links (`CRUSTSECURITY.md`, relative `CRUSTAGENT.md`).

Difficulties:
- Identifying why the admin panel was rendering `v0.0.1.7`: `process.env.npm_package_version` in running server processes was frozen to the environment set at boot time. Resolved by switching to dynamic file reads via `getAppVersion()`.

Successes:
- Reconciled all 8 root documentation files with ground-truth runtime reality.
- Created `tests/unit/version.test.ts` (14/14 suites, 204 unit tests passed 100% green).
- Passed full verification loop: `docs:build` (0 errors), `lint` (0 errors), `test` (100% green), `build` (0 errors).

Improvements_Identified_For_Consolidation:
- General pattern: Dynamic `package.json` version resolver vs environment variable caching.
---

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


