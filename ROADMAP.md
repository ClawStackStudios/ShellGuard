# 🛡️ ShellGuard©™ Roadmap

*Where the reef has been, and where it molts next.*

> **SLIDING-WINDOW ACTIVE ROADMAP (3-VERSION ROLLING WINDOW)**
> *Preserves the Active Forward Queue (Phase 18+) and the 3 most recent completed phases (Phases 15, 16, and 17).*
> *Historical Phases 1 through 13 are archived in [`ROADMAP-HISTORY.md`](.agents/memory-bank/ROADMAP-HISTORY.md).*

---

### 🏷️ Work-Driven Versioning Policy: `MAJOR.MINOR.PATCH.REVISION` (`X.Y.Z.N`)

- **Current Production Release**: `v0.0.1.9 (Build 18)`
- **Next Planned Milestone**: `v0.0.2.0 (Build 19)` (Phase 18)
- **Version Grammar**: Every release increments REVISION or PATCH based on structural gravity.
- **Strict 2-Task Pairing Law**: Every phase consists strictly of **Task A [Functionality / Security Engine]** followed immediately by **Task B [UI Component / Interactive State]**.
- **Rolling Window Discipline**: Only the 3 most recent completed phases remain in this root roadmap. When Phase 18 completes, Phase 15 rolls over into [`ROADMAP-HISTORY.md`](.agents/memory-bank/ROADMAP-HISTORY.md).

---

## 🌊 Queue — Active Forward Phases (The Next Molts)

### Phase 18: Unified Bitwarden-Style Item Composition & In-Browser Keypair Generation [v0.0.2.0 (Build 19)]

> Phase Feature Set Overview:
> Consolidates vault item architecture into primary, rich composite records adhering
> to the Bitwarden model. Passwords/logins encapsulate embedded notes, live TOTP seeds,
> attached files, and custom fields in a single cohesive entity. Decouples child
> attachments from Pod item metrics so attached files never artificially inflate
> folder counts. Introduces native in-browser WebCrypto ED25519/RSA-4096 SSH keypair
> generation with downloadable public/private keys.
> *(Source: Attractor Beacon §6, memory-bank/progress.md)*

- [ ] **Task 35: [Functionality] Rich Composite Items, Child-Attachment Decoupling & Cryptographic Keypair Engine**

Description: Refactor item composition contracts across client and server. Ensure
`vault_pearls` serves as the primary composite entity embedding credentials, URI arrays,
ShellCrypted rich notes, TOTP seeds, attachments, and custom fields. In `server.ts` and
`vault.ts`, update count aggregation queries so child records in `vault_secure_attachments`
are scoped strictly to parent items and excluded from root pod item tallies. Implement
in-browser WebCrypto cryptographic SSH key generation (`generateKeyPair`) supporting
Ed25519 and RSA-4096, outputting RFC-4716 public keys and PKCS#8 ShellCrypted private keys.
Add test coverage in `tests/vault-crud.test.ts` and `tests/unit/keyGen.test.ts`.

> Success Criteria: Creating a login with 3 attachments increases Pod item count by
> exactly 1; generating an Ed25519 keypair produces valid OpenSSH/RFC formats; child
> attachments cleanly cascade delete with the parent; 100% test oracle passes.

- [ ] **Task 36: [UI Component] Bitwarden-Style Master Form, Live TOTP Embedding & Pod Item Count Reconciliation**

Description: Redesign `ItemFormModal.tsx` and `ItemDetailPane.tsx` into a unified,
Bitwarden-style master view: username, password with generation slider/strength gauge,
URI list with launch buttons, embedded live-rendered TOTP token with 30-second progress ring,
expandable rich notes, attachment drag-and-drop zone, and custom fields. Update
`SidebarFolderTree.tsx` to display true primary item counts. Add the "Generate Keypair"
action modal inside `SshKeyVaultView.tsx`. Update documentation in `docs/vault-features/`.

> Success Criteria: Vault view renders rich composite cards with embedded TOTP
> countdowns and attachment action chips; folder badges accurately reflect primary
> items; SSH key generator modal copies public keys and stores private keys in one click.

---

### Phase 19: Attachment SQLite BLOB Migration & Streaming Architecture [v0.0.2.1 (Build 20)]

