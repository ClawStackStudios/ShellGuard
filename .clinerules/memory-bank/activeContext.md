# Active Context — ShellGuard

## Current Work Focus

**🔾 v0.0.1.9 (Build 18) RELEASED & LIVE** — tag pushed, GitHub Release published with RELEASE-v0.0.1.9.md mirrored verbatim, main at 9b5ec31 (merge, --no-ff). Ships: the /project genome (spine + receipt-backed roadmap + 10 oracles), the coherence audit (0 dangling refs, hex→base62 key-alphabet truth), Phase 17 security (hash-only lb- key ledger + pod purity), and CaraBase 1:1 LobsterKeys card with full-value masking. Next queue: Phase 18 (v0.0.2.0) — Unified Bitwarden-Style Item Composition & In-Browser Keypair Generation (Tasks 35/36).

## Recent Changes (Sliding Window — Latest 10)

1. **2026-09-13** — **Phase 22 expanded (Unified Search & Control Ergonomics)**: restructured to Task 43 [Functionality] robust client-side search engine (titles/keywords/attachment names/note contents over the already-decrypted vaultItems corpus; query NEVER transmitted — zero-knowledge; purged on lock) + Task 44 [UI] search-bar consolidation (remove header top-right search + sidebar pod-search input; ItemListPane = the single search) with the eye-beside-copy fix folded in. Spec grounded in code truth: App.tsx decrypts note content + attachment rows into state; sidebar search was a pod-tree filter (podSearch); header search carries the dropdown/refs. Phase still gated pending green-light.
2. **2026-09-13** — **Phase 22 queued (Reef Polish Pass, Tasks 43/44)**: genome post-additions — ROADMAP queue + meta-prompt Stage 20 appended; version left work-driven (provisional v0.0.2.4, No Forced Targets). Task 43 = custom-field Eye relocation (value-column eye → right cluster, immediately left of Copy, matching the password field pairing; full-value mask invariant). Task 44 RESERVED — Lucas collecting more polish items; phase ON HOLD until filled + green-lit.
3. **2026-09-13** — **Genome post-additions**: ROADMAP molted per sliding-window discipline (Phase 17 → Completed Releases with receipts 7faf51d/027506a/9b5ec31; Phase 14 → ROADMAP-HISTORY + archive row; queue re-heads at Phase 18; versioning policy now Current v0.0.1.9 / Next v0.0.2.0) + unphased post-v0.0.1.9 hotfix addendum (07ccd61). Meta-prompt spine gained Stage 19 (post-summit hotfix path) with the lesson: run the full oracle AFTER the version bump — release cuts a story boundary, not a quality boundary.
4. **2026-09-13** — **Vault header flush fix** (`fix/vault-header-flush`): item-list search header and Item Details header pinned to shared `h-16` (left was p-3/~59px, right p-4/~64px — borders stepped at the dashboard T-junction). Bonus catch: `version.test.ts` had a hardcoded '0.0.1.8' literal that the release bump broke — latent failure shipped in v0.0.1.9; test now asserts package.json ground truth + X.Y.Z.N shape. Oracle re-greened (210 tests).
5. **2026-09-13** — **v0.0.1.9 RELEASED**: 027506a (release prep) → annotated tag v0.0.1.9 → merged to main --no-ff (9b5ec31, 53 files +4,634/−403) → pushed. GitHub Release live with RELEASE-v0.0.1.9.md mirrored verbatim (verified via gh release view). Caught a misleading "Everything up-to-date" on the first main push via ls-remote — re-pushed explicitly (66d9ca4..9b5ec31). Docker check env-blocked (daemon off; Dockerfile unchanged).
6. **2026-09-13** — **Release v0.0.1.9 prepared**: RELEASE-v0.0.1.8.md git-mv'd to RELEASE-v0.0.1.9.md and rewritten (genome, audit, Phase 17, UI parity; 26-commit ledger v0.0.1.8..HEAD); package.json/README badge/CHANGELOG synced to 0.0.1.9; memory bank synced. Pre-release loop: lint ✓, 210 tests ✓, build ✓ (Docker daemon unavailable — Dockerfile unchanged, runtime validated by build).
7. **2026-09-13** — **Lobster Keys Card UI — CaraBase 1:1 Key Row**: rebuilt LobsterKeyCard key row to CaraBase exact structure (masked-by-default with CaraBase maskKey algorithm, Eye toggle, Copy + 2s Copied feedback) over the Phase 17 fingerprint; tab heading/subtitle + ConfirmDialog wording aligned verbatim. Reef tokens kept (design-system invariant); wizard generated-step already 1:1. Branch feat/lobsterkeys-carabase-parity; gates: tsc ✓, 210 tests ✓, build ✓.
8. **2026-09-13** — **Phase 17 Implemented (Key Ledger Hardening & Pod Purity)**: migration 0004 + `keyLedger.ts` backfill (hash in place, api_tokens owner_uuid re-pointed to agent id, ledger rebuilt without api_key, VACUUM kills plaintext ghost pages — UNIQUE auto-index forbids DROP COLUMN, rebuild required); mint stores hash + returns plaintext once; requireAuth/token-sentinel/rateLimiter on key_hash; parseAgentKey allow-list projection; LobsterKeyCard fingerprint + wizard one-time reveal preserved; category fallback to empty string in 4 routes + DEFAULT purge; `tests/agent-key-hash.test.ts` 6 tests; metadata-encryption category test updated to the new contract. Gates: tsc clean, 15 files / 210 tests, build clean.
9. **2026-09-13** — **Genome Coherence Audit & Phase 17 Queue**: Created `project/shellcryption-spec.md` (oracle #10) from code truth; renumbered root ROADMAP forward queue (hotfix = Phase 17, Tasks 33–42, downstream migrations 0005/0006); added Stage 18 to the meta-prompt spine (mermaid node+2 edges atomic); repointed 50 dangling refs to the root window / ROADMAP-HISTORY archive; fixed hex-to-base62 claims in ARCHITECTURE + key-hierarchy-spec; stale wording in routes-and-contracts. Found 2 code-vs-docs contradictions (plaintext lb- key storage; Personal category fallback) — encoded as Phase 17 rather than papering over. Lucas restructured the roadmap system mid-session (sliding window + HISTORY archive) — genome links now point at both.
10. **2026-09-05** — **Reverse-Build `/project` Genome (Summit)**: Created `project/` as a 1:1 mirror of the TOTP document-compiler (spine → roadmap → specs). 16 phase passes, each: walk the git gap, read diffs, transcribe Task A/B with receipts, grow oracles on demand, traverse-check. Key catches: the hidden Phase-8 UX cluster (master-detail/pods/NavIntent) the draft table had missed; two editor-insert clipping class failures (§4 consumed in verification-gates + encryption-layers); edge-drift pattern (node updated, edge stale) solved by atomic per-pass edits; GitHub-anchor slug rules (dots stripped — `v0.0.0.1` → `v0001` not `v00001`; emoji variation-selectors survive slugging — never emoji in headings). 27 commits on `docs/reverse-project`, awaiting merge.

## Active Decisions

- **Locked**: SENSITIVE_KEY derived from `hu-` key via HKDF (one secret, one file)
- **Locked**: Keep SQLCipher whole-DB encryption as defense-in-depth alongside per-row encryption
- **Locked**: Twin-verbatim policy with ClawChives (server modules mirror file-for-file)
- **Locked**: Attachment reference model — files in `vault_secure_attachments`, pearls store JSON ID arrays; attachment dataUrl encrypted with AAD `vault_secure_attachments:{id}`
- **Locked**: SuperLobster Panel — no HTTP restore, no backup download, whitelist-only settings, strict-metadata user list, `audit.sqlite` never swapped by restore (ADMIN.md threat model)
- **Locked**: Zero hardcoded default pods — all pods are 100% user-created. No "Personal" or "Work" fallback.
- **Locked**: Category normalization via `normalizePod()` must be used for ALL comparisons between tree paths and item categories

## Important Patterns

- In-place encryption: no schema changes, encrypted JSON in same TEXT columns
- Backward compatibility: legacy plaintext passes through on read
- `DB_ENCRYPTION_KEY` governs both SQLCipher AND per-row metadata encryption
- Native Node `crypto` (NOT `crypto.webcrypto.subtle` which hangs in this environment)
- **WebCrypto Fallback Pattern**: `window.crypto.subtle` is undefined on plain HTTP browser origins (LAN IPs). `src/lib/webCryptoFallback.ts` provides pure TypeScript implementations (SHA-256, HMAC-SHA256, HKDF, AES-GCM-256) that transparently replace `crypto.subtle` methods when unavailable.
- **Blob download pattern**: Replace `data:` URI links with in-memory `Blob` + `URL.createObjectURL(blob)` to avoid Chromium insecure-connection download blocks on HTTP LAN origins.
- Shared attachment helpers live in `src/lib/attachmentUtils.ts` (parseAttachmentIds, formatBytes, downloadAttachment, MAX_ATTACHMENT_BYTES)
- **Category normalization must be used for ALL pod operations** — always use `normalizePod()` before comparing item categories to tree paths
- **Optimistic local state updates**: use `setVaultItems(prev => prev.map(...))` for immediate UI responsiveness, then sync to server
- **`skipScuttle` pattern**: batch multiple server mutations with `skipScuttle=true`, then call a single `scuttleVault` at the end to prevent redundant GET re-fetches from overwriting in-flight PUT requests
- **Custom Fields AAD pattern**: Use distinct AAD namespaces per item type for custom fields encryption: `vault_pearls_custom`, `vault_secure_notes_custom`, `vault_ssh_keys_custom`. The custom_fields blob is NOT registered in metadataGuard — it's already client-encrypted via ShellCryption.

## Key Learnings

- `crypto.webcrypto.subtle` hangs on Linux 6.12.24-Unraid / Node v22.23.0 — use native `crypto` module server-side
- `window.crypto.subtle` is undefined on plain HTTP browser origins — `src/lib/webCryptoFallback.ts` polyfills client-side
- `window.crypto.randomUUID` is undefined on HTTP origins — multi-tier fallback in `src/lib/crypto.ts`
- `data:` URI downloads blocked on Chromium insecure connections — use `Blob` + `URL.createObjectURL` instead
- Empty-string defaults (`""`, `"Personal"`) get encrypted when cipher is active because the route does `category || 'Personal'`
- Test isolation requires `vi.hoisted()` to set `DATA_DIR` and `PORT` before dynamic server import
- `tsc --noEmit` has one pre-existing error in fieldEncryption.ts (hkdfSync ArrayBuffer vs Buffer) on main — not a regression gate; vite build is the gate
- `createTestUserWithToken(app)` requires the supertest app argument — calling it bare crashes with a confusing "Cannot read properties of undefined (reading 'address')"
- Reference-model pattern for linked child records: parent stores JSON ID array; child deletes cascade with ownership-scoped SQL (`AND owner_uuid = ?`) so foreign owners' cascades can't delete your rows
- Category string comparisons between tree paths and items must always use `normalizePod()` because unnormalized strings with spaces or slash differences silently fail strict equality
- Sub-pods must be matched using `.startsWith(targetPod + "/")` so child items in nested pods are properly cascaded to "Personal"
- `npm` is at `/config/Applications/node-v22.23.0-linux-x64/bin` — must be in `PATH` for build commands
- Vitest test for WebCrypto fallback needs a stubbed `window.crypto.subtle` environment to test the fallback path — the current test environment may not properly mock this
