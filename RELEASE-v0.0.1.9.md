# 🦞 ShellGuard — Release v0.0.1.9

## *The Application Genome — Reverse-Built `/project` System, Documentation Coherence Audit, and the Key Ledger Hardening (Phase 17)*

```text
███████╗██╗   ██╗███████╗██╗     ██╗              ██████╗   ██╗   ██╗   █████╗    ██████╗     ██████╗
██╔════╝██║   ██║██╔════╝██║     ██║              ██╔═══╝   ██║   ██║  ██╔══██╗  ██╔══██╗    ██╔══██╗
███████╗███████║█████╗   ██║     ██║              ██║ ███╗  ██║   ██║  ███████║  ██████╔╝    ██║   ██║
╚════██║██╔══██║██╔══╝   ██║     ██║              ██║   ██║  ██║   ██║  ██╔══██║  ██╔══██╗    ██║   ██║
███████║██║   ██║███████╗███████╗███████╗  ╚██████╔╝╚██████╝  ██║   ██║  ██║   ██║   ██████╔╝
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═════╝   ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═╝   ╚═════╝
                                                  ~ **ClawStack Mobile Studios©™** ~
```

---

## 🚀 The Core Summary

Welcome to **v0.0.1.9** of **ShellGuard**! This release ships the application's
**genome**: a reverse-built `/project` document-compiler system (meta-prompt
spine, receipt-backed roadmap, 10 spec oracles) from which the exact application
can be rebuilt from nothing. It closes the **documentation coherence audit** —
every dangling reference resolved, every docs-vs-runtime contradiction either
fixed or encoded as a queued phase — and lands **Phase 17: Key Ledger Hardening
& Pod Purity**, the release's security milestone: `lb-` Lobster Keys are now
stored as SHA-256 hashes only, and the server's hardcoded "Personal" pod is
gone. The Lobster Keys card UI is brought to 1:1 parity with CaraBase, with
full-value masking.

---

## ✨ Key Themes

### 🧬 1. The `/project` Reverse-Build Genome

* **Meta-prompt spine (Stage 0 "void" → Stage 18):** one paste-able prompt per
  phase; the roadmap discovers the specs; a cold reader can traverse the chain
  and make zero design decisions.
* **Reverse-built roadmap:** 16 phases / 32 task pairs (`v0.0.0.0` →
  `v0.0.1.8`), every phase receipt-matched to real commits via gap-walking
  (`git log --reverse` between tags); 16/16 anchors + 20 flowchart edges verified.
* **10 spec oracles:** architecture, database-schema, encryption-layers,
  routes-and-contracts, key-hierarchy, verification-gates, admin-suite,
  ui-ux-design-system, import-export, and the new `shellcryption-spec.md` —
  the client-side crypto oracle (HKDF derivation, envelope format, AAD
  namespace registry, decrypt passthrough ladder, invariants).
* **Historical archive:** Phases 1–13 preserved in
  `.agents/memory-bank/ROADMAP-HISTORY.md` under the 3-version sliding window.

### 🔍 2. Documentation Coherence Audit

* **50 dangling references repaired:** `project/` links repointed number-aware
  (Phases 1–13 → the archive, 14+ → the root sliding window) after the roadmap
  restructure; zero dangling edges remain (traversal-as-audit).
* **Key alphabet corrected:** docs claimed 64-hex key material; the runtime
  generates **base62** (`generateBase62(64)` client / `crypto.randomInt`
  server) — `ARCHITECTURE.md` and `key-hierarchy-spec.md` now tell the truth.
* **10th oracle created:** `shellcryption-spec.md` written from runtime ground
  truth (`src/lib/shellCryption.ts`), resolving the last dangling reference.
* **Contradictions encoded, not papered over:** the two docs-vs-runtime
  conflicts became Phase 17 (below) — the spec of record was never falsified.

### 🔐 3. Phase 17 — Key Ledger Hardening & Pod Purity [SECURITY]

* **Hash-only agent key ledger:** `agent_keys` now stores SHA-256 hashes
  (`key_hash` + `key_fingerprint`); the plaintext `api_key` column is retired.
  Migration 0004 + in-code backfill: legacy keys hashed **in place** (live
  keys keep authenticating), live agent `api_tokens` re-pointed from raw-key
  `owner_uuid` to the agent row id, the ledger rebuilt (SQLite refuses
  `DROP COLUMN` past a UNIQUE auto-index), and **VACUUMed** — freed pages no
  longer carry plaintext bytes.
* **Plaintext shown exactly once:** mint returns the raw `lb-` key once;
  every list response carries only the fingerprint. All auth paths —
  `requireAuth` (direct + token), the `/api/auth/token` sentinel (now
  constant-time against the *stored* hash), and the per-key rate limiter —
  operate on `key_hash` / agent id.
* **Pod purity:** `DEFAULT 'Personal'` purged from all four category columns
  (table rebuild); the `category || 'Personal'` fallback removed from
  `vault.ts`, `notes.ts`, `sshKeys.ts`, `attachments.ts` — uncategorized items
  persist as `""`, matching the client's `normalizePod()` semantics. Existing
  `'Personal'` rows are never rewritten.
* **Proven by `tests/agent-key-hash.test.ts`:** raw DB byte-scan (zero
  plaintext), legacy-backfill unit oracle (pre-migration keys keep working),
  one-time reveal, constant-time sentinel, revoke, and uncategorized
  persistence.

