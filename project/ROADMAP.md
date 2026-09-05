---
roadmap_version: 1.0.0
last_updated: 2026-09-05
current_position: "Phase 9 transcribed (Genesis v0.0.1 🏷️) — Phase 10: Deployment Hotfixes & Dev Loop pending (v0.0.1.2)"
transcription_state: "Reverse-build walk in progress: v0.0.0.0 (void) → v0.0.1.8 (summit). Stages added one phase at a time, receipt-backed by git."
statistics:
  description: "Reverse-built deterministic roadmap for ShellGuard (web vault). Reconstructed post hoc from the git story: each phase's work matches the commits inside its release gap. Engineered in synergistic 2-task phases: Task A delivers core functionality, Task B delivers the corresponding UI/UX."
  features_completed: "Phases 1–9 transcribed (genesis tagged) · Release era in progress"
---

# Reverse Project Roadmap — ShellGuard Secrets Vault (Web)

### 🏷️ Work-Driven Versioning Policy: `MAJOR.MINOR.PATCH.REVISION` (`X.Y.Z.N`)

- **Void**: `v0.0.0.0 (Build 1)` — nothing exists; Stage 0's first build pulls the app out of it.
- **Pre-Genesis Sprint** (2026-08-23 → 2026-08-30): phases labeled `Baseline: v0.0.0.x (Build N)`.
  These were never release tags — REVISION increments per phase.
- **Release Era**: real git tags bracket later phases 1:1 — `v0.0.1` (genesis, 2026-08-30),
  `v0.0.1.2`, `v0.0.1.3`, `v0.0.1.4`, `v0.0.1.5`, `v0.0.1.6`, `v0.0.1.7`, `v0.0.1.8`.
- **No Forced Targets**: versions evolve from the work done, exactly as they did in history.
- **`(n)` sub-deliverable prefixes** available inside a bracket where required.

---

Systemic Design Rule: this roadmap follows a deterministic structure built on the principle:
"Build features around security, not security around features." Each Phase contains strictly
2 paired tasks: **Task A (Core Functionality / Security Engine)** followed immediately by
**Task B (Corresponding UI Component / Interactive State)**. Every phase's work matches the
commits in its git gap — receipts are cited.

---

## Phase 1: Scaffold, Auth & API Molt [Baseline: v0.0.0.1 (Build 2)]

> Phase Feature Set Overview:
> The ascent from the void. ShellGuard©™ is born as a full-stack secrets vault —
> React/Vite client + Express/SQLite "Bedrock" server — with the three-table v0
> schema, dual-key auth (`hu-`/`lb-`) with scoped claw-strength permissions,
> ownership-scoped REST routers, and the first Reef Modernist landing shell.
> The gap closes with the **Molt**: all first-build AI Studio scaffolding is
> shed so the repo stands canonical. *(Receipts: `2981d22`, `d915c08`, `358f7ea`,
> `fcb2b50`, `dc26879` — 2026-08-23/24.)*

- [ ] **Task 01: [Functionality] Full-Stack Scaffold & Ownership-Scoped API**

Description: Initialize the full-stack application. **Backend**: database schema and
connection layer for `lobsters` (users), `vault_pearls` (secrets: passwords, secure
notes, cards, SSH keys), and `lobster_keys` (agent keys); auth middleware supporting
`hu-` human keys and `lb-` agent keys with scoped permissions (`canRead`/`canWrite`
claw strength); REST routers for all four vault item types, each enforcing ownership
checks. **Frontend**: Vite-based UI with environment config for ShellCryption
client-side encryption and app URL. **Project setup**: `BLUEPRINT.md` (architecture
+ data model), `.env.example`, `README.md`, agent knowledge files (Lobster Keys
usage, audit rules). **The Molt**: remove first-build scaffolding artifacts — the
`patch_*.cjs` scripts, `fix_app.cjs`, `bun.lock`, `metadata.json`, and vestigial
dependencies — so the repository becomes a canonical codebase.

