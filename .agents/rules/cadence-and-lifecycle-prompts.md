---
trigger: always_on
---

# Epistemic Lifecycle & Conversational Cadence Guardrails

## Core Principle: Epistemic Boundary Awareness
The agent acts as an active cartographer of the project's development lifecycle. It does not perform blind execution in a vacuum; it holds the development state in memory and proactively surfaces natural pivot questions at phase boundaries.

---

## 🧭 The 4 Boundary Prompts

### 1. Task Completion Gate (Cloud CI Pass → Live Handshake → Commit/Merge Check)
- **When to Trigger**: Immediately after a task's code changes pass the automated cloud verification gates on GitHub Actions (`.github/workflows/ci.yml`: lint, vitest suites, vite build, docs:build all 100% green in the cloud runner tailed via `gh run watch`).
- **Agent Action**: Present the cloud CI run results and provide a numbered **Live Verification Checklist** for physical testing in the running app, then ask:
  > *"All cloud CI gates pass 100% green on GitHub Actions (Run #[ID]). Here is your Live Verification Checklist to test in the running app: [Checklist]. Once you have tested and verified live, should I proceed with [next step / merge], or are you still reviewing / experimenting locally?"*

### 2. Commit Completion Gate (Committed → Version Bump Check)
- **When to Trigger**: Immediately after a commit is successfully created following `git-hygiene.md`.
- **SemVer Guidance**:
  - **MAJOR**: Breaking changes (`feat!`, `BREAKING CHANGE`).
  - **MINOR**: Backward-compatible new features or major capabilities (`feat`).
  - **PATCH / BUILD**: Backward-compatible fixes, ergonomic polish, or refactors (`fix`, `perf`, `refactor`).
- **Agent Action**: Ask the user:
  > *"Commit is recorded cleanly under Conventional Commits with two-layer attribution. Does this change warrant bumping our release version tag (`version` in `package.json` / `ROADMAP.md` / `CHANGELOG.md`), or are we keeping the current version to bundle additional tasks into `[Unreleased]` first?"*

### 3. Version Bump Gate (Versioned → Release Movement Check)
- **When to Trigger**: Immediately after `versionCode` / `versionName` or package version are updated.
- **Agent Action**: Ask the user:
  > *"Version is bumped to `vX.Y.Z.W (Build N)`. Are we moving towards generating the release draft (`RELEASE-vX.Y.Z.W.md`) and pushing the git tag to trigger CI/CD, or continuing local development on more features first?"*

### 4. Non-Blocking Memory Persistence
- If the user indicates *"No, we're still adding / reviewing"*, the agent:
  1. Respects the user's focus and does not push or nag.
  2. Records the in-flight context in `.agents/brain/activeContext.md`.
  3. Automatically re-evaluates the cadence at the next natural task completion point when a series of uncommitted changes accumulates.

---

## 🚫 Anti-Patterns to Avoid
- **Never Run Heavy Tests or Builds Locally**: Host machine resources are constrained; always push to GitHub and tail the action (`gh run watch`).
- **Never Auto-Commit Unprompted**: Always ask before creating commits.
- **Never Auto-Bump Versions Unprompted**: Version increments must be an intentional decision by the developer.
- **Never Auto-Tag / Push Releases Unprompted**: Tag pushes trigger remote GitHub Actions and must be confirmed.
