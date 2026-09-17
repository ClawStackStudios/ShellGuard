---
Date: 2026-09-16
TaskRef: "docs/ portal truth-sync — schema ground truth, privacy file names, canon, base62"

Learnings:
- The portal had the SAME defect as BLUEPRINT.md (pre-0004 schema) — when a schema change lands, sweep root docs AND docs/ portal in the same pass; they are separate audiences reading the same truth. Add portal files to the migration-impact checklist.
- Two NEW factual catches beyond the planned list: portal still taught '64 hex characters' for hu-/lb- key alphabets (v0.0.1.9 corrected hex->base62 in root docs but not the portal) and glossary claimed an 'admin' permission mask that does not exist (runtime: canRead/canWrite/canEdit/canDelete). Always diff claims against runtime, never against other docs.
- privacy.md said 'cryptographically random salts' — runtime HKDF salt is the user UUID (deterministic). Descriptive-accuracy matters in legal-adjacent pages.
- Terminal heredocs + long builds are unreliable here: background the build (nohup > log) and poll; do not trust PIPESTATUS through the shell integration.
- Docs gate for portal edits: npm run docs:build (vitepress, ~27s) + truth-scan regex battery + dead-link check. All green.

Gates: portal build complete 26.68s; truth scan zero red; 34/34 nav links; Human Key only as documented legacy alias (2 occurrences).
---
---
Date: 2026-09-16
TaskRef: "Root-docs coherence pass — ClawKey canon + v0.0.1.9 truth-sync + UI rename"

Learnings:
- House canon established and written into ARCHITECTURE.md: ClawKey (hu- identity JSON key), ShellCryption (client-side zero-knowledge engine), LobsterKeys (lb- agent keys). The docs previously said ShellKey(TM) for the hu- key — off-canon; now ClawKey everywhere user-facing, with internals (deriveShellKey, shellKey, ShellKeyFallback) documented as cross-project contracts, NOT renamed (they are pinned by shellcryption-spec.md and the companion crypto-spec).
- api- session tokens remain RAW in api_tokens by design (server-minted, TTL-bound) — the admin backup-honesty note refers to them; do not confuse with LobsterKeys (hash-only since v0.0.1.9).
- Count-assert discipline caught a real miss: ImportExportView had 5 ShellKey occurrences, not the 4 in my line dump — fail-closed prevented a partial rename across files.
- Two commits went out under one message when a staged-index surprise hit (4 files swept into the architecture commit) — amended the message immediately (own unpushed commit); lesson: `git add <specific>` immediately before EACH commit, never rely on prior staging.
- Probe-with-backticks bug bit twice in verification (checking literal text without the backtick formatting the file actually uses). Copy probes from the file, not from memory.

Improvements_Identified_For_Consolidation:
- Canon lint is now a standing gate: no ShellKey(TM) in root docs outside receipts/glossary; no api_key column claims anywhere.
- Remaining candidate: QUICKSTART.md Step-1 flow uses 'Generate Identity Key' button label (code) — canon-consistent enough; revisit only if Lucas wants deeper UI copy pass.

Gates: 15 files / 210 tests passed, vite build clean. UI rename = 14 occurrences across 4 components.
---

---
Date: 2026-09-15
TaskRef: "ROADMAP.md chronology reorg — seven-fix pass (Option C alignment)"

Learnings:
- Heredocs mangle non-ASCII emoji in swap new_text: a 🏛️ became 2×U+FFFD on disk. Repair with unicode escapes (\U0001F3DB\uFE0F) and verify byte-level (b'\xef\xbf\xbd' count == 0) after any heredoc write containing emoji. The earlier spine inserts were safe because they went through the editor tool.
- The "seven fixes" list grew by one during execution: the fix LIST is not the fix SET — the archive heading itself repeated the banner's stale span (## 🏛️ Historical Archive (Phases 1 through 13)). Always grep the surrounding context of every claim, not just the line cited in the diagnosis.
- Checker bugs again (3rd and 4th this session): non-greedy finditer truncation, and section headings containing the word "Phases" crashing a naive re.search. Iterate full lines; make phase-extraction skip section titles.
- Two fail-closed saves this pass: the `global s` syntax error (no write), and the over-literal probe (no write). Assert-before-write discipline is now 3-for-3 on preventing partial state.

Improvements_Identified_For_Consolidation:
- Remaining stroke: project/README.md stale-claim sweep (v0.0.1.8 summit refs → v0.0.1.9; "Phases 1–13 archive" → 1–14). Then PR/merge to main.
- Reusable oracle: the verification battery (doc-order walk + checkbox truth + migration set-consistency + U+FFFD byte scan + spine link audit) should be consolidated as a single genome-audit script.

Handoff_Package_Prepared: false
---

---
Date: 2026-09-15
TaskRef: "Genome chronology reorganization — Option C (original queue restored), spine renumbered"

