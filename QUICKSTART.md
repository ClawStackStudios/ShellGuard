# 🛡️ ShellGuard Quickstart Handbook
*Maintained by CrustAgent©™ — Hatch your vault, guard your pearls.*

Welcome to **ShellGuard**, the sovereign zero-knowledge secrets vault. This handbook walks you through a zero-fuss containerized deployment (or local development setup), identity registration, optional database encryption, and health verification.

- **Zero-Knowledge Encryption** — Secrets are encrypted client-side with AES-GCM-256 (ShellCryption©™). Metadata is encrypted server-side with per-row AES-256-GCM. The database file itself can be encrypted with SQLCipher. Three independent layers.

> [!WARNING]
> **Fresh Start Release**: v0.2.0 scuttles all prior local data. There is no import path from older builds — export before upgrading.

---

## 🚀 Quick Launch

You can run ShellGuard either as a unified Docker container or directly with Node.js.

### Option A: The Unified Docker Stack (Recommended)

ShellGuard compiles into a single container running the React frontend and the SQLite-backed Express API together.

1. **Generate a database encryption key (strongly recommended):**
   ```bash
   openssl rand -base64 32
   ```
2. **Launch the container stack:**
   ```bash
   docker compose up -d --wait
   ```
   *(Pulls from GHCR if configured via `docker-compose.dev.yml`, or builds locally with `docker compose up -d --build`.)*
