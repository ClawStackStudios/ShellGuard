# 🏛️ ShellGuard Roadmap History — Archive Shard 1

> **CANONICAL HISTORICAL ARCHIVE — PHASES 1 THROUGH 14 (`v0.0.0.0` → `v0.0.1.6`)**
> *This document archives completed historical roadmap phases retired from the active [`ROADMAP.md`](../../ROADMAP.md) under the 3-version sliding-window protocol.*
> *Max shard limit: 3,000 lines.*

---

### 🏷️ Version Grammar & Architecture

This archive preserves the deterministic reverse-built roadmap reconstructed post hoc from the repository's git history. Every phase contains strictly paired 2-task deliveries: **Task A [Functionality/Security Engine]** paired with **Task B [UI Component/Interactive State]**, backed by cited commit receipts and verifiable test criteria.

For active in-flight molts and the 3 most recent completed phases (Phases 15, 16, and 17), consult the active [`ROADMAP.md`](../../ROADMAP.md).

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


## Phase 9: Genesis Release & Origin Hardening [v0.0.1 (Build 10) — First Tag]

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


## Phase 10: Deployment Hotfixes & Dev-Loop Formalization [v0.0.1.2 (Build 11)]

> Phase Feature Set Overview:
> The first post-genesis hotfix bracket — and the build system grows teeth.
> The full development loop is formalized as agent-consumable rules and
> workflows (`.agents/rules/docs-hygiene.md`, `.agents/workflows/start-task.md`
> and `finish-task.md`) welding documentation to the code it describes. The
> **rolling RELEASE file model is born**: `RELEASE-v0.0.1.md` is `git mv`'d
> upward to `RELEASE-v0.0.1.2.md` and rewritten — release notes never
> accumulate as separate files. Version bumps to `0.0.1.2` for deployment
> hotfixes. *(Receipts: `7d513b0`, `753c913`, `841e0d7`, `1132a12` —
> 2026-08-29. A pure process bracket: both tasks are process/release
> components — the first phase with no runtime code.)*

- [ ] **Task 19: [Process Component] Full Development Loop Rules & Workflows**

Description: Formalize the agent development contract under `.agents/`:
`rules/docs-hygiene.md` (documentation must evolve in the same change as the
code it describes — deferred doc updates are incomplete tasks),
`workflows/start-task.md` (branch isolation, memory-bank load, receipt
discipline) and `workflows/finish-task.md` (verification gates, handoff,
commit grammar). These rules govern every subsequent phase of this roadmap —
including the transcription of the roadmap itself.

> Success Criteria: The rules are agent-consumable as written; docs-hygiene
> is enforced by the finish-task workflow; every later phase's commit trail
> follows the start/finish grammar.

- [ ] **Task 20: [Release Component] Rolling RELEASE File & Hotfix Version Bump**

Description: Establish the rolling release-notes model: `git mv
RELEASE-v0.0.1.md RELEASE-v0.0.1.2.md` and rewrite the contents for the
hotfix — exactly one `RELEASE-v*.md` exists at any time, forever. Bump
`package.json` to `0.0.1.2`, update `README.md` version reference, append
the CHANGELOG hotfix entry. The tag `v0.0.1.2` follows the release grammar:
tag → RELEASE doc → CHANGELOG → version bump.

> Success Criteria: The repo contains exactly one RELEASE file, named for
> the current version; CHANGELOG and package.json agree; the release grammar
> of §5 of the verification oracle is followed exactly.

---


## Phase 11: Release Publishing CI & Iconography [v0.0.1.3 (Build 12)]

