# 🦞 ShellGuard — Release v0.0.2.5

> **"The Bitwarden Item Integrity & Relational Molt"** — Phase 23: Bitwarden-Model Item Integrity, Attachment Parent Enforcement & Dashboard Type Truth  
> **ClawStack Studios ©™** · 2026-10-17 · AGPL-3.0

The reef ascends to total relational integrity. ShellGuard **v0.0.2.5 (Build 27)** aligns the vault data model strictly with the **Bitwarden Item Integrity Model** — enforcing that binary attachments are strictly child components of parent vault items, quarantining orphaned attachments non-destructively, validating note credential rejection, ensuring transactional relational cascades, exposing pre-flight storage quota capacity, and polishing the Vault Dashboard for pure type-truthfulness.

```text
███████╗██╗   ██╗███████╗██╗     ██╗              ██████╗   ██╗   ██╗   █████╗    ██████╗     ██████╗ 
██╔════╝██║   ██║██╔════╝██║     ██║              ██╔═══╝   ██║   ██║  ██╔══██╗  ██╔══██╗    ██╔══██╗
███████╗███████║█████╗   ██║     ██║              ██║ ███╗  ██║   ██║  ███████║  ██████╔╝    ╚════██║
╚════██║██╔══██║██╔══╝   ██║     ██║              ██║   ██║  ██║   ██║  ██╔══██║  ██╔══██╗     █████╔╝
███████║██║   ██║███████╗███████╗███████╗  ╚██████╔╝╚██████╝  ██║   ██║  ██║   ██║    ██╔═══╝ 
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═════╝   ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═╝    ███████╗
                                              ~ **ClawStack Studios©™** ~
```

---

## 🚀 The Core Summary

Welcome to **v0.0.2.5 (Build 27)** of **ShellGuard**! This release establishes end-to-end structural fidelity between the frontend interface and the Bedrock database schema. In adherence to the Bitwarden Item Integrity Model, binary attachments can never be created as standalone vault records—they exist solely as encrypted child components bound to a parent item (Passwords, Credit Cards, Identities, Secure Notes, and SSH Keys). Orphaned or unparented attachments are swept into a safe, non-destructive quarantine ledger with forensic audit logging, while deleted attachments cleanly cascade out of parent reference arrays.

---

## 💎 Key Themes & Highlights

### 🛡️ 1. Bitwarden-Model Item Integrity & Parent Enforcement (Task 45)
- **Mandatory Parent Linkage (`src/server/routes/attachments.ts`)**: The `POST /api/attachments` endpoint now strictly requires valid `parent_id` and `parent_type` fields (`pearl`, `note`, `key`). Standalone attachment creation is structurally forbidden and returns `400 Bad Request`.
- **Atomic Transaction Linkage**: When an attachment is uploaded, the parent item's `attachments` JSON ID array is updated within the exact same database transaction, eliminating partial creation states.
- **Migration 0009 (`0009_attachment_integrity.up.sql`)**: Applied schema upgrades to `vault_secure_attachments` enforcing parent association columns and indices.
- **Zero-Knowledge Invariant Preserved**: Attachment payloads (`file_data`) remain opaque AES-256-GCM ShellCryption BLOBs. The server enforces relationship integrity without ever inspecting decrypted file bytes.

### 🧹 2. Non-Destructive Orphan Attachment Quarantine & Audit Logging
- **Boot & Runtime Sweeper (`src/server/utils/attachmentIntegrity.ts`)**: Built `quarantineOrphanAttachments()` which scans for unparented or dangling attachment records and flags them `is_quarantined = 1`.
- **Sacred Data Protection**: Quarantined attachments are hidden from standard vault lists and download routes, but are **never silently deleted**. User data remains preserved on disk.
- **Forensic Audit Redaction**: Every quarantine action records an `ATTACHMENT_QUARANTINED` event in the segregated `audit.sqlite` database.