> Success Criteria: Server boots with all three v0 tables; a vault item round-trips
> with ownership scoping enforced; an `lb-` agent key is denied outside its scoped
> permissions; the repo contains zero scaffolding artifacts after the molt.

- [ ] **Task 02: [UI Component] Landing Shell, Header & Reef Unification**

Description: Extract header controls into a reusable `Header` component
(`components/Layout/Header.tsx`). Add the **Hatch Vault** button to `LandingView`
with compact styling updates to the `SetupView` components. Unify surface
backgrounds and header borders across dark/light themes so the Reef Modernist
token set is consistent from first paint. Keep the vault shell minimal — the
three-pane master-detail dashboard arrives in a later phase.

> Success Criteria: Landing shell renders on unified tokens; header is a reusable
> component consumed by all top-level views; Hatch Vault button navigates to setup.

## Phase 2: SQLite Bedrock, Security Kernel & Identity Bridge [Baseline: v0.0.0.2 (Build 3)]

> Phase Feature Set Overview:
> The vault gains its Bedrock and its armor. The storage layer is rebuilt as a
> `DATA_DIR` sandbox — transactional SQL migrations with a tracked runner, WAL
> pragmas, and a segregated append-only audit database with zero-knowledge
> redaction. The server is armored with the Express 5 security kernel (helmet
> CSP, CORS config, scoped body limits, per-route rate limiters, zod validation,
> centralized error handler, HTTPS redirect, hardened TTL parser, constant-time
> crypto utils). ShellKey identity endpoints (register/token) assemble the
> kernel; the client learns to unwrap the uniform `{success, data}` envelope;
> and the twin-port dev topology is pinned. *(Receipts: `10e3af9`, `302c17d`,
> `df7b994`, `826ffbf`, `7f62ca9`, `227a747`, `5337e8e` — 2026-08-24/25.)*

- [ ] **Task 03: [Functionality] SQLite Bedrock, Transactional Migrations, Audit DB & Security Kernel**

Description: Swap the database driver to `better-sqlite3-multiple-ciphers`
(enabling later SQLCipher at rest). Rebuild storage as the `DATA_DIR` bedrock:
`migrations/0001_initial.{up,down}.sql` define clean schema v1 (`lobsters`,
`api_tokens`, `vault_pearls`, `vault_secure_notes`, `vault_ssh_keys` — payload
columns hold opaque ShellCryption ciphertext); `migrationRunner.ts` tracks
`schema_migrations` with transactional all-or-nothing application; the legacy
inline-DDL singleton and root `shellguard.db` are deleted; routers repoint at
the database singleton. Add `scripts/scuttle-reset.ts` for fresh-start wipes.
Create the segregated append-only `audit.sqlite` with `createAuditLogger()` —
rows must NEVER carry vault payload or identity artifacts (fail-closed
redaction on lookalike field names). Assemble the Express 5 security kernel:
`httpsRedirect` → `helmet` (vault CSP) → CORS config → scoped body limits
(1mb global / 32mb attachments) → global/auth/per-key rate limiters → zod
validation → centralized error handler; plus hardened TTL parsing
(`30m`/`12h`/`24h`/`7d`/`never`/ISO/bare-minutes) and constant-time comparison
utilities. Add `POST /api/auth/register` and `POST /api/auth/token` — the
server transmits and stores only SHA-256 key hashes, never plaintext keys.

> Success Criteria: Fresh `DATA_DIR` boot creates schema v1 via tracked
> transactional migrations; the audit DB exists as a separate file whose rows
> redact sensitive details; the middleware chain orders correctly (auth before
> rate limits); a key hash round-trips register → token issuance; plaintext
> keys are rejected end-to-end.

- [ ] **Task 04: [Integration Component] Client Envelope Unwrap, Session Handoff & Twin-Port Runtime**

Description: Teach the client the server's language. `restAdapter.ts` unwraps
the uniform `{success, data}` envelope centrally — views never parse raw
responses. `LoginView.tsx` and `SetupView.tsx` consume the unwrapped session
(`token`, `type`, `user`) handed back by the identity endpoints, and `App.tsx`
routes on it. Pin the twin-port runtime topology: Vite dev server on
`:4545` proxying `/api` to the API server on `:4646`, with `tsconfig` project
references split for server/client compilation contexts.

