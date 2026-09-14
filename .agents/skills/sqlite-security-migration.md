# Skill: SQLite Security-Migration Pattern (retiring sensitive columns)

When a migration retires plaintext/sensitive columns (e.g., hash-only ledgers):

1. **Schema migration (SQL)**: ADD the new columns + indexes. Do NOT drop the
   old column in SQL if it is UNIQUE — SQLite refuses `DROP COLUMN` past an
   auto-index; plan a table rebuild instead.
2. **Crypto backfills CANNOT run in SQL** — put them in a code module invoked
   immediately after `runMigrations` (same seam as PRAGMA rekey recognition).
   Idempotent (early-exit when already migrated), fail-closed (throw if the
   schema doesn't match the expected stage).
3. **Inside ONE transaction, ordered**: (a) rewrite dependent references that
   encode the sensitive value (join while the plaintext still exists),
   (b) hash/copy in place, (c) retire via table rebuild
   (`CREATE new` → `INSERT SELECT` → `DROP old` → `RENAME` → recreate indexes).
4. **VACUUM after the transaction commits** — freed pages retain the old bytes
   until then. A security retirement is not done at the schema level; it is
   done at the BYTE level.
5. **Prove it with a byte-scan test**: read the raw database file and assert
   the sensitive value's bytes are absent — plus a pre-migration row that
   still authenticates after backfill.

*Reference implementation: ShellGuard `src/server/database/keyLedger.ts` +
`migrations/0004_key_ledger.*` + `tests/agent-key-hash.test.ts` (Phase 17,
commit 7faf51d).*
