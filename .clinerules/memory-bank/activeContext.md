# Active Context — ShellGuard

## Current Work Focus

**Phase 21 "Bulk Import Endpoint & Batch Operations" IMPLEMENTED & COMMITTED (2026-09-20) — pending merge + release as v0.0.2.3 (Build 25)**. Tasks 41/42 are complete and gate-verified on branch `feature/phase-21-bulk-operations-11309179680338905330` (commits `6f862e5` feat + `3b40008` docs sync). Delivered: transactional `POST /api/vault/bulk-import` (scoped **10MB** body parser, per-record `VaultSchemas.bulkImportItem.safeParse()` validation, HTTP **207 Multi-Status** partial success `{ inserted: string[], errors: [{ index, reason }] }`, `type` constrained to `password|pearl`), `DELETE /api/vault/bulk` (`canDelete`, `{ ids: string[] }`, tx-wrapped attachment cascade + audit, 207 on missing IDs), tri-state multi-select + floating bulk action bar (`Move to Pod` / `Assign Tag` / `Delete`) in `VaultShell.tsx` guarded by `!isLocked`, Reef Modernist modals replacing native `prompt()`/`confirm()`, import preview table + error-resolution chips in `ImportExportView.tsx`, and the **P0 route-shadowing fix** (bulk routes now registered ABOVE the `:id` family). All gates verified green: **21 test files / 259 passed / 1 skipped / 0 failed**, `tsc --noEmit`, `vite build` (2177 modules, 55s), `docs:build` (~101s). **NEXT: merge to `main` → cut v0.0.2.3 (Build 25) → Phase 22 (unified search).**

## Recent Changes (sliding window — 10)

1. **2026-09-20 — Phase 21 implemented & committed** (`6f862e5` + `3b40008`): bulk import/delete endpoints + tri-select UI + import wizard. Route-shadowing P0 fixed (bulk routes above `:id`). All gates green: 21 suites / 259 passed / 1 skipped / 0 failed. Pending merge + v0.0.2.3 cut.
2. **2026-09-19 — v0.0.2.2 "The Bioluminescent Reef" SHIPPED (Phase 20, Build 24)**: Vault tagging system (migration `0006_vault_tags`, MetadataGuard Layer 2 encryption, `?tags=a,b` intersection filtering with audit logging); 500MB attachment ceiling + 1000MB grotto quota; SSH dual-key architecture with clean PEM unmasking + terminal ergonomics. 20 test files, 248 tests passing (1 skipped). Release protocol: Build-sweep +1 (P21–P24 → Builds 25–28 incl. anchor hrefs), tag → push → GitHub Release mirror verified.
3. **2026-09-19 — Documentation-to-Code Parity Alignment (Phase 20 500MB sub-task)**: Full corpus walk resolved 12 contradictions: 8 obsolete "10 MB" refs → 500MB BLOB reality, missing `GET /api/attachments/:id/file` added to README API table, ARCHITECTURE unfrozen v0.0.1.9→v0.0.2.1, rate-limiter conflation fixed, blueprint-schema synced (0001–0006), nginx body hint → 60M. 20 suites / 248 tests + docs:build green.
4. **2026-09-18 — Release v0.0.2.1 "The Deep Storage Molt" SHIPPED (Phase 19, Build 22)**: BLOB migration (0005 + idempotent backfill), Busboy streaming, 50MB/500MB limits, Eye-beside-Copy folded from P22/T44.
5. **2026-09-18 — Release protocol executed** (v0.0.2.0): ROADMAP-HISTORY (P15), Completed Releases receipts (`6f9b00d`/`61336a1`), build labels swept +1 (P19–P24 → 22–27 incl. anchors), spine Stage 19 → SHIPPED.
6. **2026-09-17 — README TOTP-style reorg** (`96e6047`): 17-bullet wall → 4 grouped sub-headings, merged encryption sections, 3 callouts → 1 CAUTION; 16/16 anchors resolve.
7. **2026-09-17 — Mermaid rendering fixed** (`ccdfd55`): `vitepress-plugin-mermaid` + `withMermaid()`; lesson: an audit has one blind spot per unexamined class.
8. **2026-09-16 — Long-Term Memory Bank initialized** (`0a2c16c`/`bb9b95c`): `long-term/{patterns,decisions,learnings,constraints}.md` + `auditPerspective.md`. Territory split: `.clinerules/` = Cline; `.agents/` = Antigravity.
9. **2026-09-16 — `/learn` proposal applied** (`2df6d63`): docs-hygiene §5, ClawKey canon, env hazards, build-label sweep.
10. **2026-09-16 — Bidirectional docs↔code audit**: 8 docs-lies corrected (PRAGMA rekey, limiter 10/15m, identity file shape, phantom customFields.ts, tlsManager.ts, crypto exports, canMove, `<table>_custom:{id}` AAD).

