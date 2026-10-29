---
roadmap_version: 3.0.0-era2
last_updated: 2026-10-28
current_position: "Phase 27 (v0.0.2.9 / Build 31) shipped; next up: Phase 28: 24-Envar Boot-Time Hardening, Operational Diagnostics & Sync-Native Reactive River (provisional v0.0.3.0 / Build 32, Sub-Phases 28.1–28.4)"
statistics:
  description: "Deterministic build roadmap for ShellGuard Era 2 (The Distributed Reef & Mobile-First Fleet). Engineered strictly in synergistic 2-task phases where Task A delivers core functionality/security and Task B delivers the corresponding UI/interactive component and documentation walk."
  era: "Era 2 — Distributed Sync & Mobile-First Fleet (Phase 27+)"
  preceding_era: "Era 1 (Phases 1–26) archived in .agents/internal/ROADMAP.md"
---

# 🛡️ ShellGuard©™ Roadmap — Era 2: The Distributed Reef & Mobile-First Fleet

*Where the reef expands across networks and devices.*

> **ERA 2 TRANSITION SPECIFICATION**  
> *Preceding Era 1 (Phases 1 through 26: The Bedrock & Web Vault) is fully documented and archived in [`.agents/internal/ROADMAP.md`](../.agents/internal/ROADMAP.md).*  
> *Era 2 commences upon the completion of Phase 26 (Import Lifecycle Tracking & Ephemeral Quarantine).*

---

### 🏷️ Work-Driven Versioning Policy: `MAJOR.MINOR.PATCH.REVISION` (`X.Y.Z.N`)

- **Era 2 Launch Milestone**: `v0.0.2.9 (Build 31)` (Phase 27) ✅
- **Next Planned Milestone**: `v0.0.3.0 (Build 32)` (Phase 28)
- **Version Grammar**: Every release increments REVISION or PATCH based on structural gravity.
- **Strict 2-Task Pairing Law**: Every phase (and sub-phase) consists strictly of **Task A [Functionality / Security Engine]** followed immediately by **Task B [UI Component / Interactive State + Walk-the-Docs Verification]**.
- **Rolling Window Discipline**: Preserves the Active Forward Queue and the 3 most recent completed phases.

---

## 🌊 Queue — Active Forward Phases (Era 2 Molts)

### Phase 27: SuperLobster TLS Control Plane & Guided Mobile Pairing Hub [v0.0.2.9 (Build 31)] ✅

> Phase Feature Set Overview:
> Inverts traditional server-first designs into a seamless, mobile-first transport relationship.
> Introduces the persistent Instance Identity Key (`instance.key`) and the Reef Handshake QR Pairing
> protocol inside the SuperLobster control plane (`/superlobster`). Mobile clients ingest endpoints,
> pin certificates, and silently auto-heal across certificate rotations via ECDSA rotation proof manifests.
> Features a complete 4-Zone Walk-the-Docs sweep ensuring documentation 100% bows to code.
> *(Source: Lucas, 2026-10-11 — First-class HTTPS transport & mobile sync architectural inversion pass.)*

> 📚 **Documentation Impact**: docs/deployment/https-tls.md (NEW) · docs/superlobster/transport.md (NEW) · docs/companion/pairing.md (NEW) · docs/.vitepress/config.ts · docs/companion/index.md, security.md, sync-and-backups.md · docs/deployment/index.md · ARCHITECTURE.md §5 + Delta #32 · ADMIN.md §3.1 · SECURITY.md · README.md · CHANGELOG.md

- [x] **Task 53: [Functionality] Instance Identity Key, Rotation Proof Engine & TLS Status API**

