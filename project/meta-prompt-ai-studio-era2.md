# 🐚 ShellGuard — Era 2: The Distributed Reef & Mobile-First Fleet
### Master AI Studio Meta-Prompt Spine (Era 2: Phase 27+)

> **Era**: Era 2 — Distributed Sync, First-Class HTTPS Transport & Native Mobile Pairing  
> **Preceding Era**: Era 1 (Phases 1–26: The Bedrock & Web Vault) archived in [`.agents/internal/meta-prompt-ai-studio.md`](../.agents/internal/meta-prompt-ai-studio.md)  
> **Target Release Line**: `v0.0.2.9+`  
> **Authors**: Lucas & Antigravity  

---

## 🌊 Era 2 Architectural Thesis: The Mobile-First Inversion

In typical cloud vault architectures, mobile clients are second-class citizens retrofitted onto server-first designs. They struggle with self-signed TLS certificates on LANs, require fragile manual IP and fingerprint entry, and lack real-time synchronization.

**ShellGuard Era 2 inverts this paradigm.** The web server and native Android companion (`ShellGuard-Mobile`) operate as equal peers in a secure, sync-native relationship governed by **Four Cornerstones**:

1. **Cornerstone 1: The Reef Handshake (Zero-Touch CameraX Visual Pairing)**  
   The server generates an expressive vector pairing QR code encoding:  
   `shellguard://pair?v=1&lan=<url>&ts=<url>&fp=<sha256-hex>&ik=<instance-key-hex>&alias=<name>`  
   A single camera tap on the Android login screen securely ingests endpoints, extracts the certificate fingerprint, and pins the host identity.
2. **Cornerstone 2: The Instance Identity Anchor (Persistent Host Key & Self-Healing Proofs)**  
   `DATA_DIR/instance.key` stores a persistent EC P-256 host keypair that decouples certificate rotation from client trust. When leaf certificates rotate, the server signs an ECDSA rotation manifest (`certs/manifest.json`). Paired mobile clients verify rotation proofs and auto-heal pinned certificates silently without user friction.
3. **Cornerstone 3: Dual-Homed Network Mobility (LAN vs Tailscale Racing)**  
   Mobile clients dynamically race local LAN probes against Tailscale MagicDNS (`*.ts.net`), switching transports seamlessly and falling back to encrypted local Room/SQLCipher storage when offline.
4. **Cornerstone 4: Sync-Native Reactive River (Sub-50ms Real-Time Reconciliation)**  
   Authenticated Server-Sent Events stream (`GET /api/sync/events`) broadcasts real-time mutation markers (`{ domain, id, rev, action }`), keeping distributed clients in instant lockstep.

---

## 🧬 Required Specification Oracles for Era 2

Before executing any Era 2 stage, inspect the ground-truth specification genome in `project/`:
1. [`architecture.md`](./architecture.md) — §5 (Transport Security, The Reef Handshake, Instance Anchor, Dual-Homed Resolution, Reactive River).
2. [`key-hierarchy-spec.md`](./key-hierarchy-spec.md) — §1.4 (The Instance Identity Key `ik` / `instance.key`).
3. [`admin-suite-spec.md`](./admin-suite-spec.md) — §2, §4 (SuperLobster panel architecture, TLS endpoints & `TlsManagementTab`).
4. [`routes-and-contracts.md`](./routes-and-contracts.md) — §6 (Public TLS Manifest, Admin TLS Status/Generate, and Reactive River SSE wire contracts).
5. [`ui-ux-design-system.md`](./ui-ux-design-system.md) — §9 (SuperLobster Transport Hub, Bioluminescent Status Pills, and Vector SVG QR Card).
6. [`database-schema.md`](./database-schema.md) — §1 (DATA_DIR layout: `instance.key` mode `0o600` and `certs/manifest.json`).
7. Android Mobile Reference Corpus — `.agents/memory-bank/android/` (Application-Scoped Lazy DI, Room DAOs, KeyStore Enclave, RFC 6238 TOTP).

---

## 🌐 Stage 1 (Flagship): Phase 27 Prompt — SuperLobster TLS Control Plane, The Reef Handshake & Guided Mobile Pairing Hub [work-driven — provisional v0.0.2.9 (Build 31)]

