---
description: A workflow for the ClawStack Studios Release Protocol for new version Releases.
---

# New Release Protocol Workflow

> **Use When:** Orchestrator Initiated. Never draft releases without user verification or validation of the release.
> **Rule:** Never claim the release is ready or complete until you have verified the test oracle passes and all documentation is synchronized.

---

## 🛡️ Step 1: Pre-Release Verification Loop
> *"Align implementation intent with test oracle to prevent silent logic drift"*

Run a full verification loop:
- `npm run lint` — Lint and type-check the codebase.
- `npm run test` — All tests are required to pass. If any tests fail, trace the root cause and restore passing state.
- `npm run build` — Verify production build compiles cleanly without errors.
- `docker compose -f docker-compose.dev.yml up --build` — (If container changes occurred) Verify container builds and health-checks return 200. Clean up images after testing.

---

## 📝 Step 2: Draft Release Notes & Documentation

1. **Create Release Document:** Create `RELEASE-vX.Y.Z.N.md` in the root directory following `[release-template.md](file:///config/Documents/workspace-lucas/projects/Agents/ShellGuard/.agents/templates/release-template.md)`. Remove older draft release files.
2. **Synchronize Codebase Versioning:** Follow `/version-update` to bump:
   - `package.json` (`"version": "X.Y.Z.N"`)
   - `README.md` badge (`[![Version](https://img.shields.io/badge/Version-vX.Y.Z.N-blue?style=for-the-badge)](CHANGELOG.md)`)
   - `CHANGELOG.md` (`## [X.Y.Z.N] - YYYY-MM-DD`)
3. **Memory Bank Sync:** Update `.agents/memory-bank/activeContext.md` and `.agents/memory-bank/raw_reflection_log.md`.

---

## 🏷️ Step 3: Git Hygiene & Annotated Tagging

1. **Stage & Commit:**
   ```bash
   git add package.json README.md CHANGELOG.md RELEASE-vX.Y.Z.N.md
   git commit -m "chore: prepare release vX.Y.Z.N

   User: <Release intent and version target>
   AI: <Summary of changes, test verification, and documentation synchronization>"
   ```

2. **Create Annotated Tag:**
   ```bash
   git tag -a vX.Y.Z.N -m "Release vX.Y.Z.N: [Short Descriptive Title]"
   ```

3. **Merge to Main:** Ensure work is merged into `main` using `--no-ff`.

---

## 🚀 Step 4: Upstream Synchronization & GitHub Release Publication

Releases are made official by pushing code, pushing the annotated tag, and generating the GitHub Release object. The release pipeline in `.github/workflows/release.yml` uses server-evaluated job-level `if:` guards to eliminate runner VM provisioning on standard development commits, while sequentially chaining the `mirror` job.

1. **Option A: Commit Message Flag (Claurst Style — Recommended):**
   Include `--release vX.Y.Z.N` in the commit message:
   ```bash
   git commit -m "chore: prepare release vX.Y.Z.N --release vX.Y.Z.N

   User: <Release intent and version target>
   AI: <Summary of changes, test verification, and documentation synchronization>"
   git push origin main
   ```
   *(Note: Pushing a commit containing `--release vX.Y.Z.N` to `main` executes `release` to publish the release and tag, followed immediately by `mirror` to sync the body verbatim from `RELEASE-vX.Y.Z.N.md`.)*

2. **Option B: Tag Push:**
   ```bash
   git tag -a vX.Y.Z.N -m "Release vX.Y.Z.N: [Short Descriptive Title]"
   git push origin main
   git push origin vX.Y.Z.N
   ```

3. **Pipeline Invariants & Mirror Synchronization:**
   - **Zero-Waste Server Evaluation**: Commits on `main` lacking `--release` skip both `release` and `mirror` before allocating an `ubuntu-latest` VM (0 billable minutes consumed).
   - **Sequential Chaining (`needs: [release]`)**: `mirror` waits for `release` to ensure the release object and tag exist, then mirrors the root `RELEASE-vX.Y.Z.N.md` notes into the GitHub Release via `gh release edit`.
   - **Manual Dispatch Exclusion**: Manual `workflow_dispatch` triggers execute only the `release` job and bypass `mirror`.

4. **Verify Release Status:** Confirm the release appears live on GitHub under `https://github.com/ClawStackStudios/ShellGuard/releases`.