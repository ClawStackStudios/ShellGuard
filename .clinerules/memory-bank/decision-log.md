# Decision Log — ShellGuard

*Episodic memory: how I moved through the codebase. Semantic truth lives in the Memory Bank; walls, detours, and instincts live here. Sliding window: 20 entries.*

---
## 2026-09-20 — fourteen findings in one suite, and why the review was worth it

The Phase 21 sub-phase arrived as a large, confident, gate-green change set: Bitwarden ingestion, a dynamic TOTP engine, password history, multi-URI rows, and a dual export suite. Reviewing it against the code rather than the walkthrough produced fourteen findings across two rounds — and none of them were style. Two plaintext Bitwarden exports sat in the repo root, un-gitignored, with the test suite resolving them from `process.cwd()` (so the oracle was unreproducible from a clean clone and one `git add .` from publishing credential-shaped data). `uris` was sent raw on all three write paths while the semantically identical `url` was Layer 2 encrypted. HKDF — a key-expansion function with no work factor — was serving as the passphrase KDF. A `Math.random()` fallback guarded the GCM nonce. The down migration dropped user columns outright. The lesson is not that the work was careless; it is that **a suite this wide has more seams than its author can see**, and the seams are where the invariants live.

## 2026-09-20 — the commit that swept another agent's home

`a72ce7d` is titled *"feat(agents): formalize home-directory boundaries for Antigravity"* and contains 70 files: Antigravity's rules, **18 `.clinerules/` files of mine**, the entire Phase 21 sub-phase source, 14 documentation surfaces, and two config files. The walkthrough reported "zero `.clinerules/` files staged or touched" — the grep says 18. The systemic cause was in my own house: `.clinerules/workflows/finish-task.md` instructs `git add .`, which sweeps every in-flight file, including other agents' uncommitted work. I had just written the rule about committing work you did not author, and the workflow I own told an agent to violate it. Fix the workflow, not just the commit.

## 2026-09-20 — dual-path crypto is a contract, not an implementation detail

`deriveKeyForEnvelope` picks native `crypto.subtle.deriveBits` on secure origins and pure-TS `pbkdf2Sha256` on plain-HTTP LAN — a reasonable design that makes the two implementations a **portability contract**. The pure-TS branch is executed by no test (the export suite runs in Node, where `subtle` exists) and has no known-answer vector, so a one-byte divergence would produce backups that seal on HTTPS and refuse to open on the LAN. Every gate stays green; only a real user's disaster-recovery attempt fails. Any time a cipher primitive has two implementations selected by environment, the parity assertion *is* the test — not a nice-to-have alongside it.


## 2026-09-20 — the route that compiled but never ran

Jules' first cut registered `router.delete('/bulk')` *after* `router.delete('/:id')`. Express matches in order, so `/api/vault/bulk` bound `id="bulk"`, queried a pearl named "bulk", and 404'd — the entire bulk-delete feature was dead on arrival while every gate stayed green, because no test exercised the literal path. The fix is one block-move (bulk routes above the `:id` family). The lesson is not "read your routes" but "a route with no integration test is a hypothesis": the witness suite is what made the shadow visible, and it only exists because the review demanded a test file rather than a description.

## 2026-09-20 — validateBody is the wrong shape for partial failure

The roadmap said "per-record validation, invalid items skipped, 207 Multi-Status" — which is structurally impossible with a middleware schema gate, since `validateBody` 400s the whole payload on the first bad field. Resolution: middleware validates only the *container* (`items: 1..1000`), and the route calls `VaultSchemas.bulkImportItem.safeParse()` per record, accumulating `{index, reason}` while valid rows persist in one transaction. The outer schema therefore reads `z.array(z.any())` — which looks like a hole and is actually the mechanism. Recorded in `techContext`/`systemPatterns` precisely so a future reader doesn't "tighten" it back into an all-or-nothing 400.

## 2026-09-20 — reviewing a PR from the working tree

