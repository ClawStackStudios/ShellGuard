---
trigger: always_on
---

# Git Hygiene

## Isolation
- Never work directly on the default branch (main/master). Start every task on a fresh branch or worktree: `git checkout -b <type>/<short-desc>`.
- One task = one branch. Don't mix unrelated changes into the same branch or working tree.
- Before starting, snapshot state: `git status` and `git diff --stat`. If the tree is dirty with work you didn't author, stop and ask.
- When committing work you did not author (in-flight user edits), run the project's test + build gates on the merged working tree BEFORE the commit. Their edits ride your commit message; they ride your verification too.

## Commits
- Keep changes small and self-contained; one logical change per commit. No mega-commits, no unrelated refactors bundled in.
- Write clear, conventional commit messages (e.g. `feat:`, `fix:`, `refactor:`).
- Prefer new commits over amending. Never amend or rebase a commit without explicit written approval in the task.
- Never skip hooks (`--no-verify`) or bypass commit signing unless explicitly asked.
- Before any `git commit`, run `git diff --cached --stat` first. If the index contains staged changes you did not author, STOP and ask: (a) unstage-and-commit only your files, (b) bundle deliberately, or (c) commit theirs separately. Never assume `git add <mine> && git commit` commits only `<mine>`.

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

## Attribution
- Commit under the human's configured identity (`git config user.name` / `user.email`). No separate agent identity, no AI co-author line.
- Every commit message uses this two-layer format:

  ```
  <type>: <short summary>

  User: <the intention, system design, architecture decision, or glue that was provided>
  AI: <the concrete implementation, functions, refactors, or tests that were generated>
  ```

- The `User:` line is always the *why/what* — the intent, spec, or structural decision.
- The `AI:` line is always the *how* — the code, logic, or test coverage that fulfilled it.
- If the human did the implementation directly (rare), put it under `User:` and write `AI: (none)`.
- If the agent did purely exploratory work with no human direction in that commit, write `User: (autonomous)` — but this should be the exception, not the norm.
- No trailers, no co-author lines, no `AI-Model:` metadata. The two-layer message *is* the attribution.

## Rebase hygiene
- When rebasing, avoid opening editors: set `GIT_EDITOR=:` and `GIT_SEQUENCE_EDITOR=:` (or pass `--no-edit`).