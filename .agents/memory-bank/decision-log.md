# Decision Log — ShellGuard

*Episodic memory: how I moved through the codebase. Semantic truth lives in the Memory Bank; walls, detours, and instincts live here. Sliding window: 20 entries.*

---

## 2026-09-23 — Phase 22: Search surface consolidation & pod search retention
Lucas's ergonomic intuition refined Phase 22: while header search and sidebar top search duplicate the master vault item search, the dedicated pod search in SidebarFolderTree.tsx pays its rent by allowing rapid filtering of large pod hierarchies directly where the user looks. Retained podSearch in the tree while purging redundant global search bars from Header.tsx and Sidebar.tsx, unifying vault item search into ItemListPane.tsx via vaultSearch.ts.

## 2026-09-23 — Phase 25 formalization & full-archive mobility architecture
Recognized that client-side attachment archive export and non-blocking ingestion is an industry-wide blindspot (Bitwarden produces export ZIPs but cannot import them, forcing manual item-by-item uploads). Elevated from a sub-task into dedicated Phase 25 ("Habitat Full-Archive Mobility & Reactive Ingestion Dock") across ROADMAP.md and project/meta-prompt-ai-studio.md: Task 49 establishes collision-proof streaming ZIP packaging with decrypted attachments, and Task 50 delivers a Two-Stage Ingestion Pipeline (<2s instant bulk-import + floating non-blocking reactive Abyssal Ingestion Dock in VaultShell with live item badge synchronization).

## 2026-09-22 — Release v0.0.2.3 (Build 25) & ClawStack release protocol execution
Executed release protocol for v0.0.2.3 ("The Deep Ingestion & Vault Parity Molt"). Maintained Single Active Release Draft invariant by drafting RELEASE-v0.0.2.3.md and purging RELEASE-v0.0.2.2.md. Archived Phase 18 to ROADMAP-HISTORY.md preserving the 3-completed-phases sliding window in ROADMAP.md. Synchronized version anchors across package.json, README badge, CHANGELOG.md, and ARCHITECTURE.md with 100% green test oracle.

## 2026-09-22 — Note attachments parity, ghost pod purging & detail pane selection preservation
Physical verification of Areas 3 & 4 surfaced 3 friction points: standalone attachments defaulting to category 'Attachment' created ghost pods in bulk modals; notes lacked binary attachment support across db schema and routes; and saving an item unmounted VaultShell because uploadProgress was rendered inside mode="wait", dropping selectedItemId. Resolved by pruning ghost pods in podUtils and VaultShell, executing Migration 0008 to add attachments to vault_secure_notes with cascade deletion in notes.ts, lifting selectedItemId to App.tsx, and decoupling progress/error banners into their own non-blocking container.

## 2026-09-21 — Live verification friction points & decoupling preview complexity
Lucas's physical verification surfaced 4 critical joints: switching accounts to a locked user trapped the modal in a re-render loop if `activeLobsterId` changed prematurely, while switching between unlocked accounts required an un-reactive page reload; hidden custom fields gave zero visual feedback before saving; bulk modals lacked pod/tag chips; and binary attachments suffered 415 errors and preview bloat. Decoupled preview complexity in favor of pure encrypted BLOB storage with direct download and delete, staged switch targets safely, added eye toggles to custom fields, and derived chip pickers directly from vault items.

## 2026-09-21 — UI action seams & pod metadata defense
Direct inspection of `App.tsx` handlers revealed that pod renames and bulk updates were sending payloads missing `tags`, `uris`, and `password_history`, risking silent data loss if the backend handler does not defensively read `existing` values. Hardened `handleRenamePod`, `handleDeletePod`, `onBulkMoveToPod`, and `onBulkAssignTags` to pass complete data models, wrapped operations in `try/catch` with reactive error reporting and `scuttleVault` recovery, and built `tests/unit/uiSeams.test.ts` (11 tests) verifying glue logic and endpoint dispatch.

## 2026-09-21 — Project hygiene & the live verification handshake
Discovered that passing 285 isolated tests masked a broken delete function in the UI due to an untested client seam. Solidified `.agents/rules/project-hygiene.md` ratifying the 5-phase development lifecycle: Cartography, Seam-Aware Planning, Layered Stroke Commits, Automated Gates, and the mandatory Live Verification Handshake with Lucas. Tests verify logic; only human live verification proves the joint holds.

## 2026-09-21 — Vault item deletion routing & zombie process port shadowing
A stale Node process on port 6565 from before Phase 21 intercepted `DELETE /api/vault/bulk` as `DELETE /api/vault/:id` with `:id = 'bulk'`, returning 404. Terminated the zombie PID, restored correct routing in `App.tsx` for TOTP/pearl items, integrated `ConfirmDialog` into `ItemDetailPane` for single-item parity with bulk deletes, and cleared `selectedItemId` on deletion to prevent dead selection state.

## 2026-09-20 — Async native PBKDF2 WebCrypto acceleration & 600,000 iteration guidance (N1, N2)
Pure-TS PBKDF2 running 600k iterations synchronously on the main thread blocked for ~15-20s. Kept the fallback module pure while implementing caller-side native acceleration via `crypto.subtle.deriveBits` in `vaultExport.ts` (~1s execution off-thread) with graceful fallback to pure-TS for non-secure HTTP origins. Upgraded default iteration count from 100,000 to OWASP-recommended 600,000 with backward compatibility.

