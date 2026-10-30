# 🦞 ShellGuard — Release v0.0.2.9 (Build 31)
> **"Zero-Command TLS, The Reef Handshake & Decoupled Share Signups"** — Phase 27: Native Zero-Command TLS, Self-Signed Certificate Authority, Dynamic Context Hot-Reloading, SuperLobster Transport Hub, QR Code Pairing, Ephemeral Share Invites & Atomic One-Time Burn Token Engine

```text
███████╗██╗   ██╗███████╗ ██╗     ██╗        ██████╗    ██╗   ██╗   █████╗    ██████╗    ██████╗ 
██╔════╝██║   ██║██╔════╝ ██║     ██║        ██╔═══╝    ██║   ██║  ██╔══██╗  ██╔══██╗    ██╔═══██╗
███████╗███████║ █████╗   ██║     ██║        ██║ ███╗   ██║   ██║  ███████║  ██████╔╝    ██║   ██║
╚════██║██╔══██║██╔══╝   ██║     ██║        ██║  ██║   ██║   ██║  ██╔══██║  ██╔══██╗    ██║   ██║
███████║██║   ██║███████╗ ███████╗███████╗   ╚██████╝   ╚██████╝   ██║  ██║  ██║   ██║   ██████╔╝
╚══════╝╚═╝   ╚═╝╚══════╝ ╚══════╝╚══════╝    ╚═════╝    ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═╝   ╚═════╝ 
                                              ~ **ClawStack Studios©™** ~
```

---

## 🚀 The Core Summary

Welcome to **v0.0.2.9 (Build 31)** of **ShellGuard**! This milestone completes **Phase 27 (Stage 28)**, introducing native **Zero-Command TLS & Self-Signed CA**, the **SuperLobster Transport Hub & Reef Handshake**, and **Decoupled Share Signups with Atomic Token Burn**.

Deploying a self-hosted secrets vault on LAN, homelab, or private VPS environments no longer requires orchestrating complex external reverse proxies (Nginx, Traefik, Caddy) or running manual OpenSSL incantations. When `TLS_ENABLED=true` is set, ShellGuard automatically generates an ECDSA (`prime256v1`) certificate keypair and self-signed Certificate Authority on first boot, persisting valid certificates in `certs/` with multi-domain Subject Alternative Name (SAN) support (`localhost`, `127.0.0.1`, LAN IPs, and custom domains). The server mounts a dual-listener architecture with automated HTTP-to-HTTPS redirection (`80 -> 443`, or configurable port offsets). In the Admin Panel, administrators can monitor live cryptographic transport status, verify SHA-256 certificate fingerprints, and trigger **Dynamic In-Memory Context Hot-Reloading** via `POST /api/admin/tls/regenerate` without terminating active WebSocket streams or rebooting the server.

Furthermore, user onboarding has been reimagined with **The Reef Handshake**: administrators can generate 15-minute ephemeral invite codes (`tok_<uuid>`), copy one-click decoupled share URLs, and present bioluminescent QR codes for instant mobile camera pairing. When an invited guest arrives via an invite link (`https://.../?invite=tok_...`), the Landing Gateway auto-detects the token, scrubs the query param from the browser address bar to protect against shoulder-surfing, locks out uninvited registration forms, and executes an **Atomic One-Time Burn** in SQLite upon account creation—guaranteeing single-use replay protection.

---

## 💎 Key Themes & Highlights

### 🔒 1. Native Zero-Command TLS & Dynamic Context Hot-Reloading (Task 53)
- **Built-in TLS Engine (`src/server/tls.ts`)**: On first boot with `TLS_ENABLED=true`, dynamically issues a 2048-bit RSA or ECDSA `prime256v1` self-signed certificate with automated SAN resolution across local hostname, loopback, and LAN IPv4 interfaces.
- **Dynamic Secure Context Hot-Reloading**: Executing `POST /api/admin/tls/regenerate` writes fresh certificate assets to `certs/` and invokes Node's `httpsServer.setSecureContext(...)` in-memory. Certificate rotation takes effect immediately for new TLS handshakes with zero downtime and zero dropped client connections.
- **Automated HTTP-to-HTTPS Redirection**: When TLS is active, ShellGuard spins up a secondary lightweight HTTP redirect listener forwarding all cleartext traffic to the secure port with a `301 Moved Permanently` status.
- **Secure Cookie & Origin Parity**: `systemRoutes.ts` detects `TLS_ENABLED=true` alongside standard `X-Forwarded-Proto` reverse proxy headers, ensuring session cookies are flagged `Secure` and WebCrypto APIs function seamlessly.

