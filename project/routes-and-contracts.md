# 🌐 ShellGuard — Routes, API Contracts & Response Protocol

> **Uniform envelope, auth identity endpoints & request/response schemas**
> *Pulled into existence by Phase 2. Grows with the walk.*

---

## §1. Uniform Response Envelope

Every API endpoint returns the same envelope. The client unwraps it centrally
in `services/api/restAdapter.ts` — no component ever parses a raw response:

```typescript
{
  "success": true,
  "data": { /* payload */ },
  "error": "…",      // present on failure
  "code": "…",       // machine-readable failure class
}
```

---

## §2. Authentication: ShellKey Identity Endpoints

The server never sees a plaintext key. Registration and login both transmit
only the **SHA-256 hash** of the `hu-` key; verification uses constant-time
comparison (`src/server/utils/crypto.ts`).

### A. Register: `POST /api/auth/register`
Creates a `lobsters` record from a fresh `hu-` key hash.

**Request**:
```json
{ "type": "human", "keyHash": "3b2c…64hexChars", "username": "lucas" }
```

**Response** (`ShellResponse<SessionData>`):
```json
{
  "success": true,
  "data": {
    "token": "api-abc123xyz…",
    "type": "human",
    "createdAt": "2026-08-25T00:00:00.000Z",
    "expiresAt": "2026-08-26T00:00:00.000Z",
    "user": { "uuid": "8f3b…", "username": "lucas", "displayName": "Lucas" }
  }
}
```

### B. Token: `POST /api/auth/token`
Exchanges a known `hu-` key hash for a short-lived `api-` bearer token.
TTLs parse through the hardened parser (`src/server/utils/parsers.ts`):
`30m` / `12h` / `24h` / `7d` / `never` / ISO timestamps / bare minutes.

- Tokens are stored in `api_tokens` (`key`, `owner_uuid`, `owner_type`, `expires_at`)
  and enforced by `src/server/middleware/auth.ts` on every `/api` route.

### C. Client Contract
- `restAdapter.ts` unwraps `{success, data}` centrally and throws typed errors otherwise.
- The `api-` token lives in browser memory / `sessionStorage` for the session
  (never `localStorage` — hardened in a later phase); the `hu-` key never persists
  beyond the client-side ShellCryption key derivation.

---

## §3. Vault Domain Endpoints (Phase 3)

Four vault domains, one uniform CRUD contract each. Routers live in
`src/server/routes/` — the legacy `src/services/*` layer is deleted:

| Domain | Router | Payload columns (opaque blobs) |
|:---|:---|:---|
| Passwords | `vault.ts` (`/api/vault`) | `secret`, `totp_secret`, `attachments` |
| Secure Notes | `notes.ts` (`/api/notes`) | `content` |
| SSH Keys | `sshKeys.ts` (`/api/ssh`) | `key_value` |
| Attachments | `attachments.ts` (`/api/attachments`) | `file_data` |

**Verb → Permission mapping (inviolable, all four domains):**

| HTTP Verb | Middleware chain | Permission |
|:---|:---|:---|
| `GET /` | `requireAuth` → `requirePermission('canRead')` | read |
| `POST /` | `requireAuth` → `requirePermission('canWrite')` → `validateBody` | create |
| `PUT /:id` | `requireAuth` → `requirePermission('canEdit')` → `validateBody` | update |
| `DELETE /:id` | `requireAuth` → `requirePermission('canDelete')` | delete |

Every query is scoped `WHERE owner_uuid = ?` from the authenticated identity —
never from a request parameter. Every mutation writes an audit entry.
Request bodies are validated by zod schemas in `src/server/validation/schemas.ts`
(`VaultSchemas.create`, `VaultSchemas.update`, …) — a route without a schema
does not ship.

---

## §4. Lobster Keys Lifecycle (`/api/agent-keys`)

Agent keys are minted, listed, revoked and deleted by **humans only**:

| Endpoint | Middleware | Effect |
|:---|:---|:---|
| `GET /api/agent-keys` | `requireAuth` → `requireHuman` | list all keys for owner |
| `POST /api/agent-keys` | `requireAuth` → `requireHuman` → `authLimiter` → `validateBody(AgentKeySchemas.create)` | mint key with scoped permissions, `rate_limit`, `expires_at` |
| `PATCH /api/agent-keys/:id/revoke` | `requireAuth` → `requireHuman` | revoke without deletion |
| `DELETE /api/agent-keys/:id` | `requireAuth` → `requireHuman` | hard delete |

Minted keys are returned **once** in plaintext (`lb-…`); only the hash persists.
Revocation must not affect human sessions.

---

## §5. Server-Side Settings Storage (`/api/settings/:key`)

- `GET /api/settings/:key` and `PUT /api/settings/:key`, both
  `requireAuth` → `requireHuman` — agents never read or write instance settings.
- Values are stored server-side per owner; the client treats the endpoint as a
  durable preference mirror (theme accents, behavior toggles arrive in later phases).

---