Description: Establish persistent host identity and rotation proof verification.
(1) Instance Identity Key: Generate persistent EC P-256 keypair saved to `DATA_DIR/instance.key` (POSIX mode `0o600`),
immutable across certificate regenerations. Export public key in uncompressed hex format (`getInstancePublicKeyHex()`).
(2) Rotation Proof Engine: Update `tlsManager.ts` to generate rotation manifest `{ certFingerprint, timestamp, signature: signWithInstanceKey(certFingerprint + timestamp) }`
and persist to `DATA_DIR/certs/manifest.json`.
(3) Public Proof & Admin Routes: Expose public unauthenticated `GET /api/public/tls-manifest` and `X-ShellGuard-Rotation-Proof`
header. Implement authenticated admin endpoints: `GET /api/admin/tls/status` (current TLS state, port, SANs, fingerprint,
pairing URI), `POST /api/admin/tls/generate` (regenerate leaf cert and update rotation manifest), and `GET /api/admin/tls/cert`
(stream public `cert.pem`; strictly block private key export).
(4) Unit & integration tests in `tests/tls-admin.test.ts`.

> Success Criteria: Public manifest returns valid ECDSA signature verifiable by instance public key; leaf certificate
> regenerations produce updated signed manifests without changing the instance key; admin endpoints require admin token;
> private keys are never exportable; full test oracle + `tsc` + build pass 100% green.

- [x] **Task 54: [UI Component & Walk-the-Docs] SuperLobster Transport Hub, Reef Handshake QR Modal & Full Documentation Parity**