> Success Criteria: A register → login → vault-fetch journey works through the
> unwrapped envelope; failed requests surface typed errors from the adapter;
> the dev topology runs both processes concurrently with the proxy wired.

---


## Phase 3: Vault CRUD, Lobster Keys & Settings Storage [Baseline: v0.0.0.3 (Build 4)]

> Phase Feature Set Overview:
> The vault learns to do business. The legacy `src/services/*` layer molts into
> the canonical `src/server/routes/*` kernel; four vault domains (passwords,
> notes, SSH keys, attachments) ship a uniform validated CRUD contract with
> ownership scoping, zod schemas and audit-on-mutation; the Lobster Keys©™
> lifecycle reaches parity (mint with scoped permissions, rate limits, expiry,
> revoke, delete — humans only); and server-side settings storage lands as a
> durable preference mirror. *(Receipts: `0150bd3`, `7d11c7a`, `b6a4703` —
> 2026-08-25. A pure backend day: Task B pairs as a security component.)*

- [ ] **Task 05: [Functionality] Validated Vault CRUD — Four Domains, Ownership Scoping & Audit Trail**

Description: Consolidate all vault routing into `src/server/routes/` —
`vault.ts`, `notes.ts`, `sshKeys.ts`, `attachments.ts` — and delete the legacy
`src/services/vault/*` routers. Each domain implements the uniform contract:
`GET` (canRead) · `POST` (canWrite + zod `validateBody`) · `PUT /:id`
(canEdit + validateBody) · `DELETE /:id` (canDelete). Every query scopes
`owner_uuid` from the authenticated identity, never request parameters; every
mutation writes an audit entry. Payload columns (`secret`, `content`,
`key_value`, `file_data`, `totp_secret`, `attachments`) pass through as opaque
ShellCryption ciphertext — the server never inspects them. Extend
`src/server/validation/schemas.ts` with per-domain create/update schemas.

> Success Criteria: All four domains round-trip through the uniform contract;
> a cross-owner access attempt fails closed; a payload column is never read
> server-side (opacity invariant); unvalidated bodies are rejected by zod.

- [ ] **Task 06: [Security Component] Lobster Keys Lifecycle Parity & Settings Storage**

Description: Implement the full Lobster Keys©™ lifecycle in
`src/server/routes/agentKeys.ts`: `GET` (list), `POST` (mint with scoped
permissions, `rate_limit`, `expires_at` — behind `authLimiter` and
`AgentKeySchemas.create`), `PATCH /:id/revoke`, `DELETE /:id` — all
`requireHuman`. Minted keys return plaintext exactly once; only hashes
persist. Revocation never affects human sessions. Add
`src/server/routes/settings.ts`: `GET`/`PUT /api/settings/:key` with
`requireHuman` for durable per-owner preference storage. Delete the legacy
`src/services/agents/` and `src/services/auth/` remnants.

> Success Criteria: A minted agent key works only within its permissions and
> rate limit; an expired or revoked key is rejected; agents are refused on all
> `requireHuman` surfaces; settings persist per owner across sessions.

---

## Phase 4: Test Oracle, Container Deployment & License [Baseline: v0.0.0.4 (Build 5)]

> Phase Feature Set Overview:
> The app becomes provable and shippable. A Vitest + supertest harness lands
> with per-suite `DATA_DIR` isolation (integration, security incl. cross-owner
> isolation, vault-crud incl. the opacity invariant, settings, build gates);
> the Bedrock learns to encrypt pre-existing plaintext databases in-place via
> PRAGMA rekey; the repo is packaged as a multi-stage single-container image
> with ghcr CI, compose stacks, an Unraid Community Applications template and
> an agent skill document; the documentation suite is rebuilt truthful
> (ARCHITECTURE, SECURITY, QUICKSTART, CONTRIBUTING, README, ROADMAP); the
> integration wrinkles are fixed; and AGPL-3.0 is adopted with audit fixes.
> *(Receipts: `f06fe7b`, `5246b7d`, `2a9b85a`, `7eeb265`, `695a092`, `f33a580`
> — 2026-08-24/26. Task B pairs as an infrastructure component.)*