### 🦞 2. SuperLobster Transport Hub & Live Cryptographic Diagnostics (Task 54)
- **SuperLobster Admin Plane (`src/components/Admin/SuperLobsterView.tsx` / `TlsManagementTab.tsx`)**: Centralized administration console exposing real-time cryptographic health: TLS status indicator (`🟢 Active / HTTPS`), protocol version (`TLSv1.3`), cipher suite, certificate SHA-256 fingerprint, valid domains list, and real-time days-until-expiry countdown chip.
- **One-Click Certificate Regeneration**: Administrators can manually regenerate certificates directly from the UI, backed by a Reef Modernist `ConfirmDialog` and live toast feedback.
- **Transport Hub Metadata (`GET /api/admin/system/transport-info`)**: Emits server hostnames, active ports, protocol schemes, and SHA-256 fingerprints to power automated client pairing.

### 🤝 3. The Reef Handshake QR Pairing & Ephemeral Share Links (Task 54)
- **Invite Code Generator Modal (`src/components/Admin/CreateInviteModal.tsx`)**: Allows administrators to issue single-use invite codes with a 15-minute Time-To-Live (TTL) and custom administrative audit notes.
- **Decoupled Share URLs & One-Click Clipboard Copy**: Formats clean, direct onboarding URLs (`https://<host>:<port>/?invite=tok_...`) with instant visual clipboard feedback.
- **Bioluminescent QR Code Modal**: Generates high-contrast, scalable SVG QR codes encoded with the invite link, enabling seamless mobile camera onboarding across LAN devices without manual typing.
- **Real-Time Admin Invite Ledger**: Tracks all issued invite tokens in an interactive table with color-coded status badges: `🟢 Active (14m left)`, `🔴 Burned`, and `⚪ Expired`.

### 🛡️ 4. Decoupled Share Signup Flow & Atomic Token Burn Engine (Tasks 53 & 54)
- **Address Bar Query Scrubbing**: Landing on an invite URL automatically captures the `tok_...` query parameter into component memory and instantly calls `window.history.replaceState` to scrub the token from the browser address bar, preventing shoulder-surfing or browser history leakage.
- **Gateway Lockout Invariant (`src/components/Auth/SetupView.tsx`, `QuickLoginModal.tsx`)**: When an invite token is present, the gateway validates it via `GET /api/invites/verify/:token`. The UI locks out alternate login, quick-login, and standard registration tabs, dedicating the surface exclusively to the invited user with a pre-filled token chip. If an invalid or already-burned token is supplied, all forms firmly lock with a clear rejection message.
- **Atomic One-Time Burn Semantics (`POST /api/auth/register-with-invite`)**: User registration and token consumption are bound inside an atomic SQLite transaction. The engine checks `used_at IS NULL` and `expires_at > CURRENT_TIMESTAMP`, creates the user account and master key credentials, and atomically sets `used_at = CURRENT_TIMESTAMP`. Reusing a burned token fails closed immediately with `410 Gone / 400 Bad Request`.