Learnings:
- Lucas ruled Option C: Phases 18–21 execute ahead of 22/23. The ROADMAP's "Next Planned Milestone v0.0.2.0 (Phase 18)" was RIGHT and the memory bank was the stale side — docs-vs-bank contradictions can cut either way; audit both sides before "fixing" either.
- TOTP decimal-interlude pattern (their Stage 12.5) adopted: unphased hotfix = Stage 18.5, restoring the Stage N = Phase N−1 invariant spine-wide with zero anchor breakage for walked stages.
- GitHub slug archaeology: anchors strip periods (v0.0.1.9 → v0019) and punctuation; em-dash/space runs become "--"; PARTIAL anchors never resolve (Phase 22/23 hrefs were partial) — always generate slugs from the full heading text.
- Checker regex gotcha: non-greedy finditer (`^## .*?Stage \d`) truncates matches at the first digit — iterate full lines instead of m.group(0).
- Batch-patch discipline paid off twice: assert-fail-closed prevented a partial write (E4 pattern was missing the ./ prefix), and the corrected re-run was provably safe.

Improvements_Identified_For_Consolidation:
- The genome link-audit script (GitHub-faithful slugger + file/anchor resolution + stage-order assertion) is reusable for the ROADMAP reorg pass and all future genome edits.
- Pending: ROADMAP.md reorg pass (frontmatter, hotfix interlude placement, completed order 15→16→17, archive header 1–14, Phase 5 table-row fix, migration renumber sweep 0006/0007) — then project/README.md stale-claim sweep.

Handoff_Package_Prepared: false
---

---
Date: 2026-09-13
TaskRef: "Session handoff — memory bank pointed at Phase 22; handoff package written"

Handoff_Context:
- Session state: ~85% used — new session required.
- Active work: Phase 22 queued (Tasks 43/44), gated on Lucas's green-light + possible Task 44 fill.
- Pending decisions: Task 44 slot finalization; phase green-light; execution branch.

Learnings_for_Continuity:
- The next session's first moves are encoded in the handoff package: load bank → confirm phase finality → fresh branch → Task 43 → 44 → gates.
- All session learnings already consolidated (full-mask rule, SQLite security-migration skill, batch-patch discipline, release protocol verification) — raw log carries only session-specific deltas.

Handoff_Package_Prepared: true
---
---
Date: 2026-09-13
TaskRef: "Phase 23 queued — Bitwarden-model item integrity (Tasks 45/46)"

Learnings:
- Bitwarden model verified from docs: ciphers are typed (Login/Secure Note/Card/Identity/SSH Key) and attachments are ALWAYS children of a cipher — never standalone items. ShellGuard's deviation: Header.tsx add menu offers "attachment", and uploadAttachmentRecord writes unparented rows (category: "Attachment").
- Enforcement belongs server-side (route guard + zod + migration), UI belongs client-side (menu removal + type-truthful display) — the 2-Task Pairing Law maps naturally: A = integrity engine, B = surface truth.
- Orphan policy: QUARANTINE, never delete — user data is sacred; flag hidden + audit the event.
- Form-contract rule locked by Lucas: a standalone Secure Note may carry attachments but cannot embed password credentials (no secret payload on notes) — enforce in zod schemas, not just UI.
- Bitwarden docs pages 404 on some deep links (vault-items); the attachments page is authoritative for the attachment-is-a-child pattern.
---
---
Date: 2026-09-13
TaskRef: "Phase 22 expanded — unified search + consolidation spec"

Learnings:
- Search-in-a-zero-knowledge-vault design: the decrypted corpus ALREADY exists in client state (App.tsx decrypts pearls/notes/customs/attachments post-fetch), so robust search is pure client-side matching — the spec must pin the negative space: no ?q= params, no server endpoint, purge on lock.
- The sidebar "search" is a pod-TREE filter (podSearch), not an item search — removal changes what the sidebar can do; name the behavioral delta in the spec (pod tree renders unfiltered) so removal is a conscious decision, not an accident.
- Queue-task restructuring is safe pre-execution: renumbering/recombining queued tasks preserves the 2-Task Pairing Law as long as the phase story (A=engine, B=surface) still holds.
---
---
Date: 2026-09-13
TaskRef: "Phase 22 queued — Reef Polish Pass (Task 43 eye relocation; Task 44 reserved)"

Learnings:
- Polish items collected hands-on (Lucas using the UI) queue as their own phase with a work-driven version label; No Forced Targets extends to provisional labels — mark them provisional in the header, decide the digit at release.
- A reserved task slot (Task 44, "pending fill") lets the genome queue a phase before its story is complete — the strict 2-Task Pairing Law holds structurally as long as the reserved slot is explicit and gated (do-not-execute).
- Ground the task description in measured code geometry (line refs, control positions) so the future executor makes zero design decisions — the traversal rule applies to polish phases too.
- Editor-insert steps can consume the blank line before an anchor heading when the inserted text ends with a bare `---` — always end inserts with a trailing blank line and re-verify heading adjacency.
---
---
Date: 2026-09-13
TaskRef: "Genome post-additions — roadmap molt + Stage 19 hotfix record"

Learnings:
- Sliding-window molt sequence: completed phase moves to Completed Releases (receipts filled), oldest completed phase rolls to ROADMAP-HISTORY (+ archive-table row in the root), queue re-heads, versioning policy flips Current/Next. All four moves in one pass.
- Post-summit hotfixes live outside the 2-Task Pairing Law — record them as unphased addendum entries with receipts so the genome stays receipt-honest without breaking the phase grammar.
- The archive TABLE lives in the root ROADMAP (Historical Archive section), not in ROADMAP-HISTORY.md — anchor lookups across these two files burned one assert; check both before scripting.

