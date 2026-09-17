# Long-Term Decisions — ShellGuard

*Decision framings that carry shaped perspective: not just what was chosen, but the framing that makes the choice legible.*

---

## Docs bow to code
**weight**: 5 | **last validated**: 2026-09-16 | **first observed**: 2026-09-16

When a document contradicts shipped, verified behavior, the document is the defect. Never change working or security-relevant code to match stale prose.

**History:**
- 2026-09-16: governance ruling during the bidirectional audit (8 docs-lies corrected, zero code changes).
- 2026-09-16: ratified as docs-hygiene section 5 (The Direction of Truth).
- 2026-09-16: applied to root docs + docs/ portal + release v0.0.1.10.
- 2026-09-16: reaffirmed when planning the VitePress base-path fix (fix the component, not the deployment contract).

**Shaped perspective:** The asymmetry is the point: code is verified by gates; docs are verified by nothing until the battery runs. Changing code to match prose inverts the trust direction and makes the auditors' job impossible. The framing also forbids the lazy inverse — rewriting history to flatter the present.

---

## Honest PATCH over milestone theft
**weight**: 2 | **last validated**: 2026-09-16 | **first observed**: 2026-09-16

When a release contains no Added entries, it takes an honest PATCH (v0.0.1.10, Build 19) even if a MINOR milestone label (v0.0.2.0 for Phase 18) is reserved — consuming the milestone for a docs release forces a cascade of provisional-label renumbering and inflates the version story.

**History:**
- 2026-09-16: v0.0.1.10 cut as Build 19; Phase 18 re-pointed to Build 20; labels swept in ROADMAP + spine + anchor hrefs.

**Shaped perspective:** Versions tell the story of gravity, not ambition. The Build-number sweep (semantic-versioning Step 3) exists so two releases can never share a build — the label arithmetic is part of the release, not an afterthought.

---

## Option C: the original queue order stands
**weight**: 2 | **last validated**: 2026-09-16 | **first observed**: 2026-09-15

Queued phases execute in numeric order (18 → 24). Hands-on priorities get queued at the tail with full specs, never allowed to silently renumber the queue.

**History:**
- 2026-09-15: leapfrogged Phases 22/23 discovered; Lucas ruled original order restored.
- 2026-09-16: Phase 24 appended at the tail per the same principle.

**Shaped perspective:** The queue is a promise to future sessions. Leapfrogging without renumbering creates three "next tasks" across three documents — the exact contradiction class that erodes corpus trust.
