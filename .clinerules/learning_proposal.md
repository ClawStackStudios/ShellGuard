# Learning Proposal — Session 2026-09-13/14 (ShellGuard: coherence audit, Phase 17, LobsterKeys UI)

> **request_feedback: false — APPROVED & APPLIED 2026-09-13** — approved by Lucas; all three candidates applied and mirrored to .agents/.

---

## Candidate 1: Full Masking of Secrets in UI (RULE UPDATE)

**Classification:** Rule UPDATE → `lobsterized-philosophy.md` (add to the NEVER list)

**Incident:** The LobsterKeys card's masked state initially preserved CaraBase's
`maskKey()` behavior — first 6 + dots + last 4 — leaking 10 cleartext characters
in the hidden state. Lucas corrected: "mask the full key, not just the truncated
center." Fix: `key.replace(/./g, '•')`.

**Proposed addition to the ⛔ NEVER list:**

```markdown
- ❌ `NEVER` render a partially masked secret — masks must cover the ENTIRE
  value (every character → `•`). Leading/trailing cleartext in a "masked"
  state is a leak, not a UX affordance. (Masking algorithms that preserve
  prefixes/suffixes are rejected in review.)
```

---

## Candidate 2: SQLite Security-Migration Pattern (NEW SKILL)

**Classification:** Skill (new) → `.clinerules/skills/sqlite-security-migration.md`

**Incident:** Phase 17's key-ledger retirement hit three wall classes in sequence:
(1) `DROP COLUMN` refuses UNIQUE columns (implicit auto-index); (2) a table
rebuild still left plaintext in freed pages — `VACUUM` is mandatory and cannot
run inside a transaction; (3) dependent columns (api_tokens.owner_uuid held the
raw key) must be rewritten BEFORE hashing/dropping, inside one transaction.

**Proposed skill file:**

```markdown
# Skill: SQLite Security-Migration Pattern (retiring sensitive columns)

When a migration retires plaintext/sensitive columns (e.g., hash-only ledgers):
1. Schema migration (SQL): ADD the new columns + indexes. Do NOT drop the old
   column in SQL if it is UNIQUE — SQLite refuses DROP COLUMN past an
   auto-index; plan a table rebuild instead.
2. Crypto backfills CANNOT run in SQL — put them in a code module invoked
   immediately after runMigrations (same seam as PRAGMA rekey recognition).
   Idempotent (early-exit when already migrated), fail-closed (throw if the
   schema doesn't match the expected stage).
3. Inside ONE transaction, ordered: (a) rewrite dependent references that
   encode the sensitive value (join while the plaintext still exists),
   (b) hash/copy in place, (c) retire via table rebuild
   (CREATE new → INSERT SELECT → DROP old → RENAME → recreate indexes).
4. VACUUM after the transaction commits — freed pages retain the old bytes
   until then. A security retirement is not done at the schema level; it is
   done at the BYTE level.
5. Prove it with a byte-scan test: read the raw database file and assert the
   sensitive value's bytes are absent — plus a pre-migration row that still
   authenticates after backfill.
```

---

## Candidate 3: Batch Patch-Script Discipline (SKILL UPDATE)

**Classification:** Skill UPDATE → `.clinerules/skills/editor-large-inserts.md`
(add a section)

**Incident (×2 this session):** A multi-file python patch script asserted
before each write, but crashed BETWEEN files — leaving partial state (agentKeys
patched, auth.ts silently unpatched). Detected only by a failing integration
test (`no such column: api_key`). Also: shell heredocs intermittently swallow
stdout — redirect to a log file and cat it for verification.

**Proposed addition:**

```markdown
## Batch Patch Scripts (multi-file programmatic edits)
1. Assert `count == 1` for EVERY old-string BEFORE any write; write per-file
   only after all asserts for that file pass.
2. If the script fails at any point, treat ALL files as unknown state:
   re-grep every target pattern across every file before re-running.
3. Redirect script output to a file and cat it — shell integration drops
   stdout intermittently; exit codes lie.
4. Re-grep the full pattern set after the script reports success (a "pass"
   with a swallowed error is indistinguishable from success).
```

---

## Already Consolidated (no action)
- Docs-vs-code contradictions → encode as queued phase (memory bank, 2026-09-13)
- Genome coherence-audit method (memory bank + consolidated learnings)
- Roadmap renumbering discipline (descending order, collateral-name sweep)