> Phase Feature Set Overview:
> Migrates binary attachment payloads from base64 text strings into native SQLite BLOB
> storage with chunked streaming reads and writes. Eliminates base64 33% memory inflation,
> supports larger files up to 50MB, and enforces strict per-user storage quotas.
> *(Source: Root ROADMAP backlog, memory-bank/progress.md)*

- [ ] **Task 37: [Functionality] Migration 0004 BLOB Storage, Streaming Chunk Handlers & Quota Enforcement**

Description: Create `migrations/0005_attachment_blobs.up.sql` altering or migrating
`vault_secure_attachments` to store binary ciphertext in a `BLOB` column instead of `TEXT`.
Update `src/server/routes/attachments.ts` with streaming Busboy/multer upload handlers
piping direct encrypted streams into SQLite via incremental BLOB I/O (`openBlob()`).
Enforce a 50MB per-file ceiling and 500MB total grotto quota per `owner_uuid`. Add
integration tests in `tests/attachments-blob.test.ts`.

> Success Criteria: Binary payloads round-trip cleanly without base64 encoding overhead;
> attempting to upload over quota yields a 413 Payload Too Large; incremental BLOB reads
> avoid spiking Node.js RSS memory; migrations pass backward-compatibility checks.

- [ ] **Task 38: [UI Component] Streamed Progress Uploads, Chunked Decryption & File Previewers**

Description: Update `attachmentUtils.ts` and file upload dropzones in `ItemFormModal.tsx`
with real-time upload progress bars and cancel buttons. Implement client-side Web Streams
API (`ReadableStream`/`WritableStream`) for AES-GCM decryption of large attachments without
freezing the UI thread. Provide inline thumbnail previews for common image/PDF types.

> Success Criteria: Uploading a 20MB file displays a smooth percentage progress bar;
> downloading decrypts via streams with zero browser tab freezing; PDF/image previews
> display within an encrypted object URL modal.

---

### Phase 20: Vault Tagging System & Granular Filter Bar [v0.0.2.2 (Build 21)]

> Phase Feature Set Overview:
> Introduces flexible, multi-dimensional categorization alongside hierarchical Pods.
> Users can assign arbitrary colored tags to any vault item, filter across intersecting
> tags in the sidebar, and execute scoped searches.
> *(Source: Root ROADMAP backlog, memory-bank/progress.md)*

- [ ] **Task 39: [Functionality] Tag Schema & Indices, Tag Assignment Mutation & Scoped Search**

Description: Create `migrations/0006_vault_tags.up.sql` adding `tags` (ShellCrypted JSON array
or junction table) across pearls, notes, and SSH keys. Update route handlers in `vault.ts`,
`notes.ts`, and `sshKeys.ts` to support querying by tag intersection (`?tags=finance,infra`).
Update audit logging to capture tag assignment events. Ensure tags respect client-side
ShellCryption and per-row metadata encryption.

> Success Criteria: Items support multiple tags; searching by tag filters accurately in
> SQL with ownership scoping; tag mutations emit audit trail events; 100% test pass.

- [ ] **Task 40: [UI Component] Tag Selector Chips, Sidebar Tag Cloud & Multi-Filter State**

Description: Add tag input autocomplete chips in item edit modals with auto-suggested
existing tags and color pickers. Add a collapsible "Tags" section in `SidebarFolderTree.tsx`
displaying active tags with item counts. Thread active tag selection into the main vault filter
state alongside search keywords and pod selection.

> Success Criteria: Users can add/remove tags via keyboard chips; clicking a tag in the
> sidebar instantly filters the vault grid; multi-tag filters combine with AND/OR logic.

---

### Phase 21: Bulk Import Endpoint & Batch Operations [v0.0.2.3 (Build 22)]

> Phase Feature Set Overview:
> Empowers high-volume vault ingestion and management: transactional bulk import endpoint
> with granular per-record failure reporting, tri-state bulk selection actions, and confirmed
> batch deletion with cascading cleanup.
> *(Source: Root ROADMAP backlog, memory-bank/progress.md)*

- [ ] **Task 41: [Functionality] Bulk Pearl Import Router & Partial-Failure Reporting Engine**

