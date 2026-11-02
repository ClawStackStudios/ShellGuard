# 🦞 ShellGuard — Release v0.0.3.0 (Build 32)
> **"Sync-Native Reactive River SSE, Boot-Time Hardening & Storage Quota Ceilings"** — Phase 28: Monotonic Mutation Event Bus, Server-Sent Events Route, Zero-Knowledge In-Memory State Reconciliation, Safe Storage Bounds, Fast 413 Rejection, Container User Remapping & Fail-Safe TLS State Engine

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

Welcome to **v0.0.3.0 (Build 32)** of **ShellGuard**! This major milestone completes the entirety of **Era 2 Stage 2 (Phase 28)**, delivering our real-time **Reactive River SSE Infrastructure**, **24-Envar Boot-Time Hardening**, **Bounded Storage Quotas & Pre-Stream 413 Rejection**, **Fail-Safe Dynamic TLS State**, and **Container User Remapping (`PUID`/`PGID`)**.

In previous releases, keeping multiple active browser sessions, companion apps, or autonomous agent workflows synchronized required manual refreshes or periodic polling. With **Reactive River SSE**, ShellGuard introduces an in-process, zero-knowledge mutation event bus (`src/server/utils/reactiveRiver.ts`) broadcasting `vault_mutation` events (`{ domain, id, rev, action, timestamp }`) across an authenticated Server-Sent Events stream (`GET /api/sync/events`) with sub-50ms latency. The stream enforces strict tenant isolation by `owner_uuid`, supports monotonic cursor replay (`Last-Event-ID`) via a 100-event ring buffer for seamless reconnection, and provides a bioluminescent status indicator in the client header (`River Live`). On the client, `App.tsx` performs non-destructive in-memory state reconciliation, instantly refreshing the vault list without disrupting active field editing or folder tree selection.

In addition to real-time sync, **Phase 28** systematically hardens all 24 ShellGuard environment variables:
1. **Core Crypto & Identity (28.1)**: Enforces >= 32-byte decoded entropy on `DB_ENCRYPTION_KEY`, inspects the SQLite plaintext magic header to eliminate the wrong-key rekey corruption trap, validates `ADMIN_TOKEN`, and detects Catch-22 signup lockouts.
2. **Network & TLS State (28.2)**: Implements dynamic `isTlsServerActive` tracking to eliminate 301 redirection self-bricks and admin cookie lockouts on certificate fallback, exempts `/api/health` from HTTPS redirection, adds multi-proxy hop counts (`TRUST_PROXY`), and expands rate-limiter time units.
3. **Storage & Isolation (28.3)**: Binds `ATTACHMENT_MAX_MB` (1–2000 MB) and `GROTTO_QUOTA_MB` (1–100,000 MB) through pure configuration clamps, rejects oversized uploads pre-stream via `Content-Length` inspection with HTTP 413, adds independent `PUID`/`PGID` POSIX remapping with sanitized `DATA_DIR` fallback, and renders a persistent red `ZeroKnowledgeWarningBanner` when client encryption is disabled.

---

## 💎 Key Themes & Highlights