### 🌊 5. Reef Modernist Documentation Portal & Interactive Docker Envars Reference
- **Interactive Docker Envars Reference (`docs/deployment/envars.md` & `EnvarList.vue`)**: Comprehensive, reactive reference covering all 24 ShellGuard environment variables with real-time keyword search, category filter chips (Security, Network, TLS, Storage, Admin, Rate Limits, Frontend), copy buttons for both clean variable names and syntax-valid configuration assignments, and a master `.env` template export.
- **Reef Modernist Documentation UI & Theme Alignment**:
  - **Interactive Bouncy Brand (`BouncyBrand.vue`)**: Dual-tone **Shell** (`#e4048a`) and **Guard** (`#06b6d4`) logotype with per-letter spring hover physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`), superscript `©™`, and version badge.
  - **View Transitions 950ms Circular Theme Reveal**: Smooth radial clip-path transition originating from cursor click coordinates upon toggling appearance, with `prefers-reduced-motion` safety checks.
  - **Signature 2px Horizon Seam**: Anchors the top navbar with ShellGuard Purple (`#7e22ce`) in Light Mode and glowing Bioluminescent Pink (`#e4048a`) in Dark Mode.
  - **Three-Font Typography Matrix & Soft CaraBase Geometry**: Bound `Outfit` (display headlines), `Inter` (body reading), and `JetBrains Mono` (cryptography & telemetry), paired with 24px squircle CaraBase cards (`VPFeature` / `Card.vue`) and soft pill action buttons (`rounded-full`).
  - **Living Brand Identity Memory (`.agents/brain/project/brandIdentity.md`)**: Formalized design memory capturing tokens, typography, component DNA, voice, and motion rules.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       🌐 Admin / Mobile Client Layer                        │
│  ┌─────────────────────────┐                   ┌─────────────────────────┐  │
│  │   SuperLobsterView      │                   │   Landing Gateway       │  │
│  │   TLS Status & Actions  │                   │   (?invite=tok_...)     │  │
│  └────────────┬────────────┘                   └────────────┬────────────┘  │
│               │ (Regenerate Cert)                           │ (Register)    │
│               ▼                                             ▼               │
│  ┌─────────────────────────┐                   ┌─────────────────────────┐  │
│  │   Invite Generator      │                   │   Address Bar Scrub     │  │
│  │   Share URL & QR Code   │                   │   Exclusive Lockout     │  │
│  └────────────┬────────────┘                   └────────────┬────────────┘  │
└───────────────┼─────────────────────────────────────────────┼───────────────┘
                │ POST /api/admin/invites                     │ POST /api/auth/register-with-invite
                ▼                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  🔌 Express 5 Security Kernel & TLS Engine                  │
│  ┌─────────────────────────┐                   ┌─────────────────────────┐  │
│  │   Native TLS Engine     │                   │   Atomic Token Burn     │  │
│  │   self-signed ECDSA CA  │ ──hot-reload───>  │   Single-Use Guarantee  │  │
│  │   HTTP -> HTTPS 301     │                   │   15-Minute TTL Check   │  │
│  └─────────────────────────┘                   └────────────┬────────────┘  │
└─────────────────────────────────────────────────────────────┼───────────────┘
                                                              │
                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🖥️ Bedrock SQLite Storage & Audit                        │
│       ┌────────────────────────────────┐  ┌───────────────────────────┐     │
│       │   vault_invites Table          │  │   Audit Reef              │     │
│       │   (token, used_at, expires_at) │  │   (audit.sqlite)          │     │
│       └────────────────────────────────┘  └───────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sequence Flow: The Reef Handshake, QR Pairing & Atomic Invite Burn

