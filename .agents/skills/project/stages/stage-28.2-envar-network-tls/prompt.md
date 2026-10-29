# 🌐 Stage 28.2 Execution Prompt — Network Topology, TLS Fallback Safety & Rate Limiter Hardening (Groups 2, 3 & 5 Rate Limiters)

> **Milestone**: `v0.0.3.0 (Build 32)` — Phase 28, Sub-Phase 28.2 (Tasks 57 & 58)  
> **Execution Law**: Strict 2-Task Pairing + **Dual-Testing Teamwork Gate 28.2** (Agent executes code/lint/tests $\rightarrow$ User performs live physical verification and signs off before advancing to Sub-Phase 28.3).

---

## 📖 Context & Spec Oracles (Read First)

Before writing code, inspect:
- [`.agents/skills/project/specs/architecture/architecture.md`](../../specs/architecture/architecture.md): §5 (Transport Security — Native LAN TLS, 3-tier material resolution).
- [`.agents/skills/project/specs/network/routes-and-contracts.md`](../../specs/network/routes-and-contracts.md): §6 (Admin TLS Status, Regeneration & Certificate Download).
- [`.agents/skills/project/specs/admin/admin-suite-spec.md`](../../specs/admin/admin-suite-spec.md): §2–§4 (SuperLobster API & `TlsManagementTab`).
- [`.agents/skills/project/modules/07-superlobster-admin/02-transport-and-mobile-pairing/spec.md`](../../modules/07-superlobster-admin/02-transport-and-mobile-pairing/spec.md): Transport & Mobile Pairing Hub.

---

## 🛠️ Execution Tasks (Strict 2-Task Pairing)

### Task 57: [Network & TLS Engine] Fail-Safe TLS Fallback State, Proxy Hop Resolution, CORS Normalization & Rate Limiter Parser

- **Fail-Safe TLS State (`server.ts` & `src/server/middleware/httpsRedirect.ts`)**:
  - Track live `isTlsServerActive` runtime state in `server.ts`. If `TLS_ENABLED=true` fails to load certificates and falls back to plain HTTP, `httpsRedirect`, HSTS, and the `sg_admin_session` cookie `secure` flag check `isTlsServerActive || process.env.ENFORCE_HTTPS === 'true'`, preventing the server from `301`-redirecting all traffic to a dead HTTPS socket or locking out admin cookies over fallback HTTP.
  - Exempt `GET /api/health` from `httpsRedirect` so local container health probes always receive `200 OK` even when `ENFORCE_HTTPS=true`.
  - Parse comma-separated `X-Forwarded-Proto` headers (`req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https'`) for multi-proxy chains (e.g., Cloudflare $\rightarrow$ Nginx $\rightarrow$ ShellGuard).
  - Validate `HTTPS_PORT` (`1–65535`, default `443`).
- **BYO Certificate Parity (`src/server/routes/admin.ts` & `src/server/utils/tlsManager.ts`)**:
  - Expose `isByoCert: boolean` and active `certPath` in `GET /api/admin/tls/status`.
  - Update `GET /api/admin/tls/cert` to stream the active `certPath` (supporting `TLS_CERT_PATH` BYO certificates instead of returning 404 when `DATA_DIR/certs/cert.pem` is absent).
  - Guard `POST /api/admin/tls/generate` to return `400 Bad Request` when `isByoCert === true` so admins don't accidentally overwrite a mounted Let's Encrypt / internal CA context with a self-signed leaf.
- **Host, Port, Proxy & CORS Hardening (`server.ts` & `src/config/corsConfig.ts`)**:
  - `PORT`: Parse and validate `1 <= port <= 65535` (falling back to `6565` / `6464` with a warning on `NaN` or out-of-range, and logging a privilege warning if `< 1024` when non-root).
  - `HOST`: Trim whitespace, fall back if empty string `""`, and strip accidental `http://` or `https://` prefixes with a boot warning.
  - `NODE_ENV`: Invert `corsConfig.ts` and `server.ts` frameguard check so **only** `NODE_ENV === 'development' || process.env.NODE_ENV === 'test'` activates permissive dev mode; typos like `NODE_ENV=prod` or `NODE_ENV=staging` remain strictly production-hardened.
  - `TRUST_PROXY`: Support both boolean (`'true'`, `'1'`) and explicit integer hop counts (`TRUST_PROXY=2` $\rightarrow$ `app.set('trust proxy', 2)`).
  - `CORS_ORIGIN`: Strip trailing slashes from configured origins (`https://vault.domain.com/` $\rightarrow$ `https://vault.domain.com`) and support wildcard `CORS_ORIGIN="*"` explicitly.
- **Rate Limiter Window & Ceiling Guards (`src/server/middleware/rateLimiter.ts`)**:
  - Expand `parseWindow()` to support `'h'` (hours) and `'d'` (days) in addition to `'m'`, `'s'`, and `'ms'` (fixing the bug where `AUTH_RATE_WINDOW="1h"` parsed as `1ms`).
  - Clamp `AUTH_RATE_LIMIT` and `API_RATE_LIMIT` so `0`, negative, or `NaN` values fall back to defaults (`10` and `100`) with a console warning instead of passing `max: 0` to `express-rate-limit` (which blocks 100% of API requests with HTTP 429).
- **Automated Verification**:
  - Author `tests/envar-network-tls.test.ts` verifying `/api/health` redirect exemption, multi-hop `X-Forwarded-Proto`, `parseWindow('1h') === 3600000`, `API_RATE_LIMIT=0` safe fallback, trailing-slash `CORS_ORIGIN` matching, and BYO cert guards.

### Task 58: [UI Component] SuperLobster Transport BYO-Cert Awareness & Runtime Environment Inspector

- **BYO Certificate Mode in Transport Hub (`src/components/admin/TlsManagementTab.tsx`)**:
  - When `isByoCert === true`, render a `🛡️ Bring-Your-Own Certificate Active (TLS_CERT_PATH)` badge, disable the "Regenerate Self-Signed Cert" button with clear explanation, and allow downloading the active public certificate cleanly.
- **Runtime Environment & Guardrails Diagnostic Card (`src/components/admin/SuperLobsterPanel.tsx` / `SuperLobsterStatus.tsx`)**:
  - In the SuperLobster Status view, add a Reef Modernist **Environment & Guardrails Diagnostic Card** displaying active sanitized envar states (TLS mode, Proxy Trust config, CORS policy mode, Auth & API Rate Limiter windows/max, Storage Quotas, and any active boot warnings/fallbacks).

---

## 🤝 Dual-Testing Teamwork Gate 28.2 (MANDATORY STOP FOR USER SIGN-OFF)

- **Agent Role**: Run `npm run lint`, execute `tests/envar-network-tls.test.ts`, and verify `/api/health` and rate-limiter headers via terminal probes.
- **User Role (Lucas)**:
  1. Physically inspect the new **Environment & Guardrails Diagnostic Card** in `/superlobster`.
  2. Verify BYO cert / Transport Hub controls in `TlsManagementTab`.
  3. Explicitly sign off before advancing to [`stage-28.3-envar-storage-container`](../stage-28.3-envar-storage-container/prompt.md).
