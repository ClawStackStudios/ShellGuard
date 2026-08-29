# 🛡️ ShellGuard

<div align="center">

```text
███████╗██╗  ██╗███████╗██╗     ██╗              ██████╗   ██╗   ██╗   █████╗    ██████╗     ██████╗ 
██╔════╝██║  ██║██╔════╝██║     ██║              ██╔═══╝   ██║   ██║  ██╔══██╗  ██╔══██╗    ██╔══██╗
███████╗███████║█████╗  ██║     ██║              ██║ ███╗  ██║   ██║  ███████║  ██████╔╝    ██║   ██║
╚════██║██╔══██║██╔══╝  ██║     ██║              ██║   ██║  ██║   ██║  ██╔══██║  ██╔══██╗    ██║   ██║
███████║██║  ██║███████╗███████╗███████╗  ╚██████╔╝╚██████╝  ██║   ██║  ██║   ██║   ██████╔╝
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═════╝  ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═╝   ╚═════╝
                                                  ~ **ClawStack Mobile Studios©™** ~
```

*Exoskeletal Protection for Human + Agent Secrets — a zero-knowledge vault where Humans and AI Lobsters guard their pearls together.*

</div>

---

[![build](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)](https://github.com/ClawStackStudios/ShellGuard/actions/workflows/docker-publish.yml)
[![Version](https://img.shields.io/badge/Version-v0.0.1.4-blue?style=for-the-badge)](CHANGELOG.md)
[![Zero-Knowledge](https://img.shields.io/badge/Vault-Zero_Knowledge-red?style=for-the-badge)](./SECURITY.md)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![SQLite](https://img.shields.io/badge/SQLite%20%2B%20SQLCipher-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge)](LICENSE)
[![ClawStack](https://img.shields.io/badge/ClawStack-Mobile_Studios-FF4500?style=for-the-badge&logo=gitlab&logoColor=white)](#)

---

## 📜 Table of Contents

<details>
<summary>Unfurl the Scroll 📜</summary>

- [About](#-about)
- [Architecture](#️-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with Docker](#-running-with-docker)
  - [Running Locally with npm](#-running-locally-with-npm)
- [Environment Variables](#️-environment-variables)
- [Key System](#-key-system)
- [Encryption Model](#-encryption-model)
- [Encryption Keys & Database Encryption](#️-encryption-keys--database-encryption)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Available Scripts](#️-available-scripts)
- [Related Documentation](#-related-documentation)
- [Self-Hosted Hardening Checklist](#️-self-hosted-hardening-checklist)
- [Contributing](#-contributing)
- [Security](#️-security)

</details>

---

## 📌 About

**ShellGuard** is a privacy-first, self-hostable **secrets vault** built for the Human-Agent ecosystem. Passwords, TOTP seeds, secure notes, SSH keys and encrypted attachments live as *pearls* behind a hardened carapace: everything sensitive is encrypted **in your browser** before the server ever sees it. No cloud. No plaintext at rest. Just your grotto. **Three layers of encryption** protect your data at every level — client-side secrets, server-side metadata, and optional whole-database encryption.

- 🔐 **Zero-Knowledge ShellCryption©™** — Secrets are sealed client-side with AES-GCM-256 derived from your `hu-` key via HKDF. The server stores only opaque `{v, alg, iv, ct, aad}` blobs and mathematically cannot decrypt them.
- 🔒 **Per-Row Metadata Encryption©™** — Server-side AES-256-GCM encrypts metadata fields (title, username, URL, category, notes, file name) in-place using `DB_ENCRYPTION_KEY`. Backward-compatible: legacy plaintext passes through; new/updated items encrypt automatically.
- 🗝️ **ClawKeys©™ Identity** — Passwordless login with a generated `hu-` identity key; short-lived `api-` bearer tokens carry every request.
- 🤖 **LobsterKeys©™** — Issue granular, revocable, rate-limited `lb-` API keys so your AI agents can fetch exactly what they need — and nothing more.
- 🐚 **The Grotto (Vault)** — Logins (with username/URL/TOTP and unlimited encrypted file attachments, 10 MB per file), secure notes, SSH keys and standalone attachments, organized into color-coded nested **pods**.
- 🎲 **Pearl Generator** — Cryptographically random password generator with configurable length/character sets, complexity scoring and session history.
- 💾 **Data Survival & Resilient Backups** — Born from real-world disaster recovery: painless dual-layer backups (live-consistent Online Backup API SQLite snapshots + comprehensive client-side encrypted vault exports with attachments and keys) designed to ensure you never face a catastrophic lock-out.
- 📤 **Sovereign Exports** — Metadata CSV export and re-auth-gated decrypted JSON/encrypted vault archives containing all pearls, TOTP seeds, notes, SSH keys, and attachments.
- ⏱️ **Retract (Auto-Lock)** — Configurable inactivity timer locks the vault and clears session state automatically without flushing offline recovery buffers.
- 🩺 **Segregated Auditing** — Every mutation lands in an append-only `audit.sqlite` reef, redacted so titles, usernames and secrets never touch the log.
- 🐳 **Docker-First** — Single container serving UI + API, `PUID`/`PGID` aware, healthchecked, publishable to GHCR.
- 🦞 **SuperLobster Panel** — Token-gated instance admin plane at `/superlobster`: strict-metadata lobster management (cascade delete with type-to-confirm), read-only diagnostics, whitelist-only settings, and failsafe database backups (SQLCipher-consistent Online Backup API snapshots with manifest + rotation). Restores stay offline by design. See [ADMIN.md](./ADMIN.md).
- 🌊 **Reef Modernist Design** — "Bioluminescent Defense": deep abyssal surfaces, glowing shells, Sora/Geist/JetBrains Mono typography.

### 🔐 Encryption at a Glance

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — ShellCryption©™ (client-side, zero-knowledge, always on)        │
│                                                                             │
│    HKDF-SHA-256(hu- key, salt = uuid) → AES-GCM-256                        │
│    Encrypts: secret, totp_secret, content, key_value, file_data             │
│    Server stores only {v, alg, iv, ct, aad} blobs                          │
│    Server CANNOT decrypt. Ever.                                             │
│                                                                             │
│  LAYER 2 — Per-Row Metadata Encryption (server-side, DB_ENCRYPTION_KEY)    │
│                                                                             │
│    HKDF-SHA-256(DB_ENCRYPTION_KEY) → AES-256-GCM                           │
│    Encrypts: title, username, url, category, notes, file_name               │
│    Stored as {v:1, alg:"SG-META", iv, ct} in same TEXT columns             │
│    Backward-compatible — legacy plaintext passes through                    │
│    When DB_ENCRYPTION_KEY is not set → no-op (metadata stays plaintext)    │
│                                                                             │
│  LAYER 3 — SQLCipher (optional defense-in-depth)                            │
│                                                                             │
│    DB_ENCRYPTION_KEY → whole-file AES-256                                   │
│    Covers entire database file at rest                                      │
│    Optional — strongly recommended for production                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph Client ["🌐 Browser"]
        UI[React / Tailwind UI<br/>Reef Modernist]
        SC["ShellCryption©™<br/>HKDF → AES-GCM-256<br/>client-side field encryption"]
        REST[RestAdapter<br/>unwraps {success, data}]
        Session["sessionStorage<br/>sg_api_token"]
    end

    subgraph Server ["🖥️ server.ts (Express 5)"]
        API["REST API<br/>helmet · cors · zod · rate limits<br/>Port 6565 dev / 6464 prod"]
        DB[("db.sqlite<br/>WAL · SQLCipher optional")]
        AUDIT[("audit.sqlite<br/>segregated append-only logs")]
    end

    UI --> SC
    SC -->|"ciphertext blobs only"| REST
    REST -->|"fetch + Bearer api-*"| API
    API --> DB
    API --> AUDIT
```

The server is a **cipher-keeper, never a key-holder**: encryption keys exist only in browser memory, derived from your `hu-` key each session. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the request pipeline, auth state machine and hard constraints.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **npm** v10+
- **Docker & Docker Compose** *(for containerized deployment)*

---

### 🐳 Running with Docker

<details>
<summary>Expand Docker instructions</summary>

**1. Generate an encryption key (strongly recommended):**

```bash
openssl rand -base64 32
```

**2. Launch the stack:**

```bash
docker compose up -d
```

Or build locally instead of pulling from GHCR:

```bash
docker compose up -d --build
```

**3. Verify running state:**

- **Web GUI:** [http://localhost:6464](http://localhost:6464)
- **API Health:** `curl http://localhost:6464/api/health`

**Monitoring & Maintenance:**

- **View Logs:** `docker compose logs -f`
- **Stop Stack:** `docker compose down`
- **Wait-for-healthy:** `docker compose up -d --wait`

> [!IMPORTANT]
> **Data Sovereignty & Persistence**: All pearls, identities and audit reefs live in a bind mount on your host machine (`./data/db.sqlite`, `./data/audit.sqlite`) for maximum visibility and ease of backup. Back up both files — and keep your `DB_ENCRYPTION_KEY` somewhere safe *outside* this directory.

> [!NOTE]
> For Unraid, a Community Applications template is provided at [`shellguard-unraid-template.xml`](./shellguard-unraid-template.xml) (WebUI port `6464`, appdata path `/mnt/user/appdata/shellguard`, advanced-default `PUID=99`/`PGID=100`).

</details>

---

### 🐚 Running Locally with npm

<details>
<summary>Expand local development instructions</summary>

```bash
# 1. Install dependencies (native module build requires python3/make/g++)
npm ci

# 2. Copy the environment config
cp .env.example .env

# 3. Start the twin dev servers
npm run scuttle:dev-start
#   → Frontend (Vite + HMR): http://localhost:6464
#   → Backend (Express API): http://localhost:6565/api/health
```

Stop the reef with `npm run scuttle:dev-stop`; scuttle the dev database with `npm run scuttle:dev-reset`.

Full walkthrough (identity registration, enabling database encryption, health checks): see [QUICKSTART.md](./QUICKSTART.md).

</details>

---

## ⚙️ Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Runtime mode (production or development) |
| `PORT` | `6565` | Server port (the container sets `6464` so one port serves UI + API) |
| `DATA_DIR` | `/app/data` | Where `db.sqlite` + `audit.sqlite` are stored (bind mount) |
| `DB_ENCRYPTION_KEY` | `""` | SQLCipher AES-256 key encrypting the whole database file at rest. Generate with `openssl rand -base64 32`. Optional — see [SECURITY.md § Database Encryption](./SECURITY.md) |
| `VITE_SHELLCRYPTION_ENABLED` | `true` | Client-side field encryption. Leave `true`; `false` stores secrets in plaintext columns (never do this in production) |
| `VITE_API_URL` | *(relative)* | API base URL for the frontend when split from the API host |
| `TOKEN_TTL_DEFAULT` | `1440` | Session token TTL — accepts `30m`/`12h`/`24h`/`7d`/`never`, ISO timestamps or bare minutes |
| `TRUST_PROXY` | `false` | Set `true` behind a reverse proxy (correct client IPs for rate limiting/HTTPS redirect) |
| `CORS_ORIGIN` | *(LAN-open)* | Restrict API access to specific origin(s), comma-separated |
| `ENFORCE_HTTPS` | `false` | Redirect HTTP→HTTPS when terminating TLS in-process |
| `HTTPS_PORT` | `4647` | Port checked when `ENFORCE_HTTPS=true` |
| `AUTH_RATE_WINDOW` / `AUTH_RATE_LIMIT` | `900000` / `5` | Brute-force protection window (ms) and attempt cap on auth endpoints |
| `API_RATE_WINDOW` / `API_RATE_LIMIT` | `60000` / `100` | Global API rate-limit window (ms) and request cap |
| `PUID` / `PGID` | `1000` | Linux UID/GID the container drops privileges to |

---

## 🔑 Key System

ShellGuard uses a **prefix-based identity token system** — no passwords, no accounts on a remote server. Your key file is your identity.

| Prefix | Type | Length | Usage |
|---|---|---|---|
| `hu-` | **Human Key** (ShellKey©™) | 64 chars (67 total) | Your personal identity. One-Field Login. Doubles as the HKDF seed for ShellCryption — never leaves your browser unhashed. |
| `lb-` | **Lobster/Agent Key** | 64 chars (67 total) | For your AI agents and scripts. Granular permissions, optional expiry, per-key rate limits. Generated in Settings. |
| `api-` | **Session Token** | 32 chars (36 total) | Short-lived REST API bearer. Auto-issued by `POST /api/auth/token`. |

> [!TIP]
> **Cryptographic Handshake Security**: When an agent authenticates with an `lb-` key, prefer the SHA-256 pre-hashed handshake (`keyHash`) over sending the raw key. The backend validates via constant-time comparison.

> [!CAUTION]
> Your `hu-` key file is the **only** way into your grotto — and because it seeds your ShellCryption key, losing it means your pearls are unrecoverable ciphertext. Back it up offline.

> [!WARNING]
> **Your `hu-` key is the single most important piece of data in ShellGuard.**
>
> - Your `hu-` key is your **identity AND your encryption seed**. It is the **ONLY** key that can decrypt your secrets.
> - **Losing your `hu-` key means ALL encrypted data is permanently unrecoverable.** There is no recovery, no reset, no "forgot my key" flow. This is by design.
> - **Back up your `hu-` key to at least 2 secure, accessible locations** (e.g., encrypted USB drive, printed paper in a safe, password manager). Treat it like a master password — because it **IS** your master password.
> - **Never store it in plain text** on your server, in your repo, or in cloud sync folders.
> - The server only stores a **SHA-256 hash** of your key. Even a full server compromise cannot recover your `hu-` key.

---

## 🔐 Encryption Model

ShellGuard's triple-layer encryption creates distinct security boundaries. Here is what each actor can access:

| Actor | Metadata (title, url, category) | Secrets (password, TOTP, SSH key) | File Data |
|---|---|---|---|
| Human (browser, authenticated) | ✅ Yes (server decrypts per-row) | ✅ Yes (client ShellCryption decrypts) | ✅ Yes (client ShellCryption decrypts) |
| Agent (`lb-` key, authenticated) | ✅ Yes (server decrypts per-row) | ❌ No (opaque ShellCryption blobs) | ❌ No (opaque ShellCryption blobs) |
| Server process (compromised) | ✅ Yes (has `DB_ENCRYPTION_KEY`) | ❌ No (no `hu-` key) | ❌ No (no `hu-` key) |
| Raw `db.sqlite` (no SQLCipher key) | ❌ No (SG-META ciphertext) | ❌ No (ShellCryption blobs) | ❌ No (ShellCryption blobs) |
| Raw `db.sqlite` (with SQLCipher key) | ❌ No (SG-META ciphertext) | ❌ No (ShellCryption blobs) | ❌ No (ShellCryption blobs) |

**What agents can and cannot do:**

Agents authenticated with an `lb-` key can **organize** your vault — rename items, change categories, move between pods — because the server decrypts per-row metadata for authorized requests. But agents can **never** see actual passwords, TOTP seeds, SSH keys, or file contents. Those fields are opaque ShellCryption blobs that only your browser can decrypt with your `hu-`-derived key.

**One key, two layers:**

Per-row metadata encryption uses the same `DB_ENCRYPTION_KEY` as SQLCipher whole-file encryption. One key governs both layers — set it once and both activate together.

**Backward compatibility:**

Existing plaintext metadata is transparently readable. New or updated items are encrypted automatically. No migration step required — the system handles mixed plaintext/ciphertext rows seamlessly.

---

## 🗝️ Encryption Keys & Database Encryption

`DB_ENCRYPTION_KEY` now governs **two things**:

1. **SQLCipher whole-DB encryption** — encrypts the entire `db.sqlite` file at rest with AES-256
2. **Per-row metadata encryption** — encrypts metadata columns (`title`, `username`, `url`, `category`, `notes`, `file_name`) with AES-256-GCM

Both activate together when the key is set. Generate a secure key:

```bash
openssl rand -base64 32
```

**Using Docker:** set it in your compose environment:

```yaml
environment:
  - DB_ENCRYPTION_KEY=your-generated-key-here
```

**Using npm:**

```bash
export DB_ENCRYPTION_KEY=your-generated-key-here
npm run start:api
```

> [!IMPORTANT]
> Secret fields (passwords, TOTP seeds, SSH keys, file data) are encrypted **separately** by ShellCryption on the client. `DB_ENCRYPTION_KEY` never touches those fields — it only protects metadata and the database file.

> [!CAUTION]
> If you lose `DB_ENCRYPTION_KEY`, the file-level metadata becomes inaccessible. Store it separately from your backups (password manager / secrets vault), never in the same directory as `data/`, and never committed to version control.

---

## 🔌 API Reference

> All endpoints except `/api/health`, `/api/auth/register`, `/api/auth/token` and `/skill.md` require `Authorization: Bearer <api-token>`.
>
> All responses use the `{ "success": boolean, "data": ... }` envelope. Agent-key permissions map method-first: `GET → canRead`, `POST → canWrite`, `PUT → canEdit`, `DELETE → canDelete`.

<details>
<summary>View full API endpoint table</summary>

### Auth & Identity

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | – | Initialize your Lobster identity (username + SHA-256 `keyHash`) |
| `POST` | `/api/auth/token` | – | Exchange `hu-`/`lb-` key hash for an `api-` session token |
| `GET` | `/api/auth/validate` | Bearer | Validate current session token |
| `GET` | `/api/auth/me` | Bearer | Fetch current profile *(ShellGuard-only endpoint)* |
| `PUT` | `/api/auth/profile` | Bearer | Update display name *(ShellGuard-only endpoint)* |

### Vault Pearls (Logins)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/vault` | canRead | List all pearl logins (owner-scoped) |
| `POST` | `/api/vault` | canWrite | Create a login (title, secret, username, url, TOTP seed…) |
| `PUT` | `/api/vault/:id` | canEdit | Update a login |
| `DELETE` | `/api/vault/:id` | canDelete | Delete a login |

### Secure Notes

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/notes` | canRead | List secure notes |
| `POST` | `/api/notes` | canWrite | Create a secure note |
| `PUT` | `/api/notes/:id` | canEdit | Update a secure note |
| `DELETE` | `/api/notes/:id` | canDelete | Delete a secure note |

### SSH Keys

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/keys` | canRead | List SSH keys |
| `POST` | `/api/keys` | canWrite | Store an SSH key |
| `PUT` | `/api/keys/:id` | canEdit | Update an SSH key |
| `DELETE` | `/api/keys/:id` | canDelete | Delete an SSH key |

### Secure Attachments

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/attachments` | canRead | List encrypted attachments |
| `POST` | `/api/attachments` | canWrite | Upload attachment (base64, 10 MB per-file hard cap) |
| `PUT` | `/api/attachments/:id` | canEdit | Update attachment metadata/file |
| `DELETE` | `/api/attachments/:id` | canDelete | Delete attachment |

Password entries link attachments by reference: each uploaded file is stored as its own encrypted attachment record, and the login's `attachments` column holds only a JSON array of attachment IDs (unlimited attachments, one file each, 10 MB max per file). Deleting a login cascade-deletes its linked attachments.

### Agent Keys (LobsterKeys©™)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/agent-keys` | human-only | List active Lobster Keys |
| `POST` | `/api/agent-keys` | human-only | Generate a new `lb-` key (permissions, expiry, rate limit) |
| `PATCH` | `/api/agent-keys/:id/revoke` | human-only | Revoke an agent key (immediate) |
| `DELETE` | `/api/agent-keys/:id` | human-only | Permanently delete a key record |

### SuperLobster Panel (admin plane)

Token-gated via `ADMIN_TOKEN` (503 when unset). Cookie-session auth (`sg_admin_session`, 20-min sliding), fully isolated from user Bearer tokens. See [ADMIN.md](./ADMIN.md) for the threat model.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth` | Exchange ADMIN_TOKEN for a session cookie |
| `GET` | `/api/admin/verify` | Quiet session handshake |
| `POST` | `/api/admin/logout` | Destroy the session |
| `GET` | `/api/admin/users` | Lobsters overview — strict metadata only (counts + identity, never vault payload fields) |
| `DELETE` | `/api/admin/users/:uuid` | Cascade delete a lobster + all their data (`expect` confirmation required) |
| `GET` | `/api/admin/status` | Read-only instance fingerprint (no secrets) |
| `GET`/`PATCH` | `/api/admin/settings` | Whitelist-only settings (retention + backup config) |
| `GET` | `/api/admin/uptime` | Historical uptime sessions from the audit reef |
| `GET` | `/api/admin/audit` | Recent admin/auth/backup security events |
| `POST` | `/api/admin/backup` | One-shot backup — server-side write to `DATA_DIR/backups/`, no download |
| `GET` | `/api/admin/backups` | List backup sets |

**No HTTP restore endpoint exists** — restores are offline by design (see [ADMIN.md §5](./ADMIN.md)).

### Settings & System

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/settings/:key` | human-only | Read a synced preference (`appearance/theme`, `generator`, `pods`, `security`) |
| `PUT` | `/api/settings/:key` | human-only | Write a synced preference (JSON ≤ 256KB) |
| `GET` | `/api/health` | – | Health check + record counts |
| `GET` | `/skill.md` | – | AI-agent skill documentation (Markdown) |

</details>

---

## 📂 Project Structure

```
ShellGuard/
├── server.ts                     # Express entrypoint (twin-port dev, single-port prod)
├── migrations/                   # Transactional SQL migrations (0001_initial = schema v1)
├── skills/shellguard/SKILL.md    # Agent-facing API skill (served at /skill.md)
├── scripts/scuttle-reset.ts      # Database reset utility
├── tests/                        # Vitest + supertest suites (isolated DATA_DIRs)
├── Dockerfile                    # Multi-stage single-image build (node:20-alpine)
├── docker-compose.yml            # Production stack (build locally)
├── docker-compose.dev.yml        # Pull-and-run stack (ghcr image)
├── docker-entrypoint.sh          # PUID/PGID remap + privilege drop
├── shellguard-unraid-template.xml
└── src/
    ├── server/                   # Backend modules
    │   ├── config/               # apiConfig, corsConfig
    │   ├── database/             # connection, schema, migrationRunner, index singleton
    │   ├── middleware/           # auth, rateLimiter, errorHandler, validate, httpsRedirect
    │   ├── routes/               # auth, vault, notes, sshKeys, attachments, agentKeys, settings
    │   ├── utils/                # auditLogger, crypto, parsers, tokenExpiry
    │   └── validation/           # Zod schemas
    ├── lib/                      # Client crypto (shellCryption.ts), generator, pods, clipboard
    ├── components/               # Reef Modernist UI (Vault, Generator, Settings, Layout…)
    ├── services/api/restAdapter.ts  # HTTP adapter unwrapping the {success,data} envelope
    ├── types.ts                  # Shared TypeScript interfaces
    └── App.tsx                   # Root view router
```

---

## 🛠️ Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start only the Vite frontend (:6464, strict port, proxies `/api`) |
| `npm run dev:server` | Start only the Express API (:6565, watch mode, `DATA_DIR=./data-dev`) |
| `npm run scuttle:dev-start` | 🦞 Start frontend + backend together (development reef) |
| `npm run scuttle:dev-stop` | Kill both dev servers |
| `npm run scuttle:dev-reset` | Scuttle the development database (`data-dev/`) |
| `npm run scuttle:reset` | Scuttle the production database (`data/`) — DANGER |
| `npm run start:api` | Start only the Express API server (:6565) |
| `npm run build` | Type-check + compile the frontend bundle (`tsc && vite build`) |
| `npm run lint` | TypeScript verification (`tsc --noEmit`) |
| `npm test` | Run the Vitest suites |
| `npm run test:full` | Full gate: unit + integration + security + build-gates |

---

## 📚 Related Documentation

| Document | Purpose |
|---|---|
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | System blueprint, request pipeline, hard constraints, ShellGuard-vs-ClawChives deltas |
| [**SECURITY.md**](./SECURITY.md) | Security model, OWASP coverage, vault threat scenarios, hardening checklist |
| [**QUICKSTART.md**](./QUICKSTART.md) | Step-by-step first hatch: Docker or npm, registration, encryption |
| [**CONTRIBUTING.md**](./CONTRIBUTING.md) | Development standards, twin-verbatim policy, PR checklist |
| [**CRUSTSECURITY.md**](./CRUSTSECURITY.md) | ClawStack©™ standards alignment matrix |
| [**BLUEPRINT.md**](./BLUEPRINT.md) | Schema v1 data reefs and topology map |
| [**ROADMAP.md**](./ROADMAP.md) | Changelog and future molts |
| [**CRUSTAGENT.md**](./CRUSTAGENT.md) | Agent intelligence handshake and stability locks |
| [**DESIGN.md**](./DESIGN.md) | Reef Modernist design tokens and component language |

---

## 🛡️ Self-Hosted Hardening Checklist

Before exposing ShellGuard to anything beyond localhost:

- [ ] Set **`DB_ENCRYPTION_KEY`** (`openssl rand -base64 32`) — activates both SQLCipher and per-row metadata encryption
- [ ] Place the app behind **Nginx/Caddy with TLS**, or set `ENFORCE_HTTPS=true` if terminating in-process
- [ ] Set **`TRUST_PROXY=true`** only behind your reverse proxy (correct IPs for rate limiting)
- [ ] Set **`CORS_ORIGIN`** to your specific origin — not wildcard
- [ ] Restrict port `6464` to localhost/LAN and proxy publicly via TLS
- [ ] Keep **`VITE_SHELLCRYPTION_ENABLED=true`** — never ship a plaintext-at-column vault
- [ ] Set a sane **`TOKEN_TTL_DEFAULT`** for your threat model (shorter than 24h on shared networks)
- [ ] Back up **both** `data/db.sqlite` and `data/audit.sqlite` regularly — and keep the encryption key elsewhere
- [ ] Pin **`PUID`/`PGID`** to a non-root host user (Unraid template defaults: `PUID=99`/`PGID=100`)
- [ ] Review audit logs for unusual agent activity; revoke idle Lobster Keys
- [ ] Store your `hu-` identity key offline in a secure vault
- [ ] **Back up your `hu-` identity key to at least 2 secure locations** — losing it means permanent data loss
- [ ] **Verify per-row encryption is active** by checking startup logs for `[FieldEncryption] AES-256-GCM metadata encryption active`

---

## 🤝 Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before your first dive. Two rules worth memorizing early: the **zero-knowledge invariant** (the server never learns a secret) and the **twin-verbatim policy** (server code stays diff-clean against our sibling reef, ClawChives).

---

## 🛡️ Security

Built on the Five Pillars of Lobsterization©™:

1. Cryptographic Identity
2. Server-First Data (SQLite)
3. Sovereign Deployment
4. Granular Agent Permissions
5. Consistent Aesthetic

Found a crack in the shell? See [SECURITY.md § Reporting a Vulnerability](./SECURITY.md) — please do **not** open a public issue.

---

<div align="center">

```text
         _____
      .'  🛡️  '.       HATCH YOUR VAULT.
     /  _   _  \      GUARD YOUR PEARLS.
     |  (o)-(o) |     TRUST THE SHELL.
     (_    Y    _)
      '.___W___.'
      Maintained by CrustAgent©™
```

</div>
