---
title: Troubleshooting & FAQ
description: Common issues, network connectivity, self-signed TLS, mobile sync, and zero-knowledge recovery in ShellGuard
---

# 🛠️ Troubleshooting & FAQ

<CopyPage />

Solutions to common configuration, network, and operational questions when setting up and running ShellGuard across desktop and mobile.

---

## 🌐 1. Mobile & Gateway Connectivity

### ❌ Mobile App reports "Connection Refused" or cannot reach server
- **Symptom**: When entering the gateway URL in ShellGuard Mobile, the screen reports `Failed to connect to gateway` or hangs indefinitely.
- **Root Cause**: The mobile device cannot route to the configured address, or port `6464` is blocked.
- **Resolution**:
  1. **Do not use `localhost` on mobile**: On an Android device or emulator, `localhost` points to the phone itself. Use your server's local subnet IP (e.g. `http://192.168.1.100:6464`) or your Tailscale hostname.
  2. **Verify Host Firewall**: Ensure your host machine permits incoming TCP connections on port 6464:
     ```bash
     # Ubuntu / Debian UFW
     sudo ufw allow 6464/tcp
     ```
  3. **Verify Docker Port Binding**: Ensure `docker-compose.yml` binds to `0.0.0.0:6464` (default in compose: `- "6464:6464"`).
  4. **Verify Health Endpoint from Device**: Open Chrome on your phone and navigate to `http://<server-ip>:6464/api/health`. You should receive a valid JSON status response.

### ⚠️ Unencrypted HTTP (`http://`) and Android Cleartext Traffic
- **Question**: Does ShellGuard Mobile support connecting to homelab servers over unencrypted `http://`?
- **Answer**: **Yes**. Modern Android (API 28+) disables cleartext HTTP by default, but ShellGuard Mobile explicitly configures `<base-config cleartextTrafficPermitted="true" />` and registers `ConnectionSpec.CLEARTEXT` in its network engine. You can safely connect over local LAN subnets (`192.168.x.x`, `10.x.x.x`) or Tailscale WireGuard meshes (`*.ts.net`).
- **Visual Indicator**: The mobile app displays an amber warning pill (`⚠️ Unencrypted HTTP`) to ensure transport awareness. Even over plain HTTP, all vault item secrets remain sealed with client-side Layer 1 AES-GCM-256.

---

## 🔒 2. TLS Certificates, Invites & WebCrypto Origins

### 📜 Browser warning: "Your connection is not private" (`NET::ERR_CERT_AUTHORITY_INVALID`)
- **Symptom**: When visiting `https://<server-ip>:6565`, Chrome or Firefox displays a full-page red security warning.
- **Root Cause**: ShellGuard uses a self-signed EC P-256 certificate for local LAN transport encryption. Because it is not signed by a commercial public Certificate Authority (CA), browsers warn by default.
- **Resolution**:
  1. **Trust on First Use (TOFU)**: Click **Advanced ➔ Proceed to [host] (unsafe)**. ShellGuard persists the certificate on disk (`DATA_DIR/certs/cert.pem`), so you only need to accept this once per device.
  2. **Install Root Certificate**: Log into SuperLobster at `/superlobster` ➔ **Transport & Mobile Pairing** ➔ click **Download Certificate (.pem)**. Install this `.pem` file into your OS or browser's "Trusted Root Certification Authorities" store to permanently silence warnings across all local devices.

### 🚫 "This invite link is invalid or has already been used"
- **Symptom**: Opening `/?invite=inv_...` displays a red error banner and permanently locks the Hatch Identity button with **`INVITE LINK EXPIRED OR USED`**.
- **Root Cause**: ShellGuard enforces atomic single-use invite burning:
  1. Once an identity is registered with an invite, the token is permanently deleted from SQLite (`api_tokens`).
  2. If the invite's Time-to-Live (TTL: 1h, 6h, 24h, 7d) has passed, the token is expired.
- **Resolution**: Request a fresh invite link or QR code from the instance operator via the SuperLobster **Transport & Mobile Pairing** tab.

### 🔄 Why didn't certificate regeneration prompt me to accept the warning again?
- **Symptom**: After clicking **Regenerate Certificate** in SuperLobster, refreshing the page loaded immediately without asking to re-accept the self-signed cert.
- **Root Cause**: Browsers cache active TLS socket connections via HTTP Keep-Alive. While the server immediately updates its in-memory context via `server.setSecureContext({ key, cert })` and closes idle sockets, active browser tabs may hold lingering HTTP/2 or Keep-Alive tunnels.
- **Resolution**: Open an Incognito window, perform a hard refresh (`Ctrl + Shift + R` or `Cmd + Shift + R`), or verify the new fingerprint in your browser's security inspector (Padlock icon ➔ Connection is secure ➔ Certificate viewer).