3. **Verify running state:**
   * **Web GUI:** [http://localhost:5353](http://localhost:5353)
   * **API Health Check:** `curl http://localhost:5353/api/health`
4. **Persist & backup:** everything lives in `./data/` on your host (`db.sqlite` + `audit.sqlite`). Keep your encryption key somewhere else entirely.

### Option B: Local Node.js Development

If you are developing features, run the twin dev servers concurrently.

1. **Install dependencies:**
   ```bash
   npm ci
   ```

   > [!NOTE]
   > **Native module toolchain**: ShellGuard uses `better-sqlite3-multiple-ciphers` (SQLCipher support), a native addon compiled at install time. You need **python3**, **make**, and a **C/C++ toolchain (g++/clang)** available to node-gyp. On Alpine: `apk add python3 make g++`. On Debian/Ubuntu: `sudo apt install build-essential python3`. Windows/macOS contributors need the VS Build Tools / Xcode CLT respectively.

2. **Copy the environment configuration:**
   ```bash
   cp .env.example .env
   ```
3. **Boot the dev reef:**
   ```bash
   npm run scuttle:dev-start
   ```
   * **Frontend (Vite + HMR):** [http://localhost:5353](http://localhost:5353)
   * **Backend Express API:** [http://localhost:5454](http://localhost:5454)

   Or split them across terminals:
   ```bash
   npm run dev:server    # Terminal 1 — API :5454, DATA_DIR=./data-dev
   npm run dev           # Terminal 2 — UI  :5353, proxies /api
   ```

---

## 🔑 Step 1: Molt Your Identity (`hu-` Key)

ShellGuard is entirely passwordless. Your identity and your decryption key are anchored to one high-entropy **Human Key** (`hu-`, ShellKey©™).

1. Open [http://localhost:5353](http://localhost:5353).
2. The **Setup view** launches automatically when no identity exists.
3. Choose a username and click **Generate Identity Key** — a 67-character `hu-` key is created in your browser.
4. **Download the identity file** (`shellguard_identity_key.json`) and store it in a real vault (password manager, offline storage). Losing it means your pearls are unrecoverable ciphertext — there is no reset link.
5. Log back in any time via One-Field Login: paste your `hu-` key. Only its SHA-256 hash ever reaches the server.

## 🐚 Step 2: Lock Your First Pearls

1. From the Grotto, add items of any type: **login** (with username, URL, TOTP seed, and unlimited file attachments — 10 MB max per file), **secure note**, **SSH key**, or **encrypted attachment**.
2. Every secret field is encrypted **in your browser** (AES-GCM-256) before upload. Watch the network tab if you don't believe us — you'll see `{v, alg, iv, ct, aad}` blobs.
3. Organize pearls into color-coded **pods** (Personal, Work, Custom… nested as deep as you like).

## 🤖 Step 3: Spawn Agents (`lb-` Keys)

To let an AI agent fetch credentials safely:

1. Go to **Settings → Agent Keys**.
2. Click **Create Agent Key** and configure:
   * **Name** — e.g. `deploy-bot`
   * **Permissions** — minimum claw strength only (`canRead` for most agents; write/edit/delete only if truly required)
   * **Expiration** — `never`, `30d`, `90d`, or `1y`
   * **Rate Limit** — requests per minute (1–10000) to safeguard the reef
3. Copy the generated `lb-` key into your agent's config. Agents authenticate by exchanging its SHA-256 hash at `POST /api/auth/token`.
4. Revoke instantly from the same screen if anything smells fishy.

## 🗝️ Step 4: Enable Database Encryption (Optional but Recommended)

Your secret fields are already zero-knowledge encrypted client-side. Database encryption additionally protects the *metadata* (categories, urls, timestamps) at rest.

```bash
# Generate the key
openssl rand -base64 32

# Docker: put it in compose environment, then
docker compose up -d --wait

# Local: export and restart the API
export DB_ENCRYPTION_KEY=<your-key>
npm run start:api
```

The server warns (but never blocks) when the key is unset — enabling it is your choice. See [SECURITY.md § Database Encryption](./SECURITY.md) for what this layer does and does not cover.

## 🩺 Step 5: Health & Diagnostics

```bash
# Container health (also wired into the Docker HEALTHCHECK)
curl http://localhost:5353/api/health

# Run the test suites
npm test                  # all suites
npm run test:security     # cross-owner isolation + permission bypass gates

# Verify type-safety standards
npm run lint
```

Scuttle and start fresh during development:

```bash
npm run scuttle:dev-reset   # wipes data-dev/
npm run scuttle:reset       # DANGER: wipes production data/
```

---

## 🔐 Zero-Knowledge Architecture

ShellGuard uses three layers of encryption:

1. **ShellCryption©™ (client-side, always on)**: Your `hu-` key derives an AES-GCM-256 encryption key via HKDF. Passwords, TOTP seeds, SSH keys, and file data are encrypted in your browser before reaching the server. The server stores only ciphertext blobs and CANNOT decrypt them.

2. **Per-Row Metadata Encryption (server-side, when DB_ENCRYPTION_KEY is set)**: Metadata columns (title, username, url, category, notes, file_name) are encrypted with AES-256-GCM at the field level. This means agents can see decrypted metadata to help organize your vault, but never see actual secrets.

3. **SQLCipher (optional, whole-DB)**: The entire SQLite database file is encrypted at rest. Protects against file-level theft.

Your `hu-` key is the root of trust for Layer 1. `DB_ENCRYPTION_KEY` governs Layers 2 and 3. **Losing your `hu-` key means all encrypted data is permanently unrecoverable.**

---

## ✅ Production Security Checklist

- [ ] **Back up your `hu-` identity key** to at least 2 secure, offline locations — losing it means permanent data loss
- [ ] **Verify per-row encryption** is active: check startup logs for `[FieldEncryption] AES-256-GCM metadata encryption active`
- [ ] Set a strong `DB_ENCRYPTION_KEY` (`openssl rand -base64 32`) and store it separately from your data directory
- [ ] Run behind a reverse proxy with TLS termination (nginx, Caddy, Traefik)
- [ ] Restrict container network exposure — bind to `127.0.0.1` unless LAN access is required
- [ ] Enable the inactivity retractor (`security/retractMinutes`) to auto-lock idle sessions
- [ ] Review audit logs regularly (`audit.sqlite`) for unexpected mutations

---

## 📚 Reference Map

* [**README.md**](./README.md) — Project overview, key system, full API reference table.
* [**ARCHITECTURE.md**](./ARCHITECTURE.md) — System blueprint, request pipeline, hard constraints, deltas appendix.
* [**SECURITY.md**](./SECURITY.md) — Cryptographic model, OWASP coverage, vault threat scenarios, hardening checklist.
* [**CONTRIBUTING.md**](./CONTRIBUTING.md) — Coding styles, twin-verbatim policy, pull request procedures.

**Maintained by CrustAgent©™**
