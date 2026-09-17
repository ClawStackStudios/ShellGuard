# Active Context — ShellGuard

## Current Work Focus

Brand asset refresh complete and verified: delivered CaraBase woodcut vector engraving mascot logo and 1:1 thumbnail, server-distinct notched carapace crest favicon enclosing a multi-grid Web Globe in ShellGuard purple/pink palette (`#e4048a`, `#ec4899`, `#c026d3`, `#ffffff`), and restored the tighter original panoramic Web Feature Graphic banner (`shellguard-feature-graphic.png`) from `sg_feature_graphic_1789650843895.jpg`. Aligned root `README.md` header structure to match ShellGuard-TOTP convention with centered 112x112 app icon at top and full-width feature banner under logo. Full memory bank updated across `.agents/memory-bank/` with historical capture back to v0.0.1.8. Strict memory bank boundary enforced (`.agents/` strictly Antigravity; `.clinerules/` strictly Cline).

## Recent Changes (Sliding Window — Latest 10)

1. **2026-09-17** — CaraBase Brand Asset Alignment, Feature Graphic Restoration & README Sync: Redesigned ShellGuard brand assets to match CaraBase woodcut vector engraving aesthetic. Turned crab mascot body 180° forward/downward clasping the vault safe door with 3D 'S' crest. Replaced generic TOTP companion favicon re-use with a server-distinct notched carapace crest shield enclosing a multi-grid Web Globe in ShellGuard's signature purple/pink palette (`#e4048a`, `#ec4899`, `#c026d3`, `#ffffff`). Restored the tighter original 1024x500 Web Feature Graphic banner (`shellguard-feature-graphic.png`) from `sg_feature_graphic_1789650843895.jpg` featuring the neon clam-pearl shield and floating credential cards. Aligned root `README.md` to match ShellGuard-TOTP header layout (centered 112px app icon at top, full-width feature graphic banner under logo and badges, and quick links). Twin parity verified across `public/` and `docs/public/assets/`. Full verification loop passing 100% green (lint, vite build, docs:build, 215 vitest tests).
2. **2026-09-17** — Agent Memory Bank Isolation Boundary: Lucas clarified hard memory bank boundary: Antigravity's memory bank is strictly `.agents/memory-bank/`; Cline's is `.clinerules/memory-bank/`. Zero cross-mirroring between agent bank directories. Reverted any accidental touch to `.clinerules/` to keep Cline's state pure.
3. **2026-09-16** — Release v0.0.1.10 ("The Auditable Corpus"): 34-commit documentation-governance release. Restored genome chronology (`project/` spine `Stage N = Phase N−1`, Stage 18.5 post-summit interlude, 26/26 roadmap links), reorganized ROADMAP top-down chronological, queued Phase 24 (Cryptographic Audit Hardening & Third-Party Auditability, Tasks 47/48, provisional v0.0.2.6/Build 26) with Documentation Impact blockquotes in all queued phases (18-24), and adopted the Decision Log (20-entry window).
4. **2026-09-16** — Bidirectional Docs ↔ Code Audit (8 Truth Corrections, Docs Bow to Code): Corrected 8 documentation contradictions against verified code: L1 PRAGMA rekey (not sqlcipher_export), L2 authLimiter (10/15m skip-success, not 5/10m), L3 identity-file contract (`shellguard_identity_<username>.json`), L4 phantom `customFields.ts` purged, L5 `tlsManager.ts`, L6 client crypto.ts export names, L7 fifth `canMove` mask + 7 wizard presets, L8 custom-field AAD namespace `<table>_custom:{id}`.
5. **2026-09-16** — The ClawKey Canon & Root-Docs Coherence Pass: Formalized ClawStack canon across root docs and UI: `ClawKey©™` (sovereign 67-char `hu-` identity key), `ShellCryption©™` (client-side encryption engine), `LobsterKeys` (`lb-` delegated agent keys). Renamed 14 user-facing UI strings `ShellKey` -> `ClawKey` in web app for 1:1 parity with Android companion. Synced `ARCHITECTURE.md`, `SECURITY.md`, `BLUEPRINT.md`, `README.md`, `QUICKSTART.md`.
6. **2026-09-13** — Post-v0.0.1.9 Hotfix & Version Test Integrity: Vault master-detail headers flushed to shared 64px (`h-16`) across dashboard T-junction; `tests/unit/version.test.ts` de-hardcoded from literal `'0.0.1.8'` to package ground-truth matching `X.Y.Z.N` shape.
7. **2026-09-13** — Release v0.0.1.9 (Key Ledger Hardening & CaraBase UI Parity): Implemented Phase 17: SQLite migration `0004_key_ledger.sql` retired plaintext `api_key` column from `agent_keys`, storing SHA-256 `key_hash` and `key_fingerprint` (`lb-***-XXXX`). Constant-time `crypto.timingSafeEqual()` verification. Minted-once secret delivery. Purged hardcoded `DEFAULT 'Personal'` pod defaults (uncategorized = `""`). CaraBase 1:1 key row masking on Lobster Keys card. 15 test files / 210 tests passed 100% green.
8. **2026-09-05** — Reverse-Build `/project` Genome (Phases 1-16 Transcribed): Reconstructed post hoc from git history in `/project/`: meta-prompt spine (Stage 0 void → Stage 17 summit), receipt-matched ROADMAP (16 phases / 32 task pairs, `v0.0.0.0` → `v0.0.1.8`), 10 spec oracles including `shellcryption-spec.md`. Coherence audit repaired 50 dangling references.
9. **2026-09-05** — Root Documentation Systemic Alignment (v0.0.1.8 Parity): Reconciled all 8 root doc files against active schema truth (`agent_keys`, `lobsters`, `custom_fields`), dynamic `version.ts` resolver from `package.json`, dead link cleanup (`CRUSTSECURITY.md`), and automated CI release trigger optimization.
10. **2026-09-04** — Release v0.0.1.8 (Canonical Compliance & Mobile Companion Portal): Shipped v0.0.1.8 with official Google Play Store compliant Privacy Policy (`docs/privacy.md`), native ShellGuard-TOTP Companion Documentation Portal (`docs/companion/`), top-level index hubs (`/vault-features/`, `/deployment/`, `/reference/`), and full two-sided bridge mapping.

## Active Decisions

- **Locked**: Agent memory bank isolation — Antigravity operates strictly in `.agents/memory-bank/`; Cline operates in `.clinerules/memory-bank/`. Never cross-touch or mirror.
- **Locked**: The ClawKey Canon — `ClawKey©™` (user identity key `hu-`), `ShellCryption©™` (client encryption engine), `LobsterKeys` (agent API keys `lb-`).
- **Locked**: Hash-only agent key ledger — migration `0004_key_ledger.sql` retired plaintext `api_key` column; hash storage only with constant-time verification.
- **Locked**: Web server favicon identity — notched carapace crest shield enclosing multi-grid Web Globe in ShellGuard purple/pink palette (`#e4048a`, `#ec4899`, `#c026d3`, `#ffffff`).
- **Locked**: Asset twin parity — all brand assets must maintain 1:1 parity between `public/` and `docs/public/assets/`.
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
