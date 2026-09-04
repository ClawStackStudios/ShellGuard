# 🛡️ ShellGuard Quickstart Handbook
*Maintained by CrustAgent©™ — Hatch your vault, guard your pearls.*

Welcome to **ShellGuard**, the sovereign zero-knowledge secrets vault. This handbook walks you through a zero-fuss containerized deployment (or local development setup), identity registration, optional database encryption, and health verification.

- **Zero-Knowledge Encryption** — Secrets are encrypted client-side with AES-GCM-256 (ShellCryption©™). Metadata is encrypted server-side with per-row AES-256-GCM. The database file itself can be encrypted with SQLCipher. Three independent layers.

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
   * **Web GUI:** [http://localhost:6464](http://localhost:6464)
   * **API Health Check:** `curl http://localhost:6464/api/health`
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
   * **Frontend (Vite + HMR):** [http://localhost:6464](http://localhost:6464)
   * **Backend Express API:** [http://localhost:6565](http://localhost:6565)

   Or split them across terminals:
   ```bash
   npm run dev:server    # Terminal 1 — API :6565, DATA_DIR=./data-dev
   npm run dev           # Terminal 2 — UI  :6464, proxies /api
   ```

---

## 🔑 Step 1: Molt Your Identity (`hu-` Key)

ShellGuard is entirely passwordless. Your identity and your decryption key are anchored to one high-entropy **Human Key** (`hu-`, ShellKey©™).

1. Open [http://localhost:6464](http://localhost:6464).
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
curl http://localhost:6464/api/health

# Run the test suites
npm test                  # all suites
npm run test:security     # cross-owner isolation + permission bypass gates

# Verify type-safety standards
npm run lint
```

```bash
npm run scuttle:dev-reset   # wipes data-dev/
npm run scuttle:reset       # DANGER: wipes production data/
```

---

## 🔒 LAN HTTPS Without a Proxy (Optional)

By default, LAN deployments serve plain HTTP. That is acceptable inside a trusted LAN or VPN (Tailscale/WireGuard already encrypt the tunnel), but if you want native TLS **without** standing up a reverse proxy, ShellGuard can generate its own certificate:

```bash
# .env
TLS_ENABLED=true
```

1. **Start the server.** On first boot a 10-year self-signed certificate is generated to `data/certs/` and reused on every restart.
2. **Visit the UI.** The browser shows a security warning — this is *expected* for self-signed certs. Accept it once.
3. **Done.** The certificate's SANs cover `localhost` plus every detected LAN IP, so any device on your network reaches `https://<lan-ip>:6464` under the same exception.

Prefer your own certificate (mkcert, internal CA, proxy-issued)? Point `TLS_CERT_PATH` / `TLS_KEY_PATH` at a PEM pair instead — both must be set together. See [.env.example](./.env.example) for the full reference and [SECURITY.md](./SECURITY.md) for the transport threat model.

> [!NOTE]
> Public deployments should still terminate TLS at a reverse proxy (Caddy/Traefik/nginx/Cloudflare Tunnel). Native TLS is a LAN convenience, not a public-exposure strategy.

---

## 💾 Database Backups & Restoration

ShellGuard maintains a two-tiered backup strategy designed around zero-knowledge principles and a strict secrets-aware threat model.

### 1. How Backups Work

* **Tier 1 — User Vault Export (In-App)**: Individual users can export their secrets via **Settings → Import & Export** (CSV metadata or `hu-` key re-authenticated JSON). This is the primary user-level recovery path.
* **ShellGuard-TOTP (`sgtotp.bak`) Import**: **Settings → Import & Export** also accepts `sgtotp.bak` backups exported from the ShellGuard-TOTP Android app (encrypted `shellguard-totp-backup-v1` envelopes, plaintext `shellguard-totp-plain-export-v1` exports, or bare item arrays). Encrypted envelopes are decrypted **locally in the browser** with the PIN/key used at export time (HKDF salt = the envelope's `ownerUuid`, AAD `totp_backup:{ownerUuid}`) and verified against the SHA-256 integrity checksum. Items are mapped to fresh `vault_pearls` with the seed re-encrypted client-side under `vault_pearls_totp:{id}` — the export key never leaves the browser, and the server stays zero-knowledge. Imported items mirror back down to the Android app on its next sync cycle.
* **Tier 2 — Instance Failsafe (SuperLobster Panel)**: Instance operators can configure scheduled snapshots (or click **Back Up Now**) in the SuperLobster Panel (`/superlobster`).
  * **Mechanism**: Uses SQLite's native `Online Backup API` (`db.backup()`) to create atomic, WAL-consistent copies without locking live traffic.
  * **Storage**: Snapshots land directly on the host in `DATA_DIR/backups/` (`db-YYYY-MM-DDTHH-mm-ssZ.sqlite` and `audit-*.sqlite`) alongside a cryptographic `manifest.json`.
  * **Zero-Exfiltration Invariant**: There are **no HTTP download or restore endpoints**. Because `db.sqlite` contains server-side agent keys and session hashes, backups stay strictly on the server filesystem.

### 2. How to Restore a Database (Offline Operator Procedure)

Restorations are performed offline at the shell/host level (Vaultwarden-style practice):

1. **Stop ShellGuard:**
   ```bash
   # Docker:
   docker stop shellguard
   # Local Node:
   npm run scuttle:stop
   ```

2. **Validate the backup file (Read-Only Check):**
   Use the built-in validator to verify that the backup is uncorrupted and opens with your encryption key:
   ```bash
   npm run scuttle:restore -- --file data/backups/db-2026-08-28T20-00-00Z.sqlite --key <DB_ENCRYPTION_KEY>
   ```

3. **Clean stale SQLite WAL files (Crucial):**
   ```bash
   rm -f data/db.sqlite-wal data/db.sqlite-shm
   ```

4. **Swap the database file:**
   ```bash
   cp data/backups/db-2026-08-28T20-00-00Z.sqlite data/db.sqlite
   ```
   *(Optional: you can also swap `audit.sqlite`, but leaving the live audit log untouched ensures an unbroken forensic audit trail.)*

5. **Verify `DB_ENCRYPTION_KEY`:**
   Ensure the environment variable `DB_ENCRYPTION_KEY` matches the key that was active when the backup was created.

6. **Start ShellGuard:**
   ```bash
   # Docker:
   docker start shellguard
   # Local Node:
   npm run scuttle:prod-start
   ```

> [!NOTE]
> Users log right back in with their own `hu-` keys — no re-registration or token resetting needed. For full threat modeling and security invariants, see [ADMIN.md](./ADMIN.md).

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
- [ ] Run behind a reverse proxy with TLS termination (nginx, Caddy, Traefik) — or set `TLS_ENABLED=true` for native self-signed HTTPS on LAN
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
