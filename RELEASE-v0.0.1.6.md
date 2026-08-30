# 🦞 ShellGuard — Release v0.0.1.6

## *Frictionless Sovereign TLS — Encrypted LAN, Zero Ceremony*

```text
███████╗██╗   ██╗███████╗██╗     ██╗              ██████╗   ██╗   ██╗   █████╗    ██████╗     ██████╗ 
██╔════╝██║   ██║██╔════╝██║     ██║              ██╔═══╝   ██║   ██║  ██╔══██╗  ██╔══██╗    ██╔══██╗
███████╗███████║█████╗   ██║     ██║              ██║ ███╗  ██║   ██║  ███████║  ██████╔╝    ██║   ██║
╚════██║██╔══██║██╔══╝   ██║     ██║              ██║   ██║  ██║   ██║  ██╔══██║  ██╔══██╗    ██║   ██║
███████║██║   ██║███████╗███████╗███████╗  ╚██████╔╝╚██████╝  ██║   ██║  ██║   ██║   ██████╔╝
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═════╝   ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═════╝
                                                  ~ **ClawStack Mobile Studios©™** ~
```

---

## 🚀 The Core Summary

Welcome to **v0.0.1.6** of **ShellGuard**! This release closes the last plaintext transport gap for LAN deployments with **Native TLS**: set `TLS_ENABLED=true` and the server generates a persistent 10-year self-signed certificate on first boot — one browser warning, accepted once, stable across every restart. No reverse proxy required, no ceremony, no expired-cert surprises. For operators who prefer their own certificates, `TLS_CERT_PATH` / `TLS_KEY_PATH` accept any PEM pair. The release also lands a fully documented **Transport Security threat model** in SECURITY.md, ships the Android reference documentation corpus into the repository, and adds CI support for `--release` commit-message flags.

---

## 💎 Key Themes & Highlights

### 🔐 1. Native LAN TLS & Self-Signed Certificate Lifecycle

* **Frictionless Generation:** With `TLS_ENABLED=true`, a 10-year EC P-256 certificate is generated on first boot via the new `src/server/utils/tlsManager.ts` — pure-JS `selfsigned` engine, no native build step, fast enough for boot-time.
* **Persistent & Stable:** The certificate is written to `DATA_DIR/certs/{cert,key}.pem` with owner-only `0o600` permissions and **reused on every subsequent boot** — the browser exception you grant once remains valid indefinitely (verified live: second boot logs `Certificate: loaded` with an identical fingerprint).
* **Complete SAN Coverage:** Subject Alternative Names are auto-collected from `localhost`, loopback (`127.0.0.1`, `::1`), and **every non-internal network interface** — one warning covers `https://<lan-ip>:6464` from any device on the reef.
* **Bring Your Own:** Operators with an internal CA, mkcert, or proxy-issued pair can set `TLS_CERT_PATH` / `TLS_KEY_PATH` directly — both validated as a set, taking precedence over the generated pair.

### 🛡️ 2. Honest Transport Security Posture

* **HTTPS-Only Listener:** When TLS is enabled, the plain HTTP listener is **gone** — requests to `http://` are refused outright, not redirected.
* **HSTS Activated:** Helmet's Strict-Transport-Security engages whenever TLS terminates in-process (native TLS or `ENFORCE_HTTPS=true` behind a proxy), and stays inert in LAN-HTTP mode.
* **Graceful Fallback:** If TLS materials fail to load, the server falls back to HTTP with a loud warning rather than refusing to start — matching the codebase's warns-not-blocks philosophy.
* **Documented Threat Model:** SECURITY.md gains a full **"Transport Security & the Plain-HTTP Tradeoff"** section: what plain HTTP exposes (keyHash replay, token theft, code injection), what it never exposes (all ShellCryption ciphertext), and recommended postures for LAN, VPN, and public exposure.

### 🐳 3. Operational Integration

