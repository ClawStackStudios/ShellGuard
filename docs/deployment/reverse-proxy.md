# Reverse Proxy & TLS Setup

<CopyPage />

Because Web Crypto features (`crypto.subtle`) strictly require a Secure Context (`https://` or `localhost`), production instances should run behind a reverse proxy terminating TLS.

---

## 🔒 Caddy Configuration

```nginx
vault.yourdomain.com {
    reverse_proxy localhost:6464
}
```

---

## 🌐 Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name vault.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/vault.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vault.yourdomain.com/privkey.pem;

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
