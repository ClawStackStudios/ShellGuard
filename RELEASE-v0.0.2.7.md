# 🦞 ShellGuard — Release v0.0.2.7 (Build 29)
> **"Habitat Full-Archive Mobility & Reactive Ingestion Dock"** — Phase 25: Streamed Zero-Knowledge ZIP Packaging, Constant-Memory Ingestion, Two-Stage Abyssal Dock & Container Inotify Polling

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

Welcome to **v0.0.2.7 (Build 29)** of **ShellGuard**! This milestone delivers complete vault sovereignty and seamless archive portability, outmatching industry reference vaults with our **Habitat Full-Archive Mobility Engine**. We have resolved both halves of the encrypted attachment packaging challenge: client-side zero-knowledge streamed export that packages entire vaults alongside all decrypted binary attachments in constant memory, and a reactive **Two-Stage Ingestion Pipeline** that unpacks primary credentials in under 2 seconds while offloading bulk binary attachments to a persistent, non-blocking **Abyssal Ingestion Dock**.

Additionally, this release hardens the test oracle with **Auditor Battery Additions** (Classes L2 & L6 schema and quota enforcement) and implements robust container file-watching ergonomics (`usePolling: true`) to conquer kernel inotify instance limits in containerized and development environments.

---

## 💎 Key Themes & Highlights

### 📦 1. Streamed Zero-Knowledge ZIP Packaging (Task 49)
- **Constant-Memory Generator (`src/lib/habitatExport.ts`)**: Generates multi-gigabyte ZIP archives with strict $O(\text{largest single file})$ browser memory bounds using asynchronous Web Streams and `client-zip`, completely avoiding catastrophic browser tab crashes or memory allocation spikes.
- **Deterministic Collision-Proof Layout**: Standardizes archive structures into a human-readable, safe hierarchy:
  `attachments/<pod>/<item_title>__[<id_short>]/<file_name>`
  guarded by `sanitizePathComponent` against path traversal (`../`) and illegal filesystem characters.
- **Root Attachment Manifest**: Embeds an atomic manifest within `shellguard_vault_export.json` containing each attachment's unique ID, relative file path, parent item association, byte size, and cryptographic checksum.
- **Zero-Knowledge Decryption**: The server is never exposed to decrypted bytes; all chunked BLOBs are streamed from SQLite storage and decrypted client-side using the active session `shellKey` under ClawKey challenge verification.

### ⚡ 2. Two-Stage Ingestion Pipeline & Abyssal Dropzone (Task 50)
- **Universal Archive Sniffer (`src/lib/habitatSniffer.ts`)**: The unified dropzone accepts `.zip` archives or unzipped directory structures, immediately detecting Habitat archives and parsing the central directory in-memory via `fflate` to extract the primary JSON payload.
- **Stage 1 (Instant Vault Ingestion, <2s)**: Commits all primary credentials (passwords, notes, SSH keys) atomically via `POST /api/vault/bulk-import` within 2 seconds. Items render immediately in the user's dashboard and sidebar pod tree without waiting for bulk attachments.
- **Stage 2 (Non-Blocking Attachment Queue)**: Dispatches detected attachments to a persistent background ingestion queue, leaving the user completely unblocked to browse, search, and edit vault items.

### 🌊 3. Abyssal Ingestion Dock & Reactive Item State (Task 50)
- **Floating Modernist Dock (`src/components/Vault/AbyssalIngestionDock.tsx`)**: Minimized floating dock anchored in the bottom-right viewport of `VaultShell.tsx`, rendering real-time batch progress (`Ingesting Attachments • 3 of 12 completed (28%) [████░░░░]`).
- **Comprehensive Queue Ergonomics**: Built-in expand/collapse inspection, queue pause, resume, cancel-all, and per-item retry controls.
- **Bioluminescent Reactive Chips**: In `ItemDetailPane.tsx` and `ItemListPane.tsx`, items with attachments currently in-flight display glowing pulsing status indicators (`📎 filename (Uploading 45%...)`) that seamlessly transition to `📎 Verified` upon completion without requiring a page refresh.
- **Lifecycle Protection**: Configured `beforeunload` browser listeners to prevent accidental window closure or navigation loss while uploads remain active.

### 🛡️ 4. The Auditor's Battery Additions (Classes L2 & L6)
- **Class L2 (Schema Table Verification)**: Automated build gate in `tests/build-gates.test.ts` verifying that core database tables declared in `src/server/db/schema.ts` strictly match active migration files (`0001_initial.up.sql` and `0005_attachment_blobs.up.sql`).
- **Class L6 (Storage Limit Verification)**: Enforces symmetric synchronization between code reality and documentation for file ceilings (`MAX_ATTACHMENT_BYTES = 500MB`) and grotto storage capacities (`GROTTO_QUOTA_BYTES = 1000MB`) across `src/lib/attachmentUtils.ts`, `src/server/routes/attachments.ts`, and markdown documentation.

