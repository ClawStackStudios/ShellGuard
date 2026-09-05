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
- [x] **AGPL-3.0 license** — added and npm audit vulnerabilities fixed
- [x] **Port migration** — settled on :6464 (web) / :6565 (API) development topology, disentangled from CaraBase port range

## What's Left to Build

- [ ] **Unified Bitwarden-Style Item & Pod Presentation** — Refactor vault tabs so items are rich composite records (passwords contain embedded notes, TOTP, attachments, custom fields); ensure child attachments do not artificially inflate Pod item counts; add in-browser cryptographic SSH keypair generation
- [ ] **Android Native Apps Scaffolding** — Scaffold native Android ShellGuard Vault client and standalone ShellGuard Authenticator app using the reference corpus in `docs/android/`
- [ ] **Attachment BLOB migration** — move base64 payloads into proper SQLite BLOB columns
- [ ] **Tagging system** — tag field on item schema, sidebar filter by tag
- [ ] **Bulk operations** — multi-select with confirmed bulk delete
- [ ] **Per-user metadata visibility** — different agents seeing different metadata subsets
- [ ] **Admin control plane** — deferred per locked decision, needs own threat-model pass
- [ ] **WebAuthn/hardware-backed key storage** — ShellCryption v2
- [ ] **Server-side search index** — decrypt-then-filter in memory (O(n) per search)


## Current Status

**v0.2.0** — Feature-complete for single-user vault with agent access. Per-row encryption implemented and documented. All tests passing.

## Known Issues

- `crypto.webcrypto.subtle` hangs in this environment (Linux 6.12.24-Unraid / Node v22.23.0) — native `crypto` module used instead
- Legacy plaintext metadata rows pass through unchanged until next update or batch encrypt script run
