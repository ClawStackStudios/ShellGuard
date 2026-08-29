# 5-Minute Quickstart

<CopyPage />

Get your sovereign ShellGuard reef up and running in minutes using Docker Compose or Node.js.

---

## 🐳 Option A: Docker Compose (Recommended)

ShellGuard compiles into a single multi-stage container (`node:20-alpine`) running the Vite-built React UI and Express 5 API on port **`:6464`**.

### 1. Generate an Encryption Key
```bash
# Generate 256-bit base64 key for Layer 2 (metadata) & Layer 3 (SQLCipher)
openssl rand -base64 32
```

### 2. Configure Environment
Create a `.env` file or export your variables:
```bash
DB_ENCRYPTION_KEY=your_generated_base64_key_here
ADMIN_TOKEN=your_strong_admin_token_here
PORT=6464
```

### 3. Launch the Stack
```bash
docker compose up -d --wait
```

### 4. Verify Reef Health
```bash
curl http://localhost:6464/api/health
# {"success":true,"data":{"status":"ok","version":"0.2.0","database":"connected"}}
```
Open **[http://localhost:6464](http://localhost:6464)** in your web browser.

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