> Phase Feature Set Overview:
> The pipeline begins to run itself. A GitHub Actions workflow auto-publishes
> GitHub Releases on tag push; Docker GHCR builds trigger on tags with
> semver-tag generation; the rolling RELEASE file molts to
> `RELEASE-v0.0.1.3.md` with its commit ledger synced; the Unraid template
> and browser favicon move to SVG (the `favicon.svg` that later seeds the
> TOTP companion's launcher icon); obsolete `CRUSTAGENT.md`/`CRUSTSECURITY.md`
> docs are removed and version references re-align to `v0.0.1` with legacy
> migration text purged. *(Receipts: `20be1c3`, `d1bffb3`, `c6666a3`,
> `1db4bf9`, `de2372a`, `050ff8e`, `0840653`, `50eef47`, `c0a9459`,
> `6181084`, `0c1785c` — 2026-08-29.)*

- [ ] **Task 21: [Functionality] Release Publishing Workflow & GHCR Tag Triggers**

Description: Add `.github/workflows/release.yml`: on tag push, publish a
GitHub Release whose body is the exact contents of the rolling
`RELEASE-v*.md` — no auto-generated notes, no fallback. Trigger
`docker-publish.yml` on tag pushes with semver-derived image tags
(`v0.0.1.3`, `0.0.1.3`, `latest`). Bump to `v0.0.1.3`: molt the rolling
RELEASE file upward (`git mv RELEASE-v0.0.1.2.md RELEASE-v0.0.1.3.md`),
rewrite contents with the bracket's changes, sync the commit ledger, append
the CHANGELOG entry.

> Success Criteria: Pushing `v0.0.1.3` publishes a GitHub Release whose body
> matches the RELEASE file byte-for-byte; GHCR receives semver image tags;
> the repo still contains exactly one RELEASE file.

- [ ] **Task 22: [Configuration Component] SVG Iconography & Documentation Re-Alignment**

Description: Convert the Unraid template icon and browser favicon to SVG —
`public/favicon.svg` carries the bioluminescent shield with the
`#e4048a → #ec4899 → #06b6d4` gradient (the artwork later inherited by the
ShellGuard-TOTP launcher). Remove obsolete `CRUSTAGENT.md` and
`CRUSTSECURITY.md`; re-align every version reference to `v0.0.1` across
`ARCHITECTURE.md`, `README.md`, `ROADMAP.md`, `QUICKSTART.md`, the docs
portal and `CHANGELOG.md`, purging legacy migration text.

> Success Criteria: No stale version references remain (single grep); the
> favicon renders the brand gradient; the docs tree contains no obsolete
> knowledge files; the docs = app principle holds on every touched page.

---


## Phase 12: Pure TypeScript WebCrypto Fallback Engine [v0.0.1.4 (Build 13)]

> Phase Feature Set Overview:
> The second LAN-resilience lesson, and the deepest. On non-secure browser
> origins `window.crypto.subtle` is undefined — the entire client-side
> ShellCryption stack would be dead on the most common self-host topology
> (Unraid at a LAN IP). The answer is `webCryptoFallback.ts`: a **427-line
> pure TypeScript engine** — SHA-256 (FIPS 180-4, full K256 constant table),
> HMAC-SHA256 (RFC 2104), HKDF (RFC 5869), AES-GCM-256 (NIST SP 800-38D) —
> **cryptographically identical byte-for-byte** with native WebCrypto, behind
> an availability selector so callers never branch. Proven by
> `tests/unit/webCryptoFallback.test.ts` against native vectors. Companion
> fixes complete the origin-safety migration: drag-drop `preventDefault()`
> (dropping a key file no longer navigates away) and QR downloads → Blob.
> Docs CI gains `VITEPRESS_BASE` and broader triggers; the README banner
> restyles. *(Receipts: `977eab3`, `4319cb0`, `7df330e`, `415b1c8`, `71439cb`,
> `8fff3f0`, `76a2347`, merge `d8251a2` — 2026-08-29.)*

- [ ] **Task 23: [Functionality] Pure TypeScript WebCrypto Fallback Engine**

Description: Implement `src/lib/webCryptoFallback.ts` with pure TypeScript
implementations of SHA-256, HMAC-SHA256, HKDF (extract + expand), and
AES-GCM-256 — byte-for-byte identical with the native WebCrypto API. Add the
availability selector to `src/lib/crypto.ts` (native `crypto.subtle` when
present, fallback engine when not) and route `src/lib/shellCryption.ts`
through it — the `{v, alg:'AES-GCM-256', iv, ct, aad}` envelope format is
identical either way and callers never branch. Prove parity with
`tests/unit/webCryptoFallback.test.ts` (native-vector comparison). Fix the
drag-drop navigation leak (`preventDefault()` in `App.tsx` /
`GeneratorToolView.tsx`) and convert remaining QR downloads to Blob +
ObjectURL.

> Success Criteria: Full ShellCryption round-trips succeed on an origin
> where `crypto.subtle` is undefined; fallback output is byte-identical to
> native vectors; dropping a key file never navigates the browser; the
> envelope format is indistinguishable between native and fallback paths.

- [ ] **Task 24: [Release Component] v0.0.1.4 Release & Docs CI Hardening**

Description: Molt the rolling RELEASE file (`git mv RELEASE-v0.0.1.3.md
RELEASE-v0.0.1.4.md`), rewrite with the fallback-engine story, append the
CHANGELOG entry, bump `package.json` to `0.0.1.4`. Harden docs CI:
`VITEPRESS_BASE` environment-driven base path (default `/ShellGuard/` for
GitHub Pages styling) and broadened main-branch triggers in
`deploy-docs.yml`. Restyle the README banner.

> Success Criteria: The VitePress portal renders styled under its GitHub
> Pages subpath; docs CI triggers on main pushes; exactly one RELEASE file
> named for the current version; CHANGELOG and package.json agree.

---


## Phase 13: Bitwarden-Style Custom Fields [v0.0.1.5 (Build 14) — Milestone]

> Phase Feature Set Overview:
> The vault grows Bitwarden-style custom fields — four types (📝 Text,
> 🔒 Hidden, ☑️ Checkbox, 🔗 Linked) across all vault item types. Migration
> `0003_custom_fields` adds a `custom_fields` TEXT column to the three
> item tables; fields are **client-ShellCrypted** with distinct AAD
> namespaces per item type (`vault_pearls_custom:{id}`,
> `vault_secure_notes_custom:{id}`, `vault_ssh_keys_custom:{id}`) and stay
> **off the metadataGuard registry** — the double-encryption firewall holds.
> The modal UX is polished alongside: restructured custom-fields section,
> dropdown positioning with backdrop dismissal, scrollable body with pinned
> header/footer. *(Receipts: `6270418`, `dcad9b9`, `cef78c4`, `9c08b39`,
> `a21bdc1`, `d482116`, merge `6686dc3`, `8c3b1a3` — 2026-08-29/30.)*

- [ ] **Task 25: [Functionality] Custom Fields Data Layer — Migration, Types & Opaque-Blob Routing**

Description: Implement the `CustomField` model in `src/types.ts` —
`CustomFieldType` (`text` | `hidden` | `checkbox` | `linked`),
`CustomFieldLinkedProperty` (`username` | `password` | `url` | `notes` |
`totp`), and the `CustomField` interface (linked fields store the source
property name; resolution happens at render time). Add
`migrations/0003_custom_fields.{up,down}.sql` — `custom_fields TEXT
DEFAULT ''` on the three item tables, holding client-ShellCrypted JSON.
Wire `custom_fields` through `vault.ts`, `notes.ts`, `sshKeys.ts` routes
and validation schemas as an **opaque blob**: length/type validated, content
never inspected, never registered in metadataGuard. Encrypt client-side with
distinct AAD namespaces per item type.

> Success Criteria: Fields round-trip encrypted across all three domains;
> the blob is byte-for-byte opaque server-side; AAD verification fails on
> cross-item substitution; `custom_fields` is absent from the metadataGuard
> registry (firewall holds).

- [ ] **Task 26: [UI Component] Custom Fields Editor & Detail Renderers, Modal Polish**

Description: Restructure the custom-fields section in `ItemFormModal` —
add-field dropdown with corrected positioning and backdrop dismissal; modal
layout with scrollable body and pinned header/footer. Implement per-type
rendering in `ItemDetailPane`: Text (plaintext + copy), Hidden (masked with
eye-toggle reveal + copy), Checkbox (status chip), Linked (`Linked to
[Property]` badge with live value resolution against the decrypted parent —
including `totp` rendering the live 30-second countdown display). Update the
README license badge to AGPL-3.0; molt the RELEASE file and cut `v0.0.1.5`.

> Success Criteria: All four field types create, edit and render correctly
> across pearls, notes and SSH keys; linked fields update live when the
> parent property changes; the modal scrolls internally with pinned chrome;
> the milestone is tagged with a matching RELEASE file.

---

---

## Phase 14: Native LAN TLS with Self-Signed Certificates [v0.0.1.6 (Build 15)]

> Phase Feature Set Overview:
> The server encrypts its own transport. With `TLS_ENABLED=true`, `server.ts`
> wraps Express in `https.createServer` with HSTS active; `tlsManager.ts`
> resolves certificate materials in three tiers (bring-your-own via
> `TLS_CERT_PATH`/`TLS_KEY_PATH` → reuse the persisted pair in
> `DATA_DIR/certs/` with a stable fingerprint → generate a fresh 10-year
> EC P-256 self-signed pair), collecting SANs for localhost, loopback and
> every non-internal interface — valid however the operator reaches the box.
> SHA-256 fingerprints log at boot for TOFU pinning; the Docker healthcheck
> and `.env.example` become TLS-aware; 8 new tests in `tests/tls.test.ts`.
> Companion work: `release.yml` gains `--release` commit-flag publishing,
> `DESIGN.md` syncs with the master-detail and custom-fields patterns, the
> `.agents/` directory molts out of the git index (agent rules go local,
> like the memory bank), release-notes hygiene cleans the rolling model,
> and the first Android companion documentation initializes — the
> ShellGuard-TOTP bridge begins. *(Receipts: `fa72f67`, `2c13b39`,
> `d982474`, `e8497bd`, `9aba894`, `33157ff`, `f35ba4a`, merge `02ed28e`,
> `f3448c9` — 2026-08-29/30.)*

- [ ] **Task 27: [Functionality] TLS Manager, Conditional HTTPS Server & TOFU Fingerprinting**

Description: Implement `src/server/utils/tlsManager.ts` with the three-tier
material resolution: (1) bring-your-own certs via `TLS_CERT_PATH` /
`TLS_KEY_PATH`; (2) reuse an existing generated pair in `DATA_DIR/certs/`
— the SHA-256 cert fingerprint stays stable across restarts; (3) generate
a fresh 10-year EC P-256 self-signed pair and persist it. Collect SANs for
`localhost`, loopback, and every non-internal network interface. In
`server.ts`: `TLS_ENABLED=true` wraps Express in `https.createServer`;
HSTS activates when TLS terminates natively; boot logs the protocol and
fingerprint for trust-on-first-use. Make the Docker healthcheck and
`.env.example` TLS-aware; document the transport threat model in
`SECURITY.md` and the LAN-HTTPS recipe in `QUICKSTART.md`. Prove it all in
`tests/tls.test.ts` (generation, persistence/reuse, fingerprint stability,
SAN completeness, conditional protocol).

> Success Criteria: A fresh instance boots HTTPS with a generated cert whose
> fingerprint is stable across restarts; the cert validates for the LAN IP;
> BYO certs are honored; HSTS is present exactly when TLS terminates
> natively; all TLS tests pass.

- [ ] **Task 28: [CI/Configuration Component] `--release` Publishing Flag & Documentation Sync**

Description: Extend `release.yml`: commit messages containing `--release
<version>` trigger automated release publication (the rolling RELEASE file
as body) — releases no longer require manual tag pushes alone. Synchronize
`DESIGN.md` with the modern master-detail layout and custom-fields
patterns; untrack `.agents/` from the git index (agent rules live local,
like the memory bank); clean release-notes hygiene for the rolling model;
initialize the Android companion documentation suite (architecture specs
and engineering guidelines — the ShellGuard-TOTP bridge begins); molt the
RELEASE file and cut `v0.0.1.6`.

> Success Criteria: A `--release` commit publishes without a manual tag;
> DESIGN.md matches the runtime UI patterns exactly; no agent-internal
> state remains tracked; the companion docs seed exists at the summit of
> the cross-project bridge.

---

## Phase 15: `sgtotp.bak` Import Compatibility Layer [v0.0.1.7 (Build 16)]

> Phase Feature Set Overview:
> The bridge completes. The web vault learns to open its Android sibling's
> backups: `sgtotpBackup.ts` parses the `sgtotp.bak` format (encrypted
> `shellguard-totp-backup-v1` envelopes, plaintext exports, bare item
> arrays), decrypting client-side via HKDF-SHA256 (salt = `ownerUuid`,
> AAD `totp_backup:{ownerUuid}`) + AES-GCM-256 through the **pure TS
> fallback primitives** (LAN-safe), with the enforced SHA-256 checksum over
> the exact decrypted string. Items map to fresh-UUID vault pearls,
> `normalizePod()` categories, original timestamps preserved;
> `ImportExportView` sniffs formats with the PIN/key modal. Companion work:
> the **strict RELEASE-doc mirror** in `release.yml` (exact-version
> resolution, hard fail, no auto-notes), the dynamic theme engine with
> multi-accent support, `AGENTS.md` for the Gemini identity in the Android
> companion tree, and the landing-header dark-mode brand fix.
> *(Receipts: `138952b`, `b0fcc47`, `7054595`, `074eab0`, `7b7a90c`,
> `68da985`, `0b259f7`, `2d7d9a2`, `b125fab`, `fc7e9df`, merge `c6d17d8` —
> 2026-08-30 → 09-03. Contract source of truth: `compatibility_layer.md`.)*

- [x] **Task 29: [Functionality] `sgtotpBackup.ts` Parser, Client-Side Decryption & Timestamp Preservation**

Description: Implement the parser/mapper in `src/lib/sgtotpBackup.ts` —
contract mirrored from the Android `BackupManager.kt` +
`ShellCryptionEngine.kt`: sniff encrypted `shellguard-totp-backup-v1`,
plaintext `shellguard-totp-plain-export-v1`, or bare `BackupItemDto[]`;
decrypt envelopes client-side (HKDF-SHA256: ikm = export key, salt =
`envelope.ownerUuid`, info = `clawchives-shellcryption-v1` → AES-GCM-256,
AAD `totp_backup:{ownerUuid}`) using the pure TS fallback primitives; verify
the SHA-256 checksum over the exact decrypted item-array string (post-decrypt,
byte-reproducible). Map items to vault pearls with **fresh UUIDs**,
`normalizePod()` categories, `algorithm`/`digits`/`period` passthrough, and
**original `localUpdatedAt` preserved** as `created_at`. Prove the full
crypto round-trip in `tests/unit/sgtotpBackup.test.ts` (encrypted fixture,
plaintext, bare array, checksum mismatch, AAD tamper). Write
`compatibility_layer.md` as the cross-project format contract.

> Success Criteria: All three input formats import correctly on HTTP LAN
> origins; a checksum mismatch or AAD tamper aborts before persistence;
> imported seeds re-encrypt under `vault_pearls_totp:{id}`; timestamps
> survive the journey; Android ids are never reused.

- [x] **Task 30: [UI Component] ImportExportView Format Sniffing, Key Modal & Strict Release Mirror**

Description: Extend `ImportExportView.tsx`: detect sgtotp formats on file
selection, prompt for the export key/PIN via a modal for encrypted
envelopes, show the imported-count preview, and commit through the parser
with sanitized errors. In CI: rewrite `release.yml` to the **strict
RELEASE-doc mirror** — exact-version `RELEASE-<tag>.md` resolution with hard
failure (no auto-notes, no fallback) so the GitHub Release body is the
RELEASE file verbatim. Implement the dynamic theme engine (adaptive
light/dark + multi-accent support) in the client; add `AGENTS.md` for the
companion's Gemini identity; fix the landing header's dark-mode brand
divider; molt the RELEASE file and cut `v0.0.1.7`.

> Success Criteria: Encrypted backups import via the key modal with
> sanitized failure modes; the GitHub Release body matches the RELEASE file
> byte-for-byte or the pipeline fails loudly; themes switch live across
> light/dark and all accents; the bridge is usable end-to-end on LAN.

## Phase 16: Docs Bridge Parity, Agentic Infrastructure & Version Resolver [v0.0.1.8 (Build 17) — Summit]

> Phase Feature Set Overview:
> The walk ends where the application stands today — and the documentation
> system becomes a first-class citizen. The project scaffolds its agentic
> knowledge infrastructure: a comprehensive memory bank (including a
> dedicated `android/` sub-bank mirroring the companion's crypto, Room
> schema, TOTP engine and UI models), workflow templates, and formalized
> agentic rule sets — then synchronizes release-pipeline invariants and
> formalizes agent git tracking. The **dynamic version resolver**
> (`src/server/utils/version.ts`) replaces fragile env reads with
> `package.json` ground truth (multi-tier fallback, unit-tested). The
> official privacy policy and TOTP store disclosures land; the VitePress
> companion suite publishes; two-sided bridge parity is achieved across
> root documentation; the release pipeline gains optimized triggers and a
> chained mirror job; the installation guide moves to placeholder IPs; and
> the rolling RELEASE file molts to `v0.0.1.8`.
> *(Receipts: `ddc35f5`, `124e4ab`, `80babe5`, `acab2ab`, `700c18c`,
> `1244c5f`, `e61675b`, `bbcc2f5`, `a68008f`, `70d7d46`, `ec4e136`,
> `0b6ad1f`, `82616f2`, merge `66d9ca4` — 2026-09-04/05. The walk and the
> codebase now occupy the same commit.)*

- [x] **Task 31: [Functionality] Agentic Knowledge Infrastructure & Dynamic Version Resolver**

Description: Initialize the project scaffolding for agent collaboration: a
comprehensive memory bank under `.agents/memory-bank/` — core files plus a
dedicated `android/` sub-bank (api-client, crypto-spec, room-schema,
totp-engine, ui-compose-models) mirroring the companion's internals —
workflow templates, and agentic rule sets (attractor beacon, git hygiene,
docs hygiene, continuous improvement). Synchronize release-pipeline
invariants and formalize agent git tracking (two-layer commit grammar,
staged-index discipline, verification gates). Implement
`src/server/utils/version.ts` — `getAppVersion()` resolving dynamically
from `package.json` with multi-tier fallback, replacing fragile env reads
in `admin.ts`, `backupManager.ts` and `server.ts`; prove it with
`tests/unit/version.test.ts` (semver compliance + package ground-truth
match).

> Success Criteria: The version presented in the SuperLobster panel, backups
> and API always equals `package.json`; the resolver survives a missing env
> var; the memory bank loads a cold agent into full project context; the
> android/ sub-bank mirrors the companion's spec truth.

- [x] **Task 32: [Documentation Component] Privacy Policy, Docs Bridge Parity & Chained Mirror Release**

Description: Publish the official privacy policy (`docs/privacy.md` —
zero-knowledge disclosures compliant with Play Store requirements) with
store disclosures cross-linked into the VitePress portal and CHANGELOG.
Publish the ShellGuard-TOTP native companion documentation suite
(`docs/companion/`: topology, security, sync-and-backups, totp-engine).
Achieve two-sided bridge parity: every root doc (`ARCHITECTURE.md`,
`BLUEPRINT.md`, `SECURITY.md`, `README.md`, `ADMIN.md`, `CONTRIBUTING.md`,
docs portal) reconciled to runtime schema truth. Optimize `release.yml`
triggers and chain the mirror job (release body re-syncs when the RELEASE
file changes on main). Move the installation guide to placeholder IPs.
Molt the RELEASE file to `v0.0.1.8` and cut the release through the
`--release` commit-flag path.

> Success Criteria: The docs claim nothing the runtime doesn't do — both
> sides of every bridge verified; the privacy policy renders in the portal
> and satisfies store disclosures; a RELEASE-file edit on main re-syncs the
> published release body; the summit tag exists.
