# 🦞 ShellGuard — Release v0.0.1

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

Welcome to the **v0.0.1 Genesis Release** of **ShellGuard**! This initial public release represents the complete, verified realization of a sovereign, self-hosted zero-knowledge secrets vault crafted for humans and autonomous AI agents alike. Born from real-world disaster recovery principles, ShellGuard pairs military-grade triple-layer cryptographic security (client-side AES-GCM-256 + per-row AES-256-GCM metadata encryption + SQLCipher storage) with a high-performance, Bitwarden-inspired Master-Detail interface, multi-account orchestration, zero hardcoded pods, and rock-solid SQLite snapshot backups.

---

## 💎 Key Themes & Highlights

### 🛠️ 1. Bitwarden-Style Master-Detail Dashboard & Modern UI
* **Responsive Master-Detail Split (`VaultShell`):** Transitioned away from tab-based views into a clean two-pane layout featuring `ItemListPane` (searchable/filterable stream) and `ItemDetailPane` (inspector with one-click secret reveal, custom favicons, and attachment streaming).
* **Live 30-Second TOTP Countdown:** Integrated dynamic visual timer rings with high-visibility countdowns that automatically copy TOTP codes upon click.
* **Unified Modal Creation (`ItemFormModal`):** Consolidated all login, note, SSH key, and attachment forms into an unified modal overlay with inline drag-and-drop file attachment staging.
* **Desktop Sidebar Controls:** Added collapsible desktop sidebar controls (`PanelLeftOpen`/`PanelLeftClose`) and responsive mobile navigation drawers.

### 💾 2. Disaster Resilience & Dual-Layer Failsafe Backups
* **Live SQLite Online Backup Snapshots:** SuperLobster admin plane incorporates SQLite Online Backup API integration to take point-in-time consistent physical snapshots of `db.sqlite` and `audit.sqlite` without downtime.
* **Manifest & Key Attestation:** Every automated backup creates a tamper-evident JSON manifest recording SHA-256 file hashes, timestamps, and active encryption key identifiers.
* **Offline CLI Recovery Protocol (`scuttle:restore`):** Backups are strictly read-only and insulated from remote tampering. Restorations are performed safely on host via the offline recovery CLI utility.
* **Client-Side Encrypted JSON & CSV Exports:** Sovereign user-controlled vault archives export all pearls, TOTP seeds, notes, SSH keys, and encrypted attachments behind re-authentication gates.

### 🦞 3. Multi-User Orchestration & In-Place Quick Unlock
* **Seamless In-Place Re-Auth (`QuickLoginModal`):** Dropping session or locking an account displays a non-destructive modal overlay directly over the dashboard, preserving user context and avoiding disruptive page refreshes.
* **State-Aware Navigation (`NavIntent`):** Hardened reload routing (`sg_nav_intent`) ensures explicit logouts ("Claw Out") return cleanly to the landing page, while locked sessions preserve the dashboard with quick re-login.
* **Reactive ShellKey Lifecycle:** Vault items and agent keys decrypt automatically the instant a cryptographic key is derived, and all in-memory plaintext credentials are immediately purged upon locking.

### 🐚 4. Pure User-Driven Pod Hierarchy
* **Zero Hardcoded Default Pods:** Completely eliminated phantom/hardcoded categories (`Personal`, `Work`). Pods exist purely when created by users or referenced by vault items.
* **Sub-Pod Cascading & Normalization:** Strict pod category path normalization (`normalizePod`) with automatic cascading when parent pods are modified.
* **Custom Themed In-Modal Deletion:** Replaced browser-native prompts with an animated, themed in-modal confirmation dialogue in `PodModal.tsx`.

### 📎 5. Encrypted Attachments & LobsterKeys AI Access
* **Reference Model Attachments:** Large files (up to 10 MB each) are encrypted client-side with independent AAD and stored in `vault_secure_attachments`, referenced by pearls as JSON ID arrays.
* **Autonomous AI Keys (`lb-`):** Issue granular, revocable, rate-limited LobsterKeys with fine-grained access policies so AI agents can query specific secrets without full vault compromise.

### 👑 6. SuperLobster Instance Administration Plane
* **Token-Gated Admin Portal (`/#/super-lobster`):** Sovereign control plane gated by `ADMIN_TOKEN` featuring instance health diagnostics, real-time uptime metrics, and strict-metadata audit logging.
* **Transactional Cascade Deletion:** Safely offboard user accounts with multi-step `expect` type-to-confirm safeguards that cleanly delete all linked pearls, notes, keys, and attachments in a single transaction.

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

## 📋 Commit Ledger (Genesis -> `v0.0.1`)

* `f029872` — **docs:** replace ASCII art logo with updated Unicode block text in README
* `2c4f79b` — **merge:** integrate Bitwarden-style master-detail dashboard UI
* `8e7c16d` — **feat:** refactor dashboard UI to Bitwarden-style master-detail architecture
* `c4d3e4b` — **merge:** integrate sidebar polish, zero-hardcoded pods, lock hardening, and attractor beacon
* `095f19a` — **docs:** integrate attractor beacon and data survival philosophy in README
* `916460c` — **feat:** vault lock hardening and state-aware navigation intent
* `af07c27` — **docs:** update root changelog with pod management and sidebar polish
* `2dfa76c` — **feat:** eliminate all hardcoded default pods and enable pure user-driven pod management
* `930375c` — **fix:** normalize pod categories, add optimistic deletion updates, and resolve type issues
* `6e33694` — **fix:** sidebar layout, pod management UI, and state sync bugs
* `f1694f2` — **feat:** extract Lobster Keys tab into dedicated component and update styling
* `2afb3b8` — **feat:** integrate current user identity into generator configuration
* `fba8424` — **refactor:** rename default issuer to ShellGuard and optimize TOTP UI/UX workflow
* `c14121d` — **feat:** add claw-in navigation and enhance login view with drag-and-drop file support

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
