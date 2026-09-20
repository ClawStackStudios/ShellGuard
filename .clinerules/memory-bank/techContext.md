# Tech Context — ShellGuard

## Technologies

- **Runtime**: Node.js v20+ (v22.23.0 in current environment)
- **Framework**: Express 5 (path-to-regexp v8)
- **Database**: SQLite via `better-sqlite3-multiple-ciphers` (SQLCipher support)
- **Frontend**: React + Tailwind CSS (Reef Modernist design system)
- **Build**: Vite (strictPort :6464, /api proxy → :6565)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest + supertest, 20 suites / 248 tests (1 skipped), per-suite DATA_DIR isolation
- **Container**: Multi-stage node:20-alpine, PUID/PGID aware
- **License**: AGPL-3.0-only

## Development Setup

```bash
npm install
cp .env.example .env
npm run scuttle:dev-start
# Frontend: http://localhost:6464 (Vite + HMR)
# Backend:  http://localhost:6565/api/health (DATA_DIR=./data-dev)
```

## Port Allocation

| Environment | Frontend | API |
|---|---|---|
| Development | :6464 (Vite) | :6565 (Express) |
| Production | :6464 (served by Express) | :6464 (same port) |
| Tests | N/A | 64641-64649 (per-suite) |

## Technical Constraints

- `crypto.webcrypto.subtle` HANGS in this environment (Node.js) — always use native `crypto` module
- `window.crypto.subtle` is **undefined** on plain HTTP browser origins (LAN IPs) — `src/lib/webCryptoFallback.ts` polyfills client-side
- `window.crypto.randomUUID` is undefined on HTTP origins — multi-tier fallback in `src/lib/crypto.ts`
- `crypto.hkdfSync` for key derivation, `crypto.createCipheriv`/`createDecipheriv` for AES-256-GCM
- Express 5 rejects `app.get("*")` — use regex literal for SPA catch-all
- SQLite CURRENT_TIMESTAMP and JS ISO strings do NOT compare correctly — use JS ISO comparison
- Body limit: 1mb global. Attachment POSTs are multipart (Busboy, streamed ciphertext BLOB); 500MB/file ceiling (ATTACHMENT_MAX_MB) + 1000MB/owner grotto quota (GROTTO_QUOTA_MB), 413 on breach mid-stream (Phase 20)
- Admin plane: `ADMIN_TOKEN` env gates the SuperLobster Panel (503 when unset); cookie `sg_admin_session` (httpOnly/SameSite=Strict/20-min sliding); admin auth rate limit 5/10min; backups in `DATA_DIR/backups/`

## Dependencies (Key)

- `busboy` — Multipart streaming upload parsing (Phase 19)
- `better-sqlite3-multiple-ciphers` — SQLite with SQLCipher
- `express` v5 — HTTP framework
- `helmet` — Security headers
- `zod` — Schema validation
- `vitest` + `supertest` — Testing

## Tool Usage Patterns

- `npm test` — all suites (20 test files, 248 tests, 1 skipped)
- `npm run test:integration` — auth-flow + vault-crud + settings + metadata-encryption
- `npm run test:security` — cross-owner isolation + permission bypass
- `npm run test:build-gates` — Dockerfile/config shape gates
- `npm run scuttle:dev-reset` — wipe data-dev/
- `tsx scripts/encrypt-existing-metadata.ts` — batch encrypt legacy plaintext metadata
