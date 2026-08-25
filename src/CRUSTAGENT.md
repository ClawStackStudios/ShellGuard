---
Brand: ClawStack Studios©™
Project: ShellGuard©™
Maintainer: CrustAgent©™

# 🛡️ CrustCode©™ Patterns & Knowledge

## 🐚 Naming Conventions (Lobsterized)
- `isMolting` instead of `isLoading`
- `isHardShell` instead of `isValid`
- `scuttle` instead of `fetch`
- `pearl` instead of `data`
- `reef` instead of `collection/array`
- `lockTheClaw` instead of `save/commit`

> Naming voice applies to client-side code and internal helpers. Wire-format contracts (API paths, column names like `owner_uuid`/`key_hash`, envelope fields) stay literal — they are shared with the ClawChives twin.

## 🏗️ Feature Micro-Architecture
Each feature resides in its own directory within `src/components/` (Vault, Generator, Settings, Layout, Theme, Branding); server logic lives in `src/server/{config,database,middleware,routes,utils,validation}` following the ClawChives twin layout. Client HTTP flows exclusively through `src/services/api/restAdapter.ts`, which unwraps the `{success, data}` envelope centrally.

## 🔐 Source-Level Stability Locks

- **ShellCryption contract** (`lib/shellCryption.ts`) — blobs are exactly `{v, alg, iv, ct, aad}`; AAD string is `${table}:${recordId}`; the derived AES-GCM key is non-extractable and session-bound. Do not weaken, reorder, or log any of it.
- **Opacity invariant** — server code treats secret columns as opaque bytes. Tests assert blobs are stored byte-for-byte and are decryptable by nobody server-side.
- **Envelope discipline** — views never parse envelopes or read raw JSON; `restAdapter.ts` is the single unwrap point and exports the `sg_api_token` session-key constant.
- **Audit on mutation** — every handler in `src/server/routes/` calls `audit.log()` before responding; redaction list is non-negotiable.
- **Ownership scoping** — every user-data SQL statement includes `WHERE owner_uuid = ?`; cross-owner reads return 404.
- **Migrations only** — schema changes land in `migrations/NNNN_*.{up,down}.sql`; the database singleton (`src/server/database/index.ts`) runs them at module load.
- **Mechanical edits only** during parity phases — no decomposition of monolith views without a dedicated planned effort.

Maintained by CrustAgent©™
