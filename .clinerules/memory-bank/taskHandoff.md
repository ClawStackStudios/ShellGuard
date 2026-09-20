# 📦 Task Handoff Package — Into Phase 21: Bulk Import & Batch Operations

**Created**: 2026-09-19 (v0.0.2.2 released & live)
**Session Context**: ~90% utilized — new session ready
**Repository state**: `v0.0.2.2` "The Bioluminescent Reef" RELEASED & LIVE. `origin/main = 10e73fd` — fully synced, zero unpushed commits. ROADMAP `current_position` -> Phase 21.

---

## Current State

- **Phase 18 (v0.0.2.0) SHIPPED (Sep 17)**: in-browser SSH keypair engine (`src/lib/keyGen.ts` — ssh-keygen-verified Ed25519 + RSA-4096), composite items, migration 0004 (key ledger).
- **Phase 19 (v0.0.2.1) SHIPPED (Sep 18)**: BLOB migration (0005 + idempotent backfill), Busboy streaming, 50MB→500MB ceiling, 500MB→1000MB quota, Eye-beside-Copy ergonomics.
- **Phase 20 (v0.0.2.2) SHIPPED (Sep 19)**: Vault tagging (migration `0006_vault_tags`, MetadataGuard encryption, `?tags=a,b` filtering), `TagSelectorInput` + color picker, unified `podUtils.ts` color engine, collapsible tag cloud, AND/OR filter bar; SSH dual-key architecture (`parseSshKeySecret`/`serializeSshKeySecret`), `.pem` download, `authorized_keys` copy; 500MB ceiling + 1000MB quota. Docs alignment: 12 contradictions resolved. **All gates green: 20 test files, 248 tests (1 skipped), `tsc`, `vite build`, `docs:build`.**
- **Origin/main fully synced**, zero unpushed commits. Next branch: `feat/phase21-bulk-import-batch`.

## Standing Constraints

- **Territory**: `.clinerules/memory-bank/` is Cline’s ONLY memory territory; `.agents/` belongs to Antigravity — NO writes, no mirrors.
- **Canon**: ClawKey / ShellCryption / LobsterKeys; contract identifiers (`deriveShellKey`, `shellKey`, `ShellKeyFallback`) NEVER renamed.
- **Docs bow to code** (ratified): grep enforcing code first, assert doc second; Documentation Impact = definition of done.
- **Zero-knowledge**: `file_data` stays an opaque ShellCryption blob; parameterized SQL only; every query scoped `owner_uuid = ?`.

## Continuity Instructions (immediate steps for the new session)

1. **Load the bank**: `activeContext.md` → `progress.md` → `long-term/` (all 5 files) → `decision-log.md` → active rules.
2. **Execute Phase 21** on branch `feat/phase21-bulk-import-batch` → Stage 22 paste-block; green-light already given by Lucas.
3. **Task 41**: `POST /api/vault/bulk-import` endpoint with transactional semantics and 207 Multi-Status partial-failure reporting; `bulkOperations.ts` for tri-state selection, floating bulk action bar, confirmed batch delete. Wire via `src/server/routes/bulkImport.ts` + client `BulkActionBar.tsx`. Prove in `tests/vault-bulk-import.test.ts`.
4. **Task 42**: Tri-state bulk selection controls (`checkbox indeterminate`), floating bulk action bar (delete/archive/tag-assign), confirmed batch delete with ownership scoping + audit logging. Client via `ItemListPane.tsx` + `BulkActionBar.tsx`.
5. **Documentation Impact**: `docs/vault-features/bulk-operations.md`, `docs/reference/blueprint-schema.md`, `README.md` API table, `project/routes-and-contracts.md`.
6. **Environment**: Node runtime binary on this host is `/config/Applications/node-v22.23.0-linux-x64/bin` (must be in PATH); heredocs corrupt emoji (use editor tool or unicode escapes); long builds → `nohup ... > /tmp/x.log 2>&1 &` then poll; `**/` inside a TS block comment terminates it (esbuild); verify pushes via `git ls-remote` (the "Everything up-to-date" trap); Docker daemon off (record as env-blocked); oracle ~130-165s, vite ~60s, docs:build ~27-93s.

## Context Preservation

- **Locked decisions**: docs bow to code; honest-PATCH versioning; 2-Task Pairing Law; ClawKey canon; zero hardcoded pods; hash-only LobsterKey ledger; quarantine-never-delete (P23); full-value masking; memory-bank territory.
- **The lens**: `long-term/auditPerspective.md` — consult before building/docing/releasing.
- **Verification loop**: full oracle (**20 files / 248 tests**) + `tsc --noEmit` + `vite build` + `docs:build` + claim battery + anchor battery + `docsLinks` + `mermaidDiagrams`.

Handoff_Package_Prepared: true
