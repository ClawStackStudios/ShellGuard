# Changelog — ShellGuard

## [0.0.1.4] - 2026-08-29

### Fixed
- **Pure TypeScript WebCrypto Fallback Engine**: Built zero-dependency implementations of SHA-256, HMAC-SHA256, HKDF, and AES-GCM-256 in `src/lib/webCryptoFallback.ts`, transparently polyfilling `crypto.subtle` when accessing ShellGuard over plain HTTP LAN origins (e.g. Unraid LAN IPs) where `window.crypto.subtle` is undefined.
- **Global Drag-and-Drop Shield**: Attached global `window` `dragover` and `drop` `e.preventDefault()` handlers to prevent browsers from accidentally navigating away when files are dropped outside active dropzones.
- **TOTP QR Code Blob Downloads**: Swapped raw `data:` URI link downloads with in-memory Blob streams in `GeneratorToolView.tsx`.

## [0.0.1.3] - 2026-08-29

### Changed
- **Iconography & Favicon**: Integrated official `shellguard-icon.svg` as root `public/favicon.svg`, linked into `index.html`, and updated `shellguard-unraid-template.xml` Icon URL.

### Fixed
- **Documentation Hygiene**: Purged obsolete legacy breaking-change warnings and legacy data-wiping migration text; re-aligned all references in `ROADMAP.md`, `README.md`, `QUICKSTART.md`, `ARCHITECTURE.md`, `CRUSTAGENT.md`, and docs to `v0.0.1`.

## [0.0.1.2] - 2026-08-29

### Fixed
- **Insecure Origin UUID & Entropy Fallback** — Added multi-tier RFC 4122 v4 UUID generator and secure entropy fallback in `src/lib/crypto.ts` for non-secure HTTP browser origins where `window.crypto.randomUUID` is undefined.
- **LAN HTTP Insecure File Downloads** — Replaced raw `data:` URI links with in-memory `Blob` and `URL.createObjectURL(blob)` in `downloadIdentityFile` and `downloadAttachment` to eliminate Chromium insecure-connection download blocks.

## [Unreleased]

### Added
- **ShellGuard-TOTP `sgtotp.bak` Import (Compatibility Layer)**: Settings → Import & Export now accepts Android `sgtotp.bak` backups — encrypted `shellguard-totp-backup-v1` envelopes, plaintext `shellguard-totp-plain-export-v1` exports, and bare item arrays. Encrypted envelopes are decrypted locally in the browser (HKDF-SHA256 with the export key + envelope `ownerUuid` salt, AES-GCM-256, AAD `totp_backup:{ownerUuid}`) with enforced SHA-256 integrity verification. Items map to fresh `vault_pearls` (new UUIDs, Base32-normalized seeds, `normalizePod()` categories) and are re-encrypted client-side under `vault_pearls_totp:{id}` — zero-knowledge intact, export key never transmitted. New `src/lib/sgtotpBackup.ts` + 22 tests in `tests/unit/sgtotpBackup.test.ts` including a full cryptographic round-trip fixture. Imported items mirror back down to the Android app on its next sync cycle.
- **Bitwarden-Style Custom Fields**: Support for user-defined `Text`, `Hidden`, `Checkbox`, and `Linked` custom fields on vault items (pearls, notes, SSH keys). Fully secured with client-side ShellCryption (AES-256-GCM) zero-knowledge encryption. Migration 0003 adds `custom_fields TEXT` column. UI editor in `ItemFormModal` with per-field-type controls. Display in `ItemDetailPane` with mask/reveal, copy, boolean chip, and linked property resolution (including live TOTP codes). JSON export includes custom_fields. Audit isolation maintained — agents can write custom fields but never read decrypted values.
- **Zero Hardcoded Default Pods**: emptied `DEFAULT_ROOT_PODS`, `DEFAULT_SUGGESTED_PODS`, and `INITIAL_DEFAULT_COLORS` in `podUtils.ts`. `normalizePod()` now returns `""` when empty (was `"Personal"`). All pods are now 100% user-created — no "Personal", "Work", or any other default forced into the tree. `FolderInputGroup` dynamically adapts: shows existing pods as quick-chips or unobtrusively switches to custom input when empty.
- **Pod deletion with optimistic local state updates**: `handleDeletePod` and `handleRenamePod` in `App.tsx` now use `normalizePod()` for all category comparisons, apply immediate optimistic local state mutations (`setVaultItems(prev => prev.map(...))`) for instant UI feedback, and batch server syncs using the `skipScuttle` flag.
- **`restAdapter` generic types and PATCH method** — all adapter methods now support `<T>` type parameter; PATCH method added for partial updates.
- **`buildPodTree` and `getAllUniquePods` improvements** — both functions now handle uncategorized items cleanly (empty/undefined categories produce no tree entries). `getAllUniquePods` draws from `getStoredPodColors()` and item categories only — no hardcoded defaults.

### Changed
- **`normalizePod` behavior**: returns `""` for empty/null input instead of defaulting to `"Personal"`. All downstream functions (`getPodColor`, `setPodColor`, `deletePodColor`, `getPodSegments`, `isItemInPod`, `getAllUniquePods`) updated with guards for empty normalized values.
- **`getStoredPodColors`**: returns `{}` instead of merging `INITIAL_DEFAULT_COLORS`.
- **`getPodColor`**: accepts optional string; returns first palette color (`POD_COLOR_PALETTE[0]`) when input is empty.
- **All vault item decryption in `scuttleVault`**: fallback category changed from `p.category || "Personal"` to `p.category || ""`.
- **Port migration: 5353→6464, 5454→6565** — ShellGuard's web UI and API now live on :6464 and :6565 respectively, fully disentangled from CaraBase's port claims (5353/5454). All 26 source files, test ports (5454X → 6464X), Docker, Compose, Unraid template, docs, and both memory banks updated. 155 tests pass, build clean, live smoke verified on both new ports.

### Fixed
- **Pod deletion/rename state sync**: categories now normalized via `normalizePod()` before comparison, fixing silent failures where unnormalized strings with spaces or slash differences caused the filter to return 0 items and skip updates entirely.
- **`scuttleVault` race condition with batch operations**: `skipScuttle` flag prevents concurrent GET re-fetches from overwriting in-flight PUT requests during batch pod operations.
- **SuperLobster routing gate** — `App.tsx` now renders `SuperLobsterGate` (auth check → login or panel) instead of `SuperLobsterPanel` directly, which previously bypassed the admin auth gate entirely and could blank/bug the panel at `#/super-lobster` on unauthenticated load

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

### Technical Decisions
- Native Node `crypto` (NOT `crypto.webcrypto.subtle` which hangs in this environment)
- In-place encryption: no schema changes, encrypted JSON in same TEXT columns
- Backward compatibility: legacy plaintext passes through on read
- `SG-META` envelope deliberately distinct from ShellCryption's `AES-GCM-256`

---

## [0.1.0] - 2026-08-24

### Added
- Initial ShellGuard setup from ClawChives v3.4.0 twin
- Auth parity (register/token/validate + SG-only me/profile)
- Zero-knowledge invariant (ShellCryption blobs with AAD binding)
- Domain API parity (pearls, notes, SSH keys, attachments)
- LobsterKeys lifecycle (create/revoke/delete)
- Test harness (auth-flow, security, vault-crud, settings, build-gates)
- Containerization (Dockerfile, compose, Unraid template)
- CI (docker-publish → GHCR)
- Documentation suite (README, ARCHITECTURE, SECURITY, QUICKSTART, etc.)
