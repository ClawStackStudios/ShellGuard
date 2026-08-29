# Changelog — ShellGuard

## [Unreleased]

## [0.0.1.3] - 2026-08-29

### Changed
- **Iconography & Favicon:** Integrated official `shellguard-icon.svg` as root `public/favicon.svg`, linked into `index.html`, and updated `shellguard-unraid-template.xml` Icon URL.

### Fixed
- **Documentation Hygiene:** Purged obsolete legacy breaking-change warnings and legacy data-wiping migration text; re-aligned all references in `ROADMAP.md`, `README.md`, `QUICKSTART.md`, `ARCHITECTURE.md`, `CRUSTAGENT.md`, and docs to `v0.0.1`.

## [0.0.1.2] - 2026-08-29

### Fixed
- **Insecure Origin UUID & Entropy Fallback** — Added multi-tier RFC 4122 v4 UUID generator and secure entropy fallback in `src/lib/crypto.ts` for non-secure HTTP browser origins where `window.crypto.randomUUID` is undefined.
- **LAN HTTP Insecure File Downloads** — Replaced raw `data:` URI links with in-memory `Blob` and `URL.createObjectURL(blob)` in `downloadIdentityFile` and `downloadAttachment` to eliminate Chromium insecure-connection download blocks.

## [0.0.1] - 2026-08-29

### Added
- **Bitwarden-Style Master-Detail Vault Dashboard** — Completely overhauled the primary vault interface from monolithic tabs to a responsive, two-pane master-detail layout (`VaultShell`, `ItemListPane`, `ItemDetailPane`, and unified `ItemFormModal`).
- **Reactive ShellKey Lifecycle & Memory Purging** — Integrated automatic item decryption on login/unlock/restore and immediate in-memory credential purging on lock/logout.
- **Vault Lock Hardening & Mutation Denial** — Strict enforcement of `isLocked` guards across all pod management (`handleRenamePod`, `handleDeletePod`, `SidebarFolderTree`, `PodModal`), item mutations (`lockTheClaw`, `updateTheClaw`, item deletion), live search dropdowns, and header `+` add action menus.
- **Unified & State-Aware Navigation (`NavIntent`)** — Explicit `NavIntent` state tracking (`sg_nav_intent` in `sessionManager.ts`), preserving `"landing"` intent across reloads on manual logout ("Claw Out"), and preserving `"dashboard"` intent with quick unlock modal on lock/reload.
- **Zero Hardcoded Default Pods** — Completely user-driven pod model with zero hardcoded defaults (`DEFAULT_ROOT_PODS = []`, `INITIAL_DEFAULT_COLORS = {}`). Pods are only displayed when explicitly created by the user or when assigned to vault items.
- **Desktop Sidebar Collapse / Expand Toggle** — Added desktop sidebar toggle button with `PanelLeftOpen` and `PanelLeftClose` icons in the header.
- **Custom In-Modal Pod Deletion Flow** — Replaced browser native `window.confirm` with an animated, themed in-modal confirmation screen in `PodModal.tsx`.
- **Hierarchical Category Normalization & Cascading** — Normalized pod matching (`normalizePod`) across all mutations and queries, with sub-pod cascade support (`targetPod + "/"`).
- **SuperLobster Instance Administration Plane** — Token-gated `/superlobster` dashboard with strict metadata metrics, cascade lobster deletions, read-only reef diagnostics, and fail-safe SQLite backups with rotation.
- **Encrypted Attachment Reference Architecture** — Standalone ShellCrypted files stored in `vault_secure_attachments` referenced by JSON arrays, complete with drag-and-drop uploads and client-side decrypted streaming downloads.
- **CaraBase-Aligned Modernist Design System** — Integrated BouncyBrand header, custom SVG favicons, live 30s TOTP countdown circles, and unified design token palettes.

### Changed
- **Header Breadcrumb Alignment** — Removed constrained `max-w-7xl` wrapper, aligning breadcrumb navigation flush with the left sidebar boundary.
- **Pod Deletion Cascade** — When a pod is deleted, items inside it are moved to uncategorized (`""`) instead of falling back to `"Personal"`.
- **Dynamic Pod Inputs & Suggestions** — `FolderInputGroup.tsx` now dynamically switches to custom input mode if no pods exist, and offers user-defined pod chips when available.
- **Batched Server Synchronization** — Batch category mutations use `skipScuttle=true` during item iteration with a single final `scuttleVault()` call to eliminate network race conditions.
- **Bitwarden-style Locked Dashboard** — `handleLogout` and session expiry now drop users into a locked dashboard state rather than a blank landing page. Users can seamlessly switch between known accounts or unlock the current one.
- **Initial Load Routing** — Reloading the app while completely logged out now properly selects the first known account and defaults to the locked dashboard view.

### Fixed
- **Pod Deletion & React Tree Desync** — Fixed pod deletion persistence and optimistic local state updates so deleted pods immediately disappear from the tree without server overwrite.
- **Agent Rate Limiter Execution Order** — Corrected middleware execution order in `createAgentKeyRateLimiter` so agent keys are authenticated before rate limits apply.
- **Typecleanliness & Generics** — Added generic typing (`<T>`) to `restAdapter.ts` HTTP helpers and fixed `Buffer` return in `deriveMetadataKey`.
- **State Hydration on Mount** — Fixed unhydrated vault state on initial login with reactive `useEffect` on `shellKey`.


### Added
- Per-row AES-256-GCM metadata encryption (title, username, url, category, notes, file_name)
- Triple-layer encryption model documentation across all project docs
- Security boundary table showing what each actor can access
- ClawKey backup guidance (2+ secure locations, lose key = lose everything)
- AGPL-3.0 license
- Per-row encryption and multi-user architecture ROADMAP items
- `fieldEncryption.ts` — core crypto module (HKDF + AES-256-GCM, native Node crypto)
- `metadataGuard.ts` — column registry + prepareWrite/prepareRead helpers
- `metadata-encryption.test.ts` — 13 tests in 3 groups (unit, API, backward-compat)
- Batch encrypt/decrypt scripts for legacy data migration
- Migration 0002 (no-op version tracker)

### Changed
- Port migration: 4545→5353, 4646→5454 across all config, Docker, tests, docs
- All vault routes (vault, notes, sshKeys, attachments) now async with metadata encrypt/decrypt
- `DB_ENCRYPTION_KEY` now governs both SQLCipher AND per-row metadata encryption
- README, SECURITY, ARCHITECTURE, BLUEPRINT, QUICKSTART updated for triple-layer model
- npm audit vulnerabilities fixed

### Fixed
- Integration fixes: test wiring, schema validation, import paths
- Test isolation: per-suite DATA_DIR and PORT allocation
