---
description: Documentation hygiene and anti-rot rule — ensures architectural, state, and API changes are tied to documentation updates in the same branch and commit.
---

**Objective:** Prevent documentation rot by ensuring that architectural, state, and API changes are fundamentally tied to their documentation updates within the *same* branch and commit.

## 1. Zero-Deferred Documentation
- **Never defer documentation updates.** If you change the behavior of a module, component, or state model, the corresponding documentation MUST be updated in the same branch before merging to `main`.
- "I will update the docs later" is treated as an incomplete task.

## 2. Trigger Conditions
You MUST proactively update the corresponding `.agents/brain/` files or `docs/` files when:
- **State Model Changes:** If you alter how data flows, where it is stored, or how contexts (like React Context or Zustand) are structured, you must update `attractorBeacon.md` and/or `systemPatterns.md`.
- **API/Endpoint Changes:** If a server route's payload or response shape changes, update the API documentation or relevant README.
- **Component Refactors:** If a large component is split or renamed, update the overarching UI documentation and `activeContext.md`.
- **Dependency Changes:** If a new core dependency is added (e.g., swapping a crypto library), update `techContext.md`.

## 3. Inline Documentation
- Maintain JSDoc/TSDoc integrity. If you change a function signature, you must update its `@param` and `@returns` docstrings immediately.
- Preserve existing comments that explain *why* code exists, unless the *why* has fundamentally changed.

## 4. The "Same Commit" Mandate
Documentation updates should not be isolated to a separate "chore: update docs" commit if they belong to a feature. They should be bundled into the specific `AI:` layer of the commit that introduced the feature/fix, proving that the code and its explanation evolved together.

## 5. The Direction of Truth (docs bow to code)
- When a document contradicts shipped, verified behavior, **the document is the defect**. Never change working or security-relevant code to match stale prose; correct the corpus. (Governance ruling, 2026-09-16.)
- **Claim battery method**: for every documented invariant, grep the ENFORCING CODE first, then assert the doc matches. When a behavioral claim has no literal code hit, the TEST FIXTURES are the oracle (e.g. custom-field AAD namespaces live in `tests/unit/customFields.test.ts`, not application literals).
- **Enumerate, never recall**: permission models come from the zod schema; limiter numbers from `rateLimiter.ts` cited with their env vars; schema truth from the migrations. Neighbor configs (auth vs admin limiters) drift independently — never document one from the other's numbers.
- A phase's **📚 Documentation Impact** line in `project/ROADMAP-ERA2.md` is part of that phase's definition of done.

## 6. Wire-Exact Contract Alignment
- Document API endpoint request and response payloads with exact TypeScript types matching the runtime controller (e.g. distinguishing an array of IDs `inserted: string[]` from a count `inserted: number`, and exact HTTP status codes `201 Created` vs `207 Multi-Status`).
- Mismatches break automated API consumers, typed SDKs, and collaborating AI agents.

