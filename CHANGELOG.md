# Changelog — ShellGuard

## [Unreleased]

### Added
- **Vault Lock Hardening & Mutation Denial** — Strict enforcement of `isLocked` guards across all pod management (`handleRenamePod`, `handleDeletePod`, `SidebarFolderTree`, `PodModal`), item mutations (`lockTheClaw`, `updateTheClaw`, item deletion), live search dropdowns, and header `+` add action menus.
- **Unified & State-Aware Navigation (`NavIntent`)** — Explicit `NavIntent` state tracking (`sg_nav_intent` in `sessionManager.ts`), preserving `"landing"` intent across reloads on manual logout ("Claw Out"), and preserving `"dashboard"` intent with quick unlock modal on lock/reload.
- **Zero Hardcoded Default Pods** — Completely user-driven pod model with zero hardcoded defaults (`DEFAULT_ROOT_PODS = []`, `INITIAL_DEFAULT_COLORS = {}`). Pods are only displayed when explicitly created by the user or when assigned to vault items.
- **Desktop Sidebar Collapse / Expand Toggle** — Added desktop sidebar toggle button with `PanelLeftOpen` and `PanelLeftClose` icons in the header.
- **Custom In-Modal Pod Deletion Flow** — Replaced browser native `window.confirm` with an animated, themed in-modal confirmation screen in `PodModal.tsx`.
- **Hierarchical Category Normalization & Cascading** — Normalized pod matching (`normalizePod`) across all mutations and queries, with sub-pod cascade support (`targetPod + "/"`).

### Changed
- **Header Breadcrumb Alignment** — Removed constrained `max-w-7xl` wrapper, aligning breadcrumb navigation flush with the left sidebar boundary.
- **Pod Deletion Cascade** — When a pod is deleted, items inside it are moved to uncategorized (`""`) instead of falling back to `"Personal"`.
- **Dynamic Pod Inputs & Suggestions** — `FolderInputGroup.tsx` now dynamically switches to custom input mode if no pods exist, and offers user-defined pod chips when available.
- **Batched Server Synchronization** — Batch category mutations use `skipScuttle=true` during item iteration with a single final `scuttleVault()` call to eliminate network race conditions.

### Fixed
- **Pod Deletion & React Tree Desync** — Fixed pod deletion persistence and optimistic local state updates so deleted pods immediately disappear from the tree without server overwrite.
- **Agent Rate Limiter Execution Order** — Corrected middleware execution order in `createAgentKeyRateLimiter` so agent keys are authenticated before rate limits apply.
- **Typecleanliness & Generics** — Added generic typing (`<T>`) to `restAdapter.ts` HTTP helpers and fixed `Buffer` return in `deriveMetadataKey`.

### Added
- **SuperLobster CaraBase Design Alignment (Phase 3)**:
  - `SuperLobsterPanel.tsx`: Added BouncyBrand header integration, live status indicators ("Reef Online"), and pill-style navigation tabs with Framer Motion section transitions.
  - `SuperLobsterStatus.tsx`: 3-card hero metric grid (Instance Engine, Triple-Layer Armor, Retention Policies), ambient defense-in-depth warning callout, and live uptime timeline.
  - `SuperLobsterUsers.tsx`: 6-metric summary ribbon (Lobsters, Pearls, Notes, Keys, Files, Agent Keys), search toolbar with instant match counts, avatar badge glass table, and strict cascade delete modal.
  - `SuperLobsterSettings.tsx`: Env-locked crypto keys notice, grouped configuration cards with preset quick-chips, and animated save toast.
  - `SuperLobsterBackups.tsx`: Hero backup switch card, offline recovery CLI protocol card (`scuttle:restore`), and backup manifest ledger.
  - `SuperLobsterAudit.tsx`: Filter chips (All, Admin, Auth, Mutations, Failures), color-coded event badges, and sovereign `SUPERLOBSTER` actor pill.
- **`#/admin-login` alias route** — hash routing accepts both `#/super-lobster` (canonical) and `#/admin-login` for URL parity with CaraBase
- **`src/components/ui/BouncyBrand.tsx`** — per-letter spring-physics brand mark ("Shell" in lobster-red, "Guard" in claw-cyan), hover-bouncy, adapted from CaraBase's BouncyBrand using ShellGuard's own design tokens
- **SuperLobsterLogin visual refresh** — centered brand header (shield → BouncyBrand → title → tagline "The Reef is sealed. Sovereign access only."), red top-accent border, cyan focus ring, hover-glow button — CaraBase polish with ShellGuard tokens

### Added
- **Multi-User Frontend Architecture** — Introduced `QuickLoginModal` for re-authentication and importing accounts natively over the dashboard view, avoiding full-page navigation context loss.
- **Background Account Locking** — Added ability to manually lock specific inactive accounts directly from the Header account switcher.
- **SuperLobster Panel** — instance admin plane at `/#/super-lobster` (URL-only entry), gated by `ADMIN_TOKEN` (503/disabled when unset): strict-metadata Lobsters overview with transactional cascade delete (`expect` confirmation, before-count audit), read-only Reef Status, whitelist-only system settings, Audit Reef viewer, uptime history
- **Failsafe backups** — Online Backup API snapshots of `db.sqlite` + `audit.sqlite` to `DATA_DIR/backups/` with manifest (SHA-256, key note) and rotation; admin toggle + scheduler + "Back up now"; **no download, no HTTP restore** (offline procedure per ADMIN.md §5 + `scuttle:restore` validator script)
- `src/server/middleware/requireAdmin.ts` — volatile admin sessions (20-min sliding, httpOnly SameSite=Strict cookie)
- `src/server/routes/admin.ts`, `src/server/utils/backupManager.ts`, `scripts/restore.ts`
- `tests/admin.test.ts` — 15 tests: panel enablement, auth flows, strict-metadata invariant, cascade delete, settings whitelist, backups/rotation/verify, cross-guard isolation

### Changed
- **Bitwarden-style Locked Dashboard** — `handleLogout` and session expiry now drop users into a locked dashboard state rather than a blank landing page. Users can seamlessly switch between known accounts or unlock the current one.
- **Initial Load Routing** — Reloading the app while completely logged out now properly selects the first known account and defaults to the locked dashboard view.
- Password attachments reworked to reference model: each uploaded file is stored as its own ShellCrypted `vault_secure_attachments` record; `vault_pearls.attachments` now holds a JSON array of attachment IDs (was: freeform URL/reference text)
- Attachment per-file hard cap tightened from ~28MB to 10 MB (zod: 14M-char `file_data` blob)

### Added (attachments rework)
- File upload UI for password add/edit forms (click-to-browse + drag-and-drop, unlimited attachments, one file each, 10 MB client-side validation with friendly error)
- Per-attachment download buttons on password cards and in the edit modal (decrypts client-side, triggers browser download)
- Pearl DELETE cascade-deletes linked attachments (ownership-scoped, audit-logged per attachment)
- `src/lib/attachmentUtils.ts` — shared client helpers (MAX_ATTACHMENT_BYTES, parseAttachmentIds, formatBytes, downloadAttachment)
- 3 new vault-crud tests: cascade delete, malformed attachments column, cross-owner cascade isolation

## [0.2.0] - 2026-08-27

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
