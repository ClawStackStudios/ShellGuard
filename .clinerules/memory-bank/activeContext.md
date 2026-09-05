# Active Context — ShellGuard

## Current Work Focus

**Release pipeline tightened — RELEASE doc is the single source of truth (merged `074eab0`, pushed, CI-verified).** `release.yml` rewritten: strict exact-version `RELEASE-<tag>.md` resolution (hard fail, no fallback/auto-notes), new mirror job auto-syncs release bodies when `RELEASE-v*.md` changes on main (skips rename delete-halves, no-tag-yet, and release-owned pushes), HEAD-only `--release` flag detection. `draft-release.md` + `version-update.md` aligned to the **rolling-file model**: exactly one `RELEASE-v*.md`, `git mv` upward each release, never create new files. Verified: YAML parse + structural assertions, lint clean, 180 tests / 12 suites (first run showed 3 transient unhandled errors — flaky async teardown, clean on re-run), Release Pipeline workflow ran success on the merge push itself. Note: uncommitted `android/*` doc modifications in working tree are Lucas's in-flight work — untouched.

## Recent Changes (Sliding Window — Latest 10)

1. **2026-09-03** — **Release v0.0.1.7 published** 🦞: New Release Protocol executed — lint clean (pre-existing fieldEncryption.ts tsc error resolved), 13/13 suites / 202 tests green, build ✓, single RELEASE-v0.0.1.7.md verified, annotated tag v0.0.1.7 pushed from c6d17d8. Release Pipeline ✓ auto-mirrored doc verbatim to https://github.com/ClawStackStudios/ShellGuard/releases/tag/v0.0.1.7; Docker publish workflow also triggered. Version sync confirmed (package.json/README badge/CHANGELOG).
2. **2026-09-03** — sgtotp.bak Compatibility Layer: `src/lib/sgtotpBackup.ts` parses ShellGuard-TOTP Android backups (encrypted `shellguard-totp-backup-v1` envelopes, plain exports, bare arrays). Encrypted envelopes decrypt client-side via `hkdfSha256(aesGcmDecrypt)` with ikm = export key, salt = `envelope.ownerUuid`, AAD `totp_backup:{ownerUuid}`, plus enforced SHA-256 checksum of the exact decrypted string. Items map to fresh-UUID vault pearls (Base32-normalized seeds, `normalizePod()` categories); `lockTheClaw` re-encrypts under `vault_pearls_totp:{id}`. `ImportExportView` sniffs sgtotp formats in `handleProcessImport` with a PIN/key modal for encrypted envelopes. 22 new tests in `tests/unit/sgtotpBackup.test.ts` (incl. full crypto round-trip fixture); 13/13 suites pass, vite build clean. NOTE: the exporter's inner checksum JSON is kotlinx-pretty-printed — checksum is only byte-reproducible post-decrypt (enforced there; advisory on plaintext).
3. **2026-09-03** — Landing Header Divider Fix: `LandingView.tsx` header used neutral `border-theme-subtle` (grey both modes) while the dashboard `Header.tsx` correctly uses `border-b-2 border-purple-600 dark:border-red-500` (magenta light / red dark brand line). Aligned landing header to the dashboard classes. Committed as `2d7d9a2` on `feat/sgtotp-import` — deliberately bundled with Lucas's staged v0.0.1.7 release rename per his call ("wrap it into the release"). Lesson: `git status` showed the tree dirty but the RELEASE rename was already *staged* — check staged-vs-untracked distinction before committing.
4. **2026-08-29** — Native LAN TLS: `tlsManager.ts` (generate/persist/reuse self-signed certs, BYO via TLS_CERT_PATH/KEY_PATH), `server.ts` conditional `https.createServer` + HSTS-on-TLS, `.env.example` TLS section, Docker healthcheck TLS-aware, SECURITY.md transport threat model, QUICKSTART LAN-HTTPS recipe, 8 new tests in `tests/tls.test.ts`
5. **2026-08-29** — Bitwarden-Style Custom Fields: Text, Hidden, Checkbox, Linked fields across all vault item types. ShellCrypted client-side with distinct AAD namespaces. Migration 0003 adds `custom_fields TEXT` column. Full round-trip: encrypt on create/update, decrypt on read, render in detail pane. JSON export included.
6. **2026-08-29** — Pure TypeScript WebCrypto Fallback Engine: zero-dependency SHA-256, HMAC-SHA256, HKDF, AES-GCM-256 in `src/lib/webCryptoFallback.ts`; polyfills `crypto.subtle` when undefined on HTTP LAN origins
7. **2026-08-29** — Global drag-and-drop shield (window-level `dragover`/`drop` preventDefault); TOTP QR code downloads via Blob streams
8. **2026-08-29** — Official `shellguard-icon.svg` favicon; Unraid template icon URL; docs hygiene sweep (purged legacy breaking-change warnings)
9. **2026-08-29** — Insecure Origin UUID & Entropy Fallback: multi-tier RFC 4122 v4 UUID and secure entropy fallback for HTTP origins (`src/lib/crypto.ts`)
10. **2026-08-29** — LAN HTTP Insecure File Downloads: replaced `data:` URIs with `Blob` + `URL.createObjectURL` in `downloadIdentityFile`/`downloadAttachment`
11. **2026-08-29** — Zero Hardcoded Default Pods: emptied `DEFAULT_ROOT_PODS`, `INITIAL_DEFAULT_COLORS`; `normalizePod` returns `""` (was `"Personal"`)
12. **2026-08-29** — Pod Deletion & Category Normalization: `normalizePod` imported into `App.tsx`; optimistic local state with `skipScuttle` batch pattern; `restAdapter` generics + PATCH method
13. **2026-08-29** — Sidebar Polish, Custom Deletion Modal & Agent Rate Limiter Fix: animated in-modal confirmation, desktop sidebar toggle, auth-before-rate-limit ordering

