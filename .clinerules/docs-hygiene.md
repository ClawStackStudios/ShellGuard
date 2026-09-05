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
Documentation updates should not be isolated to a separate "chore: update docs" commit if they belong to a feature. They should be bundled into the specific `AI:` layer of the commit that introduced the feature/fix, proving that the code and its explanation evolved together.
