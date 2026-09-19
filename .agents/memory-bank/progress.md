# Progress — ShellGuard

## What Works

- [x] **Auth parity** — ClawChives key-hash identity ported (register/token/validate + SG-only me/profile)
- [x] **Zero-knowledge invariant** — server stores only ShellCryption blobs with AAD binding
- [x] **Domain API parity** — hardened CRUD for pearls/notes/SSH keys/attachments with ownership scoping
- [x] **LobsterKeys lifecycle** — create/revoke/delete with granular permissions, expiry, rate limits
- [x] **Per-row metadata encryption** — AES-256-GCM on title/username/url/category/notes/file_name
- [x] **Password attachments (reference model)** — file upload UI (10MB hard limit/file, unlimited files), ShellCrypted file_data, pearl stores JSON ID array, cascade delete on pearl DELETE, download buttons
- [x] **User-driven Pod Management & Zero Hardcoded Defaults** — 100% user-created hierarchical pods (`Parent/Child`), zero phantom pods, category normalization, optimistic deletions & cascades to uncategorized (`""`), batched server sync with `skipScuttle`
- [x] **Vault Lock Hardening & Mutation Denial** — Strict `isLocked` guard checks across all pod management, item mutations, live search results, and quick add buttons
- [x] **Unified & State-Aware Auth Navigation (`NavIntent`)** — Session manager explicit navigation intent tracking ensuring seamless reload fidelity between landing view and locked/unlocked dashboard views
- [x] **Sidebar & Header Layout Polish** — Desktop sidebar collapse/expand toggle (`PanelLeftOpen`/`PanelLeftClose`), breadcrumbs aligned to left content container, in-modal animated deletion confirmation screen
- [x] **Lobster Keys CaraBase Parity & Rate Limiter Hardening** — full 4-step wizard, key cards, toast provider, and fixed auth-order rate-limiter bug
- [x] **Multi-user architecture** — Bitwarden-style locked dashboard, QuickLoginModal overlay, background account locking, robust routing
- [x] **Triple-layer encryption** — ShellCryption + Per-Row + SQLCipher, all documented
- [x] **Test harness** — 7 suites, 137 tests, per-suite DATA_DIR isolation
- [x] **Containerization** — multi-stage node:20-alpine, PUID/PGID, healthcheck, compose stacks
- [x] **CI** — docker-publish workflow → ghcr.io/clawstackstudios/shellguard
- [x] **Unraid template** — Community Applications XML
- [x] **Documentation suite** — README, ARCHITECTURE, SECURITY, QUICKSTART, CONTRIBUTING, BLUEPRINT, attractorBeacon.md
- [x] **Android Mobile Reference Corpus** — Full specifications in `docs/android/` and `.agents/memory-bank/android/` covering Kotlin 2.0, Jetpack Compose UI, Room Encrypted DAOs, Retrofit API Client, WorkManager Sync, and RFC 6238 TOTP Engine
- [x] **ShellGuard-TOTP Android Authenticator Architecture & AI Studio Corpus** — 9 modular markdown specifications in `/android` defining client boundaries, Room schema, KeyStore biometrics, RFC 6238 TOTP engine, Reef Modernist Compose UI, 3-Phase (2 tasks per phase) roadmap, and Master AI Studio Meta-Prompt
- [x] **ShellGuard-TOTP Android Companion Compatibility Layer (`sgtotp.bak`)** — client-side format sniffer and decryptor (HKDF-SHA256, AES-GCM-256 with AAD verification and enforced SHA-256 checksums), Base32 seed sanitization, fresh UUID assignment, and pod category mapping with 22 unit tests.
- [x] **Official Privacy Policy & Regulatory Compliance** — Google Play Store compliant Privacy Policy at `docs/privacy.md` detailing zero-knowledge invariants, zero telemetry/trackers, local in-memory camera QR scanning, biometric hardware enclave isolation, and SAF backup mechanics. Integrated into canonical VitePress docs and web app landing view footer.
- [x] **ShellGuard-TOTP Native Companion Documentation Suite** — Comprehensive documentation portal (`docs/companion/` with `index.md`, `security.md`, `sync-and-backups.md`, `totp-engine.md`) covering One-Way Mirror Sync topology, Android KeyStore hardware enclaves (TEE/StrongBox), BiometricPrompt, `FLAG_SECURE`, `.sgtotp.bak` wire specification, and RFC 6238 TOTP engine with CameraX ML Kit scanning. Integrated into VitePress navigation, sidebar, and home grid.
- [x] **Full Documentation Bridge Parity & Hub Architecture** — Established missing top-level index portals (`docs/vault-features/index.md`, `docs/deployment/index.md`, `docs/reference/index.md`), fully reconciled SQLite database schema ground truth (`lobsters`, `agent_keys`, `custom_fields`, `audit_logs`), and documented Custom Fields, Native LAN TLS (`TLS_ENABLED=true`), WebCrypto fallback, and `.sgtotp.bak` companion import.
- [x] **Reverse-Build `/project` Genome (Phases 1-16 Transcribed)** — Meta-prompt spine (Stage 0 void → Stage 17 summit), receipt-matched ROADMAP (16 phases / 32 task pairs, `v0.0.0.0` → `v0.0.1.8`), 10 spec oracles including `shellcryption-spec.md`. Coherence audit resolved 50 dangling references.
- [x] **Phase 17 Implemented — Key Ledger Hardening & Pod Purity (v0.0.1.9)** — Migration `0004_key_ledger.sql` retired plaintext `api_key` column from `agent_keys`, storing SHA-256 `key_hash` and `key_fingerprint` (`lb-***-XXXX`). Constant-time `crypto.timingSafeEqual()` verification. Minted-once secret delivery. Purged hardcoded `DEFAULT 'Personal'` pod defaults (uncategorized = `""`). CaraBase 1:1 key row masking on Lobster Keys card. Proven by `tests/agent-key-hash.test.ts`.
- [x] **Post-v0.0.1.9 Hotfix & Version Test Integrity** — Vault master-detail headers flushed to shared 64px (`h-16`) across dashboard T-junction; `tests/unit/version.test.ts` de-hardcoded from literal `'0.0.1.8'` to dynamic package ground-truth matching `X.Y.Z.N` shape.
- [x] **The ClawKey Canon (v0.0.1.10)** — ClawKey / ShellCryption / LobsterKeys written into ARCHITECTURE (§ The ClawKey Method) and the UI (14 user-facing strings renamed ShellKey™ → ClawKey™); web and Android now say the same word.
- [x] **Bidirectional Docs ↔ Code Audit (v0.0.1.10)** — 8 docs-lies corrected against verified code (PRAGMA rekey, limiter counts, identity-file shape, phantom customFields.ts, tlsManager.ts, shipped crypto exports, the fifth `canMove` mask, `_custom` AAD namespaces); privacy policy corrected (`db.sqlite`/`audit.sqlite`, base62 alphabet, user-UUID HKDF salt). Docs bow to code.
- [x] **CaraBase Brand Asset Alignment & Web Server Favicon Distinction (`feat/brand-assets-refresh`)** — Mascot logo and 1:1 thumbnail re-oriented 180° forward/downward clasping the vault safe door with 3D 'S' crest in CaraBase woodcut vector engraving style. Web Server distinct notched carapace crest shield enclosing a multi-grid Web Globe themed to ShellGuard purple/pink palette (`#e4048a`, `#ec4899`, `#c026d3`, `#ffffff`). Dedicated 1024x500 Web Feature Graphic banner. 1:1 twin parity across `public/` and `docs/public/assets/`.
- [x] **Phase 18 Implemented — Unified Bitwarden-Style Item Composition & Keypair Engine (v0.0.2.0, Build 20)** — Consolidated vault items into rich composite records (passwords embed notes, live TOTP countdown ring, attachments, custom fields). Decoupled child attachments from Pod metrics so attachments never inflate folder counts. Implemented in-browser WebCrypto SSH keypair engine (`src/lib/keyGen.ts` — Ed25519 + RSA-4096, verified against ssh-keygen).
- [x] **Phase 19 Implemented — Attachment SQLite BLOB Migration & Streaming Architecture (v0.0.2.1, Build 22)** — Migration `0005_attachment_blobs` rebuilds table with `file_data BLOB` + `size_bytes INTEGER` with idempotent backfill (`attachmentBlobs.ts`). Busboy multipart streaming POST, metadata-only listing (`GET /api/attachments`), chunked 1MB BLOB download via `GET /api/attachments/:id/file`. 50MB per-file ceiling and 500MB per-owner grotto quota (413 fail-closed). Streamed upload progress with cancel, on-demand client decryption, encrypted inline previews for images/PDFs, and folded-forward Eye-beside-Copy ergonomics across all masked field rows. Proven by `tests/attachments-blob.test.ts`.
- [x] **Phase 20 Implemented — Vault Tagging System & Granular Filter Bar + 500MB Storage Ceiling + SSH Key Dual-Key Management (v0.0.2.2, Build 24)** — Migration `0006_vault_tags` adds `tags TEXT DEFAULT '[]'` and owner index across pearls, notes, and SSH keys. Layer 2 metadata encryption registers tags. Server routes support `?tags=a,b` intersection filtering and audit logging. Attachment storage ceiling raised to 500MB per file and 1000MB grotto quota. Client UI gains `TagSelectorInput` autocomplete chips with inline color palette picker, unified pod/tag color engine (`podUtils.ts`), collapsible tag cloud in `SidebarFolderTree`, granular multi-filter bar with `AND` / `OR` toggle in `ItemListPane`, and tag pill badges in `ItemDetailPane`. SSH Key dual-key architecture (`keyGen.ts`) eliminates JSON unmasking leaks, strictly formats PKCS#8 PEM blocks, and provides one-click terminal ergonomics (**Copy Public Key**, **Copy `authorized_keys` Command**, and **Download .pem**). Proven by `tests/vault-tags.test.ts`, `tests/unit/keyGen.test.ts`, and all 20 test files (248 tests passed, 1 skipped).
- [x] **Decision Log Adopted** — `.agents/memory-bank/decision-log.md` (episodic navigation record, 20-entry sliding window).
- [x] **AGPL-3.0 license** — added and npm audit vulnerabilities fixed.
- [x] **Port migration** — settled on :6464 (web) / :6565 (API) development topology, disentangled from CaraBase port range.

