# Progress — ShellGuard

## What Works

- [x] **Auth parity** — ClawChives key-hash identity ported (register/token/validate + SG-only me/profile)
- [x] **Zero-knowledge invariant** — server stores only ShellCryption blobs with AAD binding
- [x] **Domain API parity** — hardened CRUD for pearls/notes/SSH keys/attachments with ownership scoping
- [x] **LobsterKeys lifecycle** — create/revoke/delete with granular permissions, expiry, rate limits
- [x] **Per-row metadata encryption** — AES-256-GCM on title/username/url/category/notes/file_name (+ tags as of v0.0.2.2)
- [x] **Password attachments (reference model, Phase 19)** — native BLOB storage (migration 0005), multipart streamed uploads (500MB/file, 1000MB/owner quota, 413), metadata-only list, chunked downloads via GET /:id/file, progress+cancel UI, encrypted image/PDF previews, Eye-beside-Copy ergonomics
- [x] **Vault Tagging System (Phase 20)** — migration `0006_vault_tags` (tags column + owner indices across pearls/notes/ssh_keys), Layer 2 MetadataGuard encryption, `?tags=a,b` intersection filtering with audit logging, `TagSelectorInput` autocomplete chips with color picker, unified bioluminescent color engine (`podUtils.ts`), collapsible sidebar tag cloud, AND/OR multi-filter bar in `ItemListPane.tsx`, tag pill badges in `ItemDetailPane.tsx`
- [x] **SSH Key Dual-Key Architecture (Phase 20)** — `parseSshKeySecret`/`serializeSshKeySecret` envelope with backward compat for legacy PEMs, strict RFC 7468 PKCS#8 framing, `.pem` download, `authorized_keys` command copy
- [x] **SuperLobster Panel (admin plane v0.3.0 & CaraBase Alignment)** — ADMIN_TOKEN gate, strict-metadata lobster list + cascade delete, read-only status, whitelist settings, Online-Backup-API failsafe backups (manifest + rotation), audit viewer, hash-routed React panel, full CaraBase card-grid and dashboard visual alignment; no HTTP restore (offline scuttle:restore validator)
- [x] **Multi-user architecture** — Bitwarden-style locked dashboard, QuickLoginModal overlay, background account locking, robust routing
- [x] **Triple-layer encryption** — ShellCryption + Per-Row + SQLCipher, all documented
- [x] **Pure user-driven pod management** — Zero hardcoded default pods ("Personal", "Work", etc. eliminated). All pods 100% user-created. Category normalization for correct pod operations. Optimistic local state updates with `skipScuttle` batch pattern. `restAdapter` generics + PATCH method.
- [x] **Sidebar & Header Layout Polish** — Desktop sidebar collapse/expand toggle (`PanelLeftOpen`/`PanelLeftClose`), breadcrumbs aligned left, in-modal animated deletion confirmation.
- [x] **Lobster Keys CaraBase Parity & Rate Limiter Hardening** — Full 4-step wizard, key cards, toast provider, and fixed auth-order rate-limiter bug.
- [x] **v0.0.1.9 — /project Genome, Coherence Audit, Phase 17 Key Ledger Hardening & CaraBase Card Parity** — hash-only lb- ledger, pod purity, 10th oracle (shellcryption-spec), 0 dangling refs, full-value masking.
- [x] **v0.0.1.2 — Insecure Origin UUID & Entropy Fallback** — Multi-tier RFC 4122 v4 UUID generator and secure entropy fallback for non-secure HTTP origins; LAN HTTP file downloads via Blob/URL.createObjectURL
- [x] **v0.0.1.3 — Iconography & Favicon** — Official `shellguard-icon.svg` at `public/favicon.svg`, Unraid template icon URL; docs hygiene sweep
- [x] **v0.0.1.4 — Pure TypeScript WebCrypto Fallback Engine** — Zero-dependency implementations of SHA-256, HMAC-SHA256, HKDF, AES-GCM-256 in `src/lib/webCryptoFallback.ts`; global drag-and-drop shield; TOTP QR code Blob downloads
- [x] **Custom Fields (Text, Hidden, Checkbox, Linked)** — User-defined custom fields on vault items (pearls, notes, SSH keys). ShellCrypted client-side with distinct AAD namespaces. Migration 0003. Edit and display in ItemFormModal/ItemDetailPane. JSON export includes custom_fields. 167 tests pass, build clean.
- [x] **Test harness** — 10 suites, 169 tests (167 passed, 1 failed, 1 skipped), per-suite DATA_DIR isolation
- [x] **Unit test suite** — 3 new unit test files: `errorHandler.test.ts`, `sessionManager.test.ts`, `webCryptoFallback.test.ts`
- [x] **Containerization** — multi-stage node:20-alpine, PUID/PGID, healthcheck, compose stacks
- [x] **CI** — docker-publish workflow → ghcr.io/clawstackstudios/shellguard
- [x] **Unraid template** — Community Applications XML
- [x] **Documentation suite** — README, ARCHITECTURE, SECURITY, QUICKSTART, CONTRIBUTING, BLUEPRINT
- [x] **AGPL-3.0 license** — added and npm audit vulnerabilities fixed
- [x] **Port migration** — settled on :6464 (web) / :6565 (API) development topology, disentangled from CaraBase port range