Description: Implement `POST /api/vault/bulk-import` accepting an array of ShellCrypted
items. Execute inside a database transaction with per-record validation: valid items are
inserted, invalid items are skipped and returned in an `errors: [{index, reason}]` report.
Update bulk delete endpoints to ensure atomic cascades across custom fields and attachments.

> Success Criteria: Importing 100 items with 2 malformed records successfully persists
> 98 items and returns an informative 207 Multi-Status / detailed error array; atomic deletes.

- [ ] **Task 42: [UI Component] Multi-Select Tri-State Actions & Batch Import Modal**

Description: Expand bulk selection controls across all vault item views: select-all checkbox
with tri-state (none, some, all), floating bulk action bar (Move to Pod, Assign Tag, Delete),
and dedicated Import wizard with preview table and error resolution chips.

> Success Criteria: Floating action bar appears when items are checked; bulk moving items
> updates local React state optimistically; import error modal highlights skipped items.

---

### Post-v0.0.1.9 Hotfixes (unphased — outside the 2-Task Pairing Law)

> Single-commit hotfixes shipped after the v0.0.1.9 tag, before Phase 18 begins.
> Documented here so the genome stays receipt-honest about post-release work.

- [x] **Vault Master-Detail Header Flush & Version-Test Integrity** — receipt `07ccd61` (2026-09-13).
  The item-list search header (`ItemListPane`) and the Item Details header (`ItemDetailPane`)
  rendered stepping border lines at the dashboard T-junction (left bar ~59px vs right ~64px);
  both are pinned to a shared `h-16` so the `border-b` rules form one continuous line.
  Companion integrity fix: `tests/unit/version.test.ts` had hardcoded `'0.0.1.8'` — a latent
  failure shipped inside v0.0.1.9 (the bump commit landed after the last full oracle run);
  the test now asserts `package.json` ground truth + `X.Y.Z.N` shape only, so version bumps
  can never silently break it again.

### Phase 22: Reef Polish Pass — Unified Search & Control Ergonomics [work-driven version — provisional v0.0.2.4 (Build 23)]

> Phase Feature Set Overview:
> A polish-and-ergonomics bracket in two movements: (1) **one search bar to
> rule the reef** — the sidebar search and the top-right header search are
> removed, the search above the password list becomes the single search
> surface, and the engine behind it becomes robust (titles, keywords,
> attachment file names, note contents — all client-side, zero-knowledge
> preserved); (2) **control ergonomics** — the custom-field Unmask (Eye)
> control moves beside Copy. No schema, no API contract changes; the server
> NEVER receives a search query. The version digit is decided by the
> completed work (No Forced Targets); the queue position after Phase 21 makes
> the provisional label `v0.0.2.4 (Build 23)`. *(Source: Lucas, 2026-09-13 —
> post-v0.0.1.9 hands-on pass; expanded with the search consolidation.)*

- [ ] **Task 43: [Functionality] Robust Unified Vault Search Engine (Client-Side, Zero-Knowledge)**

Description: Implement the unified search engine in the client over the
**already-decrypted in-memory corpus** (`vaultItems` state — `App.tsx` decrypts
pearls, note `content`, custom fields and attachment rows into state after
every fetch; no new decryption path is required). One shared `searchQuery`
single-source-of-truth (lifted from `ItemListPane` to `App.tsx`/`VaultShell`)
drives matching across, case-insensitively: item **titles**, **keywords**
(usernames, URLs, note text), **attachment file names**
(`vault_secure_attachments.file_name` metadata), **note contents** (decrypted
plaintext held in memory), and custom-field values. Substring matching on a
decrypt-once corpus (O(n) per keystroke is acceptable at vault scale; memoize
the corpus so it is not rebuilt per keystroke). 🛡️ Zero-knowledge
invariants: the query NEVER leaves the browser (no `?q=` params, no server
search endpoint — the server cannot search what it cannot read); the search
state and any result cache live in memory only and are purged on lock/logout
with the shellKey. Update `VaultShell`'s filter chain to consume the unified
query; keep type-filter and pod-scope filters composing with it (AND).

> Success Criteria: Searching from the single search bar surfaces matches by
> title, keyword (username/url), attachment file name, and note content; the
> network tab shows zero search requests (query never transmitted); results
> compose with pod/type filters; lock purges the query; the full test oracle
> + `tsc` + build stay clean.

