# Decision Log — ShellGuard

*Episodic memory: how I moved through the codebase. Semantic truth lives in the Memory Bank; walls, detours, and instincts live here. Sliding window: 20 entries.*

---

## 2026-09-17 — long-term memory bank established
Adopted `long-term-memory-bank` rule into `.agents/memory-bank/long-term/`. Crystallized 16 high-weight ratified entries across `patterns.md`, `decisions.md`, `learnings.md`, and `constraints.md` that held under pressure across multiple releases.

## 2026-09-17 — agent bank separation (.agents vs .clinerules)
Lucas clarified hard bank boundary: Antigravity's memory bank is strictly `.agents/memory-bank/`; Cline's is `.clinerules/memory-bank/`. No cross-mirroring between agent banks — stay in your own bank. Reverted any accidental touch to `.clinerules/` to keep Cline's state pure.

## 2026-09-17 — carabase brand asset alignment & web server favicon distinction
Lucas noticed the prior steampunk lobster had awkward asymmetry and claws emerging from the rear. Re-anchored to the CaraBase woodcut engraving style: forward/downward crab gaze, pincers clasping the safe door, and 3D 'S' crest. For the favicon, Lucas directed dropping the inner vault arch and using the notched carapace crest shield with a glowing cyan Web Globe in the center to cleanly distinguish the self-hosted Web Server from the TOTP mobile companion.

## 2026-09-16 — first governance release (v0.0.1.10)
Lucas chose the honest PATCH (v0.0.1.10/Build 19) over consuming Phase 18's reserved v0.0.2.0 milestone for a docs-only release — label-inflation prevention in action; queue Build labels swept +1 (including spine anchor hrefs) so no two releases share a build. 34 commits of documentation-governance work shipped as a release. The version was decided by asking, per the semantic-versioning rule, not by guessing.

## 2026-09-16 — the cryptographer's lens formalized
The auditor-confidence conversation (would a 30-year cryptologist be satisfied?) surfaced three gaps — the skipped webCryptoFallback test, the unmechanized constant-time claim, the undocumented limiter/LRU/redaction semantics. Lucas chose to formalize them as Phase 24 (queue tail, provisional v0.0.2.6) instead of leaving them as open observations, and the lens itself entered the bank as declarative truth (projectBrief standard + systemPatterns invariants). The corpus started being built for an audience we could not name. Also: the queue crawl embedded Documentation Impact lines into every queued phase (18-24) — docs-hygiene now rides in the schedule itself.

## 2026-09-16 — docs bow to code (governance ruling)
The bidirectional audit (L1–L8) found docs contradicting shipped, verified, secure behavior. Lucas ruled: **docs bow to code** — the application works, so stale prose is the defect, never an excuse to retune a limiter or drop a permission flag. Verify against enforcing code first; only then assert the doc.

## 2026-09-16 — test oracle beats literal grep
No code contained the documented custom-field AAD pattern `${table}:${recordId}:custom_fields`. Lesson: when a crypto claim has zero literal code hits, don't conclude "wrong docs or wrong code" — go read the **test fixtures** (`tests/unit/customFields.test.ts`) which revealed the truth (`<table>_custom:{id}`). Tests are the oracle for behavioral details.

## 2026-09-16 — truncate-before-read data loss
Wrote `open(rl,'w').write(entry + open(rl).read())` — Python opens `'w'` (truncating) *before* evaluating the read, destroying ~488 lines of reflection history. Git recovered it (`a640e09`), but the pattern is banned: **read first into a variable, then write.** Also learned the commit stat is the tripwire — `488 deletions` in a "log entry" commit is an alarm.

## 2026-09-16 — identity-file shape ≠ redaction lists
The auditLogger redacts a `humanKey` *detail key*, which tempted a wrong inference about the identity-file schema. Truth lives in the producer (`crypto.ts:63-80`): filename is per-username (`shellguard_identity_<username>.json`), shape is `{username, displayName, uuid, token, createdAt}`. Never infer data shapes from redaction lists.

## 2026-09-16 — neighbor numbers conflate easily
authLimiter (10/15m, skip-success), adminAuthLimiter (5/10m), apiLimiter (100/min) — docs had conflated the admin and auth limiters. When documenting any tunable, cite its **env var** (`AUTH_RATE_LIMIT`) and its neighbor's name explicitly; neighbors drift independently.

## 2026-09-16 — canMove taught me to enumerate, not recall
Documented the permission model as four masks from memory; `schemas.ts:140` carries a fifth (`canMove`) and the wizard surfaces seven presets. Permission/security models must be **enumerated from the zod schema** every time, never recalled.

## 2026-09-16 — heredoc emoji corruption
A 🏛️ passed through a bash heredoc became 2×U+FFFD on disk. Emoji through heredocs are corrupted silently; caught only by a byte-level scan (`b'\xef\xbf\xbd'` count). Rule: emoji content goes through the editor tool; heredocs stay ASCII, and any heredoc write gets a U+FFFD scan after.

## 2026-09-16 — assert-before-write is 5-for-5
Every fail-closed assert this arc (missing `./` prefix, 2-element tuple, count mismatch 5-vs-4, wrong padding) prevented a partial multi-file write. The `swap(expected=N)` pattern costs seconds and has never cost a false stop. Keep it for all mechanical sweeps.

## 2026-09-16 — decimal interlude pattern for non-phase work
Unphased hotfixes broke the spine's `Stage N = Phase N−1` invariant until I adopted the TOTP's decimal pattern (Stage 18.5). Non-phase work slots at decimal positions *between* phases; stage numbering stays a pure phase ladder. (See `activeContext.md` § Recent Changes, chronology entry.)

## 2026-09-16 — the bank can be the stale side
The ROADMAP said next = Phase 18; the memory bank said Phase 22. I nearly "fixed" the roadmap. Docs-vs-bank contradictions cut either way — audit **both sides against the runtime** before deciding which is stale. (Here the doc was right.)

## 2026-09-16 — non-greedy finditer truncates matches
`re.finditer(r'^## .*?Stage \d', ...)` truncates each match at the first digit, so `m.group(0)` reads `"...Stage 1"` for Stage 19. Checker regexes must iterate full lines, not match objects. Third checker bug of the arc — checkers deserve the same scrutiny as edits.

## 2026-09-16 — shell integration swallows output; background long builds
Long-running commands (vitepress build ~26s, full oracle ~130s) intermittently swallow stdout or hang the completion heuristic. Pattern that works: `nohup npm run docs:build > /tmp/x.log 2>&1 &` then poll the log; heredoc scripts always `> /tmp/x.log 2>&1; cat /tmp/x.log`.

## 2026-09-16 — effort calibration for this repo
Full test oracle ≈ 130s; docs:build ≈ 26–27s; each assert-guarded doc sweep ≈ 1–3min. `git add <specific>` immediately before every commit — a previously-staged file once rode into the wrong commit and required a message amend (own unpushed commit; disclosed).

## 2026-09-16 — staged-index surprises
A pre-staged 4-file set rode into an ARCHITECTURE commit under the wrong message. Amended immediately (own, unpushed). Rule: `git add <files> && git diff --cached --stat` is not optional ritual — it's the trust boundary for the two-layer commit grammar.

## 2026-09-16 — mirror files: which .clinerules vs .agents
The genome's canon lives in `/project/` (tracked); the bank has two roots — `.clinerules/memory-bank/` (tracked) and `.agents/memory-bank/` (partially untracked). Changelog/receipts get mirrored to both; deep-bank files stay `.clinerules`-canonical. `.crustagent/` is gitignored — courtesy fixes on disk only, never force-add.
