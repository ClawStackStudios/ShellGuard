# 🦞 ShellGuard — Release v0.0.1.3

## *Exoskeletal Sovereign Zero-Knowledge Protection & Resilient Vault Backups*

```text
███████╗██╗  ██╗███████╗██╗     ██╗      ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
██╔════╝██║  ██║██╔════╝██║     ██║     ██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
███████╗███████║█████╗  ██║     ██║     ██║  ███╗██║   ██║███████║██████╔╝██║  ██║
╚════██║██╔══██║██╔══╝  ██║     ██║     ██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
███████║██║  ██║███████╗███████╗███████╗╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
                          ~ **ClawStack Mobile Studios©™** ~ 
```

---

## 🚀 The Core Summary

Welcome to the **v0.0.1.3 Genesis Hotfix** of **ShellGuard**! This release builds directly on the v0.0.1 Genesis Release to resolve critical deployment blockers found in non-secure HTTP environments (like local Unraid server instances). We've fortified the cryptographic pipeline with a custom multi-tier RFC 4122 v4 UUID generator to bypass Chromium's `crypto.randomUUID()` restrictions on HTTP, eliminated `data:` URI download blocks by transitioning to in-memory `Blob` object URLs, integrated official SVG iconography/favicons, cleaned up documentation hygiene, and introduced a strict, automated **Full Development Loop** to ensure continuous code and memory-bank integrity.

---

## 💎 Key Themes & Highlights

### 🩹 1. Origin Safety & Deployment Resilience (v0.0.1.2 - v0.0.1.3)
* **Iconography & Favicon:** Integrated official `shellguard-icon.svg` as root `public/favicon.svg`, linked in Vite's `index.html`, and updated the Unraid container template icon path.
* **Documentation Hygiene:** Purged legacy data-wiping migration text and outdated `v0.2.0` references across all docs.
* **Insecure Origin UUID & Entropy Fallback:** Added a multi-tier RFC 4122 v4 UUID generator and secure entropy fallback in `src/lib/crypto.ts` for non-secure HTTP browser origins where `window.crypto.randomUUID` is undefined.
* **LAN HTTP Insecure File Downloads:** Replaced raw `data:` URI links with in-memory `Blob` and `URL.createObjectURL(blob)` in `downloadIdentityFile` and `downloadAttachment` to eliminate Chromium insecure-connection download blocks on LAN deployments.
* **Full Development Loop Automation:** Established strict `.agents/workflows` for `start-task`, `finish-task`, and `version-update` to enforce branch isolation, documentation hygiene (`docs-hygiene.md`), and three-layer verification checks on all future commits.

### 🛠️ 2. Bitwarden-Style Master-Detail Dashboard & Modern UI (v0.0.1)
* **Responsive Master-Detail Split (`VaultShell`):** Transitioned away from tab-based views into a clean two-pane layout featuring `ItemListPane` (searchable/filterable stream) and `ItemDetailPane`.
* **Live 30-Second TOTP Countdown:** Integrated dynamic visual timer rings with high-visibility countdowns that automatically copy TOTP codes upon click.
* **Unified Modal Creation (`ItemFormModal`):** Consolidated all login, note, SSH key, and attachment forms into an unified modal overlay with inline drag-and-drop file attachment staging.

### 💾 3. Disaster Resilience & Dual-Layer Failsafe Backups (v0.0.1)
* **Live SQLite Online Backup Snapshots:** SuperLobster admin plane incorporates SQLite Online Backup API integration to take point-in-time consistent physical snapshots without downtime.
* **Manifest & Key Attestation:** Every automated backup creates a tamper-evident JSON manifest recording SHA-256 file hashes, timestamps, and active encryption keys.
* **Client-Side Encrypted Exports:** Sovereign user-controlled vault archives export all pearls, TOTP seeds, notes, SSH keys, and encrypted attachments behind re-authentication gates.

### 🦞 4. Multi-User Orchestration & In-Place Quick Unlock (v0.0.1)
* **Seamless In-Place Re-Auth (`QuickLoginModal`):** Dropping session or locking an account displays a non-destructive modal overlay directly over the dashboard, preserving user context.
* **Reactive ShellKey Lifecycle:** Vault items and agent keys decrypt automatically the instant a cryptographic key is derived, and all in-memory plaintext credentials are immediately purged upon locking.