### 🛠️ 5. Container File-Watcher Hardening (`server.watch.usePolling`)
- **Kernel Inotify Exhaustion Protection**: Diagnosed and resolved `EMFILE: too many open files` watcher crashes caused by container kernel constraints (`/proc/sys/fs/inotify/max_user_instances = 128`).
- **Vite Polling Integration**: Configured `server.watch.usePolling: true` (with 1,000ms stat poll interval and binary/git directory exclusions) in `vite.config.ts`. Provides 100% resilient HMR and startup reliability in resource-constrained Docker, Kubernetes, and local LAN dev environments.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     🌐 ShellGuard Web Client                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   Habitat Dropzone & Ingestion Sniffer (fflate)                   │  │
│  │   Extracts shellguard_vault_export.json (<2s)                     │  │
│  └──────────────────┬────────────────────────────────┬───────────────┘  │
│                     │ Stage 1 (Instant)              │ Stage 2 (Queue)  │
│                     ▼                                ▼                  │
│  ┌───────────────────────────────────┐  ┌────────────────────────────┐  │
│  │   POST /api/vault/bulk-import     │  │   Abyssal Ingestion Dock   │  │
│  │   (Atomic Primary Record Commit)  │  │   (Floating Queue Manager) │  │
│  └──────────────────┬────────────────┘  └────────────┬───────────────┘  │
└─────────────────────┼────────────────────────────────┼──────────────────┘
                      │                                │ Multipart Streams
                      ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              🔌 Express 5 Security Kernel & Storage Bedrock             │
│  ┌───────────────────────────────────┐  ┌────────────────────────────┐  │
│  │   SQLite Bedrock (WAL Mode)       │  │   vault_secure_attachments │  │
│  │   Atomic Multi-Status Commit      │  │   AES-256-GCM BLOB Streams │  │
│  └───────────────────────────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Sequence Flow: Two-Stage Habitat Ingestion

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Client as ShellGuard React Client
    participant Dock as Abyssal Ingestion Dock
    participant Server as Express Security Kernel
    participant DB as SQLite Bedrock

    User->>Client: Drop Habitat .zip Archive
    Client->>Client: sniffHabitatArchive() scans central directory via fflate
    Client->>Client: Extract shellguard_vault_export.json
    Client->>User: Display Stage 1 Preview (Instant breakdown)
    User->>Client: Confirm Import
    Client->>Server: POST /api/vault/bulk-import (Primary Records)
    Server->>DB: Atomic Transactional COMMIT
    Server-->>Client: 207 Multi-Status / 201 Created
    Client->>User: Unlock Dashboard (Items visible immediately)
    Client->>Dock: Enqueue attachments into globalIngestionQueue
    Dock-->>User: Render floating Abyssal Ingestion Dock & in-flight chips

    loop Background Attachment Ingestion
        Dock->>Server: POST /api/attachments (Multipart ShellCryption payload)
        Server->>DB: INSERT into vault_secure_attachments
        Server-->>Dock: 201 Created { id, parent_id }
        Dock->>Client: Update item attachment state -> "Verified"
    end
```

---

## 🔐 Cryptographic Breakdown & Memory Bounds

| Dimension | Implementation | Verification & Security Guarantee |
|:---|:---|:---|
| **Export Memory Footprint** | Asynchronous generator with `client-zip` | Strictly bounded to $O(\text{largest single file})$; zero archive-scale RAM accumulation. |
| **Path Safety** | `sanitizePathComponent` & deterministic pod naming | Traversal characters (`../`, `\`, `:`), control chars, and null bytes stripped. |
| **Zero-Knowledge Guarantee** | Client-side WebCrypto AES-256-GCM | Encrypted BLOBs transferred directly; server holds only opaque ciphertext blobs. |
| **Authentication Gate** | Active session ClawKey challenge | Export is gated behind master credential verification to prevent unauthorized dumps. |
| **Schema Invariant** | Class L2 & L6 automated test gates | Guarantees code limits match documented limits (500MB single file, 1000MB grotto quota). |

---

## 🧪 Verification & Test Oracle Summary

All test suites execute sequentially with 100% green status across both local harnesses and GitHub Actions cloud runners:

- **Total Test Suites**: `30 suites` (sequential execution via `fileParallelism: false`)
- **Total Test Cases**: `350+ passing assertions`
- **Cloud CI Pipeline**: Run `#39203270400` passed 100% green on `stage/phase-25-habitat-mobility`.
- **Targeted Suite**: `tests/unit/habitat-export.test.ts` verified round-trip export streaming, deterministic path layout, duplicate filename disambiguation, and zero memory leaks.

```bash
# Automated Cloud CI Verification Run
Run ID: 39203270400
Branch: stage/phase-25-habitat-mobility
Workflow: CI / Automated Verification Gates
Verdict: 100% Green (Lint, Vitest 30 Suites, Vite Build, Docs:Build)
```

---

## 🚀 Migration & Deployment Guide

This release is **100% non-breaking** and fully backward-compatible with all existing ShellGuard deployments:

1. **Database Schema**: No new database migration files required. Operates seamlessly on existing Migration 0009 (`0009_attachment_integrity`).
2. **Environment Variables**: No mandatory changes to `.env`. Optional variables:
   - `ATTACHMENT_MAX_MB`: Defaults to `500`.
   - `GROTTO_QUOTA_MB`: Defaults to `1000`.
3. **Container Update**: Pull latest image or rebuild with `docker compose build`. The new polling watcher configuration in `vite.config.ts` ensures immediate stability across all Docker and container configurations.

---

## 📜 Ledger of Commits (Phase 25)

```text
2c36a1d fix(dev): configure usePolling in vite.config.ts to avoid container inotify EMFILE exhaustion
44d71d6 fix(vault): preserve spaces in sanitizePathComponent and normalize cleanTitle in buildHabitatAttachmentRelativePath
f89292e fix(vault): align habitat path sanitization and async queue event-loop timing
4736613 feat(vault): implement habitat full-archive mobility & reactive ingestion dock
0ee54cb chore(jules): pre-heat Phase 25 task files, domain knowledge and TODO anchors
```

---

<div align="center">

```
    Built with 🛡️ by ClawStack Studios©™
    Exoskeletal Protection for Human + Agent Secrets
```

</div>
