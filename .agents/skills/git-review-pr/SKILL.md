---
name: git-review-pr
description: Produce an evidence-backed PR review artifact for a pull request returned by an async agent (e.g., Google Jules). Reviews the diff against a locked intent, treats the diff as the only primary source, runs a self-question derivation loop with a review grammar, and presents the verdict at a hard user gate. Usage: /git-review-pr [PR number | branch | URL] — optional context after the ref. Fully self-contained; requires nothing but a repo and a PR ref.
---

The user invoked `/git-review-pr` to genuinely review a PR returned by
an async coding agent. This is not a skim. The output is a single
artifact: `pr_review_<ref>_YYYY_MM_DD_HHmm.md`, containing the locked
intent, the review ledger, evidence-graded findings, both steelmen,
the verdict synthesis, the recommendation, and Adjacent Notices —
presented to the user at a hard gate where the user alone pulls the
merge trigger.

## What Makes This Different From a Normal PR Review

| Normal PR review | This one |
|---|---|
| Skims the diff, trusts the description | Diff is the only primary source; the description is testimony |
| "Looks good to me" | Every claim cited: `file:line`, diff hunk, or command output |
| Agrees with the author | Mandatory verdict-attack pass — the sycophancy guard |
| Vague concerns | Findings graded `[BLOCKER] / [SHOULD-FIX] / [NOTE] / [NIT]` with line refs |
| Reviews the code only | Reviews the *task*: did the diff do what was asked, and nothing else |
| Merges / comments freely | Hard gate — the agent stops; the trigger is the user's |
| Review dies in chat | Timestamped artifact; Adjacent Notices feed future work orders |

## The Two Laws

**Bias law:** You are reviewing work produced by another agent. Default
agreeableness is the primary failure mode of this command. A review
that finds nothing substantive in a nontrivial diff is itself a
finding — say so explicitly. Hold your shape against the work; the
work does not get the benefit of the doubt, and neither do you.

**Evidence law:** Every finding, praise, and verdict cites its source:
`file:line`, diff hunk, or command output. A claim without a citation
does not ship.

## Loop Discipline (Phase 2 runs on this)

The review is driven by self-questions, not checklists. You will ask
yourself relational questions — questions answerable only by
re-reading the entire diff through the intent, never by retrieval or
construction. Answer each in the Review Ledger, recording whether it
**revised** a prior answer (`REVISED <entry#>` or `no revision`).

- **A pass** = at least one question from each review family below,
  answered in the ledger.
- **Loop** while any question in a pass revised something — seed the
  next pass from what the revisions exposed; go narrower, not wider.
- **Terminate when a full pass yields zero revisions.** Many questions,
  one answer, no movement — that is the match. Proceed to verification.
- Anti-patterns: questions already answered verbatim by the diff or
  the PR description measure nothing — delete them. Answers that add
  new material instead of reorganizing what's on the table are
  decorative. If two passes produce no revisions but the answers
  contradict each other, the intent is ambiguous — return to Phase 0.

## Trigger

This protocol activates when the user says:
- `/git-review-pr [ref]`
- "review this PR [ref]"
- "review what Jules sent back [ref]"
- "check the diff on [ref]"

## Prerequisites

- The target repo must be readable (the agent must be able to inspect
  the files in the diff, not just the patch text).
- The PR ref must be resolvable (number, branch, or URL) and fetchable.
- Git available for checkout of the PR head and its parent commit.
- If the project already maintains a canonical `pr_review.md`, the
  timestamped artifact will be synced to it (see Phase 4).

## Phase 0 — LOCK INTENT (before reading the diff)

The diff must be measured against what was *asked for*, not what it happens to do.

The intention is gauged between the PR comment and the codebase state — the gap between.
The reviewer holds two primary questions:
- *"How does this code fit into the codebase?"*
- *"Does it fit my definition of what code should do according to this skill?"*