```mermaid
sequenceDiagram
    autonumber
    actor Admin as SuperLobster Admin
    participant Client as Admin Web Console
    participant Server as Express Security Kernel & TLS
    actor Guest as Invited Guest / Mobile
    participant Gateway as Landing Gateway (SetupView)
    participant DB as SQLite Bedrock
    participant Audit as Audit Reef (audit.sqlite)

    Admin->>Client: Click "Create Invite" (15m TTL)
    Client->>Server: POST /api/admin/invites { note, expires_in_minutes: 15 }
    Server->>DB: INSERT INTO vault_invites (token, expires_at)
    Server-->>Client: 201 Created { token: "tok_...", expires_at }
    Client->>Admin: Display Share Card & Bioluminescent QR Code

    Guest->>Gateway: Scan QR / Navigate to https://host/?invite=tok_abc123
    Gateway->>Gateway: Scrub ?invite from address bar (replaceState)
    Gateway->>Server: GET /api/invites/verify/tok_abc123
    Server->>DB: SELECT * FROM vault_invites WHERE token = ?
    Server-->>Gateway: 200 OK { valid: true, expires_at }
    Gateway->>Guest: Lockout non-invite tabs; Display dedicated signup form

    Guest->>Gateway: Submit Username, Password & Master Password
    Gateway->>Server: POST /api/auth/register-with-invite { token, username, password, ... }
    
    rect rgb(30, 41, 59)
        Note over Server,DB: Atomic SQLite Transaction
        Server->>DB: SELECT * FROM vault_invites WHERE token = ? FOR UPDATE
        Server->>DB: Validate used_at IS NULL AND expires_at > now
        Server->>DB: INSERT INTO lobsters (user_uuid, username, ...)
        Server->>DB: UPDATE vault_invites SET used_at = CURRENT_TIMESTAMP WHERE token = ?
        Server->>Audit: Log USER_REGISTERED_WITH_INVITE & INVITE_BURNED
    end

    Server-->>Gateway: 201 Created { success: true, user }
    Gateway->>Guest: Transition directly to unlocked Grotto vault!

    opt Replay Attack Attempt
        Guest->>Server: POST /api/auth/register-with-invite { token: "tok_abc123", ... }
        Server->>DB: SELECT * FROM vault_invites WHERE token = ?
        Server-->>Guest: 410 Gone / 400 Bad Request { error: "Invite code has already been used" }
    end
```

---

## 🔐 Cryptographic & Relational Invariants

| Dimension | Implementation | Verification & Security Guarantee |
|:---|:---|:---|
| **Zero-Command TLS** | Self-signed ECDSA `prime256v1` / RSA 2048 CA | Auto-generated on boot when `TLS_ENABLED=true`; persistent in `certs/`; SAN resolution for IP & localhost. |
| **In-Memory Context Hot-Reloading** | `httpsServer.setSecureContext(...)` | Certificates rotate dynamically without dropping active client connections, terminating WebSockets, or restarting Node. |
| **Atomic One-Time Burn** | Transactional check-and-set in SQLite | Invites are stamped `used_at = CURRENT_TIMESTAMP` atomically within user creation transaction; zero multi-account replay possible. |
| **Ephemeral TTL Enforcement** | `expires_at > CURRENT_TIMESTAMP` | Tokens strictly expire 15 minutes after issuance; expired tokens fail validation closed (`410 Gone`). |
| **Query Parameter Scrubbing** | `window.history.replaceState` | Secret invite tokens are stripped from the browser URL immediately upon client boot to prevent browser history, referer, or shoulder-surfing leaks. |
| **Gateway Lockout Invariant** | Exclusive invite signup state derivation | Presenting an invite locks alternative login paths to guarantee clear, guided onboarding; invalid tokens lock the form with a security warning. |
| **Audit Trail Preservation** | Append-only `audit.sqlite` | Token creation, verification, registration burn, and TLS regeneration events are committed immutably. |

---

## 🧪 Verification & Test Oracle Summary

All test suites execute sequentially with 100% green status across both local test harnesses and GitHub Actions cloud CI runners:

- **Total Test Suites**: `33 suites` (sequential execution via `fileParallelism: false`)
- **Total Test Cases**: `399 passing assertions`
- **Targeted Suite**: `tests/tls-admin.test.ts` (8 integration tests) verified self-signed CA generation, SAN resolution, secure context hot-reloading, invite token lifecycle (issue, verify, atomic burn, TTL expiry, replay rejection), and admin permission gating.
- **Documentation Verification**: All 12/12 doc-oracle tests passed in `tests/docsLinks.test.ts`, `tests/mermaidDiagrams.test.ts`, and `tests/version.test.ts`. Full VitePress documentation builds cleanly (`npm run docs:build` in 105.74s with 0 dead links).