### ⚠️ Web Browser displays "WebCrypto requires secure origin"
- **Symptom**: Features like in-browser SSH key generation or WebCrypto operations display a warning when accessing ShellGuard Web from another computer over `http://192.168.x.x:6565`.
- **Root Cause**: The W3C WebCrypto API (`crypto.subtle`) is restricted by modern browsers strictly to **Secure Contexts** (`https://` or `http://localhost`).
- **Resolution**:
  - Run ShellGuard with `TLS_ENABLED=true` and access via **`https://<server-ip>:6565`**. See the [First-Class HTTPS & TLS Guide](/deployment/https-tls).
  - Alternatively, place ShellGuard behind a reverse proxy terminating TLS (Caddy, Traefik, Cloudflare Tunnels). See the [Reverse Proxy & TLS Guide](/deployment/reverse-proxy).

---

## 🗝️ 3. Identity, ClawKeys & Disaster Recovery

### ❓ I lost my 67-character `hu-` master key. Can an admin reset it?
- **Answer**: **No. It is mathematically impossible.**
- **Why**: ShellGuard is built on zero-knowledge cryptographic isolation. The server only holds `SHA-256(hu-)` for login verification and never possesses the decryption key. Secrets are encrypted client-side using HKDF-derived keys.
- **Recovery Path**: If you lose your `hu-` key and your `shellguard_identity_<username>.json` recovery kit, your vault data cannot be recovered by anyone. Always store your recovery file on an offline USB drive or print an Emergency Sheet.

### ❌ "Invalid Key Format" Error during Login
- **Symptom**: Submitting the key displays an invalid format error.
- **Resolution**:
  - Ensure the key begins with the **`hu-`** prefix (67 characters total).
  - Verify there are no leading or trailing whitespace characters.
  - If you downloaded your `shellguard_identity_<username>.json` file, open it in a text editor and copy the exact value from the `"token"` field.

---

## 🔄 4. Mobile Sync & Offline Operation

### ⏳ Mobile App changes do not appear immediately on Web
- **Symptom**: Items created on Android don't reflect on the web dashboard.
- **Resolution**:
  1. Check device connectivity: Pull down on the **Vault Dashboard** in ShellGuard Mobile to trigger an immediate manual synchronization.
  2. Verify sync status in **Settings > Sync**: The screen displays the timestamp of the last successful delta synchronization.
  3. Ensure ShellGuard Mobile has permission to run in the background (Android Settings > Apps > ShellGuard > Battery > **Unrestricted**).

### 🔀 What happens if I edit the same item on Mobile and Web simultaneously?
- **Answer**: ShellGuard uses **Mutex-Serialized Delta Sync** with **Last-Write-Wins (LWW)** conflict resolution based on server monotonic sequence timestamps. If both clients edit the same record offline, the most recent timestamp takes precedence. Previous password revisions are preserved in the item's password history drawer.

---

## 🐳 5. Docker & Server Operations

### ❌ Docker container exits immediately on startup (Exit Code 1)
- **Symptom**: `docker compose up -d` starts the container, but it immediately shuts down.
- **Diagnosis**: Run `docker compose logs shellguard` to inspect the startup trace.
- **Common Causes**:
  1. **Missing or Malformed `DB_ENCRYPTION_KEY`**: Must be a valid 32-byte Base64 string:
     ```bash
     openssl rand -base64 32
     ```
  2. **File Permissions on `./data` Volume**: If the directory on the host was created with root ownership, the Node process cannot create the SQLite database:
     ```bash
     sudo chown -R 1000:1000 ./data
     ```

### 🔍 How do I verify the server is healthy?
- Run a curl check against the health endpoint:
  ```bash
  curl -k -s https://localhost:6565/api/health | jq .
  ```
  Expected output:
  ```json
  {
    "success": true,
    "service": "ShellGuard API",
    "version": "0.0.2.9",
    "mode": "sqlite",
    "uptime": 45.2,
    "counts": {
      "vaultPearls": 1,
      "secureNotes": 0,
      "sshKeys": 0,
      "attachments": 0,
      "agentKeys": 0
    }
  }
  ```

---

## 🆘 Still Need Help?

- 💬 **GitHub Discussions**: [github.com/clawstackstudios/shellguard/discussions](https://github.com/clawstackstudios/shellguard/discussions)
- 🐛 **Issue Tracker**: [github.com/clawstackstudios/shellguard/issues](https://github.com/clawstackstudios/shellguard/issues)
- 📖 **Lexicon & Terminology**: [ClawStack Lexicon (Glossary)](/reference/glossary)
