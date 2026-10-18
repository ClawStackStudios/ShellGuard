# Task 48: The Auditor's Battery & Threat-Model Addendum

> **Milestone**: Stage 25 / Phase 24 (Task 48 of 52) — **COMPLETED & SHIPPED in v0.0.2.6 (Build 28)**
> **Domain**: Automated Verification Gates, Docs-as-Code & Threat Model
> **Target Branch**: `stage/phase-24-crypto-hardening`
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User:` / `AI:`)

---

## 🎯 Objective & Architectural Seam

Make the ShellGuard repository self-auditing and eliminate documentation drift by construction:

1. **The Executable Claim Battery**:
   - Codify the claim battery verifying that documentation 100% bows to code truth across the L1–L8 classes:
     - Rate limiter counts in docs match `src/server/middleware/rateLimiter.ts`.
     - Database schema claims match active migrations.
     - Identity key formats match `src/server/utils/crypto.ts` and `src/lib/crypto.ts`.
     - Permission masks match Zod schemas in `src/server/validation/schemas.ts`.
     - AAD namespaces match cryptographic test fixtures.
   - Wire this battery into `tests/build-gates.test.ts` (or a dedicated `scripts/audit-docs.ts`) so any docs-lie immediately breaks CI.
2. **The Auditor's Addendum in Threat Model & SECURITY.md**:
   - Update `SECURITY.md` and `docs/architecture/threat-model.md` to document runtime operational realities:
     - **In-process rate limiting**: Resets upon process restart; multi-instance or clustered deployments share no in-memory state.
     - **Per-key LRU eviction**: Evicted key entries fall back safely to SQLite database lookups.
     - **Redaction-regex coverage**: Enumeration of credential redaction patterns used in logs and error formatting.
     - **PBKDF2 iteration count**: Explicit documentation of the 600,000 OWASP iteration standard for custom passphrase exports.

---

## 📁 Files in Scope

- `tests/build-gates.test.ts` (claim battery gate)
- `SECURITY.md` (auditor's operational addendum)
- `docs/architecture/threat-model.md` (threat model addendum)

---

## 🔒 Invariants & Acceptance Criteria

1. **Docs Bow to Code Gate**:
   - Planted documentation lies (e.g. mismatching rate limiters or outdated schemas) fail the test suite loudly.
2. **Threat Model & Security Policy Alignment**:
   - `SECURITY.md` and `docs/architecture/threat-model.md` describe the exact same system invariants.
3. **Clean Test Execution**:
   - `npm test` and `npm run docs:build` pass 100% green.
