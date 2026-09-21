---
description: Documentation hygiene and anti-rot rule — ensures architectural, state, and API changes are tied to documentation updates in the same branch and commit.
---

**Objective:** Prevent documentation rot by ensuring that architectural, state, and API changes are fundamentally tied to their documentation updates within the *same* branch and commit.

## 1. Zero-Deferred Documentation
- **Never defer documentation updates.** If you change the behavior of a module, component, or state model, the corresponding documentation MUST be updated in the same branch before merging to `main`.
- "I will update the docs later" is treated as an incomplete task.

## 2. Trigger Conditions
You MUST proactively update the corresponding `.clinerules/memory-bank/` files or `docs/` files when:
- **State Model Changes:** If you alter how data flows, where it is stored, or how contexts (like React Context or Zustand) are structured, you must update `attractorBeacon.md` and/or `systemPatterns.md`.
- **API/Endpoint Changes:** If a server route's payload or response shape changes, update the API documentation or relevant README.
- **Component Refactors:** If a large component is split or renamed, update the overarching UI documentation and `activeContext.md`.
- **Dependency Changes:** If a new core dependency is added (e.g., swapping a crypto library), update `techContext.md`.

## 3. Inline Documentation
- Maintain JSDoc/TSDoc integrity. If you change a function signature, you must update its `@param` and `@returns` docstrings immediately.
- Preserve existing comments that explain *why* code exists, unless the *why* has fundamentally changed.

## 4. The "Same Commit" Mandate

## 5. The Direction of Truth (docs bow to code)
- When a document contradicts shipped, verified behavior, **the document is the defect**. Never change working or security-relevant code to match stale prose; correct the corpus. (Governance ruling, 2026-09-16.)
- **Claim battery method**: for every documented invariant, grep the ENFORCING CODE first, then assert the doc matches. When a behavioral claim has no literal code hit, the TEST FIXTURES are the oracle (e.g. custom-field AAD namespaces live in `tests/unit/customFields.test.ts`, not application literals).
- **Enumerate, never recall**: permission models come from the zod schema; limiter numbers from `rateLimiter.ts` cited with their env vars; schema truth from the migrations. Neighbor configs (auth vs admin limiters) drift independently — never document one from the other's numbers.
- A phase's **📚 Documentation Impact** line in ROADMAP.md is part of that phase's definition of done.
- **Contract docs are the highest-cost drift.** Run the claim battery on external-facing contracts FIRST — `skills/shellguard/SKILL.md`, `docs/agent-integration/api-reference.md`, `project/routes-and-contracts.md`. These are read by agents that cannot sanity-check them against the runtime, so a wrong status code or a wrong field type is a build-breaking lie rather than a cosmetic one. For every documented route, assert the **status code**, the **field names**, and the **field types** against the handler's actual response object — a numeric `inserted` where the code returns `string[]` costs a downstream agent every `await`. (Incident, 2026-09-20: the agent-facing SKILL.md shipped documenting `200` for a `201` handler, `inserted` as a count for an array, `{index, id, title, reason}` for `{index, reason}`, and `secret` as a nested object for a required string.)
- **Self-consistency sweep.** When a count changes — suites, tests, migrations, routes — grep the WHOLE file for the old number. Updating the header and missing a later line leaves the document contradicting itself. (Incident, 2026-09-20: ARCHITECTURE.md's file-tree said "21 suites" while line 752 still said "all 20 suites".)
Documentation updates should not be isolated to a separate "chore: update docs" commit if they belong to a feature. They should be bundled into the specific `AI:` layer of the commit that introduced the feature/fix, proving that the code and its explanation evolved together.