- [ ] **Task 44: [UI Component] Search Bar Consolidation & Control Ergonomics**

Description: Reduce the vault to **one search bar** — the one above the
password list. (1) Remove the **top-right header search** from
`Layout/Header.tsx` (input, dropdown, `searchInputRef`/`searchDropdownRef`
props and their consumers in `App.tsx` — lines ~160–170). (2) Remove the
**sidebar pod-search input** from `Vault/SidebarFolderTree.tsx`
(`podSearch` state, `~lines 49, 62–65, 264`) — the pod tree renders
unfiltered (pod-name filtering folds into future backlog if wanted). (3)
`ItemListPane`'s search becomes the single surface, wired to the unified
engine. (4) **Control ergonomics (fold-in from the original Task 43):** in
`ItemDetailPane.tsx` Custom Fields, relocate the hidden-field Unmask
(Eye/EyeOff) toggle from inline-with-value (~269–279) into the right-hand
action cluster, **immediately left of Copy** (~286–293), matching the main
password field's eye+copy pairing; masked-value cell stays in the value
column; `revealedHiddenFields` semantics unchanged; full-value mask invariant
(every character → `•`, no partial masks — NEVER-list).

> Success Criteria: Exactly one search input renders in the vault UI (above
> the list); sidebar and header contain no search controls; hidden custom
> fields show Eye immediately left of Copy in the right-hand cluster; the
> mask covers the ENTIRE value; reveal toggles per-field; the full test
> oracle + `tsc` + build stay clean.

---

### Phase 23: Bitwarden-Model Item Integrity — Attachment Parent Enforcement & Dashboard Type Truth [work-driven version — provisional v0.0.2.5 (Build 24)]

> Phase Feature Set Overview:
> Aligns ShellGuard's item model fully with the Bitwarden pattern (verified
> against Bitwarden's documentation): vault items are ciphers of fixed types
> (Password, Secure Note, SSH Key — Card/Identity out of scope) and
> **attachments are NEVER standalone items** — they are encrypted children
> bound to a parent. The database tables are already correctly separated
> (`vault_pearls`, `vault_secure_notes`, `vault_ssh_keys`, and
> `vault_secure_attachments` as children); what is missing is ENFORCEMENT:
> today the '+' add menu offers '📎 Attachment' as a creatable type and the
> attachments route accepts standalone rows (`category: "Attachment"` via
> `uploadAttachmentRecord`). This phase closes both gaps and makes the
> dashboard display type-truthful. Domain rules (locked by Lucas):
> passwords may embed notes + attachments; a standalone Secure Note may have
> attachments but CANNOT embed password credentials; SSH keys are their own
> items. Orphan attachments are QUARANTINED, never deleted. The version digit
> is decided by the completed work (No Forced Targets); the queue position
> after Phase 22 makes the provisional label `v0.0.2.5 (Build 24)`.
> *(Source: Lucas, 2026-09-13 — Bitwarden-pattern alignment pass.)*

- [ ] **Task 45: [Functionality] Attachment Parent Enforcement, Orphan Quarantine & Form-Contract Rules**

Description: Enforce parent linkage at the Bedrock. (1) `attachments.ts`:
the POST route requires a parent item reference — reject standalone
attachment creation with a validation error (zod schema gains a required
parent linkage; keep the reference model: the parent's `attachments` JSON ID
array gains the child id in the same transaction). PUT/DELETE unchanged.
(2) Migration `0005_attachment_integrity.{up,down}.sql` + backfill: resolve
orphan standalone attachment rows (the `category: 'Attachment'` rows written
by `uploadAttachmentRecord` without a parent) — relink where a parent can be
determined, otherwise QUARANTINE (flagged hidden from lists, never deleted;
user data is sacred). Audit the quarantine events. (3) Form-contract rules in
`src/server/validation/schemas.ts`: Secure Notes CANNOT carry password
credentials (no `secret` payload on notes — rejected server-side);
attachments are allowed on pearls, notes, and SSH keys per the locked domain
rules. (4) Keep zero-knowledge: `file_data` remains an opaque ShellCryption
blob — the server enforces LINKAGE, never content. Prove it in
`tests/attachment-integrity.test.ts` (standalone creation rejected, orphan
quarantine, relink path, note-with-password rejected).

