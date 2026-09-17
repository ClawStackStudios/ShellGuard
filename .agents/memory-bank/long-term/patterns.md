# Ratified System Patterns — ShellGuard

> Crystallized system patterns proven through repeated navigation, friction, and verification. These patterns have held under pressure across multiple releases and sessions.

---

## native-crypto-over-webcrypto
**weight**: 4 | **last validated**: 2026-09-17 | **first observed**: 2026-08-29

Always use Node.js's native synchronous `crypto` module (`crypto.hkdfSync`, `crypto.createCipheriv`) for server operations, never `crypto.webcrypto.subtle`.

**History:**
- 2026-08-29: Initial discovery during test suite setup — `webcrypto.subtle` operations hung indefinitely on Linux 6.12.24-Unraid with Node v22.23.0.
- 2026-09-04: Confirmed during native LAN TLS and bridge parity testing; async webcrypto in server context stalled test runner execution.
- 2026-09-13: Validated during Phase 17 Key Ledger Hardening; constant-time hash comparisons and HKDF derivations completed in sub-millisecond synchronous ticks with native crypto.
- 2026-09-17: Verified across all 15 test suites (210 tests passing); zero hangs or threadpool deadlocks.

**Shaped perspective:** The webcrypto standard is designed for sandboxed browser runtimes with event loops that handle asynchronous promises gracefully. In a headless Node.js service running on Linux under custom kernel builds (e.g. Unraid), native crypto is not just a performance optimization — it is the boundary between an operational daemon and an unresponsive zombie process. To change this would require proving that Node's V8 webcrypto implementation no longer starves worker threads under crypto loads.

---

## in-place-encryption-envelopes
**weight**: 4 | **last validated**: 2026-09-16 | **first observed**: 2026-08-28

Store per-row encrypted metadata as self-describing JSON envelopes (`{v:1, alg:"SG-META", iv, ct}`) directly within existing TEXT columns, accompanied by an `isEncryptedField()` detection guard.

**History:**
- 2026-08-28: Implemented in Phase 5 to avoid ALTER TABLE schema migrations on production databases.
- 2026-09-04: Validated during bridge parity audit; legacy plaintext rows continued to pass through unencrypted on read while new writes were encrypted automatically.
- 2026-09-13: Confirmed during Phase 17 when `agent_keys` underwent schema evolution; existing envelope parsers handled envelope detection without regression.
- 2026-09-16: Tested during bidirectional docs-code audit; envelope contract remained transparent to client consumers.

**Shaped perspective:** Relational database migrations are high-stress seams that risk data loss, lock contention, and version fragmentation across self-hosted instances. By decoupling data encryption from column schemas through self-describing envelopes, the storage layer becomes resilient to version skew. What broke when we didn't have this was migration anxiety and dual-column sprawl (`title` vs `title_encrypted`). The pattern holds because reading code is cheaper than migrating tables.

---

## zero-hardcoded-pod-purity
**weight**: 3 | **last validated**: 2026-09-13 | **first observed**: 2026-09-02

Vault categories and pods must never fall back to hardcoded default strings like `'Personal'` or `'Default'`. Unassigned items must cleanly evaluate to `""` (uncategorized).

**History:**
- 2026-09-02: Hardcoded `'Personal'` fallbacks caused user-deleted categories to resurrect upon every subsequent vault render and broke custom folder hierarchies.
- 2026-09-04: Purged hardcoded defaults from `podUtils.ts` and normalized comparisons with `normalizePod()`.
- 2026-09-13: Ratified during Phase 17 Key Ledger Hardening: dropped `DEFAULT 'Personal'` from database schema migrations and route handlers, proving uncategorized purity across all 4 item types.

**Shaped perspective:** Hardcoded defaults are a false affordance that presumes to know the user's organizational ontology. In a privacy-first vault, phantom state is indistinguishable from data corruption. When code injects `'Personal'`, it violates user intent and generates phantom synchronization noise. The empty string `""` is the only honest representation of the unassigned state.

---

## test-isolation-via-hoisting
**weight**: 3 | **last validated**: 2026-09-17 | **first observed**: 2026-08-30

Every integration test suite must hoist its unique `DATA_DIR` and port configuration using `vi.hoisted()` prior to dynamic application imports.

**History:**
- 2026-08-30: Initial suites suffered from cross-test SQLite database lock contention and port collisions when run in parallel.
- 2026-09-04: Formalized dedicated port blocks (64641–64645) and hoisted isolated temp directories for each suite.
- 2026-09-17: Verified across 15 test files with `fileParallelism: false`; complete zero-leak test isolation achieved across 210 tests.

**Shaped perspective:** In an application anchored to SQLite and SQLCipher, the database connection is a stateful singleton bound at module import time. If environment variables are set inside `beforeAll()` instead of hoisted before import, the singleton evaluates against the default path, silently polluting dev databases. Hoisting enforces that configuration precedes evaluation, making tests true independent witnesses.