### Physical Verification Test Oracle Receipts (All 7 Gates Ratified)

| Gate | Description | Verified Behavior & Evidence | Verdict |
|:---|:---|:---|:---:|
| **Gate 1** | Zero-Command TLS Boot & Redirect | Server booted with `TLS_ENABLED=true`, generated ECDSA certs in `certs/`, redirected cleartext HTTP `80 -> 443`, and served full HTTPS app. | ✅ **PASS** |
| **Gate 2** | Dynamic Cert Regeneration | Admin clicked "Regenerate Certificate", fresh cert was issued, SHA-256 fingerprint updated, and context hot-reloaded with zero connection drops. | ✅ **PASS** |
| **Gate 3** | Ephemeral Invite Generation | Created 15-minute invite in SuperLobster admin panel; token stamped in `vault_invites` table and displayed in admin invite ledger. | ✅ **PASS** |
| **Gate 4** | Reef Handshake QR & Share URL | Clicked "Copy Share Link", copied canonical URL with feedback; opened QR code modal rendering crisp, high-contrast SVG pairing code. | ✅ **PASS** |
| **Gate 5** | Decoupled Share Signup & Scrubbing | Navigated to `https://.../?invite=tok_...`; address bar immediately scrubbed token; gateway locked out other forms and displayed dedicated invite badge. | ✅ **PASS** |
| **Gate 6** | Atomic Token Burn & Replay Defense | Completed registration; user account created and invite marked `used_at = now`; re-attempting signup with burned token rejected immediately. | ✅ **PASS** |
| **Gate 7** | Docs Integrity & 100% Green CI | All 15 documentation files updated, diagrams verified, and test oracle passing 100% green across 33 suites (399 tests). | ✅ **PASS** |

---

## 🚀 Migration & Deployment Guide

This release is **100% non-breaking** and backwards-compatible with existing ShellGuard deployments:

1. **Enabling Native TLS**:
   Set `TLS_ENABLED=true` in your `.env` or Docker container environment.
   ```bash
   TLS_ENABLED=true
   TLS_HTTP_REDIRECT=true
   PORT=443
   PORT_HTTP=80
   ```
   *Note: If no custom certificates are placed in `certs/`, ShellGuard will automatically generate self-signed ECDSA certificates on first startup.*
2. **Database Schema**:
   No manual SQL migrations required. The `vault_invites` table is verified and managed automatically by the security kernel.
3. **Container Update**:
   Pull the latest image or rebuild with `docker compose up -d --build`.

---

## 📜 Ledger of Commits (Phase 27)

```text
5761b22 docs(theme): align VitePress docs UI to Reef Modernist app design
1541a28 feat(docs): add interactive docker envars list component and reference page
df2e5b4 docs(release): walk the docs for Phase 27 - SuperLobster TLS control plane and share signups (v0.0.2.9 Build 31)
e940896 fix(tls-admin): hot-reload TLS secure context, polish invite share card, and lock gateway on used invites
39c40c0 docs(agents): author root AGENTS.md skill-seed with diagnostic invariants
3fc79fa fix(security): recognize TLS_ENABLED in HTTPS enforcement status and cookie security
c71440e fix(superlobster): unwrap restAdapter responses in TlsManagementTab
dda835b chore(brain): record Phase 27 physical testing verification of Gates 1 and 2
7f7b5be fix(auth): unwrap restAdapter signup status and lock down all gateway hatch entrypoints
8cc8a0a feat(Phase-27): complete invite token wiring, address bar scrubbing, docs sidebar, and test oracle
5e431e0 feat(Phase-27): merge Jules co-pilot implementation into stage
bba8459 fix(Phase-27): resolve TypeScript issues, test failures, and missing UI elements
56becd1 feat(Phase-27): SuperLobster TLS Control Plane & Reef Handshake
```

---

<div align="center">

```
    Built with 🛡️ by ClawStack Studios©™
    Exoskeletal Protection for Human + Agent Secrets
```

</div>