> Success Criteria: Standalone attachment creation fails closed with a clear
> validation error; every attachment row is either parent-linked or
> quarantined (never silently deleted); a Secure Note with a `secret` payload
> is rejected; quarantine events are audited; zero-knowledge untouched (the
> server still never reads `file_data`); the full test oracle + `tsc` + build
> stay clean.

- [ ] **Task 46: [UI Component] Bitwarden-Model Dashboard — Add-Menu Correction & Type-Truthful Display**

Description: Make the UI tell the item-model truth. (1) Remove the
'📎 Attachment' entry from the '+' add-item menu (`Layout/Header.tsx`
~line 202, the `['password', 'note', 'key', 'attachment']` map) —
attachments enter only through an item's create/edit form (`ItemFormModal`
attachment section, which already implements the drag-and-drop + linked-
attachment model). Sweep `VaultItemType` consumers (add-flow, filters, empty
states) so 'attachment' never surfaces as a creatable type. (2) Dashboard
display correctness: `ItemListPane` shows exactly the three primary types
(Passwords, Secure Notes, SSH Keys) with correct icons/labels; attachments
render ONLY inside their parent's detail pane (the existing `VaultShell`
exclusion becomes a guarantee, not a filter accident). (3) Sorting:
deterministic type-aware ordering — recency within type, with the type
ordering Passwords → Secure Notes → SSH Keys (reviewable in the PR).
(4) Empty states per type-filter reflect the real item model.

> Success Criteria: No 'Attachment' option in any add surface; the list
> contains exactly Passwords/Secure Notes/SSH Keys; attachments appear only
> within their parent's detail; sorting is deterministic and type-aware;
> the full test oracle + `tsc` + build stay clean.

---

## 🔬 Queue — Backlog & Distant Shores (Vision)

> Prioritized backlog items captured for future formalization into paired phases.

- [ ] **Auto-Lock "Retract" Animation** — Latch-closing visual confirmation and biometric iris animation when locking manually.
- [ ] **Monolith Decomposition** — Decompose `PasswordVaultView.tsx` (~2150 lines) and `App.tsx` (~1100 lines) into modular domain hooks and sub-components.
- [ ] **ShellCryption©™ v2 (Hardware Enclave)** — Hardware-backed key storage via WebAuthn PRF (Pseudo-Random Function) extension and Android StrongBox / Apple Secure Enclave.
- [ ] **Audit Reef Security Timeline** — Interactive user-facing security timeline visualizing agent access, secret usage, and anomalous patterns.
- [ ] **P2P Direct Sync** — Synchronize grottos across reefs without a central intermediary.

---

## 📜 Completed Releases (Sliding Window — Last 3 Completed Phases)

### Phase 17: Key Ledger Hardening & Pod Purity [v0.0.1.9 (Build 18) — Security Hotfix] ✅

> Phase Feature Set Overview:
> Closes the two docs-vs-runtime contradictions surfaced by the documentation
> coherence audit. The `agent_keys` ledger currently stores `lb-` keys in
> plaintext while every spec claims hashes-only — the ledger is brought to
> spec: migration 0004 adds `key_hash`, hashes existing keys in place (live
> keys keep authenticating), and the plaintext column is retired; minted keys
> are returned exactly once and never persisted raw. The server-side hardcoded
> pod is purged: `DEFAULT 'Personal'` is dropped from all four category columns
> and the `category || 'Personal'` fallback is removed from every vault route —
> the UI's zero-hardcoded-pods invariant (Phase 8) finally reaches the Bedrock.
> *(Receipts: `7faf51d` — Tasks 33 & 34, `027506a` — release prep + tag `v0.0.1.9`, merge `9b5ec31` — 2026-09-13. Released & live.)*

- [x] **Task 33: [Functionality] Agent Key Hash Ledger & Pod Default Purge**

