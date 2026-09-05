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
