# 🛡️ ShellGuard©™ Roadmap

*Where the reef has been, and where it molts next.*

---

## 📜 Changelog — Completed Molts

### ✅ Architecture Parity v0.2.0 (2026-08) — SQLite Bedrock & ClawChives Twin

> The defining molt: ShellGuard refactored onto the exact architecture of its sibling app ClawChives (bookmark manager). **Fresh start — prior local data wiped by design** (breaking change).

- [x] **SQLite bedrock** — `DATA_DIR` layout (`db.sqlite` + segregated append-only `audit.sqlite`), WAL/NORMAL/foreign_keys pragmas, `better-sqlite3-multiple-ciphers` driver with optional SQLCipher at rest
- [x] **Transactional migrations** — `migrations/0001_initial.{up,down}.sql` define clean schema v1; runner tracks `schema_migrations`; legacy inline-DDL singleton deleted along with root `shellguard.db`
- [x] **Security kernel** — Express 5 with full middleware chain: TRUST_PROXY → httpsRedirect → helmet (vault CSP) → cors config → scoped body limits (1mb global / 32mb attachments) → rate limiters (global/auth/per-key LRU) → zod validation → centralized error handler
- [x] **Auth parity** — ClawChives key-hash identity ported wholesale (register/token/validate + SG-only `me`/`profile`, `lookup` dropped); constant-time comparison; fixed TTL parser (`30m`/`12h`/`24h`/`7d`/`never`/ISO/bare-minutes)
- [x] **Zero-knowledge invariant locked** — server stores only `{v, alg, iv, ct, aad}` ShellCryption blobs with AAD binding `table:recordId`
- [x] **Domain API parity** — hardened CRUD for pearls/notes/SSH keys/attachments with ownership scoping, audit-on-mutation, `{success,data}` envelope; LobsterKeys©™ lifecycle parity (expiry, rate limits, revoke); new server-side settings storage
- [x] **Twin-port dev topology** — Vite `:4545` strict-port proxying `/api` → API `:4646`; single-port production serving `dist/` + API
- [x] **Test harness** — vitest + supertest suites (auth-flow, security incl. cross-owner isolation, vault-crud incl. opacity invariant, settings, build-gates) with per-suite `DATA_DIR` isolation
- [x] **Containerization** — multi-stage node:20-alpine single image, PUID/PGID entrypoint, healthcheck, compose prod/dev stacks, `.dockerignore` that keeps the lockfile
- [x] **CI** — docker-publish workflow → `ghcr.io/clawstackstudios/shellguard`
- [x] **Unraid template** — Community Applications XML (WebUI `:4545`, appdata bind mount, PUID 99/PGID 100 advanced defaults)
- [x] **Agent skill document** — `skills/shellguard/SKILL.md` served at `/skill.md`
- [x] **Documentation suite** — README, ARCHITECTURE (with deltas appendix), SECURITY, QUICKSTART, CONTRIBUTING, CRUSTSECURITY, BLUEPRINT (schema v1 truthfulness)

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

- [ ] **Attachment BLOB migration `0002_*`** — move base64 attachment payloads into proper SQLite BLOB columns with streaming reads (today they ride as base64 text within the body-limit envelope)
- [ ] **Tagging system** — tag field on item schema, add/remove tags in edit view, sidebar filter by tag
- [ ] **Bulk operations** — multi-select checkboxes in VaultView with confirmed bulk delete
- [ ] **Bulk import endpoint** — batch pearl import with partial-failure reporting

### 🔬 Under Consideration

- [ ] **Admin control plane** — *deferred by locked decision*: an isolated metadata-only dashboard gated by its own token. Requires its own threat-model pass before any route ships. There are deliberately NO admin endpoints in v0.2.0.
- [ ] **Auto-lock "Retract" animation** — latch-closing visual confirmation when locking manually
- [ ] **Monolith decomposition** — PasswordVaultView (~2150 lines) and App.tsx (~1100 lines) sliced into feature modules (mechanical edits only during parity work; this deserves its own effort)
- [ ] **Release automation** — generated release notes and versioned tags from the CI pipeline
- [ ] **Onboarding flow** — guided first-hatch tour woven into the lobsterized theme

### 🧬 Distant Shores (Vision)

- [ ] **ShellCryption©™ v2** — hardware-backed key storage (WebAuthn PRF / secure enclave)
- [ ] **Audit Reef surfacing** — user-facing security timeline of agent access
- [ ] **Mobile Shell** — React Native companion app
- [ ] **P2P Sync** — synchronize grottos across reefs without a central server
- [ ] **Biometric Claws** — FaceID/TouchID unlock for mobile shells

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