Successes:
- ROADMAP restructured in one assert-guarded pass; meta-prompt Stage 19 records the header-flush hotfix + the "oracle AFTER the version bump" lesson.
---
---
Date: 2026-09-13
TaskRef: "v0.0.1.9 release execution (New Release Protocol, end-to-end)"

Learnings:
- Read the PREVIOUS TAG's position before writing the commit ledger — v0.0.1.8 pointed at the main merge (66d9ca4), not the last release-era commit, so the honest ledger spans the genome transcription docs too.
- A git push can print "Everything up-to-date" through shell capture while the push did NOT land — always verify remote state with `git ls-remote origin <ref>` after pushing; the explicit re-push then showed 66d9ca4..9b5ec31.
- The tag-push → release.yml → verbatim RELEASE-doc mirror worked exactly as specced: `gh release view` confirmed the body is the RELEASE file byte-for-byte. The hard-fail invariant (doc must exist at the tagged version) was satisfied by tagging the release-prep commit itself.
- Docker daemon absence: record container verification as environment-blocked when the Dockerfile is unchanged and the production build validates the runtime — do not claim a container check that did not run.

Successes:
- Full protocol in order: gates (tsc / 210 tests / build) → doc roll (git mv, one file) → version triple → memory bank → commit → annotated tag on the doc-containing commit → --no-ff merge (9b5ec31) → push + verify → live release with mirrored body.
---
---
Date: 2026-09-13
TaskRef: "Release v0.0.1.9 preparation (New Release Protocol)"

Learnings:
- v0.0.1.8 tag points at the main merge commit (66d9ca4), so the v0.0.1.9 ledger spans 26+ commits including the genome transcription docs — read the tag position before writing the ledger, do not assume the previous release was the last commit.
- Docker daemon is not running in this environment (CLI only) — record the container check as environment-blocked when the Dockerfile is unchanged and the production build validates the runtime.

Successes:
- Release doc rolled via git mv (exactly one RELEASE-v*.md preserved), version triple synced, memory bank slid to 10.
---
---
Date: 2026-09-13
TaskRef: "Phase 17 implementation — key ledger hash + pod purity"

Learnings:
- SQLite DROP COLUMN fails on UNIQUE columns (auto-index) — keyLedger retire must REBUILD the table (create/copy/drop/rename + indexes), then VACUUM outside the transaction: freed pages keep plaintext at byte level until vacuum. Security migrations must think at the BYTE level, not just the schema level.
- Migration runner is SQL-only; crypto backfills belong in a code module called right after runMigrations (same seam as rekey recognition). Order inside the backfill is load-bearing: rewrite api_tokens.owner_uuid (raw key to agent id) BEFORE hashing/dropping, all in one transaction.
- A test that asserts the OLD buggy contract (Personal fallback encryption) must be rewritten in the same phase as the fix — metadata-encryption category test now asserts the uncategorized contract.
- parseAgentKey now uses an explicit allow-list projection — spreading rows leaks new sensitive columns by default. Allow-list projections are the durable pattern.

Difficulties:
- One patch script crashed between writes (agentKeys) leaving auth.ts unpatched — detected only because the integration test failed with "no such column: api_key". Lesson: a crashing patch script can leave PARTIAL state; always re-grep the target pattern set after a script failure.

Successes:
- All three guarantees proven: raw byte-scan shows zero plaintext lb- keys; legacy pre-migration key authenticates after in-place hashing (unit oracle); mint plaintext appears exactly once.
- Gates: tsc clean, 15 files / 210 tests, vite build clean.
---
---
Date: 2026-09-13
TaskRef: "Genome coherence audit — shellcryption-spec oracle, dangling refs, Phase 17 security hotfix queue"

Learnings:
- Traversal-as-audit catches both doc-doc and doc-code contradictions. Found 5: (1) missing shellcryption-spec.md oracle; (2) hex-vs-base62 key alphabet claims in 2 docs (code truth: generateBase62(64) client, crypto.randomInt over 62 chars server — never hex); (3) stale hardened-in-a-later-phase wording; (4) agent_keys stores PLAINTEXT lb- keys while 5 docs claim hashes-only; (5) category Personal fallback in all 4 vault routes + DEFAULT Personal in migration 0001 contradicting the locked zero-default-pods invariant.
- Spec-first resolution: keep the normative spec claim, encode the code fix as the queued phase (Phase 17, Tasks 33/34, migration 0004 key_hash with in-place hashing so live keys survive). Never falsify docs to match broken code.
- Lucas restructured the roadmap mid-session (root ROADMAP.md = sliding window; .agents/memory-bank/ROADMAP-HISTORY.md = Phases 1-13 archive; project/ROADMAP-bk.md deleted). Always re-stat the tree before patching; resolve anchors per phase (1-13 to HISTORY, 14+ to root window).
- Renumber forward queues descending (Task 40-to-42 first) to avoid collisions, then sweep collateral names (migration 0004 collision resolved to 0005/0006).

Difficulties:
- Shell heredocs intermittently swallowed python stdout; resolved by redirecting to /tmp logs. Nested-quote python strings failed twice; line-based editing of the patch script was the robust path.

