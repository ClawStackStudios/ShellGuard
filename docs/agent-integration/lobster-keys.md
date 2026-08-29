# LobsterKeys (lb-) Lifecycle

<CopyPage />

**LobsterKeys** are sovereign API keys created by human vault owners and provided to autonomous AI agents.

---

## 🔑 Key Format Specification

```text
lb-a9f8c4e2b0d1e3f5a7c9b1d3e5f7a9c1b3d5e7f9a1c3b5d7e9f1a3c5b7d9e1f3
└── Prefix (3 chars)
    └─────────────────── 256-bit Random Hex Entropy (64 chars) ───────────────────┘
```

Total Length: **67 characters**.

---

## 🔒 Step 1: Hashing the Key (Client / Agent Side)

The agent **MUST NEVER** send the raw `lb-` key over HTTP. The agent computes its SHA-256 hash first:

::: code-group

```typescript [TypeScript / Node]
import crypto from 'node:crypto';

export function hashLobsterKey(lbKey: string): string {
  return crypto.createHash('sha256').update(lbKey).digest('hex');
}
```

```python [Python]
import hashlib

def hash_lobster_key(lb_key: str) -> str:
    return hashlib.sha256(lb_key.encode('utf-8')).hexdigest()
```

```bash [cURL / Bash]
echo -n "lb-your-lobster-key-here" | sha256sum | awk '{print $1}'
```

:::

---

## 🎟️ Step 2: Exchanging for an API Bearer Token

The agent calls `POST /api/auth/token`:

```http
POST /api/auth/token
Content-Type: application/json

{
  "type": "agent",
  "keyHash": "a1b2c3d4e5f6..."
}
```

### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "token": "api-9f8e7d6c5b4a3...",
    "expiresAt": "2026-08-28T21:00:00.000Z",
    "permissions": {
      "canRead": true,
      "canWrite": true,
      "canEdit": false,
      "canDelete": false
    }
  }
}
```

---

## 🛡️ Granular Permissions Matrix

| Permission | Permitted Actions | Denied Actions |
|---|---|---|
| `canRead` | `GET /api/vault`, `GET /api/notes`, `GET /api/ssh-keys` | Creating, editing, or deleting items |
| `canWrite` | `POST /api/vault`, `POST /api/notes` | Editing existing items or deleting items |
| `canEdit` | `PUT /api/vault/:id`, `PUT /api/notes/:id` | Deleting items |
| `canDelete` | `DELETE /api/vault/:id`, `DELETE /api/notes/:id` | Modifying settings or agent keys |
