# Docker & Container Deployment

<CopyPage />

ShellGuard is distributed as a single unified container on GitHub Packages (`ghcr.io/clawstackstudios/shellguard`).

---

## 🐳 Production `docker-compose.yml`

```yaml
services:
  shellguard:
    image: ghcr.io/clawstackstudios/shellguard:latest
    container_name: shellguard
    restart: unless-stopped
    ports:
      - "6464:6464"
    environment:
      - NODE_ENV=production
      - PORT=6464
      - PUID=1000
      - PGID=1000
      - DB_ENCRYPTION_KEY=${DB_ENCRYPTION_KEY}
      - ADMIN_TOKEN=${ADMIN_TOKEN}
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:6464/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

---

## 🔑 Permissions & Non-Root Execution

The container drops privileges via an entrypoint script that remaps user IDs matching your host `PUID` and `PGID` (defaults: `1000:1000` or `99:100` on Unraid) before starting Node.js.
