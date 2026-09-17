# 🦞 ShellGuard — Release v0.0.1.10

## *The Auditable Corpus — Chronology Restored, the ClawKey Canon, the Bidirectional Docs↔Code Audit, and Phase 24 Queued*

> ~ **ClawStack Mobile Studios©™** ~

---

## 🚀 The Core Summary

Welcome to **v0.0.1.10** of **ShellGuard** — the release where the corpus itself
became the deliverable. Thirty-four commits, zero runtime-feature changes, and
the most consequential documentation release of the project: **the corpus was
audited against the code that ships, proven wrong in eight places, corrected in
all of them, and permanently bound to the code by a governance law and a queued
verification phase.** The application works and it is secure; this release makes
the corpus third-party auditable by construction.

---

## 🧭 Key Themes

### 1. Chronology Restored (Option C)

The roadmap's forward queue had been leapfrogged by a hands-on polish pass
(Phases 22/23 queued over 18–21), leaving the spine, the roadmap, and the memory
bank pointing at three different "next tasks." Lucas ruled the original queue
order stands. The meta-prompt spine was reorganized to the TOTP gold standard:
**`Stage N = Phase N−1` invariant restored across the whole file** (the unphased
hotfix lives at the decimal slot **Stage 18.5**), four new queued stages authored
for Phases 18–21, the mermaid completed, and a dangling Phase-14 anchor plus two
partial anchors repaired — **26/26 roadmap links resolve** by GitHub-faithful
slug. The ROADMAP itself was reorganized top-down chronological: YAML frontmatter
with `current_position`, the hotfix record moved out of the forward queue into an
inline 🕸️ Post-Hoc Interlude, Completed Releases reordered ascending
15→16→17 with truthful checkboxes, and the archive span corrected to
Phases 1–14.

### 2. The ClawStack Canon — ClawKey / ShellCryption / LobsterKeys

The house dictionary is now written into the architecture: **ClawKey©™** (the
`hu-` identity JSON key — identity and ShellCryption seed in one artifact),
**ShellCryption©™** (the client-side zero-knowledge engine), **LobsterKeys©™**
(the `lb-` agent keys, hash-only ledger since v0.0.1.9). ARCHITECTURE.md gained
**§ The ClawKey Method** — one narrative from setup to retract. The web vault's
user-facing strings now say **ClawKey©™** (14 renames), matching the Android
companion — web and Android finally say the same word. Internal identifiers
(`deriveShellKey`, `shellKey`, `ShellKeyFallback`) are documented as
cross-project contracts, deliberately not renamed.

### 3. The Bidirectional Docs↔Code Audit — 8 Lies Corrected

Every documented invariant was diffed against its enforcing code. Eight docs-lies
found and corrected — the code was right in every case (**docs bow to code**):
rekey is **`PRAGMA rekey`** (not `sqlcipher_export`); `authLimiter` is **10
attempts/15m** default (the 5/10m limiter is the admin plane's); the identity
file is **`shellguard_identity_<username>.json`** with shape `{username,
displayName, uuid, token, createdAt}`; `src/lib/customFields.ts` was a phantom;
`tls.ts` is **`tlsManager.ts`**; the client crypto exports are the shipped names;
there are **five** permission masks (`canMove` is real — seven wizard presets);
and custom-field AAD is **`<table>_custom:{id}`**, proven by the test oracle.

The key alphabet was also corrected in the portal (base62, not hex — the
v0.0.1.9 correction finally reached the user-facing pages), the privacy policy
now names the real database files (`db.sqlite` + `audit.sqlite`), and the
portal's "Database Schema Ground Truth" page matches migration 0004 exactly.

### 4. Phase 24 Queued — Cryptographic Audit Hardening & Third-Party Auditability

The cryptographer's lens is formalized as **Phase 24 (Tasks 47/48, provisional
v0.0.2.6 / Build 26 — Stage 25)** at the queue tail: unskip the WebCrypto
fallback test against real NIST/RFC/SP vectors, mechanize the constant-time
sweep, make the claim battery an executable CI gate, and write the auditor's
threat-model addendum (in-process limiter semantics, LRU eviction, redaction
coverage). **Documentation Impact blockquotes** are embedded in every queued
phase (18–24) — docs-hygiene now rides in the schedule itself.

### 5. The Memory System Grew a Decision Log

The global decision-log rule was adopted: `.clinerules/memory-bank/decision-log.md`
(episodic navigation record, sliding window of 20) now lives alongside the bank,
with 14 backfilled entries from this arc. The lens entered the bank declaratively:
*third-party auditable* is a Core Requirement in `projectBrief.md`, and
`systemPatterns.md` carries the **Auditability Invariants**.

---

## 🔒 Security Posture (unchanged — verified)

