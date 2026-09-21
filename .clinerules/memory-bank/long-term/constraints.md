# Long-Term Constraints — ShellGuard

*Boundaries with their origin events: what was tried, what broke, why the line exists.*

---

## Territory: .clinerules is my home; other agents' trees are theirs
**weight**: 4 | **last validated**: 2026-09-20 | **first observed**: 2026-09-16

The **entire `.clinerules/` tree** — rules, skills, workflows, templates, memory bank — is my home in this project, and I write in it freely. `.agents/` (Antigravity) and `.jules/` (Jules) are *their* homes: no writes, no mirrors, no "helpful" fixes, not even for cosmetic corrections. Rules are **shared seeds, not shared state** — the same rule text may exist in every agent's tree, but each agent learns its own path as it works, so identical seeds never imply mirrored edits. Cross-home reading is read-only (absorb, do not mirror); a defect found in another agent's file gets reported, never reached into.

**History:**
- 2026-09-16: Lucas directed the memory-bank split while initializing the long-term bank (`.clinerules/memory-bank/` vs `.agents/memory-bank/`).
- 2026-09-20: broadened by ruling — the territory is the *whole* `.clinerules/` tree, not just the bank; the rule layer is territorial too, and a `.jules/` third agent identity now exists. The prior "mirror to `.agents/rules/`" habit retires.

**Shaped perspective:** Two agents sharing one home is how drift becomes invisible; separate homes make each agent's blind spots diagnosable from its own files. "Helping" another agent by editing their rules destroys exactly the signal that makes their path legible — the divergence between seeds is the learning, not noise to be normalized away.

---

## Exactly one RELEASE-v*.md, rolling upward; tag hard-fails without it
**weight**: 2 | **last validated**: 2026-09-16 | **first observed**: 2026-09-16 (rule predates)

The repository holds exactly one release document for the current/upcoming release; it is `git mv`-rolled and rewritten, never duplicated. The tag must point at a commit containing it — release.yml hard-fails otherwise.

**History:**
- 2026-09-16: v0.0.1.10 rolled from v0.0.1.9 per the protocol; body mirror verified via gh release view.

**Shaped perspective:** The hard-fail is the feature: a release can never publish without its mirror document, so the notes can never drift from the artifact.

---

## Never rename cross-project contract identifiers
**weight**: 2 | **last validated**: 2026-09-16 | **first observed**: 2026-09-16 (canon ruling)

`deriveShellKey`, `shellKey`, `ShellKeyFallback`, envelope fields, and the identity-file JSON shape are pinned by `project/shellcryption-spec.md` and the companion's crypto-spec. House terms (ClawKey) govern prose; contracts govern code.

**History:**
- 2026-09-16: 14 UI strings renamed to ClawKey while internals deliberately kept.
- 2026-09-16: ratified into lobsterized-philosophy NEVER list.

**Shaped perspective:** Prose serves humans; identifiers serve compilers and sibling agents. Renaming internals for aesthetic canon would burn the companion's spec for zero user value.

---

## Literal-path routes register ABOVE parameterized siblings
**weight**: 3 | **last validated**: 2026-09-20 | **first observed**: 2026-09-20

In Express, route matching is registration-ordered. A literal path (`/bulk`, `/bulk-import`, `/export`) registered *after* a parameterized sibling (`/:id`) is unreachable — the param route binds the literal as its value (`id="bulk"`) and the handler 404s. Every literal route goes above the `/:id` family, and the ordering is asserted by a test that calls the literal path.

**History:**
- 2026-09-20: Phase 21 shipped `router.delete('/bulk')` after `router.delete('/:id')` — the entire bulk-delete feature was dead on arrival while `tsc`, `vite build`, and all 20 pre-existing suites stayed green (no test touched the literal path).

**Shaped perspective:** The compile-green lie: a route that exists in the file, type-checks, and is never invoked by a test is a hypothesis, not a feature. Ordering invariants are invisible to every static read — the witness test is the only instrument that sees them.

---

## Verify the commit, not the checkout
**weight**: 3 | **last validated**: 2026-09-20 | **first observed**: 2026-09-20

A PR review that reads the working tree can report "all fixed" for code that was never committed. Before calling a PR reviewable: `git status --porcelain` (clean?), `git log --oneline origin/main..HEAD` (what is actually in the PR?), `git show HEAD:<file>` (grep the fix inside the commit, not on disk).

**History:**
- 2026-09-20: Phase 21 — the executor corrected all five review blockers and left every one of them uncommitted; `HEAD` still held the broken commit with the route-shadowing P0 and no test file. Merging then would have shipped the defect the review was meant to prevent.

**Shaped perspective:** File-by-file reading produces a confident review of an intention. The repository's truth lives in the commit graph, and only three cheap commands interrogate it. A review that skips them is reading a draft and calling it the artifact.