Description: Add `agent_keys.key_hash` via `migrations/0004_key_ledger.{up,down}.sql`
— at migration time, every existing plaintext `api_key` is SHA-256 hashed in
place so live keys keep authenticating; the plaintext column is then retired.
Update `requireAuth` (agent path), the `/api/auth/token` sentinel search, and
`agentKeys.ts` mint/list to store and compare **hashes only** via
`constantTimeCompare`; minted plaintext is returned exactly once. Purge the
hardcoded pod: drop `DEFAULT 'Personal'` from the `category` columns of
`vault_pearls`, `vault_secure_notes`, `vault_ssh_keys` and
`vault_secure_attachments`, and remove the `category || 'Personal'` fallback
from `vault.ts`, `notes.ts`, `sshKeys.ts` and `attachments.ts` — the default
becomes `""` (uncategorized), matching the client's `normalizePod()`
semantics. Zod schemas pass `category` through unmodified. Prove it in
`tests/agent-key-hash.test.ts` (hash-only storage, pre-migration key still
authenticates, plaintext returned once, revoke/expiry unchanged) and extend
`tests/vault-crud.test.ts` with uncategorized-default assertions.

> Success Criteria: A raw DB dump contains no plaintext `lb-` keys; a
> pre-migration key still authenticates after migration; a minted key's
> plaintext is returned exactly once and never stored; a fresh vault renders
> zero pods and `""` categories stay `""` (no "Personal" resurrection);
> the full test oracle passes.

- [x] **Task 34: [UI Component] Key Fingerprint Display & Pod Purity Confirmation**

Description: Update `LobsterKeysTab.tsx` to render a SHA-256 fingerprint
(first 8 hex chars + `…`) on every key card instead of any key material, with
a one-time "keys secured" notice after the ledger migration. Confirm pod
purity end-to-end: `SidebarFolderTree.tsx` and `ItemFormModal.tsx` render zero
phantom pods on a fresh boot, unassigned items show the uncategorized chip,
and no code path re-introduces a default category. Sync the ledger change
across `key-hierarchy-spec.md` receipts, `ARCHITECTURE.md` and `SECURITY.md`.

> Success Criteria: Key cards show fingerprints, never key material; a fresh
> vault stays at zero pods through create → delete → reload; the docs match
> the runtime (docs = app); the full test oracle passes.

---


## Phase 15: `sgtotp.bak` Import Compatibility Layer [v0.0.1.7 (Build 16)]

> Phase Feature Set Overview:
> The bridge completes. The web vault learns to open its Android sibling's
> backups: `sgtotpBackup.ts` parses the `sgtotp.bak` format (encrypted
> `shellguard-totp-backup-v1` envelopes, plaintext exports, bare item
> arrays), decrypting client-side via HKDF-SHA256 (salt = `ownerUuid`,
> AAD `totp_backup:{ownerUuid}`) + AES-GCM-256 through the **pure TS
> fallback primitives** (LAN-safe), with the enforced SHA-256 checksum over
> the exact decrypted string. Items map to fresh-UUID vault pearls,
> `normalizePod()` categories, original timestamps preserved;
> `ImportExportView` sniffs formats with the PIN/key modal. Companion work:
> the **strict RELEASE-doc mirror** in `release.yml` (exact-version
> resolution, hard fail, no auto-notes), the dynamic theme engine with
> multi-accent support, `AGENTS.md` for the Gemini identity in the Android
> companion tree, and the landing-header dark-mode brand fix.
> *(Receipts: `138952b`, `b0fcc47`, `7054595`, `074eab0`, `7b7a90c`,
> `68da985`, `0b259f7`, `2d7d9a2`, `b125fab`, `fc7e9df`, merge `c6d17d8` —
> 2026-08-30 → 09-03. Contract source of truth: `compatibility_layer.md`.)*

- [ ] **Task 29: [Functionality] `sgtotpBackup.ts` Parser, Client-Side Decryption & Timestamp Preservation**

Description: Implement the parser/mapper in `src/lib/sgtotpBackup.ts` —
contract mirrored from the Android `BackupManager.kt` +
`ShellCryptionEngine.kt`: sniff encrypted `shellguard-totp-backup-v1`,
plaintext `shellguard-totp-plain-export-v1`, or bare `BackupItemDto[]`;
decrypt envelopes client-side (HKDF-SHA256: ikm = export key, salt =
`envelope.ownerUuid`, info = `clawchives-shellcryption-v1` → AES-GCM-256,
AAD `totp_backup:{ownerUuid}`) using the pure TS fallback primitives; verify
the SHA-256 checksum over the exact decrypted item-array string (post-decrypt,
byte-reproducible). Map items to vault pearls with **fresh UUIDs**,
`normalizePod()` categories, `algorithm`/`digits`/`period` passthrough, and
**original `localUpdatedAt` preserved** as `created_at`. Prove the full
crypto round-trip in `tests/unit/sgtotpBackup.test.ts` (encrypted fixture,
plaintext, bare array, checksum mismatch, AAD tamper). Write
`compatibility_layer.md` as the cross-project format contract.