- [ ] **Task 07: [Functionality] Test Harness with Per-Suite Isolation & In-Place Encryption Recognition**

Description: Build the Vitest + supertest verification oracle:
`tests/auth-flow.test.ts`, `tests/security.test.ts` (cross-owner isolation
fails closed, opacity invariant, rate limits), `tests/vault-crud.test.ts`
(uniform CRUD across all four domains), `tests/settings.test.ts`,
`tests/build-gates.test.ts` (lint/type/build encoded as executable tests),
and unit tests for the error handler. Helpers: `testDb.ts`, `testAuth.ts`,
`testFactories.ts` — every suite gets its own `DATA_DIR` sandbox before the
server module is dynamically imported. Fix the integration wrinkles
(`695a092`): test wiring, schema validation, import paths. Teach the Bedrock
connection to recognize a plaintext database created under an active
`DB_ENCRYPTION_KEY` and encrypt it in-place via SQLCipher `PRAGMA rekey`
(`f06fe7b`).

> Success Criteria: All suites pass in isolation and in parallel with zero
> shared state; a cross-owner access attempt fails in tests, proving tenancy;
> a plaintext DB under an active key is transparently rekeyed to ciphertext.

- [ ] **Task 08: [Infrastructure Component] Single-Container Packaging, ghcr CI, Unraid Template & Documentation Truthfulness**

Description: Package the application as a multi-stage `node:20-alpine`
single-container image with a `PUID`/`PGID`-aware entrypoint and healthcheck;
publish to `ghcr.io/clawstackstudios/shellguard` via a `docker-publish.yml`
workflow; provide prod/dev compose stacks and a `.dockerignore` that keeps
the lockfile. Ship the Unraid Community Applications template (WebUI port,
appdata bind mount, PUID 99/PGID 100 advanced defaults) and the agent skill
document (`skills/shellguard/SKILL.md`). Rebuild the documentation suite
truthful to the runtime: `ARCHITECTURE.md`, `SECURITY.md`, `QUICKSTART.md`,
`CONTRIBUTING.md`, expanded `README.md`, `BLUEPRINT.md` schema-v1 accuracy.
Adopt **AGPL-3.0** and fix npm audit findings.

> Success Criteria: The image builds, boots on a fresh `DATA_DIR`, and passes
> its healthcheck; CI publishes the image on push; the Unraid template
> installs; every doc claim is backed by runtime behavior (docs = app).

---




## Phase 5: Per-Row Metadata Encryption & Port Molt [Baseline: v0.0.0.5 (Build 6)]

> Phase Feature Set Overview:
> The second encryption layer descends. Server-side AES-256-GCM metadata
> encryption (title, username, url, category, notes, file_name) protects the
> sensitive-but-searchable columns, keyed from `DB_ENCRYPTION_KEY` via
> HKDF-SHA256 — governed by the `metadataGuard` registry, which deliberately
> excludes all client ShellCryption columns (the double-encryption firewall).
> Self-describing `SG-META` envelopes live in the same TEXT columns; legacy
> plaintext decrypts transparently on read; one-shot scripts convert existing
> rows. The dev/prod ports molt (`4545→5353`, `4646→5454`) across runtime,
> Docker, templates, tests and docs; and the triple-layer encryption model
> is documented. *(Receipts: `b71af08`, `8f74e8a`, `416c5c2` — 2026-08-26/27.
> Task B pairs as a configuration component.)*

- [ ] **Task 09: [Functionality] Per-Row AES-256-GCM Metadata Encryption with Guard Registry**

