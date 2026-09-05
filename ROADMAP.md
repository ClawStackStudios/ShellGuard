# 🛡️ ShellGuard©™ Roadmap

*Where the reef has been, and where it molts next.*

---

## 📜 Changelog — Completed Molts

### ✅ Hardening & Ecosystem Evolution (v0.0.1.1 – v0.0.1.8)

- [x] **Multi-User Architecture & Session Manager** — Client-side multi-account session management (`sessionManager.ts`), active key switching, identity isolation, and reload navigation persistence (`sessionManager.test.ts`).
- [x] **Bitwarden-Style Custom Fields** — Migration `0003_custom_fields.up.sql`, 4 custom field types (text, hidden, boolean, linked) with client-side AES-GCM-256 AAD integrity binding.
- [x] **Native LAN TLS & WebCrypto Fallback** — Automatic EC P-256 self-signed certificate generation with SANs (`TLS_ENABLED=true`), plus pure-TS WebCrypto fallback engine (`webCryptoFallback.ts`) for zero-knowledge decryption over bare HTTP LAN.
- [x] **ShellGuard-TOTP Android Companion & Bridge** — Dedicated native Android 2FA companion app with biometrics and KeyStore isolation; seamless `sgtotp.bak` backup container import.
- [x] **Zero-Waste Release Pipeline** — Optimized GitHub Actions workflow (`release.yml`) triggering only on tags or `--release` commits, automatically mirroring `RELEASE.md` directly into GitHub Releases.
- [x] **Interactive Documentation Portal** — Interactive VitePress documentation site with rapid onboarding, Android companion guide, and Google Play Store compliant privacy policy (`docs/privacy.md`).

### ✅ Architecture Parity v0.0.1 (2026-08) — SQLite Bedrock & ClawChives Twin

> The defining molt: ShellGuard refactored onto the exact architecture of its sibling app ClawChives (bookmark manager).

- [x] **SQLite bedrock** — `DATA_DIR` layout (`db.sqlite` + segregated append-only `audit.sqlite`), WAL/NORMAL/foreign_keys pragmas, `better-sqlite3-multiple-ciphers` driver with optional SQLCipher at rest
- [x] **Transactional migrations** — `migrations/0001_initial.{up,down}.sql` define clean schema v1; runner tracks `schema_migrations`; legacy inline-DDL singleton deleted along with root `shellguard.db`
- [x] **Security kernel** — Express 5 with full middleware chain: TRUST_PROXY → httpsRedirect → helmet (vault CSP) → cors config → scoped body limits (1mb global / 32mb attachments) → rate limiters (global/auth/per-key LRU) → zod validation → centralized error handler
- [x] **Auth parity** — ClawChives key-hash identity ported wholesale (register/token/validate + SG-only `me`/`profile`, `lookup` dropped); constant-time comparison; fixed TTL parser (`30m`/`12h`/`24h`/`7d`/`never`/ISO/bare-minutes)
- [x] **Zero-knowledge invariant locked** — server stores only `{v, alg, iv, ct, aad}` ShellCryption blobs with AAD binding `table:recordId`
- [x] **Domain API parity** — hardened CRUD for pearls/notes/SSH keys/attachments with ownership scoping, audit-on-mutation, `{success,data}` envelope; LobsterKeys©™ lifecycle parity (expiry, rate limits, revoke); new server-side settings storage
- [x] **Twin-port dev topology** — Vite `:6464` strict-port proxying `/api` → API `:6565`; single-port production serving `dist/` + API
- [x] **Test harness** — 13 vitest + supertest suites (auth-flow, security incl. cross-owner isolation, vault-crud incl. opacity invariant, settings, metadata-encryption, admin, tls, unit tests) with per-suite `DATA_DIR` isolation
- [x] **Containerization** — multi-stage node:20-alpine single image, PUID/PGID entrypoint, healthcheck, compose prod/dev stacks, `.dockerignore` that keeps the lockfile
- [x] **CI** — docker-publish workflow → `ghcr.io/clawstackstudios/shellguard`
- [x] **Unraid template** — Community Applications XML (WebUI `:6464`, appdata bind mount, PUID 99/PGID 100 advanced defaults)
- [x] **Agent skill document** — `skills/shellguard/SKILL.md` served at `/skill.md`
- [x] **Documentation suite** — README, ARCHITECTURE (with deltas appendix), SECURITY, QUICKSTART, CONTRIBUTING, BLUEPRINT (schema v1 truthfulness), ADMIN, and docs portal
- [x] **Password attachments rework** — reference model: each file stored as its own ShellCrypted `vault_secure_attachments` record, pearls link them via a JSON ID array; file-upload UI (click/drag, 10 MB per-file hard cap, unlimited attachments), download buttons, pearl delete cascade-deletes linked attachments
- [x] **Per-Row Encryption** — shipped in v0.0.1: server-side AES-256-GCM metadata encryption (title, username, url, category, notes, file_name) keyed from `DB_ENCRYPTION_KEY` via HKDF, alongside client-side ShellCryption™; in-place envelopes with legacy-plaintext backward compatibility
- [x] **SuperLobster Panel (admin plane)** — `ADMIN_TOKEN`-gated panel at `/superlobster` with secrets-aware threat model (ADMIN.md): strict-metadata lobster management + cascade delete, read-only diagnostics, whitelist-only settings, failsafe Online-Backup-API backups with manifest + rotation; no download, no HTTP restore (offline Vaultwarden-style procedure + `scuttle:restore` validator)
- [x] **Bulk operations** — multi-select checkboxes with tri-state select-all, confirmed bulk delete with in-progress state, endpoint-mapped per-type deletion; password bulk deletes cascade their linked attachments