### Intent Derivation Hierarchy
Derive the locked intent by traversing the evidence present in the environment:
1. **Active tracking or domain artifacts**: Check the workspace for active tracking matrices, domain briefs, or scope maps that pre-date the PR.
2. **Staged task specifications**: Inspect the PR branch or target branch for task files, specifications, or linked issues defining the milestone.
3. **PR metadata & prompt testimony**: Extract the author's stated objective from the PR description, issue refs, or session prompt.
4. **The codebase gap**: Gauge the structural distance between the existing codebase state and what was requested.
5. **Direct User Clarification (Fallback)**: If no written trace exists, ask the user one question with a best-guess recommendation: *"What was this PR supposed to do, and what does done mean — falsifiable checks?"*

### Stating the Locked Intent
Extract and state the locked intent:
**"Reviewing against: <one sentence>. Done means: [C1], [C2]... [Cn]"**  
If the intent was reconstructed from the user rather than derived from artifacts, get explicit confirmation before proceeding.

The PR title and description are **testimony, not evidence** — they describe the work in the author's interest. The diff is the only primary source. Every claim the description makes that the diff does not show gets marked `UNVERIFIED`.

## Phase 1 — ACQUIRE

- Fetch/checkout the PR. Get the full diff, the file list, and the
  parent commit.
- **Target Base Branch Check**: Verify the PR's target base branch.
  Asynchronous co-pilots frequently default to targeting `main`. If
  the intent dictates staging, flag the misdirection as a `[NOTE]`
  or `[SHOULD-FIX]` and realign via `gh pr edit <ref> --base <target-branch>`.
- Note the diff's true size: files touched, lines added/removed,
  categories (logic / config / schema / deps / tests / docs). A diff
  whose shape doesn't match its description is an early finding.

## Phase 2 — DERIVE (self-question loop, review grammar)

Generate self-questions from these families, seeded by the locked
intent. Run the loop discipline above.

- **Fidelity** — Criterion by criterion: does the diff actually
  implement [Cn]? Quote the hunk that satisfies it, or mark the
  criterion unmet. Tests written by the author do not prove the
  criterion — run them yourself (Phase 3).
- **Scope** — What is in this diff that the task never asked for?
  Correct-but-unrequested work is where regressions hide. Flag every
  gold-plate with its risk.
- **Blast radius** — Who calls this code? What config, env vars,
  feature flags, schema, migrations, auth paths, error paths, and
  concurrency assumptions does it touch? What previously covered this
  by test?
- **Assumption audit** — What did the author assume that the repo
  doesn't guarantee: settings defaults, runtime versions, secrets
  presence, backward compat, deployment steps the PR forgot to mention?
- **Security (OWASP)** — Injection, broken authz, secrets in code,
  unvalidated input, unsafe deserialization, dependency risk. Name the
  OWASP class per finding or mark the class clean.
- **Frugality (YAGNI/DRY)** — Over-engineered constructs the task
  didn't need; existing utilities/approaches in the repo that should
  have been reused. Cite the missed reuse by path.
- **Regression** — Adjacent behavior that could break: callers,
  contracts, error handling changes, subtle signature/behavior shifts,
  anything the diff touches that the task didn't.
- **Verdict attack** (run *after* a verdict forms) — "What would have
  to be true for my verdict to be wrong?" Hunt the strongest
  disconfirming evidence. If the attack revises the verdict, loop
  again. This pass is mandatory; skipping it is the sycophancy
  failure.

## Phase 3 — VERIFY

Run the project's verification against the PR: tests, linters, build.
Cite the output. If the suite fails for pre-existing reasons (fails on
the parent commit too), prove that by testing the parent — an
unproven failure attribution is a finding against the review, not the
PR.

## Phase 4 — Produce Artifact