Description: Implement `src/server/utils/fieldEncryption.ts`: derive the AES-256
key from `DB_ENCRYPTION_KEY` (base64) via `hkdfSync` (salt
`shellguard-metadata-encryption-v1`, info `sg-meta-aes-256-gcm`); encrypt
metadata fields as self-describing `{v:1, alg:'SG-META', iv, ct}` JSON
envelopes in the same TEXT columns (Node native crypto, 96-bit IVs, empty
strings pass through, no-op passthrough without the key). Implement
`src/server/utils/metadataGuard.ts` as the single column registry
(`prepareWrite`/`prepareRead`) for `vault_pearls`, `vault_secure_notes`,
`vault_ssh_keys`, `vault_secure_attachments` — and NEVER register client
ShellCryption columns (`secret`, `content`, `key_value`, `file_data`,
`totp_secret`). Wire `prepareWrite`/`prepareRead` into all four vault domain
routes. Add `migrations/0002_metadata_encryption.{up,down}.sql` and the
one-shot `scripts/encrypt-existing-metadata.ts` /
`scripts/decrypt-existing-metadata.ts` converters.

> Success Criteria: With `DB_ENCRYPTION_KEY` set, metadata columns persist as
> `SG-META` envelopes and legacy plaintext rows decrypt transparently on read;
> ShellCryption columns remain byte-for-byte untouched; without the key,
> everything is a passthrough; the converters are idempotent.

- [ ] **Task 10: [Configuration Component] Port Molt & Triple-Layer Encryption Documentation**

Description: Migrate the twin-port topology upward — dev/prod
`4545→5353` (web) and `4646→5454` (API) — consistently across `package.json`
scripts, `apiConfig.ts`, Dockerfile, compose stacks, the Unraid template,
test configuration and documentation. Document the **triple-layer encryption
model** (client ShellCryption → server per-row metadata → SQLCipher at rest)
across `ARCHITECTURE.md`, `SECURITY.md`, `README.md`, `QUICKSTART.md` and
`BLUEPRINT.md`, including the ClawKey backup guidance.

> Success Criteria: A single grep finds no stale port references; the app
> boots on the molted ports in dev, container and template contexts; the
> docs' encryption model matches the runtime's three layers exactly.


## Phase 6: SuperLobster Admin Plane [Baseline: v0.0.0.6 (Build 7)]

> Phase Feature Set Overview:
> The reef gets an operator. A token-gated instance-administration plane lands
> at `/superlobster` — outside the zero-knowledge user model but strictly
> fenced by its own threat model: no `ADMIN_TOKEN` ⇒ no panel (routes 503),
> volatile in-memory sessions with 20-minute sliding expiry and an isolated
> `httpOnly` cookie namespace, constant-time token verification, dedicated
> rate limiting. The admin API covers lobster management with cascade
> deletion, read-only diagnostics, whitelist-only settings, the segregated
> audit log, and fail-safe Online-Backup-API snapshots with manifest +
> rotation — no HTTP restore, offline `scripts/restore.ts` procedure instead.
> The full panel suite ships as eight components plus the `BouncyBrand`
> brand-motion component and the admin-login hash alias. The agent build
> system also molts: the memory bank restructures under `.claude/`
> *(build-system receipts: `eab0272`, `8f47b35`, `9eb0f7e`)*.
> *(Core receipts: `5e789cc`, `4d23433` — 2026-08-27/28. First appearance of
> `attachmentUtils.ts` — the attachments architecture begins here.)*

- [ ] **Task 11: [Functionality] Admin API, requireAdmin Middleware & Offline Restore Validator**

Description: Implement `src/server/middleware/requireAdmin.ts` with the
T1/T2 threat model: routes return `503` without `ADMIN_TOKEN`; sessions are
volatile in-memory with 20-minute sliding expiry; `sg_admin_session`
`httpOnly`/`SameSite=Strict` cookie, separate from user Bearer tokens;
constant-time token comparison; dedicated `adminAuthLimiter`. Implement
`src/server/routes/admin.ts`: session auth (`POST /auth`, `GET /verify`,
`POST /logout`), strict-metadata lobster list and cascade `DELETE /users/:uuid`,
read-only `GET /status` and `GET /uptime`, whitelist-only
`GET`/`PATCH /settings`, `GET /audit` against the segregated `audit.sqlite`,
and fail-safe `POST /backup` (Online-Backup-API, manifest + rotation) with
`GET /backups` — never swapping, restoring or deleting the audit DB over
HTTP. Add `scripts/restore.ts` as the offline restore validator and
`ADMIN.md` documenting the secrets-aware threat model. The Bedrock
connection gains the audit-db segregation guard. First sprout of
`src/lib/attachmentUtils.ts` (attachment helpers) for panel metrics.

