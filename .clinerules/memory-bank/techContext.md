# Tech Context — ShellGuard

## Technologies

- **Runtime**: Node.js v20+ (v22.23.0 in current environment)
- **Framework**: Express 5 (path-to-regexp v8)
- **Database**: SQLite via `better-sqlite3-multiple-ciphers` (SQLCipher support)
- **Frontend**: React + Tailwind CSS (Reef Modernist design system)
- **Build**: Vite (strictPort :5353, /api proxy → :5454)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest + supertest, per-suite DATA_DIR isolation
- **Container**: Multi-stage node:20-alpine, PUID/PGID aware
- **License**: AGPL-3.0-only

## Development Setup

```bash
npm install
cp .env.example .env
npm run scuttle:dev-start
# Frontend: http://localhost:5353 (Vite + HMR)
# Backend:  http://localhost:5454/api/health (DATA_DIR=./data-dev)
```

## Port Allocation

| Environment | Frontend | API |
|---|---|---|
| Development | :5353 (Vite) | :5454 (Express) |
| Production | :5353 (served by Express) | :5353 (same port) |
| Tests | N/A | 54541-54544 (per-suite) |

## Technical Constraints

- `crypto.webcrypto.subtle` HANGS in this environment — always use native `crypto` module
- `crypto.hkdfSync` for key derivation, `crypto.createCipheriv`/`createDecipheriv` for AES-256-GCM
- Express 5 rejects `app.get("*")` — use regex literal for SPA catch-all
- SQLite CURRENT_TIMESTAMP and JS ISO strings do NOT compare correctly — use JS ISO comparison
- Body limits: 1mb global, 32mb scoped to `/api/attachments`

## Dependencies (Key)

- `better-sqlite3-multiple-ciphers` — SQLite with SQLCipher
- `express` v5 — HTTP framework
- `helmet` — Security headers
- `zod` — Schema validation
- `vitest` + `supertest` — Testing

## Tool Usage Patterns

- `npm test` — all suites
- `npm run test:integration` — auth-flow + vault-crud + settings + metadata-encryption
- `npm run test:security` — cross-owner isolation + permission bypass
- `npm run test:build-gates` — Dockerfile/config shape gates
- `npm run scuttle:dev-reset` — wipe data-dev/
- `tsx scripts/encrypt-existing-metadata.ts` — batch encrypt legacy plaintext metadata
