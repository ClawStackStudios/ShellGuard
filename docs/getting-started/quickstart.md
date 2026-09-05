# 5-Minute Quickstart

<CopyPage />

Get your sovereign ShellGuard reef up and running in minutes using Docker Compose or Node.js.

---

## 🐳 Option A: Docker Compose (Recommended)

ShellGuard compiles into a single multi-stage container (`node:20-alpine`) running the Vite-built React UI and Express 5 API on port **`:6464`**.

### Step 1: Configure & Generate Keys

1. Create a directory for your deployment:
   ```bash
   mkdir -p shellguard && cd shellguard
   ```

2. Generate the master database encryption key and SuperLobster admin token:
   ```bash
   # Generate 256-bit DB Encryption Key (Layer 2 metadata & Layer 3 SQLCipher)
   openssl rand -base64 32

   # Generate SuperLobster Admin Token
   openssl rand -hex 24
   ```

3. Create `docker-compose.yml`:
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
         - ADMIN_TOKEN=your_generated_admin_token_here
       healthcheck:
         test: ["CMD", "wget", "-qO-", "http://localhost:6464/api/health"]
         interval: 15s
         timeout: 10s
         retries: 5
         start_period: 15s
   ```

### Step 2: Start & Verify the Container

1. Launch the unified container stack in detached mode:
   ```bash
   docker compose up -d --wait
   ```

2. Verify that the server is healthy and the database is initialized:
   ```bash
   curl http://localhost:6464/api/health
   # {"success":true,"service":"ShellGuard API","version":"0.0.1.8","mode":"sqlite","uptime":14.2,"counts":{"vaultPearls":0,"secureNotes":0,"sshKeys":0,"attachments":0,"agentKeys":0}}
   ```

### Step 3: Launch Vault & First-Time Molting

1. Open **[http://localhost:6464](http://localhost:6464)** in your web browser.
2. Click **Molt New Identity** to generate your sovereign 67-character `hu-` master key.
3. Download and securely store your identity recovery JSON kit. **There are no central passwords, reset emails, or account recovery links.**
4. Enter your vault dashboard (**The Grotto**) to begin storing secrets and issuing agent delegation keys.

---

## 💻 Option B: Local Node.js Development

If you are developing features or contributing to ShellGuard:

### 1. Prerequisites
- **Node.js**: v20+ (Node v22.23.0 recommended)
- **C/C++ Build Toolchain**: Required for `better-sqlite3-multiple-ciphers` native bindings (`build-essential`, `python3`, `make`, `g++`).

### 2. Install Dependencies
```bash
npm install
cp .env.example .env
```

### 3. Start Development Servers
```bash
npm run scuttle:dev-start
```
- **Frontend (Vite + HMR)**: [http://localhost:6464](http://localhost:6464)
- **Backend (Express API)**: [http://localhost:6565](http://localhost:6565) (proxied via Vite `/api`)

---

## 🛑 Useful Scuttle Commands

```bash
# Gracefully stop running dev servers
npm run scuttle:dev-stop

# Wipe development database (data-dev/)
npm run scuttle:dev-reset

# Validate a database backup before restore
npm run scuttle:restore -- --file data/backups/db-....sqlite --key <KEY>
```
