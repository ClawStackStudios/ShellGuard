# 🦞 ShellGuard — SuperLobster Admin Suite Specification

> **Token-gated admin plane, threat model & panel architecture**
> *Pulled into existence by Phase 6. Grows with the walk.*

---

## §1. Admin Plane Role & Threat Model (T1–T2)

The SuperLobster panel (`/superlobster`) is an instance-administration plane
**outside** the zero-knowledge user model — it exists because someone must
operate the reef. Its threat model is secrets-aware:

- **T1** — no `ADMIN_TOKEN` env ⇒ the panel **does not exist** (all admin
  routes return `503`). The admin plane is opt-in by configuration.
- **T2** — admin sessions are **volatile**: held in an in-memory store,
  gone on restart (a restart invalidating every admin session is exactly the
  intended behavior), 20-minute sliding expiry, `httpOnly` + `SameSite=Strict`
  cookie in a dedicated namespace (`sg_admin_session`) — separate from user
  Bearer tokens.
- Token verification uses **constant-time comparison** — never `===`.
- Admin login attempts are behind a dedicated `adminAuthLimiter`.

## §2. Admin API (`src/server/routes/admin.ts`)

| Endpoint | Middleware | Effect |
|:---|:---|:---|
| `POST /api/admin/auth` | `adminAuthLimiter` + zod | session login from `ADMIN_TOKEN` |
| `GET /api/admin/verify` | — | session check |
| `POST /api/admin/logout` | — | destroy session |
| `GET /api/admin/users` | `requireAdmin` | lobster list (strict metadata) |
| `DELETE /api/admin/users/:uuid` | `requireAdmin` + zod | cascade lobster deletion |
| `GET /api/admin/status` | `requireAdmin` | read-only reef diagnostics |
| `GET /api/admin/settings` | `requireAdmin` | whitelist-only settings view |
| `PATCH /api/admin/settings` | `requireAdmin` + zod | edit whitelist-only keys |
| `GET /api/admin/uptime` | `requireAdmin` | uptime metrics |
| `GET /api/admin/audit` | `requireAdmin` | audit log (segregated `audit.sqlite`) |
| `POST /api/admin/backup` | `requireAdmin` | fail-safe Online-Backup-API snapshot |
| `GET /api/admin/backups` | `requireAdmin` | backup manifest + rotation list |

## §3. Inviolable Admin Rules

1. **Whitelist-only settings** — the panel edits only keys explicitly
   whitelisted; everything else is read-only.
2. **No HTTP restore** — backups are downloaded-free and restore is an
   offline procedure (`scripts/restore.ts` validator, Vaultwarden-style);
   the panel never restores over HTTP.
3. **Audit DB is sacred** — `audit.sqlite` is never swapped, deleted or
   overwritten by backup/restore operations.
4. **Cascade deletions** — lobster deletion cascades its vault data with
   ownership scoping, and is itself audited.
5. **Backups fail-safe** — Online-Backup-API snapshots with manifest +
   rotation; a failed backup never corrupts the live database.

## §4. Panel Component Architecture

```text
SuperLobsterContext    — volatile session state + verify loop
SuperLobsterLogin      — token gate (admin-login hash alias)
SuperLobsterPanel      — tabbed shell
├── SuperLobsterStatus    — diagnostics + uptime
├── SuperLobsterUsers     — strict-metadata lobster management + cascade delete
├── SuperLobsterSettings  — whitelist-only editor
├── SuperLobsterAudit     — audit log viewer
└── SuperLobsterBackups   — snapshot trigger + manifest/rotation
```

`BouncyBrand.tsx` lands alongside as the brand-motion component for the
admin gate (and later reuses).

---
