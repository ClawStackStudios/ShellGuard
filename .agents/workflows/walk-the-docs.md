---
description: A deterministic workflow for walking and auditing root and portal documentation to ensure docs bow to code with absolute currency and rigor.
---

# 🚶 Walk the Docs Protocol Workflow

> **Core Axiom:** *"Docs Bow to Code."* Code is the bedrock ground truth; documentation is its faithful cartographic mirror. A change without updated documentation is incomplete work.
> **Use When:** Concluding a feature phase, completing post-verification hardening, applying database migrations, modifying API contracts or UI controls, or conducting an anti-rot documentation audit.
> **Pair With:** `.agents/rules/project-hygiene.md`, `.agents/rules/git-hygiene.md`, and `.agents/rules/cadence-and-lifecycle-prompts.md`.

---

## 🧭 Phase 1: Code Ground Truth Inventory (Cartography First)

Before editing a single markdown file, inspect the active codebase to establish exact, uncompromised numbers and facts:

1. **Database & Migrations:**
   - Run `ls migrations/*.sql` to confirm the exact migration range (e.g. `0001_initial` through `0008_note_attachments`).
   - Check table schemas, columns, indexes, and default values (`better-sqlite3` DDL in migrations and `src/server/database/`).
2. **API Routes & Wire Contracts:**
   - Inspect `server.ts` and `src/server/routes/*.ts` to verify exact mount paths (e.g. `/api/keys` vs `/api/ssh-keys`).
   - Inspect `src/server/validation/schemas.ts` for Zod body/query validation contracts.
   - Verify cascade delete mechanics across parent-child relationships.
3. **UI Controls & Storage Boundaries:**
   - Inspect constants (`ATTACHMENT_MAX_MB`, `GROTTO_QUOTA_MB`, timeouts).
   - Verify user-facing labels and form constraints in modal and pane components.
4. **Test Oracle Truth:**
   - Run `npm test` to capture exact suite count and test counts (e.g. `26 test suites / 313 passed`).

---

## 🗺️ Phase 2: Systematic Documentation Sweep (The 4 Zones)

Walk through the documentation across all four critical zones in sequence. Check off each file as it is aligned to code truth:

### 🏛️ Zone 1: Root Core Documentation
- [ ] **`ARCHITECTURE.md`**:
  - Update migrations list in the directory tree.
  - Update test suite count and list newly introduced test files.
  - Append a new numbered **Architectural Delta** detailing the intent, design invariants, files touched, and verification receipts.
- [ ] **`BLUEPRINT.md`**:
  - Update migration range in the header (e.g. `0001` through `0008`).
  - Align table DDL columns, types, and defaults (e.g. `uris`, `password_history`, `attachments`).
  - Register new migrations in the "Supporting Reefs & Migrations" list.
- [ ] **`README.md`**:
  - Verify API endpoint matrices (paths, HTTP methods, permission guards, descriptions).
  - Update reference model explanations (e.g. citing all supported parent types for attachments).
  - Verify storage quotas, rate limits, and setup flags.
- [ ] **`CHANGELOG.md`**:
  - Under `## [Unreleased]`, document sub-phase additions, fixes, and architectural adjustments.
  - Include file paths, migration numbers, and specific UX/security improvements.
- [ ] **`ROADMAP.md`**:
  - Check off completed sub-phases and tasks.
  - Verify migration numbering in upcoming forward phases (prevent numbering collisions with newly inserted migrations).

### 🧬 Zone 2: The Project Genome (`project/`)
- [ ] **`project/database-schema.md`**:
  - Synchronize SQLite DDL schemas with migrations.
  - Document migration version notes, Layer 1 vs Layer 2 encryption mappings, and indices.
- [ ] **`project/routes-and-contracts.md`**:
  - Update domain router table rows with payload columns, encryption layers, and cascade deletion rules.
  - Verify permission mappings (`canRead`, `canWrite`, `canEdit`, `canDelete`).
- [ ] **`project/meta-prompt-ai-studio.md`**:
  - Synchronize stage descriptions, sub-phase checklists, and execution prompt blueprints.
  - Align future phase migration references.

### 🤖 Zone 3: Agent Integration & Skills
- [ ] **`skills/shellguard/SKILL.md`**:
  - Synchronize TypeScript interface fields for vault domain items.
  - Document parameter options, default values, and cascade deletion behaviors.
- [ ] **`docs/agent-integration/api-reference.md`**:
  - Verify complete endpoint matrix with accurate paths and full CRUD verbs (GET, POST, PUT, DELETE).
- [ ] **`docs/agent-integration/lobster-keys.md`**:
  - Verify the permissions matrix correctly references all active API endpoints.

### 🌐 Zone 4: VitePress Documentation Portal (`docs/`)
- [ ] **`docs/reference/blueprint-schema.md`**:
  - Update ground-truth migration version and table schemas.
- [ ] **Feature Specifications (`docs/vault-features/`)**:
  - Update `the-grotto.md` item types tables with current payload and metadata columns.
  - Update `attachments.md` to reflect all parent types under the Reference Model, storage limits, and cascade rules.
  - Update `import-export.md` for supported import formats, sniffer logic, and export options.
- [ ] **VitePress Configuration (`docs/.vitepress/config.ts`)**:
  - Ensure sidebar titles, links, and page headings match updated documentation terminology (e.g. *Encrypted Attachments* vs *Password Attachments*).

---

## 🛡️ Phase 3: The Four Pre-Flight Verification Gates

Never declare a documentation walk complete until all four verification gates pass 100% green:

```bash
# 1. Documentation Portal Integrity (0 broken links, 0 markdown/SSR build errors)
npm run docs:build

# 2. Test Oracle Integrity (Verify all suites pass and match documented numbers)
npm test

# 3. Type & Syntax Integrity
npm run lint

# 4. Production Application Bundle Validation
npm run build
```

*If `docs:build` fails on broken links or malformed tags, fix them immediately. If tests fail, resolve root causes before proceeding.*

---

## 🧠 Phase 4: Memory Bank Synchronization

Keep cognitive continuity aligned with documentation state:

1. **`activeContext.md`**:
   - Update `Current Work Focus` and slide the `Recent Changes` window (maintaining the latest 10 events).
2. **`progress.md`**:
   - Update test suite counts, passing test metrics, and `Current Status`.
3. **`raw_reflection_log.md`**:
   - Record significant friction points, doc drift discoveries, or architectural insights.

---

## 📦 Phase 5: Multi-Agent Staging & Attribution Handshake

1. **Check Staging Safety:**
   ```bash
   git status
   git diff --stat
   ```
   *Verify that NO other agent homes (`.clinerules/`, `.jules/`) have been touched.*
2. **Present Live Verification & Commit Prompt:**
   Adhere to `cadence-and-lifecycle-prompts.md` Gate 1: Present automated gate receipts, summarize the documentation updates, and ask the human for approval to commit under the two-layer attribution format:
   ```text
   docs: <short summary of documentation synchronization>

   User: <intent, prompt, or architectural direction provided by human>
   AI: <exact docs updated, test counts verified, and build gates passed>
   ```
