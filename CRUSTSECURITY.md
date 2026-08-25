# 🛡️ Security Alignment — ClawStack©™ Standards

[![Security](https://img.shields.io/badge/ClawStack-Standards%20Aligned-green?style=for-the-badge)](#)
[![Verification](https://img.shields.io/badge/Verification-Complete-green?style=for-the-badge)](#)
[![Last Verified](https://img.shields.io/badge/Last_Verified-2026--08--24-blue?style=for-the-badge)](#)

> **Scope:** This document verifies that ShellGuard implements ClawStack©™ security standards. It is a project-specific verification that adopted standards have been properly implemented — not company policy.

---

## 🎯 Standards Applicability Matrix

| Standard | Status | Implementation | Evidence |
|---|---|---|---|
| **ClawKeys Protocol** | ✅ | `hu-` identity keys, constant-time comparison, `key_hash` UNIQUE index, `lb-` scoping + expiry + rate limits | [crypto.ts](./src/lib/crypto.ts), [ARCHITECTURE.md § Key System](./ARCHITECTURE.md) |
| **ShellCryption™** | ✅ | Client-side AES-GCM-256 field encryption, HKDF key derivation from `hu-`, AAD binding `table:recordId`, SHA-256 client-side hashing | [shellCryption.ts](./src/lib/shellCryption.ts), [crypto.ts](./src/lib/crypto.ts) |
| **Threat Modeling** | ✅ | OWASP coverage matrix, 6 vault-specific attack scenarios with mitigations | [SECURITY.md](./SECURITY.md) |
| **Database Invariants** | ✅ | Foreign keys, unique constraints, `owner_uuid` isolation, WAL mode, transactional migrations, segregated audit DB | [src/server/database/](./src/server/database/), [BLUEPRINT.md](./BLUEPRINT.md) |
| **CrustAgent Validation** | ✅ | TypeScript strict mode, Vitest/supertest suites (security + build gates), audit logging, Zod validation | [tests/](./tests/), [CONTRIBUTING.md](./CONTRIBUTING.md) |

---

## 🔐 Implementation Verification

<details>
<summary>🗝️ ClawKeys Protocol ✅</summary>

- [x] **Key Entropy** — `hu-` and `lb-` keys generated in-browser via `crypto.getRandomValues()` with rejection sampling to eliminate modulo bias
  - File: [`src/lib/crypto.ts`](./src/lib/crypto.ts)
  - 64-character hex keys (67 chars with prefix) from 32 bytes of entropy

- [x] **Key Storage** — raw `hu-`/`lb-` keys never stored server-side. Only `SHA-256(key)` is ever sent. Session tokens live in `sessionStorage` under the exported constant `sg_api_token` (clears on tab close / logout / auto-lock)
  - Files: [`src/services/api/restAdapter.ts`](./src/services/api/restAdapter.ts), [`src/App.tsx`](./src/App.tsx)

- [x] **Constant-Time Comparison** — XOR accumulator comparison for key-hash verification server-side (`constantTimeCompare`)
  - Files: [`src/server/utils/crypto.ts`](./src/server/utils/crypto.ts)

- [x] **Identity File Format** — exported as `shellguard_identity_key.json` containing `username`, `uuid`, and `hu-` token
  - Files: [`src/components/SetupView.tsx`](./src/components/SetupView.tsx)

- [x] **Agent Key Hygiene** — `lb-` keys carry granular permissions, expiration type/date, per-key rate limits; revocation is immediate and audited
  - File: [`src/server/routes/agentKeys.ts`](./src/server/routes/agentKeys.ts)

</details>

<details>
<summary>🔐 ShellCryption™ ✅</summary>

- [x] **AES-256-GCM Field Encryption** — every secret field encrypted client-side via Web Crypto API before transmission
  - File: [`src/lib/shellCryption.ts`](./src/lib/shellCryption.ts) → `encryptField()` / `decryptField()`
  - Blob shape: `{v, alg, iv, ct, aad}` — the only secret representation the server ever stores

- [x] **Key Derivation** — HKDF-SHA-256 over the `hu-` key (salt = user uuid, info = `"clawchives-shellcryption-v1"`) → non-extractable AES-GCM-256 `CryptoKey`, held in session memory only
  - File: [`src/lib/shellCryption.ts`](./src/lib/shellCryption.ts) → `deriveShellKey()`

- [x] **AAD Binding** — additional authenticated data is `table:recordId`; ciphertexts cannot be transplanted between rows or tables without failing GCM authentication
  - File: [`src/lib/shellCryption.ts`](./src/lib/shellCryption.ts)

- [x] **Client-Side Hashing** — `hashToken()` performs one-way SHA-256 before any transmission; raw keys never cross the wire
  - File: [`src/lib/crypto.ts`](./src/lib/crypto.ts)

- [x] **Data in Transit** — HTTPS expected in production via reverse proxy TLS, or `ENFORCE_HTTPS=true`
  - Reference: [SECURITY.md § Hardening Checklist](./SECURITY.md)

</details>

<details>
<summary>🎯 Threat Modeling ✅</summary>

- [x] **OWASP Top 10 Coverage** — SQLi, XSS, CSRF, auth bypass, authorization bypass, rate limiting, audit trail all mitigated
  - Reference: [SECURITY.md § OWASP Coverage Checklist](./SECURITY.md)

- [x] **6 Vault-Specific Attack Scenarios** — stolen `db.sqlite` with and without `DB_ENCRYPTION_KEY`, stolen `api-` token, over-scoped Lobster Key, browser memory/clipboard exposure, backup leakage — each documented with mitigations
  - Reference: [SECURITY.md § Attack Scenarios](./SECURITY.md)

- [x] **Key Leakage Vectors** — `hu-`, `api-`, and `lb-` analyzed separately with storage risk and mitigation paths
  - Reference: [SECURITY.md § Key Leakage Vectors](./SECURITY.md)

- [x] **Audit Metadata Discipline** — extended redaction list ensures titles/urls/usernames/secrets/tokens/ciphertext never reach the audit reef (vault-hardened beyond baseline standard)
  - Reference: [ARCHITECTURE.md § Audit Taxonomy](./ARCHITECTURE.md)

</details>

<details>
<summary>🗄️ Database Invariants ✅</summary>

- [x] **Foreign Key Enforcement** — `PRAGMA foreign_keys = ON` prevents orphaned records
  - File: [`src/server/database/connection.ts`](./src/server/database/connection.ts)

- [x] **Unique Constraints** — `key_hash` enforced as UNIQUE for collision-free one-field login
  - Reference: [`migrations/0001_initial.up.sql`](./migrations/0001_initial.up.sql)

- [x] **Owner Isolation** — `owner_uuid` required on all user-data tables (delta #5 naming); all queries scoped `WHERE owner_uuid = ?`; cross-owner reads return 404 (no existence leak); asserted by `tests/security.test.ts`
  - Files: All route handlers in [`src/server/routes/`](./src/server/routes/)

- [x] **Transaction Safety** — WAL journal mode + synchronous NORMAL for crash durability
  - File: [`src/server/database/connection.ts`](./src/server/database/connection.ts)

- [x] **Transactional Migrations** — versioned `NNNN_*.up/down.sql` tracked in `schema_migrations`; no inline DDL anywhere
  - Files: [`migrations/`](./migrations/), [`src/server/database/migrationRunner.ts`](./src/server/database/migrationRunner.ts)

- [x] **Segregated Audit Bedrock** — append-only `audit.sqlite` isolated from live data, retention-pruned daily
  - File: [`src/server/database/schema.ts`](./src/server/database/schema.ts)

- [x] **Parameterized Queries Only** — `db.prepare(...).run(?, ?)` — no string interpolation ever
  - Verified across all route handlers

</details>

<details>
<summary>🤖 CrustAgent Validation ✅</summary>

- [x] **TypeScript Strict Mode** — enforced across all `.ts`/`.tsx` files. Zero `any` without justification.
  - Command: `npm run lint`

- [x] **Vitest + Supertest Suites** — auth-flow, security (cross-owner isolation + permission bypass), vault-crud (opacity invariant), settings, unit/errorHandler, build-gates; per-suite `DATA_DIR` isolation
  - Files: [`tests/`](./tests/)
  - Command: `npm run test:full`

- [x] **Audit Logging** — every mutation timestamped and stored in the segregated SQLite audit reef
  - File: [`src/server/utils/auditLogger.ts`](./src/server/utils/auditLogger.ts)

- [x] **Zod Schema Validation** — all mutating API endpoints validated with typed Zod schemas
  - Files: [`src/server/validation/schemas.ts`](./src/server/validation/schemas.ts)

- [x] **Build Gates** — CI publishes images only after Dockerfile/config shape assertions pass
  - File: [`tests/build-gates.test.ts`](./tests/build-gates.test.ts)

</details>

---

## 🚢 Maintaining Alignment

<details>
<summary>📋 Standards Update Process</summary>

When ClawStack©™ standards are updated:

1. **Review** — Understand what's new or modified
2. **Assess** — Does this affect ShellGuard?
3. **Implement** — Add/modify code to comply
4. **Update** — Add evidence to this document
5. **Notify** — Flag in PR for review

**Owner:** Security team (Lucas)
**Review Frequency:** Quarterly
**Last Verified:** 2026-08-24

</details>

<details>
<summary>⚠️ Non-Compliance Escalation</summary>

If a standard cannot be met:

1. Document the gap in [SECURITY.md](./SECURITY.md) (Known Limitations / scenario notes)
2. Explain the trade-off and reason
3. Plan remediation with a target date
4. Add to [ROADMAP.md](./ROADMAP.md) for visibility

Current accepted deviations from the ClawChives baseline are the documented deltas #1–#12 in [ARCHITECTURE.md § Appendix](./ARCHITECTURE.md) — all of which *tighten* rather than loosen security posture.

</details>

---

## 📚 Cross-References

- **Full implementation details**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Practical hardening guide**: [SECURITY.md](./SECURITY.md)
- **Vulnerability reporting**: [SECURITY.md § Reporting a Vulnerability](./SECURITY.md)
- **Code standards**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Key generation rules**: [src/lib/crypto.ts](./src/lib/crypto.ts)
- **Zero-knowledge invariant**: [ARCHITECTURE.md § Hard Constraints](./ARCHITECTURE.md)

---

<div align="center">

**Maintained by CrustAgent©™**

</div>
