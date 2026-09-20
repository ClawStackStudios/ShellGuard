# Active Context — ShellGuard

## Current Work Focus

**v0.0.2.2 "The Bioluminescent Reef" RELEASED (2026-09-19)** — Phase 20 (Tasks 39/40, Build 24) shipped: vault tagging system via migration `0006_vault_tags` (tags column + owner indices across pearls/notes/ssh_keys, Layer 2 MetadataGuard encryption), `?tags=a,b` intersection filtering with audit logging, `TagSelectorInput` autocomplete chips with color picker, unified bioluminescent color engine in `podUtils.ts` (`hashStringToColor` shared for pods + tags with overrides), collapsible sidebar tag cloud, AND/OR filter bar; attachment ceiling 50MB → **500MB** (`ATTACHMENT_MAX_MB`) and grotto quota 500MB → **1000MB** (`GROTTO_QUOTA_MB`), both 413 fail-closed; SSH dual-key architecture (`parseSshKeySecret`/`serializeSshKeySecret` with backward compat for legacy PEMs), clean PKCS#8 PEM unmasking (no JSON leaks), one-click **Download .pem**, **Copy Public Key**, **Copy `authorized_keys` Command**. Docs alignment pass resolved 12 contradictions (8 obsolete "10MB" refs → 500MB BLOB reality, ARCHITECTURE unfrozen v0.0.1.9→v0.0.2.1, limiter conflation fixed, nginx body hint → 60M). All gates green: 20 test files, 248 tests (1 skipped), `tsc`, `vite build`, `docs:build`. **NEXT: Phase 21 — Bulk Import Endpoint & Batch Operations (v0.0.2.3 / Build 25, Tasks 41/42)** on the queue 21 → 22 → 23 → 24.

## Recent Changes (sliding window — 10)

1. **2026-09-19 — v0.0.2.2 "The Bioluminescent Reef" SHIPPED (Phase 20, Build 24)**: Vault tagging system (migration `0006_vault_tags`, MetadataGuard Layer 2 encryption, `?tags=a,b` intersection filtering with audit logging); 500MB attachment ceiling + 1000MB grotto quota; SSH dual-key architecture with clean PEM unmasking + terminal ergonomics. 20 test files, 248 tests passing (1 skipped). Release protocol: Build-sweep +1 (P21–P24 → Builds 25–28 incl. anchor hrefs), tag → push → GitHub Release mirror verified.
2. **2026-09-19 — Documentation-to-Code Parity Alignment (Phase 20 500MB sub-task)**: Full corpus walk resolved 12 contradictions: 8 obsolete "10 MB" refs → 500MB BLOB reality, missing `GET /api/attachments/:id/file` added to README API table, ARCHITECTURE unfrozen v0.0.1.9→v0.0.2.1, rate-limiter conflation fixed, blueprint-schema synced (0001–0006), nginx body hint → 60M. 20 suites / 248 tests + docs:build green.
3. **2026-09-18 — Release v0.0.2.1 "The Deep Storage Molt" SHIPPED (Phase 19, Build 22)**: BLOB migration (0005 + idempotent backfill), Busboy streaming, 50MB/500MB limits, Eye-beside-Copy folded from P22/T44.
4. **2026-09-18 — Release protocol executed** (v0.0.2.0): ROADMAP-HISTORY (P15), Completed Releases receipts (`6f9b00d`/`61336a1`), build labels swept +1 (P19–P24 → 22–27 incl. anchors), spine Stage 19 → SHIPPED.
5. **2026-09-17 — README TOTP-style reorg** (`96e6047`): 17-bullet wall → 4 grouped sub-headings, merged encryption sections, 3 callouts → 1 CAUTION; 16/16 anchors resolve.
6. **2026-09-17 — Mermaid rendering fixed** (`ccdfd55`): `vitepress-plugin-mermaid` + `withMermaid()`; lesson: an audit has one blind spot per unexamined class.
7. **2026-09-16 — Long-Term Memory Bank initialized** (`0a2c16c`/`bb9b95c`): `long-term/{patterns,decisions,learnings,constraints}.md` + `auditPerspective.md`. Territory split: `.clinerules/` = Cline; `.agents/` = Antigravity.
8. **2026-09-16 — `/learn` proposal applied** (`2df6d63`): docs-hygiene §5, ClawKey canon, env hazards, build-label sweep.
9. **2026-09-16 — Bidirectional docs↔code audit**: 8 docs-lies corrected (PRAGMA rekey, limiter 10/15m, identity file shape, phantom customFields.ts, tlsManager.ts, crypto exports, canMove, `<table>_custom:{id}` AAD).
10. **2026-09-16 — docs/ portal truth-sync + canon**: blueprint-schema ↔ migration 0004, base62, ClawKey + "Human Key" alias, Card.vue fix + docsLinks test.

## Active Decisions & Considerations

- **Docs bow to code** (ratified): contradicting docs are the defect; the application works and is secure.
- **Honest PATCH over milestone theft**: doc-only/architecture sessions ship as PATCH; MINOR versions reserved for real feature phases.
- **2-Task Pairing Law + 📚 Documentation Impact** as definition-of-done for every phase.
- **Phase 20 attachment ceiling escalation**: 50MB → 500MB file ceiling, 500MB → 1000MB grotto quota (env-tunable, 413 fail-closed, Busboy mid-stream abort).
- **SSH dual-key architecture**: `parseSshKeySecret`/`serializeSshKeySecret` envelope with backward compat for legacy raw PEMs; strict RFC 7468 PKCS#8 framing prevents JSON unmasking leaks.
- **PodUtils color unification**: shared `hashStringToColor` engine for pods AND tags; Node test-env-safe (`typeof localStorage === 'undefined'` guards).
- Phase 23 (attachment parent enforcement) is where standalone attachments are removed — NOT Phase 19/20.

## Next Steps & Pending Items

1. **Phase 21**: branch `feat/phase21-bulk-import-batch` → Stage 22 paste-block. Tasks 41/42: transactional `POST /api/vault/bulk-import` with 207 Multi-Status partial-failure reporting, tri-state bulk selection, floating bulk action bar, confirmed batch delete.
2. **Phase 22**: Unified search (client-side, zero-knowledge over decrypted corpus); header/sidebar search removal; verify Eye-beside-Copy ergonomics.
3. **Phase 23**: Attachment parent enforcement (reject standalone attachments, orphan quarantine); notes reject password payloads.
4. **Phase 24**: WebCrypto fallback vector parity (unskip test), mechanized constant-time sweep in CI, claim battery gate script, threat-model addendum.
