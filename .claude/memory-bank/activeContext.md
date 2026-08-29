# Active Context — ShellGuard

## Current Work Focus

Multi-User Architecture (frontend session model) shipped: implemented Bitwarden-style locked dashboard, QuickLoginModal overlay for re-authentication, and account switcher improvements. Next: ROADMAP review (Attachment BLOB migration, tagging, etc).

## Recent Changes (Sliding Window — Latest 10)

1. **2026-08-29** — SuperLobster `/superlobster` route migration: transitioned from hash-only `/#/super-lobster` to native path `/superlobster` with popstate routing and alias fallbacks (`/super-lobster`, `/admin-login`, and hash forms)
2. **2026-08-29** — Port migration: 5353→6464 (web), 5454→6565 (API); 26 source files + Docker/Compose/Unraid template + docs + memory banks; test ports 5454X → 6464X; 155 tests pass, build clean, live smoke on :6464/:6565
3. **2026-08-29** — SuperLobster CaraBase Design Alignment Phase 3: comprehensive card-grid and dashboard polish across all admin sub-sections (Status 3-card metric grid + uptime timeline; Users summary ribbon + avatar badges + search toolbar + cascade delete modal; Settings preset chips + env-lock callout; Backups hero controller card + offline restore guide; Audit filter chips + sovereign badges; Panel BouncyBrand header + live status indicators)
3. **2026-08-28** — Multi-user frontend architecture: QuickLoginModal overlay for re-authentication, Bitwarden-style locked dashboard state, Header account switcher with individual background-account locking, routing cleanup in App.tsx
4. **2026-08-28** — SuperLobster Panel v0.3.0: requireAdmin middleware, /api/admin routes, backupManager (Online Backup API + manifest + rotation), scheduler, React panel (context/login/status/users/settings/backups/audit), hash routing #/super-lobster, scuttle:restore script, 15 admin tests, ADMIN.md threat model
5. **2026-08-28** — Password attachments rework: upload UI, 10MB cap (14M chars zod limit), pearl→attachment cascade delete, download buttons, edit/add flows
6. **2026-08-28** — Docs corrected for attachment reference model (README/ARCHITECTURE/BLUEPRINT/QUICKSTART/ROADMAP); Per-Row Encryption + Bulk operations crossed off
7. **2026-08-27** — Triple-layer encryption docs updated across README, SECURITY, ARCHITECTURE, BLUEPRINT, QUICKSTART
8. **2026-08-27** — Port migration: 4545→5353, 4646→5454 across all config, Docker, tests, docs
9. **2026-08-27** — Per-row AES-256-GCM metadata encryption implemented and committed (`b71af08`)
10. **2026-08-27** — AGPL-3.0 license added, npm audit vulnerabilities fixed (`f33a580`)

## Active Decisions

- **Locked**: SENSITIVE_KEY derived from `hu-` key via HKDF (one secret, one file)
- **Locked**: Keep SQLCipher whole-DB encryption as defense-in-depth alongside per-row encryption
- **Locked**: Twin-verbatim policy with ClawChives (server modules mirror file-for-file)
- **Locked**: Attachment reference model — files in `vault_secure_attachments`, pearls store JSON ID arrays; attachment dataUrl encrypted with AAD `vault_secure_attachments:{id}`
- **Locked**: SuperLobster Panel — no HTTP restore, no backup download, whitelist-only settings, strict-metadata user list, `audit.sqlite` never swapped by restore (ADMIN.md threat model)

## Important Patterns

- In-place encryption: no schema changes, encrypted JSON in same TEXT columns
- Backward compatibility: legacy plaintext passes through on read
- `DB_ENCRYPTION_KEY` governs both SQLCipher AND per-row metadata encryption
- Native Node `crypto` (NOT `crypto.webcrypto.subtle` which hangs in this environment)
- Shared attachment helpers live in `src/lib/attachmentUtils.ts` (parseAttachmentIds, formatBytes, downloadAttachment, MAX_ATTACHMENT_BYTES)

## Key Learnings

- `crypto.webcrypto.subtle` hangs on Linux 6.12.24-Unraid / Node v22.23.0 — use native `crypto` module
- Empty-string defaults (`""`, `"Personal"`) get encrypted when cipher is active because the route does `category || 'Personal'`
- Test isolation requires `vi.hoisted()` to set `DATA_DIR` and `PORT` before dynamic server import
- `tsc --noEmit` has one pre-existing error in fieldEncryption.ts (hkdfSync ArrayBuffer vs Buffer) on main — not a regression gate; vite build is the gate
- `createTestUserWithToken(app)` requires the supertest app argument — calling it bare crashes with a confusing "Cannot read properties of undefined (reading 'address')"
- Reference-model pattern for linked child records: parent stores JSON ID array; child deletes cascade with ownership-scoped SQL (`AND owner_uuid = ?`) so foreign owners' cascades can't delete your rows
