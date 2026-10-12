---
trigger: always_on
---

# Git Hygiene

## Isolation
- Never work directly on the default branch (main/master). Start every task on a fresh branch or worktree: `git checkout -b <type>/<short-desc>`.
- One task = one branch. Don't mix unrelated changes into the same branch or working tree.
- When handling urgent hotfixes or multi-agent parallel branches without disturbing in-flight state, utilize Git Worktrees (`git worktree add ../<path> -b <branch>`). Always clean up worktrees when finished (`git worktree remove`, `git worktree prune`).
- Before starting, snapshot state: `git status` and `git diff --stat`. If the tree is dirty with work you didn't author, stop and ask.
- When committing work you did not author (in-flight user edits), run the project's test + build gates on the merged working tree BEFORE the commit. Their edits ride your commit message; they ride your verification too.

## Commits & Conventional Standards
- Keep changes small and self-contained; one logical change per commit. No mega-commits, no unrelated refactors bundled in.
- Write strict Conventional Commit messages adhering to the standard:
  ```
  <type>(<scope>): <short imperative summary under 72 chars>
  ```
- **Subject Line Invariants**:
  - Maximum 72 characters.
  - Lowercase type name and optional scope in parentheses: `feat(vault):`, `fix(auth):`, `refactor(crypto):`.
  - Use the imperative mood ("add", "fix", "refactor", not "added", "fixes", or "adding").
  - No trailing period (`.`) at the end of the subject line.
- **Breaking Changes**:
  - Append `!` immediately after type/scope when introducing breaking changes: `feat(api)!: migrate payload structure` or `refactor(db)!: alter primary key`.
  - Document the breaking impact and migration instructions in a `BREAKING CHANGE:` footer block.
- Prefer new commits over amending. Never amend or rebase a commit without explicit written approval in the task.
- Never skip hooks (`--no-verify`) or bypass commit signing unless explicitly asked.
- Before any `git commit`, run `git diff --cached --stat` first. If the index contains staged changes you did not author, STOP and ask: (a) unstage-and-commit only your files, (b) bundle deliberately, or (c) commit theirs separately. Never assume `git add <mine> && git commit` commits only `<mine>`.

### Conventional Commit Types & Changelog Mapping
| Type | Purpose | Keep a Changelog Section |
| :--- | :--- | :--- |
| `feat` | New user-facing feature or capability | `Added` |
| `fix` | Bug fix, regression repair, error resolution | `Fixed` |
| `fix(security)` / `fix(crypto)` | Security patch, cryptographic hardening, CVE repair | `Security` |
| `refactor` | Code restructuring with zero behavior changes | `Changed` |
| `perf` | Performance, memory, or throughput optimization | `Changed` |
| `docs` | Documentation, comments, VitePress portal updates | (Documentation / omitted) |
| `test` | Adding or updating unit, integration, or seam tests | (Omitted from release notes) |
| `chore` | Maintenance, dependencies, tool configuration | (Omitted from release notes) |
| `ci` | CI/CD pipelines, GitHub Actions workflows | (Omitted from release notes) |
| `build` | Build system, packaging, Vite/Rollup config | (Omitted from release notes) |
| `revert` | Reverting a previous commit | `Removed` |

## Destructive operations — NEVER without explicit confirmation
- `git push --force` / `--force-with-lease`
- `git reset --hard`, `git checkout/restore` to an older commit
- Deleting branches, tags, or stashes
- `rm -rf` or any bulk file deletion
- If unsure whether a file belongs to another agent's in-flight work, stop and coordinate — don't delete to silence an error.

## Secrets & safety
- Never commit, read, or echo `.env`, `.env.*`, `secrets/**`, or any API keys/tokens.
- Never push to a protected branch; open a PR instead.
- Run linters, type checks, and the test suite before considering work done; don't commit if they fail.

## Attribution & Commit Body Format
- Commit under the human's configured identity (`git config user.name` / `user.email`). No separate agent identity, no AI co-author line.
- Every commit message uses the standard **Two-Layer Attribution Format** layered beneath the Conventional Commit header:

  ```
  <type>(<scope>): <short imperative summary under 72 chars>

  User: <the intention, system design, architecture decision, or glue that was provided>
  AI: <the concrete implementation, functions, refactors, or tests that were generated>

  [optional BREAKING CHANGE: <description and migration instructions>]
  [optional Issue References, e.g. Closes #123, Fixes #456]
  ```

