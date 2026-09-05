---
title: Unraid Community Applications Deployment
description: Installing and Managing ShellGuard on Unraid NAS Systems
---

# 🎛️ Unraid Community Applications

<CopyPage />

ShellGuard provides first-class support for Unraid NAS systems. It ships with an official Unraid Community Applications XML template ([`shellguard-unraid-template.xml`](file:///config/Documents/workspace-lucas/projects/Agents/ShellGuard/shellguard-unraid-template.xml)) configured specifically for Unraid's container management paradigm.

---

## 🚀 Installation on Unraid

### Step 1: Install the XML Template
Copy `shellguard-unraid-template.xml` into your Unraid flash drive templates directory:

```bash
cp shellguard-unraid-template.xml /boot/config/plugins/dockerMan/templates-user/
```

Alternatively, if installing via Community Applications search, select **ShellGuard** from the catalog.

### Step 2: Configure Container Settings

In the Unraid WebUI under **Docker &rarr; Add Container**, select the **ShellGuard** template and configure the fields:

| Field | Setting / Value | Description |
| :--- | :--- | :--- |
| **Name** | `shellguard` | Container name in Unraid WebUI. |
| **Repository** | `ghcr.io/clawstackstudios/shellguard:latest` | Official production Docker image. |
| **Network Type** | `Bridge` | Standard Docker bridge network. |
| **Host Port 1** | `6464` | Host port mapped to container port `6464`. |
| **Appdata Storage** | `/mnt/user/appdata/shellguard` | Persistent storage path mapped to `/app/data`. |
| **PUID** | `99` | Unraid `nobody` user ID. |
| **PGID** | `100` | Unraid `users` group ID. |
| **DB_ENCRYPTION_KEY**| `openssl rand -base64 32` | 256-bit Base64 key for Layer 2 metadata and Layer 3 database encryption. |
| **ADMIN_TOKEN** | Strong Secret Token | Master authentication key for the SuperLobster admin panel (`/superlobster`). |

### Step 3: Apply & Launch
Click **Apply**. Unraid will pull the container image, remap volume permissions to `nobody:users` (`99:100`), run migrations, and launch the reef.

Open **`http://<unraid-ip>:6464`** in your browser.

---

## 🔒 LAN Contexts & WebCrypto Fallback on Unraid

Modern web browsers enforce strict security boundaries on the Web Cryptography API (`crypto.subtle`), disabling it on non-localhost plain HTTP IP addresses (e.g. `http://192.168.1.100:6464`).

ShellGuard provides two robust solutions for Unraid:

1. **Pure TypeScript WebCrypto Fallback Engine**:
   - Built into the web vault (`src/lib/webCryptoFallback.ts`).
   - If accessing the vault over plain HTTP on an internal LAN IP, ShellGuard automatically falls back to an internal pure-TypeScript cryptographic engine (SHA-256, HMAC, HKDF, and AES-GCM-256).
   - Zero degraded security: exact bit-for-bit mathematical equivalence with browser native SubtleCrypto.

2. **Native LAN TLS (`TLS_ENABLED=true`)**:
   - Add the environment variable `TLS_ENABLED=true` in the Unraid container settings.
   - ShellGuard generates a persistent 10-year EC P-256 self-signed certificate covering your Unraid IP and hostname.
   - Access via `https://<unraid-ip>:6464` (accept the self-signed certificate warning once; it persists across restarts).
