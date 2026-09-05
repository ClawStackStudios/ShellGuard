# Learning Proposal — Session 2026-09-03 (sgtotp.bak / v0.0.1.7)

> **request_feedback: false** — ✅ APPROVED by Lucas 2026-09-03. All three candidates applied:
> - Candidate 1 → `git-hygiene.md` Commits section (staged-index check)
> - Candidate 2 → `.clinerules/skills/editor-large-inserts.md` (new skill)
> - Candidate 3 → `git-hygiene.md` Isolation section (verify before committing others' edits)


---

## Candidate 1: Staged-vs-Untracked Check Before Committing

**Classification:** Rule UPDATE → `git-hygiene.md` (Commits section)

**Incident:** When committing the landing-header fix, a pre-existing **staged** `RELEASE-v0.0.1.6.md → RELEASE-v0.0.1.7.md` rename was swept into the commit. `git status --short` was checked beforehand, but it doesn't distinguish staged-vs-untracked intent — the rename was Lucas's in-flight release work, not mine.

**Root cause:** `git add <file> && git commit` commits the *entire index*, not just the added file. Checking "tree is dirty" is insufficient; one must check *what is already staged*.

**Proposed addition to `git-hygiene.md` → Commits section:**

```markdown
- Before any `git commit`, run `git diff --cached --stat` first. If the index
  contains staged changes you did not author, STOP and ask: (a) unstage-and-commit
  only your files, (b) bundle deliberately, or (c) commit theirs separately.
  Never assume `git add <mine> && git commit` commits only `<mine>`.
```

---

## Candidate 2: Editor Insert-Line Clipping Hazard

**Classification:** Skill (new, workflow-level) — could live in `.clinerules/skills/` or as a git-hygiene-adjacent note

**Incident (×3 in one session):** Using the editor tool with `insert_line` and no `old_text` anchor **clipped the tail** of the region at the insertion boundary:
1. `tests/unit/sgtotpBackup.test.ts` — SAMPLE fixture lost `isLocalOnly…};`
2. `src/lib/sgtotpBackup.ts` — `ParsedSgTotpBackup` interface tail duplicated/orphaned at EOF (2 separate breaks)
3. `ImportExportView.tsx` — JSX `)}` conditional close lost, breaking the build

Each was only caught by running tests/build afterward — which worked, but cost 3 debug cycles.

**Root cause:** Boundary-anchored inserts replace content at the boundary line; multi-line JSX/interface tails at insertion points are especially fragile.

**Proposed new skill — `.clinerules/skills/editor-large-inserts.md`:**

```markdown
# Skill: Large Editor Inserts Without Clipping

When inserting >30 lines (or JSX/interface blocks) into an existing file:
1. Prefer replacing a bounded `old_text` anchor (e.g., the exact closing lines)
   over bare `insert_line` at a boundary.
2. If `insert_line` must be used, re-read ±15 lines around the insertion point
   afterward and verify the boundary lines survived intact.
3. After any multi-insert session, run the transform gate (vitest on touched
   files + `npm run build`) BEFORE committing — transform errors ("Unexpected }",
   "Expected identifier") are the signature of clipping, not logic bugs.
```

---

## Candidate 3: Verify Before Committing Others' In-Flight Edits

**Classification:** Rule UPDATE → `git-hygiene.md` (Isolation section) — small

**Incident:** Lucas's uncommitted `sgtotpBackup.ts` enhancement (`created_at` preservation) was committed as part of "let's commit the work" — I ran the sgtotp test suite + build on the final state first, which is why it shipped green.

**Proposed addition to `git-hygiene.md` → Isolation section:**

```markdown
- When committing work you did not author (in-flight user edits), run the project's
  test + build gates on the merged working tree BEFORE the commit. Their edits ride
  your commit message; they ride your verification too.
```

---

## Recommendation

- **Candidate 1** — highest value; universal guardrail. **Recommend: apply.**
- **Candidate 2** — high frequency (3 hits in one session). **Recommend: apply as skill.**
- **Candidate 3** — small but cheap; formalizes what already worked. **Recommend: apply.**

Awaiting Lucas's approval before touching `git-hygiene.md` or creating the skill file.
