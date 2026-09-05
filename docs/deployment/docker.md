---
title: Docker & Container Deployment
description: Production Container Deployment, Compose Stacks, and Operational Hardening
---

# 🐳 Docker & Container Deployment

<CopyPage />

ShellGuard is distributed as a single unified container image on GitHub Container Registry (`ghcr.io/clawstackstudios/shellguard`). The container bundles the production-compiled React frontend and the Express 5 backend into a hardened `node:20-alpine` runtime.

---

## 🚀 Rapid Deployment with Docker Compose

### Step 1: Configure & Generate Keys

1. Create a dedicated project directory:
   ```bash
   mkdir -p shellguard && cd shellguard
   ```

2. Generate the master database encryption key and SuperLobster admin token:
   ```bash
   # Generate 256-bit DB Encryption Key (Layer 2 metadata & Layer 3 SQLCipher)
   openssl rand -base64 32

   # Generate secure SuperLobster Admin Token
   openssl rand -hex 24
   ```

3. Create `docker-compose.yml` in the directory:
   ```yaml
   services:
     shellguard:
       image: ghcr.io/clawstackstudios/shellguard:latest
       container_name: shellguard
       restart: unless-stopped
       ports:
         - "6464:6464"
       volumes:
         - ./data:/app/data
       environment:
         - NODE_ENV=production
         - PORT=6464
         - DATA_DIR=/app/data
         - DB_ENCRYPTION_KEY=your_generated_base64_key_here
         - ADMIN_TOKEN=your_superlobster_admin_token_here
         - PUID=1000
         - PGID=1000
         - TRUST_PROXY=false
       healthcheck:
         test: ["CMD", "wget", "-qO-", "http://localhost:6464/api/health"]
         interval: 15s
         timeout: 10s
         retries: 5
         start_period: 15s
   ```

### Step 2: Start & Verify the Container

1. Launch the stack in detached mode:
   ```bash
   docker compose up -d --wait
   ```

2. Confirm reef health:
   ```bash
   curl http://localhost:6464/api/health
   ```

### Step 3: Launch Vault & Access Control Planes

- **Sovereign Web Vault**: Open **[http://localhost:6464](http://localhost:6464)** to molt your 67-character `hu-` master identity key.
- **SuperLobster Control Plane**: Open **[http://localhost:6464/superlobster](http://localhost:6464/superlobster)** and log in with your configured `ADMIN_TOKEN` for system telemetry, scheduled snapshot management, and user administration.

---

## ⚙️ Environment Configuration Reference

| Environment Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| **`PORT`** | No | `6464` | The HTTP/HTTPS port the Express server listens on inside the container. |
| **`DATA_DIR`** | Yes | `/app/data` | Path to persistent storage containing `db.sqlite`, `audit.sqlite`, and snapshot backups. |
| **`DB_ENCRYPTION_KEY`** | **Yes** | *(Empty)* | 256-bit Base64 key for per-row metadata encryption (Layer 2) and SQLCipher whole-DB encryption (Layer 3). |
| **`ADMIN_TOKEN`** | **Yes** | *(Empty)* | Authentication token for the SuperLobster control plane at `/superlobster`. |
| **`PUID` / `PGID`** | No | `1000:1000` | Host user/group IDs for permissions remapping. Set to `99:100` on Unraid. |
| **`TRUST_PROXY`** | No | `false` | Enable (`true`) if running behind a reverse proxy terminating TLS (Nginx, Caddy, Traefik). |
| **`TLS_ENABLED`** | No | `false` | When `true`, enables Native LAN TLS with automatic 10-year EC P-256 self-signed certificate generation. |
| **`CORS_ORIGIN`** | No | *(Empty)* | Restricts cross-origin resource sharing to designated domain origins. |
| **`TOKEN_TTL_DEFAULT`**| No | `24h` | Default expiration lifetime for user session tokens (`1h`, `24h`, `7d`). |

---

## 🔒 Security & Non-Root Execution

The container includes a custom entrypoint script that executes prior to starting Node.js:
1. **Dynamic ID Remapping**: Remaps the internal `node` user to match the host `PUID` and `PGID`.
2. **Volume Ownership Verification**: Enforces `chown -R` on `/app/data` to ensure SQLite can write its WAL and lock files without host permissions friction.
3. **Privilege Dropping**: Drops root privileges using `su-exec` to execute the Node.js process as a non-privileged user.
