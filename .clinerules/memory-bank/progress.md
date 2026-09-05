# Progress — ShellGuard

## What Works

- [x] **Auth parity** — ClawChives key-hash identity ported (register/token/validate + SG-only me/profile)
- [x] **Zero-knowledge invariant** — server stores only ShellCryption blobs with AAD binding
- [x] **Domain API parity** — hardened CRUD for pearls/notes/SSH keys/attachments with ownership scoping
- [x] **LobsterKeys lifecycle** — create/revoke/delete with granular permissions, expiry, rate limits
- [x] **Per-row metadata encryption** — AES-256-GCM on title/username/url/category/notes/file_name
- [x] **Password attachments (reference model)** — file upload UI (10MB hard limit/file, unlimited files), ShellCrypted file_data, pearl stores JSON ID array, cascade delete on pearl DELETE, download buttons
- [x] **SuperLobster Panel (admin plane v0.3.0 & CaraBase Alignment)** — ADMIN_TOKEN gate, strict-metadata lobster list + cascade delete, read-only status, whitelist settings, Online-Backup-API failsafe backups (manifest + rotation), audit viewer, hash-routed React panel, full CaraBase card-grid and dashboard visual alignment; no HTTP restore (offline scuttle:restore validator)
- [x] **Multi-user architecture** — Bitwarden-style locked dashboard, QuickLoginModal overlay, background account locking, robust routing
- [x] **Triple-layer encryption** — ShellCryption + Per-Row + SQLCipher, all documented
- [x] **Pure user-driven pod management** — Zero hardcoded default pods ("Personal", "Work", etc. eliminated). All pods 100% user-created. Category normalization for correct pod operations. Optimistic local state updates with `skipScuttle` batch pattern. `restAdapter` generics + PATCH method.
- [x] **Sidebar & Header Layout Polish** — Desktop sidebar collapse/expand toggle (`PanelLeftOpen`/`PanelLeftClose`), breadcrumbs aligned left, in-modal animated deletion confirmation.
- [x] **Lobster Keys CaraBase Parity & Rate Limiter Hardening** — Full 4-step wizard, key cards, toast provider, and fixed auth-order rate-limiter bug.
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

- [ ] **Attachment BLOB migration** — move base64 payloads into proper SQLite BLOB columns
- [ ] **Tagging system** — tag field on item schema, sidebar filter by tag
- [ ] **Bulk operations** — multi-select with confirmed bulk delete
- [ ] **Per-user metadata visibility** — different agents seeing different metadata subsets
- [ ] **Admin control plane** — deferred per locked decision, needs own threat-model pass
- [ ] **WebAuthn/hardware-backed key storage** — ShellCryption v2
- [ ] **Server-side search index** — decrypt-then-filter in memory (O(n) per search)

## Current Status

**v0.0.1.4** — Release v0.0.1.4 on branch `main`. Custom Fields (Text, Hidden, Checkbox, Linked) implemented and in [Unreleased]. LAN HTTP stability improvements: WebCrypto fallback for `crypto.subtle` undefined on HTTP origins, UUID entropy fallback, Blob-based file downloads. All pod management work from `fix/sidebar-and-pod-management` branch landed in `main`. **1 test failing** in `webCryptoFallback.test.ts` — needs investigation.

## Known Issues

- `crypto.webcrypto.subtle` **hangs** on Linux 6.12.24-Unraid / Node v22.23.0 (server-side) and is **undefined** on HTTP browser origins (client-side) — native `crypto` module used server-side, `src/lib/webCryptoFallback.ts` polyfills client-side
- **1 test failing** in `tests/unit/webCryptoFallback.test.ts` — likely a `window.crypto.subtle` stub issue in the vitest environment
- Legacy plaintext metadata rows pass through unchanged until next update or batch encrypt script run
- `npm`/`node` at `/config/Applications/node-v22.23.0-linux-x64/bin` must be in `PATH` for build commands (not in default PATH)
- `tsc --noEmit` has one pre-existing error in `fieldEncryption.ts` (hkdfSync ArrayBuffer vs Buffer) on main — not a regression gate; `vite build` is the actual gate