* **TLS-Aware Docker Healthcheck:** The container `HEALTHCHECK` now probes `https://localhost:6464/api/health` with `--no-check-certificate` when `TLS_ENABLED=true`, and plain HTTP otherwise — no false-unhealthy containers.
* **Environment Reference:** `.env.example` documents both TLS modes end-to-end, including the browser-warning expectation for self-signed deployments.
* **Quickstart Recipe:** QUICKSTART.md gains a "LAN HTTPS Without a Proxy" walkthrough — three steps from env var to encrypted vault.

### 📚 4. Documentation & Repository Hygiene

* **Android Reference Corpus:** Initialized comprehensive Android project documentation, architecture specifications, and engineering guidelines (`9aba894`).
* **CI Release Flags:** The release workflow now supports `--release vX.Y.Z` commit-message flags for automated release publication (`fa72f67`).
* **Repository Hygiene:** Untracked the `.agents` directory from the git index per `.gitignore` (`d982474`), synchronized `DESIGN.md` with the master-detail and custom-fields patterns (`2c13b39`), and removed the superseded v0.0.1.4 release notes (`e8497bd`).

### 🧪 5. Complete Verification Matrix

* **8 Dedicated TLS Tests:** `tests/tls.test.ts` covers generation, `0o600` file permissions, SAN embedding, ~10-year validity, **stable-fingerprint reuse**, BYO path handling, half-configured rejection, and a **live HTTPS handshake over a real socket** with the generated materials.
* **Full Oracle:** **180 tests passing across all 12 suites** (0 failures), `tsc --noEmit` clean, production Vite bundle built.
* **Live Two-Boot Smoke:** First boot generated the cert and served `/api/health` over TLS; second boot loaded the persisted cert with an identical fingerprint while plain HTTP refused connection.
---

## 🏗️ Architectural Topology Map

```text
┌──────────────────────────────────────────────────┐
│              🌐 Browser / Agent Client           │
│   https://<lan-ip>:6464  (accept cert once)      │
└───────────────────────┬──────────────────────────┘
                        │  TLS 1.3 (EC P-256, self-signed)
                        ▼
┌──────────────────────────────────────────────────┐
│      🔌 Express 5 — Carapace Gateway (:6464)     │
│  https.createServer({ cert, key }) ← tlsManager  │
│  helmet HSTS · cors · rate limits · zod          │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│     🖥️ SQLite Bedrock + Audit Reef (DATA_DIR)    │
│  db.sqlite · audit.sqlite · certs/ (0o600)       │
└──────────────────────────────────────────────────┘
```

---

## 📋 Commit Ledger (Since `v0.0.1.5`)

* `f3448c9` — **chore:** bump version to 0.0.1.6 for native LAN TLS release
* `02ed28e` — **merge:** native LAN TLS with self-signed certificate generation
* `f35ba4a` — **docs:** add native LAN TLS to unreleased changelog
* `33157ff` — **feat:** native LAN TLS with self-signed certificate generation
* `9aba894` — **docs:** initialize Android project documentation, architecture specifications, and engineering guidelines
* `e8497bd` — **chore:** remove previous release notes RELEASE-v0.0.1.4.md in favor of v0.0.1.5
* `d982474` — **chore:** untrack .agents directory from git index per .gitignore
* `2c13b39` — **docs(design):** synchronize DESIGN.md with modern master-detail and custom fields patterns
* `fa72f67` — **ci:** support `--release` flag in commit messages for automated release publication

---

## ⚡ Deployment & Upgrade Instructions

### Using Containerized Environments (Self-Hosted / Production)

```bash
docker pull ghcr.io/clawstackstudios/shellguard:v0.0.1.6
docker restart shellguard
```

### Optional: Enable Native LAN TLS

```bash
# In your .env / compose environment:
TLS_ENABLED=true
# Restart — the cert generates on first boot, reuse forever after.
```

### Upgrading from Source

```bash
git fetch --tags
git checkout v0.0.1.6
npm install
npm run build
npm run scuttle:prod
```

> **Note:** Public deployments should still terminate TLS at a reverse proxy (Caddy, Traefik, nginx, Cloudflare Tunnel). Native TLS is a LAN convenience, not a public-exposure strategy — VPN access (Tailscale/WireGuard) is already encrypted transport.

---

*The Code That Molts.*

**Maintained by ClawStack Mobile Studios©™ under AGPL-3.0 license.**