### ✅ MVP & Scaffold (v0.1.x)

- [x] ClawKeys©™ auth (`hu-` identity, `api-` sessions) and vault CRUD (pearls)
- [x] Lobster Key management (`lb-`) with granular permissions
- [x] Ocean Dark theme and Reef Modernist design language ([DESIGN.md](./DESIGN.md))
- [x] Core UI components: Landing, Setup, Login, Vault views with lobsterized aesthetic
- [x] Branding and mascot integration aligned with ClawStack Studios' style

### ✅ Post-MVP Features

- [x] Metadata CSV export button in vault settings (title, category, type)
- [x] Configurable inactivity auto-lock ("Retract") redirecting to login
- [x] Dedicated settings menu section for export + lock controls
- [x] Category filter dropdown in PasswordVaultView (Personal / Work / Custom pods)
- [x] Protected decrypted JSON export requiring fresh ShellKey©™ re-authentication
- [x] Settings sidebar redesign with Dashboard return navigation
- [x] Quick Actions on vault list rows (copy username/password to clipboard)
- [x] Framer Motion layout animations for vault grid add/delete/filter
- [x] Cryptographically secure password generator with length/charset configuration and complexity scoring
- [x] TOTP support (seed generation, QR codes, live codes via otpauth)
- [x] Nested color-coded pods (folder trees) with counts

---

## 🌊 Queue — Next Molts

> Prioritized backlog. Nothing here is committed until planned.

### 🔜 High Priority

- [ ] **Attachment BLOB migration** — move base64 attachment payloads into proper SQLite BLOB columns with streaming reads (today they ride as base64 text within the body-limit envelope)
- [ ] **Tagging system** — tag field on item schema, add/remove tags in edit view, sidebar filter by tag
- [ ] **Bulk import endpoint** — batch pearl import with partial-failure reporting

### 🔬 Under Consideration

- [x] **Admin control plane** — shipped as the SuperLobster Panel (v0.3.0) after its dedicated threat-model pass (ADMIN.md). Argon2id `ADMIN_TOKEN` hashing documented as a future hardening option.
- [x] **Release automation** — shipped in v0.0.1.8 with `.github/workflows/release.yml` tag & `--release` filtering and automatic `RELEASE.md` mirror.
- [ ] **Auto-lock "Retract" animation** — latch-closing visual confirmation when locking manually
- [ ] **Monolith decomposition** — PasswordVaultView (~2150 lines) and App.tsx (~1100 lines) sliced into feature modules (mechanical edits only during parity work; this deserves its own effort)
- [ ] **Onboarding flow** — guided first-hatch tour woven into the lobsterized theme

### 🧬 Distant Shores (Vision)

- [ ] **ShellCryption©™ v2** — hardware-backed key storage (WebAuthn PRF / secure enclave)
- [ ] **Audit Reef surfacing** — user-facing security timeline of agent access
- [x] **Mobile Shell (ShellGuard-TOTP Android Companion)** — Native Android companion app live at [ShellGuard-TOTP](https://github.com/ClawStackStudios/ShellGuard-TOTP)
- [x] **Biometric Claws** — Biometric unlock shipped in ShellGuard-TOTP Android companion
- [ ] **P2P Sync** — synchronize grottos across reefs without a central server

---

# DO NOT IMPLEMENT WITHOUT PLANNING

Items below this line are captured ideas, not commitments. Each needs a written plan (threat model where security-relevant) before implementation.

- Apply further 'lobsterized' visual polish across remaining surfaces (color schemes, typography, aesthetic cohesion).
- Extend quick actions and responsive behaviors across all vault item types.
- Evaluate passkey/WebAuthn unlock as an alternative to One-Field Login.
- Explore encrypted sharing of individual pearls between identities (careful: touches the zero-knowledge invariant).

# DEVELOPMENT IDEAS — CAPTURED, NOT SCHEDULED

Design explorations for the Reef Modernist language: dashboard widgets (vault health, password age, reused-secret sonar scan), notification systems, and themed micro-interactions. All UI work must respect the frozen spatial hierarchy documented in [DESIGN.md](./DESIGN.md).

---

Maintained by CrustAgent©™