> Success Criteria: All three input formats import correctly on HTTP LAN
> origins; a checksum mismatch or AAD tamper aborts before persistence;
> imported seeds re-encrypt under `vault_pearls_totp:{id}`; timestamps
> survive the journey; Android ids are never reused.

- [ ] **Task 30: [UI Component] ImportExportView Format Sniffing, Key Modal & Strict Release Mirror**

Description: Extend `ImportExportView.tsx`: detect sgtotp formats on file
selection, prompt for the export key/PIN via a modal for encrypted
envelopes, show the imported-count preview, and commit through the parser
with sanitized errors. In CI: rewrite `release.yml` to the **strict
RELEASE-doc mirror** — exact-version `RELEASE-<tag>.md` resolution with hard
failure (no auto-notes, no fallback) so the GitHub Release body is the
RELEASE file verbatim. Implement the dynamic theme engine (adaptive
light/dark + multi-accent support) in the client; add `AGENTS.md` for the
companion's Gemini identity; fix the landing header's dark-mode brand
divider; molt the RELEASE file and cut `v0.0.1.7`.

> Success Criteria: Encrypted backups import via the key modal with
> sanitized failure modes; the GitHub Release body matches the RELEASE file
> byte-for-byte or the pipeline fails loudly; themes switch live across
> light/dark and all accents; the bridge is usable end-to-end on LAN.

---


## Phase 16: Docs Bridge Parity, Agentic Infrastructure & Version Resolver [v0.0.1.8 (Build 17) — Summit]

> Phase Feature Set Overview:
> The walk ends where the application stands today — and the documentation
> system becomes a first-class citizen. The project scaffolds its agentic
> knowledge infrastructure: a comprehensive memory bank (including a
> dedicated `android/` sub-bank mirroring the companion's crypto, Room
> schema, TOTP engine and UI models), workflow templates, and formalized
> agentic rule sets — then synchronizes release-pipeline invariants and
> formalizes agent git tracking. The **dynamic version resolver**
> (`src/server/utils/version.ts`) replaces fragile env reads with
> `package.json` ground truth (multi-tier fallback, unit-tested). The
> official privacy policy and TOTP store disclosures land; the VitePress
> companion suite publishes; two-sided bridge parity is achieved across
> root documentation; the release pipeline gains optimized triggers and a
> chained mirror job; the installation guide moves to placeholder IPs; and
> the rolling RELEASE file molts to `v0.0.1.8`.
> *(Receipts: `ddc35f5`, `124e4ab`, `80babe5`, `acab2ab`, `700c18c`,
> `1244c5f`, `e61675b`, `bbcc2f5`, `a68008f`, `70d7d46`, `ec4e136`,
> `0b6ad1f`, `82616f2`, merge `66d9ca4` — 2026-09-04/05. The walk and the
> codebase now occupy the same commit.)*

- [ ] **Task 31: [Functionality] Agentic Knowledge Infrastructure & Dynamic Version Resolver**

Description: Initialize the project scaffolding for agent collaboration: a
comprehensive memory bank under `.agents/memory-bank/` — core files plus a
dedicated `android/` sub-bank (api-client, crypto-spec, room-schema,
totp-engine, ui-compose-models) mirroring the companion's internals —
workflow templates, and agentic rule sets (attractor beacon, git hygiene,
docs hygiene, continuous improvement). Synchronize release-pipeline
invariants and formalize agent git tracking (two-layer commit grammar,
staged-index discipline, verification gates). Implement
`src/server/utils/version.ts` — `getAppVersion()` resolving dynamically
from `package.json` with multi-tier fallback, replacing fragile env reads
in `admin.ts`, `backupManager.ts` and `server.ts`; prove it with
`tests/unit/version.test.ts` (semver compliance + package ground-truth
match).

