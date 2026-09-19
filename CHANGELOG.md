# Changelog — ShellGuard

## [0.0.2.2] - 2026-09-19

### Added
- **Vault Tagging System & Granular Filter Bar** — Multi-dimensional categorization alongside hierarchical pods (Phase 20, Tasks 39/40):
  - Migration `0006_vault_tags` adds `tags TEXT DEFAULT '[]'` column and owner indices across `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys`.
  - Layer 2 metadata encryption via `MetadataGuard` for all tag payloads stored on disk.
  - API list routes support `?tags=a,b` intersection filtering with forensic audit logging.
  - `TagSelectorInput` with autocomplete chip suggestions, keyboard creation, and inline color palette selection.
  - Unified bioluminescent color engine (`podUtils.ts`) sharing palette between pods and tags with deterministic string hashing and headless-safe storage.
  - Collapsible sidebar tag cloud with active counts and granular multi-tag filter bar with `AND` / `OR` intersection logic.
- **Attachment Storage Ceiling Elevation** — Per-file upload ceiling raised from 50MB to 500MB (`ATTACHMENT_MAX_MB`) and grotto quota from 500MB to 1000MB (`GROTTO_QUOTA_MB`) with Busboy streaming validation and client dropzone alignment (Phase 20 Sub-task).
- **SSH Key Dual-Key Management & Terminal Ergonomics**:
  - Dual-key serialization architecture `{ publicKey, privateKey }` sealed under Layer 1 ShellCryption, with transparent backward compatibility for raw legacy PEM keys (`parseSshKeySecret`).
  - Strict RFC 7468 PKCS#8 private key framing (`-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----`) preserving clean multiline formatting for OpenSSH and GUI clients.
  - Dedicated private key code block with unmask toggle immediately left of Copy, plus direct in-browser **Download .pem** file action.
  - OpenSSH public key card featuring algorithm badge, one-click **Copy Public Key**, and instant **Copy `authorized_keys` Command** (`echo "<pub>" >> ~/.ssh/authorized_keys`) for remote terminal paste.
  - Decoupled form modal fields providing independent inputs for private key PEM and public key string, preventing JSON serialization leaks.

### Fixed
- **Vault master-detail header flush:** the item-list (search) header and the Item Details header are pinned to a shared 64px height (`h-16`), so their bottom borders form one continuous line across the dashboard T-junction instead of stepping (left bar rendered ~59px vs right ~64px).
- **Version resolver test de-hardcoded:** `tests/unit/version.test.ts` asserted a literal `'0.0.1.8'`, which silently failed after every version bump (latent failure shipped in v0.0.1.9). The invariant is now package.json ground truth + `X.Y.Z.N` shape only.

## [0.0.2.1] - 2026-09-18
### Added
- **Attachment BLOB storage** — native SQLite BLOB column for encrypted file payloads (migration 0005, in-code idempotent backfill of legacy TEXT rows); base64 storage inflation eliminated (Phase 19, Tasks 37/38)
- **Streaming wire contract** — multipart (Busboy) uploads of already-encrypted bytes; metadata-only list responses; chunked 1MB BLOB downloads via `GET /api/attachments/:id/file`
- **Storage limits, fail-closed** — 50MB per-file ceiling (`ATTACHMENT_MAX_MB`) and 500MB grotto quota per owner (`GROTTO_QUOTA_MB`), both yielding `413` and storing nothing on breach
- **Streaming attachment UI** — real-time upload progress bars with cancel, on-demand streamed decryption (client-side; the server never sees plaintext), and encrypted inline previews for images and PDFs (Blob object URLs)
- **Eye-beside-Copy ergonomics** — Unmask toggle immediately LEFT of Copy on every masked field row (folded forward from Phase 22 Task 44; full-value mask invariant intact)

### Changed
- Attachment PUT is metadata-only — file replacement re-uploads; the scoped 32mb JSON body parser is retired with the base64 wire contract it served

## [0.0.2.0] - 2026-09-17
### Added
- In-browser SSH keypair generation (WebCrypto Ed25519 / RSA-4096) with ssh-keygen-verified output, public-key copy + PKCS#8 private download; private keys sealed client-side (Phase 18, Tasks 35/36)
- SSH private-key input in the item form (previously API/drag-drop only) + public-key display in the detail pane; extra fields extended to SSH keys
- Pod-tally decoupling locked by tests (attachments never inflate folder badges)
- Mermaid diagram rendering: VitePress plugin + GitHub-parseable labels; navigation-link integrity suite

### Changed
- README reorganized to the TOTP discipline (grouped features, merged encryption sections, collapsible references)
- Roadmap queue chain includes Phase 24; cryptologist's lens sealed into long-term memory

## [0.0.1.10] - 2026-09-16