Successes:
- lint clean (tsc now fully clean), 14 files / 204 tests pass, vite build clean on the merged tree (Lucas's staged restructure + my changes together).
- 50 dangling refs repointed with number-aware regex; mermaid edges kept atomic (node + 2 edges in one pass).

Improvements_Identified_For_Consolidation:
- Pattern: docs-vs-code contradiction found in audit → encode as queued phase; do not paper over.
- Pattern: ShellGuard keys are base62 (A-Z a-z 0-9) via getRandomValues/randomInt modulo-bias-free selection; never document hex.
---
---
Date: 2026-09-05
TaskRef: "Reverse-Build `/project` Genome — ShellGuard (16 phases, summit)"

Session_Summary:
- Built `/project/` genome (16 phases / 32 task pairs / 9 oracles / 2,745 lines, 27 commits on `docs/reverse-project`, HEAD 68d73cd, pending merge to main). Receipt-matched to git via gap-walking; docs and codebase occupy the same commit (66d9ca4 parity).
- Patterns consolidated to `consolidated_learnings.md` → "Documentation Systems": reverse-documentation method, GitHub anchor slug rules (v0001 not v00001; emoji variation-selector hazard), mermaid node/edge atomic maintenance, oracle-file section integrity. Raw details pruned per protocol.

Session-Specific (not consolidated):
- Shell integration intermittently failed to capture heredoc/multi-line command output — use editor-tool reads for verification instead of terminal reads in this environment.
- The draft phase table placed genesis one phase too early; a 13-commit UX cluster (master-detail, zero-hardcoded pods, NavIntent, commits c14121d..8e7c16d) belonged to its own Phase 8. Lesson: boundary-check drafts against actual commit lists before transcribing.
- The anchor-slug bug (v00001 vs v0001) was introduced BY a Phase 1 "fix" and propagated 11 passes — programmatic slug verification is now mandatory from pass 1.

---
Date: 2026-09-03
TaskRef: "Prepare ShellGuard Release v0.0.1.7 & Session Learnings Consolidation"

Learnings:
- Running `git add <file> && git commit` commits the entire staged index, not just the recently added file. A pre-commit check using `git diff --cached --stat` prevents accidentally sweeping in co-author or in-flight staged changes.
- Large boundary code insertions without bounded anchors can clip multi-line interface/JSX tails. Always replace bounded `old_text` anchors, re-read ±15 lines around the insertion point, and run compiler/linter transform checks before committing.
- When committing work that incorporates in-flight user edits, running the project's test and build gates on the merged working tree ensures the collective changes ship 100% green without regressions.
- The Verification Loop layer 3 (`tsc --noEmit` and production build) caught 2 compiler errors that passed unit tests, proving that a passing test oracle does not guarantee compiled correctness.

Difficulties:
- Non-standard Node path in `/config/Applications/node-v22.23.0-linux-x64/bin` required explicit PATH export.
- Multiple debug cycles were incurred from editor insertion clipping before standardizing bounded anchor replacements.

Successes:
- Successfully released v0.0.1.7 with automated Claurst-style `--release` workflow on GitHub Actions.
- Synchronized rules and skills across both `.clinerules/` and `.agents/` roots.
- All 13 test suites / 202 tests passed, with 0 errors on production Vite build.

Improvements_Identified_For_Consolidation:
- Staged-vs-untracked pre-commit check in `git-hygiene.md`.
- In-flight edit verification in `git-hygiene.md`.
- Large editor inserts skill in `.clinerules/skills/` and `.agents/skills/`.

---
Date: 2026-08-28
TaskRef: "Multi-User Frontend Architecture (Bitwarden-style lock, QuickLoginModal, Memory Leaks)"

Learnings:
- The Bitwarden shared-device multi-account pattern keeps all known accounts visible in a dropdown, marking them as Locked or Unlocked, rather than strictly isolating them. The security boundary relies entirely on the Master Password (or ShellKey) requirement to decrypt the vault, rather than hiding the existence of other accounts.
- We implemented a seamless UI pattern for re-authentication by rendering an overlay `QuickLoginModal` directly on top of the locked dashboard, rather than forcefully routing the user to a full-screen landing view. This prevents navigation context loss.
- React `useEffect` event listener cleanup bug: passing `addEventListener` in the return cleanup function instead of `removeEventListener` leads to massive listener leaks, especially for global events like `mousemove` and `scroll` on high-frequency triggers (like inactivity timers).

Difficulties:
- Initial approach tried to implement strict per-session account isolation using a "Primary Account" model and grouping in `localStorage`. This broke the convenience of the account switcher and conflicted with Bitwarden's established UX expectations. Resolved by abandoning strict isolation in favor of explicit lock/unlock states in the UI.
- The React router in `App.tsx` kicked users back to the blank `LandingView` upon logout, making the account switcher invisible. Fixed by maintaining the dashboard `view` but passing an `isLocked` prop to render a secure lock screen inside the vault view instead.

Successes:
- The implementation of individual background-account locking from the dropdown switcher. Because ShellGuard supports multiple unlocked sessions simultaneously in `sessionStorage` (unlike Bitwarden), allowing users to lock inactive accounts granularly is a major privacy win.
- Initial load routing now correctly defaults to the locked dashboard of the first known account if the user has expired sessions but known accounts.

Improvements_Identified_For_Consolidation:
- UX Pattern: "Locked Dashboard" vs "Logged Out Landing". When known accounts exist, default to a locked dashboard overlaying the app to maintain context.
- UX Pattern: Multi-account session management. Supporting multiple simultaneous unlocked sessions allows for powerful micro-interactions like granular background-account locking.
- React Anti-Pattern: Event listener leaks in `useEffect` cleanup. Always double-check `removeEventListener`.

---
Date: 2026-08-28
TaskRef: "SuperLobster Panel (admin plane) + failsafe backups"

Learnings:
- Express mount order gotcha: `app.use('/api/admin', router)` AFTER a later `app.use('/api/admin/auth', limiter)` means the limiter never fires (router matches first, never calls next). Fix: apply the limiter inside the route file, same as auth.ts does.
- `better-sqlite3-multiple-ciphers` exposes `db.backup(dest)` — Online Backup API, WAL-safe, live-consistent. A copy of a SQLCipher DB stays encrypted with the same key (zero extra key management).
- Vaultwarden's admin panel exists because container operators lack shell access; its backup button is an escape hatch. ShellGuard's DB contains PLAINTEXT api_tokens + agent_keys (unlike Vaultwarden's E2E ciphers), so HTTP-mediated backup download = credential exfiltration channel. Backups are server-side writes only; restore is offline (Vaultwarden itself never shipped in-panel restore).
- `lobsters` table PK column is `uuid` (no owner_uuid); all other vault tables use `owner_uuid`.
- `createTestUserWithToken(app)` requires the supertest app argument.

Difficulties:
- Test debugging: rotation test initially used 2026 timestamps that lost to the real backup's 2026-08 timestamp → used future 2027 stamps. Also `lobsters` UUID column mismatch.
- Editor 6k-char limit: wrote admin.test.ts and panel sections in marker-based chunks.

Successes:
- Three-layer verification: 155 tests pass (15 new admin), vite build clean, live smoke (login/401s/users/backup-on-disk/status/audit/whitelist/scuttle:restore validate).
- ADMIN.md canonical threat model doc created.

Improvements_Identified_For_Consolidation:
- Pattern: admin-plane isolation = separate auth mechanism (cookie session, volatile store) + strict-metadata responses + env-owned crypto config.
- Argon2id ADMIN_TOKEN hashing = documented upgrade path (currently SHA-256+constant-time like ClawChives).

---
Date: 2026-08-28
TaskRef: "Password attachments rework (reference model + 10MB cap)"

Learnings:
- vault_pearls.attachments is now a JSON array of vault_secure_attachments IDs; file payloads are ShellCrypted client-side under AAD `vault_secure_attachments:{attachmentId}` and POSTed individually before the pearl is created.
- 10MB raw ≈ 13.3MB base64 + envelope → zod cap set to 14,000,000 chars (was 28,000,000). Live-verified: 400 with validation details.
- Cascade delete in vault.ts DELETE handler parses the JSON defensively (malformed column = no-op) and deletes with owner scope; audit logs each cascaded attachment.
- `createTestUserWithToken(app)` requires the supertest app argument — calling it bare crashes with a confusing "Cannot read properties of undefined (reading 'address')".

Difficulties:
- Editor tool 6000-char limit forced splitting the edit-form UI into two calls with a marker comment — worked cleanly.
- Live smoke server startup takes >4s before health responds; initial curl failed with exit 7 but the log confirmed boot.

Successes:
- Three-layer verification: 140 tests pass (incl. 3 new cascade tests), vite build succeeds, live E2E smoke (register → upload ×2 → link → pearl DELETE → attachments list empty → oversize 400).
- Cross-owner cascade isolation test proves the ownership scoping.

Improvements_Identified_For_Consolidation:
- General pattern: parent-child reference model with ownership-scoped cascade delete (parent stores JSON ID array; child DELETE always `AND owner_uuid = ?`).
- Project: attachment helpers in `src/lib/attachmentUtils.ts`; zod cap 14M chars = 10MB file.

# Raw Reflection Log

---
Date: 2026-08-29
TaskRef: "SuperLobster UI alignment (routing gate fix + CaraBase polish)"

Learnings:
- The v0.3.0 SuperLobster session shipped `SuperLobsterGate` (auth check → login/panel) but App.tsx rendered `SuperLobsterPanel` directly, bypassing the gate — the panel mounted without auth state, appearing blank/bugged at `#/super-lobster` when unauthenticated.
- CaraBase's BouncyBrand uses a hand-rolled rAF spring class (stiffness=400, damping=10, mass=1) with per-letter mouseenter/leave; transforms applied directly to `elRef.current.style` to avoid React re-render per frame. Variants: subtle (y:-3, scale:1.05, damping:30), prominent (y:-12, scale:1.15, damping:12).
- ShellGuard theming: brand split is Shell=lobster-red `#e4048a`, Guard=claw-cyan `#06b6d4`; theme tokens are bg-theme-base/surface, text-theme-main/muted, border-theme-subtle.

Difficulties:
- tsc --noEmit shows 6 pre-existing errors on main (LoginView.tsx pasteUuid/pasteUsername undefined, SetupView.tsx X undefined) — confirmed via git stash baseline. Memory bank only documented the fieldEncryption one. Verified with `git stash && tsc && git stash pop` — my changes add zero new errors; vite build remains the gate and passes.
- First curl after vite boot failed (exit 7) at 6s despite "ready in 2295ms" in log — retry after 5s succeeded. Consistent with previous session's note that live smoke needs patience.

Successes:
- Three-layer verification: 155 tests pass, vite build clean (52.8s), live smoke (HTTP 200 index + module transforms for BouncyBrand.tsx and SuperLobsterLogin.tsx resolve with BouncyBrand import present).

Improvements_Identified_For_Consolidation:
- Pattern: when wiring a new gated view, check the render site against the gate component — shipping both but forgetting to connect them is a silent auth bypass.
- Verification pattern: git-stash baseline tsc diff to prove new errors vs pre-existing.
- Remaining Phase 3 (deferred): apply CaraBase card-grid/dashboard patterns across SuperLobsterPanel sub-sections (Status/Users/Settings/Backups/Audit).

---
Date: 2026-08-29
TaskRef: "SuperLobster CaraBase Design Alignment Phase 3 (Sub-sections Polish)"

Learnings:
- CaraBase dashboard alignment across admin sub-sections brings high visual cohesion:
  - Container (`SuperLobsterPanel.tsx`): BouncyBrand header integration, live status indicators ("Reef Online"), and pill-style navigation tabs with Framer Motion section transitions.
  - Status (`SuperLobsterStatus.tsx`): 3-card hero metric grid (Instance Engine, Triple-Layer Armor, Retention), ambient defense-in-depth warning callout, and live uptime timeline.
  - Users (`SuperLobsterUsers.tsx`): 6-metric summary ribbon (Lobsters, Pearls, Notes, Keys, Files, Agent Keys), search toolbar with instant match counts, avatar badge glass table, and strict cascade delete modal.
  - Settings (`SuperLobsterSettings.tsx`): Env-locked crypto keys notice, grouped configuration cards with preset quick-chips, and animated save toast.
  - Backups (`SuperLobsterBackups.tsx`): Hero backup switch card, offline recovery CLI protocol card (`scuttle:restore`), and backup manifest ledger.
  - Audit (`SuperLobsterAudit.tsx`): Filter chips (All, Admin, Auth, Mutations, Failures), color-coded event badges, and sovereign `SUPERLOBSTER` actor pill.

Difficulties:
- Maintaining strict visual alignment across 6 distinct sub-sections while strictly preserving the zero-knowledge security boundary, strict-metadata invariants, and offline restore guarantees.

Successes:
- Three-layer verification passed completely: 15/15 admin tests passed, all 155 full suite tests passed, and Vite production bundle built cleanly in 53.25s.

Improvements_Identified_For_Consolidation:
- UX Pattern: Metric ribbon + Filter chips on data-dense tables (e.g. Users and Audit Reef) significantly elevates scannability without cluttering layout.
- UX Pattern: Preset quick-chips on number inputs (e.g. retention days, backup intervals) reduce cognitive load for administrators.

> Detailed, timestamped, task-referenced entries. Candidates for consolidation into `consolidated_learnings.md`. Prune after consolidation.
---
Date: 2026-08-29
TaskRef: "Fix PodModal build error and enforce verification"

Learnings:
- Discovered that `npm` is located in `/config/Applications/node-v22.23.0-linux-x64/bin` and MUST be added to `PATH` explicitly when running build tasks from my environment.
- The `npm run build` command is essential to ensure syntax and build integrity before presenting work to the user.

Difficulties:
- Initial "command not found" error for `npm` led to an incorrect assumption that the environment didn't support building, resulting in a failure to verify the code and a broken build.

Improvements_Identified_For_Consolidation:
- General pattern: ALWAYS find the correct `node`/`npm` executable and run `npm run build` to verify every change. Never assume the environment prevents verification.
- Project Alpha: Include `/config/Applications/node-v22.23.0-linux-x64/bin` in PATH when executing commands.
---
---
Date: 2026-08-29
TaskRef: "Project scan & memory bank update after 3-agent awareness"

Learnings:
- The project is on branch `fix/sidebar-and-pod-management` with 3 commits ahead of `main`:
  1. `6e33694` — Pod management UI, sidebar polish, removed suggested pods from getAllUniquePods
  2. `930375c` — Category normalization via normalizePod, optimistic state updates, skipScuttle pattern, restAdapter generics + PATCH
  3. `2dfa76c` — Zero hardcoded default pods, normalizePod returns "" when empty, FolderInputGroup dynamic adaptation
- Git checkpoint branches exist (`aa62d69`, `3a95c56`) created by previous agent sessions.
- The `.agents/memory-bank/` directory contains the most up-to-date project knowledge from Gemini's perspective.
- My `.clinerules/memory-bank/` was stale from 2026-08-29 07:23 and did not reflect Gemini's pod management work.
- There are now 3 agents working on this project — each with their own memory bank.
- `buildPodTree` in `podUtils.ts` and all downstream components now handle uncategorized items with empty string instead of "Personal" fallback.
- `getStoredPodColors()` returns `{}` instead of merging `INITIAL_DEFAULT_COLORS`.
- All vault item decryption in `scuttleVault` changed `p.category || "Personal"` to `p.category || ""`.
- The `npm` executable is at `/config/Applications/node-v22.23.0-linux-x64/bin` — not in default PATH.

Difficulties:
- Initial git commands had shell integration issues; had to redirect output to files and read them separately.
- Had to piece together work from 3 separate commits plus Gemini's memory bank to get the full picture.

Successes:
- Successfully reconstructed all changes from 3 commits by reading full diffs.
- Captured all new patterns (category normalization, optimistic updates, skipScuttle, zero defaults) into consolidated_learnings.
- Updated all memory bank files (activeContext, changelog, progress, consolidated_learnings) to reflect current state.

Improvements_Identified_For_Consolidation:
- Pattern: Category normalization required for ALL pod comparisons.
- Pattern: Optimistic state updates with skipScuttle for batch operations.
- Anti-Pattern: Hardcoded defaults causing phantom pod tree entries.
- Project: npm path must be explicitly added to PATH.
---
Date: 2026-08-29
---
Date: 2026-08-30
TaskRef: "Version bump to 0.0.1.6 (native LAN TLS release)"

Learnings:
- Explicit user version input overrides changelog inference (highest priority per semantic-versioning rule).
- 4th-digit increments (0.0.1.5 → 0.0.1.6) are hotfix/iteration class — RELEASE-vX.Y.Z.md doc is NOT required per version-update workflow (that's for full major/minor); release.yml falls back to auto-generated notes when no RELEASE file exists.
- Version anchors live in exactly 2 files besides CHANGELOG: package.json `"version"` and README.md badge line 22.
- Note: v0.0.1.5 tag confirmed to exist (visible via `git tag`); the earlier session's changelog/package.json bump for 0.0.1.5 was tagged upstream. v0.0.1.6 now continues the sequence.

Improvements_Identified_For_Consolidation:
- Pattern: version-anchor sweep = package.json + README badge + CHANGELOG section header. Nothing else carries the version.
---

TaskRef: "Native LAN TLS — self-signed cert generation (TLS_ENABLED)"

Learnings:
- Node cannot generate X.509 certs natively; `selfsigned` v5 (pure JS, @peculiar/x509 under the hood) ships its own TypeScript types and is async-only in v5. `days` option was replaced by `notAfterDate: Date` in v5.
- EC P-256 (`keyType: 'ec'`) generates dramatically faster than RSA-2048 in pure JS — use it for boot-time frictionless generation.
- `crypto.X509Certificate.validTo/validFrom` are UTC **strings** (YYMMDDHHMMSSZ), not Dates — wrap in `new Date()` before arithmetic.
- selfsigned's `GenerateResult.fingerprint` is SHA-1 (20 bytes); Node's `x509.fingerprint256` is SHA-256 (32 bytes). Never mix them — derive the fingerprint consistently from the PEM on every code path so generated and loaded certs report identically.
- Test isolation gotcha: when a suite's module-under-test transitively imports the DB singleton, afterAll MUST `db.close()` + `auditDb.close()` before `rmSync` — an open SQLite handle recreates WAL/shm files mid-delete and cleanup throws ENOTEMPTY.
- SANs from `os.networkInterfaces()` (non-internal, deduplicated) auto-cover the LAN IP — test run picked up 192.168.1.40 without any config.
- Helmet HSTS: passing `undefined` falls through to helmet's default (enabled); `false` disables. Enable when TLS terminates in-process OR ENFORCE_HTTPS=true behind a proxy.

Difficulties:
- Terminal shell integration degraded mid-session (commands stopped reporting completion even for `echo`), blocking the live TLS smoke test and the git commit. Test suite + build verification had already completed successfully beforehand.

Successes:
- 8/8 new TLS tests pass, including a real HTTPS handshake over a real socket with the generated materials.
- Full suite: 12 files, 180 passed, 0 failed — including the previously-flaky webCryptoFallback suite.
- Production build clean.

Improvements_Identified_For_Consolidation:
- Pattern: TLS lifecycle (generate → persist 0o600 → reuse → BYO override) mirrors the DB connection's encrypt-existing-database pattern.
- pending: live smoke of `TLS_ENABLED=true` server boot + curl -k health probe + commit on feat/lan-tls-self-signed.
---

Learnings:
- `window.crypto.randomUUID` is undefined on HTTP origins — built a multi-tier fallback chain: `crypto.randomUUID` → `crypto.getRandomValues` UUID v4 → `Math.random` UUID v4 (last resort).
- Same for secure entropy: `crypto.getRandomValues` may be undefined on HTTP — fallback to `Math.random` based rejection sampling.
- Chromium blocks `data:` URI downloads on insecure connections — replaced with `Blob` + `URL.createObjectURL`.

---
Date: 2026-08-29
TaskRef: "v0.0.1.3 release — Iconography, docs hygiene"

Learnings:
- Official shellguard-icon.svg now lives at `public/favicon.svg` — the root favicon for the project.
- Unraid Community Applications template uses an Icon URL field pointing to the raw GitHub icon asset.
- Legacy migration warnings and breaking-change docs accumulate quickly — docs hygiene needs to be part of the release checklist.

---
Date: 2026-08-29
TaskRef: "v0.0.1.4 release — WebCrypto fallback engine, drag-drop shield, TOTP Blob downloads"

Learnings:
- `window.crypto.subtle` is undefined on plain HTTP browser origins (LAN IPs like Unraid) — browsers restrict WebCrypto API to secure contexts (HTTPS/localhost).
- Built pure TypeScript fallback implementations of SHA-256, HMAC-SHA256, HKDF, and AES-GCM-256 in `src/lib/webCryptoFallback.ts`. No dependencies — uses BigInt for bit ops, TextEncoder for encoding.
- The `crypto.subtle` API returns ArrayBuffers; the fallback returns Uint8Arrays. The ShellCryption layer and crypto.ts callers needed to handle this transparently — wrapping the fallback to match the async interface of the real `crypto.subtle`.
- `data:` URI downloads are blocked on Chromium insecure connections — must use `Blob` + `URL.createObjectURL(blob)` instead.
- Global drag-and-drop shield must be attached with `{capture: true}` to ensure it fires before child handlers.

Difficulties:
- The `crypto.subtle` stubbing approach in vitest for testing the fallback path is tricky — `window.crypto` is read-only in some environments, and vitest's jsdom may not properly simulate HTTP origins.

Successes:
- All three v0.0.1.x releases shipped clean on git tags.

---
Date: 2026-08-29
TaskRef: "Bitwarden-Style Custom Fields (Text, Hidden, Checkbox, Linked)"

Learnings:
- Custom fields follow the existing ShellCryption pattern: serialize to JSON on the client, encrypt via `encryptField()`, store as opaque blob in DB column, decrypt via `decryptField()` on read.
- AAD namespaces must be distinct per item type: `vault_pearls_custom`, `vault_secure_notes_custom`, `vault_ssh_keys_custom` — prevents envelope shuffling between tables.
- Migration 0003 uses `ALTER TABLE ADD COLUMN custom_fields TEXT DEFAULT ''` for 3 tables. SQLite doesn't support DROP COLUMN in a practical way, so the down migration is a no-op (same pattern as 0002).
- Custom fields are NOT registered in `metadataGuard.ts` — the whole blob is already client-encrypted via ShellCryption. Registering it would cause double-encryption with `DB_ENCRYPTION_KEY`.
- `CustomFieldLinkedProperty` resolves to item properties via a switch statement: `username`, `password` (item.secret), `url`, `notes`, `totp`. TOTP-linked fields use the `TotpDisplay` component for live 6-digit codes.
- Checkbox values use `"true"` / `"false"` strings — simple, JSON-serializable.
- The `CustomField.value` field is always a string. Booleans serialize as `"true"`/`"false"`.
- ItemFormModal: custom fields are parsed from `initialItem.custom_fields` (decrypted JSON string → `CustomField[]`), edited as state, serialized back to JSON on save.
- ItemDetailPane: custom fields are parsed and rendered per type, with copy buttons for text/hidden/linked, and an individual eye-toggle for hidden fields.
- `revealedHiddenFields: Set<string>` tracks per-field visibility for hidden custom fields.
- Import/Export: JSON export (`items: items`) automatically includes custom_fields since they're on VaultItem. CSV excludes them (metadata-only). Import through `lockTheClaw` encrypts them transparently.
- Pod rename/delete operations pass `custom_fields: item.custom_fields` through `updateTheClaw` to avoid data loss during category reassignment.

Difficulties:
- The lockTheClaw and updateTheClaw handlers had to be updated in 3 code paths (notes, keys, pearls) for both create and update — missing any one would silently drop custom_fields on that item type.
- handleRenamePod and handleDeletePod also needed custom_fields passed through — they reconstruct items from vaultItems state and call updateTheClaw.

Successes:
- All 167 existing tests still pass (no regressions).
- Build compiles cleanly (2173 modules).
- Implementation handles all 4 field types across all 3 vault item types.
- Custom fields round-trip correctly through the full ShellCryption lifecycle.

Improvements_Identified_For_Consolidation:
- Pattern: Adding optional string fields to vault items follows a consistent pattern: types → Zod schemas → migration → routes → client encrypt/decrypt → UI.
- Pattern: AAD namespace uniqueness per-table-per-field prevents envelope shuffling.
---
Improvements_Identified_For_Consolidation:
- Pattern: Pure TypeScript crypto fallback for HTTP origins
- Pattern: Blob download over data: URI for insecure contexts
- Pattern: Multi-tier UUID fallback chain
---
---

---
Date: 2026-09-03
TaskRef: "Release v0.0.1.7 — sgtotp.bak compatibility layer + landing header fix"

Learnings:
- Release protocol ran end-to-end cleanly: lint (tsc --noEmit, pre-existing fieldEncryption.ts error now resolved), 13/13 suites (202 passed / 1 skipped), vite build ✓
- release.yml hard-gate worked as designed: tag v0.0.1.7 pushed → Release Pipeline ✓ → doc mirrored verbatim to GitHub release body
- Docker publish workflow triggers on the same tag push (separate from Release Pipeline)

Successes:
- Working tree was already release-synced (Lucas rolled RELEASE doc + versions pre-merge); protocol reduced to verify → tag → push → confirm mirror

Improvements_Identified_For_Consolidation:
- Pre-release: confirm "exactly one RELEASE-vX.md" + version triple (package.json/README badge/CHANGELOG) before tagging — caught here in one pass
