# Changelog

## [0.0.2.2] - 2026-09-19 — The Bioluminescent Reef

### Added
- **Vault Tagging System & Granular Filter Bar** — Multi-dimensional categorization alongside hierarchical pods (Phase 20, Tasks 39/40):
  - Migration `0006_vault_tags` adds `tags TEXT DEFAULT '[]'` column and owner index across `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys`.
  - Layer 2 MetadataGuard encryption for all tag payloads at rest.
  - API list routes support `?tags=a,b` intersection filtering with ownership scoping and forensic audit logging.
  - `TagSelectorInput` autocomplete chips with inline color palette selection.
  - Unified bioluminescent color engine (`podUtils.ts`) — shared `hashStringToColor` for pods AND tags with explicit user overrides.
  - Collapsible sidebar tag cloud with item counts in `SidebarFolderTree.tsx`.
  - Granular multi-filter bar with `AND` / `OR` toggle in `ItemListPane.tsx`; tag pill badges in `ItemDetailPane.tsx`.
- **500MB Attachment Storage Ceiling** — Per-file upload ceiling raised from 50MB to 500MB (`ATTACHMENT_MAX_MB`); grotto quota raised from 500MB to 1000MB (`GROTTO_QUOTA_MB`); nginx proxy body size guidance elevated to 60M. (Phase 20 Sub-task.)
- **SSH Key Dual-Key Architecture & Terminal Ergonomics** — Dual-key serialization envelope (`parseSshKeySecret`/`serializeSshKeySecret`) with backward compatibility for legacy raw PEMs; strict RFC 7468 PKCS#8 framing preventing JSON unmasking leaks; clean multi-line PEM code block display; one-click **Download .pem**, **Copy Public Key**, and **Copy `authorized_keys` Command**.

### Fixed
- Vault master-detail header flush: item-list header and Item Details header pinned to shared 64px height for continuous T-junction line.
- Version resolver test de-hardcoded: `tests/unit/version.test.ts` now asserts package.json ground truth + `X.Y.Z.N` shape only (was a latent literal `'0.0.1.8'` assertion).

### Changed
- Documentation-to-code parity alignment: 12 contradictions resolved across docs and UI (8 obsolete "10 MB" base64 references → 500MB BLOB reality, ARCHITECTURE.md unfrozen from v0.0.1.9 to v0.0.2.1, rate-limiter conflation fixed, blueprint-schema header synced to migrations 0001–0006).

## [0.0.2.1] - 2026-09-18
### Added
- Attachment native BLOB storage (migration 0005 + idempotent backfill), streamed multipart wire contract, 50MB/file + 500MB/owner quota (413), progress/cancel uploads, encrypted previews, Eye-beside-Copy ergonomics (Phase 19, Tasks 37/38)
### Changed
- Attachment PUT metadata-only; 32mb scoped JSON parser retired; agent contracts (SKILL.md, api-reference) re-synced to the BLOB contract
 — ShellGuard

## [0.0.2.0] - 2026-09-17 — The Composite Reef (Phase 18, Build 20)
### Added
- In-browser SSH keypair engine (Ed25519/RSA-4096, ssh-keygen-verified) + Bitwarden-style SSH key section (Tasks 35/36)
- Pod-tally decoupling locked by tests; keypair docs (the-grotto, blueprint-schema)
### Changed
- ROADMAP sliding window (P15→history, P18→completed); spine Stage 19 shipped; build labels swept +1

## [0.0.1.10] - 2026-09-16