## 7. Keep a Changelog Standard (`CHANGELOG.md`)
- `CHANGELOG.md` adheres to [Keep a Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning v2.0.0](https://semver.org/spec/v2.0.0.html).
- **Structure**:
  - Top level contains `## [Unreleased]` for tracking in-flight work prior to a version bump.
  - Tagged versions follow: `## [X.Y.Z.W] - YYYY-MM-DD` (or `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`).
- **Semantic Categories**:
  - `### Added` — New features, user capabilities, or endpoint additions (maps from `feat`).
  - `### Changed` — Structural reorganizations, UI adjustments, refactors, performance upgrades (maps from `refactor`, `perf`).
  - `### Deprecated` — Soon-to-be removed features or sunsetting APIs.
  - `### Removed` — Deleted features, retired endpoints, or reverted commits (maps from `revert`).
  - `### Fixed` — Bug fixes, error resolutions, regression repairs (maps from `fix`).
  - `### Security` — Vulnerability mitigations, cryptographic hardening, credential handling.
- **Comparison Links**:
  - Every release entry must provide a bottom comparison link against the previous release tag:
    ```markdown
    [Unreleased]: https://github.com/owner/repo/compare/v0.0.2.4...HEAD
    [0.0.2.4]: https://github.com/owner/repo/compare/v0.0.2.3...v0.0.2.4
    ```

## 8. Release Notes & Artifact Hygiene (`RELEASE-vX.Y.Z.W.md`)
- **Single Active Release Draft Invariant**: Only ONE active release document exists in the repository root at any given time (e.g. `RELEASE-v0.0.2.4.md`). When advancing to a new version, author the new draft and prune the old one (or archive to history).
- **Standardized Release Notes Structure**:
  1. **Title & Date**: `# Release vX.Y.Z.W (Build N) — Month DD, YYYY`
  2. **Summary**: High-level executive narrative of what the milestone accomplishes.
  3. **Highlights**: Visual and functional deep dives of flagship capabilities.
  4. **Breaking Changes**: Transparent listing of contract or schema changes, or explicit "None in this release."
  5. **Upgrade Guide**: Operational deployment steps (e.g. Docker tag pull, SQLite migration execution).
  6. **Known Issues**: Open edge cases or scheduled follow-ups.
  7. **Dependencies Updated**: Markdown table of modified packages, version changes, and rationale.

## 9. Docs-as-Code Automation & Verification Oracles
- Detailed automated verification oracles, claim battery protocols, Mermaid parser guards, and VitePress component templates are codified in [`.agents/skills/doc-automation/SKILL.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/skills/doc-automation/SKILL.md).
- Automated tests in `tests/unit/docsLinks.test.ts` (all 3 link classes + `withBase` regression guard), `tests/unit/mermaidDiagrams.test.ts` (Mermaid fence and label parser), and `tests/unit/version.test.ts` (dynamic package ground truth) MUST be executed and pass 100% green before completing documentation-impacting work.

## 10. Security Policy Hygiene (`SECURITY.md`)
- **Living Security Contract**: The root `SECURITY.md` is a first-class, binding repository security contract governed strictly by the "Docs Bow to Code" axiom. It is never a static placeholder.
- **Trigger Conditions**: You MUST review and update `SECURITY.md` in the same commit whenever:
  - Cryptographic algorithms, key derivation routines (e.g. HKDF-SHA-256), or AAD binding schemes (`table:recordId`) are modified.
  - Authentication tokens, credential lifecycle, or key ledgers are updated (e.g. LobsterKey hash-only storage, session token TTLs).
  - Storage security, stream limits, or SQLite encryption pragmas change (e.g. `ATTACHMENT_MAX_MB`, `GROTTO_QUOTA_MB`, SQLCipher).
  - Version releases advance, requiring an update to the **Supported Versions Matrix**.
  - Security reporting contacts, PGP keys, or coordinated vulnerability disclosure protocols change.
- **Security Claim Battery Rigor**:
  - Every assertion regarding zero-knowledge properties, encryption layers, or sanitization rules MUST be verified against literal code hits in `src/lib/shellCryption.ts`, `src/server/crypto/`, and `src/server/validation/` (or behavioral test fixtures in `tests/`).
  - Stale security promises are fatal defects; when runtime behavior tightens or adapts, prose must match runtime ground truth immediately.
- **Responsible Disclosure & Supported Versions**:
  - Maintain a transparent **Supported Versions Matrix** reflecting active branches vs. EOL releases.
  - Keep responsible disclosure instructions, private reporting email channels, and Safe Harbor commitments clear and unambiguous.

## 11. User-Facing VitePress Cohesion & Frictionless Flow
- **Human-Centric Reading Experience**: The VitePress portal (`/docs/`) is user-facing. Technical accuracy is a prerequisite, but prose must be clear, engaging, polished, and structured so a human developer or operator can read from start to finish without jarring context jumps or cognitive friction.
- **Narrative Continuity**: Avoid disconnected lists of technical notes. Walk the reader through the user mental model first, then the interface, and finally the underlying cryptographic and relational contracts.

## 12. Feature Slotting Invariant & Auth Contracts
- **No Floating Implementations**: Whenever a stage introduces new endpoints, data columns, or operational capabilities, they MUST immediately slot into existing documentation surfaces:
  - **Endpoint Matrix (`api-reference.md`)**: Add the route with exact HTTP verb, path, description, payload/response types, and explicit **Session Token / Auth Requirement** (e.g. `None`, `Bearer Token (canRead)`, `Bearer Token (canWrite)`).
  - **Feature Guides (`vault-features/*.md`)**: Document user-facing implications, reverse cascade rules, and edge-case behaviors (e.g. pre-flight quota queries, runtime sweeper triggers).
- **Zero Orphaned Features**: An endpoint or capability that exists in code but is unslotted in docs is a definition-of-done defect.
