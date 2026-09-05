# Active Context — ShellGuard

## Current Work Focus

Multi-User Architecture (frontend session model) shipped: implemented Bitwarden-style locked dashboard, QuickLoginModal overlay for re-authentication, and account switcher improvements. Next: ROADMAP review (Attachment BLOB migration, tagging, etc).

## Recent Changes (Sliding Window — Latest 10)

1. **2026-08-29** — Android Native Reference Architecture & Unified Item Model: created comprehensive Android technical specification (`docs/android/` + `.agents/memory-bank/android/`) and updated Attractor Beacon with Bitwarden-style item composition & disaster recovery anchors
2. **2026-08-29** — Vault Lock Hardening & NavIntent State Routing: enforced strict `isLocked` guards across all pod mutation operations, live search dropdowns, header quick add menus, and item mutations; unified reload navigation with `sg_nav_intent` in `sessionManager.ts`
3. **2026-08-29** — Zero Hardcoded Default Pods: removed all hardcoded default pods (`Personal`, `Work`, defaults) across `podUtils.ts`, `FolderInputGroup.tsx`, `App.tsx`, `PasswordVaultView.tsx`, and `GeneratorToolView.tsx` so all pods are 100% user-created and managed
4. **2026-08-29** — Pod Deletion & Category Normalization Fix: patched pod removal by normalizing pod categories across `handleDeletePod` and `handleRenamePod` in `App.tsx`, adding immediate optimistic local state updates, batching server syncs with `skipScuttle`, and making modal deletion handlers fully asynchronous
5. **2026-08-29** — Sidebar Polish & Custom Deletion Modal: replaced native `window.confirm` with custom animated delete confirmation in `PodModal.tsx`, fixed breadcrumb alignment, and added desktop sidebar toggle (`PanelLeftOpen`/`Close`)
6. **2026-08-29** — Agent Rate Limiter Fix: discovered and patched a silent rate-limiter bug in `createAgentKeyRateLimiter` where agent limits were bypassed because global limiter ran before `requireAuth`
7. **2026-08-29** — Reef Modernist Re-theming: re-themed all Lobster Key wizard, key card, tab, and toast components to ShellGuard's design system (`DESIGN.md`)
8. **2026-08-29** — CaraBase Lobster Keys Wizard 1:1 Port: built full 4-step Lobster Key wizard, orchestrator, key card, toast provider, and confirm dialog
9. **2026-08-29** — Smart TOTP Account Defaulting: wired active session username into generator tool and options
10. **2026-08-29** — Branding & Issuer Alignment: corrected remaining `SeaGuard` references to `ShellGuard`

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
