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

- [ ] **Attachment BLOB migration** — move base64 payloads into proper SQLite BLOB columns
- [ ] **Tagging system** — tag field on item schema, sidebar filter by tag
- [ ] **Bulk operations** — multi-select with confirmed bulk delete
- [ ] **Per-user metadata visibility** — different agents seeing different metadata subsets
- [ ] **Admin control plane** — deferred per locked decision, needs own threat-model pass
- [ ] **WebAuthn/hardware-backed key storage** — ShellCryption v2
- [ ] **Server-side search index** — decrypt-then-filter in memory (O(n) per search)

## Current Status

**v0.0.2.0 (Build 20) — "The Composite Reef" RELEASED & LIVE** (2026-09-18; tag `v0.0.2.0` → merge `5fd459e`; GitHub Release mirrors `RELEASE-v0.0.2.0.md`). Phase 18 shipped: **Task 35** — in-browser SSH keypair engine (`src/lib/keyGen.ts`, WebCrypto Ed25519/RSA-4096, OpenSSH + RFC-4716 public, PKCS#8 private; **ssh-keygen cross-verified byte-identical** for both algorithms; ssh mpint keeps the DER leading zero; honest secure-context detection — LAN-HTTP degrades with a notice, the pure-TS fallback deliberately does NOT grow a keypair surface); **Task 36** — SSH keys gained their first form input ever (private-key textarea + Generate Keypair panel, public-key row in the detail pane, generated keys stored as JSON `{publicKey, privateKey}` sealed under `vault_ssh_keys:{id}`); pod-decoupling locked by tests (premise correction: `buildPodTree` already filtered — `podUtils.ts:193`; the roadmap's server-side count-aggregation premise was wrong, counts are client-side); phantom `SshKeyVaultView.tsx` premise corrected. Release protocol: P15 → ROADMAP-HISTORY, P18 → Completed Releases (receipts `6f9b00d`/`61336a1`), build labels swept +1 (P19–P24 → Builds 22–27 incl. anchors). **NEXT: Phase 19 — Attachment SQLite BLOB Migration & Streaming Architecture (Tasks 37/38, v0.0.2.1 / Build 22)** — now including the **Eye-beside-Copy ergonomics fold-in** (from P22/T44, Lucas 2026-09-18): Unmask immediately LEFT of Copy on every masked field row; Phases 20–23 follow, then Phase 24 closes the loop with the auditor's battery. (Earlier arc: v0.0.1.9/v0.0.1.10 released; chronology restored, canon sealed, 8 docs-lies corrected, docs bow to code, Phase 24 queued, the lens permanent in the long-term bank.)

## Known Issues

- `crypto.webcrypto.subtle` **hangs** on Linux 6.12.24-Unraid / Node v22.23.0 (server-side) and is **undefined** on HTTP browser origins (client-side) — native `crypto` module used server-side, `src/lib/webCryptoFallback.ts` polyfills client-side
- **1 test failing** in `tests/unit/webCryptoFallback.test.ts` — likely a `window.crypto.subtle` stub issue in the vitest environment
- Legacy plaintext metadata rows pass through unchanged until next update or batch encrypt script run
- `npm`/`node` at `/config/Applications/node-v22.23.0-linux-x64/bin` must be in `PATH` for build commands (not in default PATH)
- `tsc --noEmit` has one pre-existing error in `fieldEncryption.ts` (hkdfSync ArrayBuffer vs Buffer) on main — not a regression gate; `vite build` is the actual gate