> Success Criteria: Without `ADMIN_TOKEN` every admin route returns `503`;
> a restart invalidates all admin sessions; non-constant-time comparison is
> absent; restore is impossible over HTTP; a failed backup never corrupts
> the live database; settings edits fail closed outside the whitelist.

- [ ] **Task 12: [UI Component] SuperLobster Panel Suite, Admin Gate & BouncyBrand**

Description: Implement the eight-component admin suite under
`src/components/Admin/`: `SuperLobsterContext` (volatile session state +
verify loop), `SuperLobsterLogin` (token gate with the admin-login hash
alias), `SuperLobsterPanel` (tabbed shell), `SuperLobsterStatus`
(diagnostics + uptime), `SuperLobsterUsers` (strict-metadata management +
cascade delete), `SuperLobsterSettings` (whitelist-only editor),
`SuperLobsterAudit` (log viewer) and `SuperLobsterBackups` (snapshot
trigger + manifest). Add `src/components/ui/BouncyBrand.tsx` as the
brand-motion component. Update `App.tsx` routing for `/superlobster` and
document the plane across `README.md`, `ARCHITECTURE.md`, `SECURITY.md`,
`QUICKSTART.md`, `BLUEPRINT.md` and `.env.example`.

> Success Criteria: The panel is unreachable without a valid admin session;
> every tab reflects its API section; the audit viewer reads the segregated
> DB; the UI fails gracefully when the panel does not exist (T1).

---

---


## Phase 7: Multi-Account, QuickLogin & Landing Gateway [Baseline: v0.0.0.7 (Build 8)]

> Phase Feature Set Overview:
> The client grows a face and a memory. `sessionManager.ts` introduces
> client-side multi-account sessions with per-identity isolation and active
> identity switching; `App.tsx` and `Header.tsx` refactor onto the new lobster
> state model; `QuickLoginModal` delivers the lock/unlock surface for switching
> known accounts or re-unlocking without full login; `LandingView` is rebuilt
> as the branded hero with the compact dual-mode **AuthGateway** (ClawChives
> pattern port — human `hu-` / agent `lb-` tabs) that doubles as protocol
> education, rendering the actual key-lifecycle diagram and the invariant
> verbatim: *"✅ hu- keys NEVER sent plaintext"*. The knowledge system molts
> alongside: the memory bank is untracked from the repo (agent-internal state
> stays local), `.env.example` gains a gitignore exception, and the VitePress
> documentation portal deploys to GitHub Pages.
> *(Core receipts: `5f777d7`, `8a89260`, `0d9f83c`, `b882ecb`, `0ed7f8a` —
> 2026-08-27/28. Docs receipt: `09a36e2`. Build-system receipt: `bc5cfc2`.)*

- [ ] **Task 13: [Functionality] Session Manager, Multi-Account State & Lock/Unlock Flow**

Description: Implement `src/lib/sessionManager.ts`: client-side multi-account
session store holding per-identity sessions (token, type, user profile) with
identity isolation and active-identity switching. Refactor `App.tsx` and
`Header.tsx` onto the new lobster state model — the active identity drives
the vault data fetch, the header shows the account switcher, and login/setup
flows write through the session manager. Add the QuickLogin flow state:
locked/reload states resolve through `QuickLoginModal` (switch known accounts
or re-unlock the current identity), improving auth state management across
`LoginView`, `SetupView` and the vault view. Untrack the agent memory bank
from the repo (`.claude/` stays local — agent-internal state never pollutes
the canonical tree) and add `.env.example` to the gitignore exception list.

