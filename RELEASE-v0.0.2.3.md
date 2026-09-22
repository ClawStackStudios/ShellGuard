# 🦞 ShellGuard — Release v0.0.2.3

> **"The Deep Ingestion & Vault Parity Molt"** — Phase 21: Bulk Operations, Universal Bitwarden Ingestion, RFC 6238 TOTP, Dual Export Suite & Migration 0008 Note Attachments Parity  
> **ClawStack Studios ©™** · 2026-09-22 · AGPL-3.0

The reef expands its reach into deeper currents. ShellGuard **v0.0.2.3 (Build 25)** delivers a battle-tested **Multi-Select Batch Operations Suite**, a **Universal Bitwarden Ingestion Engine** with interactive dry-run previews, client-side **RFC 6238 TOTP generation**, **Password History** auditing, **Dual Export** sovereignty (Encrypted JSON + Plaintext CSV/JSON), and **Migration 0008 Note Attachments Parity** unlocking 500MB encrypted attachments for Secure Notes alongside Pearls.

```text
███████╗██╗   ██╗███████╗██╗     ██╗              ██████╗   ██╗   ██╗   █████╗    ██████╗     ██████╗ 
██╔════╝██║   ██║██╔════╝██║     ██║              ██╔═══╝   ██║   ██║  ██╔══██╗  ██╔══██╗    ██╔══██╗
███████╗███████║█████╗   ██║     ██║              ██║ ███╗  ██║   ██║  ███████║  ██████╔╝    ██║   ██║
╚════██║██╔══██║██╔══╝   ██║     ██║              ██║   ██║  ██║   ██║  ██╔══██║  ██╔══██╗    ██║   ██║
███████║██║   ██║███████╗███████╗███████╗  ╚██████╔╝╚██████╝  ██║   ██║  ██║   ██║   ██████╔╝
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═════╝   ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═╝   ╚═════╝
                                              ~ **ClawStack Studios©™** ~
```

---

## 🚀 The Core Summary

Welcome to **v0.0.2.3 (Build 25)** of **ShellGuard**! This release marks a pivotal evolution in vault ergonomics and data sovereignty. Users can now migrate entire vaults from Bitwarden or legacy CSV/JSON files with full folder-to-Pod mapping, preview import differences before committing, manage hundreds of vault items at once with sticky batch operations (moving pods, tagging, and bulk trash/deletion), track password change histories, generate two-factor authenticator codes directly inside the vault with live countdown rings, export encrypted or plaintext backups, and attach up to 500MB encrypted files to Secure Notes with complete cascade deletion guarantees.

---

## 💎 Key Themes & Highlights

### ⚡ 1. Multi-Select Batch Operations Suite (Phase 21, Task 42)
- **Sticky Multi-Selection Engine (`ItemListPane.tsx`)**: Checkbox selection mode maintains selected item states across sorting, filtering, and tag switching without accidental state loss.
- **Batch Pod Relocation (`POST /api/vault/bulk-pod`)**: Move multiple pearls, secure notes, and SSH keys to any destination Pod in a single atomic transaction.
- **Batch Tagging (`POST /api/vault/bulk-tags`)**: Compound or strip bioluminescent tags across dozens of items simultaneously, preserving existing metadata.
- **Batch Deletion (`POST /api/vault/bulk-delete`)**: Safely soft-delete or permanently purge batches of vault records with confirmation modals and automated selection cleanup.
- **Floating Action Bar**: Renders dynamically above the item feed when selections are active, offering one-click Pod, Tag, and Trash actions styled with Reef Modernist accents.

### 📥 2. Universal Bitwarden Ingestion & Multi-Format Importer (Phase 21, Task 41)
- **Universal Bitwarden JSON Ingestion (`src/lib/importers/bitwarden.ts`)**: Ingests Logins (Pearls), Secure Notes, Credit Cards, and SSH keys/Identities with folder structures mapped automatically to sovereign Pods.
- **ShellGuard Native JSON & CSV Formats**: Standardized parsers for importing and exporting complete encrypted or decrypted vault datasets.
- **Pre-Flight Dry-Run Diff Engine (`POST /api/vault/bulk-import?dry_run=true`)**: Provides an interactive preview before committing changes—displaying total items detected, valid items, duplicate collisions, and destination Pod breakdowns.
- **Client-Side Bulk Encryption**: All imported items are encrypted in the browser using AES-256-GCM Layer 1 ShellCryption before transit, ensuring zero-knowledge privacy across large payloads.

