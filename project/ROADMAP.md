---
roadmap_version: 1.0.0
last_updated: 2026-09-05
current_position: "Phase 1 transcribed (Baseline v0.0.0.1) — Phase 2: SQLite Bedrock & Security Kernel pending (v0.0.0.2)"
transcription_state: "Reverse-build walk in progress: v0.0.0.0 (void) → v0.0.1.8 (summit). Stages added one phase at a time, receipt-backed by git."
statistics:
  description: "Reverse-built deterministic roadmap for ShellGuard (web vault). Reconstructed post hoc from the git story: each phase's work matches the commits inside its release gap. Engineered in synergistic 2-task phases: Task A delivers core functionality, Task B delivers the corresponding UI/UX."
  features_completed: "Phase 1 transcribed · Phases 2–18 pending transcription"
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

---

<!-- Next: Phase 2 — SQLite Bedrock & Security Kernel [Baseline: v0.0.0.2 (Build 3)]
     Receipts: 10e3af9 (multiple-ciphers driver), 302c17d (DATA_DIR bedrock +
     transactional migrations + segregated audit db), df7b994 (singleton repoint),
     826ffbf (Express 5 security kernel), 7f62ca9 (shellkey identity endpoints),
     227a747 (envelope unwrap), 5337e8e (twin-port topology). -->