### 🌊 1. Reactive River SSE Stream & Live Client Reconciliation (Sub-Phase 28.4 / Tasks 61 & 62)
- **In-Process ReactiveRiverManager Event Bus (`src/server/utils/reactiveRiver.ts`)**: High-throughput pub/sub engine broadcasting `vault_mutation` frames (`domain`, `id`, `rev`, `action`, `timestamp`) within <50ms of commit. Employs tenant isolation by `owner_uuid`, monotonic sequence identifiers (`ev_<seq>`), per-owner 100-event ring buffer cursor replay, and per-item revision maps.
- **Authenticated SSE Route (`src/server/routes/sync.ts`)**: `GET /api/sync/events` protected by `queryTokenAdapter` translating query parameter tokens (`?token=api-...`) for native browser `EventSource` clients without custom header constraints. Transmits unbuffered headers (`X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`), 25s `: heartbeat` keepalive comments, and cursor recovery via `Last-Event-ID`.
- **Database Mutation Hooks**: Wired `publishMutation` across all vault pearls, secure notes, SSH keys, and encrypted attachments CRUD routes.
- **Client Consumer Hook (`src/hooks/useReactiveRiver.ts`)**: Native EventSource hook with multi-tier token extraction fallback (`customToken` -> `getSessions()` -> `sessionStorage`), monotonic cursor tracking, and jittered exponential backoff auto-reconnect (1s to 16s).
- **Header Bioluminescent Indicator (`src/components/Layout/Header.tsx`)**: Real-time status pill rendering emerald (`River Live`), amber pulsing (`Reconnecting…` / `Connecting…`), and slate (`Offline`).
- **Non-Destructive In-Memory Reconciliation (`src/App.tsx`)**: Reconciles vault state via `scuttleVault` upon mutation receipt while maintaining user item selection and active navigation focus.
- **Automated Test Battery (`tests/sync-events.test.ts`)**: 9 integration tests verifying real-time delivery, client isolation, heartbeat intervals, and cursor recovery.

### 📦 2. Storage Ceilings, Pre-Stream Quota Protection & User Isolation (Sub-Phase 28.3 / Tasks 59 & 60)
- **Pure Storage Quota Engine (`src/server/config/storageConfig.ts`)**: Clamped safe bounds for `ATTACHMENT_MAX_MB` (1–2000 MB, default 500) and `GROTTO_QUOTA_MB` (1–100,000 MB, default 1000). Pre-stream `Content-Length` validation in `routes/attachments.ts` fast-rejects oversized uploads with HTTP 413 prior to multipart buffering.
- **Container User Isolation (`docker-entrypoint.sh`)**: Independent POSIX integer validation and remapping for `PUID` and `PGID`, with sanitized `DATA_DIR` fallback resolving whitespace/empty paths to `./data`.
- **Dynamic Container Healthcheck (`Dockerfile`)**: Dynamic probe querying `localhost:${PORT:-6464}/api/health`.
- **Zero-Knowledge Alert Banner (`src/components/ZeroKnowledgeWarningBanner.tsx`)**: Persistent crimson warning banner rendered across all views when `VITE_SHELLCRYPTION_ENABLED === 'false'`.
- **Unit Test Battery (`tests/storage-container-isolation.test.ts`)**: 17 tests proving quota clamps, fast 413 rejection, and envar validation.

### 🔒 3. Network Topology, Fail-Safe TLS State & Rate Limiter Hardening (Sub-Phase 28.2 / Tasks 57 & 58)
- **Fail-Safe TLS State Tracking (`src/server/utils/tlsManager.ts`)**: Dynamic `isTlsServerActive` tracking preventing 301 redirection self-bricks and admin cookie lockouts on certificate fallback to HTTP.
- **Health Probe Redirection Exemption**: `/api/health` exempted from HTTPS redirection to protect Docker container health probes.
- **Multi-Proxy Chain Support**: Multi-proxy comma-separated `X-Forwarded-Proto` chain parsing and `TRUST_PROXY` integer hop counts (`TRUST_PROXY=2`).
- **Rate Limiter Hardening**: Added `'h'` and `'d'` unit support to `parseWindow()` fixing `'1h'` parsing bug, and clamped rate limiters `> 0` preventing self-DoS `max: 0` lockouts.
- **BYO Certificate Overwrite Guard**: Added `400 Bad Request` guard on `/api/admin/tls/generate` when custom certs are loaded.
- **Runtime Environment Inspector**: Reef Modernist diagnostic card in `SuperLobsterStatus.tsx`.
- **Test Suite (`tests/unit/envar-network-tls.test.ts`)**: 20 tests verifying TLS fallback, rate limiters, and proxy hop counts.

