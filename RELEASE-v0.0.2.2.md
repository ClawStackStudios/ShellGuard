# 🦞 ShellGuard — Release v0.0.2.2

> **"The Bioluminescent Reef"** — Phase 20: Vault Tagging System & Granular Filter Bar + 500MB Storage Ceiling + SSH Key Dual-Key Ergonomics  
> **ClawStack Studios ©™** · 2026-09-19 · AGPL-3.0

The reef glows brighter and grows wider. ShellGuard **v0.0.2.2 (Build 24)** delivers a flexible, multi-dimensional **Vault Tagging System** that works seamlessly alongside hierarchical Pods, unlocks a **500MB per-file attachment ceiling** (with 1000MB grotto quota), and introduces a purpose-built **SSH Key Dual-Key Architecture** engineered for terminal ergonomics and OpenSSH compliance.

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

Welcome to **v0.0.2.2 (Build 24)** of **ShellGuard**! This milestone empowers users to organize pearls, secure notes, and SSH keys across multiple categories using keyboard-friendly bioluminescent tags, run instant multi-tag intersection queries (`AND` / `OR`), upload large encrypted assets up to 500MB per file, and deploy generated SSH keys directly to remote servers with one-click terminal commands.

---

## 💎 Key Themes & Highlights

### 🏷️ 1. Vault Tagging System & Granular Filter Bar (Phase 20, Tasks 39/40)
- **Database Migration `0006_vault_tags`**: Adds `tags TEXT DEFAULT '[]'` column and owner indices across `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys`.
- **Layer 2 MetadataGuard Encryption**: Tags are registered in `metadataGuard.ts` for per-row AES-256-GCM encryption on disk, preventing plaintext tag exposure in database backups while allowing authenticated server-side tag queries.
- **Intersection Querying & Scoped Search**: List routes (`GET /api/vault`, `GET /api/notes`, `GET /api/ssh-keys`) support `?tags=a,b` query parameter with ownership scoping and forensic audit logging (`audit_logs`).
- **`TagSelectorInput` Chips**: Autocomplete suggestions, keyboard navigation (Enter/Comma), and inline color palette selection matching the Reef Modernist design tokens.
- **Unified Bioluminescent Color Engine (`podUtils.ts`)**: Pods and tags share a deterministic color hashing algorithm (`hashStringToColor`) with user-specified overrides and headless test-environment safety.
- **Collapsible Sidebar Tag Cloud & Multi-Filter Bar**: Active tags render with item counts in `SidebarFolderTree.tsx`. The vault filter bar in `ItemListPane.tsx` allows compounding multiple tag filters with an interactive `AND` / `OR` toggle.

### 📎 2. 500MB Attachment Storage Ceiling (Phase 20 Sub-task)
- **10x File Size Expansion**: Elevated the per-file attachment upload ceiling from 50MB to **500MB** (`ATTACHMENT_MAX_MB`).
- **Grotto Storage Quota Doubled**: Owner storage quota increased from 500MB to **1000MB (1GB)** (`GROTTO_QUOTA_MB`).
- **Streaming Pipeline Validation**: Busboy multipart streaming handles 500MB payloads with mid-stream 413 abort on quota breach. Nginx reverse-proxy configuration guidance elevated to `550M` client body size.

### 🗝️ 3. SSH Key Dual-Key Architecture & Terminal Ergonomics (Phase 20 Sub-task)
- **Dual-Key Storage Envelope**: Generated keypairs serialize as `{ publicKey, privateKey }` JSON sealed client-side inside `key_value` under Layer 1 ShellCryption.
- **Zero-Migration Backward Compatibility**: `parseSshKeySecret()` automatically detects dual-key envelopes or legacy raw PEM keys, preserving existing vault credentials without database changes.
- **Strict RFC 7468 PEM Framing**: Private keys strictly preserve `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` delimiters in monospace `<pre>` blocks, eliminating formatting errors in OpenSSH (`ssh -i`) and Git.
- **High-Velocity Deployment Actions**:
  - **Copy Public Key**: One-click extraction of the OpenSSH public string (`ssh-ed25519 AAAAC3...`).
  - **Copy `authorized_keys` Command**: Instant copy of `echo "<pub>" >> ~/.ssh/authorized_keys` ready to paste directly into server shells.
  - **Download `.pem`**: Direct in-browser download of `<title>.pem` for command-line use.
