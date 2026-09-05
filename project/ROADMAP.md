---
roadmap_version: 1.0.0
last_updated: 2026-09-05
current_position: "Phase 3 transcribed (Baseline v0.0.0.3) — Phase 4: Per-Row Encryption & Port Molt pending (v0.0.0.4)"
transcription_state: "Reverse-build walk in progress: v0.0.0.0 (void) → v0.0.1.8 (summit). Stages added one phase at a time, receipt-backed by git."
statistics:
  description: "Reverse-built deterministic roadmap for ShellGuard (web vault). Reconstructed post hoc from the git story: each phase's work matches the commits inside its release gap. Engineered in synergistic 2-task phases: Task A delivers core functionality, Task B delivers the corresponding UI/UX."
  features_completed: "Phases 1–3 transcribed · Phases 4–18 pending transcription"
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

