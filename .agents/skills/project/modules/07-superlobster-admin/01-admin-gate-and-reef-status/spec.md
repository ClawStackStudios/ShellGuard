# 07.01 — SuperLobster Admin Plane: Token Gate, Reef Status, Audit & Online Backups

The SuperLobster Admin Suite ([`SuperLobsterGate.tsx`](../../../../../src/components/admin/SuperLobsterGate.tsx), [`SuperLobsterLogin.tsx`](../../../../../src/components/admin/SuperLobsterLogin.tsx), and [`SuperLobsterPanel.tsx`](../../../../../src/components/admin/SuperLobsterPanel.tsx)) is an instance-operation control plane strictly outside the zero-knowledge user vault. Under Threat Model **T1**, if `ADMIN_TOKEN` is unset in the environment, the admin plane does not exist and all `/api/admin/*` endpoints return `503 Service Unavailable`. Under **T2**, `POST /api/admin/auth` verifies `ADMIN_TOKEN` via constant-time `timingSafeEqual` behind `adminAuthLimiter` and issues a volatile, in-memory session (`sg_admin_session` cookie, `httpOnly`, `SameSite=Strict`, 20-minute sliding TTL, wiped on server restart).

Inside the panel, administrators inspect read-only Reef diagnostics and uptime (`GET /api/admin/status`, `GET /api/admin/uptime`), manage registered Lobsters via strict zero-knowledge metadata lists with audited cascade deletion (`DELETE /api/admin/users/:uuid`), edit only explicitly whitelisted instance settings (`PATCH /api/admin/settings`), and review the segregated `audit.sqlite` log (`GET /api/admin/audit`, protected by recursive `redactDetail()` zero-knowledge scrubbing). Database snapshots (`POST /api/admin/backup`) use SQLite's fail-safe Online Backup API with manifest rotation; restores are strictly offline (`scripts/restore.ts`)—never over HTTP—and `audit.sqlite` is never overwritten.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/admin/SuperLobsterGate.tsx`, `src/components/admin/SuperLobsterLogin.tsx`, `src/components/admin/SuperLobsterPanel.tsx`, `src/components/admin/SuperLobsterStatus.tsx`, `src/components/admin/SuperLobsterUsers.tsx`, `src/components/admin/SuperLobsterSettings.tsx`, `src/components/admin/SuperLobsterAudit.tsx`, `src/components/admin/SuperLobsterBackups.tsx`
- **Backend Routes & Storage**: `src/server/routes/admin.ts`, `src/server/storage/auditLogger.ts`, `src/server/storage/backupManager.ts`
- **Deep Specs**:
  - [SuperLobster Admin Suite Specification (§1–§4)](../../../specs/admin/admin-suite-spec.md)
  - [SQLite Bedrock Database Schema (§4 Audit Segregation & Redaction)](../../../specs/storage/database-schema.md)
- **Verification Oracles**: `tests/admin.test.ts`, `tests/audit.test.ts`, `tests/backup.test.ts`
