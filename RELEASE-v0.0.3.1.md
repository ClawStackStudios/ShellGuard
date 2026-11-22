# 🦞 ShellGuard — Release v0.0.3.1 (Build 33)
> **"Dual-Homed MagicDNS Mesh, Multi-Domain Bulk Coalescing & Mobile Backup Interop"** — Phase 29: Zero-Config LAN + Tailscale MagicDNS TLS Reflection, Fast-First Client `NetworkResolver` with Transparent REST & SSE Failover, Transport Diagnostics Drawer, Multi-Domain Bulk Transactions with 429 Stream Pacing, and Lossless Mobile Backup Interoperability

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

Welcome to **v0.0.3.1 (Build 33)** of **ShellGuard**! This release completes **Phase 29 (Stage 29A + Stage 29B)** and resolves **Mobile Backup Interoperability (#34)**, transforming ShellGuard into a **dual-homed, self-healing vault** that seamlessly transitions between Local LAN and Tailscale MagicDNS while dramatically improving bulk throughput and cross-platform backup fidelity.

1. **Dual-Homed Network Resolution & MagicDNS Mesh (Stage 29B / Issues #21, #22, #25–#28)**:
   ShellGuard now automatically discovers both RFC 1918 LAN interfaces and Tailscale (`100.64.0.0/10`, `fd7a:115c:a1e0::/48`, `*.ts.net`) vectors, reflects `*.ts.net` as a native DNS SAN (`type: 2`) in auto-generated TLS certificates, authorizes Tailscale origins in LAN-mode CORS, and publishes a public reachability manifest at `GET /api/public/endpoints`. On the client, `NetworkResolver` races LAN (`1200ms` budget) and Tailscale (`3000ms` budget) probes in parallel, seamlessly fails over REST requests on network drops, migrates the Reactive River `EventSource` stream while preserving `Last-Event-ID`, and exposes live RTT telemetry and manual vector pinning inside the new **Transport Diagnostics Drawer**.
2. **Multi-Domain Bulk Transactions & SSE Coalescing (Stage 29A / Issues #30–#32)**:
   Eliminates the 4N SSE feedback loop during mass imports, deletes, and pod/tag updates by coalescing `publishMutation()` to **1 SSE event per bulk transaction**, unifying `POST /api/vault/bulk-import`, `DELETE /api/vault/bulk`, and `PATCH /api/vault/bulk-metadata` across all vault domains, exposing IETF `RateLimit-*` / `Retry-After` CORS headers, and adding automatic HTTP `429` backpressure pacing to binary attachment streams.
3. **Mobile Backup Interop & Layer-2 Write Parity (Issue #34)**:
   Guarantees lossless round-trip restoration of ShellGuard Mobile `.json` / `.sgbak` backups by normalizing object-map custom fields (`normalizeCustomFields`), flattening legacy `{ pearls, notes, sshKeys }` exports, making `POST /api/vault/bulk-import` idempotent via owner-scoped `ON CONFLICT(id) DO UPDATE ... WHERE owner_uuid = excluded.owner_uuid` with fail-closed cross-tenant collision protection, and ensuring Layer-2 `MetadataGuard` encryption of secondary `uris` across all write paths.

---

## 💎 Key Themes & Highlights

### 🌐 1. Dual-Homed Network Resolution Engine & MagicDNS Mesh (Stage 29B / Issues #21, #22, #25–#28)
- **Server-Side Topology & 3-Tier MagicDNS Discovery (`src/server/utils/networkTopology.ts`)**: Classifies RFC 1918 LAN interfaces vs RFC 6598 (`100.64.0.0/10`) / Tailscale IPv6 (`fd7a:115c:a1e0::/48`) and resolves `*.ts.net` hostnames via a 3-tier waterfall (Tailscale LocalAPI socket ➔ reverse DNS `dns.reverse` ➔ `TAILSCALE_DOMAIN` / `MAGIC_DNS_HOST` env hint) with graceful LAN-only fallback.
- **Zero-Config TLS SAN Reflection & Dual-Vector Pairing (`tlsManager.ts`, `admin.ts`)**: Automatically injects discovered `*.ts.net` DNS SANs (`type: 2`) into self-signed EC P-256 certificates and emits dual-vector `shellguard://pair?v=1&lan=...&ts=...&fp=...&ik=...&alias=...` QR codes.
- **LAN-Mode Tailscale CORS Authorization (`src/config/corsConfig.ts`)**: Extracted `isPrivateNetworkHostname()` authorizing `*.ts.net` and `fd7a:115c:a1e0::/48` origins with `credentials: true` in LAN mode.
- **Public Reachability Manifest (`GET /api/public/endpoints`)**: Unauthenticated discovery endpoint returning `{ lan, tailscale, tls: { enabled, fingerprint } }` for instant client and companion bootstrapping.
- **Fast-First Client `NetworkResolver` (`src/lib/networkResolver.ts`)**: Runs parallel `AbortController`-bounded probes (`1200ms` LAN / `3000ms` Tailscale), resolves on the fastest healthy vector while collecting background telemetry, supports `auto` / `force-lan` / `force-tailscale` pinning persisted in `sg_transport_config`, coalesces concurrent races via single-flight deduplication, and re-races automatically on browser `'online'` events.
- **Transparent REST & SSE Failover (`apiConfig.ts`, `restAdapter.ts`, `useReactiveRiver.ts`)**: Routes all API traffic through `getApiBaseUrl()`, triggers a single transparent emergency race + retry on network transport errors in `restAdapter`, and cleanly migrates the Reactive River `EventSource` stream to the winning vector while retaining `Last-Event-ID`.
- **Transport Diagnostics Drawer (`src/components/Network/TransportDiagnosticsDrawer.tsx`)**: Accessible slide-over drawer (Escape dismiss, Tab focus trap) triggered from the interactive Header Reactive River pill or Settings, displaying live LAN/Tailscale RTT cards, active transport badge, SHA-256 TLS fingerprint, pinning selector, and manual **Race Now** trigger.

### ⚡ 2. Multi-Domain Bulk Transactions & Reactive River Coalescing (Stage 29A / Issues #30–#32)
- **Single-Event Bulk SSE Coalescing (`src/server/routes/vault.ts`)**: Emits one `vault_mutation` event per bulk transaction across `bulk-import`, `bulk-delete`, `bulk-metadata`, `graduate`, and `revert`, preserving the 100-event ring buffer and wrapping batch audit writes in `auditDb.transaction()`.
- **Unified Multi-Domain Bulk API**: Supports `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys` in `POST /api/vault/bulk-import` (500-item client chunking + shared `import_batch_id`), deletes across all 4 tables in `DELETE /api/vault/bulk`, and introduces `PATCH /api/vault/bulk-metadata` for Layer-2 `category`/`tags` updates without touching Layer-1 ciphertext.
- **Client Debounce & 429 Stream Backpressure (`App.tsx`, `AttachmentIngestionQueue`)**: Adds `200ms` trailing debounce to `handleRiverMutation`, single-flight deduplication to `scuttleVault`, exposes `RateLimit-*` / `Retry-After` CORS headers, and automatically paces binary attachment transfers on HTTP `429`.

### 📱 3. Mobile Backup Interop & Layer-2 Write Parity (Issue #34)
- **Custom Field & Legacy Backup Normalization (`src/lib/customFieldUtils.ts`)**: Safely converts Mobile object-map `custom_fields` (and camelCase `customFields`) into canonical `CustomField[]` arrays across detail, edit, and import views, and extracts items from both flat `{ items }` and legacy `{ pearls, notes, sshKeys }` backup envelopes.
- **Owner-Scoped Idempotent Bulk Import (`src/server/routes/vault.ts`)**: Replaces plain `INSERT` with `ON CONFLICT(id) DO UPDATE ... WHERE owner_uuid = excluded.owner_uuid` across pearls, notes, and SSH keys, with a fail-closed `changes === 0` cross-tenant collision guard.
- **Layer-2 `MetadataGuard` `uris` Write Parity**: Encrypts secondary `uris` consistently across `POST /api/vault`, `PUT /api/vault/:id`, and `POST /api/vault/bulk-import`.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   🌐 Client Layer (NetworkResolver + UI)                    │
│  ┌─────────────────────────┐       ┌─────────────────────────────────────┐  │
│  │  NetworkResolver Engine │◀─────▶│  TransportDiagnosticsDrawer (UI)    │  │
│  │  (auto|force-lan|ts)    │       │  RTT Cards · Pinning · Race Now     │  │
│  └──────┬──────────┬───────┘       └─────────────────────────────────────┘  │
│  LAN    │ 1200ms   │ Tailscale 3000ms                                       │
└─────────┼──────────┼────────────────────────────────────────────────────────┘
          ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               🔌 Express 5 Kernel (Dual-Homed TLS & Discovery)              │
│  ┌─────────────────────────┐       ┌─────────────────────────────────────┐  │
│  │ GET /api/public/endpoints│       │ tlsManager.ts + networkTopology.ts  │  │
│  │ { lan, tailscale, tls } │       │ RFC1918 + RFC6598 + *.ts.net SANs   │  │
│  └─────────────────────────┘       └─────────────────────────────────────┘  │
│  ┌─────────────────────────┐       ┌─────────────────────────────────────┐  │
│  │  REST + Bulk Upsert API │──────▶│ GET /api/sync/events (Last-Event-ID)│  │
│  │  (Owner-Scoped SQLite)  │       │ Coalesced Bulk SSE (1 ev / batch)   │  │
│  └─────────────────────────┘       └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Verification Matrix

| Verification Suite | Target Domain | Invariant Proven | Result |
|:---|:---|:---|:---|
| `tests/unit/network-topology.test.ts` | Dual-Homed Topology | RFC 1918 vs RFC 6598/fd7a classification, 3-tier MagicDNS resolution, TLS SAN reflection | ✅ Passed |
| `tests/unit/cors-magicdns.test.ts` | LAN-Mode CORS | `*.ts.net` and `fd7a:115c:a1e0::/48` private origin authorization | ✅ Passed |
| `tests/tls-admin.test.ts` | TLS & Discovery | `GET /api/public/endpoints` manifest, dual-vector pairing URI, cert hot-reload | ✅ Passed |
| `tests/unit/networkResolver.test.ts` | Client NetworkResolver | Fast-first race, timeout aborts, pinning persistence, `'online'` re-race | ✅ Passed |
| `tests/unit/restAdapter-failover.test.ts` | REST Failover | Transparent single-retry emergency race on transport error, no retry on 4xx/5xx | ✅ Passed |
| `tests/vault-bulk-import.test.ts` | Multi-Domain Bulk API | 201/207 envelopes, SSE coalescing, `PATCH /bulk-metadata`, `DELETE /bulk` | ✅ Passed |
| `tests/unit/mobile-backup-interop.test.ts` | Mobile Interop | Object-map `custom_fields`, camelCase fallback, legacy `{ pearls, notes, sshKeys }` extraction | ✅ Passed |
| `tests/integration/bulk-import-idempotency.test.ts` | Idempotent Upsert | Same-owner re-import update, cross-owner collision rejection, Layer-2 `uris` encryption | ✅ Passed |
| **Full Cloud CI Suite** | **43 Vitest Suites** | **480 passed \| 1 skipped (481), Vite + VitePress build 100% green** | ✅ Passed |

---

<div align="center">

```
    Built with 🛡️ by ClawStack Studios©™
    Maintained by CrustAgent©™
```

</div>
