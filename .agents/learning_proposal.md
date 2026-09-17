# Learning Proposal — Session 2026-09-15/16 (ShellGuard: chronology reorg, ClawKey canon, bidirectional audit, v0.0.1.10 release)

> **request_feedback: true — AWAITING LUCAS'S REVIEW** — none of the below is applied yet. Approve all, approve a subset, or amend.

## Already Consolidated (no action needed)
- Docs-vs-bank contradictions cut both ways; Option C queue order (memory bank, changelog, decision-log)
- Chronology/spine patterns: Stage N = Phase N−1, decimal interludes (bank + roadmap)
- The 8 audit corrections themselves (ARCHITECTURE/SECURITY/portal — the corpus IS the receipt)
- Decision Log adopted with 14 entries; bank lens (projectBrief standard + systemPatterns invariants)

---

## Candidate 1: The Direction of Truth — Docs Bow to Code (RULE UPDATE → docs-hygiene.md)

**Classification:** Rule UPDATE — the governance law this arc produced; docs-hygiene is its natural home.

**Incident:** The bidirectional audit found 8 docs-lies (sqlcipher_export, authLimiter 5-vs-10, identity filename/shape, phantom customFields.ts, tls.ts, client crypto exports, 4-vs-5 permission masks, the AAD namespace pattern). Lucas ruled: *the application works and is secure — docs contradicting shipped behavior are the defect, never an excuse to retune code.*

**Proposed addition (new section at end of docs-hygiene.md):**

```markdown
## 5. The Direction of Truth (docs bow to code)
- When a document contradicts shipped, verified behavior, **the document is the
  defect**. Never change working or security-relevant code to match stale prose;
  correct the corpus. (Governance ruling, 2026-09-16.)
- **Claim battery method**: for every documented invariant, grep the ENFORCING
  CODE first, then assert the doc matches. When a behavioral claim has no
  literal code hit, the TEST FIXTURES are the oracle (e.g. custom-field AAD
  namespaces live in tests/unit/customFields.test.ts, not application literals).
- **Enumerate, never recall**: permission models come from the zod schema;
  limiter numbers from rateLimiter.ts cited with their env vars; schema truth
  from the migrations. Neighbor configs (auth vs admin limiters) drift
  independently — never document one from the other's numbers.
- A phase's **Documentation Impact** line in ROADMAP.md is part of that
  phase's definition of done.
```

---

## Candidate 2: The ClawKey Canon + Contract Identifiers (RULE UPDATE → lobsterized-philosophy.md, NEVER list)

**Classification:** Rule UPDATE — canon guardrails at the rule level so no future agent "helpfully" breaks them.

**Incident:** "ShellKey©™" pervaded UI strings and docs for the hu- key. Lucas defined the house canon (ClawKey / ShellCryption / LobsterKeys) and approved renaming 14 user-facing strings — while internal identifiers are cross-project contracts that must NOT be renamed.

**Proposed NEVER-list additions:**

```markdown
- ❌ NEVER call the hu- identity key "ShellKey" in user-facing copy or docs —
  it is a **ClawKey** (canon: ClawKey / ShellCryption / LobsterKeys; see
  ARCHITECTURE § The ClawKey Method). "Human Key" may appear only as a
  documented legacy alias.
- ❌ NEVER rename cross-project contract identifiers (deriveShellKey,
  shellKey, ShellKeyFallback, envelope fields) — they are pinned by
  project/shellcryption-spec.md §2 and the companion's crypto-spec.md.
```

---

## Candidate 3: Environment Hazards (SKILL UPDATE → skills/editor-large-inserts.md)

**Classification:** Skill UPDATE — extends the existing batch-patch discipline section with this arc's tooling scars.

**Incidents (×3 classes):** open(p,'w')-before-read truncated ~488 lines of reflection history (recovered from git); a temple emoji through a bash heredoc became U+FFFD ×2 on disk; long builds (oracle ~130s, vitepress ~27s) intermittently swallowed stdout or hung the completion heuristic.

**Proposed addition (new section):**

```markdown
## Environment Hazards (2026-09-15/16 arc)
1. NEVER open a file with mode 'w' in the same expression as the read that
   feeds it — open(p,'w').write(entry + open(p).read()) truncates FIRST
   (Python evaluates open before the read). Read into a variable, then write.
   Tripwire: a huge deletion count in a "log entry" commit is an alarm.
2. Emoji/unicode through bash heredocs corrupts silently (U+FFFD). Pass emoji
   via Python \U escapes or use the editor tool; after any heredoc write,
   byte-scan for b'\xef\xbf\xbd'.
3. Long commands get swallowed by shell integration: nohup <cmd> > /tmp/x.log
   2>&1 & then poll the log. Heredoc scripts always redirect — exit codes
   lie, logs don't.
4. git add <files> immediately before EACH commit; git diff --cached --stat
   is the trust boundary. (A pre-staged 4-file set once rode into the wrong
   commit message; own unpushed commit, amended, disclosed.)
```

---

## Candidate 4: Release Build-Label Arithmetic (RULE UPDATE → semantic-versioning.md)

**Classification:** Rule UPDATE — Step 2 (version sync) gains the sweep that prevented future build-number collisions.

**Incident:** Cutting v0.0.1.10 consumed Build 19, which was also Phase 18's provisional label. Every queued phase's (Build N) label had to shift +1 in BOTH ROADMAP.md and the spine — including seven anchor hrefs embedding build numbers, which would have silently dangled otherwise.

**Proposed addition (Step 2 sub-item):**

```markdown
   - **Build-number sweep**: consuming Build N shifts every queued phase's
     provisional (Build N+x) label by +1 in BOTH ROADMAP.md and
     project/meta-prompt-ai-studio.md — INCLUDING anchor hrefs that embed
     build numbers. Sweep with version-prefixed patterns (disambiguation),
     assert each replacement count, and re-run the anchor battery afterwards.
```

---

## Summary Table

| # | Type | Target | One-liner |
|:--|:--|:--|:--|
| 1 | Rule UPDATE | docs-hygiene.md | Docs bow to code + claim battery method |
| 2 | Rule UPDATE | lobsterized-philosophy.md | ClawKey canon + never-rename contract identifiers |
| 3 | Skill UPDATE | skills/editor-large-inserts.md | w-mode truncation, heredoc emoji, backgrounded builds, per-commit staging |
| 4 | Rule UPDATE | semantic-versioning.md | Release Build-label +1 sweep incl. anchor hrefs |

Per the rule's workflow: all changes mirrored to .agents/ after approval; raw_reflection_log entries covering these are already in place.
