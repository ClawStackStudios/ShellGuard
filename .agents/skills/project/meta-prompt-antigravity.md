# 🧭 Meta-Prompt Antigravity: Master Orchestration & Module Router

> State router for ShellGuard Era 2 (`v0.0.2.9+` — *The Distributed Reef & Mobile-First Fleet*). Binds the sliding timeline in `stages/` to the permanent feature-activity oracles in `modules/` and ground-truth core specifications in `specs/`.
> *(Preceding Era 1: Phases 1–26 archived in [`.agents/internal/meta-prompt-ai-studio.md`](../../internal/meta-prompt-ai-studio.md) and [`.agents/internal/ROADMAP.md`](../../internal/ROADMAP.md)).*

---

## 1. Era 2 Architectural Thesis: The Mobile-First Inversion

ShellGuard Era 2 operates the web server and native Android companion (`ShellGuard-Mobile` / `ShellGuard-TOTP`) as equal peers governed by **Four Cornerstones**:
1. **The Reef Handshake (Zero-Touch CameraX Visual Pairing):** Expressive vector QR code (`shellguard://pair?v=1&lan=<url>&ts=<url>&fp=<sha256-hex>&ik=<instance-key-hex>&alias=<name>`) ingested in a single camera tap.
2. **The Instance Identity Anchor (`DATA_DIR/instance.key`):** Persistent EC P-256 (`secp256r1`, `0o600`) host key signing ECDSA-SHA256 rotation manifests (`certs/manifest.json`) so paired mobile clients silently auto-heal across leaf certificate regenerations.
3. **Dual-Homed Network Mobility (LAN vs Tailscale Racing):** Clients dynamically race LAN probes against Tailscale MagicDNS (`*.ts.net`), falling back to local encrypted Room/SQLCipher storage when offline.
4. **Sync-Native Reactive River (Sub-50ms Real-Time Reconciliation):** Authenticated Server-Sent Events stream (`GET /api/sync/events`) broadcasts real-time mutation markers (`{ domain, id, rev, action, timestamp }`).

---

## 2. Sliding Release Timeline & Module Matrix (Era 2)

| Stage | Version / Build | Stage Directory | Bound Feature-Activity Modules (`modules/`) & Core Specs (`specs/`) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 27** | `v0.0.2.9 (Build 31)` | `stages/stage-27-tls-control-plane/` | `modules/07-superlobster-admin/02-transport-and-mobile-pairing/`, `modules/01-auth-gateway/`, `specs/architecture/architecture.md`, `specs/crypto/key-hierarchy-spec.md`, `specs/network/routes-and-contracts.md` | 🟢 **PRUNED (Shipped `1c275c5`)** |
| **Stage 28.1** | `v0.0.3.0 (Build 32)` | [`stages/stage-28.1-envar-core-crypto/`](./stages/stage-28.1-envar-core-crypto/prompt.md) | `modules/07-superlobster-admin/01-admin-gate-and-reef-status/`, `modules/01-auth-gateway/`, `specs/crypto/encryption-layers-spec.md`, `specs/admin/admin-suite-spec.md` | 🟢 **ACTIVE LEADING EDGE** |
| **Stage 28.2** | `v0.0.3.0 (Build 32)` | [`stages/stage-28.2-envar-network-tls/`](./stages/stage-28.2-envar-network-tls/prompt.md) | `modules/07-superlobster-admin/{01,02}/`, `specs/architecture/architecture.md`, `specs/network/routes-and-contracts.md` | ⚪ Queued |
| **Stage 28.3** | `v0.0.3.0 (Build 32)` | [`stages/stage-28.3-envar-storage-container/`](./stages/stage-28.3-envar-storage-container/prompt.md) | `modules/02-vault-workspace/01-shell-and-list/`, `specs/storage/database-schema.md`, `specs/crypto/shellcryption-spec.md` | ⚪ Queued |
| **Stage 28.4** | `v0.0.3.0 (Build 32)` | [`stages/stage-28.4-reactive-river-sse/`](./stages/stage-28.4-reactive-river-sse/prompt.md) | `modules/02-vault-workspace/01-shell-and-list/`, `specs/network/routes-and-contracts.md`, `specs/architecture/architecture.md` | ⚪ Queued |
| **Stage 29** | `v0.0.3.1 (Build 33)` | [`stages/stage-29-dual-homed-magicdns/`](./stages/stage-29-dual-homed-magicdns/prompt.md) | `modules/06-settings/`, `modules/07-superlobster-admin/02-transport-and-mobile-pairing/`, `specs/architecture/architecture.md` | ⚪ Queued |
| **Stage 30** | `v0.0.3.2 (Build 34)` | [`stages/stage-30-offline-delta-journal/`](./stages/stage-30-offline-delta-journal/prompt.md) | `modules/02-vault-workspace/{01,02}/`, `specs/storage/database-schema.md`, `specs/network/routes-and-contracts.md` | ⚪ Queued |
| **Stage 31** | `v0.0.3.3 (Build 35)` | [`stages/stage-31-p2p-direct-reef-sync/`](./stages/stage-31-p2p-direct-reef-sync/prompt.md) | `modules/05-import-export-habitat/`, `specs/network/routes-and-contracts.md`, `specs/crypto/key-hierarchy-spec.md` | ⚪ Queued |
| **Stage 32** | `v0.0.3.4 (Build 36)` | [`stages/stage-32-hardware-enclave/`](./stages/stage-32-hardware-enclave/prompt.md) | `modules/01-auth-gateway/`, `modules/02-vault-workspace/04-lock-and-multi-account/`, `specs/crypto/key-hierarchy-spec.md` | ⚪ **ERA 2 CULMINATION** |

---

## 3. Active Stage Pointer

- **Current Active Stage:** `Stage 28.1 (Sub-Phase 28.1): Core Cryptography, Admin Plane & Identity Envar Hardening (Tasks 55 & 56)`
- **Location:** [`.agents/skills/project/stages/stage-28.1-envar-core-crypto/prompt.md`](./stages/stage-28.1-envar-core-crypto/prompt.md)
- **Master Schedule:** [`.agents/skills/project/ROADMAP-ERA2.md`](./ROADMAP-ERA2.md)

---

## 4. The Molt Protocol (Strictly Scoped Pruning)

When Stage XX satisfies its automated Cloud CI gate, passes the **Dual-Testing Teamwork** live physical verification with Lucas, and merges to `main`:
1. Remove **ONLY** `.agents/skills/project/stages/stage-XX/`. Never remove files inside `modules/` or `specs/`.
2. Mark Stage XX as `🟢 PRUNED (Commit <hash>)` in the matrix above and advance the Active Stage Pointer to the next lowest directory in `stages/`.
3. Update the task checkboxes and rolling window in [`ROADMAP-ERA2.md`](./ROADMAP-ERA2.md).
