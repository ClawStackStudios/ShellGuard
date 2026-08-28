# Progress — ShellGuard

## What Works

- [x] **Auth parity** — ClawChives key-hash identity ported (register/token/validate + SG-only me/profile)
- [x] **Zero-knowledge invariant** — server stores only ShellCryption blobs with AAD binding
- [x] **Domain API parity** — hardened CRUD for pearls/notes/SSH keys/attachments with ownership scoping
- [x] **LobsterKeys lifecycle** — create/revoke/delete with granular permissions, expiry, rate limits
- [x] **Per-row metadata encryption** — AES-256-GCM on title/username/url/category/notes/file_name
- [x] **Triple-layer encryption** — ShellCryption + Per-Row + SQLCipher, all documented
- [x] **Test harness** — 7 suites, 137 tests, per-suite DATA_DIR isolation
- [x] **Containerization** — multi-stage node:20-alpine, PUID/PGID, healthcheck, compose stacks
- [x] **CI** — docker-publish workflow → ghcr.io/clawstackstudios/shellguard
- [x] **Unraid template** — Community Applications XML
- [x] **Documentation suite** — README, ARCHITECTURE, SECURITY, QUICKSTART, CONTRIBUTING, BLUEPRINT
- [x] **AGPL-3.0 license** — added and npm audit vulnerabilities fixed
- [x] **Port migration** — 4545→5353, 4646→5454 across all config

## What's Left to Build

- [ ] **Attachment BLOB migration** — move base64 payloads into proper SQLite BLOB columns
- [ ] **Tagging system** — tag field on item schema, sidebar filter by tag
- [ ] **Bulk operations** — multi-select with confirmed bulk delete
- [ ] **Per-user metadata visibility** — different agents seeing different metadata subsets
- [ ] **Multi-user architecture** — enhance data model and auth flows for multiple users
- [ ] **Admin control plane** — deferred per locked decision, needs own threat-model pass
- [ ] **WebAuthn/hardware-backed key storage** — ShellCryption v2
- [ ] **Server-side search index** — decrypt-then-filter in memory (O(n) per search)

## Current Status

**v0.2.0** — Feature-complete for single-user vault with agent access. Per-row encryption implemented and documented. All tests passing.

## Known Issues

- `crypto.webcrypto.subtle` hangs in this environment (Linux 6.12.24-Unraid / Node v22.23.0) — native `crypto` module used instead
- Legacy plaintext metadata rows pass through unchanged until next update or batch encrypt script run