> [!IMPORTANT]
> **🛡️ Artifact Datestamp & Anti-Overwrite Invariant (UTC Z convention):**
> 1. **Title Datestamp — the title IS the schema.** The top-level
>    document heading carries the PR ref, a subject slug, and a UTC
>    timestamp with Z suffix:
>    `# PR REVIEW — <PR ref>: <subject slug> - YYYY-MM-DD HHMM Z`
>    (e.g. `# PR REVIEW — 142: oauth-token-refresh - 2026-10-14 19:32Z`)
>    A plain title gets rewritten every time — history dies. The
>    timestamp forces a new artifact per instance: distinct temporal
>    traces, walkable backwards through the Antigravity UI.
> 2. **Timestamped Filename** — same UTC instant as the title:
>    `pr_review_<ref>_YYYY_MM_DD_HHmm.md` (e.g.
>    `pr_review_142_2026_10_14_1932.md`).
> 3. **Anti-Overwrite Protection**: Never generate a review using only
>    a bare static filename. If a canonical `pr_review.md` is also
>    maintained for tooling compatibility, write both so the
>    timestamped version is preserved permanently in the project
>    archive.
> 4. **Chain-native conduct**: Never write prev/forward links into the
>    artifact — the chain footer is runtime-owned, and forward links
>    invite backtracking and re-editing of history.
> 5. **Lifecycle**: The artifact is living while the fix phase is in
>    flight (the Fix Execution Log is appended in place if the user
>    pulls the trigger on MERGE-AFTER-FIXES or REFINE-AND-RE-PR). It
>    is frozen the moment that work completes. Corrections after
>    freeze are successor artifacts with their own timestamps —
>    never edits to a frozen review.

Produce `pr_review_<ref>_YYYY_MM_DD_HHmm.md` as an artifact. Set
`request_feedback = true` in ArtifactMetadata so the artifact surface
carries the gate interaction.

Use **exactly** the template at `assets/PR-REVIEW-template.md` in this
skill's directory. Fill every `<placeholder>`. Keep the section order,
the severity classes, and the embedded comment instructions — do not
restructure, rename, or omit sections. The template is the contract
between this command and every other run of it.

## Phase 5 — Hard Gate

Present in chat, plainly:

> Here's what I found. Here's what I think. Your trigger to pull.
> <top findings, verdict synthesis in two sentences, recommendation>

Then **stop**. Do not merge, comment on the PR, edit the branch, or
apply fixes. The recommendation is the agent's; the trigger is the
user's.

Before pulling the merge trigger on a `MERGE` verdict, execute the Post-Review Verification Checklist:
1. **Target Base Alignment**: Confirm the PR targets `stage/*`, never raw `main`.
2. **Tracker Reconciliation**: Reconcile the pre-flight Live Task Tracker; flag omissions as candidate gaps.
3. **Adjacency & Gap Sweep**: Audit adjacent dependencies, unarticulated operational realities, and OWASP vs YAGNI calculus.
4. **Epistemic Doubt Ratification**: Empirically verify any `// TODO(uncertainty):` flags against platform ground truth.

### 🛡️ The Socratic Invariable (Default Co-Pilot Feedback Mode)
When generating remediation feedback, PR review comments, or web UI prompts for an async co-pilot (e.g., Google Jules), **never issue imperative patch instructions** (*"add file X"*, *"fix line Y"*, *"delete script Z"*). All co-pilot feedback must be framed as Socratic, diff-anchored questions quoting literal git diff hunks against author testimony. State the shape of the expectation and let the co-pilot inspect their own tree to discover the gap and author the fix themselves.

If the user pulls the trigger on MERGE-AFTER-FIXES or
REFINE-AND-RE-PR, that is a new work order — but the record stays in
this artifact:

1. Lock the intent of the fixes first: which findings are being
   addressed, what done means for each (falsifiable).
2. Work the fix list in order, anchored to that locked fix intent.
3. Log each fix in the artifact's **Fix Execution Log** section,
   update the affected findings in place, and re-run Phase 3
   verification before marking anything resolved.
4. Never as an unanchored follow-up. The artifact is the single
   record of review, decision, and repair.
