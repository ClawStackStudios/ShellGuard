# Task 47: WebCrypto Fallback Vector Parity & Constant-Time Guarantee

> **Milestone**: Stage 25 / Phase 24 (Task 47 of 52) — **COMPLETED & SHIPPED in v0.0.2.6 (Build 28)**
> **Domain**: Cryptographic Engine, Standards Vectors & Side-Channel Boundaries
> **Target Branch**: `stage/phase-24-crypto-hardening`
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User:` / `AI:`)

---

## 🎯 Objective & Architectural Seam

Close the open soft spots in ShellGuard's cryptographic guarantees:

1. **WebCrypto Fallback Vector Parity**:
   - In `tests/unit/webCryptoFallback.test.ts`, run the pure-TS WebCrypto engine against real standards vectors:
     - **SHA-256**: FIPS 180-4 standard published test vectors.
     - **HMAC-SHA256**: RFC 2104 standard published test vectors.
     - **HKDF-SHA256**: RFC 5869 standard published test vectors.
     - **AES-256-GCM**: NIST SP 800-38D standard published test vectors.
   - Assert byte-identity with Node native crypto output on every vector.
2. **Mechanized Constant-Time Comparison Sweep**:
   - Enumerate every comparison site over key material and secrets across `src/` (auth, admin, revoke, sentinel).
   - Guarantee zero `===` or `!==` comparisons on secret strings or key hashes.
   - Enforce constant-time comparison via `constantTimeCompare()` in `src/server/utils/crypto.ts`.
   - Create an executable assertion or test script to catch raw equality checks on secrets in CI.
3. **Honest Side-Channel Boundary Documentation**:
   - Document the boundary in `project/encryption-layers-spec.md` §5:
     Pure-TS AES-GCM provides functional parity (for plain HTTP LAN availability on devices like Unraid), not hardware-level side-channel parity.

---

## 📁 Files in Scope

- `tests/unit/webCryptoFallback.test.ts` (standards test vectors)
- `src/server/utils/crypto.ts` (constant-time verification helpers)
- `src/server/routes/auth.ts`, `src/server/routes/admin.ts`, `src/server/middleware/auth.ts` (secret comparison audit)
- `project/encryption-layers-spec.md` (§5 side-channel documentation)

---

## 🔒 Invariants & Acceptance Criteria

1. **Standards Vector Parity**:
   - Pure-TS engine matches published vectors byte-for-byte and matches Node `crypto` output.
2. **Zero `===` on Secrets**:
   - Every secret/token comparison executes in constant time with dummy comparison on length mismatch.
3. **Clean Test Execution**:
   - All tests pass 100% green without regressions.