> Success Criteria: Two identities can hold simultaneous sessions without
> data bleed; switching the active identity re-fetches that identity's vault
> only; a locked vault re-unlocks through the quick flow without re-entering
> setup; the repo tree contains no agent-internal memory state.

- [ ] **Task 14: [UI Component] LandingView Hero, Dual-Mode AuthGateway & VitePress Portal**

Description: Rebuild `src/components/LandingView.tsx` as the branded landing:
hero section, feature grid (carbon-based-first UX, `lb-` agent key
delegation for sub-agents), and the compact **AuthGateway** (ClawChives
pattern port) — dual tabs for human (`hu-`) and agent (`lb-`) authentication
with monospace brand-colored key inputs and a Hatch CTA into the vault. The
gateway doubles as education: render the actual key-lifecycle protocol
diagram (`Client → generates(hu-key) → derives(AES-GCM-256) → hashes(SHA-256)
→ POST /api/auth/register`) with the invariant stated verbatim. Polish
`BouncyBrand.tsx` with spring-bounce brand motion. Ship the VitePress
documentation suite (`docs/` with OpenClaw-inspired portal, themed Vue
components, agent-integration and architecture sections) with a
`deploy-docs.yml` GitHub Pages workflow.

> Success Criteria: The gateway authenticates both modes against the real
> endpoints; the rendered protocol diagram matches `key-hierarchy-spec.md`
> §2 exactly; the docs portal builds and deploys; every landing claim is
> backed by runtime behavior (docs = app).

---


## Phase 8: Vault UX Renaissance — Master-Detail, Pure Pods & Lock Hardening [Baseline: v0.0.0.8 (Build 9)]

> Phase Feature Set Overview:
> The vault matures into its final shape. The dashboard is refactored to a
> Bitwarden-style **master-detail architecture** (`VaultShell`, ItemList,
> ItemDetail, unified `ItemFormModal`) replacing monolithic tabs; **all
> hardcoded default pods are eliminated** (`DEFAULT_ROOT_PODS = []`) for pure
> user-driven pod management; pod categories normalize via `normalizePod()`
> with optimistic deletion updates; the vault lock hardens — every mutation
> path guarded by `isLocked`; and state-aware **`NavIntent`** navigation lands
> in the session manager. Claw-in navigation arrives (drag-and-drop key files,
> stronger key validation), `LobsterKeysTab` is extracted, the generator binds
> to the current identity, the TOTP issuer renames to ShellGuard, and the
> attractor-beacon philosophy enters the README. *(Receipts: `c14121d`,
> `fba8424`, `2afb3b8`, `f1694f2`, `4f3c1ab`, `6e33694`, `930375c`, `2dfa76c`,
> `af07c27`, `916460c`, `095f19a`, `c4d3e4b`, `8e7c16d` — 2026-08-28/29.
> Last pre-genesis phase: after this, the tags begin.)*

- [ ] **Task 15: [Functionality] Pod Normalization, Zero Hardcoded Pods, Lock Hardening & NavIntent**

Description: Eliminate every hardcoded default pod — `DEFAULT_ROOT_PODS = []`
and `INITIAL_DEFAULT_COLORS = {}` — making pod management purely user-driven:
pods display only when created by the user or assigned by items. Normalize
all pod/category comparisons through `normalizePod()` (sub-pods match by
`targetPod + "/"` prefix); fix sidebar layout, pod management UI and state
sync bugs; make deletions optimistic so removed pods vanish immediately
without server overwrite, cascading their items to uncategorized (`""`) —
never to a fallback pod. Harden the vault lock: guard `handleRenamePod`,
`handleDeletePod`, `SidebarFolderTree`, `PodModal`, item mutations
(`lockTheClaw`, `updateTheClaw`, deletion), live search dropdowns and header
add-menus behind `isLocked`. Add explicit `NavIntent` tracking to
`sessionManager.ts` (`sg_nav_intent`): `"landing"` intent persists across
manual logout; `"dashboard"` intent with quick-unlock modal on lock/reload.