## Active Decisions

- **Locked**: SENSITIVE_KEY derived from `hu-` key via HKDF (one secret, one file)
- **Locked**: Keep SQLCipher whole-DB encryption as defense-in-depth alongside per-row encryption
- **Locked**: Twin-verbatim policy with ClawChives (server modules mirror file-for-file)
- **Locked**: Attachment reference model — files in `vault_secure_attachments`, pearls store JSON ID arrays; attachment dataUrl encrypted with AAD `vault_secure_attachments:{id}`
- **Locked**: SuperLobster Panel — no HTTP restore, no backup download, whitelist-only settings, strict-metadata user list, `audit.sqlite` never swapped by restore (ADMIN.md threat model)
- **Locked**: Zero hardcoded default pods — all pods are 100% user-created. No "Personal" or "Work" fallback.
- **Locked**: Category normalization via `normalizePod()` must be used for ALL comparisons between tree paths and item categories

## Important Patterns

- In-place encryption: no schema changes, encrypted JSON in same TEXT columns
- Backward compatibility: legacy plaintext passes through on read
- `DB_ENCRYPTION_KEY` governs both SQLCipher AND per-row metadata encryption
- Native Node `crypto` (NOT `crypto.webcrypto.subtle` which hangs in this environment)
- **WebCrypto Fallback Pattern**: `window.crypto.subtle` is undefined on plain HTTP browser origins (LAN IPs). `src/lib/webCryptoFallback.ts` provides pure TypeScript implementations (SHA-256, HMAC-SHA256, HKDF, AES-GCM-256) that transparently replace `crypto.subtle` methods when unavailable.
- **Blob download pattern**: Replace `data:` URI links with in-memory `Blob` + `URL.createObjectURL(blob)` to avoid Chromium insecure-connection download blocks on HTTP LAN origins.
- Shared attachment helpers live in `src/lib/attachmentUtils.ts` (parseAttachmentIds, formatBytes, downloadAttachment, MAX_ATTACHMENT_BYTES)
- **Category normalization must be used for ALL pod operations** — always use `normalizePod()` before comparing item categories to tree paths
- **Optimistic local state updates**: use `setVaultItems(prev => prev.map(...))` for immediate UI responsiveness, then sync to server
- **`skipScuttle` pattern**: batch multiple server mutations with `skipScuttle=true`, then call a single `scuttleVault` at the end to prevent redundant GET re-fetches from overwriting in-flight PUT requests
- **Custom Fields AAD pattern**: Use distinct AAD namespaces per item type for custom fields encryption: `vault_pearls_custom`, `vault_secure_notes_custom`, `vault_ssh_keys_custom`. The custom_fields blob is NOT registered in metadataGuard — it's already client-encrypted via ShellCryption.

## Key Learnings

- `crypto.webcrypto.subtle` hangs on Linux 6.12.24-Unraid / Node v22.23.0 — use native `crypto` module server-side
- `window.crypto.subtle` is undefined on plain HTTP browser origins — `src/lib/webCryptoFallback.ts` polyfills client-side
- `window.crypto.randomUUID` is undefined on HTTP origins — multi-tier fallback in `src/lib/crypto.ts`
- `data:` URI downloads blocked on Chromium insecure connections — use `Blob` + `URL.createObjectURL` instead
- Empty-string defaults (`""`, `"Personal"`) get encrypted when cipher is active because the route does `category || 'Personal'`
- Test isolation requires `vi.hoisted()` to set `DATA_DIR` and `PORT` before dynamic server import
- `tsc --noEmit` has one pre-existing error in fieldEncryption.ts (hkdfSync ArrayBuffer vs Buffer) on main — not a regression gate; vite build is the gate
- `createTestUserWithToken(app)` requires the supertest app argument — calling it bare crashes with a confusing "Cannot read properties of undefined (reading 'address')"
- Reference-model pattern for linked child records: parent stores JSON ID array; child deletes cascade with ownership-scoped SQL (`AND owner_uuid = ?`) so foreign owners' cascades can't delete your rows
- Category string comparisons between tree paths and items must always use `normalizePod()` because unnormalized strings with spaces or slash differences silently fail strict equality
- Sub-pods must be matched using `.startsWith(targetPod + "/")` so child items in nested pods are properly cascaded to "Personal"
- `npm` is at `/config/Applications/node-v22.23.0-linux-x64/bin` — must be in `PATH` for build commands
- Vitest test for WebCrypto fallback needs a stubbed `window.crypto.subtle` environment to test the fallback path — the current test environment may not properly mock this
