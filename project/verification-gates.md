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
