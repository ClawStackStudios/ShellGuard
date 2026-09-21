# 📦 Task Handoff Package — Phase 21 committed → merge, release v0.0.2.3, then Phase 22

**Created**: 2026-09-20 (Phase 21 implemented & committed; pending merge + release)
**Session Context**: ~85% utilized — new session ready
**Repository state**: Phase 21 COMPLETE & COMMITTED on `feature/phase-21-bulk-operations-11309179680338905330` (`6f862e5` feat + `3b40008` docs sync), gate-verified (**21 files / 259 passed / 1 skipped / 0 failed**). **NOT merged to `main`, NOT tagged** — `package.json` still `0.0.2.2`. Working tree CLEAN.

---

## Current State

- **Phase 18 (v0.0.2.0) SHIPPED (Sep 17)**: in-browser SSH keypair engine (`src/lib/keyGen.ts` — ssh-keygen-verified Ed25519 + RSA-4096), composite items, migration 0004 (key ledger).
- **Phase 19 (v0.0.2.1) SHIPPED (Sep 18)**: BLOB migration (0005 + idempotent backfill), Busboy streaming, 50MB→500MB ceiling, 500MB→1000MB quota, Eye-beside-Copy ergonomics.
- **Phase 20 (v0.0.2.2) SHIPPED (Sep 19)**: Vault tagging (migration `0006_vault_tags`, MetadataGuard encryption, `?tags=a,b` filtering), `TagSelectorInput` + color picker, unified `podUtils.ts` color engine, collapsible tag cloud, AND/OR filter bar; SSH dual-key architecture (`parseSshKeySecret`/`serializeSshKeySecret`), `.pem` download, `authorized_keys` copy; 500MB ceiling + 1000MB quota. Docs alignment: 12 contradictions resolved. **All gates green: 20 test files, 248 tests (1 skipped), `tsc`, `vite build`, `docs:build`.**
- **Phase 21 (Build 25) COMMITTED, pending merge + release (Sep 20)**: `POST /api/vault/bulk-import` (scoped 10MB parser, per-record `bulkImportItem.safeParse()`, 207 Multi-Status `{inserted: string[], errors:[{index,reason}]}`), `DELETE /api/vault/bulk` (`canDelete`, tx-wrapped attachment cascade, 207 on missing IDs), tri-state multi-select + floating bulk action bar (`Move to Pod`/`Assign Tag`/`Delete`, `!isLocked` guard, Reef Modernist modals replacing `prompt()`/`confirm()`), import preview + error-resolution chips. **P0 fixed**: bulk routes now register ABOVE the `:id` family (previously shadowed → 404). Witness suite `tests/vault-bulk-import.test.ts` (350 lines, 11 tests, port 64650). **`origin/main` is still `a1656a2` — the branch is 3 commits ahead and unmerged.**

## Standing Constraints

- **Territory**: `.clinerules/memory-bank/` is Cline’s ONLY memory territory; `.agents/` belongs to Antigravity — NO writes, no mirrors.
- **Canon**: ClawKey / ShellCryption / LobsterKeys; contract identifiers (`deriveShellKey`, `shellKey`, `ShellKeyFallback`) NEVER renamed.
- **Docs bow to code** (ratified): grep enforcing code first, assert doc second; Documentation Impact = definition of done.
- **Zero-knowledge**: `file_data` stays an opaque ShellCryption blob; parameterized SQL only; every query scoped `owner_uuid = ?`.

## Continuity Instructions (immediate steps for the new session)

1. **Load the bank**: `activeContext.md` → `progress.md` → `long-term/` (all 5 files) → `decision-log.md` → active rules.
2. **Merge + release Phase 21** (the immediate next stroke): merge `feature/phase-21-bulk-operations-11309179680338905330` → `main`, then run the release protocol → **v0.0.2.3 (Build 25)**: version bump (`package.json` + README badge), RELEASE doc roll, Build-sweep +1 (**P22–P24 → Builds 26–28, INCLUDING anchor hrefs in ROADMAP.md + `project/meta-prompt-ai-studio.md`**), tag → push → mirror verify. ROADMAP Tasks 41/42 are already `[x]`; frontmatter `current_position` + `last_updated` + `features_completed` still need the sweep.
3. **Phase 22 (Tasks 43/44 — Reef Polish Pass, Unified Search)** on a NEW branch: one search surface over the already-decrypted in-memory corpus (titles, keywords, attachment file names, note contents, custom fields); remove header + sidebar search; Eye-beside-Copy is verify-only (folded into P19/T38). No schema or API contract change — the server NEVER receives a search query. Required reading: `project/ui-ux-design-system.md` §5/§7, `shellcryption-spec.md` §6, `verification-gates.md` §2–§3.
4. **Roadmap hygiene debt** (small, do it during the release sweep): `ROADMAP.md:48` still reads *"Update bulk delete endpoints"* — no bulk endpoints existed; correct to "Add bulk delete route". `ROADMAP.md` line 48 and the Phase 21 block also still carry the pre-implementation wording.
5. **Documentation Impact for Phase 22**: `docs/vault-features` (single-search surface), `reference/design-system.md` (ergonomics), `shellcryption-spec.md` §6 (verify-only).
6. **Environment**: Node runtime binary on this host is `/config/Applications/node-v22.23.0-linux-x64/bin` (must be in PATH); heredocs corrupt emoji (use the editor tool or `\U` escapes; byte-scan for `b'\xef\xbf\xbd'` after any heredoc write); long builds → `nohup ... > /tmp/x.log 2>&1 &` then poll the log (exit codes lie, logs don't); `**/` inside a TS block comment terminates it (esbuild); verify pushes via `git ls-remote` (the "Everything up-to-date" trap); Docker daemon off (record as env-blocked). Measured gate times: oracle ~191s, `vite build` ~55s, `docs:build` ~101–106s.
7. **Review discipline learned this cycle**: verify the **commit**, not the checkout — `git status --porcelain`, `git log --oneline origin/main..HEAD`, and `git show HEAD:<file>` before declaring a PR reviewable. Jules' five fixes were once all correct on disk and all absent from `HEAD`.

## Context Preservation

- **Locked decisions**: docs bow to code; honest-PATCH versioning; 2-Task Pairing Law; ClawKey canon; zero hardcoded pods; hash-only LobsterKey ledger; quarantine-never-delete (P23); full-value masking; memory-bank territory.
- **The lens**: `long-term/auditPerspective.md` — consult before building/docing/releasing.
- **Verification loop**: full oracle (**21 files / 259 tests**) + `tsc --noEmit` + `vite build` + `docs:build` + claim battery + anchor battery + `docsLinks` + `mermaidDiagrams`.
- **New locked decisions**: bulk routes register ABOVE `/:id`; `VaultSchemas.bulkImport` is deliberately `z.array(z.any())` at the container level with per-record `bulkImportItem.safeParse()` (do NOT tighten back to a typed array — it would break 207); 207 errors live INSIDE `data`; scoped 10MB parser mounted before the global 1MB parser.
- **Governance**: `.agents/memory-bank/` absorbed the Phase 21 state (Antigravity's territory). `.jules/JULES.md` is a new third agent identity, committed this cycle. `.clinerules/memory-bank/` remains Cline's only bank.

Handoff_Package_Prepared: true
