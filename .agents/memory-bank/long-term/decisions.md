# Decision Framings — ShellGuard

> Deep framings of architectural and governance decisions that carry shaped perspective. These explain why choices hold, what alternatives cost, and the principles that make them legible.

---

## docs-bow-to-code
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-16

When verified, secure runtime code contradicts documentation prose, documentation bows to code. Stale documentation is the defect; never mutate secure, working code to fit outdated narrative claims.

**History:**
- 2026-09-16: The bidirectional docs-code audit revealed 8 discrepancies (PRAGMA rekey vs sqlcipher_export, authLimiter thresholds, identity JSON schema, fifth permission mask `canMove`, custom-field AAD pattern).
- 2026-09-16: Formal governance ruling established: verify against enforcing code first, read test fixtures as the behavioral oracle, and update the documentation to mirror truth.
- 2026-09-17: Applied across root docs and memory bank updates; zero regressions in running test suites.

**Shaped perspective:** Software engineers frequently suffer from "doc-first reverence," assuming an earlier architectural document contains holy intent that the code failed to meet. In production cryptography, the code and its passing test harness represent the true empirical invariant. Altering a working rate-limiter or encryption key derivation path to match an old markdown document risks introducing devastating security vulnerabilities. Code is truth; docs are testimony.

---

## the-clawkey-canon
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-16

Unify all identity, encryption, and delegation terminology across Web and Android platforms: `ClawKey©™` is the human identity key (`hu-`), `ShellCryption©™` is the client-side encryption engine, and `LobsterKeys` are the delegated agent API keys (`lb-`).

**History:**
- 2026-08-30: Early web implementation called human keys "ShellKey™" while Android companion documentation referred to "ClawKey™".
- 2026-09-16: Renamed 14 user-facing strings across `LoginView`, `QuickLoginModal`, `ImportExportView`, and `Header`. Internal variable bindings (`deriveShellKey`) were preserved as cross-project contracts.
- 2026-09-17: Re-verified across all brand assets and documentation hubs; zero terminology divergence remains between web and mobile ecosystems.

**Shaped perspective:** Terminology divergence across client apps is not cosmetic — it is a security vulnerability. When a user is asked for a "ShellKey" in a browser but exported a "ClawKey" from their phone, doubt enters the authentication gesture. In zero-knowledge architectures where keys represent total sovereignty, consistent naming grounds the user's mental model in absolute clarity.

---

## hash-only-agent-key-ledger
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-13

Store agent API keys exclusively as SHA-256 hashes and displayable fingerprints (`lb-***-XXXX`). Plaintext keys are minted once, delivered to the creator, and never persisted anywhere in the database.

**History:**
- 2026-09-13: Implemented Phase 17 via migration `0004_key_ledger.sql`, backfilling existing keys into hashes, repointing tokens to row IDs, and running `VACUUM` to purge plaintext ghost pages from SQLite WAL journals.
- 2026-09-13: Added `tests/agent-key-hash.test.ts` scanning SQLite bytes to prove zero cleartext leakage.
- 2026-09-17: Verified constant-time `crypto.timingSafeEqual()` authentication across all 210 unit and integration tests.

**Shaped perspective:** A secrets vault that stores automated agent credentials in plaintext is a vault with a hole in the floor. Even though agent keys are restricted to non-secret metadata, a leaked database backup would grant an attacker persistent read/write access to vault structures. By treating agent keys with the same hash-and-salt rigor as user passwords, the database remains useless to an intruder without active token minting.

---

## agent-memory-bank-isolation
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-09-17

Maintain strict, impenetrable isolation between agent memory bank directories: Antigravity operates strictly in `.agents/memory-bank/`; Cline operates strictly in `.clinerules/memory-bank/`. Zero cross-mirroring or cross-modifying.

**History:**
- 2026-09-16: Earlier workflows attempted to dual-mirror changelogs and active contexts across both `.clinerules/` and `.agents/`.
- 2026-09-17: Cross-mirroring created branch friction, merge conflicts, and state contamination between different agent paradigms.
- 2026-09-17: Lucas established the definitive boundary: each agent owns its own bank. Antigravity reverted `.clinerules/` and committed strictly to `.agents/memory-bank/`.

**Shaped perspective:** AI pair-programming agents are not interchangeable clones reading a shared blackboard. Each agent carries distinct system prompts, operational rules, sliding window heuristics, and lifecycle cadences. When one agent modifies another agent's memory bank, it introduces alien token distributions and invalidates sliding window invariants. Boundary isolation preserves cognitive coherence.