## What's Left to Build

- [ ] **Phase 21: Bulk Import Endpoint & Batch Operations [v0.0.2.3 (Build 25)]** — Tasks 41 & 42: Transactional `POST /api/vault/bulk-import` with partial-failure reporting (207 Multi-Status), tri-state bulk selection controls, floating bulk action bar, and confirmed batch delete.
- [ ] **Phase 22: Reef Polish Pass — Unified Search [provisional v0.0.2.4 (Build 26)]** — Tasks 43 & 44: One search bar to rule the reef (client-side, zero-knowledge over already-decrypted in-memory corpus matching titles, keywords, attachment names, note contents, custom fields); header/sidebar search removal; verify Eye-beside-Copy ergonomics.
- [ ] **Phase 23: Bitwarden-Model Item Integrity [provisional v0.0.2.5 (Build 27)]** — Tasks 45 & 46: Attachment parent enforcement at bedrock (reject standalone attachments; orphan quarantine), notes reject password payloads, type-truthful dashboard display.
- [ ] **Phase 24: Cryptographic Audit Hardening & Third-Party Auditability [provisional v0.0.2.6 (Build 28)]** — Tasks 47 & 48: WebCrypto fallback vector parity against NIST/RFC/SP vectors (unskip test), mechanized constant-time sweep in CI, claim battery gate script, threat-model addendum.

## Current Status

**v0.0.2.2 (Build 24 — Vault Tagging System & Granular Filter Bar)** — implemented on `feat/phase20-vault-tagging-system`. 100% green test oracle (20 test files, 248 tests passed, 1 skipped). Build (`vite build`) and documentation portal (`docs:build`) 100% clean. Next milestone: **Phase 21 (v0.0.2.3 / Build 25)**.

## Known Issues

- `crypto.webcrypto.subtle` hangs in this environment (Linux 6.12.24-Unraid / Node v22.23.0) — native `crypto` module used instead
- Legacy plaintext metadata rows pass through unchanged until next update or batch encrypt script run