> 🗺️ **Master Roadmap Reference**: See [`./ROADMAP-ERA2.md`](./ROADMAP-ERA2.md#phase-27-superlobster-tls-control-plane--guided-mobile-pairing-hub-work-driven-version--provisional-v0029-build-31)
> for complete specifications on **Task 53** and **Task 54**.
> **✅ Execution state**: SHIPPED 2026-10-28 (`v0.0.2.9 / Build 31`).
> 📚 **Documentation Impact**: Full 4-Zone Pre-Walked Documentation Suite:
> • `docs/deployment/https-tls.md` (NEW)
> • `docs/superlobster/transport.md` (NEW)
> • `docs/companion/pairing.md` (NEW)
> • `docs/.vitepress/config.ts` (sidebars & routes)
> • `docs/companion/index.md`, `security.md`, `sync-and-backups.md`
> • `docs/deployment/index.md`, `docker.md`, `unraid.md`
> • `ARCHITECTURE.md` §5 + Delta #32 · `ADMIN.md` §3.1 · `SECURITY.md` · `README.md` · `CHANGELOG.md`

Copy and paste this prompt to execute **Phase 27 (Tasks 53 & 54)** once green-lit:

```markdown
# PHASE 27 EXECUTION: SuperLobster TLS Control Plane & Guided Mobile Pairing Hub [v0.0.2.9 (Build 31)]

## 🎯 Objective
Transform ShellGuard's headless `tlsManager.ts` into a mobile-first transport control plane inside the SuperLobster panel (`/superlobster`). Implement the **Reef Handshake QR Pairing protocol** and the **Instance Identity Anchor** so Android mobile clients can pair in one camera tap and silently auto-heal through certificate rotations without developer friction. Execute a comprehensive **Walk-the-Docs** sweep across all 4 zones so documentation 100% bows to code.

## 📖 Reference Documentation & Roadmap
Before writing code, inspect:
- `project/architecture.md`: §5 (Transport Security & The Reef Handshake).
- `project/key-hierarchy-spec.md`: §1.4 (Instance Identity Key `ik`).
- `project/admin-suite-spec.md`: §2, §4 (SuperLobster panel architecture & admin routes).
- `project/routes-and-contracts.md`: §6 (TLS manifest & pairing endpoints).
- `project/ui-ux-design-system.md`: §9 (Transport indicators & QR vector container).
- `src/server/utils/tlsManager.ts`: Certificate generation, SAN IP collection, and fingerprint formatting.
- `server.ts`: Server startup, `TLS_ENABLED` evaluation, and port listening.
- `src/server/routes/admin.ts`: SuperLobster route authentication (`requireAdmin`) and audit logging.
- `ADMIN.md`: §3.1 (SuperLobster Panel scope) and §2 (Threat model).
- `.agents/workflows/walk-the-docs.md`: The 4 Documentation Zones.

Execute Phase 27 adhering strictly to the Strict 2-Task Pairing Law:

### Task 53: [Functionality] Instance Identity Key, Rotation Proof Engine & TLS Status API
- **Instance Identity Key (`src/server/utils/instanceKey.ts`)**:
  - Generate a persistent EC P-256 (`secp256r1`) keypair saved to `DATA_DIR/instance.key` with strict POSIX permissions `0o600`.
  - Persists across certificate regenerations; export public key in uncompressed hex format (`getInstancePublicKeyHex()`).
  - Provide signing function: `signWithInstanceKey(data: Buffer | string): string` (ECDSA-SHA256, DER-encoded hex).
- **Certificate Rotation Proof Engine (`src/server/utils/tlsManager.ts`)**:
  - Update `generateCertificate()` to produce a rotation manifest:
    `{ certFingerprint, timestamp, signature: signWithInstanceKey(certFingerprint + timestamp) }`.
  - Persist manifest to `DATA_DIR/certs/manifest.json`.
- **Public Proof & Admin Routes (`src/server/routes/admin.ts` & `src/server/routes/public.ts`)**:
  - `GET /api/public/tls-manifest`: Public unauthenticated endpoint returning `{ certFingerprint, instancePublicKey, timestamp, signature }`. Enables mobile clients to verify rotation proofs.
  - Return `X-ShellGuard-Rotation-Proof` HTTP response header containing the base64-encoded signed manifest.
  - `GET /api/admin/tls/status`: Returns current TLS state (`enabled`, `protocol`, `port`, `fingerprint`, `instancePublicKey`, `subjectAltNames`, `certExpiresAt`, `pairingUri`).
  - `POST /api/admin/tls/generate`: Triggers fresh certificate generation, signs new rotation proof, and returns updated pairing URI.
  - `GET /api/admin/tls/cert`: Streams public `cert.pem`. (Private `key.pem` and `instance.key` are strictly blocked from export).
- **Automated Verification**:
  - Author comprehensive integration suite `tests/tls-admin.test.ts` verifying:
    1. `instance.key` generated with mode 0o600 and immutable across cert regenerations.
    2. Public manifest returns valid ECDSA signature verifiable by instance public key.
    3. Certificate regeneration updates manifest signature without altering instance public key.
    4. Admin endpoints require admin token; private keys are never exportable via HTTP.

### Task 54: [UI Component & Walk-the-Docs] SuperLobster Transport Hub, Reef Handshake QR Modal & Full Documentation Parity
- **SuperLobster Control Plane UI (`src/client/views/admin/tabs/TlsManagementTab.tsx`)**:
  - Add "Transport & Mobile Pairing" section in the SuperLobster admin panel (`/superlobster`).
  - Real-time status indicators: display `🟢 Active HTTPS (TLS 1.3)` or `🟡 Cleartext HTTP (LAN Only)` badge, active port, and colon-delimited monospace SHA-256 certificate fingerprint with one-click copy.
  - **Reef Handshake Pairing Card**:
    - Embedded Vector SVG QR Code rendering the `shellguard://pair` URI schema:
      `shellguard://pair?v=1&lan=...&ts=...&fp=...&ik=...&alias=...`.
    - Dynamic Endpoint Badges: Visual chips for reachability vectors (`LAN IP: 192.168.x.x` and `Tailscale: *.ts.net`).
    - One-click "Copy Pairing String" with active toast feedback.
    - "Pair ShellGuard Mobile" instruction pill: *"Open ShellGuard Mobile → Tap Scan QR on login screen."*
  - **Action Toolbar**:
    - "Download Certificate (.pem)" button for public cert export.
    - "Regenerate Self-Signed Cert" button guarded by `ConfirmDialog` modal.
- **Systematic Documentation Walk Across All 4 Zones**:
  - **Zone 1 (Root Docs)**:
    - `ARCHITECTURE.md`: Expand Section §5 (Built-in TLS 1.3 engine, Reef Handshake URI, Instance Identity Anchor) and append Architectural Delta #32.
    - `ADMIN.md`: Update Section §3.1 table with TLS and mobile pairing capabilities, and document key immutability in §2 Threat Model.
    - `SECURITY.md`: Update Transport Security Matrix (LAN HTTPS + pinned certs) and document ECDSA rotation proof safe harbor.
    - `README.md`: Update feature highlights with Reef Handshake and add `TLS_ENABLED` configuration guidance.
    - `CHANGELOG.md`: Record Phase 27 deliverables under `## [Unreleased]`.
  - **Zone 2 (The Specs Genome)**:
    - Verify `project/` oracles bow 100% to implementation code.
  - **Zone 3 (Skills & Agent API)**:
    - Update `skills/shellguard/SKILL.md` and `docs/agent-integration/api-reference.md`.
  - **Zone 4 (VitePress Documentation Portal)**:
    - Author `docs/deployment/https-tls.md` ("First-Class HTTPS & Built-in TLS Engine").
    - Author `docs/superlobster/transport.md` ("Transport Control Plane & Mobile Pairing").
    - Author `docs/companion/pairing.md` ("The Reef Handshake & Visual Mobile Pairing").
    - Update `docs/.vitepress/config.ts` (add sidebars and navigation links for all three new pages).
    - Update `docs/companion/index.md`, `security.md`, and `sync-and-backups.md`.
    - Update `docs/deployment/index.md`.
- **Pre-Flight Verification Gates**:
  - `tests/unit/docsLinks.test.ts` (100% green, 0 broken links across VitePress portal).
  - `tests/unit/mermaidDiagrams.test.ts` (5/5 green).
  - `npm run docs:build` (compiles all 39+ pages cleanly).
  - `npm test`, `npm run lint`, and `npm run build` pass 100% green.

Verify that generating a certificate updates the displayed QR code and fingerprint, the public manifest returns a valid cryptographic signature under the instance key, paired mobile verification succeeds, and all tests and documentation gates pass!
```

---

## 🛡️ Stage 2: Phase 28 Prompt — 24-Envar Boot-Time Hardening, Operational Diagnostics & Sync-Native Reactive River [work-driven — provisional v0.0.3.0 (Build 32)]

> 🗺️ **Master Roadmap Reference**: See [`./ROADMAP-ERA2.md`](./ROADMAP-ERA2.md#phase-28-24-envar-boot-time-hardening-operational-diagnostics--sync-native-reactive-river-provisional-v0030-build-32)
> for complete specifications across **Sub-Phases 28.1, 28.2, 28.3, and 28.4** (**Tasks 55–62**, strictly 2 tasks per sub-phase).
> **⚠️ Execution state**: QUEUED — executes sub-phase by sub-phase using **Dual-Testing Teamwork**.
> **🤝 Dual-Testing Teamwork Protocol (Mandatory After Every Sub-Phase)**:
> 1. **Agent Role**: Executes all code edits, terminal commands, static typechecks (`npm run lint`), and automated test assertions for the sub-phase's 2 tasks.
> 2. **User Role (Lucas)**: Performs physical live verification in the running app / terminal against the sub-phase's Live Verification Checklist and explicitly signs off before advancing to the next sub-phase.
> 📚 **Documentation Impact**: `.env.example` · `Dockerfile` · `docker-entrypoint.sh` · `docs/deployment/docker.md`, `unraid.md`, `https-tls.md` · `docs/superlobster/transport.md` · `ARCHITECTURE.md` (Delta #33) · `ADMIN.md` · `SECURITY.md` · `CHANGELOG.md`

Copy and paste this prompt to execute **Phase 28 (Sub-Phases 28.1–28.4, Tasks 55–62)** sub-phase by sub-phase:

```markdown
# PHASE 28 EXECUTION: 24-Envar Boot-Time Hardening, Operational Diagnostics & Sync-Native Reactive River [v0.0.3.0 (Build 32)]

## 🎯 Objective
Harden all 24 ShellGuard environment variables across all 6 configuration groups against operator fat-fingers, container orchestrator quirks, silent security downgrades, and self-bricking edge cases, while delivering the Sync-Native Reactive River SSE stream (`GET /api/sync/events`). Execute in **4 sequential Sub-Phases (strictly 2 tasks per sub-phase)**. After completing each sub-phase, STOP and present the **Dual-Testing Teamwork Live Verification Checklist** so Lucas can physically test and sign off before proceeding to the next sub-phase.

---

## 🔐 Sub-Phase 28.1: Core Cryptography, Admin Plane & Identity Envar Hardening (Groups 1 & 5 Auth)

### Task 55: [Security Engine] Boot-Time Envar Validator, `DB_ENCRYPTION_KEY` Entropy Guard & `ADMIN_TOKEN` / `DISABLE_SIGNUPS` / `TOKEN_TTL_DEFAULT` Hardening
- **Central Boot Validator (`src/server/config/envValidator.ts`)**:
  - Run at startup before Express binds ports; collect structured boot warnings/errors and print a clear **Startup Security & Envar Diagnostic Banner** in `docker logs`.
- **`DB_ENCRYPTION_KEY` (`src/server/database/connection.ts` & `fieldEncryption.ts`)**:
  - Trim surrounding whitespace; accept both standard Base64 (`+/=`) and Base64URL (`-_`) alphabets.
  - Enforce decoded key entropy: `Buffer.from(key, 'base64').length >= 32` (256 bits). Reject short/weak strings that accidentally pass Base64 regex (e.g. `"password"` or `"true"`).
  - Before running `encryptExistingDatabase()` on `SQLITE_NOTADB`, inspect the first 16 bytes of the file on disk for the `"SQLite format 3\0"` magic header. If the file does NOT start with the plaintext SQLite header, throw an explicit `WRONG_DB_ENCRYPTION_KEY` error instead of attempting to rekey an already-encrypted database.
- **`ADMIN_TOKEN` (`src/server/middleware/requireAdmin.ts` & `admin.ts`)**:
  - Trim whitespace before checking length (`ADMIN_TOKEN.trim()`), preventing `"   "` in Unraid/Portainer forms from enabling SuperLobster with a blank password.
  - Reject weak or boolean-confused tokens (`length < 16` or literal `'true'`/`'false'`/`'admin'`/`'123456'`), keeping the panel disabled (`503`) and logging a prominent boot warning with `openssl rand -hex 24` guidance.
  - When `ADMIN_TOKEN` is unset, log an explicit notice in the startup banner so operators inspecting `docker logs` immediately see why `/superlobster` is sealed.
  - **Catch-22 Lockout Alert**: If `DISABLE_SIGNUPS=true` is set while `ADMIN_TOKEN` is unset (or invalid), print a high-visibility warning box in `docker logs` explaining that once Genesis User #1 hatches, User #2+ cannot be invited until `ADMIN_TOKEN` is configured.
- **`DISABLE_SIGNUPS` (`src/server/routes/auth.ts`, `public.ts` & `admin.ts`)**:
  - Normalize boolean parsing (`['true', '1', 'yes'].includes(val.trim().toLowerCase())`).
  - Include `envDisableSignups: boolean` in `GET /api/admin/settings` and `GET /api/admin/status` responses so the UI can detect environment-level signup lockdown.
- **`TOKEN_TTL_DEFAULT` (`src/server/utils/tokenExpiry.ts` & `auth.ts`)**:
  - Support `'w'` / `'week'` / `'weeks'` units in `calculateExpiry()`.
  - Guard against `Date` overflow (`RangeError: Invalid time value` on huge numbers) and validate `process.env.TOKEN_TTL_DEFAULT` at startup. If invalid (e.g. `"0"`, `"-5m"`, `"forever"`), log a boot warning and fall back to `'1440'` (24h) instead of crashing every `POST /api/auth/token` login with HTTP 500.
- **Automated Verification**:
  - Author `tests/unit/env-validator.test.ts` testing weak/whitespace `ADMIN_TOKEN`, short/Base64URL/wrong `DB_ENCRYPTION_KEY`, case-insensitive `DISABLE_SIGNUPS`, and invalid/overflow `TOKEN_TTL_DEFAULT` fallbacks.

### Task 56: [UI Component] SuperLobster Envar Override Indicators & Startup Banner Live Handshake
- **SuperLobster Settings Override Badge (`src/components/Admin/SuperLobsterPanel.tsx`)**:
  - When `envDisableSignups === true`, display a prominent `🔒 Enforced by DISABLE_SIGNUPS Environment Variable` badge next to the "Allow Public Signups" toggle and disable the switch so admins are never misled into thinking a DB toggle overrides the container envar.
- **SuperLobster Login Gate Guidance (`src/components/Admin/SuperLobsterLogin.tsx`)**:
  - Enhance the `panelDisabled` (`503`) amber notice with copyable `openssl rand -hex 24` generation instructions and explain that `ADMIN_TOKEN` must be at least 16 characters.
- **🤝 Dual-Testing Teamwork Gate 28.1 (STOP FOR USER SIGN-OFF)**:
  - **Agent**: Run `npm run lint` and verify `tests/unit/env-validator.test.ts` + terminal boot banner output.
  - **User (Lucas)**: Physically inspect the new Docker/terminal boot diagnostic banner, test `/superlobster` with unset/weak/valid `ADMIN_TOKEN`, and verify the `DISABLE_SIGNUPS` override badge in SuperLobster Settings. Sign off to proceed to Sub-Phase 28.2.

---

## 🌐 Sub-Phase 28.2: Network Topology, TLS Fallback Safety & Rate Limiter Hardening (Groups 2, 3 & 5 Rate Limiters)

### Task 57: [Network & TLS Engine] Fail-Safe TLS Fallback State, Proxy Hop Resolution, CORS Normalization & Rate Limiter Parser
- **Fail-Safe TLS State (`server.ts` & `src/server/middleware/httpsRedirect.ts`)**:
  - Track live `isTlsServerActive` runtime state in `server.ts`. If `TLS_ENABLED=true` fails to load certificates and falls back to plain HTTP, `httpsRedirect`, HSTS, and the `sg_admin_session` cookie `secure` flag check `isTlsServerActive || process.env.ENFORCE_HTTPS === 'true'`, preventing the server from `301`-redirecting all traffic to a dead HTTPS socket or locking out admin cookies over fallback HTTP.
  - Exempt `GET /api/health` from `httpsRedirect` so local container health probes always receive `200 OK` even when `ENFORCE_HTTPS=true`.
  - Parse comma-separated `X-Forwarded-Proto` headers (`req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https'`) for multi-proxy chains (e.g. Cloudflare -> Nginx -> ShellGuard).
  - Validate `HTTPS_PORT` (`1–65535`, default `443`).
- **BYO Certificate Parity (`src/server/routes/admin.ts` & `tlsManager.ts`)**:
  - Expose `isByoCert: boolean` and active `certPath` in `GET /api/admin/tls/status`.
  - Update `GET /api/admin/tls/cert` to stream the active `certPath` (supporting `TLS_CERT_PATH` BYO certificates instead of returning 404 when `DATA_DIR/certs/cert.pem` is absent).
  - Guard `POST /api/admin/tls/generate` to return `400 Bad Request` when `isByoCert === true` so admins don't accidentally overwrite a mounted Let's Encrypt / internal CA context with a self-signed leaf.
- **Host, Port, Proxy & CORS Hardening (`server.ts` & `src/config/corsConfig.ts`)**:
  - `PORT`: Parse and validate `1 <= port <= 65535` (falling back to `6565` / `6464` with a warning on `NaN` or out-of-range, and logging a privilege warning if `< 1024` when non-root).
  - `HOST`: Trim whitespace, fall back if empty string `""`, and strip accidental `http://` or `https://` prefixes with a boot warning.
  - `NODE_ENV`: Invert `corsConfig.ts` and `server.ts` frameguard check so **only** `NODE_ENV === 'development' || process.env.NODE_ENV === 'test'` activates permissive dev mode; typos like `NODE_ENV=prod` or `NODE_ENV=staging` remain strictly production-hardened.
  - `TRUST_PROXY`: Support both boolean (`'true'`, `'1'`) and explicit integer hop counts (`TRUST_PROXY=2` -> `app.set('trust proxy', 2)`).
  - `CORS_ORIGIN`: Strip trailing slashes from configured origins (`https://vault.domain.com/` -> `https://vault.domain.com`) and support wildcard `CORS_ORIGIN="*"` explicitly.
- **Rate Limiter Window & Ceiling Guards (`src/server/middleware/rateLimiter.ts`)**:
  - Expand `parseWindow()` to support `'h'` (hours) and `'d'` (days) in addition to `'m'`, `'s'`, and `'ms'` (fixing the bug where `AUTH_RATE_WINDOW="1h"` parsed as `1ms`).
  - Clamp `AUTH_RATE_LIMIT` and `API_RATE_LIMIT` so `0`, negative, or `NaN` values fall back to defaults (`10` and `100`) with a console warning instead of passing `max: 0` to `express-rate-limit` (which blocks 100% of API requests with HTTP 429).
- **Automated Verification**:
  - Author `tests/envar-network-tls.test.ts` verifying `/api/health` redirect exemption, multi-hop `X-Forwarded-Proto`, `parseWindow('1h') === 3600000`, `API_RATE_LIMIT=0` safe fallback, trailing-slash `CORS_ORIGIN` matching, and BYO cert guards.

### Task 58: [UI Component] SuperLobster Transport BYO-Cert Awareness & Runtime Environment Inspector
- **BYO Certificate Mode in Transport Hub (`src/components/Admin/TlsManagementTab.tsx`)**:
  - When `isByoCert === true`, render a `🛡️ Bring-Your-Own Certificate Active (TLS_CERT_PATH)` badge, disable the "Regenerate Self-Signed Cert" button with clear explanation, and allow downloading the active public certificate cleanly.
- **Runtime Environment & Guardrails Diagnostic Card (`src/components/Admin/SuperLobsterPanel.tsx`)**:
  - In the SuperLobster Status view, add a Reef Modernist **Environment & Guardrails Diagnostic Card** displaying active sanitized envar states (TLS mode, Proxy Trust config, CORS policy mode, Auth & API Rate Limiter windows/max, Storage Quotas, and any active boot warnings/fallbacks).
- **🤝 Dual-Testing Teamwork Gate 28.2 (STOP FOR USER SIGN-OFF)**:
  - **Agent**: Run `npm run lint`, execute `tests/envar-network-tls.test.ts`, and verify `/api/health` and rate-limiter headers via terminal probes.
  - **User (Lucas)**: Physically inspect the new Environment & Guardrails Diagnostic Card in `/superlobster`, verify BYO cert / Transport Hub controls, and sign off to proceed to Sub-Phase 28.3.

---

## 💾 Sub-Phase 28.3: Storage Quotas, Container Entrypoint (`PUID`/`PGID`), Build-Flag Guards & 4-Zone Docs Sync (Groups 4 & 6)

### Task 59: [Storage & Container Engine] `DATA_DIR` Sanitization, Quota Clamping, `docker-entrypoint.sh` `PGID` Fix & Dynamic `HEALTHCHECK`
- **`DATA_DIR` Sanitization (`src/server/database/connection.ts`)**:
  - Replace `process.env.DATA_DIR ?? ...` with `path.resolve(process.env.DATA_DIR?.trim() || defaultDataDir)` so `DATA_DIR=""` (empty string from blank Docker Compose variables) never calls `fs.mkdirSync("")` (`ENOENT` crash).
- **Container Entrypoint & Healthcheck (`docker-entrypoint.sh` & `Dockerfile`)**:
  - In `docker-entrypoint.sh`, fix the privilege remapping condition to check both UID and GID (`if [ "$(id -u)" = "0" ] && { [ "$TARGET_UID" != "1000" ] || [ "$TARGET_GID" != "1000" ]; }; then`) and validate that `TARGET_UID` and `TARGET_GID` are positive integers.
  - In `Dockerfile`, update `HEALTHCHECK` to use `localhost:${PORT:-6464}/api/health` instead of hardcoded `:6464` so custom `PORT` configurations in host-network containers stay healthy.
- **Attachment & Grotto Quota Clamping (`src/server/routes/attachments.ts`)**:
  - Clamp `ATTACHMENT_MAX_MB` (`1–2000` MB) and `GROTTO_QUOTA_MB` (`1–100000` MB) so negative values (`-1`) or `NaN` never corrupt Busboy `fileSize` limits or exceed Node's 2GB `Buffer.constants.MAX_LENGTH`.
  - Log a boot warning if `ATTACHMENT_MAX_MB > GROTTO_QUOTA_MB`.
  - Add a pre-stream `Content-Length` header check against `MAX_ATTACHMENT_BYTES` and remaining `GROTTO_QUOTA_BYTES` at the start of `POST /api/attachments` so oversized uploads are rejected with `413 Payload Too Large` immediately before streaming gigabytes into memory.
- **Build-Time `VITE_*` Runtime Detection (`src/server/config/envValidator.ts`)**:
  - If `VITE_API_URL` or `VITE_SHELLCRYPTION_ENABLED` is set in `process.env` when `NODE_ENV=production`, log a clear note in the startup banner explaining that `VITE_*` variables are compiled into the frontend bundle at build time (`npm run build`), not read dynamically by the pre-built container at runtime.
  - Ensure `attachmentUtils.ts` respects `VITE_SHELLCRYPTION_ENABLED=false` consistently with `shellCryption.ts`.
- **Automated Verification**:
  - Author unit/integration tests in `tests/envar-storage-quotas.test.ts` verifying negative/zero quota clamping, pre-stream `Content-Length` 413 rejection, and `DATA_DIR=""` fallback safety.

### Task 60: [UI Component & Walk-the-Docs] Client Plaintext Warning Banner, Complete 24-Envar Reference Catalog & 4-Zone Docs Sync
- **Client Plaintext Warning Banner (`src/components/Layout/Header.tsx` & `VaultShell.tsx`)**:
  - When `import.meta.env.VITE_SHELLCRYPTION_ENABLED === 'false'`, render a persistent high-contrast red security banner across the top of the vault (`⚠️ ZERO-KNOWLEDGE DISABLED (VITE_SHELLCRYPTION_ENABLED=false) — Vault secrets are not encrypted client-side`).
- **4-Zone Documentation Synchronization**:
  - Update `.env.example` (fix `HTTPS_PORT=443` default, document `DISABLE_SIGNUPS`, `PUID`/`PGID`, and minimum key length rules).
  - Update `docs/deployment/docker.md`, `docs/deployment/unraid.md`, `docs/deployment/https-tls.md`, `ADMIN.md`, `SECURITY.md`, and `ARCHITECTURE.md` (Delta #33) with the complete 24-Envar Reference Table, validation rules, and boot diagnostic banner documentation.
- **🤝 Dual-Testing Teamwork Gate 28.3 (STOP FOR USER SIGN-OFF)**:
  - **Agent**: Run `npm run lint`, `tests/unit/docsLinks.test.ts`, `tests/unit/mermaidDiagrams.test.ts`, and `tests/envar-storage-quotas.test.ts`.
  - **User (Lucas)**: Physically verify attachment pre-flight quota behavior, inspect the updated `.env.example` and documentation tables, and sign off to proceed to Sub-Phase 28.4.

---

## ⚡ Sub-Phase 28.4: Sync-Native Reactive River — Authenticated SSE Stream & Sub-50ms Mutation Reconciliation

### Task 61: [Functionality] Authenticated SSE Stream Engine, Mutation Event Bus & Revision Tracking
- **Reactive River Event Bus (`src/server/utils/reactiveRiver.ts` & `src/server/routes/sync.ts`)**:
  - Implement `GET /api/sync/events` protected by user session or agent token (`requireAuth`).
  - Wire vault mutation routes (`vault.ts`, `notes.ts`, `sshKeys.ts`, `attachments.ts`) into an in-process `EventEmitter` scoped by `owner_uuid`, broadcasting `{ domain, id, rev, action, timestamp }` within `<50ms` of SQLite commit.
  - Maintain a bounded ring buffer per `owner_uuid` supporting `Last-Event-ID` cursor replay on short disconnects, and emit periodic `: heartbeat` comments every 25s to keep reverse-proxy/Tailscale sockets warm.
  - Set `X-Accel-Buffering: no` and `Cache-Control: no-cache, no-transform` headers so Nginx/Cloudflare proxies never buffer SSE frames.
- **Automated Verification**:
  - Author `tests/sync-events.test.ts` verifying authenticated SSE connection, strict `owner_uuid` isolation (User A never receives User B's mutation events), `<50ms` event delivery on pearl/note/key CRUD, and `Last-Event-ID` catch-up replay.

### Task 62: [UI Component] Live River Connection Indicator & Reactive State Reconciliation
- **Client Reactive River Hook (`src/hooks/useReactiveRiver.ts` & `src/components/Layout/Header.tsx`)**:
  - Subscribe to `/api/sync/events` when the vault is unlocked; automatically close the stream on vault lock or logout.
  - Render a subtle bioluminescent connection status pill (`🟢 River Connected` / `🟡 Reconnecting…`) in the dashboard header.
  - Upon receiving a mutation event from another tab, mobile device, or LobsterKey agent, fetch/decrypt the affected domain record in the background and reconcile `vaultItems` in-memory without losing the user's active item selection, scroll position, or modal focus.
- **🤝 Dual-Testing Teamwork Gate 28.4 (FINAL PHASE 28 SIGN-OFF)**:
  - **Agent**: Run `npm run lint`, push branch to origin, and tail the full cloud verification run on GitHub Actions (`gh run watch`) until all Vitest suites, Vite build, and `docs:build` pass 100% green.
  - **User (Lucas)**: Open two browser sessions side-by-side (or mutate via a LobsterKey agent in terminal), physically verify the `🟢 River Connected` status pill and instant `<50ms` live item synchronization across tabs without page reload, and give final sign-off for Phase 28!
```

---

## 🌊 Era 2 Active Forward Queue

The roadmap for Era 2 extends from the mobile pairing control plane into a fully distributed multi-device fleet:

- **Stage 1 (Phase 27)**: SuperLobster TLS Control Plane & Guided Mobile Pairing Hub (`v0.0.2.9 / Build 31`) ✅
- **Stage 2 (Phase 28)**: 24-Envar Boot-Time Hardening, Operational Diagnostics & Sync-Native Reactive River (`v0.0.3.0 / Build 32`) — Sub-Phases 28.1, 28.2, 28.3 & 28.4 (Tasks 55–62)
- **Stage 3 (Phase 29)**: Dual-Homed Network Resolution Engine — Client-Side Latency Probing & Tailscale MagicDNS Mesh Integration (`v0.0.3.1 / Build 33`)
- **Stage 4 (Phase 30)**: Offline Encrypted Delta Journal — Room + SQLCipher Sync Queue & Bi-Directional Conflict Resolution (`v0.0.3.2 / Build 34`)
- **Stage 5 (Phase 31)**: Android Hardware Enclave Anchoring — Android StrongBox / TEE KeyStore & Biometric Hardware Gateways (`v0.0.3.3 / Build 35`)
- **Stage 6 (Phase 32)**: P2P Multi-Reef Mesh — Distributed Grotto Sync Across Independent Nodes (`v0.0.3.4 / Build 36`)

