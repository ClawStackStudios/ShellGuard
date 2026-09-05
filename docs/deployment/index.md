---
title: Deployment & Operations Overview
description: Sovereign Self-Hosting, Containerization, and Infrastructure Deployment
---

# 🐳 Deployment & Operations Overview

<CopyPage />

ShellGuard is designed for absolute self-hosting sovereignty. It compiles into a single, unified Docker container (`node:20-alpine`) that serves both the compiled React client UI and the Express 5 backend API. There are zero mandatory external dependencies, no third-party cloud brokers, and no external database daemons required.

---

## 🏗️ Deployment Guides

<CardGrid cols="2">
  <Card title="Docker & Compose Stacks" href="/deployment/docker" icon="🐳" tag="Containers">
    Deploy with Docker Compose, configure non-root PUID/PGID execution, persistent data volumes, and health checks.
  </Card>
  <Card title="Unraid Community Applications" href="/deployment/unraid" icon="🎛️" tag="NAS">
    Install directly on Unraid using the official XML template with mapped appdata storage and nobody permissions.
  </Card>
  <Card title="Reverse Proxy & TLS" href="/deployment/reverse-proxy" icon="🔒" tag="Networking">
    Set up Caddy or Nginx for SSL termination, or enable Native LAN TLS (<code>TLS_ENABLED=true</code>) for self-signed certificates.
  </Card>
  <Card title="Forensic Auditing (audit.sqlite)" href="/deployment/forensic-auditing" icon="🩺" tag="Auditing">
    Inspect the append-only, tamper-resistant security log stored in <code>DATA_DIR/audit.sqlite</code>.
  </Card>
</CardGrid>

---

## ⚙️ Environment Configuration Matrix

All production settings are configured via standard environment variables:

| Variable | Default | Required | Description |
| :--- | :--- | :--- | :--- |
| **`PORT`** | `6464` (Docker) / `6565` (Dev) | No | TCP listening port for the Express application. |
| **`DATA_DIR`** | `/app/data` | Yes | Path to persistent storage containing `db.sqlite`, `audit.sqlite`, and backups. |
| **`DB_ENCRYPTION_KEY`** | *(Empty)* | **Yes** | 256-bit Base64 key for Layer 2 metadata encryption & SQLCipher whole-DB encryption. Generate via `openssl rand -base64 32`. |
| **`ADMIN_TOKEN`** | *(Empty)* | **Yes** | Authentication token for the SuperLobster control plane at `/superlobster`. |
| **`TLS_ENABLED`** | `false` | No | When `true`, automatically generates a persistent 10-year self-signed EC P-256 certificate for LAN HTTPS. |
| **`TLS_CERT_PATH`** | *(Generated)* | No | Optional path to custom TLS certificate PEM file. |
| **`TLS_KEY_PATH`** | *(Generated)* | No | Optional path to custom TLS private key PEM file. |
| **`PUID`** | `1000` | No | Linux user ID for container file ownership (`99` on Unraid). |
| **`PGID`** | `1000` | No | Linux group ID for container file ownership (`100` on Unraid). |
| **`TRUST_PROXY`** | `false` | No | Set to `true` when running behind Nginx, Caddy, Cloudflare, or Traefik. |
| **`CORS_ORIGIN`** | *(Empty)* | No | Optional allowed CORS origins for external API clients. |
| **`TOKEN_TTL_DEFAULT`**| `24h` | No | Default expiration lifetime for user session tokens (`1h`, `24h`, `7d`). |
| **`NODE_ENV`** | `production` | No | Node runtime environment (`production` or `development`). |

---

## 🩺 Health Check Endpoint

ShellGuard exposes an unauthenticated health check endpoint at `GET /api/health`:

```bash
curl http://localhost:6464/api/health
```

### Response Payload:
```json
{
  "success": true,
  "service": "ShellGuard API",
  "version": "0.0.1.7",
  "mode": "sqlite",
  "uptime": 3612.45,
  "counts": {
    "vaultPearls": 42,
    "secureNotes": 12,
    "sshKeys": 5,
    "attachments": 8,
    "agentKeys": 3
  }
}
```

Container orchestrators (Docker, Kubernetes, Nomad) use this endpoint to monitor container health and automatically restart degraded instances.