### 🎨 4. Lobster Keys UI — CaraBase 1:1 Card Parity

* **The key row, faithful to CaraBase:** masked by default, Eye/EyeOff toggle,
  Copy with 2s `Copied` feedback — over the SHA-256 fingerprint (the full key
  is revealed exactly once, in the wizard's generated step, which is already
  pixel-equivalent).
* **Full-value masking:** the hidden state covers the ENTIRE value — no
  leading/trailing cleartext (CaraBase's prefix/suffix mask algorithm was
  rejected as a leak).
* **Tab alignment:** heading, subtitle, and delete-confirmation wording aligned
  verbatim to CaraBase; Reef Modernist tokens preserved (the design-system
  invariant holds — structure 1:1, skin ShellGuard's).

### 🧪 5. Full Verification Loop

* **100% green test oracle:** **210 tests passing across 15 suites**
  (0 failures, 1 skipped) — including the 6-test key-ledger oracle.
* **Strict TypeScript:** clean `tsc --noEmit`.
* **Production build:** Vite build clean.
* **The old buggy contract rewritten honestly:** the metadata-encryption
  category test (which asserted the old `'Personal'` fallback encryption) was
  updated to the uncategorized contract in the same change as the fix.

---

## 🏗️ Architectural Topology Map

```text
Browser (React) → Express 5 API → SQLite (better-sqlite3-multiple-ciphers)
     ↓                    ↓                    ↓
ShellCryption      Per-Row Encryption     SQLCipher
(client-side)      (server-side)          (whole-DB)

hu- (human root) → SHA-256 only → lobsters.key_hash
lb- (agent keys) → SHA-256 only → agent_keys.key_hash   ← NEW in v0.0.1.9
api- (session)   → sessionStorage only

/project/  = the genome: spine → roadmap → 10 oracles (docs ARE the app)
```

---

## 📜 Commit Ledger (`v0.0.1.8..v0.0.1.9`)

```text
aed63b8 docs(rules): persist session learnings — full-masking invariant, SQLite security-migration skill, batch-patch discipline
0bbc5be fix: fully mask the key row — no leading/trailing cleartext
9a27cb7 feat: Lobster Keys card key row — CaraBase 1:1 UI parity
7faf51d feat: Phase 17 — key ledger hardening & pod purity (v0.0.1.9)
e40b9f9 docs: genome coherence audit — ShellCryption oracle, dangling-ref repair & Phase 17 hotfix queue
2ec60f0 docs(memory-bank): record reverse-build genome session — summit state, sliding window, consolidated patterns
68d73cd docs: transcribe Phase 16 and close the spine - SUMMIT (v0.0.1.8)
4b6e52c docs: transcribe Phase 15 - sgtotp.bak Import Compatibility Layer (v0.0.1.7)
f12602a docs: transcribe Phase 14 - Native LAN TLS (v0.0.1.6)
5c96a18 docs: transcribe Phase 13 - Bitwarden-Style Custom Fields (v0.0.1.5 Milestone)
3cdf6d3 docs: transcribe Phase 12 - Pure TypeScript WebCrypto Fallback Engine (v0.0.1.4)
008d4ab docs: repair spine edge chain (P10->P11->P12), stale summit label, Phase 11 heading emoji
769cb22 docs: transcribe Phase 11 - Release Publishing CI & Iconography (v0.0.1.3)
3ccdd1b docs: transcribe Phase 10 - Deployment Hotfixes & Dev-Loop Formalization (v0.0.1.2)
47bddfd docs: sanitize Phase 9 anchor slug (drop emoji from heading)
024477a docs: transcribe Phase 9 - Genesis Release & Origin Hardening (v0.0.1)
daceac9 docs: rewire spine flowchart edge for Phase 9
adc01d4 docs: transcribe Phase 8 - Vault UX Renaissance
96ebc56 docs: transcribe Phase 7 - Multi-Account, QuickLogin & Landing Gateway
959ddae docs: transcribe Phase 6 - SuperLobster Admin Plane
8475713 docs: transcribe Phase 5 - Per-Row Metadata Encryption & Port Molt
a85fe51 docs: transcribe Phase 4 - Test Oracle, Container Deployment & License
0f5e007 docs: transcribe Phase 3 — Vault CRUD, Lobster Keys & Settings Storage
a8be8f6 docs: add intuitive-recognition agent rule for pattern-based decision making
d97634e docs: transcribe Phase 2 — SQLite Bedrock, Security Kernel & Identity Bridge
d880a5d docs: open reverse-build /project system with spine head and Phase 1
```

---

## 🚢 Deployment

```bash
docker pull ghcr.io/clawstackstudios/shellguard:v0.0.1.9
# or
docker pull ghcr.io/clawstackstudios/shellguard:latest
```

* **Upgrading from v0.0.1.8:** migration 0004 applies automatically on boot —
  existing `lb-` keys are hashed in place and keep working; live agent sessions
  are preserved until natural expiry. No manual action required.
* **Note:** the first boot after upgrade logs
  `[Key Ledger] 🔐 Hashed N agent key(s) in place; plaintext api_key column
  retired.` — that is the migration doing its job.
* Unraid users: update via the Community Applications template as usual.
* Existing `'Personal'`-categorized items are untouched; only new items default
  to uncategorized (`""`).

---

*Release grammar: tag → RELEASE doc → CHANGELOG → version bump. The GitHub
Release body mirrors this file verbatim via the release pipeline.*
