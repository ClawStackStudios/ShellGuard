# The Auditor's Perspective — Sealed Lens

> **type**: perspective artifact | **established**: 2026-09-16 | **invoked when**: designing, building, or documenting anything user-facing or security-relevant
> **purpose**: a standing third-person vantage — the 30-year systems engineer with specialized cryptology knowledge — consulted *before* shipping, so the corpus is built for an audience we cannot name.

---

## Who is looking

A systems engineer with three decades across kernel, protocol, and applied
cryptography. They have audited vaults, signal protocols, and payment rails.
They are not hostile — they are *rigorous*. They do not assume malice; they
assume drift. Their question is never "does it work?" but "**what does it claim,
and can I walk that claim to the bit that enforces it?**"

## What satisfies them

1. **Every claim traces.** Doc → enforcing code → witnessing test. The claim
   battery (grep enforcing code first, assert doc second) exists because of
   them. A pointer that lands 404 — in prose *or* in a browser — is a finding.
2. **Invariants are enumerated, not narrated.** Permission masks from the zod
   schema. Limiter numbers from `rateLimiter.ts` with their env vars. Schema
   truth from migrations. AAD namespaces from test fixtures. "I recall it as"
   is fabrication.
3. **Tradeoffs are disclosed, not discovered.** The honest walls — plain-HTTP
   LAN support, optional-at-boot DB encryption, raw short-lived `api-` tokens
   at rest, in-process rate limiting, non-constant-time pure-TS fallback — are
   *named* in SECURITY.md and the portal threat model. What they punish is the
   undisclosed; what they reward is the calibrated admission.
4. **Receipts.** Tags, commit ledgers, release notes mirrored verbatim, test
   counts on the exact tree. A release without its witness is a guess.

## What they drill (the standing adversarial checklist)

- "Show me every comparison over secret material — prove none is `===`."
- "Your fallback engine claims parity — against which vectors? Which test was
  skipped, and why?" *(Phase 24 Task 47 exists because of this question.)*
- "What happens to your rate limiters on restart? On a second instance?"
- "What does the LRU eviction at 100 keys do to enforcement?"
- "What does your audit redaction regex cover — and what slips past it?"
- "Which documented invariant changed last, and did the docs move with it?"

## The calibrated posture (2026-09-16)

Walkthrough confidence was assessed at **~91%** — above threshold to *narrate*,
at the edge to *defend under cross-examination*. The gap to 95+ is exactly
Phase 24: vector parity for the fallback engine, the mechanized constant-time
sweep, and the threat-model addendum. Until then, the honest sentence is:
*"functional parity, not side-channel parity; in-process enforcement, not
distributed; disclosed tradeoffs, not hidden ones."*

## How to use this lens

- **Before building**: ask "what would they find?" — then pre-empt, never hide.
- **Before documenting**: run the claim battery; a doc that cannot trace is a
  defect (docs bow to code).
- **Before releasing**: gates on the exact tree, receipts in the notes, no
  version spent on gravity-less work.
- **When in doubt**: they reward the calibrated admission and punish the
  confident omission. When something is broken, say so in the same breath as
  the fix plan.

**Shaped perspective:** Third-party auditability is not a phase deliverable —
it is a *stance*. The corpus is written for someone who will read every word
and check every pointer, and whose respect is earned only by things that hold
under their own weight. Build as if they are reading. They are.