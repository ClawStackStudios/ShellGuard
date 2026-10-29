# 💾 Stage 28.3 Execution Prompt — Storage Quotas, Container Entrypoint (`PUID`/`PGID`), Build-Flag Guards & 4-Zone Docs Sync (Groups 4 & 6)

> **Milestone**: `v0.0.3.0 (Build 32)` — Phase 28, Sub-Phase 28.3 (Tasks 59 & 60)  
> **Execution Law**: Strict 2-Task Pairing + **Dual-Testing Teamwork Gate 28.3** (Agent executes code/lint/tests $\rightarrow$ User performs live physical verification and signs off before advancing to Sub-Phase 28.4).

---

## 📖 Context & Spec Oracles (Read First)

Before writing code, inspect:
- [`.agents/skills/project/specs/storage/database-schema.md`](../../specs/storage/database-schema.md): §1 (`DATA_DIR` layout) & §3 (Migration 0005 Grotto attachment quotas).
- [`.agents/skills/project/specs/crypto/shellcryption-spec.md`](../../specs/crypto/shellcryption-spec.md): §4 (`VITE_SHELLCRYPTION_ENABLED` escape hatch).
- [`.agents/skills/project/modules/02-vault-workspace/03-item-form-and-custom-fields/spec.md`](../../modules/02-vault-workspace/03-item-form-and-custom-fields/spec.md): Multipart attachment streaming & Grotto quotas.
- [`.agents/workflows/walk-the-docs.md`](../../../../workflows/walk-the-docs.md): The 4 Documentation Zones.

---

## 🛠️ Execution Tasks (Strict 2-Task Pairing)

### Task 59: [Storage & Container Engine] `DATA_DIR` Sanitization, Quota Clamping, `docker-entrypoint.sh` `PGID` Fix & Dynamic `HEALTHCHECK`

- **`DATA_DIR` Sanitization (`src/server/database/connection.ts`)**:
  - Replace `process.env.DATA_DIR ?? ...` with `path.resolve(process.env.DATA_DIR?.trim() || defaultDataDir)` so `DATA_DIR=""` (empty string from blank Docker Compose variables) never calls `fs.mkdirSync("")` (`ENOENT` crash).
- **Container Entrypoint & Healthcheck (`docker-entrypoint.sh` & `Dockerfile`)**:
  - In `docker-entrypoint.sh`, fix the privilege remapping condition to check both UID and GID (`if [ "$(id -u)" = "0" ] && { [ "$TARGET_UID" != "1000" ] || [ "$TARGET_GID" != "1000" ]; }; then`) and validate that `TARGET_UID` and `TARGET_GID` are positive integers.
  - In `Dockerfile`, update `HEALTHCHECK` to use `localhost:${PORT:-6464}/api/health` instead of hardcoded `:6464` so custom `PORT` configurations in host-network containers stay healthy.
- **Attachment & Grotto Quota Clamping (`src/server/routes/attachments.ts`)**:
  - Clamp `ATTACHMENT_MAX_MB` (`1–2000` MB) and `GROTTO_QUOTA_MB` (`1–100000` MB) so negative values (`-1`) or `NaN` never corrupt Busboy `fileSize` limits or exceed Node's 2GB `Buffer.constants.MAX_LENGTH`.
  - Log a boot warning if `ATTACHMENT_MAX_MB > GROTTO_QUOTA_MB`.
  - Add a pre-stream `Content-Length` header check against `MAX_ATTACHMENT_BYTES` and remaining `GROTTO_QUOTA_BYTES` at the start of `POST /api/attachments` so oversized uploads are rejected with `413 Payload Too Large` immediately before streaming gigabytes into memory.
- **Build-Time `VITE_*` Runtime Detection (`src/server/config/envValidator.ts`)**:
  - If `VITE_API_URL` or `VITE_SHELLCRYPTION_ENABLED` is set in `process.env` when `NODE_ENV=production`, log a clear note in the startup banner explaining that `VITE_*` variables are compiled into the frontend bundle at build time (`npm run build`), not read dynamically by the pre-built container at runtime.
  - Ensure `attachmentUtils.ts` respects `VITE_SHELLCRYPTION_ENABLED=false` consistently with `shellCryption.ts`.
- **Automated Verification**:
  - Author unit/integration tests in `tests/envar-storage-quotas.test.ts` verifying negative/zero quota clamping, pre-stream `Content-Length` 413 rejection, and `DATA_DIR=""` fallback safety.

### Task 60: [UI Component & Walk-the-Docs] Client Plaintext Warning Banner, Complete 24-Envar Reference Catalog & 4-Zone Docs Sync

- **Client Plaintext Warning Banner (`src/components/Layout/Header.tsx` & `src/components/vault/VaultShell.tsx`)**:
  - When `import.meta.env.VITE_SHELLCRYPTION_ENABLED === 'false'`, render a persistent high-contrast red security banner across the top of the vault (`⚠️ ZERO-KNOWLEDGE DISABLED (VITE_SHELLCRYPTION_ENABLED=false) — Vault secrets are not encrypted client-side`).
- **4-Zone Documentation Synchronization**:
  - Update `.env.example` (fix `HTTPS_PORT=443` default, document `DISABLE_SIGNUPS`, `PUID`/`PGID`, and minimum key length rules).
  - Update `docs/deployment/docker.md`, `docs/deployment/unraid.md`, `docs/deployment/https-tls.md`, `ADMIN.md`, `SECURITY.md`, and `ARCHITECTURE.md` (Delta #33) with the complete 24-Envar Reference Table, validation rules, and boot diagnostic banner documentation.

---

## 🤝 Dual-Testing Teamwork Gate 28.3 (MANDATORY STOP FOR USER SIGN-OFF)

- **Agent Role**: Run `npm run lint`, `tests/unit/docsLinks.test.ts`, `tests/unit/mermaidDiagrams.test.ts`, and `tests/envar-storage-quotas.test.ts`.
- **User Role (Lucas)**:
  1. Physically verify attachment pre-flight quota behavior.
  2. Inspect the updated `.env.example` and 24-Envar documentation tables.
  3. Explicitly sign off before advancing to [`stage-28.4-reactive-river-sse`](../stage-28.4-reactive-river-sse/prompt.md).
