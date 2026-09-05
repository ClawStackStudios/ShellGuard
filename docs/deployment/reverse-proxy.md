---
title: Reverse Proxy & TLS Configuration
description: TLS Termination, Native LAN Self-Signed TLS, Caddy, Nginx, and Traefik
---

# 🔒 Reverse Proxy & TLS Configuration

<CopyPage />

Because Web Crypto features (`crypto.subtle`) strictly require a **Secure Context** (`https://` or `localhost`), production instances accessible over a domain name should terminate TLS using a reverse proxy or ShellGuard's built-in native TLS engine.

---

## ⚡ Option 1: Native LAN TLS (`TLS_ENABLED=true`)

For home labs, internal LAN deployments, and NAS servers (Unraid, TrueNAS) that do not use external domain names or public reverse proxies, ShellGuard includes an automated **Native LAN TLS** engine.

```bash
# In your docker-compose.yml or environment:
TLS_ENABLED=true
```

### How It Works:
1. **Persistent EC P-256 Certificate**: On first boot, ShellGuard generates a 10-year elliptic curve certificate saved to `DATA_DIR/certs/` with restrictive permissions (`0o600`).
2. **Dynamic SANs**: Automatically includes Subject Alternative Names (SANs) for `localhost`, `127.0.0.1`, and every detected physical LAN network interface IP address.
3. **Accept-Once Invariant**: Browsers will display a self-signed warning upon first access. Once accepted, the certificate remains valid across container restarts.
4. **Custom Certificates**: You can bring your own certificate/key pair by providing `TLS_CERT_PATH` and `TLS_KEY_PATH`.

---

## 🌐 Option 2: Caddy (Recommended for Public Domains)

Caddy automatically provisions and renews Let's Encrypt certificates with zero manual configuration.

```nginx
vault.yourdomain.com {
    reverse_proxy localhost:6464
}
```

Ensure `TRUST_PROXY=true` is set in ShellGuard's environment.

---

## 🚀 Option 3: Nginx Configuration

For environments standardizing on Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name vault.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/vault.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vault.yourdomain.com/privkey.pem;

    # Scoped headroom for encrypted password attachments (10MB limit + base64 overhead)
    client_max_body_size 35M;

    location / {
        proxy_pass http://127.0.0.1:6464;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🛡️ Reverse Proxy Invariants

When placing ShellGuard behind an external reverse proxy:

1. **`TRUST_PROXY=true`**: Must be set in ShellGuard's environment so that Express accurately detects client IP addresses for rate limiting and forensic audit logs.
2. **`client_max_body_size 35M`**: Required in your proxy configuration to allow uploading encrypted file attachments (ShellGuard's internal limit is 32 MB for `/api/attachments`).
3. **HSTS Header**: ShellGuard automatically emits `Strict-Transport-Security` headers when TLS is enabled or when running in production with secure connections.
