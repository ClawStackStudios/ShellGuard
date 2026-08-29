# System Architecture Overview

<CopyPage />

ShellGuard is architected as a lightweight, single-binary container deployment that unifies a React 19 frontend and an Express 5 backend over an encrypted SQLite bedrock.

---

## 🏛️ System Blueprint

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT BROWSER                                   │
│                                                                             │
│  React 19 SPA (Vite) · Tailwind CSS · Framer Motion                         │
│  ├─ ShellCryption Engine (HKDF-SHA-256 + AES-GCM-256)                       │
│  ├─ Key Derivation & In-Memory Key Cache                                    │
│  ├─ TOTP Generation & Authenticator Engine                                  │
│  └─ Dynamic Router (/superlobster, /admin-login, /)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON Payloads
                                       │ (Client-Sealed Blobs)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        EXPRESS 5 API SERVER (:6565 / :6464)                 │
│                                                                             │
│  Middleware Pipeline:                                                       │
│  ├─ Helmet & CORS Policy                                                    │
│  ├─ Cookie Parser (sg_admin_session)                                        │
│  ├─ Rate Limiters (5/10m Admin, 100/15m Auth, Per-Agent Burst Controls)     │
│  ├─ Zod Schema Validation (10 MB attachment payload ceiling)                │
│  ├─ Per-Row Metadata Encryption Filter (prepareReadAll / prepareWrite)      │
│  └─ Error Handler (Production masking, SQLITE_BUSY retry)                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Direct Driver Calls
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    SQLITE STORAGE BEDROCK (WAL MODE)                        │
│                                                                             │
│  better-sqlite3-multiple-ciphers                                            │
│  ├─ DATA_DIR/db.sqlite (SQLCipher Layer 3 At-Rest Encryption)               │
│  ├─ DATA_DIR/audit.sqlite (Append-Only Forensic Reef)                       │
│  └─ DATA_DIR/backups/ (Online Backup API Atomic Snapshots)                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌊 Request Lifecycle

1. **Authentication Gate**: Requests carry either a short-lived `api-` Bearer token (session) or an `sg_admin_session` cookie (for `/superlobster`).
2. **Schema Invariant Check**: Zod validates all inputs before controllers execute.
3. **Metadata Encryption**: On `POST`/`PUT`, metadata fields (title, URL, username, notes, category) are encrypted with server-side AES-256-GCM before writing to SQLite.
4. **Forensic Auditing**: Every mutation (create, edit, delete, backup, login) emits an asynchronous, redacted event to `audit.sqlite`.

---

## Read More

<CardGrid cols="3">
  <Card title="Triple-Layer Defense" href="/architecture/triple-layer-crypto" icon="🔐">
    Examine the mathematics behind all three encryption layers.
  </Card>
  <Card title="The Three Secrets" href="/architecture/three-secrets" icon="🗝️">
    Understand the separation between ADMIN_TOKEN, DB key, and hu- keys.
  </Card>
  <Card title="Threat Model" href="/architecture/threat-model" icon="🛡️">
    OWASP mitigation matrix and attack vector analysis.
  </Card>
</CardGrid>
