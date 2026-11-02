# Stage Execution Record: Stage 28.2 — Network Topology, TLS Fallback Safety & Rate Limiter Hardening

> **Milestone**: `v0.0.3.0 (Build 32)`  
> **Tasks**: Task 57 (Network & TLS Engine) & Task 58 (UI Component)  
> **Status**: 🟢 **RATIFIED & MERGED** (Commit `f81330e`)  
> **GitHub Issues**: #15, #16  

---

## 1. Executive Summary

Sub-Phase 28.2 eliminated self-bricking redirect loops during TLS failures and hardened rate limiting and proxy routing:
- Dynamic `isTlsServerActive` tracking suppressing forced HTTPS 301 loops and cookie `Secure` flags when falling back to HTTP.
- Container health probe exemption for `/api/health`.
- Multi-proxy comma-separated `X-Forwarded-Proto` chain parsing and `TRUST_PROXY` hop count parsing.
- `parseWindow()` units expansion to support hours (`h`) and days (`d`), fixing `parseWindow('1h')` falling through to `1ms`.
- Rate limiter clamping (`> 0`) preventing accidental self-DoS lockouts on `max: 0`.
- BYO certificate overwrite guards (`400 Bad Request` on `/api/admin/tls/generate`), active certificate downloads, and `🛡️ BYO Cert Active` badges.
- SuperLobster Environment & Guardrails Diagnostic Card in `SuperLobsterStatus.tsx`.
- SuperLobster login back button refined to ShellGuard Magenta pill at `top-6 left-6`.

---

## 2. Test Vectors & Falsifiable Claims

- **Unit Test Batteries**:
  - `tests/unit/https-redirect.test.ts`
  - `tests/unit/rate-limiter.test.ts`
  - `tests/unit/tls-admin.test.ts`
  - All 33 test suites passing 100% green on GitHub Actions Cloud CI (Run `#41281116085`).
- **Claim Checks**:
  - `GET /api/health` returns 200 without redirect even when `TLS_ENABLED=true`.
  - Multiple proxies (`https, http`) correctly resolve leftmost `https`.
  - `parseWindow('1h')` returns `3600000` ms.

---

## 3. Dual-Testing Teamwork Sign-Off

- **Agent Gate**: CI Run #41281116085 100% green across 33 test suites.
- **Physical Verification**: Lucas tested SuperLobster Transport Hub and login return pill live on `https://localhost:6565`.