- **Decoupled Form Inputs**: The item editor separates Private Key PEM and Public Key inputs, preventing JSON serialization leaks during edits.

### 📐 4. Master-Detail Header Flush & Dynamic Version Resolver Integrity
- **Flush Dashboard Headers**: Fixed 5px height discrepancy between search bar header and detail pane header, locking both to a shared 64px (`h-16`) height for a seamless continuous border.
- **Dynamic Version Resolver**: Server dynamic version resolver (`getAppVersion()`) ensures complete ground-truth alignment with `package.json`.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────┐
│             🌐 Client Layer (React 19 + Vite 6)              │
│  ┌────────────────────────┐     ┌────────────────────────┐  │
│  │   SidebarFolderTree    │     │      ItemListPane      │  │
│  │ (Pods + Tag Cloud)     │     │ (AND/OR Tag Filter Bar)│  │
│  └───────────┬────────────┘     └───────────┬────────────┘  │
│              │                              │               │
│              ▼                              ▼               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   ItemDetailPane                      │  │
│  │ (Layer 1 ShellCryption, SSH Dual-Key & PEM Download)  │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ (Opaque Ciphertext REST API)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             🔌 Server Layer (Express 5 + Helmet)            │
│  ┌───────────────────────┐     ┌─────────────────────────┐  │
│  │  requireAuth() Guard  │ ──> │   MetadataGuard (AES)   │  │
│  │  (?tags=a,b Filtering)│     │  (Layer 2 Tag Storage)  │  │
│  └───────────────────────┘     └────────────┬────────────┘  │
│                                             │               │
│                                             ▼               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tenant Isolation Filter (WHERE owner_uuid = ?)       │  │
│  │  Attachment Streaming (500MB Limit / 1000MB Quota)    │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          🖥️ Bedrock Storage (SQLite + Migration 0006)       │
│    (vault_pearls, vault_secure_notes, vault_ssh_keys tags)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Changes by Layer

| Component | Files | Description |
|:---|:---|:---|
| **Database Migrations** | `migrations/0006_vault_tags.{up,down}.sql` | Adds `tags TEXT DEFAULT '[]'` column and owner indices across pearls, notes, and SSH keys |
| **Server / API** | `src/server/routes/{vault,notes,sshKeys,attachments}.ts`, `src/server/utils/metadataGuard.ts` | Tag filtering (`?tags=a,b`), Layer 2 metadata encryption, 500MB attachment limits, audit logging |
| **Frontend / UI** | `src/components/Vault/{TagSelectorInput,SidebarFolderTree,ItemListPane,ItemDetailPane,ItemFormModal}.tsx` | Autocomplete chips, tag cloud, AND/OR filter bar, dual-key SSH UI, and PEM actions |
| **Shared Libraries** | `src/lib/{podUtils,keyGen,attachmentUtils,tagUtils}.ts` | Unified color engine, SSH dual-key serialization/parsing, terminal command formatters |
| **Documentation Portal** | `docs/vault-features/{the-grotto,attachments,index}.md`, `docs/reference/blueprint-schema.md` | Comprehensive user and architectural documentation for tags, attachments, and SSH dual-key management |
| **Test Oracle** | `tests/vault-tags.test.ts`, `tests/unit/keyGen.test.ts`, all 20 test files | 100% green test coverage (248 passed, 1 skipped) |

---

## 🧪 Verification & Build Gates

- **Test Oracle**: **20/20 test suites passing** (`248 passed`, `1 skipped`, `0 failures`).
- **Typecheck & Linter**: `tsc --noEmit` clean with zero errors.
- **Production Build**: `vite build` compiled cleanly.
- **Documentation Portal**: `vitepress build docs` compiled cleanly in 106s with zero broken links.
- **Link & Diagram Integrity**: `docsLinks.test.ts` (5/5) and `mermaidDiagrams.test.ts` (5/5) passing.

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
git checkout v0.0.2.2
npm install
npm run build
npm run scuttle:prod
```

---

*Your reef. Your keys. Your secrets.* — **Trust the Shell.** 🦞
