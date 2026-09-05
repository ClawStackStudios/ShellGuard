# Active Context — ShellGuard

## Current Work Focus

Prepared official release **v0.0.1.8** bundling the canonical Google Play compliant Privacy Policy (`docs/privacy.md`), native ShellGuard-TOTP Companion Documentation Portal (`docs/companion/`), missing top-level index portals, ground-truth database schemas, and realigned 3-step rapid onboarding. All version anchors synchronized across `package.json`, `README.md`, `CHANGELOG.md`, and `RELEASE-v0.0.1.8.md`. Full verification passed 100% green.

## Recent Changes (Sliding Window — Latest 10)

1. **2026-09-04** — CI/CD Release Trigger Optimization & Mirror Synchronization: Optimized `.github/workflows/release.yml` with job-level `if:` conditions and `workflow_dispatch`. Standard development commits now skip instantly at the GitHub server layer without allocating VM runners. Configured `mirror` job to chain after `release` (`needs: [release]`), running on `--release`, annotated tag pushes, and root `RELEASE-v*.md` changes, while skipping on manual dispatch.
2. **2026-09-04** — Version Bump v0.0.1.8 (Canonical Compliance & Full Documentation Bridge Parity): Prepared official release v0.0.1.8 bundling official Privacy Policy (`docs/privacy.md`), native ShellGuard-TOTP Companion Documentation Suite (`docs/companion/`), top-level index hubs (`/vault-features/`, `/deployment/`, `/reference/`), ground-truth database schemas, and harmonized 3-step rapid onboarding. Updated `package.json`, `README.md`, `CHANGELOG.md`, and generated `RELEASE-v0.0.1.8.md`.
3. **2026-09-04** — Full Documentation Bridge Parity & Missing Index Hubs: Mapped both sides of the bridge between application data and user documentation. Created missing top-level index pages (`docs/vault-features/index.md`, `docs/deployment/index.md`, `docs/reference/index.md`). Reconciled `docs/reference/blueprint-schema.md` to exact ground truth (`lobsters`, `agent_keys`, `id` PKs, `custom_fields`, `audit_logs`). Added documentation for Bitwarden-style Custom Fields, Native LAN TLS (`TLS_ENABLED=true`), WebCrypto fallback, and `sgtotp.bak` Android backup imports. Full verification loop passing 100% green (docs:build 0 warnings, lint clean, vite build clean, 202/202 tests).
4. **2026-09-04** — ShellGuard-TOTP Native Companion Documentation: Published complete documentation suite for the native Android companion under `docs/companion/` (`index.md`, `security.md`, `sync-and-backups.md`, `totp-engine.md`). Documented One-Way Mirror Sync, hardware KeyStore TEE isolation, `BiometricPrompt`, `FLAG_SECURE`, `.sgtotp.bak` envelope specification, and RFC 6238 TOTP computation engine with CameraX ML Kit scanning. Integrated into VitePress navigation, sidebar, reference index, and landing card.
5. **2026-09-04** — Official Privacy Policy & Compliance Invariants: Created canonical, Google Play Store compliant Privacy Policy at `docs/privacy.md` with full technical and permission disclosures (`CAMERA` in-memory QR scanning, biometric isolation, SAF backups, zero telemetry/trackers, zero-knowledge `ShellCryption`). Integrated VitePress Reference sidebar, `/privacy` route, and footer links, plus landing page footer link in `src/components/LandingView.tsx`. Set `fileParallelism: false` in `vitest.config.ts` for zero-contention test execution across all 13 suites (202 tests 100% green).
6. **2026-09-03** — Version Bump v0.0.1.7 (ShellGuard-TOTP Android Companion Compatibility Layer): Implemented `sgtotp.bak` Android backup import with client-side HKDF-SHA256/AES-GCM-256 decryption, AAD verification, Base32 normalization, and pod mapping. Formalized One-Way Mirror Sync topology in `ARCHITECTURE.md` and `RELEASE-v0.0.1.7.md`, linked to official companion releases in `README.md`, and passed full verification loop (202 tests, build/lint clean).
7. **2026-08-30** — ShellGuard-TOTP Android Design Alignment & Theme Engine: Harmonized `android/DESIGN.md` and `android/ui-ux-design-system.md` with root ShellGuard design system (`DESIGN.md`). Implemented dynamic dual-mode color tokens (`#0F1419` base, `#171C21` surface, `#DEE3EA` text, `#3D484E` border) and 6 curated accent palettes (*Reef Bioluminescent, Electric Cyan, Imperial Shell, Emerald Bio-Flora, Solar Vent, Minimalist Pearl*) with a dynamic Settings color swatch picker and `LocalShellGuardColors` Compose inheritance.
8. **2026-08-29** — ShellGuard-TOTP 6-Phase Modular Restructuring & Real-World Hardening: Restructured the roadmap and AI Studio meta-prompts into a strict 6-Phase / 2-task (`[Functionality]` + `[UI Component]`) model. Addressed missing real-world constraints: `FLAG_SECURE` window screenshot protection, `AppLifecycleObserver` auto-lock timeout, CameraX runtime permissions + "Scan from Gallery" QR picker fallback, and ProGuard/R8 rules. Updated `roadmap.md` and `meta-prompt-ai-studio.md`.
9. **2026-08-29** — Customization Architecture & Release Automation: Segregated `.agents/` into `rules/`, `skills/` (`ui-webdev`), `templates/` (`release-template.md`), and `workflows/`. Upgraded `.github/workflows/release.yml` with Claurst-style `--release vX.Y.Z.N` commit flag trigger. Cleaned Git index cache tracking on `.agents/`.
10. **2026-08-29** — Version Bump v0.0.1.5 (Bitwarden-Style Custom Fields & Modal Polish): Implemented 4 custom field types (`Text`, `Hidden`, `Checkbox`, `Linked`) across vault items, notes, and SSH keys. ShellCrypted client-side with distinct AAD namespaces. Migration 0003 adds `custom_fields` column. Refactored modal form with internal element scrolling, pinned header/footer, and upward dropup. 172 tests passing, build clean.

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

- `crypto.randomUUID()` is strictly undefined in insecure browser contexts (e.g. non-localhost HTTP LAN IPs on Unraid) — client code must provide a resilient RFC 4122 v4 fallback using `crypto.getRandomValues()` / `Math.random`
- Browser file downloads on HTTP origins: direct `data:` URI links (e.g. `data:text/json...`) trigger mixed-content / insecure-origin browser warnings and blocks in Chromium. Use `Blob([data], { type })` + `URL.createObjectURL(blob)` with cleanup `URL.revokeObjectURL(url)` instead.
- `crypto.webcrypto.subtle` hangs on Linux 6.12.24-Unraid / Node v22.23.0 — use native `crypto` module
- Empty-string defaults (`""`, `"Personal"`) get encrypted when cipher is active because the route does `category || 'Personal'`
- Test isolation requires `vi.hoisted()` to set `DATA_DIR` and `PORT` before dynamic server import
- `createTestUserWithToken(app)` requires the supertest app argument — calling it bare crashes with a confusing "Cannot read properties of undefined (reading 'address')"
- Reference-model pattern for linked child records: parent stores JSON ID array; child deletes cascade with ownership-scoped SQL (`AND owner_uuid = ?`) so foreign owners' cascades can't delete your rows