### Changed
- **The Auditable Corpus** — 34-commit documentation-and-governance arc with zero runtime changes: genome chronology restored (spine `Stage N = Phase N−1`, TOTP decimal-interlude pattern, 26/26 roadmap links), ROADMAP reorganized top-down chronological (frontmatter `current_position`, inline hotfix interlude, Completed Releases 15→16→17), and the docs/ portal truth-synced to migration 0004.
- **The ClawStack Canon** — ClawKey / ShellCryption / LobsterKeys written into ARCHITECTURE (§ The ClawKey Method) and the UI (14 user-facing strings renamed ShellKey™ → ClawKey™); web and Android now say the same word.
- **Bidirectional docs↔code audit** — 8 docs-lies corrected against verified code (PRAGMA rekey, limiter counts, identity-file shape, phantom customFields.ts, tlsManager.ts, shipped crypto exports, the fifth `canMove` mask, `_custom` AAD namespaces); privacy policy corrected (`db.sqlite`/`audit.sqlite`, base62 alphabet, user-UUID HKDF salt).
- **Phase 24 queued** — Cryptographic Audit Hardening & Third-Party Auditability (Tasks 47/48, provisional v0.0.2.6/Build 26): fallback vector parity, constant-time sweep, the claim battery as a CI gate, and the auditor's threat-model addendum. Documentation Impact blockquotes embedded in every queued phase (18–24).
- **Decision Log adopted** — `.clinerules/memory-bank/decision-log.md` (episodic navigation record, 20-entry window); the lens entered the bank declaratively (Third-party-auditable standard in projectBrief, Auditability Invariants in systemPatterns).

## [0.0.1.9] - 2026-09-13

### Changed
- **Lobster Keys Card UI — CaraBase 1:1 Key Row:** the card's key display row now matches CaraBase exactly (masked by default with the verbatim `maskKey()` algorithm — first 6 + •••••••••••• + last 4 — Eye/EyeOff toggle, Copy with 2s Copied feedback). The row operates over the SHA-256 fingerprint (hash ledger intact — the plaintext key appears exactly once, in the wizard). Tab heading/subtitle and delete-confirmation wording aligned to CaraBase verbatim.
- **Root Documentation Systemic Alignment:** Reconciled `ARCHITECTURE.md`, `BLUEPRINT.md`, `SECURITY.md`, `README.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `ADMIN.md`, and `docs/superlobster/management.md` to reflect runtime schema truth (`agent_keys`, `lobsters`, `(owner_uuid, key)`, `custom_fields`), 14 Vitest suites (204 unit tests), Bitwarden-style Custom Fields, Native LAN TLS, pure-TS WebCrypto fallback engine, `sgtotp.bak` Android backup imports, and Zero-Waste Release Automation.
- **Dead Link Remediation:** Replaced legacy/broken references to `CRUSTSECURITY.md` and relative `CRUSTAGENT.md` across root documentation with canonical links to `docs/`, `docs/privacy.md`, `.agents/`, and `src/CRUSTAGENT.md`.
- **Dynamic Application Version Resolver:** Introduced `src/server/utils/version.ts` (`getAppVersion()`) dynamically resolving from `package.json` with multi-tier fallback, replacing fragile environment variable reads in `src/server/routes/admin.ts`, `src/server/utils/backupManager.ts`, and `server.ts` to ensure consistent `v0.0.1.8` presentation in the SuperLobster Admin Panel.
- **Package Lockfile Parity:** Synchronized top-level package version in `package-lock.json` to `0.0.1.8`.

### Added
- **ShellCryption Client-Side Encryption Oracle (`project/shellcryption-spec.md`):** 10th spec oracle — HKDF derivation (ikm=`hu-` key, salt=userUuid, info=`clawchives-shellcryption-v1`), envelope format, AAD namespace registry, decrypt passthrough ladder, engine selector, and the zero-knowledge invariants. Resolves the last dangling reference in the genome.
- **Phase 17 Implemented — Key Ledger Hardening & Pod Purity (Tasks 33/34) [SECURITY]:** `lb-` agent keys are now stored as SHA-256 hashes only — the plaintext `api_key` column is retired via migration 0004 + in-place backfill (legacy keys keep authenticating; live agent tokens re-pointed from raw-key owner_uuid to agent row id; ledger VACUUMed so no plaintext ghost pages remain). Mint returns plaintext exactly once; every list response carries only the fingerprint; the key card shows the `HASHED` fingerprint. The hardcoded `DEFAULT 'Personal'` is purged from all four category columns and the `category || 'Personal'` fallback removed from vault/notes/sshKeys/attachments — uncategorized items persist as `""`. Proven by `tests/agent-key-hash.test.ts` (6 tests: DB byte-scan, raw exchange, sentinel, revoke, uncategorized, legacy-backfill unit oracle) — all suites green.
- **Version Resolver Unit Tests:** Added `tests/unit/version.test.ts` asserting semver compliance and package ground-truth matching.

## [0.0.1.8] - 2026-09-04

### Added
- **Full Documentation Bridge Parity & Missing Index Hubs:** Built and integrated missing top-level index pages across the canonical documentation portal:
  - `docs/vault-features/index.md`: Hub for zero-knowledge vault features, Grotto pod hierarchy, Bitwarden-style custom fields, file attachments, generator, and import/export.
  - `docs/deployment/index.md`: Hub for self-hosting infrastructure, unified container runtime, production environment variables matrix, and health check monitoring.
  - `docs/reference/index.md`: Hub for database schemas, design tokens, terminology glossary, mobile companion, and legal compliance.
- **Bitwarden-Style Custom Fields Documentation:** Documented in `docs/vault-features/the-grotto.md` covering all 4 field types (`Text`, `Hidden`, `Checkbox`, `Linked`) and client-side ShellCryption AAD namespaces (`vault_pearls_custom:{id}`).
- **Native LAN TLS & WebCrypto Fallback Documentation:** Documented in `docs/deployment/reverse-proxy.md` and `docs/deployment/unraid.md` covering persistent self-signed EC P-256 certificate generation (`TLS_ENABLED=true`) and pure TypeScript WebCrypto fallback for insecure HTTP LAN IPs.
- **ShellGuard-TOTP Android Backup Import Documentation:** Documented in `docs/vault-features/import-export.md` covering client-side format sniffing, interactive passphrase prompt, HKDF-SHA256/AES-GCM-256 decryption, AAD verification, and pod normalization.
- **ShellGuard-TOTP Native Companion Documentation Suite:** Published comprehensive documentation portal for the Android 2FA companion under `docs/companion/`:
  - `docs/companion/index.md`: System topology, One-Way Mirror Sync architecture, Mermaid dataflow, and key capabilities.
  - `docs/companion/security.md`: Android KeyStore (TEE / StrongBox Keymaster), `BiometricPrompt` zero-exposure biometrics, `FLAG_SECURE` window screenshot protection, and in-memory cryptographic zeroization.
  - `docs/companion/sync-and-backups.md`: Encrypted `.sgtotp.bak` (`shellguard-totp-backup-v1`) wire format, HKDF-SHA256, AES-GCM-256 with AAD verification, and client-side web vault import walkthrough.
  - `docs/companion/totp-engine.md`: RFC 6238 mathematical computation model (HMAC-SHA1/256/512), RFC 4648 Base32 sanitization, `otpauth://` URI parameter decoding, and CameraX + ML Kit real-time barcode scanning.