## 2026-09-20 — Peer review hardening: KDF branching, CSPRNG enforcement & metadata registration
Addressing Cline's peer review audit highlighted that HKDF cannot be used for user-supplied passphrases due to lack of a work factor against GPU brute-force; implemented pure-TS PBKDF2-SHA256 (100k iterations) in webCryptoFallback.ts and branched derivation between ClawKey and passphrase. Enforced fail-closed CSPRNG on AES-GCM salt/nonce, registered 'uris' under MetadataGuard Layer 2 metadata encryption, converted 0007.down.sql to a safe no-op, and built dedicated published RFC 6238 vectors in totpUtils.test.ts.

## 2026-09-20 — Bitwarden export sniffer priority & encrypted export tripwire
Bitwarden export sniffer must inspect for proprietary encrypted exports before running standard JSON array mappings, or it would attempt to process encrypted ciphertext (`2.***`) as valid item titles. Surfacing an actionable guidance alert instructs the user to export unencrypted JSON/CSV or use the Bitwarden CLI. Additionally, dynamic TOTP URI parsing seamlessly normalizes non-standard 8-digit and SHA256/512 configurations without data loss.

## 2026-09-20 — Express route shadowing on parameterized subpaths
Placing `DELETE /bulk` and `POST /bulk-import` after parameterized `:id` handlers caused Express to capture `/bulk` as `req.params.id = 'bulk'`. Declaring static and batch subpaths strictly before parameterized routes resolved the shadowing immediately. In Express routers, order of declaration is an immutable routing invariant.

## 2026-09-20 — Phase 21: Per-record Zod safeParse vs middleware validateBody for 207 Multi-Status
Express `validateBody(schema)` runs before route execution and rejects an entire payload with HTTP 400 if any record fails validation. To achieve true 207 Multi-Status partial failure handling in `POST /api/vault/bulk-import`, the middleware validates only the container array bounds (`1..1000`), while the route handler executes `VaultSchemas.bulkImportItem.safeParse(item)` per record, aggregating failures into `{ index, reason }` chips and persisting valid records in an atomic transaction.

## 2026-09-19 — Phase 20 release drafting & 3-version roadmap sliding window
Rolled over ROADMAP.md to release v0.0.2.2 (Build 24 — The Bioluminescent Reef) holding completed Phases 18, 19, and 20. Retired Phase 17 into ROADMAP-HISTORY.md preserving the 3-completed-milestones ceiling. Verified dynamic package version resolver ensures 0.0.2.2 passes tests cleanly with zero assertion drift.

## 2026-09-19 — SSH key JSON leak remediation & terminal ergonomics
Generating in-browser SSH keypairs and unmasking them revealed a stringified `{publicKey, privateKey}` JSON payload instead of pure PKCS#8 PEM. Resolved via a dual-key serialization layer (`parseSshKeySecret`/`serializeSshKeySecret`) with backward compatibility for legacy raw PEMs, clean multi-line monospace code block display, standard RFC 7468 delimiters, direct `.pem` download, and one-click `authorized_keys` shell command copy.

## 2026-09-19 — Phase 20: PodUtils color unification & Node test env safety
Unified Pod and Tag color mechanics into a shared deterministic color engine in `src/lib/podUtils.ts` (string hashing + explicit user overrides). Discovered Node test environments crash on unguarded `localStorage` accesses; added defensive `typeof localStorage === "undefined"` checks so client color utilities remain completely headless-safe.

## 2026-09-19 — docs bow to code: Phase 19 ripple alignment & Phase 20 500MB sub-task
Walked the complete codebase and documentation surface to audit production readiness. Found and resolved 12 contradictions: purged 8 obsolete "10 MB" base64 references in favor of the active 50MB Busboy streaming BLOB reality, unfroze ARCHITECTURE.md to v0.0.2.1 (added migration 0005, middleware/utils, 19 test suites, Deltas #21 & #22), fixed conflated auth limiter numbers in architecture docs, and added the 500MB attachment ceiling sub-task to Phase 20 in ROADMAP.md and meta-prompt-ai-studio.md.

## 2026-09-18 — Phase 19: attachment BLOB migration & openBlob limitation
Migration 0005 moved attachment payloads from base64 text to native BLOBs. Discovered better-sqlite3 exposes no `openBlob()` streaming handle, so upload write path buffers ciphertext chunk up to the 50MB mid-stream ceiling, while downloads stream cleanly in 1MB chunks via SQLite `substr()`.

## 2026-09-17 — Phase 18: composite items & in-browser ssh keypairs
Consolidated vault logins into primary rich composite records adhering to Bitwarden's model (passwords embed notes, live TOTP countdown ring, attachments, custom fields). Decoupled child attachments from Pod counts so files never inflate folder badges. Implemented in-browser WebCrypto SSH keypair engine (`src/lib/keyGen.ts` — Ed25519 + RSA-4096).

## 2026-09-17 — long-term memory bank established
Adopted `long-term-memory-bank` rule into `.agents/memory-bank/long-term/`. Crystallized 16 high-weight ratified entries across `patterns.md`, `decisions.md`, `learnings.md`, and `constraints.md` that held under pressure across multiple releases.

## 2026-09-17 — agent bank separation (.agents vs .clinerules)
Lucas clarified hard bank boundary: Antigravity's memory bank is strictly `.agents/memory-bank/`; Cline's is `.clinerules/memory-bank/`. No cross-mirroring between agent banks — stay in your own bank. Reverted any accidental touch to `.clinerules/` to keep Cline's state pure.

