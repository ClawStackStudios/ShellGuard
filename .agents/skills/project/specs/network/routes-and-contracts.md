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
- The `api-` token lives in `sessionStorage` only (per-identity, multi-account
  aware — see [`../ui/ui-ux-design-system.md`](../ui/ui-ux-design-system.md) §3); **never** `localStorage` and never a
  cookie. The `hu-` key never persists beyond the client-side ShellCryption
  key derivation and is zeroized on lock/logout (see [`../crypto/shellcryption-spec.md`](../crypto/shellcryption-spec.md) §6).

---

## §3. Vault Domain Endpoints (Phase 3)

Four vault domains, one uniform CRUD contract each. Routers live in
`src/server/routes/` — the legacy `src/services/*` layer is deleted:

| Domain | Router | Payload columns (opaque blobs) |
|:---|:---|:---|
| Passwords | `vault.ts` (`/api/vault`) | `secret`, `totp_secret`, `attachments`, `uris` (Layer 2 metadata encryption), `password_history` (Layer 1 ShellCryption) (supports `?tags=a,b`; DELETE cascades linked attachments) |
| Secure Notes | `notes.ts` (`/api/notes`) | `content`, `attachments` (Layer 1 ShellCryption, Migration 0008) (supports `?tags=a,b`; DELETE cascades linked attachments) |
| SSH Keys | `sshKeys.ts` (`/api/keys`) | `key_value` (supports `?tags=a,b`) |
| Attachments | `attachments.ts` (`/api/attachments`) | `file_data` (native BLOB since migration 0005 — streamed multipart in, 500MB ceiling, 1000MB quota) |

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

**Batch Operations (Phases 21 & 26):**

| HTTP Verb | Middleware chain | Permission | Purpose |
|:---|:---|:---|:---|
| `POST /bulk-import` | `requireAuth` → `requirePermission('canWrite')` → `validateBody(VaultSchemas.bulkImport)` | write | Atomic batch import (up to 1000 items, scoped 10MB parser, stamps `import_batch_id` & `imported_at`, HTTP 207 Multi-Status partial success envelope `{ inserted, errors, import_batch_id, imported_at }`) |
| `DELETE /bulk` | `requireAuth` → `requirePermission('canDelete')` → `validateBody(VaultSchemas.bulkDelete)` | delete | Batch pearl deletion by IDs (`{ ids: string[] }`, owner-scoped, cascades linked attachments) |
| `POST /import-batches/:id/graduate` | `requireAuth` → `requirePermission('canEdit')` | update | Promotes all quarantined records matching `import_batch_id = :id` across pearls, notes, and SSH keys by clearing `imported_at` and `import_batch_id` to `NULL` (`{ graduated_count }`) |
| `DELETE /import-batches/:id` | `requireAuth` → `requirePermission('canDelete')` | delete | Atomic batch rollback purging all records matching `import_batch_id = :id` across pearls, notes, and SSH keys and cascading linked attachments (`{ deleted_count, deleted_attachments }`) |

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

## §6. Transport, Pairing & Sync Contracts (Phase 27)

### A. Public TLS Manifest (`GET /api/public/tls-manifest`)
Unauthenticated public endpoint returning the active certificate fingerprint, instance public key, and signed rotation proof so mobile clients can auto-heal pinned certificates without manual re-pairing:

```json
{
  "success": true,
  "data": {
    "certFingerprint": "D4:A8:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC",
    "instancePublicKey": "04a1b2c3d4e5f6...",
    "timestamp": 1775990000,
    "signature": "3045022100..."
  }
}
```

### B. Admin TLS Status & Regeneration
- `GET /api/admin/tls/status` (`requireAdmin`): returns active TLS mode, protocol, port, fingerprint, instance public key, detected SANs, expiration, and complete `shellguard://pair` URI.
- `POST /api/admin/tls/generate` (`requireAdmin`): generates a fresh 10-year EC P-256 certificate, signs the new rotation manifest with `instance.key`, and returns the updated status and pairing string.
- `GET /api/admin/tls/cert` (`requireAdmin`): downloads the public `cert.pem`. Private keys are strictly unexportable.

### C. Reactive River Event Stream (`GET /api/sync/events`)
- **Authentication**: Bearer `api-` token.
- **Protocol**: `text/event-stream` (Server-Sent Events).
- **Format**:
  ```text
  event: vault_mutation
  data: {"domain":"vault_pearls","id":"uuid-1234","rev":14,"action":"upsert","timestamp":"2026-10-11T12:00:00.000Z"}
  ```

---
