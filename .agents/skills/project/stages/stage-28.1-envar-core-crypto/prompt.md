# 🔐 Stage 28.1 Execution Prompt — Core Cryptography, Admin Plane & Identity Envar Hardening (Groups 1 & 5 Auth)

> **Milestone**: `v0.0.3.0 (Build 32)` — Phase 28, Sub-Phase 28.1 (Tasks 55 & 56)  
> **Execution Law**: Strict 2-Task Pairing + **Dual-Testing Teamwork Gate 28.1** (Agent executes code/lint/tests $\rightarrow$ User performs live physical verification and signs off before advancing to Sub-Phase 28.2).

---

## 📖 Context & Spec Oracles (Read First)

Before writing code, inspect:
- [`.agents/skills/project/specs/crypto/encryption-layers-spec.md`](../../specs/crypto/encryption-layers-spec.md): §1–§2 (`DB_ENCRYPTION_KEY`, SQLCipher Layer 3, `fieldEncryption.ts` Layer 2).
- [`.agents/skills/project/specs/admin/admin-suite-spec.md`](../../specs/admin/admin-suite-spec.md): §1–§2 (`ADMIN_TOKEN` Threat Model T1/T2, `/api/admin/*` endpoints).
- [`.agents/skills/project/specs/network/routes-and-contracts.md`](../../specs/network/routes-and-contracts.md): §2 (`POST /api/auth/register`, `POST /api/auth/token`, TTL parsing).
- [`.agents/skills/project/modules/01-auth-gateway/spec.md`](../../modules/01-auth-gateway/spec.md): Genesis User `#1` immunity and invite-gated signup laws.
- [`.agents/skills/project/modules/07-superlobster-admin/01-admin-gate-and-reef-status/spec.md`](../../modules/07-superlobster-admin/01-admin-gate-and-reef-status/spec.md): SuperLobster admin gate & settings panel.

---

## 🛠️ Execution Tasks (Strict 2-Task Pairing)

### Task 55: [Security Engine] Boot-Time Envar Validator, `DB_ENCRYPTION_KEY` Entropy Guard & `ADMIN_TOKEN` / `DISABLE_SIGNUPS` / `TOKEN_TTL_DEFAULT` Hardening

- **Central Boot Validator (`src/server/config/envValidator.ts`)**:
  - Run at startup before Express binds ports; collect structured boot warnings/errors and print a clear **Startup Security & Envar Diagnostic Banner** in `docker logs`.
- **`DB_ENCRYPTION_KEY` (`src/server/database/connection.ts` & `src/server/utils/fieldEncryption.ts`)**:
  - Trim surrounding whitespace; accept both standard Base64 (`+/=`) and Base64URL (`-_`) alphabets.
  - Enforce decoded key entropy: `Buffer.from(key, 'base64').length >= 32` (256 bits). Reject short/weak strings that accidentally pass Base64 regex (e.g., `"password"` or `"true"`).
  - Before running `encryptExistingDatabase()` on `SQLITE_NOTADB`, inspect the first 16 bytes of the file on disk for the `"SQLite format 3\0"` magic header. If the file does NOT start with the plaintext SQLite header, throw an explicit `WRONG_DB_ENCRYPTION_KEY` error instead of attempting to rekey an already-encrypted database.
- **`ADMIN_TOKEN` (`src/server/middleware/requireAdmin.ts` & `src/server/routes/admin.ts`)**:
  - Trim whitespace before checking length (`ADMIN_TOKEN.trim()`), preventing `"   "` in Unraid/Portainer forms from enabling SuperLobster with a blank password.
  - Reject weak or boolean-confused tokens (`length < 16` or literal `'true'`/`'false'`/`'admin'`/`'123456'`), keeping the panel disabled (`503`) and logging a prominent boot warning with `openssl rand -hex 24` guidance.
  - When `ADMIN_TOKEN` is unset, log an explicit notice in the startup banner so operators inspecting `docker logs` immediately see why `/superlobster` is sealed.
  - **Catch-22 Lockout Alert**: If `DISABLE_SIGNUPS=true` is set while `ADMIN_TOKEN` is unset (or invalid), print a high-visibility warning box in `docker logs` explaining that once Genesis User `#1` hatches, User `#2+` cannot be invited until `ADMIN_TOKEN` is configured.
- **`DISABLE_SIGNUPS` (`src/server/routes/auth.ts`, `src/server/routes/public.ts` & `src/server/routes/admin.ts`)**:
  - Normalize boolean parsing (`['true', '1', 'yes'].includes(val.trim().toLowerCase())`).
  - Include `envDisableSignups: boolean` in `GET /api/admin/settings` and `GET /api/admin/status` responses so the UI can detect environment-level signup lockdown.
- **`TOKEN_TTL_DEFAULT` (`src/server/utils/tokenExpiry.ts` & `src/server/routes/auth.ts`)**:
  - Support `'w'` / `'week'` / `'weeks'` units in `calculateExpiry()`.
  - Guard against `Date` overflow (`RangeError: Invalid time value` on huge numbers) and validate `process.env.TOKEN_TTL_DEFAULT` at startup. If invalid (e.g., `"0"`, `"-5m"`, `"forever"`), log a boot warning and fall back to `'1440'` (24h) instead of crashing every `POST /api/auth/token` login with HTTP 500.
- **Automated Verification**:
  - Author `tests/unit/env-validator.test.ts` testing weak/whitespace `ADMIN_TOKEN`, short/Base64URL/wrong `DB_ENCRYPTION_KEY`, case-insensitive `DISABLE_SIGNUPS`, and invalid/overflow `TOKEN_TTL_DEFAULT` fallbacks.

### Task 56: [UI Component] SuperLobster Envar Override Indicators & Startup Banner Live Handshake

- **SuperLobster Settings Override Badge (`src/components/admin/SuperLobsterPanel.tsx` / `SuperLobsterSettings.tsx`)**:
  - When `envDisableSignups === true`, display a prominent `🔒 Enforced by DISABLE_SIGNUPS Environment Variable` badge next to the "Allow Public Signups" toggle and disable the switch so admins are never misled into thinking a DB toggle overrides the container envar.
- **SuperLobster Login Gate Guidance (`src/components/admin/SuperLobsterLogin.tsx`)**:
  - Enhance the `panelDisabled` (`503`) amber notice with copyable `openssl rand -hex 24` generation instructions and explain that `ADMIN_TOKEN` must be at least 16 characters.

---

## 🤝 Dual-Testing Teamwork Gate 28.1 (MANDATORY STOP FOR USER SIGN-OFF)

- **Agent Role**: Run `npm run lint` and verify `tests/unit/env-validator.test.ts` + terminal boot banner output.
- **User Role (Lucas)**:
  1. Inspect the new Docker/terminal boot diagnostic banner on startup.
  2. Test `/superlobster` with unset, weak (`"admin"`), and valid (`>= 16` chars) `ADMIN_TOKEN`.
  3. Verify the `🔒 Enforced by DISABLE_SIGNUPS Environment Variable` override badge in SuperLobster Settings.
  4. Explicitly sign off before advancing to [`stage-28.2-envar-network-tls`](../stage-28.2-envar-network-tls/prompt.md).
