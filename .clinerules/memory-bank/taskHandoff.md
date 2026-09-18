# 📦 Task Handoff Package — Into Phase 19: Attachment BLOB Migration & Streaming

**Created**: 2026-09-18 (session end — context spent, compaction imminent)
**Session Context**: ~95% utilized — NEW SESSION REQUIRED
**Repository state**: `v0.0.2.0` "The Composite Reef" RELEASED & LIVE (tag `v0.0.2.0` → merge `5fd459e`, pushed; Release Pipeline ✅ 20s, Docker ✅, docs ✅; release body = `RELEASE-v0.0.2.0.md` verified). `origin/main = c6f6a4b` — **fully synced, zero unpushed commits**. Work branch **`feat/phase19-attachment-blobs` created** (1 commit ahead of its base, contains only the activeContext in-flight note).

---

## Current State

- **Phase 18 (Tasks 35/36) SHIPPED in v0.0.2.0 (Build 20)**: in-browser SSH keypair engine (`src/lib/keyGen.ts` — WebCrypto Ed25519/RSA-4096; OpenSSH one-line + RFC-4716 public, PKCS#8 PEM private; **cross-verified byte-identical against real `ssh-keygen -y` for both algorithms**; the SSH mpint keeps the DER leading `0x00` — stripping it broke canonical encoding); SSH keys gained their **first-ever form input** (they were API/drag-drop only) with a Generate Keypair panel (public copy, private Blob download); generated keys stored as JSON `{publicKey, privateKey}` sealed under `vault_ssh_keys:{id}`; public-key row in ItemDetailPane; extra fields extended to SSH keys.
- **Two premise corrections locked as receipts**: (1) pod-count decoupling was ALREADY true — `buildPodTree` filters to primary types (`podUtils.ts:193`); locked by tests in `tests/unit/keyGen.test.ts`, no rewrite needed; (2) `SshKeyVaultView.tsx` does not exist (roadmap phantom) — the key section lives in `ItemFormModal.tsx`.
- **Release protocol fully executed**: P15 → `ROADMAP-HISTORY.md`, P18 → Completed Releases (receipts `6f9b00d`/`61336a1`), build labels swept +1 (P19–P24 → **Builds 22–27**, incl. spine anchor hrefs), spine Stage 19 → SHIPPED (18 phases transcribed), ROADMAP frontmatter `current_position` → next Phase 19.
- **Ergonomics fold-in (Lucas, 2026-09-18)**: the Eye-beside-Copy relocation was **pulled forward from P22/T44 into P19/T38** — Unmask immediately LEFT of Copy on EVERY masked field row (password, SSH private key, hidden custom fields); full-value mask invariant (every character → `•`); P22/T44 is now verify-only. Embedded in ROADMAP + spine paste-blocks + 📚 impact.
- **Phase-ownership ruling**: removing standalone attachments (Bitwarden tightening) is **Phase 23** (Tasks 45/46, Build 26), NOT Phase 19. Recorded in the bank.
- **Earlier-session work now live on main**: README TOTP-style reorg, mermaid rendering (portal `withMermaid()` plugin + README label syntax fix + `tests/unit/mermaidDiagrams.test.ts`), VitePress Card.vue withBase fix + `docsLinks.test.ts` (all three link classes), long-term memory bank + `auditPerspective.md` lens, decision-log, `/learn` rules ratified, brand assets.

## ⚠️ Standing Constraints

- **Territory**: `.clinerules/` is Cline's ONLY memory territory; `.agents/` belongs to Antigravity — NO writes, no mirrors.
- **Canon**: ClawKey / ShellCryption / LobsterKeys; contract identifiers (`deriveShellKey`, `shellKey`, `ShellKeyFallback`) NEVER renamed.
- **Docs bow to code** (ratified rule): grep enforcing code first, assert doc second; 📚 Documentation Impact = definition of done.
- **Zero-knowledge invariants for Phase 19**: `file_data` stays an opaque ShellCryption blob — the server enforces storage, never content; parameterized SQL only; every query scoped `owner_uuid = ?`.

## Continuity Instructions (immediate steps for the new session)

1. **Load the bank**: `activeContext.md` (in-flight marker has the Task 37 grain) -> `progress.md` -> `long-term/` (all 5 files incl. `auditPerspective.md`) -> `decision-log.md` -> active rules (`docs-hygiene section 5`, `semantic-versioning` build sweep, `editor-large-inserts` hazards).
2. **Execute Phase 19 on branch `feat/phase19-attachment-blobs`** (already created - do NOT re-branch), via spine **Stage 20** paste-block; green-light already given by Lucas.
3. **Task 37** (the heavy stroke): write `migrations/0005_attachment_blobs.{up,down}.sql` (add BLOB column to `vault_secure_attachments`, backfill from base64 TEXT `file_data`, backward-compatible reads), streaming upload handlers in `attachments.ts` (current grain: client sends base64 dataUrl -> route INSERTs raw TEXT; 10MB cap via `MAX_ATTACHMENT_BYTES` + scoped 32mb body parser), 50MB/file ceiling + 500MB/`owner_uuid` grotto quota (413 on breach), prove in `tests/attachments-blob.test.ts`.
4. **Task 38**: streamed progress uploads + cancel buttons (`attachmentUtils.ts` + `ItemFormModal.tsx` dropzones), Web Streams AES-GCM chunked decryption, inline image/PDF previews in an encrypted object-URL modal - **plus the Eye-beside-Copy fold-in** in `ItemDetailPane.tsx` (every masked field row: password, SSH private key, hidden custom fields).
5. **Documentation Impact (definition of done)**: `reference/blueprint-schema.md` + `BLUEPRINT.md` (BLOB column); `SECURITY.md` + `ARCHITECTURE.md` (50MB/quota/413/body-limit); `.env.example` + README env table; `docs/vault-features/attachments.md`; `reference/design-system.md` (eye+copy).
6. **Release**: full protocol -> `v0.0.2.1 (Build 22)` - gates, rolling RELEASE, version bump, build sweep +1 (P20-P24 -> 23-27), tag, push.
7. **Environment facts**: `npm` at `/config/Applications/node-v22.23.0-linux-x64/bin` (must be in PATH); heredocs corrupt astral emoji (use unicode escapes or the editor tool) and long/multi-line heredocs get swallowed - `nohup ... > /tmp/x.log 2>&1 &` then poll; `**/` inside a TS block comment terminates it (esbuild); verify pushes via `git ls-remote` (the "Everything up-to-date" trap); Docker daemon off (record container checks as env-blocked); oracle ~130-165s, vite build ~60s, docs:build ~27-93s.

## Context Preservation

- **Locked decisions** (`long-term/decisions.md` + `constraints.md`): docs bow to code; honest-PATCH versioning (MINOR only for real feature phases - v0.0.2.1 is MINOR); ClawKey canon + contract identifiers; zero hardcoded pods; hash-only LobsterKey ledger; quarantine-never-delete (P23); full-value masking; memory-bank territory.
- **The lens**: `long-term/auditPerspective.md` - consult before building/documenting/releasing. Calibrated admission over confident omission.
- **Verification loop**: full oracle (**16 files / 221 tests**) + `tsc --noEmit` (one pre-existing fieldEncryption error - not a gate) + `vite build` + `docs:build` + claim battery + anchor battery + `docsLinks` + `mermaidDiagrams` suites.
- **Known quirks**: `activeContext.md` was rebuilt this session (it had silently degraded to 5 lines - verify the window is intact after edits); `git log` without `--no-pager` can hook a pager mid-chain and stall the shell.

## Learning Integration

- Patterns to apply: fail-closed count-asserted transforms (writes only after all asserts pass); probes copied from the file, never memory; byte-scan (EF BF BD) after any heredoc write; per-commit `git add` (a staging surprise rode one commit this session - caught in `--cached --stat`, disclosed); assert chains early so failures leave disk untouched.
- Phase 19 specifics: the BLOB backfill must be idempotent (envelope detection); streaming may rework the 32mb body-parser scoping (Busboy multipart bypasses JSON bodies - decide the multipart contract first); coordinate the `10MB to 50MB` change across client cap, zod max, body limit, and docs in one stroke.

Handoff_Package_Prepared: true
