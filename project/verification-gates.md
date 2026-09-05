# ✅ ShellGuard — Verification Gates Specification

> **Test suites, per-suite isolation, build gates & the verification trilogy**
> *Pulled into existence by Phase 4. Grows with the walk.*

---

## §1. The Test Harness

- **Runner**: Vitest + supertest, configured in `vitest.config.ts`.
- **Per-suite isolation (load-bearing)**: every suite receives its **own**
  `DATA_DIR` sandbox (`tests/data-<suite>-<suffix>/`) before the server module
  is dynamically imported — suites never share a database, so parallel runs
  and cross-suite contamination are structurally impossible.
- **Helpers** (`tests/helpers/`):
  - `testDb.ts` — spins up an isolated Bedrock + audit pair.
  - `testAuth.ts` — creates users, mints `api-` tokens, builds `lb-` agent keys.
  - `testFactories.ts` — vault item factories for all domains.
- **Rule**: a test suite requires the app instance as its argument
  (`createTestUserWithToken(app)`) — bare calls crash obscurely.

## §2. The Suites (as of Phase 4)

| Suite | Proves |
|:---|:---|
| `auth-flow.test.ts` | register → token → identity journey |
| `security.test.ts` | cross-owner isolation fails closed; opacity invariant; rate limits |
| `vault-crud.test.ts` | uniform CRUD contract across all four domains |
| `settings.test.ts` | per-owner preference persistence |
| `build-gates.test.ts` | lint/type/build integrity as executable tests |
| `tests/unit/middleware/errorHandler.test.ts` | centralized error semantics |

## §3. Build Gates

1. `npm test` — all suites green.
2. `npm run build` — production bundle compiles.
3. Both gates are also encoded as executable tests (`build-gates.test.ts`)
   so CI cannot skip them.

## §4. The Verification Principle

Every phase in the spine ends with a verify line tied to these gates. The rule:
**a test oracle is the source of truth** — docs claim nothing the suites don't
prove, and the suites are updated in the same phase as the behavior they verify.

---

## §5. The Release Protocol (release-era grammar)

Established at genesis, formalized across release phases:

1. **Rolling RELEASE file** — exactly one `RELEASE-v*.md` exists at any time.
   Each release `git mv`s it upward (`RELEASE-v0.0.1.md` →
   `RELEASE-v0.0.1.2.md` → …) and rewrites its contents — release notes are
   never accumulated as separate files.
2. **Release grammar**: tag `vX.Y.Z` → RELEASE doc rewritten → CHANGELOG
   entry → `package.json` bump — in that order, with the commit ledger as
   receipts. The RELEASE doc's feature list must match the roadmap's
   transcribed phases for that bracket.
3. **Dev-loop rules** (`.agents/`): `docs-hygiene` (documentation evolves in
   the same change as the code it describes), `start-task` / `finish-task`
   workflows — the agent contract that keeps docs and app welded together.

---

