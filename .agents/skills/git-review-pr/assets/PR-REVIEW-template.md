# PR REVIEW — <PR ref>: <subject slug> - YYYY-MM-DD HHMM Z

<!-- UTC Z convention: the timestamped title IS the artifact's schema. -->
<!-- Same UTC instant feeds the companion filename pr_review_<ref>_YYYY_MM_DD_HHmm.md. -->
<!-- Never write prev/forward links — the chain footer is runtime-owned. -->
<!-- Living while the fix phase is in flight; frozen when it completes. -->

> *Session (UTC): [YYYY-MM-DD HHMM Z]*
**Date (UTC)**: [YYYY-MM-DD HHMM Z]
**PR**: [<number | branch | URL> — head: <sha> — parent: <sha>]
**Scope**: [One sentence. What this review covers and what it explicitly does NOT cover.]
**Intent source**: [found in <path/ticket/prompt> | user-confirmed]
**Verdict**: [MERGE | MERGE-AFTER-FIXES | REFINE-AND-RE-PR | REJECT]

<!-- Fill every <placeholder>. Keep section order. Keep severity classes. -->
<!-- Every finding, praise, and verdict cites: file:line, diff hunk, or command output. -->

## 1. LOCKED INTENT

- **The goal**: [One sentence — what this PR was asked to do.]
- **Done means**: [C1] <falsifiable check> / [C2] <falsifiable check> / [C3] <...>

## 2. DIFF SHAPE

- **Size**: [files touched, lines +/−, categories: logic / config / schema / deps / tests / docs]
- **Shape-vs-description check**: [matches | MISMATCH: <what the description implies vs what the diff contains>]
- **Testimony flagged (UNVERIFIED)**: [claims from PR description the diff does not show, or "none"]

## 3. REVIEW LEDGER

<!-- The self-question loop's audit trail. One row per question. -->
| # | Family | Question | Answer | Revision |
|---|--------|----------|--------|----------|
| 1 | Fidelity | <q> | <a> | no revision |
| 2 | Blast radius | <q> | <a> | REVISED #1 |
| ... | ... | ... | ... | ... |

**Collapse:** Pass <n> produced zero revisions — answers converged. <One sentence: the structure they collapsed into.>

## 4. VERIFICATION

- **Ran**: <commands executed>
- **Result**: <pass/fail + summary of output>
- **Pre-existing failure attribution**: [not needed | proved by testing parent <sha>: <evidence>]

## 5. FINDINGS

### [BLOCKER] <finding title>
- Evidence: `<file:line>` <quote/hunk>
- Impact: <what breaks, for whom, when>

### [SHOULD-FIX] <finding title>
- Evidence: `<file:line>` <quote/hunk>
- Impact: <...>

### [NOTE] <finding title>
- Evidence: `<file:line>` <quote/hunk>
- Impact: <...>

### [NIT] <finding title>
- Evidence: `<file:line>` <quote/hunk>
- Impact: <...>

<!-- Every finding graded with evidence. If there are truly no findings, -->
<!-- this section MUST contain the strongest verdict-attack attempt, quoted, -->
<!-- plus the statement: "A review that finds nothing substantive in a -->
<!-- nontrivial diff is itself a finding." -->

## 6. WHAT THE PR DID RIGHT

- <praise with citations — behavior-change mapping, tests, structure>
<!-- No uncited compliments. -->

## 7. STRONGEST CASE FOR MERGE

<steelman, evidence-backed — the best honest argument that this ships>

## 8. STRONGEST CASE AGAINST MERGE

<steelman, evidence-backed — must engage the FOR case point by point>

## 9. VERDICT SYNTHESIS

- **Positives vs negatives**: [per finding class]
- **Criterion pass/fail**: [C1: pass/fail — why] / [C2: ...] / [C3: ...]
- **Where the balance lands**: [two sentences — the felt reason, not just the logical one]

## 10. RECOMMENDATION

**[MERGE | MERGE-AFTER-FIXES | REFINE-AND-RE-PR | REJECT]**

<If MERGE-AFTER-FIXES: ordered fix list, one entry per finding being addressed.>
<If REFINE-AND-RE-PR: what must change, in what direction. Formulate feedback using the Socratic Invariable — diff-anchored questions quoting physical hunks vs claims.>
<If REJECT: the reason, in one paragraph.>

## 11. ADJACENT NOTICES

<!-- Observed but out of this review's scope. Preserved with the artifact — -->
<!-- seed stock for future work orders. -->
- [NOTICE] <observation> — touched: <area> — surfaced during: <which pass> — candidate intent: <seed sentence for a future task>

## 12. FIX EXECUTION LOG

<!-- Empty unless the user pulled the trigger on MERGE-AFTER-FIXES or -->
<!-- REFINE-AND-RE-PR. One entry per fix, in fix-list order. -->
| # | Finding addressed | Fix made | Evidence | Re-verified |
|---|-------------------|----------|----------|-------------|
| — | — | — | — | — |
