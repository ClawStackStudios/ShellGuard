# Long-Term Patterns — ShellGuard

*Ratified system patterns: the shape, what broke when violated, and why it holds. Consolidated from the Navigation Log (decision-log.md) at 3+ independent validations.*

---

## Stage N = Phase N-1 with decimal interludes
**weight**: 3 | **last validated**: 2026-09-16 | **first observed**: 2026-09-15

The meta-prompt spine maps Stage N to Phase N-1 with zero exceptions; non-phase work (hotfixes, interludes) takes decimal slots (Stage 18.5) so phase numbering never breaks. ROADMAP anchors are slug-derived from headings, so heading text is a contract.

**History:**
- 2026-09-15: full reorg adopted the TOTP decimal pattern; 26/26 anchors verified.
- 2026-09-16: Stage 25 added for Phase 24 without breaking a single existing anchor.
- 2026-09-16: Build-label sweep (release v0.0.1.10) shifted 7 anchor hrefs; battery re-run clean.

**Shaped perspective:** Anchors are load-bearing: a heading rename is an API break. The invariant survives phase insertions precisely because interludes never take integer slots. Renaming a heading or renumbering a stage without running the anchor battery is how genomes rot.

---

## Auditability invariants: enumerate, never recall
**weight**: 3 | **last validated**: 2026-09-16 | **first observed**: 2026-09-16

Every documented security invariant must be enumerated from its enforcing artifact: permission masks from the zod schema, limiter numbers from `rateLimiter.ts` with their env vars, schema truth from migrations, behavioral details from test fixtures. The claim battery (grep enforcing code first, assert doc second) is the method; tests are the oracle when a claim has no literal code hit.

**History:**
- 2026-09-16: bidirectional audit found 8 docs-lies, every one from recalled-not-enumerated claims (limiter conflation, 4-vs-5 masks, AAD pattern, sqlcipher_export).
- 2026-09-16: custom-field AAD truth found only in the test fixture, zero application hits.
- 2026-09-16: ratified into rules (docs-hygiene section 5) and bank (systemPatterns Auditability Invariants); Phase 24 makes the battery executable.

**Shaped perspective:** Documentation lies are never typo-shaped; they are memory-shaped — written once, never re-diffed against evolution. Neighbor configs drift independently, so citing one from the other is fabrication. The battery exists because human recall is the enemy, not prose.
