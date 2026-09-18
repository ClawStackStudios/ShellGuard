# Progress — ShellGuard

## What Works

- [x] **Auth parity** — ClawChives key-hash identity ported (register/token/validate + SG-only me/profile)
- [x] **Zero-knowledge invariant** — server stores only ShellCryption blobs with AAD binding
- [x] **Domain API parity** — hardened CRUD for pearls/notes/SSH keys/attachments with ownership scoping
- [x] **LobsterKeys lifecycle** — create/revoke/delete with granular permissions, expiry, rate limits
- [x] **Per-row metadata encryption** — AES-256-GCM on title/username/url/category/notes/file_name
- [x] **Password attachments (reference model, Phase 19)** — native BLOB storage (migration 0005), multipart streamed uploads (50MB/file, 500MB/owner quota, 413), metadata-only list, chunked downloads via GET /:id/file, progress+cancel UI, encrypted image/PDF previews, Eye-beside-Copy ergonomics
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

- [ ] **Tagging system** — tag field on item schema, sidebar filter by tag
- [ ] **Bulk operations** — multi-select with confirmed bulk delete
- [ ] **Per-user metadata visibility** — different agents seeing different metadata subsets
- [ ] **Admin control plane** — deferred per locked decision, needs own threat-model pass
- [ ] **WebAuthn/hardware-backed key storage** — ShellCryption v2
- [ ] **Server-side search index** — decrypt-then-filter in memory (O(n) per search)

## Current Status

**v0.0.2.1 (Build 22) — "The Deep Storage Molt" RELEASED (2026-09-18)**. Phase 19 shipped: **Task 37** (`f4f6073`) — migration 0005 (BLOB + size_bytes, verbatim legacy copy), in-code idempotent backfill (`attachmentBlobs.ts`, transactional + VACUUM), attachments.ts rewritten to the Phase 19 wire contract (Busboy multipart POST with mid-stream 413 abort, metadata-only list, chunked substr downloads, metadata-only PUT), 50MB/500MB env-tunable limits, 6-test `tests/attachments-blob.test.ts`, existing suites re-witnessed to multipart; **Task 38** (`27df54b`) — streamed XHR uploads with progress/cancel, on-demand decryption (`handleFetchAttachment`), encrypted image/PDF preview modal, Eye-beside-Copy fold-in (P22/T44 pulled forward, verify-only there), 10MB→50MB labels; **docs** (`dee897f` + `c60874e`) — BLUEPRINT/ARCHITECTURE/SECURITY/README/.env.example/vault-features/blueprint-schema/design-system + the agent contracts (skills/shellguard/SKILL.md, docs/agent-integration/api-reference.md) and genome (routes-and-contracts, database-schema). Honest boundary: better-sqlite3 has no openBlob() — write path peaks at ciphertext size (hard-capped mid-stream), read path fully chunked. **NEXT: Phase 20 — Vault Tagging System (Tasks 39/40, v0.0.2.2 / Build 24)**.