## Active Decisions & Considerations

- **Docs bow to code** (ratified): contradicting docs are the defect; the application works and is secure.
- **Honest PATCH over milestone theft**: doc-only/architecture sessions ship as PATCH; MINOR versions reserved for real feature phases.
- **2-Task Pairing Law + 📚 Documentation Impact** as definition-of-done for every phase.
- **Phase 21 — per-record `safeParse` over middleware `validateBody`**: `validateBody` rejects the whole payload with 400 on first failure, which is incompatible with 207 partial success. The container schema validates array bounds (`1..1000`) only; each record goes through `VaultSchemas.bulkImportItem.safeParse()` inside the route so failures aggregate into `errors[{index, reason}]` while valid records persist. Deliberate — do not "fix" back to a fully-typed array schema.
- **Phase 21 — bulk routes MUST register above the `:id` family**: `DELETE /api/vault/bulk` was shadowed by `router.delete('/:id')` (matched `id="bulk"` → 404). Bulk routes now sit above `/:id`; keep this ordering invariant for any future literal-path routes.
- **Phase 21 — bulk delete verb**: `DELETE /api/vault/bulk` (not POST), gated `requirePermission('canDelete')` per the locked verb→permission map.
- **Phase 21 — scoped 10MB parser**: `app.use('/api/vault/bulk-import', express.json({ limit: '10mb' }))` mounted before the 1MB global parser; supports up to 1000 items with custom fields.
- **Phase 20 attachment ceiling escalation**: 50MB → 500MB file ceiling, 500MB → 1000MB grotto quota (env-tunable, 413 fail-closed, Busboy mid-stream abort).
- **SSH dual-key architecture**: `parseSshKeySecret`/`serializeSshKeySecret` envelope with backward compat for legacy raw PEMs; strict RFC 7468 PKCS#8 framing prevents JSON unmasking leaks.
- **PodUtils color unification**: shared `hashStringToColor` engine for pods AND tags; Node test-env-safe (`typeof localStorage === 'undefined'` guards).
- Phase 23 (attachment parent enforcement) is where standalone attachments are removed — NOT Phase 19/20/21.

## Next Steps & Pending Items

1. **Merge + release Phase 21**: merge `feature/phase-21-bulk-operations-11309179680338905330` → `main`; cut **v0.0.2.3 (Build 25)** per the release protocol (version bump, RELEASE doc roll, Build-sweep +1: P22–P24 → Builds 26–28 **incl. anchor hrefs**, tag → push → mirror verify). ROADMAP Tasks 41/42 already checked `[x]`; frontmatter `current_position` + `last_updated` still need the post-release sweep.
2. **Phase 22 (Reef Polish Pass — Unified Search)**: one search surface (client-side, zero-knowledge over decrypted corpus matching titles/keywords/attachment names/note contents/custom fields); remove header + sidebar search; verify Eye-beside-Copy ergonomics (folded into P19/T38 — verify-only).
3. **Phase 23**: Attachment parent enforcement (reject standalone attachments, orphan quarantine); notes reject password payloads; type-truthful dashboard.
4. **Phase 24**: WebCrypto fallback vector parity (unskip test), mechanized constant-time sweep in CI, claim battery gate script, threat-model addendum.
5. **Governance note**: `.agents/memory-bank/` is Antigravity's territory (it absorbed the Phase 21 state this cycle). `.jules/JULES.md` is a new third agent identity — committed this cycle; `.clinerules/memory-bank/` remains Cline's only bank.
