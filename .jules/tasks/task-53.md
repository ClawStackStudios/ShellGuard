# Task 53: Persistent Instance Root Key, TLS Rotation Manifest & Share Signups API

> **Milestone**: Stage 1 / Phase 27 (Task 53 of 54) — Era 2 Genesis  
> **Domain**: Backend Crypto, Instance Identity, TLS Rotation Manifest & Decoupled Invites API  
> **Target Branch**: `stage/phase-27-tls-control-plane`  
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User: Lucas <lucas@clawstack.com>` / `AI: Google Jules <jules@google.com>`)

---

## 🎯 Objective & Architectural Seam

Implement the foundational cryptographic and backend transport control plane for ShellGuard Era 2:

1. **Persistent Instance Root Key (`src/server/utils/instanceKey.ts`)**:
   - On server startup, inspect `DATA_DIR/instance.key` (defaults to `./data/instance.key`).
   - If not found, generate an EC P-256 (`prime256v1`) keypair in PEM format using native Node.js `crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })`.
   - Write private key to disk with strict file mode `0o600`.
   - Export helper functions:
     - `ensureInstanceKey(): void`
     - `getInstancePublicKeyHex(): string` (returns 130-hex-character uncompressed EC public key string starting with `04`)
     - `signWithInstanceKey(data: string): string` (ECDSA-SHA256 signature in Base64)
     - `verifyWithInstanceKey(data: string, signatureBase64: string): boolean`
   - Invariant: `instance.key` is NEVER overwritten when leaf certificates are regenerated. It acts as the immutable root of trust for mobile companion apps.

2. **TLS Manager Hot-Reload & Rotation Manifest (`src/server/utils/tlsManager.ts`)**:
   - Support `TLS_ENABLED=true` vs `false` via `process.env.TLS_ENABLED === 'true'`.
   - When enabled and cert files do not exist:
     - Generate a self-signed EC P-256 certificate with 10-year validity (3650 days).
     - Populate SANs for `localhost`, `127.0.0.1`, `::1`, and host interface IPs.
     - Extract SHA-256 certificate fingerprint in format `SHA256:xx:xx:...`.
     - Sign `${certFingerprint}:${timestamp}` using `instanceKey.signWithInstanceKey()`.
     - Write `DATA_DIR/certs/manifest.json`:
       ```json
       {
         "tlsEnabled": true,
         "certFingerprint": "SHA256:...",
         "instancePublicKey": "04...",
         "timestamp": "ISO-8601",
         "signature": "Base64"
       }
       ```
   - Implement `regenerateTlsCertificate(extraHosts?: string[]): Promise<TlsStatus>`:
     - Forges a new leaf certificate including `extraHosts` (e.g. reflected browser hostname `window.location.hostname`).
     - Updates `cert.pem` and `key.pem`.
     - Updates `manifest.json` with new fingerprint and fresh ECDSA signature.
     - Calls `(server as https.Server).setSecureContext({ key, cert })` for zero-downtime hot-reload without restarting Node.
   - Guard BYO certs: If `TLS_CERT_PATH` / `TLS_KEY_PATH` are set, `regenerateTlsCertificate` throws `400 Bad Request`.

3. **Public Route Membranes (`src/server/routes/public.ts`)**:
   - Mount at `/api/public`:
     - `GET /api/public/tls-manifest`: Returns the current `manifest.json`. Attached middleware sets response header `X-ShellGuard-Rotation-Proof: <base64-json>`.
     - `GET /api/public/signup-status?invite=...`: Returns `{ signupsAllowed: boolean, reason: 'open' | 'disabled' | 'valid_invite' | 'invalid_invite' | 'genesis' }`.

4. **SuperLobster Admin TLS & Invites API (`src/server/routes/admin.ts`)**:
   - All endpoints require `requireAdmin` + `adminAudit()`:
     - `GET /api/admin/tls/status`: Returns current TLS status (enabled, fingerprint, SANs, expiry, manifest).
     - `POST /api/admin/tls/generate`: Body `{ extraHosts?: string[] }`. Hot-regenerates leaf cert.
     - `GET /api/admin/tls/cert`: Returns public PEM only with `Content-Type: application/x-pem-file`. Never exports private keys!
     - `GET /api/admin/invites`: Lists active invites from `api_tokens` where `owner_type = 'invite'` (`key` as hash, label, created_at, expires_at).
     - `POST /api/admin/invites`: Body `{ ttl: '1h'|'6h'|'24h'|'7d', label?: string }`. Mints `inv_<32-base62>` token. Stores `SHA-256(token)` in `api_tokens` (`owner_type = 'invite'`). Returns `{ inviteToken, inviteUrl, expiresAt }`.
     - `DELETE /api/admin/invites/:hash`: Deletes invite row from `api_tokens`.
   - Add `'allow_signups'` to `SETTINGS_WHITELIST` in `src/server/routes/admin.ts`.

5. **Auth Route Gate & Genesis User #1 Rule (`src/server/routes/auth.ts`)**:
   - In `POST /api/auth/register`:
     - **Genesis Rule**: Check `SELECT COUNT(*) FROM lobsters`. If 0, allow registration unconditionally so fresh server owners never get locked out.
     - If lobsters > 0: Check `system_settings.allow_signups` (or fallback to `process.env.DISABLE_SIGNUPS !== 'true'`).
     - If signups open: Proceed with standard registration.
     - If signups closed: Require `body.inviteToken`. Hash token with SHA-256. Inside a synchronous `db.transaction()`:
       - `DELETE FROM api_tokens WHERE key = ? AND owner_type = 'invite' AND expires_at > datetime('now')`.
       - If `changes === 0`, throw `403 Invalid or expired invite token`.
       - Insert new lobster record. Commit transaction.

6. **Automated Test Oracle (`tests/tls-admin.test.ts`)**:
   - Create comprehensive integration suite verifying:
     - `instance.key` mode `0o600` and uncompressed 130-hex public key.
     - Rotation manifest ECDSA-SHA256 signature verification.
     - Zero private key leakage on `/api/admin/tls/cert`.
     - Genesis User #1 registration under `DISABLE_SIGNUPS=true`.
     - Rejection of User #2 without invite (`403`).
     - Registration of User #2 with valid invite and atomic token deletion.
     - Replay of burned invite token fails (`403`).

---

## 📁 Files in Scope
- `src/server/utils/instanceKey.ts` (NEW)
- `src/server/utils/tlsManager.ts` (MODIFY)
- `src/server/routes/public.ts` (NEW)
- `src/server/routes/admin.ts` (MODIFY)
- `src/server/routes/auth.ts` (MODIFY)
- `src/server/validation/schemas.ts` (MODIFY)
- `server.ts` (MODIFY)
- `docker-compose.yml`, `.env.example` (MODIFY)
- `tests/tls-admin.test.ts` (NEW)