### 🐚 5. Pure User-Driven Pod Hierarchy (v0.0.1)
* **Zero Hardcoded Default Pods:** Completely eliminated phantom/hardcoded categories. Pods exist purely when created by users or referenced by vault items.

### 📎 6. Encrypted Attachments & LobsterKeys AI Access (v0.0.1)
* **Reference Model Attachments:** Large files (up to 10 MB each) are encrypted client-side with independent AAD and stored in `vault_secure_attachments`.
* **Autonomous AI Keys (`lb-`):** Issue granular, revocable, rate-limited LobsterKeys with fine-grained access policies so AI agents can query specific secrets.

### 👑 7. SuperLobster Instance Administration Plane (v0.0.1)
* **Token-Gated Admin Portal (`/#/super-lobster`):** Sovereign control plane gated by `ADMIN_TOKEN` featuring instance health diagnostics and metrics.
* **Transactional Cascade Deletion:** Safely offboard user accounts with multi-step safeguards that cleanly delete all linked data in a single transaction.

---

## 🏗️ Architectural Topology Map

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         🌐 Client Layer (React 19 + Vite)                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │     VaultShell.tsx    │  │    ItemListPane.tsx   │  │  ItemDetailPane.tsx  │  │
│  │   [Master Orchestrator]  │ [Search & Category Feed] │ [Inspector & Actions]│  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────────┬───────────┘  │
│              └──────────────────────────┼─────────────────────────┘              │
│                                         │ AES-GCM-256 Client-Side Encryption      │
│                                         ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                     QuickLoginModal / ItemFormModal                        │  │
│  └──────────────────────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────────────────────┼────────────────────────────────────────┘
                                          │ REST API over HTTPS / Cookie Auth
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                 🔌 Middleware & Server Layer (Node 22 + Express 5)               │
│  ┌───────────────────────────────┐     ┌──────────────────────────────────────┐  │
│  │      requireAuth / Admin      │     │       FieldEncryption (AES-256-GCM)  │  │
│  │   [Volatile Session Security] │     │      [Per-Row Metadata Encryption]   │  │
│  └───────────────┬───────────────┘     └──────────────────┬───────────────────┘  │
└──────────────────┼────────────────────────────────────────┼──────────────────────┘
                   │                                        │
                   ▼                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     🖥️ Storage Layer (SQLite + SQLCipher)                        │
│  ┌─────────────────────────────────┐     ┌────────────────────────────────────┐  │
│  │    db.sqlite (SQLCipher 256)    │     │   audit.sqlite (Append-Only Log)   │  │
│  │  [Pearls, Notes, Keys, Files]   │     │    [Redacted Mutation History]     │  │
│  └────────────────┬────────────────┘     └─────────────────┬──────────────────┘  │
│                   └──────────────────────┬─────────────────┘                     │
│                                          │ Online Backup API Snapshots           │
│                                          ▼                                       │
│                         📂 DATA_DIR/backups/ (Manifest + Keys)                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Commit Ledger (v0.0.1 -> `v0.0.1.2`)

* `841e0d7` — **merge:** add full development loop rules and workflows
* `753c913` — **chore:** add full development loop rules and workflows
* `7d513b0` — **chore:** bump version to 0.0.1.2 for deployment hotfixes

*(See RELEASE-v0.0.1.md in history for earlier commits)*

---

## ⚡ Deployment & Upgrade Instructions

### Using Local Dev Mode

```bash
git clone https://github.com/ClawStackStudios/ShellGuard.git
cd ShellGuard
npm ci
cp .env.example .env
npm run scuttle:dev-start
```

- **Frontend (Vite UI):** [http://localhost:6464](http://localhost:6464)
- **Backend (Express API):** [http://localhost:6565](http://localhost:6565)

### Using Docker / Container Orchestration

Run directly using the pre-configured compose stack:

```bash
docker compose up -d --build
```

Or pull the published GHCR image:

```bash
docker run -d \
  --name shellguard \
  -p 6464:6464 \
  -v ./data:/app/data \
  -e NODE_ENV=production \
  -e DB_ENCRYPTION_KEY="your-openssl-generated-key" \
  ghcr.io/clawstackstudios/shellguard:latest
```

---

*Hatch your vault. Guard your pearls.*

**Maintained by ClawStack Mobile Studios©™ under AGPL-3.0 license.**
