# Active Context — ShellGuard

## Current Work Focus

**v0.0.2.0 "The Composite Reef" SHIPPED (2026-09-18)** — Phase 18 (Tasks 35/36, Build 20) released: tag `v0.0.2.0` → merge `5fd459e`, Release Pipeline/Docker/docs all green, release body mirrors `RELEASE-v0.0.2.0.md`. House canon: **ClawKey / ShellCryption / LobsterKeys** (internals `deriveShellKey`/`shellKey`/`ShellKeyFallback` are cross-project contracts — NEVER rename). **NEXT TASK: Phase 19 — Attachment SQLite BLOB Migration & Streaming Architecture** (Tasks 37/38, v0.0.2.1 / **Build 22**; Stage 20 paste-block ready, green-light required). Phase 19 now includes the **Eye-beside-Copy ergonomics fold-in** (from P22/T44, Lucas 2026-09-18): Unmask toggle immediately LEFT of Copy on every masked field row (password, SSH private key, hidden custom fields), full-value mask invariant. The lens lives in `long-term/auditPerspective.md`; constraints in `long-term/constraints.md` (`.clinerules` is Cline's territory; `.agents/` is Antigravity's — no writes).

## Recent Changes (sliding window — 10)

1. **2026-09-18 — v0.0.2.0 "The Composite Reef" SHIPPED (Phase 18, Build 20)**: in-browser SSH keypair engine (`src/lib/keyGen.ts` — ssh-keygen cross-verified byte-identical for Ed25519 + RSA-4096; SSH mpint keeps the DER leading zero), SSH key input + Generate Keypair panel in ItemFormModal (keys previously had NO form input), public-key row in detail pane, pod-decoupling locked by tests (premise correction: `buildPodTree` already filtered — `podUtils.ts:193`); phantom `SshKeyVaultView.tsx` premise corrected; docs synced (the-grotto, blueprint-schema).
2. **2026-09-18 — Release protocol executed**: P15 → ROADMAP-HISTORY, P18 → Completed Releases (receipts `6f9b00d`/`61336a1`), build labels swept +1 (P19–P24 → Builds 22–27 incl. anchor hrefs), spine Stage 19 → SHIPPED, transcription state 18 phases, NEXT → Phase 19.
3. **2026-09-17 — README TOTP-style reorg** (`96e6047`): 17-bullet wall → 4 grouped sub-headings, duplicate encryption sections merged, 3 stacked callouts → 1 CAUTION, reference blocks collapsed; 16/16 anchors resolve.
4. **2026-09-17 — Mermaid rendering fixed** (`ccdfd55`): `vitepress-plugin-mermaid` + `withMermaid()` (portal had ZERO support); README's unquoted `{success, data}` node label (GitHub parse failure); `tests/unit/mermaidDiagrams.test.ts` (5 tests). Lesson: an audit has one blind spot per unexamined class.
5. **2026-09-16 — Long-Term Memory Bank initialized** (`0a2c16c`/`bb9b95c`): `long-term/{patterns,decisions,learnings,constraints}.md` + `auditPerspective.md` (the sealed 30-year-cryptologist lens). Territory locked: `.clinerules/` is Cline's ONLY memory bank; `.agents/` is Antigravity's.
6. **2026-09-16 — `/learn` proposal applied** (`2df6d63`): docs-hygiene §5 (docs bow to code + claim battery), ClawKey canon + never-rename in lobsterized NEVER-list, editor env hazards, semantic-versioning build-label sweep — mirrored to `.agents/rules/` (true homes).
7. **2026-09-16 — Bidirectional docs↔code audit**: 8 docs-lies corrected (PRAGMA rekey, limiter 10/15m skip-success, identity file `shellguard_identity_<username>.json`, phantom customFields.ts, tlsManager.ts, shipped crypto exports, five masks incl. canMove, `<table>_custom:{id}` AAD); claim battery = grep enforcing code first, assert doc second.
8. **2026-09-16 — docs/ portal truth-sync + canon** (`71c1d7e`/`08e02a6`/`1ba5f19`): blueprint-schema ↔ migration 0004, privacy file names, base62 alphabet, ClawKey with "Human Key" legacy alias, `Card.vue` withBase fix + `tests/unit/docsLinks.test.ts` (all three link classes).
9. **2026-09-15/16 — v0.0.1.10 "The Auditable Corpus" SHIPPED**: chronology reorg (Stage N = Phase N−1, Stage 18.5 interlude), ClawKey canon in docs+UI, 8-lie audit, Decision Log adopted, Phase 24 queued, Documentation Impact embedded in every phase.
10. **2026-09-16 — Phase 24 queued + crawl**: Cryptographic Audit Hardening (Tasks 47/48) at queue tail; 📚 Documentation Impact embedded in every queued phase — the schedule carries docs-hygiene.

## Active Decisions & Considerations

- **Docs bow to code** (ratified): contradicting docs are the defect; the application works and is secure.
- **Honest PATCH over milestone theft**: doc-only/architecture sessions ship as PATCH; MINOR versions are reserved for real feature phases.
- **2-Task Pairing Law + 📚 Documentation Impact** as definition-of-done for every phase.
- Phase 19 note: the roadmap's server-side count-aggregation premise was corrected in Phase 18 (pod counts are client-side; `server.ts` health counts are instance globals) — P19 focuses on BLOB/quota truth.
- Phase 23 (attachment parent enforcement) is where standalone attachments are removed — NOT Phase 19.

## Next Steps & Pending Items

1. Phase 19 green-light → branch `feat/phase19-attachment-blobs` → Stage 20 paste-block.
2. Task 38 includes the ergonomics fold-in (Eye LEFT of Copy on every masked row).
3. Phase 24 (Tasks 47/48) remains the auditor's battery at the queue tail.
