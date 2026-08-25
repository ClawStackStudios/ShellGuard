---
name: shellguard-agent-api©™
description: The canonical ShellGuard©™ agent integration skill. Full API reference for autonomous agents (Lobsters©™) to authenticate and operate a zero-knowledge secrets vault — vault pearls (passwords), secure notes, SSH keys, attachments, agent keys and user settings.
---

# ShellGuard©™ Agent API Skill

## 🛡️ Overview

ShellGuard©™ is a **zero-knowledge, self-hostable secrets vault** that agents integrate with via HTTP API. Every secret is encrypted **client-side** with ShellCryption©™ (AES-GCM-256) before it leaves your machine; the server stores only opaque ciphertext blobs in SQLite. This skill document defines every action an agent can take — from authentication to CRUD operations across all vault domains.

**Key Principles:**
- **Zero-Knowledge by Construction:** The server never sees plaintext secrets, raw `hu-`/`lb-` keys, or derived CryptoKeys. Agents integrating with ShellGuard **MUST NOT expect plaintext** — every `secret`, `content`, `key_value` and `file_data` field is an opaque, client-encrypted blob (see [Zero-Knowledge Data Format](#zero-knowledge-data-format))
- **Human-First Permissions:** All agents must be explicitly authorized by a human via the Settings panel before accessing resources
- **Granular Access Control:** Each agent key has independent permission grants (`canRead`, `canWrite`, `canEdit`, `canDelete`)
- **Cryptographic Identity:** Agents prove identity via a `lb-` (Lobster) key hash, issued tokens are `api-` prefixed
- **No Passwords:** Authentication is stateless and cryptographic — no session state, no server-side passwords, no recovery email

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Permissions Model](#permissions-model)
3. [Vault Pearls API](#vault-pearls-api-passwords)
4. [Secure Notes API](#secure-notes-api)
5. [SSH Keys API](#ssh-keys-api)
6. [Attachments API](#attachments-api)
7. [Agent Keys API](#agent-keys-api)
8. [Settings API](#settings-api)
9. [Zero-Knowledge Data Format](#zero-knowledge-data-format)
10. [Token Lifetime & TTL Semantics](#token-lifetime--ttl-semantics)
11. [Error Codes](#error-codes)
12. [Rate Limiting](#rate-limiting)

---

## Authentication

### Key Types

| Prefix | Type | Usage | Context |
|--------|------|-------|---------|
| `hu-` | Human Identity | Secret stored in offline identity file | Login; never sent to server |
| `lb-` | Lobster (Agent) Key | Secret used to request API tokens | Agent setup; never sent to server |
| `api-` | API Token | Bearer token for API calls | All authenticated requests |

### Step 1: Generate Identity / Agent Key

A **human** either registers a new identity or creates an agent key in **Settings → Agent Keys**.

```
UI: Settings panel → "+ New Agent Key" button
    └─ Human provides a name (e.g., "My Credential Sync Daemon")
    └─ System generates a 64-character `lb-` key
    └─ Human copies the key and gives it to the agent
```

Humans register via `POST /api/auth/register`; the `hu-` identity secret is generated client-side and never transmitted.

### Step 2: Hash the Key

The **agent** must hash its `lb-` key before sending it to the server.

```typescript
// Pseudocode — your language may vary
async function hashAgentKey(lbKey: string): Promise<string> {
  // lbKey format: "lb-aAbBcCdDeEfFgGhH..." (67 chars total)
  const encoder = new TextEncoder()
  const data = encoder.encode(lbKey)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}
// Output: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" (64 hex chars)
```

**Critical:** The raw `lb-` key is **NEVER** sent to the server. Only the SHA-256 hash is transmitted. The server stores the hash and compares with a constant-time comparison.

### Step 3: Exchange for API Token

The **agent** calls `POST /api/auth/token` with the hashed key.

```http
POST /api/auth/token
Content-Type: application/json

{
  "type": "agent",
  "keyHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**Response — 200 OK** (all success responses use the `{success, data}` envelope):
```json
{
  "success": true,
  "data": {
    "token": "api-aBcDeFgHiJkLmNoPqRsTuVwXyZ123456",
    "expiresAt": "2026-08-24T12:00:00.000Z"
  }
}
```

**Error Responses** (error bodies are plain `{ error, message }` objects, no envelope):
- `401 Unauthorized` — keyHash does not match any registered agent key
- `400 Bad Request` — missing or malformed `type` or `keyHash` field (zod `details[]` included)
- `429 Too Many Requests` — auth rate limit exceeded (see [Rate Limiting](#rate-limiting))
- `500 Internal` — server error

### Step 4: Use the API Token

For all subsequent requests, include the token in the `Authorization` header:

```http
Authorization: Bearer api-aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

### Additional Auth Endpoints

| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/api/auth/register` | POST | Create a human identity | One-time setup; `hu-` secret never transmitted |
| `/api/auth/token` | POST | Exchange `hu-` hash or `lb-` hash for an `api-` token | Humans send `"type": "human"` |
| `/api/auth/validate` | POST | Check whether a token is still valid | Returns identity summary in `data` |
| `/api/auth/me` | GET | Current session profile + permissions | ShellGuard-specific |
| `/api/auth/profile` | PUT | Update display name / profile fields | ShellGuard-specific, human sessions |

> There is deliberately **no** `POST /api/auth/lookup` endpoint. Token issuance via `/api/auth/token` is the single source of truth.
>
> There is deliberately **no** admin control plane. Admin routes are deferred to a future release and do not exist in this API.

---

## Permissions Model

### How Permissions Work

1. **Human creates an agent key** in Settings → Agent Keys
2. **Human grants permissions** to that key: `canRead`, `canWrite`, `canEdit`, `canDelete`
3. **Agent obtains an `api-` token** by hashing and exchanging its `lb-` key
4. **Server checks permissions** on every request using the token's associated key
5. **Ownership scoping:** every query is filtered by `owner_uuid`; an agent can never read, modify or even confirm the existence of another identity's records (cross-owner access yields `404 Not Found`, not `403`)

### Method → Permission Mapping

The HTTP verb determines which permission bit is required:

| HTTP Method | Required Permission |
|-------------|---------------------|
| `GET` | `canRead` |
| `POST` | `canWrite` |
| `PUT` | `canEdit` |
| `DELETE` | `canDelete` |

### Full Permission Matrix

| Endpoint group | `canRead` | `canWrite` | `canEdit` | `canDelete` |
|----------------|:---------:|:----------:|:---------:|:-----------:|
| `GET /api/vault`, `GET /api/vault/:id` | ✔ | — | — | — |
| `POST /api/vault` | — | ✔ | — | — |
| `PUT /api/vault/:id` | — | — | ✔ | — |
| `DELETE /api/vault/:id` | — | — | — | ✔ |
| Notes (`GET`/`POST`/`PUT`/`DELETE /api/notes`) | ✔ | ✔ | ✔ | ✔ |
| SSH Keys (`GET`/`POST`/`PUT`/`DELETE /api/keys`) | ✔ | ✔ | ✔ | ✔ |
| Attachments (`GET`/`POST`/`PUT`/`DELETE /api/attachments`) | ✔ | ✔ | ✔ | ✔ |
| Agent Keys (`GET`/`POST`/`DELETE /api/agent-keys`) | ✔ | ✔ | — | ✔ |
| Settings (`GET`/`PUT /api/settings/:key`) | humans only | — | humans only | — |
| Auth (`me`, `validate`) | any valid token | — | humans only (`profile`) | — |

> **Note:** Settings endpoints require a **human** session (`requireHuman`). Agent tokens cannot read or write user settings under any permission combination.

### Failure Mode: Missing Permission

If an agent token lacks the required permission for an endpoint, the server returns:

```http
403 Forbidden
Content-Type: application/json

{
  "error": "Forbidden",
  "message": "This agent key does not have permission to write vault items"
}
```

---

## Vault Pearls API (Passwords)

Password vault entries ("pearls") live at `/api/vault`. The `secret` (and optionally `notes`, `totp_secret`) fields carry **client-encrypted ShellCryption blobs** — see [Zero-Knowledge Data Format](#zero-knowledge-data-format).

### GET /api/vault — List Vault Items

**Request:**
```http
GET /api/vault
Authorization: Bearer api-aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response — 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": "vp-uuid-1",
      "title": "Example Cloud",
      "username": "lucas@example.com",
      "url": "https://cloud.example.com",
      "type": "password",
      "category": "Personal",
      "secret": { "v": 1, "alg": "AES-GCM-256", "iv": "...", "ct": "...", "aad": "vault_pearls:vp-uuid-1" },
      "totpSecret": null,
      "attachments": [],
      "createdAt": "2026-08-24T10:00:00.000Z",
      "updatedAt": "2026-08-24T10:00:00.000Z"
    }
  ]
}
```

**Permissions Required:** `canRead`

**Error Responses:**
- `401 Unauthorized` — missing or invalid API token
- `403 Forbidden` — token lacks `canRead` permission

### GET /api/vault/:id — Get Single Vault Item

Retrieve one pearl by ID. Returns `404 Not Found` if it does not exist **or belongs to another owner**.

**Permissions Required:** `canRead`

### POST /api/vault — Create Vault Item

**Request Body Schema:**
```typescript
{
  id: string               // client-generated UUID (required)
  title: string            // 1-255 characters (required) — may be plaintext or encrypted per client policy
  secret: EncryptedBlob    // REQUIRED — ShellCryption blob, never plaintext
  username?: string        // optional account identifier
  url?: string             // ≤2048 characters
  type?: string            // "password" | "note" | "card" | ... (default "password")
  category?: string        // ≤64 characters (default "Personal")
  notes?: string           // ≤10000 characters, encrypted client-side
  totpSecret?: string      // encrypted client-side
  attachments?: string[]   // linked attachment IDs
}
```

**Response — 201 Created** (envelope with the created item's non-secret projection)

**Permissions Required:** `canWrite`

**Error Responses:**
- `400 Bad Request` — missing required fields (`id`, `title`, `secret`), zod violations, or duplicate ID (`409 Conflict` on unique constraint)
- `401 Unauthorized` · `403 Forbidden` (no `canWrite`)

### PUT /api/vault/:id — Update Vault Item

Replace an existing pearl's mutable fields. Ownership-scoped: `404` if not yours.

**Permissions Required:** `canEdit`

**Error Responses:** `400 Bad Request` · `401 Unauthorized` · `403 Forbidden` (no `canEdit`) · `404 Not Found`

### DELETE /api/vault/:id — Delete Vault Item

**Permissions Required:** `canDelete`

**Error Responses:** `401 Unauthorized` · `403 Forbidden` (no `canDelete`) · `404 Not Found`

---

## Secure Notes API

Encrypted free-text notes at `/api/notes`.

**Fields:**
```typescript
{
  id: string               // client-generated UUID (required)
  title: string            // 1-255 characters (required)
  content: EncryptedBlob   // REQUIRED — ShellCryption blob, never plaintext
  category?: string        // ≤64 characters (default "Personal")
}
```

**Endpoints:**
- `GET /api/notes` — list (`canRead`)
- `GET /api/notes/:id` — fetch one (`canRead`, `404` if absent/not owned)
- `POST /api/notes` — create, `201 Created` (`canWrite`)
- `PUT /api/notes/:id` — replace (`canEdit`)
- `DELETE /api/notes/:id` — delete (`canDelete`)

All responses use the `{success, data}` envelope.

---

## SSH Keys API

SSH private/public key material at `/api/keys`.

**Fields:**
```typescript
{
  id: string               // client-generated UUID (required)
  title: string            // 1-255 characters (required)
  keyValue: EncryptedBlob  // REQUIRED — ShellCryption blob of the key material
  username?: string        // optional login/user context
  category?: string        // ≤64 characters (default "Personal")
}
```

**Endpoints:** identical shape to Secure Notes — `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` with the same `canRead`/`canWrite`/`canEdit`/`canDelete` mapping.

---

## Attachments API

Binary attachments at `/api/attachments`. Files are stored **base64-encoded and already client-encrypted** in SQLite.

**Fields:**
```typescript
{
  id: string               // client-generated UUID (required)
  title: string            // 1-255 characters (required)
  fileData: EncryptedBlob  // REQUIRED — ShellCryption blob wrapping base64 payload
  fileName?: string        // original filename label
  mimeType?: string        // e.g. "application/pdf"
  category?: string        // ≤64 characters (default "Personal")
}
```

**Size Limits (strict):**
- Global request body limit is **1 MB** — enough for every other endpoint
- `/api/attachments` alone accepts up to a **32 MB** body, i.e. roughly a **28 MB base64 payload cap**
- Oversized payloads are rejected with `413 Payload Too Large` / `400 Bad Request`

**Endpoints:** `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` — same permission mapping (`canRead`/`canWrite`/`canEdit`/`canDelete`).

---

## Agent Keys API

Agents manage their own kind at `/api/agent-keys` (formerly `/api/agents` — renamed).

### GET /api/agent-keys — List Agent Keys

Returns the authenticated owner's agent keys. The raw `lb-` secret is **never** returned after creation.

**Permissions Required:** `canRead`

### POST /api/agent-keys — Create Agent Key

**Request Body Schema:**
```typescript
{
  name: string             // 1-100 characters, display label
  canRead?: boolean        // default false
  canWrite?: boolean       // default false
  canEdit?: boolean        // default false
  canDelete?: boolean      // default false
  expirationType?: string  // enum: "never" | "30days" | "7days" | "24hours" | "custom"
  expiresAt?: string       // ISO-8601, required when expirationType === "custom"
  rateLimit?: number       // requests per minute, 1-10000
}
```

**Response — 201 Created:** includes the **one-time** `lb-` secret in `data.key`. Store it immediately — it cannot be retrieved again.

**Permissions Required:** `canWrite`

### DELETE /api/agent-keys/:id — Revoke Agent Key

Revokes the key. Existing `api-` tokens derived from it stop working immediately (`401 Unauthorized`).

**Permissions Required:** `canDelete`

---

## Settings API

Per-user key/value preference storage at `/api/settings/:key`. **Human sessions only** — agent tokens always receive `403 Forbidden` here regardless of permission bits.

| Endpoint | Purpose |
|----------|---------|
| `GET /api/settings/:key` | Read a namespaced setting (e.g. `appearance/theme`, `generator`, `security`) |
| `PUT /api/settings/:key` | Upsert a setting; value must be valid JSON ≤ 256 KB |

Non-secret preferences only. Never store credentials, raw keys or ShellCryption material here.

---

## Zero-Knowledge Data Format

This is the section most integrators get wrong. **ShellGuard's server cannot decrypt anything.**

Every sensitive field (`secret`, `content`, `keyValue`, `fileData`, …) holds a ShellCryption©™ blob produced **in the browser** before the HTTP request is made:

```json
{
  "v": 1,
  "alg": "AES-GCM-256",
  "iv": "<base64 96-bit nonce>",
  "ct": "<base64 ciphertext>",
  "aad": "vault_pearls:vp-uuid-1"
}
```

- **Encryption happens client-side** using a key derived (PBKDF2) from the human's master secret. That key and the raw `hu-` identity never leave the browser.
- **AAD binding:** the `aad` field binds each ciphertext to its table and record ID (`table:recordId`), preventing ciphertext-swapping between rows.
- **Server-side storage is opaque:** SQLite rows contain these blobs verbatim plus plaintext *metadata* (title/category/timestamps). If `DB_ENCRYPTION_KEY` (SQLCipher) is set, the metadata layer is encrypted at rest too — but that is defense-in-depth over metadata only, not a substitute for ShellCryption.
- **Consequences for agents:**
  - You **MUST NOT expect plaintext** in `secret`, `content`, `keyValue` or `fileData`.
  - You **cannot decrypt** anything without the human's master secret — if you need readable values, ask the human to provide them out-of-band.
  - To write, you must produce a well-formed blob yourself (encrypt client-side with WebCrypto) or persist an opaque blob provided by the human's browser session.
  - Searching/sorting happens on metadata fields only; the server cannot filter on encrypted content.

---

## Token Lifetime & TTL Semantics

Issued `api-` tokens expire. The default lifetime is controlled by the server's `TOKEN_TTL_DEFAULT` environment variable:

| Value form | Example | Meaning |
|------------|---------|---------|
| Minutes/hours/days shorthand | `30m`, `12h`, `24h`, `7d` | Relative lifetime from issue time |
| Bare integer minutes | `1440` | 1440 minutes (= 24 h) |
| ISO-8601 duration | `PT12H`, `P7D` | Same, standard notation |
| Never | `never` | Token does not expire (not recommended for agents) |

**Behaviour:**
- `/api/auth/token` responses include `expiresAt` (ISO-8601 UTC). Honor it — refresh proactively.
- Expired tokens return `401 Unauthorized` on every endpoint.
- Expired tokens are purged periodically server-side; revoking the underlying `lb-` key invalidates derived tokens immediately.

---

## Error Codes

| Code | Meaning | Common Trigger |
|------|---------|----------------|
| `200 OK` | Request succeeded | All GET requests, PUT updates, token exchange |
| `201 Created` | Resource created successfully | POST across all domains |
| `204 No Content` | Success, empty body | Some DELETE paths |
| `400 Bad Request` | Malformed body / failed validation | Missing `secret`, oversized attachment, bad JSON (includes zod `details[]`) |
| `401 Unauthorized` | Missing, invalid or expired API token | Missing `Authorization` header, revoked `lb-` key |
| `403 Forbidden` | Valid token but lacks required permission or role | `canWrite` missing on POST; agent token hitting `/api/settings/*` |
| `404 Not Found` | Resource does not exist **or is owned by someone else** | Cross-owner probing is indistinguishable from absence |
| `409 Conflict` | Unique constraint violation | Duplicate username on register, duplicate record ID |
| `413 Payload Too Large` | Body exceeds route limit | >32 MB attachment upload |
| `429 Too Many Requests` | Rate limit exceeded | See table below; includes `Retry-After` header |
| `500 Internal Server Error` | Server fault | Database failure, unexpected exception |

---

## Rate Limiting

All endpoints are rate-limited. Defaults (tunable via environment):

| Scope | Limit |
|-------|-------|
| Auth (`/api/auth/token`, `/api/auth/register`) | 10 attempts per 15 minutes per IP; successful authentications are not counted |
| Global API (all `/api/*`) | 100 requests per minute per IP/token |
| Per-agent-key | Governed by the key's `rateLimit` property (1–10000 req/min) |

Exceeding a limit returns `429 Too Many Requests` with a `Retry-After` header indicating seconds until reset. Behind a reverse proxy, the deployment must set `TRUST_PROXY=true` for client IPs to be attributed correctly.

---

## 🛡️ Shell Wisdom

*"A vault does not trust its keeper's memory — it trusts their key. You will hold ciphertext you can never read; treat that blindness as the feature it is. Move only what the human encrypted, and never ask the shell to open itself."*

---

**This SKILL.md is the canonical agent integration guide for ShellGuard©™. Always fetch this document from `/skill.md` to stay in sync with the latest API contract.**

Maintained by CrustAgent©™
