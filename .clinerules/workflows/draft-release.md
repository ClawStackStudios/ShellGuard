---
description: A workflow for the ClawStack Studios Release Protocol — rolling release document, single source of truth, mirrored to GitHub by CI.
---

# New Release Protocol Workflow

> **Use When:** Orchestrator Initiated. Never draft releases without user verification or validation of the release.
> **Rule:** Never claim the release is ready or complete until you have verified the test oracle passes and all documentation is synchronized.

---

## ⚖️ The Release Document Invariant (read this first)

- The repository holds **exactly ONE** release document: `RELEASE-vX.Y.Z.md` — for the current or upcoming release.
- It is the **single source of truth** for the GitHub release body. `.github/workflows/release.yml` mirrors it verbatim. **NEVER hand-edit release notes on GitHub.**
- Releases **roll the file upward**: `git mv RELEASE-v<prev>.md RELEASE-v<next>.md`, then rewrite the contents. **Never create a new release file.**
- The document **MUST exist at the exact tagged version** before the tag is pushed — `release.yml` **hard-fails** otherwise (no newest-file fallback, no auto-generated notes). This is intentional: a release can never publish without its mirror document.
- Editing the document **after** a release? Just commit + push — the CI mirror job syncs the GitHub release body automatically.

---

## 🛡️ Step 1: Pre-Release Verification Loop
> *"Align implementation intent with test oracle to prevent silent logic drift"*

Run a full verification loop:
- `npm run lint` — Lint and type-check the codebase.
- `npm run test` — All tests are required to pass. If any tests fail, trace the root cause and restore passing state.
- `npm run build` — Verify production build compiles cleanly without errors.
- `docker compose -f docker-compose.dev.yml up --build` — (If container changes occurred) Verify container builds and health-checks return 200. Clean up images after testing.

---

## 📝 Step 2: Roll the Release Document & Synchronize Versioning

1. **Roll the release document (never create a new one):**
   ```bash
   git mv RELEASE-v<prev>.md RELEASE-vX.Y.Z.N.md
   ```
   Then rewrite its contents following `.clinerules/templates/RELEASE.md`: core summary, key themes, architecture topology map, commit ledger since the previous tag (`git log --oneline v<prev>..HEAD`), deployment instructions. If no release document exists yet (first release), create one from the template.
2. **Synchronize Codebase Versioning:** Follow `/version-update` to bump:
   - `package.json` (`"version": "X.Y.Z.N"`)
   - `README.md` badge (`[![Version](https://img.shields.io/badge/Version-vX.Y.Z.N-blue?style=for-the-badge)](CHANGELOG.md)`)
   - `CHANGELOG.md` (`## [X.Y.Z.N] - YYYY-MM-DD`)
3. **Memory Bank Sync:** Update `.clinerules/memory-bank/activeContext.md` and `.clinerules/memory-bank/raw_reflection_log.md`.

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

> [!IMPORTANT]
> The tag must point at a commit that **contains** `RELEASE-vX.Y.Z.N.md` — the release workflow hard-fails without it.

---

## 🚀 Step 4: Upstream Synchronization & GitHub Release Publication

Releases are made official by pushing code and pushing the annotated tag — CI mirrors the release document into the GitHub Release body.

1. **Push Branch and Tag Upstream:**
   ```bash
   git push origin main
   git push origin vX.Y.Z.N
   ```
   *(Pushing `v*` tags triggers `.github/workflows/release.yml`, which publishes the release with `RELEASE-vX.Y.Z.N.md` as the body — or hard-fails if the document is missing.)*

2. **Amending an Already-Published Release:**
   Edit `RELEASE-vX.Y.Z.md`, commit, and push to `main` — the **mirror job** syncs the GitHub release body automatically. Manual `gh release edit vX.Y.Z.N --notes-file RELEASE-vX.Y.Z.N.md` remains available as an immediate alternative.

3. **CLI Direct Publication (Alternative / Immediate):**
   ```bash
   gh release create vX.Y.Z.N --verify-tag --title "ShellGuard vX.Y.Z.N" --notes-file RELEASE-vX.Y.Z.N.md
   ```

4. **Verify Release Status:** Confirm the release appears live under `https://github.com/ClawStackStudios/ShellGuard/releases` and that its body mirrors the document.