## What's Left to Build

- [ ] **Phase 21: Bulk Import Endpoint & Batch Operations [v0.0.2.3 (Build 25)]** — Tasks 41/42: Transactional `POST /api/vault/bulk-import` with 207 Multi-Status partial-failure reporting, tri-state bulk selection controls, floating bulk action bar, confirmed batch delete.
- [ ] **Phase 22: Reef Polish Pass — Unified Search [provisional v0.0.2.4 (Build 26)]** — Tasks 43/44: One search bar (client-side, zero-knowledge over decrypted in-memory corpus); header/sidebar search removal; verify Eye-beside-Copy ergonomics.
- [ ] **Phase 23: Bitwarden-Model Item Integrity [provisional v0.0.2.5 (Build 27)]** — Tasks 45/46: Attachment parent enforcement at bedrock (reject standalone attachments; orphan quarantine), notes reject password payloads, type-truthful dashboard display.
- [ ] **Phase 24: Cryptographic Audit Hardening & Third-Party Auditability [provisional v0.0.2.6 (Build 28)]** — Tasks 47/48: WebCrypto fallback vector parity against NIST/RFC/SP vectors (unskip test), mechanized constant-time sweep in CI, claim battery gate script, threat-model addendum.

## Current Status

**v0.0.2.2 (Build 24 — "The Bioluminescent Reef") RELEASED (2026-09-19)**. Phase 20 shipped: **Task 39** — `vault-tags.test.ts` (270 lines, 12 tests) covering migration 0006 idempotency, tag CRUD on all three item types, `?tags=a,b` intersection filtering, AND/OR logic, ownership scoping, MetadataGuard encryption/decryption; **Task 40** — `TagSelectorInput.tsx` (210 lines) autocomplete chips with color palette, `ItemListPane.tsx` AND/OR filter bar, `SidebarFolderTree.tsx` collapsible tag cloud, `ItemDetailPane.tsx` tag badge rendering; **Sub-task** — attachment ceiling 50MB → 500MB (`ATTACHMENT_MAX_MB`), grotto quota 500MB → 1000MB (`GROTTO_QUOTA_MB`), nginx body hint → 60M; **SSH sub-task** — dual-key architecture (`parseSshKeySecret`/`serializeSshKeySecret`), clean PEM framing, `.pem` download, `authorized_keys` command copy; **docs alignment** (`09d0400`) — 12 contradictions resolved (8 obsolete "10MB" refs, ARCHITECTURE un-frozen to v0.0.2.1, limiter conflation fixed, nginx hint updated, Phase 20 sub-task in ROADMAP + spine). All gates green: 20 test files, 248 tests (1 skipped), `tsc`, `vite build`, `docs:build`. **NEXT: Phase 21 — Bulk Import Endpoint & Batch Operations (v0.0.2.3 / Build 25, Tasks 41/42)**.
