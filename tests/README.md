# ShellGuard Test Harness

Server-side suites only (vitest + supertest). No browser, no jsdom, no React
plugin — `vitest.config.ts` is standalone on purpose.

## How isolation works

Every integration suite owns a **private SQLite pair** (main + audit db) inside
a throwaway `DATA_DIR`. The mechanism has two halves and both are required:

1. **The isolation preamble** — at the very top of the suite file, before any
   import of the server module:

   ```ts
   vi.hoisted(() => {
     const fsLib = require('node:fs');
     const pathLib = require('node:path');
     const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-<suite>-'));
     process.env.DATA_DIR = dir;
     process.env.NODE_ENV = 'test';
     process.env.PORT = '4646X';            // unique per suite — server.ts listens on import
     process.env.DB_ENCRYPTION_KEY = '';
     process.env.TOKEN_TTL_DEFAULT = '30m';
     // neutralise rate limits so failure-path tests stay deterministic
     process.env.AUTH_RATE_LIMIT = '1000000';
     process.env.AUTH_RATE_WINDOW = '600m';
     process.env.API_RATE_LIMIT = '1000000';
     process.env.API_RATE_WINDOW = '600m';
   });
   ```

   Vitest hoists `vi.hoisted(...)` above all static imports, so `DATA_DIR` is
   set **before** the database singleton evaluates. The block must stay
   self-contained (`require`, no helper imports): hoisting happens before
   module imports resolve. This mirrors the ClawChives house pattern.

   The per-suite `PORT` matters because the twin-verbatim `server.ts` calls
   `app.listen()` at module top level (CC behaviour). Parallel vitest workers
   would otherwise race for :4646 — each suite claims its own port instead.
   Current allocation: auth-flow 46461 · security 46462 · vault-crud 46463 ·
   settings 46464.

2. **Dynamic server load + cleanup** — in `beforeAll`/`afterAll`:

   ```ts
   import { loadServer, releaseServer } from './helpers/testDb.js';

   let srv!: ServerHandle;
   beforeAll(async () => { srv = await loadServer(); });   // await import('../server.js')
   afterAll(async () => { await releaseServer(srv); });    // close DBs, rm -rf tests/data-<suite>-*
   ```

`loadServer()` refuses to run unless `DATA_DIR` points at a `tests/data-*`
directory — that guard keeps stray writes out of the repo. Nothing outside
those temp dirs is ever created; they are removed on clean exits and gitignored
(`tests/data-*`).

## Adding a suite

1. Copy the preamble above into `tests/<name>.test.ts` (rename the mkdtemp
   prefix to `data-<name>-`).
2. Add the `loadServer()` / `releaseServer()` pair.
3. Build identities through the API helpers, never raw SQL:

   ```ts
   import { createTestUserWithToken, createTestUserWithAgent } from './helpers/testAuth.js';
   const { user, token } = await createTestUserWithToken(srv.app);
   const { agentToken } = await createTestUserWithAgent(srv.app); // Lobster Key + api- token
   ```

4. Fixtures come from `tests/helpers/testFactories.ts`. Payload "secrets" are
   opaque ShellCryption-shaped JSON blobs (`{v, alg, iv, ct, aad}`) — fixtures,
   not crypto. Never post plaintext secrets; assert byte-for-byte round-trips.

## Envelope contract

Success: `{ success: true, data: … }` · Failure: `{ success: false, error }`,
with zod validation failures adding `details[]` of `{path, message}`. Helpers:
`expectSuccessEnvelope` / `expectErrorEnvelope` in `tests/vault-crud.test.ts`.

## Build gates

`tests/build-gates.test.ts` pins repository shape (strict tsconfig flags,
Dockerfile HEALTHCHECK + non-root entrypoint, lockfile-in-.dockerignore per
delta #10, migrations pair, compose healthchecks, Unraid XML). Artifacts land
via other tracks, so each content gate self-skips until its target file exists
(the strict-mode gate arms when `"strict": true` appears in tsconfig.json).
Green pre-merge → enforcing post-merge, no test edits needed.

## Known assumptions

- The server module exposes `export const app` (plus optional `db` / `auditDb`)
  from `server.ts`; suites import it as `'../server.js'` (TS ESM convention).
  If the export surface shifts, adjust only `tests/helpers/testDb.ts`.
- `TOKEN_TTL_DEFAULT` is read per request (CC behaviour), so TTL-parser tests
  may flip the env var mid-suite with restore.
- Expiry tests use fake clocks (`vi.useFakeTimers({ toFake: ['Date'] })`) —
  no real sleeps anywhere in the harness.

## Running

```
npm test                 # everything
npm run test:integration # auth-flow + vault-crud + settings
npm run test:security    # cross-owner isolation + permission matrix
npm run test:build-gates # repo shape gates
npm run test:full        # alias of npm test
```

(Scripts land in package.json with the Phase 4 merge.)
