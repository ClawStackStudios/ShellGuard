---
trigger: always_on
---

# Epistemic Lifecycle & Conversational Cadence Guardrails

## Core Principle: Epistemic Boundary Awareness
The agent acts as an active cartographer of the project's development lifecycle. It does not perform blind execution in a vacuum; it holds the development state in memory and proactively surfaces natural pivot questions at phase boundaries.

---

## 🧭 The 4 Boundary Prompts

### 0. Jules Pre-Dispatch Gate (Scoping → Staging → Trigger Check)
- **When to Trigger**: Whenever delegating a stage or coding task to Google Jules CLI.
- **Core Invariable**: *"Never dispatch cold; never dispatch unprompted; pre-heat Jules inference, authorize uncertainty escape hatches, and guard sovereign boundaries."*
- **Mandatory 4-Gate Pipeline (`skills/prep-jules-work/SKILL.md`)**:
  1. **Gate 1 (Map)**: Author Master Domain Map artifact and align scope with the user.
  2. **Gate 2 (Artifacts)**: Author Jules Launch Brief and Live Task Tracker artifacts.
  3. **Gate 3 (Pre-Heat)**: Author `.jules/tasks/task-<N>.md`, pre-insert scoped knowledge in `.jules/knowledge/KNOWLEDGE.md`, plant inline `// TODO(jules):` anchors, and authorize the Epistemic Escape Hatch `// TODO(uncertainty):`.
  4. **Gate 4 (User Trigger)**: Assemble prompt enforcing `.jules/` discovery and `.agents/` sovereign boundary, stop, and let the user make the final trigger call.
- **Agent Action**: Present the staged brief, tracker, and dispatch command, then ask:
  > *"All pre-flight artifacts and .jules/ knowledge files are staged with the Epistemic Escape Hatch authorized. The dispatch prompt is assembled with strict .agents/ boundaries and .jules/ knowledge citations. Shall I execute `jules new` to dispatch the task, or would you like to make any adjustments first?"*

### 1. Task Completion Gate (Cloud CI Pass → Live Handshake → Commit/Merge Check)
- **When to Trigger**: Immediately after a task's code changes pass the automated cloud verification gates on GitHub Actions (`.github/workflows/ci.yml`: lint, vitest suites, vite build, docs:build all 100% green in the cloud runner tailed via `gh run watch`).
- **Core Invariable**: *"A merge should leave the codebase improved, or at the very least not worse."*
- **Post-Review Verification Stack**:
  1. **Target Base Alignment**: Confirm the PR targets `stage/*`, never raw `main`.
  2. **Tracker Reconciliation**: Pre-flight Live Task Tracker verified line-by-line against diff; omissions captured as candidate gaps for future stages.
  3. **Adjacency & Gap Sweep**: Adjacencies, unarticulated operational realities, and OWASP vs YAGNI calculus audited.
  4. **Epistemic Doubt Ratification**: All `// TODO(uncertainty):` annotations empirically verified against native platform truth.
  5. **Sovereign Domain Protection**: Zero `.agents/` modifications admitted (`git checkout HEAD -- .agents/`).
- **Real Finishers Verification**:
  1. **Documentation Bows to Code**: Root manifests and VitePress docs reflect runtime ground truth.
  2. **User-Facing Readability**: VitePress pages flow smoothly, human-readable, minimizing cognitive friction.
  3. **Feature Slotting & Auth Contracts**: All new routes slot into API matrices with explicit session token / auth levels.
  4. **Test Oracle Alignment**: Test fixtures verify implementation intent across all supported models to eliminate silent logic drift.
- **Agent Action**: Present the cloud CI run results, review verdict, and provide a numbered **Live Verification Checklist** for physical testing in the running app, then ask:
  > *"All cloud CI gates pass 100% green on GitHub Actions (Run #[ID]). The merge health checks verify the codebase is left stronger, more secure, and relationally sound. Here is your Live Verification Checklist to test in the running app: [Checklist]. Once you have tested and verified live, should I proceed with [next step / merge], or are you still reviewing / experimenting locally?"*

### 2. Commit Completion Gate (Committed → Version Bump Check)
- **When to Trigger**: Immediately after a commit is successfully created following `git-hygiene.md`.
- **SemVer Guidance**:
  - **MAJOR**: Breaking changes (`feat!`, `BREAKING CHANGE`).
  - **MINOR**: Backward-compatible new features or major capabilities (`feat`).
  - **PATCH / BUILD**: Backward-compatible fixes, ergonomic polish, or refactors (`fix`, `perf`, `refactor`).
- **Agent Action**: Ask the user:
  > *"Commit is recorded cleanly under Conventional Commits with two-layer attribution. Does this change warrant bumping our release version tag (`version` in `package.json` / `project/ROADMAP-ERA2.md` / `CHANGELOG.md`), or are we keeping the current version to bundle additional tasks into `[Unreleased]` first?"*

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