- **VitePress Portal Integration:** Added top-level `Mobile Companion` navigation item and sidebar group to `docs/.vitepress/config.ts`, added companion card to `docs/index.md`, and cross-linked privacy disclosures.
- **Official Privacy Policy & Google Play Store Compliance:** Established canonical `docs/privacy.md` with explicit regulatory and technical disclosures (zero data collection, zero telemetry, local in-memory CameraX QR scanning, hardware Keystore biometric isolation, Storage Access Framework backups, and `FLAG_SECURE` window protection).
- **Dedicated ShellGuard-TOTP Android Companion Specification:** Added Section 5 in the privacy policy with a direct deep-link anchor (`#shellguard-totp-android-companion`) and a Google Play Data Safety Fast-Card table for app store submission.
- **VitePress & UI Navigation Touchpoints:** Integrated Privacy Policy into VitePress Reference sidebar, route mapping (`/privacy`), documentation footer, and the web application `LandingView` footer.

### Fixed
- **Genome Coherence Audit:** repointed 50 dangling `project/ROADMAP.md` references to the roadmap system (root sliding window + `ROADMAP-HISTORY.md` archive); corrected key-material alphabet claims (hex → base62) in `ARCHITECTURE.md` and `key-hierarchy-spec.md`; removed stale token-storage wording from `routes-and-contracts.md`; genome README/meta-prompt updated for the 10-oracle, 17-phase state.
- **Database Schema Ground Truth Correction:** Fully reconciled `docs/reference/blueprint-schema.md` with actual migrations and runtime database tables: corrected `lobsters` table name (previously mislabeled `users`), primary keys (`id` vs `uuid`), `agent_keys` table name (previously `lobster_keys`), added `custom_fields` column, added indexes, and documented `audit_logs` in `audit.sqlite`.
- **Health Check Documentation Parity:** Updated `docs/getting-started/quickstart.md` and `docs/deployment/index.md` with the exact JSON payload returned by `GET /api/health` from `server.ts`.

