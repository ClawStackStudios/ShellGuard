# Long-Term Learnings — ShellGuard

*Sensitivities that took multiple cycles to discover. Facts live in the temporal bank; these are the felt shapes.*

---

## Assert-before-write, fail-closed always
**weight**: 6 | **last validated**: 2026-09-16 | **first observed**: 2026-09-15

Every mechanical edit runs through count-asserted swaps that fail before writing. Every checker iterates full lines (non-greedy finditer truncates matches). Every write is verified by re-read plus a structural probe copied from the file itself, never from memory.

**History:**
- 2026-09-15/16: five fail-closed saves (missing ./ prefix, 2-element tuple, count 5-vs-4, wrong padding, apostrophe parse error) — zero partial writes.
- 2026-09-16: checker bugs caught twice (finditer truncation; unescaped paren) — checkers get the same scrutiny as edits.

**Shaped perspective:** The discipline is not caution; it is speed. A failed assert costs seconds; a partial multi-file write costs a session. Probes copied from memory are how checkers lie.

---

## Shell-environment hazards (this container)
**weight**: 5 | **last validated**: 2026-09-16 | **first observed**: 2026-09-15

Bash heredocs corrupt astral emoji to U+FFFD; long commands and multi-line heredocs intermittently get swallowed by shell integration; `open('w')`-before-read truncates. Ratified mitigation lives in `skills/editor-large-inserts.md` § Environment Hazards: unicode escapes in heredocs, nohup + log polling, read-then-write, byte-scan after writes, editor tool for emoji content.

**History:**
- 2026-09-15: temple glyph corrupted (byte-scan caught it).
- 2026-09-15/16: repeated stdout swallowing on builds; adopted nohup + poll.
- 2026-09-16: 488-line truncation from open-w-before-read; recovered from git.

**Shaped perspective:** Exit codes lie, logs do not. The environment is an unreliable narrator — every long operation writes its own witness file, and every write gets a byte-level receipt.
