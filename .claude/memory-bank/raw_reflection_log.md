# Raw Reflection Log

> Detailed, timestamped, task-referenced entries. Candidates for consolidation into `consolidated_learnings.md`. Prune after consolidation.

---

## 2026-08-27 — Per-Row Metadata Encryption Implementation

**TaskRef:** Implement per-row AES-256-GCM metadata encryption for ShellGuard

**Learnings:**
- `crypto.webcrypto.subtle` HANGS on Linux 6.12.24-Unraid / Node v22.23.0. Even basic `importKey` calls freeze. Native `crypto` module (`hkdfSync`, `createCipheriv`) works perfectly.
- In-place encryption (JSON envelope in same TEXT column) avoids schema changes entirely. `{v:1, alg:"SG-META", iv, ct}` stored in existing columns.
- `alg:"SG-META"` deliberately distinct from ShellCryption's `alg:"AES-GCM-256"` — the two systems never confuse each other.
- Empty-string defaults get encrypted: route does `category || 'Personal'` → 'Personal' is non-empty → gets encrypted by prepareWrite. Tests must account for this.
- Test isolation with encryption: `vi.hoisted()` must set `DB_ENCRYPTION_KEY` before dynamic server import. Other suites leave it unset (cipher=null, passthrough mode).
- `crypto.hkdfSync` is synchronous (returns Buffer), while `createCipheriv`/`createDecipheriv` are sync but wrapped in async for future-proofing.

**Difficulties:**
- Initial `deriveMetadataKey` used `crypto.webcrypto.subtle.importKey` which hung indefinitely. Diagnosed by testing native `crypto.scryptSync` (worked) vs `webcrypto.subtle.importKey` (hung). Rewrote entirely to native crypto.
- Dead code in initial fieldEncryption.ts: exported `deriveMetadataKey` that only did `importKey` without HKDF derivation. Fixed by making it call full derivation.
- "empty category stored as-is" test failure: expected `row.category === ''` but route does `category || 'Personal'` → encrypted. Fixed test to expect encrypted category in DB.
- Staged files from agents included unrelated docs (ARCHITECTURE.md, BLUEPRINT.md etc). Fixed with `git reset HEAD` on unrelated files.

**Successes:**
- Zero schema changes needed — in-place encryption model is elegant
- Backward compatibility works perfectly — legacy plaintext passes through
- All 137 tests pass across 7 suites
- Triple-layer model (ShellCryption + Per-Row + SQLCipher) is clean and well-documented

**Improvements_Identified_For_Consolidation:**
- Always test `crypto.webcrypto.subtle` availability before using it — native `crypto` is the safe fallback
- In-place encryption pattern (JSON envelope in existing column) is reusable for future encrypted fields
- Test isolation pattern: `vi.hoisted()` for env vars, dynamic import for server module

---

## 2026-08-27 — Documentation Update Across 5 Files

**TaskRef:** Document triple-layer encryption model in README, SECURITY, ARCHITECTURE, BLUEPRINT, QUICKSTART

**Learnings:**
- Parallel agent dispatch for doc updates works well — 4 agents updated 5 files simultaneously
- Each agent needs very specific, line-numbered instructions to avoid drift
- Security boundary table (5 actors × 3 data types) is the clearest way to explain what each party can access

**Difficulties:**
- None significant — agents executed cleanly

**Successes:**
- All 5 docs updated consistently with same terminology and model
- ClawKey backup guidance prominently placed in README and SECURITY
- Attack scenarios updated to reflect triple-layer model

---

## 2026-08-27 — Port Migration (4545→5353, 4646→5454)

**TaskRef:** Migrate all port references across config, Docker, tests, docs

**Learnings:**
- Port references are scattered across 15+ files: package.json, vite.config.ts, Dockerfile, docker-compose*.yml, shellguard-unraid-template.xml, src/config/apiConfig.ts, tests/*.test.ts, tests/README.md, CONTRIBUTING.md, CRUSTAGENT.md, ROADMAP.md
- Test port allocation: each suite gets a unique port (54541-54544) to avoid conflicts in parallel vitest workers
- `fuser -k` in scuttle:dev-stop needs both ports updated

**Difficulties:**
- None — straightforward find-and-replace with verification

**Successes:**
- All references updated consistently, tests pass