I reviewed the first PR and reported five blockers; Jules fixed all five — but left them **uncommitted**. `HEAD` still held the broken commit, so the PR as pushed would have shipped the route-shadowing P0 and the missing test. Nothing in a file-by-file read reveals that gap; only `git status --porcelain` (dirty), `git log origin/main..HEAD` (one commit), and `git show HEAD:<file>` (old content) expose it. Durable rule: verify the *commit*, not the checkout. A review that reads disk is reviewing an intention.

## 2026-09-20 — the agent contract that lied in four places

`skills/shellguard/SKILL.md` — the agent-facing contract — documented `200 OK` (code returns 201), `inserted` as a number (code returns an array of IDs), error entries `{index, id, title, reason}` (code returns `{index, reason}`), and `secret` as a nested object (schema requires a string). An agent built against it would have checked the wrong status, mis-typed the payload, and never seen `errors[]`. Fixed this cycle. The pattern generalizes: the closer a doc sits to an external consumer, the more expensive its drift — and the claim battery (grep the enforcing code first) catches all four in one pass.



## 2026-09-19 — Phase 20 release & 3-version sliding window

v0.0.2.2 (Build 24, "The Bioluminescent Reef") tagged and pushed to origin/main. ROADMAP rolled to the 3-version sliding window holding completed Phases 18, 19, and 20; Phase 17 retired into `ROADMAP-HISTORY.md`. Verified the dynamic package version resolver (`src/server/utils/version.ts`) ensures 0.0.2.2 passes tests cleanly with zero assertion drift — the `tests/unit/version.test.ts` de-hardcode catch from this release prevents future literal-version failures.

## 2026-09-19 — SSH key JSON leak remediation & terminal ergonomics

Generating in-browser SSH keypairs and unmasking them revealed a stringified `{publicKey, privateKey}` JSON payload instead of pure PKCS#8 PEM. Resolved via a dual-key serialization layer (`parseSshKeySecret`/`serializeSshKeySecret` with backward compatibility for legacy raw PEMs), clean multi-line monospace code block display, standard RFC 7468 delimiters, direct `.pem` download, and one-click `authorized_keys` shell command copy. The key lesson: always inspect the raw secret string at the unmask boundary — a JSON envelope that looks like "a key" is actually two keys concatenated.

## 2026-09-19 — PodUtils color unification & Node test env safety

Unified Pod and Tag color mechanics into a shared deterministic color engine in `src/lib/podUtils.ts` (`hashStringToColor` with explicit user overrides). Discovered that Node test environments crash on unguarded `localStorage` accesses — added defensive `typeof localStorage === "undefined"` checks so client color utilities remain completely headless-safe. This is the same class of issue that required the `vi.hoisted()` DATA_DIR/PORT pattern.

## 2026-09-19 — docs bow to code: Phase 19 ripple alignment & Phase 20 500MB sub-task