### 🛡️ 4. Core Crypto, Admin Plane & Identity Envar Hardening (Sub-Phase 28.1 / Tasks 55 & 56)
- **Centralized Boot Validator (`src/server/config/envValidator.ts`)**: Validates all 24 environment variables on startup and prints formatted security diagnostic banner.
- **Entropy & Rekey Hardening (`src/server/database/connection.ts`)**: Enforces >= 32 byte decoded entropy for `DB_ENCRYPTION_KEY` across Base64 and Base64URL. Inspects 16-byte plaintext SQLite magic header ("SQLite format 3\0") before executing PRAGMA rekey, preventing wrong-key database corruption.
- **Admin Token Hardening**: Whitespace trimming, >= 16 char length guard, and rejection of weak/boolean-confused tokens.
- **Signup Policy Lockout Detection**: Detects Catch-22 lockout when `DISABLE_SIGNUPS=true` and `ADMIN_TOKEN` is unset.
- **TTL Parser Date Overflow Guard**: Added weeks support and date overflow guard to `tokenExpiry.ts` with safe fallback to `1440`.
- **Unit Test Suite (`tests/unit/env-validator.test.ts`):** 17 tests verifying crypto entropy and envar validator behavior.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       🌐 Client Session Layer (Tabs 1 & 2)                  │
│  ┌─────────────────────────┐                   ┌─────────────────────────┐  │
│  │   Tab 1: Mutation Agent │                   │   Tab 2: Passive Client │  │
│  │   (Adds Pearl/Note/Key) │                   │   (Header: River Live)  │  │
│  └────────────┬────────────┘                   └────────────▲────────────┘  │
│               │ POST /api/vault                             │               │
│               │ (Ciphertext Envelope)                       │ SSE Stream    │
└───────────────┼─────────────────────────────────────────────┼───────────────┘
                ▼                                             │
┌─────────────────────────────────────────────────────────────┼───────────────┐
│                 🔌 Express 5 Kernel & Reactive River SSE    │               │
│  ┌─────────────────────────┐                   ┌────────────┴────────────┐  │
│  │   Vault Route Mutation  │                   │   GET /api/sync/events  │  │
│  │   publishMutation(...)  │──────────────────▶│   (queryTokenAdapter)   │  │
│  └────────────┬────────────┘   in-process      └─────────────────────────┘  │
│               ▼                 EventBus                    ▲               │
│  ┌─────────────────────────┐                                │ Ring Buffer   │
│  │   SQLite Bedrock (WAL)  │                                │ Replay (ev_N) │
│  │   vault_pearls (insert) │                                │               │
│  └─────────────────────────┘                                └───────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Verification Matrix

| Verification Suite | Target Domain | Invariant Proven | Result |
|:---|:---|:---|:---|
| `tests/sync-events.test.ts` | Reactive River SSE | SSE event frame delivery, multi-tenant isolation, cursor recovery | ✅ 9/9 Passed |
| `tests/storage-container-isolation.test.ts` | Storage & Quotas | Bounded quota clamps, fast pre-stream 413, PUID/PGID integer validation | ✅ 17/17 Passed |
| `tests/unit/envar-network-tls.test.ts` | Network & TLS | Dynamic TLS fallback, /api/health exemption, multi-proxy hops | ✅ 20/20 Passed |
| `tests/unit/env-validator.test.ts` | Boot Crypto | Decoded 32-byte entropy, magic header rekey guard, weak token rejection | ✅ 17/17 Passed |
| `tests/unit/version.test.ts` | Version Resolver | Ground-truth version resolver matching `package.json` semver shape | ✅ 2/2 Passed |
| `tests/build-gates.test.ts` | Architecture Claims | Strict claim battery linking documentation statements to code reality | ✅ 18/18 Passed |

---

<div align="center">

```
    Built with 🛡️ by ClawStack Studios©™
    Maintained by CrustAgent©™
```

</div>
