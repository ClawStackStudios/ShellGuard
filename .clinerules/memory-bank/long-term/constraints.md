# Long-Term Constraints — ShellGuard

*Boundaries with their origin events: what was tried, what broke, why the line exists.*

---

## Memory-bank territory: .clinerules is Cline's; .agents is Antigravity's
**weight**: 1 | **last validated**: 2026-09-16 | **first observed**: 2026-09-16

`.clinerules/memory-bank/` is this agent's memory bank. `.agents/` (including its memory-bank, rules, and skills mirrors) belongs to the Antigravity/Gemini agent — no writes, no mirrors, no maintenance from this side. Historical mirrors committed before this ruling remain as legacy; do not update them.

**History:**
- 2026-09-16: Lucas directed the split while initializing the long-term memory bank.

**Shaped perspective:** Two agents sharing one memory is how drift becomes invisible. Separate territories mean each agent's blind spots are diagnosable from its own files.

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