### Changed
- **Test Engine Sequential Stability:** Configured `fileParallelism: false` in `vitest.config.ts` to prevent Express port and SQLite migration lock contention across full-suite test runs.

## [0.0.1.7] - 2026-09-03

### Added
- **`sgtotp.bak` Import Compatibility Layer:** Built `src/lib/sgtotpBackup.ts` supporting full client-side parsing and decryption of ShellGuard-TOTP Android backups. Handles encrypted `shellguard-totp-backup-v1` envelopes (HKDF-SHA256, AES-GCM-256 with AAD `totp_backup:{ownerUuid}` verification and enforced byte-exact SHA-256 integrity checksums), `shellguard-totp-plain-export-v1` plaintext files, and bare JSON arrays.
- **Client-Side Export Key Decryption Modal:** Extended `ImportExportView.tsx` with dynamic format sniffing and an interactive prompt modal for decrypting encrypted `.bak` files without transmitting plaintext keys or seeds to the server.
- **Base32 Normalization & Pod Mapping:** Automatically sanitizes Base32 secret seeds (stripping spaces/hyphens and uppercasing), assigns fresh web UUIDs, and normalizes category pods using `normalizePod()`.
- **Cross-Ecosystem Topology & Links:** Documented the One-Way Mirror Sync architecture in `ARCHITECTURE.md` and `compatibility_layer.md`, and linked directly to [ShellGuard-TOTP Releases](https://github.com/ClawStackStudios/ShellGuard-TOTP/releases) in `README.md`.
- **Identity & Architectural Constraints:** Integrated `AGENTS.md` defining Antigravity/Gemini operational posture, memory bank invariants, and verification loop rules.
- **22 Dedicated Vitest Tests:** Implemented comprehensive unit test suite in `tests/unit/sgtotpBackup.test.ts` verifying cryptographic roundtrips, wrong-key rejection, checksum verification, AAD defense, and parser edge cases.

### Fixed
- **TypeScript Type Invariants:** Resolved compiler errors in `src/lib/sgtotpBackup.ts` and `src/components/Settings/ImportExportView.tsx` by adding `ParsedSgTotpBackup` and propagating `created_at` timestamps on candidate imports.

## [0.0.1.6] - 2026-08-30

### Added
- **Native LAN TLS (self-signed):** `TLS_ENABLED=true` generates a persistent 10-year EC P-256 certificate on first boot (`DATA_DIR/certs/`, `0o600`) with SANs covering localhost + every detected LAN interface — one browser warning, accepted once, valid across restarts. Bring-your-own PEM pair via `TLS_CERT_PATH`/`TLS_KEY_PATH`. HTTPS-only listener (plain HTTP refused when enabled), HSTS activated, Docker healthcheck TLS-aware, graceful fallback to HTTP with a warning if TLS materials fail. New dependency: `selfsigned` (pure JS). Documented in SECURITY.md § Transport Security and QUICKSTART § LAN HTTPS.

## [0.0.1.5] - 2026-08-29

### Added
- **Bitwarden-Style Custom Fields:** Implemented client-side ShellCrypted custom fields supporting all 4 standard field types (`Text`, `Hidden`, `Checkbox`, and dynamic `Linked` properties to username/password/url/notes/totp).
- **Custom Field AES-GCM Zero-Knowledge Namespaces:** Custom fields are encrypted in-memory with separate AAD namespaces (`vault_pearls_custom:{id}`, `vault_secure_notes_custom:{id}`, `vault_ssh_keys_custom:{id}`). Server DB migration `0003_custom_fields.up.sql` stores opaque ciphertext across vault pearls, secure notes, and SSH keys.

### Changed
- **Unified "Add Extra Field" Dropup:** Consolidated the separate custom field action button into the primary "+ Add Extra Field" selection menu with an animated upward dropup menu and click-outside dismissal.
- **Master-Detail ItemFormModal Layout Polish:** Enhanced item create/edit modal with pinned header, pinned action footer, fixed `max-w-3xl` spacious width, and sleek internal element scrolling.

## [0.0.1.4] - 2026-08-29

### Fixed
- **Pure TypeScript WebCrypto Fallback Engine:** Built zero-dependency implementations of SHA-256, HMAC-SHA256, HKDF, and AES-GCM-256 in `src/lib/webCryptoFallback.ts`, transparently polyfilling `crypto.subtle` when accessing ShellGuard over plain HTTP LAN origins (e.g. Unraid LAN IPs) where `window.crypto.subtle` is undefined.
- **Global Drag-and-Drop Shield:** Attached global `window` `dragover` and `drop` `e.preventDefault()` handlers to prevent browsers from accidentally navigating away when files are dropped outside active dropzones.
- **TOTP QR Code Blob Downloads:** Swapped raw `data:` URI link downloads with in-memory Blob streams in `GeneratorToolView.tsx`.

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
