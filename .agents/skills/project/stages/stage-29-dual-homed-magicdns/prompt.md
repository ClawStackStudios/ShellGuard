# 🌐 Stage 29 Execution Prompt — Dual-Homed Network Resolution Engine & MagicDNS Mesh

> **Milestone**: Provisional `v0.0.3.1 (Build 33)` — Phase 29 (Tasks 63 & 64)  
> **Execution Law**: Strict 2-Task Pairing (Task 63 [Functionality] + Task 64 [UI Component & Walk-the-Docs]).

---

## 📖 Context & Spec Oracles (Read First)

Before writing code, inspect:
- [`.agents/skills/project/specs/architecture/architecture.md`](../../specs/architecture/architecture.md): §5.1 (The Reef Handshake `lan` and `ts` vectors) & §5.3 (Dual-Homed Network Resolution).
- [`.agents/skills/project/specs/network/routes-and-contracts.md`](../../specs/network/routes-and-contracts.md): §1 (`restAdapter.ts` central envelope unwrapping) & §6 (`GET /api/public/tls-manifest`).
- [`.agents/skills/project/modules/07-superlobster-admin/02-transport-and-mobile-pairing/spec.md`](../../modules/07-superlobster-admin/02-transport-and-mobile-pairing/spec.md): Reachability vectors (`LAN IP` and `Tailscale`).

---

## 🛠️ Execution Tasks (Strict 2-Task Pairing)

### Task 63: [Functionality] Client-Side Latency Probing & Tailscale MagicDNS Resolver

- **Dual-Homed Network Prober (`src/lib/networkResolver.ts` & `src/services/api/restAdapter.ts`)**:
  - Implement an adaptive endpoint resolution engine racing configured LAN endpoints (`https://192.168.x.x:6565`, 1200ms probe timeout) against Tailscale MagicDNS mesh endpoints (`https://*.ts.net:6565`).
  - Automatically route `restAdapter.ts` API traffic and `useReactiveRiver` SSE streams through the lowest-latency verified vector.
  - Perform transparent failover with exponential backoff when a client transitions between home WiFi (LAN) and cellular/remote networks (Tailscale) without dropping active `api-` bearer sessions.
- **Automated Verification**:
  - Author `tests/unit/networkResolver.test.ts` proving LAN vs Tailscale latency racing, 1200ms timeout failover, and manual transport pinning overrides.

### Task 64: [UI Component & Walk-the-Docs] Transport Health Diagnostics Drawer & Manual Network Overrides

- **Transport Diagnostics Drawer (`src/components/SettingsView.tsx` / `src/components/network/TransportDiagnosticsDrawer.tsx`)**:
  - Build a Reef Modernist **Transport Health Diagnostics Drawer** displaying the active connection vector (`LAN Direct` vs `Tailscale Mesh`), live RTT latency telemetry (ms), TLS fingerprint match status, and manual transport pinning controls (`Auto Race`, `Force LAN`, `Force Tailscale`).
- **4-Zone Walk-the-Docs**:
  - Synchronize `ARCHITECTURE.md`, `docs/companion/pairing.md`, `docs/deployment/https-tls.md`, and `CHANGELOG.md`.