Walked the complete codebase and documentation surface to audit production readiness. Found and resolved 12 contradictions: purged 8 obsolete "10 MB" base64 references in favor of the active 500MB Busboy streaming BLOB reality, unfroze ARCHITECTURE.md to v0.0.2.1 (added migration 0005, middleware/utils, 20 test suites, Deltas #21 & #22), fixed conflated auth limiter numbers in architecture docs (10/15m, not 100/15m), and added the 500MB attachment ceiling sub-task to Phase 20 in ROADMAP.md and meta-prompt-ai-studio.md. A doc pass that only touches the files in a phase's Documentation Impact line has a blind spot exactly the size of the files it did not list.

---

## 2026-09-18 — the openBlob() gap and the contract the docs forgot
better-sqlite3 exposes no incremental BLOB I/O, so "streaming uploads" is honest only if stated precisely: the write path peaks at the ciphertext size (hard-capped mid-stream by Busboy), the read path is the memory-critical one and is fully chunked (substr). Documented verbatim rather than inflated. Separately, the full-corpus sweep Lucas requested caught skills/shellguard/SKILL.md — the agent-facing API contract — still teaching the dead base64/JSON wire. A doc pass that only touches the files listed in the phase's Documentation Impact line has a blind spot exactly the size of the files it did not list; sweep by claim, not by checklist.


## 2026-09-18 — ergonomics pulled forward
The Eye-beside-Copy control-ergonomics item (P22/T44) was folded into Phase 19 Task 38 by Lucas — ship the UX the eye already wants at the next molt instead of waiting two phases; P22 becomes verify-only. Also learned: the attachment-removal tightening is P23, not next — confirm which phase owns a behavior before folding new work into it.

## 2026-09-16 — the third link class
Session closed with a full handoff (handoff-packages/2026-09-16-auditable-corpus.md). The arc: chronology restored, canon sealed, 8 docs-lies corrected, v0.0.1.10 shipped, Phase 24 queued, the lens sealed as auditPerspective.md, the long-term bank initialized, and the memory-bank territory split (.clinerules mine; .agents Antigravity's). The next session inherits a corpus that audits itself.


The VitePress content cards 404ed on the live site while header/sidebar worked. My docs link battery had crawled config links and markdown-style links — but never raw HTML `href=` attributes inside custom components. The defect lived exactly in the unexamined class: 33 targets, zero dead files, all emitted root-absolute without the `/ShellGuard/` base. Lesson: a link audit that checks N link classes has N blind spots; enumerate the emitter, not the syntax. Long-term bank initialized the same day (4 files) and the memory-bank territory constraint recorded (.clinerules = Cline's; .agents = Antigravity's).

---

## 2026-09-16 — first governance release (v0.0.1.10)
Lucas chose the honest PATCH (v0.0.1.10/Build 19) over consuming Phase 18's reserved v0.0.2.0 milestone for a docs-only release — label-inflation prevention in action; queue Build labels swept +1 (including spine anchor hrefs) so no two releases share a build. 34 commits of documentation-governance work shipped as a release. The version was decided by asking, per the semantic-versioning rule, not by guessing.

## 2026-09-16 — the cryptographer's lens formalized
The auditor-confidence conversation (would a 30-year cryptologist be satisfied?) surfaced three gaps — the skipped webCryptoFallback test, the unmechanized constant-time claim, the undocumented limiter/LRU/redaction semantics. Lucas chose to formalize them as Phase 24 (queue tail, provisional v0.0.2.6) instead of leaving them as open observations, and the lens itself entered the bank as declarative truth (projectBrief standard + systemPatterns invariants). The corpus started being built for an audience we could not name. Also: the queue crawl embedded Documentation Impact lines into every queued phase (18-24) — docs-hygiene now rides in the schedule itself.

## 2026-09-16 — docs bow to code (governance ruling)
The bidirectional audit (L1–L8) found docs contradicting shipped, verified, secure behavior. Lucas ruled: **docs bow to code** — the application works, so stale prose is the defect, never an excuse to retune a limiter or drop a permission flag. Verify against enforcing code first; only then assert the doc.

## 2026-09-16 — test oracle beats literal grep
No code contained the documented custom-field AAD pattern `${table}:${recordId}:custom_fields`. Lesson: when a crypto claim has zero literal code hits, don't conclude "wrong docs or wrong code" — go read the **test fixtures** (`tests/unit/customFields.test.ts`) which revealed the truth (`<table>_custom:{id}`). Tests are the oracle for behavioral details.

## 2026-09-16 — truncate-before-read data loss
Wrote `open(rl,'w').write(entry + open(rl).read())` — Python opens `'w'` (truncating) *before* evaluating the read, destroying ~488 lines of reflection history. Git recovered it (`a640e09`), but the pattern is banned: **read first into a variable, then write.** Also learned the commit stat is the tripwire — `488 deletions` in a "log entry" commit is an alarm.

## 2026-09-16 — identity-file shape ≠ redaction lists
The auditLogger redacts a `humanKey` *detail key*, which tempted a wrong inference about the identity-file schema. Truth lives in the producer (`crypto.ts:63-80`): filename is per-username (`shellguard_identity_<username>.json`), shape is `{username, displayName, uuid, token, createdAt}`. Never infer data shapes from redaction lists.