> Success Criteria: The version presented in the SuperLobster panel, backups
> and API always equals `package.json`; the resolver survives a missing env
> var; the memory bank loads a cold agent into full project context; the
> android/ sub-bank mirrors the companion's spec truth.

- [ ] **Task 32: [Documentation Component] Privacy Policy, Docs Bridge Parity & Chained Mirror Release**

Description: Publish the official privacy policy (`docs/privacy.md` —
zero-knowledge disclosures compliant with Play Store requirements) with
store disclosures cross-linked into the VitePress portal and CHANGELOG.
Publish the ShellGuard-TOTP native companion documentation suite
(`docs/companion/`: topology, security, sync-and-backups, totp-engine).
Achieve two-sided bridge parity: every root doc (`ARCHITECTURE.md`,
`BLUEPRINT.md`, `SECURITY.md`, `README.md`, `ADMIN.md`, `CONTRIBUTING.md`,
docs portal) reconciled to runtime schema truth. Optimize `release.yml`
triggers and chain the mirror job (release body re-syncs when the RELEASE
file changes on main). Move the installation guide to placeholder IPs.
Molt the RELEASE file to `v0.0.1.8` and cut the release through the
`--release` commit-flag path.

> Success Criteria: The docs claim nothing the runtime doesn't do — both
> sides of every bridge verified; the privacy policy renders in the portal
> and satisfies store disclosures; a RELEASE-file edit on main re-syncs the
> published release body; the summit tag exists.

---

## 🏛️ Historical Archive (Phases 1 through 13)

Earlier development phases (`v0.0.0.0` void through `v0.0.1.5` Build 14) are permanently archived in:
👉 **[`ROADMAP-HISTORY.md`](.agents/memory-bank/ROADMAP-HISTORY.md)**

| Phase | Version | Milestone Summary | Tasks |
|:---|:---|:---|:---|
| **Phase 1** | `Baseline: v0.0.0.1 (Build 2)` | Scaffold, Auth & API Molt | Tasks 01 & 02 |
| **Phase 2** | `Baseline: v0.0.0.2 (Build 3)` | SQLite Bedrock, Security Kernel & Identity Bridge | Tasks 03 & 04 |
| **Phase 3** | `Baseline: v0.0.0.3 (Build 4)` | Vault CRUD, Opacity Invariant & Lobster Keys | Tasks 05 & 06 |
| **Phase 4** | `Baseline: v0.0.0.4 (Build 5)` | Test Oracle, Hardened Rekey & Container Deployment | Tasks 07 & 08 |
| **Phase 5** | `v0.0.1 (Build 6) — Genesis` | Per-Row Metadata Encryption & Port Molt | Tasks 09 & 10 |
| **Phase 6** | `Baseline: v0.0.0.5 (Build 7)` | SuperLobster Admin Plane & Failsafe Backups | Tasks 11 & 12 |
| **Phase 7** | `Baseline: v0.0.0.6 (Build 8)` | Multi-Account Architecture, QuickLogin & Landing Gateway | Tasks 13 & 14 |
| **Phase 8** | `Baseline: v0.0.0.7 (Build 9)` | Vault UX Renaissance — Pods, Lock Hardening & NavIntent | Tasks 15 & 16 |
| **Phase 9** | `v0.0.1 (Build 10)` | Genesis Release, Origin-Safety Fallbacks & Version Alignment | Tasks 17 & 18 |
| **Phase 10** | `v0.0.1.2 (Build 11)` | Deployment Hotfixes, Dev-Loop Rules & Rolling RELEASE File | Tasks 19 & 20 |
| **Phase 11** | `v0.0.1.3 (Build 12)` | Release Publishing CI, SVG Iconography & Doc Re-Alignment | Tasks 21 & 22 |
| **Phase 12** | `v0.0.1.4 (Build 13)` | Pure-TS WebCrypto Fallback Engine & Release Gating | Tasks 23 & 24 |
| **Phase 13** | `v0.0.1.5 (Build 14)` | Bitwarden-Style Custom Fields & Dynamic Linked Properties | Tasks 25 & 26 |
| **Phase 14** | `v0.0.1.6 (Build 15)` | Native LAN TLS, TOFU & --release Publishing | Tasks 27 & 28 |

---