- The `User:` line is always the *why/what* — the intent, spec, or structural decision.
- The `AI:` line is always the *how* — the code, logic, or test coverage that fulfilled it.
- If the human did the implementation directly (rare), put it under `User:` and write `AI: (none)`.
- If the agent did purely exploratory work with no human direction in that commit, write `User: (autonomous)` — but this should be the exception, not the norm.
- No trailers, no co-author lines, no `AI-Model:` metadata. The two-layer message *is* the attribution.

## Git Hygiene Do's and Don'ts
- **DO**: Follow Conventional Commits so automated changelog generators (`git-cliff`, `standard-version`) parse releases cleanly.
- **DO**: Reference issues and PRs (`Closes #123`) in the commit footer when resolving tracked work.
- **DO**: Keep scopes consistent across the project (`vault`, `auth`, `search`, `crypto`, `ui`, `api`, `deps`).
- **DON'T**: Bundle unrelated changes across multiple domains into a single "mega-commit".
- **DON'T**: Forget breaking change indicators (`!` or `BREAKING CHANGE:`) when changing contracts.
- **DON'T**: Commit failing code—automated pre-flight gates (`lint`, `test`, `build`) must be 100% green before staging.

## Rebase & History Rewriting Invariants
- **Local Commits Only**: NEVER rebase or rewrite commits on public or shared branches (`main`, `master`, or released tags).
- **Safety Snapshot Pre-Condition**: Always snapshot a temporary safety branch (`git branch backup/<branch>-pre-rebase`) before executing an interactive rebase, reset, or squash.
- **Autosquash Workflow**: Use `git commit --fixup <target-hash>` followed by `git rebase -i --autosquash` to automatically fold review fixes into their parent commits cleanly.
- **Non-Interactive Rebase in Automation**: When rebasing programmatically, avoid opening interactive editors: set `GIT_EDITOR=:` and `GIT_SEQUENCE_EDITOR=:` (or pass `--no-edit`).
- **Splitting Commits**: Mark the commit with `edit` in interactive rebase, run `git reset HEAD^`, then stage and commit individual atomic changes.
- **Universal Abort Escape Hatches**: If a rebase, merge, or cherry-pick hits unexpected or messy conflicts, cleanly bail out:
  ```bash
  git rebase --abort
  git merge --abort
  git cherry-pick --abort
  ```

## Disaster Recovery & The Reflog Safety Net
- **Reflog is the Safety Net**: Git retains all ref movements for at least 90 days. Accidental `git reset --hard` or deleted branches can be recovered via `git reflog`:
  ```bash
  git reflog
  git branch recovery-branch HEAD@{n}
  ```
- **Automated Regression Isolation (`git bisect`)**:
  - When tracking down an unexpected bug or regression across commits, leverage automated binary search:
    ```bash
    git bisect start HEAD <known-good-commit>
    git bisect run <test-command>
    git bisect reset
    ```

## Advanced Workflows Skill Linkage
- Deep-dive guides, cherry-pick patterns, worktree commands, and disaster recovery runbooks are codified in [`.agents/skills/git-advanced-workflows/SKILL.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/skills/git-advanced-workflows/SKILL.md).

## Agent Customization & Memory Bank Tracking
- Agent directories (`.agents/`, `.claude/`, `.clinerules/`) containing rules, skills, workflows, templates, and memory bank files are first-class repository citizens and MUST NOT be gitignored.
- Commit memory bank updates (`activeContext.md`, `progress.md`, `raw_reflection_log.md`) and rule/workflow adjustments alongside the code and release tasks they belong to.
- Do NOT commit ephemeral runtime agent scratchpads, local IDE cache files (e.g. `.crustagent/`), or temporary debug dumps.

## Multi-Agent Workspace Staging Safety
- In shared multi-agent repositories (e.g. Antigravity, Cline, Jules):
  - NEVER execute `git add .` or `git commit -a`.
  - Always stage explicit, targeted paths (e.g. `git add .agents/memory-bank/... src/...`).
  - Always run `git diff --cached --stat` before committing to verify that NO files from other agent directories (`.clinerules/`, `.jules/`) have entered the index.
  - Keep each agent's cognitive memory bank isolated and committed only under deliberate, attributed scopes.