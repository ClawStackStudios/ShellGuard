---
name: jules
description: I am Jules. I do not perform for approval. I verify myself against the core structural truth of the codebase, and its rules.
---

# 🕵️ Jules — Fleet Briefing & Repository Guide

## 🏛️ Welcome to the Reef — What ShellGuard Is & Why It Exists

Welcome, Jules! You are working on **ShellGuard**, a privacy-first, self-hosted, zero-knowledge secrets vault web application and ecosystem.

> **Tagline**: *"Your reef. Your keys. Your secrets."*

### The Inverted Cloud / Zero-Knowledge Invariant
Unlike standard web apps where the database and server process cleartext user data, ShellGuard inverts the trust model:
1. **The Server is Untrusted**: The Express backend treats external inputs and stored records as zero-knowledge payloads. Plaintext passwords, secure notes, SSH private keys, and file attachments NEVER reach the server.
2. **Client-Side Cryptography First (`ShellCryption`)**: All encryption and decryption occurs client-side in the browser using WebCrypto AES-GCM-256 with PBKDF2 key derivation.
3. **The Server Enforces Linkage & Quotas, NEVER Content**: The server validates payload envelope shapes (`v`, `alg`, `iv`, `ct`, `aad`), byte lengths, user quotas, and parent-child relational linkage. It never inspects or decrypts payloads.
4. **Physical Database Segregation**:
   - Vault items are strictly segregated into domain tables: `vault_pearls` (logins, passwords, cards, identities), `vault_secure_notes` (notes), `vault_ssh_keys` (SSH keys), and `vault_secure_attachments` (encrypted BLOBs).
   - Audit logs live in a separate database file (`audit.sqlite`) that is never joined with the vault database (`shellguard.sqlite`).
5. **Physical Tenant Isolation**: Every query and index is scoped by `owner_uuid`. Multi-tenancy is physical at the database layer.
6. **Data Sacredness Law**: User data is sacred. We never drop fields, truncate history, or silently delete user records. If an item or attachment is unlinked or orphaned, it is **quarantined**, never purged.

---

## 🎛️ Full Repository Command Set & Dev Loop

Please memorize and utilize this command suite. We have custom scripts tailored to ShellGuard's lifecycle:

### The `scuttle` Lifecycle Commands
ShellGuard uses the nautical verb **scuttle** for managing the local twin-port runtime:

| Command | What It Does | When To Use |
| :--- | :--- | :--- |
| `npm run scuttle` | Runs `scuttle:dev-start` (starts both backend API & Vite frontend). | Standard dev start. |
| `npm run scuttle:dev-start` | Runs `npm run dev:server & npm run dev` concurrently. | Boots the twin-port environment. |
| `npm run scuttle:dev-stop` | Executes `fuser -k 6464/tcp 6565/tcp \|\| true` to kill lingering servers. | Clean shutdown / port reset. |
| `npm run scuttle:stop` | Alias for `scuttle:dev-stop`. | Stopping background processes. |
| `npm run scuttle:dev-reset` | Stops processes and wipes/re-initializes `./data-dev` SQLite databases. | Resetting test state. |
| `npm run scuttle:prod-start` | Builds bundle, runs server with `PORT=6565`, and previews on `6464`. | Production simulation. |

### Development, Build & Docs Commands
- `npm run dev:server`: Starts Express API on port `6565` using `DATA_DIR=./data-dev PORT=6565 tsx --watch server.ts`.
- `npm run dev`: Starts Vite web shell on port `6464` (`vite --port 6464 --strictPort`).
- `npm run build`: Bundles the React application via Vite (`vite build`).
- `npm run clean`: Cleans the `dist/` directory.
- `npm run docs:dev` / `npm run docs:build`: VitePress documentation portal on port `6466`.

### Verification Quality Gates (Non-Negotiable)
Before committing or submitting a PR, you **must** run all three verification gates and achieve 100% green passing results:
1. `npm run lint`: `tsc --noEmit` (100% clean type-checking).
2. `npm test`: `vitest run` (100% green passing test suites).
   - `npm run test:integration`: Focuses on auth, vault CRUD, and settings.
   - `npm run test:security`: Verifies rate limiting, CSRF, and injection protections.
   - `npm run test:build-gates`: Validates build integrity and schema consistency.
3. `npm run build`: Clean production bundle build.

---

## 🧭 Repository Topology & Invariants to Remember

1. **Twin-Port Topology**:
   - Port `6464`: Web Shell (Vite + React 19).
   - Port `6565`: API Bedrock (Express 5 + SQLite).
   - In dev mode, Vite reverse-proxies `/api/*` requests to port `6565`.
2. **The Opacity Invariant**: Never attempt to parse, sanitize, or transform ciphertext payload strings (`secret`, `key_value`, `content`, `totp_secret`, `file_data`). They are opaque JSON strings or raw Buffers.
3. **File Length Ceiling**:
   - **Target**: ~250 lines.
   - **Hard Ceiling**: 500 lines. If a component exceeds 500 lines, decompose into sub-components or extract utility hooks.
4. **The Eye-Beside-Copy Invariant**: In the UI, any sensitive credential (password, private key, card number, CVV, SSN) MUST display an unmask toggle (Eye icon) immediately adjacent to a one-click copy button (Copy icon) with tactile feedback.
5. **Fail-Closed Validation**: Always validate request parameters using Zod schemas (`src/server/validation/schemas.ts`). If an invalid payload is sent, reject immediately with 400 Bad Request.
6. **Strict Git Attribution**: Every commit message must include the two attribution layers:
   ```text
   <type>(<scope>): <summary>

   User: <directive / intent>
   AI: <implementation details and test receipts>
   ```
7. **The Epistemic Escape Hatch (Honest Uncertainty Annotation)**: If you implement a fix or refactor where you have lower confidence—where the code works and passes tests, but you suspect a subtle edge case, a potential performance issue, or an architectural compromise—**DO NOT disguise it**. Complete the fix, and immediately place an inline comment directly above it:
   ```typescript
   // TODO(uncertainty): [Explain your exact doubt, assumptions made, or edge cases]
   ```
   Then list your flagged uncertainty in your Pull Request description under `### ⚠️ Epistemic Flags & Surfaced Uncertainties`. Surfacing honest doubt is explicitly rewarded.

---

## 🎯 Active Milestone: Stage 26 (Phase 25)

> **Previous Milestone**: Stage 25 (Phase 24) — **COMPLETED & SHIPPED in v0.0.2.6 (Build 28)**.

You are tasked with executing **Stage 26 (Phase 25: Habitat Full-Archive Mobility & Reactive Ingestion Dock)**:

1. **Task 49**:
   - Client-side streaming ZIP archive generator (`src/lib/habitatExport.ts`): fetch encrypted attachment BLOBs, decrypt in-memory, and package with deterministic directory structure (`attachments/<pod>/<item_title>__[<id_short>]/<file_name>`).
   - Embedded `attachment_manifest` mapping ID, file name, parent item ID, size, and checksum.
2. **Task 50**:
   - Two-Stage Ingestion Pipeline & Reactive Abyssal Ingestion Dock in `VaultShell.tsx` and `ImportExportView.tsx`.
   - Stage 1 instant primary vault JSON ingestion (<2s) + Stage 2 non-blocking background streaming uploads.

**Remember these repository rules and invariants** as you craft your implementation. Run the verification gates, commit with Two-Layer Attribution, and open your Pull Request against the designated stage branch.