### ⚡ 3. Relational Cascading, Sweeper & Pre-Flight Quota (Sub-Stage 25.1)
- **Relational Cascade on Delete**: Calling `DELETE /api/attachments/:id` atomically removes the deleted attachment's ID from its parent item's `attachments` JSON array across `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys`, preventing dangling ghost IDs.
- **On-Demand Runtime Sweeper Endpoint**: Exposed `POST /api/attachments/quarantine/sweep` for administrators and maintenance workflows to sweep and isolate orphaned attachments on demand without rebooting the server.
- **Pre-Flight Quota Inspection**: Exposed `GET /api/attachments/quota` returning `{ used_bytes, quota_bytes, remaining_bytes }` based on `GROTTO_QUOTA_MB`, enabling client dropzones to pre-validate available space before initiating uploads.

### 🔒 4. Note Credential Rejection Invariant
- **Form-Contract Guard (`src/server/validation/schemas.ts`)**: Secure Notes strictly reject payloads containing credential fields such as `secret`. Secure Notes remain purely document and markdown ledgers, preventing improper credential leakage.

### 🎨 5. Dashboard Type Truth & Add-Menu Correction (Task 46)
- **Add-Menu Simplification (`Header.tsx`)**: Removed the `'📎 Attachment'` entry from the `+` Add Item dropdown menu. Attachments are created and managed exclusively within their parent item's modal.
- **Item List Type Truth (`ItemListPane.tsx`, `VaultShell.tsx`)**: Master item lists strictly present primary vault items (Passwords, Secure Notes, SSH Keys, Cards, Identities). Attachments render solely within their parent's detail pane.
- **Deterministic Type Ordering**: Items sort predictably by type: Passwords → Cards → Identities → Secure Notes → SSH Keys, with recency sorting within each group.

### 📜 6. Canonical Root AGENTS.md Governance Contract
- **High-Agency Skill-Seed**: Established repository root `AGENTS.md` articulating project philosophy, core invariables, immutable rules, architecture mapping seams, and tool bindings.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                 🌐 Client Layer (React 19 + Vite 6)                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │    Header Add-Item +    │  │          ItemListPane                │  │
│  │ (Passwords, Cards,      │  │ (Deterministic Type Sort Order:      │  │
│  │  Identities, Notes,     │  │  Passwords → Cards → Identities →    │  │
│  │  SSH Keys — No Atts)    │  │  Notes → SSH Keys)                   │  │
│  └───────────┬─────────────┘  └──────────────────┬───────────────────┘  │
│              │                                   │                      │
│              ▼                                   ▼                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    ItemDetailPane / ItemFormModal                 │  │
│  │ (Attachments bound strictly as children to parent item's JSON ID) │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │ (REST with Parent Linkage)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              🔌 Server & API Layer (Express 5 Security Kernel)          │
│  ┌───────────────────────────────────┬───────────────────────────────┐  │
│  │ POST /api/attachments             │ DELETE /api/attachments/:id   │  │
│  │ (Requires parent_id + parent_type)│ (Cascades parent JSON IDs)    │  │
│  ├───────────────────────────────────┼───────────────────────────────┤  │
│  │ POST /api/attachments/quarantine  │ GET /api/attachments/quota    │  │
│  │ (Runtime sweep orphaned records)  │ (Returns quota capacity stats)│  │
│  └───────────────────────────────────┴───────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 🗄️ Bedrock Storage (SQLite + SQLCipher)                 │
│  ┌───────────────────────────┐       ┌───────────────────────────────┐  │
│  │ vault_secure_attachments  │ <───> │ vault_pearls / notes / keys   │  │
│  │ (parent_id, parent_type,  │       │ (attachments JSON ID array    │  │
│  │  is_quarantined)          │       │  updated in transaction)      │  │
│  └───────────────────────────┘       └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Verification Receipts

- **Unit & Integration Test Oracle**: 29 test suites, 341 tests passing 100% green (1 skipped).
- **TypeScript Strict Check**: `tsc --noEmit` passed with 0 errors.
- **Production Vite Build**: Compiled cleanly without warnings or errors.
- **VitePress Documentation Portal**: Built cleanly in 100% compliance with Docs-as-Code.
- **Cloud CI Pipeline**: GitHub Actions Run `#39023257850` passed 100% green across all verification matrices in 1m 32s.