### ⏱️ 3. RFC 6238 Standardized TOTP Engine & Password History
- **Client-Side TOTP Generation (`src/lib/totpEngine.ts`)**: Built-in 2FA authenticator engine supporting RFC 6238 standards (SHA-1, SHA-256, SHA-512, 6 or 8 digits, 30s or 60s periods).
- **Live Countdown Ring & One-Click Copy**: Visual circular timer indicator in `ItemDetailPane.tsx` with one-click clipboard copy for seamless login workflows.
- **`otpauth://` URI Parsing**: Automatically parses secret keys, algorithms, digits, and periods from standard authenticator URIs during import or manual configuration.
- **Item Password Generation History**: Tracks up to 10 past password iterations per credential with timestamps sealed inside the encrypted payload, preventing lockouts during password rotation.

### 💾 4. Dual Export Suite (Encrypted & Plaintext)
- **Encrypted JSON Export**: Seals all vault credentials, notes, SSH keys, tags, and pod structures into an AES-256-GCM encrypted envelope keyed by the user's master password or a custom backup passphrase.
- **Decrypted Plaintext CSV/JSON Export**: High-friction confirmation modal with deliberate warning prompts allows exporting plaintext credentials for external migrations and physical cold storage.
- **Zero-Persistence Export Streams**: Data is processed purely in client-side memory using browser Blobs, preventing sensitive plaintext exposure on disk or server logs.

### 🗄️ 5. Migration 0008 Note Attachments Parity & Cascade Deletion
- **Database Migration `0008_note_attachments_parity.sql`**: Introduces `parent_note_id` to `vault_attachments` with foreign key constraints, giving Secure Notes full parity with Pearls.
- **500MB Encrypted Attachments for Notes**: Secure Notes now support full multipart streaming file uploads up to 500MB per file within the 1000MB owner quota.
- **Hardened Cascade Deletion**: Deleting a Pearl or Note automatically cascades to purge all associated encrypted disk chunks and database records.
- **Ghost Pod Cleanup**: Purging or relocating items automatically prunes unreferenced empty pods, preventing UI clutter.
- **UI Clarification**: Updated file size indicators to explicitly state `Attachments (max 500MB per attachment)`.

### 🛡️ 6. Native WebCrypto Acceleration & Seam Hardening
- **600,000 PBKDF2-SHA256 Iterations**: Hardware-accelerated key derivation via browser-native `crypto.subtle`, verified against RFC 6070 known-answer test vectors.
- **Interaction Seam Hardening**: Resolved modal dismissal leaks, deletion routing synchronization, and selection clearing across rapid UI operations.
- **Deterministic Documentation Walk (`walk-the-docs.md`)**: Established an automated workflow ensuring all root and portal documentation strictly adheres to codebase reality.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                 🌐 Client Layer (React 19 + Vite 6)                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   SidebarFolderTree     │  │          ItemListPane                │  │
│  │ (Pods, Tags, Bulk Mode) │  │ (Sticky Multi-Select & Action Bar)   │  │
│  └───────────┬─────────────┘  └──────────────────┬───────────────────┘  │
│              │                                   │                      │
│              ▼                                   ▼                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       ItemDetailPane                              │  │
│  │ (RFC 6238 TOTP Countdown, Password History, 500MB Note Attachments)│  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │      Client-Side Ingestion & Export Suite (WebCrypto PBKDF2)      │  │
│  │   (Universal Bitwarden JSON, Native CSV/JSON, Encrypted Exports)  │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │ (Opaque Ciphertext REST API)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 🔌 Server Layer (Express 5 + Helmet)                    │
│  ┌────────────────────────┐  ┌───────────────────────────────────────┐  │
│  │  requireAuth() Guard   │──│   Bulk Transactional Handlers         │  │
│  │  (Tenant Scope / Owner)│  │ (/bulk-import, /bulk-pod, /bulk-tags) │  │
│  └────────────────────────┘  └───────────────────┬───────────────────┘  │
│                                                  │                      │
│                                                  ▼                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Streaming Busboy Pipeline (500MB Limit / 1000MB Quota)           │  │
│  │  Cascade Deletion Coordinator (Disk Artifacts + Ghost Pod Purge)  │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              🖥️ Bedrock Storage (SQLite + Migration 0008)               │
│      (vault_pearls, vault_secure_notes, vault_ssh_keys, attachments)    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Changes by Layer