### Changed
- **The Auditable Corpus** — the full docs-governance arc: genome chronology restored (spine `Stage N = Phase N−1`, Stage 18.5 interlude, 26/26 links), ROADMAP TOTP-chronology reorg (frontmatter, inline interlude, 15→16→17), root-docs v0.0.1.9 truth-sync + ClawKey canon (ARCHITECTURE § The ClawKey Method, deltas #19/#20), docs/ portal truth-sync, the ClawKey canon in 14 UI strings, the bidirectional docs↔code audit (8 lies corrected — docs bow to code), Phase 24 queued (Tasks 47/48, v0.0.2.6/Build 26) with Documentation Impact crawl, the Decision Log adopted, and the lens in the bank (Third-party-auditable standard + Auditability Invariants).

## [Unreleased] - 2026-09-15

### Changed
- **Genome chronology restored (Option C)** — original queue order stands: Phases 18–21 ahead of 22/23. Meta-prompt spine renumbered **Stage N = Phase N−1** (hotfix → Stage 18.5 Post-Summit Interlude, TOTP decimal pattern); new queued stages 19–24 authored/transcribed for Phases 18–23; mermaid extended through Summit; Summit section given its receipt-honest closing. Link audit: 26/26 roadmap links resolve — Stage 15's dangling Phase-14 anchor repaired to ROADMAP-HISTORY, partial Phase 22/23 anchors completed to full heading slugs, 13 archive link-texts corrected. Migration knock-on under restored order: Phase 19 owns `0005_attachment_blobs`, Phase 23 integrity renumbers to `0006`, Phase 20 tags to `0007`. ROADMAP.md reorganized to match: YAML frontmatter (current_position), hotfix record moved to a Post-Hoc Interlude after Phase 17, Completed Releases reordered 15->16->17 with [x] checkboxes, archive banner span corrected to Phases 1-14, Phase 5 table row truth-fixed (Baseline: v0.0.0.5), migration numbers swept (0005 title fix, tags 0007). Root-docs coherence pass: ARCHITECTURE.md synced to v0.0.1.9 (ClawKey Method section + canon box, migration 0004/keyLedger.ts in tree, classDiagram key_hash/key_fingerprint, pod-purity constraint, 15-suite table, deltas #19/#20); SECURITY.md gained the v0.0.1.9 Key Ledger Hardening narrative; BLUEPRINT.md schema matches migration 0004 (plaintext api_key column removed); ClawKey/LobsterKey canon in README/QUICKSTART; 14 user-facing UI strings renamed ShellKey(TM) -> ClawKey(TM) (web + Android now say the same word; internals deriveShellKey/shellKey kept as cross-project contracts). Gates: 15 files / 210 tests, vite build clean. docs/ portal truth-sync: reference/blueprint-schema.md synced to migration 0004 (key_hash/key_fingerprint, pod purity, hash-only-ledger note); privacy.md vault.sqlite -> db.sqlite + ClawKey canon + HKDF-salt truth; glossary/key-molting/lobster-keys corrected (base62 alphabet, canRead/canWrite/canEdit/canDelete masks, user-UUID salt, Human Key kept as legacy alias); portal build green (vitepress 26.7s), 34/34 nav links, zero truth-scan hits. Bidirectional docs<->code audit: 8 docs-lies corrected against verified code (PRAGMA rekey not sqlcipher_export; authLimiter 10/15m not 5; identity file shellguard_identity_<username>.json with 5-field shape; phantom customFields.ts; tls.ts -> tlsManager.ts; crypto.ts export names; fifth canMove mask + 7 wizard presets; custom-field AAD = <table>_custom:{id}). Docs bow to shipped secure behavior; portal build green 26.0s; claim battery zero red.

## [0.0.1.9] - 2026-09-13

### Added
- **/project reverse-build genome** — meta-prompt spine (Stage 0→18), receipt-backed ROADMAP (16 phases / 32 task pairs), 10 spec oracles incl. new `shellcryption-spec.md`; Phases 1–13 archived to ROADMAP-HISTORY (sliding window).
- **Phase 17 — Key Ledger Hardening** — migration 0004 + keyLedger.ts: SHA-256 hash-only `lb-` ledger, in-place backfill (legacy keys keep authenticating), api_tokens owner re-pointed to agent id, ledger rebuild + VACUUM (byte-level plaintext retirement).
- **Pod purity** — DEFAULT 'Personal' dropped from all 4 category columns; `category || 'Personal'` fallback removed in vault/notes/sshKeys/attachments; uncategorized = "".
- **LobsterKeys card — CaraBase 1:1 key row** — masked by default (FULL-value mask), Eye toggle, Copy w/ feedback; fingerprint listed; one-time wizard reveal.

### Fixed
- **Genome coherence audit** — 50 dangling refs repointed; key-alphabet claims corrected hex→base62 (ARCHITECTURE + key-hierarchy-spec); stale token-storage wording removed; old buggy metadata-encryption category test rewritten to the uncategorized contract.

### Security
- `lb-` agent keys: plaintext storage eliminated; sentinel + rate limiter on stored hashes; partial masking banned (NEVER-list).

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
- **Reverse-Build `/project` Genome**: New `project/` directory — a 1:1 mirror of the ShellGuard-TOTP document-compiler system, reconstructed post hoc from git history. Meta-prompt spine (Stage 0 "void" → Stage 17 summit), reverse-built ROADMAP (16 phases / 32 task pairs, `v0.0.0.0` → `v0.0.1.8`, every phase receipt-matched to real commits), and 9 spec oracles (architecture, database-schema, routes-and-contracts, key-hierarchy, encryption-layers, verification-gates, admin-suite, ui-ux-design-system, import-export). Anyone cloning the repo can rebuild the exact application from `/project/` alone. 27 commits on `docs/reverse-project`.
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