Description: Deliver the transport management surface in SuperLobster and complete full documentation parity across all 4 zones.
(1) `TlsManagementTab.tsx`: Add "Transport & Mobile Pairing" tab in the SuperLobster panel.
(2) Real-time status indicators: display `🟢 Active HTTPS (TLS 1.3)` or `🟡 Cleartext HTTP (LAN Only)` badge, active port,
and colon-delimited monospace SHA-256 certificate fingerprint with one-click copy.
(3) Reef Handshake Pairing Card: Render embedded vector SVG QR code encoding `shellguard://pair?v=1&lan=...&ts=...&fp=...&ik=...&alias=...`.
Include visual chips for reachability vectors (`LAN IP` and `Tailscale`), one-click "Copy Pairing String", and mobile scan instruction pill.
(4) Action Toolbar: "Download Certificate (.pem)" button and "Regenerate Self-Signed Cert" button guarded by `ConfirmDialog`.
(5) Systematic Walk-the-Docs Sweep:
  - Author `docs/deployment/https-tls.md` (Native HTTPS Transport & Self-Signed Engine).
  - Author `docs/superlobster/transport.md` (Transport Control Plane & Guided Mobile Pairing).
  - Author `docs/companion/pairing.md` (The Reef Handshake & Visual Mobile Pairing).
  - Update `docs/.vitepress/config.ts` (sidebars & navigation routes).
  - Update `docs/companion/index.md`, `security.md`, and `sync-and-backups.md`.
  - Update root `ARCHITECTURE.md` (§5 rewrite + Delta #32), `ADMIN.md`, `SECURITY.md`, `README.md`, and `CHANGELOG.md`.

> Success Criteria: QR code dynamically renders valid `shellguard://pair` URI; regenerating certificate updates the displayed
> fingerprint and QR code instantly; certificate download delivers public PEM cleanly; all new and updated docs compile with 0 broken links;
> full test oracle + `tsc` + build pass 100% green.

---

### Phase 28: 24-Envar Boot-Time Hardening, Operational Diagnostics & Sync-Native Reactive River [provisional v0.0.3.0 (Build 32)]

> Phase Feature Set Overview:
> Hardens all 24 ShellGuard environment variables across all 6 configuration groups against operator fat-fingers,
> container orchestrator quirks, silent security downgrades, and self-bricking edge cases, while delivering the
> Sync-Native Reactive River authenticated Server-Sent Events stream (`GET /api/sync/events`) for sub-50ms cross-device
> mutation reconciliation. Executed sequentially in 4 Sub-Phases (strictly 2 tasks per sub-phase) governed by
> **Dual-Testing Teamwork** (Agent executes terminal/code/test gates -> User performs live physical verification and sign-off before advancing).

- **Sub-Phase 28.1: Core Cryptography, Admin Plane & Identity Envar Hardening (Groups 1 & 5 Auth)**
  - [ ] **Task 55: [Security Engine] Boot-Time Envar Validator, `DB_ENCRYPTION_KEY` Entropy Guard & `ADMIN_TOKEN` / `DISABLE_SIGNUPS` / `TOKEN_TTL_DEFAULT` Hardening**
    Description: Implement `src/server/config/envValidator.ts` and startup diagnostic banner in `docker logs`. Trim and validate `DB_ENCRYPTION_KEY` (Base64 & Base64URL, decoded $\ge 32$ bytes, and 16-byte SQLite header magic-byte check before rekey migration). Trim `ADMIN_TOKEN` and reject weak/boolean-confused values ($< 16$ chars or `'true'`/`'admin'`), logging a Catch-22 lockout alert if `DISABLE_SIGNUPS=true` while `ADMIN_TOKEN` is unset. Normalize `DISABLE_SIGNUPS` case-insensitively and expose `envDisableSignups` in `/api/admin/settings`. Validate `TOKEN_TTL_DEFAULT` at startup (adding `'w'` weeks support and safe `'1440'` fallback on invalid/overflow values). Prove in `tests/unit/env-validator.test.ts`.
  - [ ] **Task 56: [UI Component] SuperLobster Envar Override Indicators & Startup Banner Live Handshake**
    Description: Display `🔒 Enforced by DISABLE_SIGNUPS Environment Variable` badge and disable the DB toggle in `SuperLobsterPanel.tsx` when overridden by env. Enhance `SuperLobsterLogin.tsx` `panelDisabled` notice with `openssl rand -hex 24` guidance. Stop for **Dual-Testing Teamwork Gate 28.1** user sign-off.

- **Sub-Phase 28.2: Network Topology, TLS Fallback Safety & Rate Limiter Hardening (Groups 2, 3 & 5 Rate Limiters)**
  - [ ] **Task 57: [Network & TLS Engine] Fail-Safe TLS Fallback State, Proxy Hop Resolution, CORS Normalization & Rate Limiter Parser**
    Description: Track live `isTlsServerActive` state so `TLS_ENABLED=true` fallback to HTTP never triggers `httpsRedirect` 301 loops or `Secure` cookie lockouts. Exempt `/api/health` from `httpsRedirect` and parse comma-separated `X-Forwarded-Proto`. Support BYO certificates in `/api/admin/tls/cert` and block self-signed overwrite when BYO certs are active. Harden `PORT`, `HOST`, `NODE_ENV` (strict production default unless `'development'`/`'test'`), `TRUST_PROXY` (hop counts), and `CORS_ORIGIN` (strip trailing slashes, support `'*'`). Add `'h'`/`'d'` units to `parseWindow()` (fixing `"1h" -> 1ms`) and clamp `AUTH_RATE_LIMIT` / `API_RATE_LIMIT` (`0`/negative fallback instead of HTTP 429 lockout). Prove in `tests/envar-network-tls.test.ts`.
  - [ ] **Task 58: [UI Component] SuperLobster Transport BYO-Cert Awareness & Runtime Environment Inspector**
    Description: Render BYO Certificate read-only badge and guard regeneration in `TlsManagementTab.tsx`. Add **Environment & Guardrails Diagnostic Card** in `SuperLobsterPanel.tsx` displaying active sanitized configuration and boot warnings. Stop for **Dual-Testing Teamwork Gate 28.2** user sign-off.

- **Sub-Phase 28.3: Storage Quotas, Container Entrypoint (`PUID`/`PGID`), Build-Flag Guards & 4-Zone Docs Sync (Groups 4 & 6)**
  - [ ] **Task 59: [Storage & Container Engine] `DATA_DIR` Sanitization, Quota Clamping, `docker-entrypoint.sh` `PGID` Fix & Dynamic `HEALTHCHECK`**
    Description: Sanitize empty `DATA_DIR=""` via `path.resolve()`. Fix `docker-entrypoint.sh` to remap when either `PUID != 1000` or `PGID != 1000`, and update `Dockerfile` `HEALTHCHECK` to use `${PORT:-6464}`. Clamp `ATTACHMENT_MAX_MB` and `GROTTO_QUOTA_MB` to positive bounds, warn when `ATTACHMENT_MAX_MB > GROTTO_QUOTA_MB`, and perform pre-stream `Content-Length` quota checks in `POST /api/attachments`. Warn at boot if `VITE_*` build flags are passed at container runtime. Prove in `tests/envar-storage-quotas.test.ts`.
  - [ ] **Task 60: [UI Component & Walk-the-Docs] Client Plaintext Warning Banner, Complete 24-Envar Reference Catalog & 4-Zone Docs Sync**
    Description: Render persistent red warning banner when `VITE_SHELLCRYPTION_ENABLED === 'false'`. Synchronize `.env.example` (`HTTPS_PORT=443`), `docs/deployment/{docker,unraid,https-tls}.md`, `ADMIN.md`, `SECURITY.md`, and `ARCHITECTURE.md` (Delta #33). Stop for **Dual-Testing Teamwork Gate 28.3** user sign-off.

- **Sub-Phase 28.4: Sync-Native Reactive River — Authenticated SSE Stream & Sub-50ms Mutation Reconciliation**
  - [ ] **Task 61: [Functionality] Authenticated SSE Stream Engine, Mutation Event Bus & Revision Tracking**
    Description: Implement `GET /api/sync/events` protected by user session or agent token. Wire SQLite mutation hooks into an in-process `EventEmitter` scoped by `owner_uuid` broadcasting `{ domain, id, rev, action, timestamp }`. Support reconnects with `Last-Event-ID` cursor recovery and 25s heartbeats. Prove in `tests/sync-events.test.ts`.
  - [ ] **Task 62: [UI Component] Live River Connection Indicator & Reactive State Reconciliation**
    Description: Build `useReactiveRiver` hook subscribing to `/api/sync/events`. Render subtle bioluminescent connection status pill (`🟢 River Connected`) in dashboard header and reconcile mutated items in-memory without losing active pane selection or focus. Stop for **Dual-Testing Teamwork Gate 28.4** final user sign-off.

---

### Phase 29: Dual-Homed Network Resolution Engine & MagicDNS Mesh [provisional v0.0.3.1 (Build 33)]

> Phase Feature Set Overview:
> Bridges local LAN and Tailscale MagicDNS into a unified transport layer. Clients dynamically race LAN vs Tailscale
> endpoints and seamlessly migrate between local WiFi and remote cellular connections without session loss.

- [ ] **Task 63: [Functionality] Client-Side Latency Probing & Tailscale MagicDNS Resolver**
  Description: Implement adaptive network prober testing LAN (`192.168.x.x`) against Tailscale (`*.ts.net`). Auto-route requests through the lowest latency vector, with automated failover and backoff.

- [ ] **Task 64: [UI Component] Transport Health Diagnostics Drawer & Manual Network Overrides**
  Description: Build Transport Diagnostics drawer in settings displaying active connection vector, latency graphs (ms), and manual transport pinning overrides.

---

### Phase 30: Offline Encrypted Delta Journal & Conflict Resolution [provisional v0.0.3.2 (Build 34)]

> Phase Feature Set Overview:
> Empowers mobile clients to make full offline mutations securely stored in local Room + SQLCipher databases,
> seamlessly playing back delta journals upon network reconnection with deterministic conflict resolution.

- [ ] **Task 65: [Functionality] Room + SQLCipher Sync Queue & Bi-Directional Delta Journal**
  Description: SQLite `sync_queue` table queuing offline writes. On reconnect, stream pending deltas to server, resolve timestamp and vector-clock conflicts, and reconcile remote changes.

- [ ] **Task 66: [UI Component] Conflict Review Dialog & Sync Queue Inspector**
  Description: Build visual conflict resolution modal highlighting diffs when concurrent edits occur, allowing users to choose winning fields or merge changes safely.

---

## 🔬 Queue — Backlog & Distant Shores (Era 2 Vision)

- [ ] **Phase 31: P2P Direct Reef Sync** — Multi-master grotto synchronization across independent ShellGuard nodes without a central broker.
- [ ] **Phase 32: Hardware Enclave Deep Anchoring** — Android StrongBox / Apple Secure Enclave hardware binding with WebAuthn PRF extensions.