| Component | Files | Description |
|:---|:---|:---|
| **Database Migrations** | `migrations/0008_note_attachments_parity.{up,down}.sql` | Adds `parent_note_id` column to `vault_attachments` with foreign key and cascade deletion |
| **Server / API** | `src/server/routes/{vault,notes,attachments}.ts` | Bulk import/pod/tags/delete endpoints, note attachment streaming, ghost pod pruning |
| **Frontend / UI** | `src/components/Vault/{ItemListPane,ItemDetailPane,BulkImportModal,ExportModal,ItemFormModal}.tsx` | Sticky multi-select, floating bulk bar, TOTP countdown, password history, note attachments |
| **Shared Libraries** | `src/lib/{totpEngine,importers/bitwarden,exportUtils,crypto}.ts` | RFC 6238 TOTP engine, Bitwarden universal parser, encrypted export cipher, WebCrypto PBKDF2 |
| **Documentation Portal** | `docs/vault-features/{import-export,attachments,the-grotto}.md`, `docs/reference/blueprint-schema.md` | Comprehensive guides for bulk import/export, Bitwarden migration, and note attachments |
| **Workflows & Templates** | `.agents/workflows/walk-the-docs.md`, `.agents/templates/verificationChecklist.md` | Deterministic documentation parity audit workflow and verification checklist standard |
| **Test Oracle** | `tests/{bulk-operations,totp,bitwarden-import,note-attachments}.test.ts`, all 26 test files | 100% green test coverage (313 passed, 1 skipped) |

---

## 📋 Commit Ledger (Since `v0.0.2.2`)

* `f425025` — **docs:** synchronize documentation to reflect migration 0008 and add walk-the-docs workflow
* `18a3a5d` — **style:** clarify attachment upload ceiling to 500MB per attachment
* `cc0603c` — **fix:** post-verification hardening for live interaction seams and template tiers
* `767bd87` — **docs:** add comprehensive verification checklist template for automated and manual testing
* `a036bf6` — **fix(ui):** harden action seams, preserve metadata on pod/bulk operations and add seam tests
* `8e3224f` — **docs(rules):** formalize project hygiene, seam verification and live handshake protocol
* `6236184` — **chore:** add .agents/scratch to gitignore
* `c7ea531` — **fix(vault):** resolve item deletion routing, add confirmation dialog and clear selection state
* `68bc40e` — **docs(agents):** update activeContext with 285 tests passed and PBKDF2 test parity
* `1ca4c30` — **docs(cline):** update memory bank and decision log for Phase 21 review verification
* `02277e9` — **test(crypto):** add PBKDF2-SHA256 known-answer vectors and WebCrypto parity tests
* `f34997f` — **docs(agents):** synchronize Memory Bank and ROADMAP with Phase 21 Sub-Phase parity
* `baab110` — **feat(vault):** implement native PBKDF2 WebCrypto acceleration and 600,000 iterations
* `a72ce7d` — **feat(agents):** formalize home-directory boundaries for Antigravity
* `3b40008` — **docs:** synchronize root README, BLUEPRINT, and import-export guides with Phase 21
* `6f862e5` — **feat:** Phase 21 — Bulk Import Endpoint & Batch Operations (Tasks 41 & 42)
* `b461268` — **feat:** Bulk Import Endpoint & Batch Operations

---

## 🧪 Verification & Build Gates

- **Test Oracle**: **26/26 test suites passing** (`313 passed`, `1 skipped`, `0 failures`).
- **Typecheck & Linter**: `tsc --noEmit` clean with zero errors; ESLint passing.
- **Production Build**: `vite build` compiled cleanly.
- **Documentation Portal**: `vitepress build docs` compiled cleanly with zero broken links.
- **Link & Diagram Integrity**: Documentation and mermaid tests 100% green.

---

## 🚀 Upgrade & Verification Instructions

### Upgrading via Docker / Unraid
```bash
docker pull ghcr.io/clawstackstudios/shellguard:latest
docker restart shellguard
```

### Upgrading from Source
```bash
git fetch --tags
git checkout v0.0.2.3
npm install
npm run build
npm run scuttle:prod
```

---

*Your reef. Your keys. Your secrets.* — **Trust the Shell.** 🦞