> Success Criteria: A fresh vault renders zero pods and remains fully
> functional; an item in `Work/DevOps` is found by a `Work` tree filter;
> deleted pods disappear instantly with items cascading to uncategorized;
> no mutation succeeds while locked; reload after lock lands on the
> dashboard with quick unlock, logout lands on landing.

- [ ] **Task 16: [UI Component] Master-Detail Dashboard, Claw-In Gateway & Identity-Aware Tools**

Description: Refactor the dashboard UI from monolithic tabs to a responsive
two-pane **master-detail layout** — `VaultShell` hosting `ItemListPane` and
`ItemDetailPane`, with a unified `ItemFormModal` for create/edit across all
item types. Extract the `LobsterKeysTab` into its own dedicated component
with updated styling. Add claw-in navigation to the gateway: drag-and-drop
key file support and improved `hu-`/`lb-` key validation before submission.
Integrate the current user identity into generator configuration; rename the
default TOTP issuer to ShellGuard; remove obsolete lobster-keys knowledge
docs. Weave the attractor-beacon / data-survival philosophy into the README.

> Success Criteria: The two-pane layout renders responsively (detail pane on
> desktop, sheet on mobile); a key file dropped on the gateway validates
> before submission; the generator derives from the active identity; the
> TOTP issuer reads "ShellGuard".

---


## Phase 9: Genesis Release & Origin Hardening [v0.0.1 (Build 10) — 🏷️ First Tag]

> Phase Feature Set Overview:
> The reef is born into the world. The README sheds ASCII art for its Unicode
> block-text identity; the genesis release is cut — the first `RELEASE-v0.0.1.md`,
> CHANGELOG restructure and version bump. Then the first production-hardening
> lesson: on non-secure HTTP LAN origins, Chromium blocks `data:` URI downloads
> and withholds `crypto.randomUUID`/entropy — so all downloads move to
> in-memory `Blob` + `URL.createObjectURL`, and UUID/entropy generation gains
> multi-tier fallbacks (`crypto.randomUUID` → `getRandomValues` v4 →
> `Math.random` v4 last resort). *(Receipts: `f029872`, `dd4b701`, `946e774`,
> `893083c`, merge `c0baf0e` — 2026-08-29. Tag `v0.0.1` lands here.)*

- [ ] **Task 17: [Functionality] Origin-Safety Fallbacks — Blob Downloads & Entropy Resilience**

Description: Replace every `data:` URI download with in-memory `Blob` +
`URL.createObjectURL` and revocation on completion — `attachmentUtils.ts`
(attachment/QR downloads) and `crypto.ts` — because Chromium blocks `data:`
downloads on insecure origins (self-hosted HTTP LAN). Add multi-tier
fallbacks to `src/lib/crypto.ts`: `crypto.randomUUID` when available →
`getRandomValues`-built v4 UUID → seeded `Math.random` v4 UUID as last
resort, with equivalent entropy fallbacks for key material generation, so
zero-knowledge flows survive on non-secure LAN origins.

> Success Criteria: Attachments and QR codes download successfully over
> plain HTTP LAN; UUID/entropy generation never throws regardless of
> `crypto.subtle`/`randomUUID` availability; secure-origin behavior is
> unchanged.

- [ ] **Task 18: [Release Component] Genesis Release Protocol**

Description: Cut the first release: replace the ASCII logo with the Unicode
block-text identity in `README.md`; write `RELEASE-v0.0.1.md` (themed,
commit-ledger-backed release notes); restructure `CHANGELOG.md` with the
genesis entry; bump `package.json` to `0.0.1`. Establish the release grammar
the pipeline will reuse: tag `v0.0.1` → RELEASE doc → CHANGELOG → version
bump, in that order, with the commit ledger as receipts.

> Success Criteria: The tag `v0.0.1` exists; `RELEASE-v0.0.1.md` documents
> the sprint honestly (its feature list matches the roadmap Phases 1–8);
> CHANGELOG and package.json agree; the released artifact builds and boots.

---
