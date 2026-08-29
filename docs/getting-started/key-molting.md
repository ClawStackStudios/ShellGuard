# Key Molting & hu- Identity

<CopyPage />

ShellGuard is strictly passwordless. There are no server-side user passwords, no email reset links, and no forgotten password forms.

---

## 🗝️ The Human Key (`hu-`)

Your identity and vault encryption root are unified into a single 67-character cryptographic token known as the **Human Key** (`hu-` + 64 hex characters).

```text
hu-3b9f4e81c7a20d4e9b6a1234567890abcdef1234567890abcdef1234567890abcdef
└── Prefix (3 chars)
    └─────────────────── 256-bit Random Hex Entropy (64 chars) ───────────────────┘
```

### The Dual Role of the `hu-` Key:

1. **Authentication Identity (Server-Side)**:
   - When you log in, your browser computes `SHA-256(hu- key)` client-side.
   - Only the SHA-256 hash is transmitted to `POST /api/auth/token`.
   - The server stores the hash and verifies it using a constant-time comparison (`crypto.timingSafeEqual`).
   - The server **NEVER** receives or stores the raw `hu-` key.

2. **Zero-Knowledge Decryption (Client-Side)**:
   - In your browser, the raw `hu-` key is fed into HKDF-SHA-256 alongside the item's UUID salt to derive an item-specific AES-GCM-256 key.
   - All secret decryption occurs in browser memory. When you close the tab or lock your session, the key is wiped from RAM.

---

## 📥 The Vault Access File (`shellguard_identity_key.json`)

When you register a new lobster identity during Setup, ShellGuard prompts you to download your Vault Access File:

```json
{
  "version": "1.0.0",
  "username": "lucas",
  "displayName": "Lucas",
  "humanKey": "hu-3b9f4e81c7a20d4e9b6a1234567890abcdef...",
  "uuid": "4ff11202-d872-4415-99db-1bbad96776d8",
  "createdAt": "2026-08-28T20:00:00.000Z"
}
```

> [!CAUTION]
> **Store this file safely in offline storage or a hardware token.** If you lose your `hu-` key, your vault is mathematically unrecoverable. Because of ShellGuard's zero-knowledge architecture, no administrator or operator can reset it for you.
