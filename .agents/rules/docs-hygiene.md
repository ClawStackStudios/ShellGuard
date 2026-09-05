# Documentation Hygiene & Anti-Rot Rule

**Objective:** Prevent documentation rot by ensuring that architectural, state, and API changes are fundamentally tied to their documentation updates within the *same* branch and commit.

## 1. Zero-Deferred Documentation
- **Never defer documentation updates.** If you change the behavior of a module, component, or state model, the corresponding documentation MUST be updated in the same branch before merging to `main`.
- "I will update the docs later" is treated as an incomplete task.

## 2. Trigger Conditions
You MUST proactively update the corresponding `.agents/memory-bank/` files or `docs/` files when:
- **State Model Changes:** If you alter how data flows, where it is stored, or how contexts (like React Context or Zustand) are structured, you must update `attractorBeacon.md` and/or `systemPatterns.md`.
- **API/Endpoint Changes:** If a server route's payload or response shape changes, update the API documentation or relevant README.
- **Component Refactors:** If a large component is split or renamed, update the overarching UI documentation and `activeContext.md`.
- **Dependency Changes:** If a new core dependency is added (e.g., swapping a crypto library), update `techContext.md`.

## 3. Inline Documentation
- Maintain JSDoc/TSDoc integrity. If you change a function signature, you must update its `@param` and `@returns` docstrings immediately.
- Preserve existing comments that explain *why* code exists, unless the *why* has fundamentally changed.

## 4. The "Same Commit" Mandate
Documentation updates should not be isolated to a separate "chore: update docs" commit if they belong to a feature. They should be bundled into the specific `AI:` layer of the commit that introduced the feature/fix, proving that the code and its explanation evolved together.

## 5. Release Documentation & Template Protocol
When preparing a version increment or release:
- **Use Official Release Template:** Draft `RELEASE-vX.Y.Z.N.md` in the repository root adhering strictly to `[.agents/templates/release-template.md](file:///config/Documents/workspace-lucas/projects/Agents/ShellGuard/.agents/templates/release-template.md)`.
- **Synchronize Central Anchors:** In the same release preparation commit, synchronize `package.json` (`version`), `README.md` (version badge), and `CHANGELOG.md` (`## [X.Y.Z.N] - YYYY-MM-DD`).
- **Automated Publication Trigger:** Pushing with `--release vX.Y.Z.N` in the commit message or pushing tag `vX.Y.Z.N` automatically executes `[.github/workflows/release.yml](file:///config/Documents/workspace-lucas/projects/Agents/ShellGuard/.github/workflows/release.yml)` to publish the release with the markdown notes.

