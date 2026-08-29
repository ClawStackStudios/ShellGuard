---
Brand: ClawStack Studios©™
Project: ShellGuard©™
Maintainer: CrustAgent©™
Status: Reef Hardened — Architecture Parity v0.0.1

# 🛡️ ShellGuard©™: The Exoskeletal Vault

ShellGuard©™ is a sovereign zero-knowledge secrets manager built on the Five Pillars of Lobsterization©™.
It ensures that your pearls are hardened behind ShellCryption©™ and accessible only via ClawKeys©™.

## 🏛️ Architecture

- **Frontend:** React + Vite + Tailwind (Reef Modernist / Ocean Dark)
- **Backend:** Express 5 (`server.ts`, twin of ClawChives layout) — helmet, cors config, zod validation, rate limiters, centralized error handler
- **Database:** SQLite via `better-sqlite3-multiple-ciphers` — `DATA_DIR` holding `db.sqlite` + segregated append-only `audit.sqlite`; transactional migrations in `migrations/`
- **Identity:** ClawKeys©™ (`hu-` humans, `lb-` agents, `api-` sessions) — key-hash only, constant-time compare
- **Runtime topology:** dev = twin ports (UI :6464 → API :6565); prod = single container, single port (:6464), PUID/PGID entrypoint

## 🔐 Stability Locks (NEVER BREAK THESE)

- **Zero-Knowledge Invariant** — the server stores secret material ONLY as `{v, alg, iv, ct, aad}` ShellCryption blobs; AAD binds `table:recordId`; the server can never decrypt anything.
- **DB_ENCRYPTION_KEY is optional defense-in-depth** covering metadata only — warn-not-block when unset.
- **All mutations are audited** into the segregated `audit.sqlite`, redacted so titles/urls/usernames/secrets/tokens/ciphertext never land in logs.
- **hu- keys are NEVER stored in plaintext** — only SHA-256 hashes cross the wire or rest in `lobsters.key_hash` (UNIQUE).
- **Every user-data query filters `owner_uuid`** — a missing scope clause is a security bug.
- **Lobster Keys©™ are granular and instantly revocable**; `requireHuman` walls agents off from settings and key minting.
- **Twin-verbatim policy** — server modules stay file-for-file diffable against ClawChives; deliberate deltas live only in [ARCHITECTURE.md § Appendix](./ARCHITECTURE.md).
- **Schema changes ship as migrations** (`migrations/NNNN_*.{up,down}.sql`) — no inline DDL, ever.

## 🗺️ Agent Read Order

1. `CRUSTAGENT.md` (this file)
2. `src/CRUSTAGENT.md`
3. `README.md`
4. `ARCHITECTURE.md` (hard constraints + endpoint tables)
5. `SECURITY.md` (threat model)

Maintained by CrustAgent©™