No runtime behavior changed in this release. The security model was *verified*
against code: hash-only LobsterKey ledger, constant-time `timingSafeEqual` on
stored hashes, ownership scoping with 404 cross-owner reads, triple-layer
encryption, segregated redacted audit reef. The honest tradeoffs remain
documented (plain-HTTP LAN support, optional-at-boot DB encryption, raw
short-lived `api-` session tokens at rest).

---

## 🧪 Verification

Full pre-release loop on this exact tree: `npm run lint` ✓ · `npm test` ✓
(15 files / 210 passed / 1 skipped — the skipped webCryptoFallback vector test
is Phase 24 Task 47's first deliverable) · `npm run build` ✓ (59.0s) ·
VitePress `docs:build` ✓ (26.0s) · docs claim battery zero red · 34/34 portal
nav links · spine link audit 27/27.


---

## 📜 Commit Ledger (v0.0.1.9 → v0.0.1.10) — 34 commits

```text
06ebeb7 docs(memory-bank): sync bank to the Phase 24 + lens pathway
0860c08 feat: add decision log agent rule and update learn workflow
541d851 docs(memory-bank): the cryptographer's lens enters the bank — Phase 24 receipt
533dee0 docs(genome): spine gains Stage 25 (Phase 24) + Documentation Impact lines on queued stages
06410e6 docs(roadmap): queue Phase 24 — Cryptographic Audit Hardening + Documentation Impact crawl
dd57ee5 docs(memory-bank): create Decision Log — episodic navigation record (global rule adopted)
6f16ac2 docs(memory-bank): sync bank to the bidirectional-audit pathway
164f14d docs(memory-bank): bidirectional audit receipts — 8 lies corrected, docs bow to code
a1afcdc docs(portal): bidirectional audit fixes — identity shape + limiter truth (L2,L3)
744a43c docs(security): bidirectional audit fixes — rekey, limiter counts, identity shape (L1-L3,L8)
e4c336b docs(architecture): bidirectional audit fixes — code is truth (L1,L3-L7)
021272c docs(memory-bank): restore reflection-log history (truncate-before-read self-inflicted)
e5361e2 docs(memory-bank): docs/ portal truth-sync receipts
08e02a6 docs(portal): truth-sync + ClawKey canon — privacy file names, base62 alphabet, HKDF salt
71c1d7e docs(portal): blueprint-schema synced to migration 0004 — hash-only LobsterKey ledger + pod purity
77d4303 docs(memory-bank): sync bank to the chronology+canon pathway
a640e09 docs(memory-bank): root-docs coherence + ClawKey canon receipts
818b38d feat(ui): ClawKey canon in user-facing strings — web says the same word as Android
354d69d docs(security,blueprint,readme,quickstart): v0.0.1.9 truth-sync + ClawKey canon
c7d5ed6 docs(architecture): sync to v0.0.1.9 runtime — ClawKey canon, hash-only ledger, pod purity
44eaebb docs(genome): README stale-claim sweep — 17 phases, v0.0.1.9 shipped, archive span 1-14
c515bed docs(memory-bank): reflect ROADMAP chronology pass — heredoc-emoji + checker lessons
5dd3979 docs(roadmap): reorganize to TOTP chronology — interlude inline, completed ascending, frontmatter
116d1db docs(memory-bank): re-point bank to Phase 18 — Option C queue restored
e08bb1e docs(genome): restore chronological queue — spine renumbered Stage N = Phase N-1
d353b88 docs(memory-bank): session handoff — bank pointed at Phase 22 (Reef Polish Pass)
c86c10a docs(genome): queue Phase 23 — Bitwarden-model item integrity (Tasks 45/46)
d893e32 docs(genome): Phase 22 expanded — unified zero-knowledge search + consolidation
d34749e docs(genome): queue Phase 22 — Reef Polish Pass (Task 43 eye relocation; Task 44 reserved)
0bb61bd merge: vault header flush + version-test integrity (post-v0.0.1.9 hotfix)
3464b18 docs(genome): post-additions — v0.0.1.9 shipped, roadmap molt & Stage 19 hotfix record
07ccd61 fix: flush vault master-detail headers + de-hardcode version test
632d7a3 docs(memory-bank): v0.0.1.9 released — systemic entry across all five bank files
9b5ec31 merge: v0.0.1.9 — application genome, coherence audit, Phase 17 key ledger hardening & CaraBase UI parity
```

---

## 🐳 Deployment (unchanged)

```bash
docker compose up -d --wait
# health: http://<host>:6464/api/health
```

Existing instances upgrade in place — no schema changes in this release
(the last migration remains `0004_key_ledger`). Back up `data/` as usual.
See `QUICKSTART.md` and `docs/deployment/`.

---

## 🔮 Next Molts

**Phase 18 — Unified Bitwarden-Style Item Composition & In-Browser Keypair
Generation (Tasks 35/36, v0.0.2.0 / Build 20)** is next, then Phases 19–23, and
**Phase 24 closes the loop with the auditor's battery.**

*Maintained with cryptographic rigor by ClawStack Studios.*

