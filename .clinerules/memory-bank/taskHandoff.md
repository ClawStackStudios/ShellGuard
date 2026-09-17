# 📦 Task Handoff Package — Post-v0.0.1.10: The Auditable Corpus Session

**Created**: 2026-09-16 (session end — compaction imminent)
**Session Context**: ~90% utilized — NEW SESSION REQUIRED
**Repository state**: `v0.0.1.10` RELEASED & LIVE (tag → merge `5cc96df`, pushed; release body = `RELEASE-v0.0.1.10.md` verified live). `origin/main = 6b78c49` pushed. **`local main = bb9b95c` — 2 UNPUSHED commits** (see Continuity Instructions #1).

---

## Current State

- **The whole docs-governance arc shipped as v0.0.1.10 (Build 19)** — honest PATCH per Lucas's call (no milestone theft; Phase 18 re-pointed to **Build 20 / v0.0.2.0**; queue Build labels swept +1 incl. spine anchor hrefs, battery re-run).
- **Chronology restored (Option C)**: spine `Stage N = Phase N−1` (hotfix at Stage 18.5); queued Stages 19–25 = Phases 18–24; ROADMAP top-down chronological with frontmatter `current_position`; 26/26→27/27 spine links verified.
- **The ClawKey canon is law**: ClawKey (hu- identity JSON key) / ShellCryption (client-side engine) / LobsterKeys (lb- agent keys). ARCHITECTURE § The ClawKey Method; 14 UI strings renamed; internals (`deriveShellKey`, `shellKey`, `ShellKeyFallback`) are contracts — NEVER rename (lobsterized-philosophy NEVER list).
- **Bidirectional docs↔code audit complete: 8 docs-lies corrected, docs bow to code** (PRAGMA rekey, limiter 10/15m skip-success, identity file `shellguard_identity_<username>.json` {username, displayName, uuid, token, createdAt}, phantom customFields.ts, tlsManager.ts, shipped crypto exports, five masks incl. canMove + 7 wizard presets, `<table>_custom:{id}` AAD). Ratified as `docs-hygiene.md` § 5.
- **docs/ portal truth-synced** (blueprint-schema ↔ migration 0004, privacy file names, base62 alphabet, Human Key = legacy alias) + **VitePress base-path defect FIXED** (`Card.vue` withBase; dist emits zero root-absolute hrefs) + **`tests/unit/docsLinks.test.ts`** (5 tests, all three link classes + withBase regression guard). Oracle now **16 files / 215 tests**.
- **Phase 24 QUEUED** (Cryptographic Audit Hardening & Third-Party Auditability, Tasks 47/48, provisional v0.0.2.6/Build 26, Stage 25): vector parity (unskip webCryptoFallback vs NIST/RFC/SP), constant-time sweep, the claim battery as CI gate, auditor's threat-model addendum. **📚 Documentation Impact blockquotes embedded in every queued phase (18–24)** — docs-hygiene rides in the schedule.
- **Long-Term Memory Bank initialized** (global rule): `long-term/{patterns,decisions,learnings,constraints}.md` (weighted entries w/ shaped perspective) + **`long-term/auditPerspective.md`** — the sealed 30-year-cryptologist lens (standing adversarial checklist + usage protocol).
- **Learning proposal: all 4 candidates APPROVED & APPLIED** (docs-hygiene §5 Direction of Truth; lobsterized ClawKey canon + never-rename; editor-large-inserts Environment Hazards; semantic-versioning Build-number sweep).
- **Lucas's brand work merged** (feat/brand-assets-refresh → main `6b78c49`): optimized logo/thumbnail/icon, NEW feature graphic, favicon tune, Web Design Bank rule (`.clinerules/web-ui-dev.md`), AGENTS.md.

## ⚠️ Territory Constraint (NEW — locked by Lucas 2026-09-16)

**`.clinerules/` is Cline's ONLY memory territory. `.agents/` belongs to Antigravity/Gemini — NO writes, no mirrors, no maintenance.** Historical mirrors in git are legacy; leave them. (Recorded in `long-term/constraints.md` w1.)

## Continuity Instructions (immediate steps for the new session)

1. **`git push origin main`** — local main (`bb9b95c`) is 2 commits ahead of origin: `2df6d63` (learning-proposal rules applied) + `bb9b95c` (auditPerspective sealed). Verify with `git ls-remote origin main` (the "Everything up-to-date" trap is real).
2. **Load the bank**: `activeContext.md` → `progress.md` → **`long-term/` (all 5 files incl. auditPerspective)** → `decision-log.md` → the active rules (`docs-hygiene §5`, `semantic-versioning` build sweep, `editor-large-inserts` hazards).
3. **Confirm Phase 18 green-light** with Lucas, then fresh branch `feat/phase18-composite-items` from main. Execute via `project/meta-prompt-ai-studio.md` **Stage 19** paste-block (ready, Build 20).
4. **Per-phase discipline**: the 📚 Documentation Impact line in the ROADMAP phase entry is definition-of-done — sync every listed doc before the verify line.
5. **Environment facts**: `npm` at `/config/Applications/node-v22.23.0-linux-x64/bin` (must be in PATH); heredocs corrupt astral emoji (use `\U` escapes / editor tool) and long/multi-line heredocs get swallowed — `nohup … > /tmp/x.log 2>&1 &` then poll; verify pushes via `ls-remote`; Docker daemon off (record container checks as env-blocked); long oracle ≈130s, docs:build ≈27s, vite build ≈60s.

## Context Preservation

- **Locked decisions** (see `long-term/decisions.md` + `constraints.md` for the why): docs bow to code; Option C queue order; ClawKey canon + contract identifiers; honest-PATCH versioning; zero hardcoded pods; hash-only LobsterKey ledger; quarantine-never-delete; full-value masking; memory-bank territory.
- **The lens**: `long-term/auditPerspective.md` — consult before building/documenting/releasing. Calibrated admission over confident omission.
- **Verification loop**: oracle (16 files/215 tests) + `tsc` (one pre-existing fieldEncryption error — not a gate) + `vite build` + `docs:build` + claim battery + anchor battery + `docsLinks.test.ts`.

## Learning Integration

- Patterns to apply: fail-closed count-asserted swaps; checkers iterate full lines; probes copied from the file, never memory; byte-scan after heredoc writes; per-commit `git add`.
- Phase 24 note: the claim-battery script (Task 48) will mechanize the manual battery — the docsLinks suite is its first slice.

Handoff_Package_Prepared: true