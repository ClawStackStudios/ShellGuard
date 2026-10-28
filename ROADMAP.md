---
roadmap_version: 2.0.0
last_updated: 2026-10-28
current_position: "v0.0.2.9 (Build 31) — released & live; next Phase 28: Mobile Offline Biometric Vault, P2P Sync & Reactive Rivers (provisional v0.0.3.0 / Build 32) — queue 28 → 29 → 30"
statistics:
  description: "Deterministic build roadmap for ShellGuard (web secrets vault). Engineered strictly in synergistic 2-task phases where Task A delivers core functionality/security and Task B delivers the corresponding UI/interactive component."
  features_completed: "█████████████████████████ 100% (27 of 27 formalized phases)"
  features_in_progress: "░░░░░░░░░ 0%"
---

# 🛡️ ShellGuard©™ Roadmap

*Where the reef has been, and where it molts next.*

> **SLIDING-WINDOW ACTIVE ROADMAP (3-VERSION ROLLING WINDOW)**
> *Preserves the Active Forward Queue (Phase 28+) and the 3 most recent completed phases (Phases 25, 26, and 27).*
> *Historical Phases 1 through 24 are archived in [`ROADMAP-HISTORY.md`](.agents/brain/ROADMAP-HISTORY.md).*

---

### 🏷️ Work-Driven Versioning Policy: `MAJOR.MINOR.PATCH.REVISION` (`X.Y.Z.N`)

- **Current Production Release**: `v0.0.2.9 (Build 31)`
- **Next Planned Milestone**: `v0.0.3.0 (Build 32)` (Phase 28)
- **Version Grammar**: Every release increments REVISION or PATCH based on structural gravity.
- **Strict 2-Task Pairing Law**: Every phase consists strictly of **Task A [Functionality / Security Engine]** followed immediately by **Task B [UI Component / Interactive State]**.
- **Rolling Window Discipline**: Only the 3 most recent completed phases remain in this root roadmap. When Phase 28 completes, Phase 25 rolls over into [`ROADMAP-HISTORY.md`](.agents/brain/ROADMAP-HISTORY.md).

---

## 🌊 Queue — Active Forward Phases (The Next Molts)

### Phase 28: Mobile Offline Biometric Vault, P2P Sync & Reactive Rivers [provisional v0.0.3.0 (Build 32)]

> Phase Feature Set Overview:
> Bridges ShellGuard from browser-first to mobile-first native sovereignty. Introduces a hardware-backed
> offline biometric credential vault (FaceID / Android StrongBox via WebAuthn PRF) and decentralized peer-to-peer
> sync over encrypted WebRTC/WebSockets ("Reactive Rivers") to synchronize grottos between desktop and mobile clients
> without reliance on third-party cloud infrastructure.

- [ ] **Task 55: [Security Engine] Mobile Biometric Enclave & Offline Delta Ledger**
  - Implement WebAuthn PRF / Android StrongBox cryptographic key wrapping for native client session unsealing.
  - Establish offline mutation delta ledger with vector clocks for conflict-free multi-device synchronization.
  - Zero-knowledge end-to-end transport encryption over direct WebRTC data channels.

- [ ] **Task 56: [UI Component] React Native / Mobile Biometric Vault Interface & Reactive River Sync**
  - High-performance, tactile Reef Modernist mobile interface optimized for thumb-reach and OLED deep blacks.
  - Biometric iris & touch prompt integration with instant haptic confirmation.
  - Reactive River sync status pill showing peer connection topology, encrypted delta streaming, and offline indicators.

---

## 🔬 Queue — Backlog & Distant Shores (Vision)

> Prioritized backlog items captured for future formalization into paired phases.

- [ ] **Auto-Lock "Retract" Animation** — Latch-closing visual confirmation and biometric iris animation when locking manually.
- [ ] **Monolith Decomposition** — Decompose `PasswordVaultView.tsx` (~2150 lines) and `App.tsx` (~1100 lines) into modular domain hooks and sub-components.
- [ ] **ShellCryption©™ v2 (Hardware Enclave)** — Hardware-backed key storage via WebAuthn PRF extension and Android StrongBox / Apple Secure Enclave.
- [ ] **Audit Reef Security Timeline** — Interactive user-facing security timeline visualizing agent access, secret usage, and anomalous patterns.
- [ ] **P2P Direct Sync** — Synchronize grottos across reefs without a central intermediary.

---

## 📜 Completed Releases (Sliding Window — Last 3 Completed Phases)

### Phase 27: SuperLobster TLS Control Plane, The Reef Handshake & Decoupled Share Signups [v0.0.2.9 (Build 31)] ✅

> Phase Feature Set Overview:
> Delivers an autonomous, zero-command cryptographic control plane and decoupled onboarding architecture.
> (1) **Zero-Command Native TLS (Task 53)**: In-process self-signed CA and ECDSA (`prime256v1`) certificate engine
> that auto-generates certificates in `certs/` on first boot with multi-domain SAN support, automated HTTP-to-HTTPS
> redirection (`80 -> 443`), and dynamic in-memory secure context hot-reloading (`httpsServer.setSecureContext`)
> via `POST /api/admin/tls/regenerate` with zero connection drops.
> (2) **SuperLobster Transport Hub & Reef Handshake QR Pairing (Task 54)**: Admin management sub-surface
> providing real-time TLS diagnostics, SHA-256 fingerprint inspection, cert expiry countdown, and decoupled invite
> code generation (`POST /api/admin/invites`, 15m TTL). Generates canonical share URLs and bioluminescent SVG QR codes
> for instant mobile camera pairing.
> (3) **Decoupled Share Signups & Atomic One-Time Burn (Tasks 53 & 54)**: Landing gateway auto-detects `?invite=tok_...`,
> immediately scrubs the secret token from the browser address bar via `history.replaceState`, locks out uninvited
> forms, and atomically burns the token upon user creation (`POST /api/auth/register-with-invite`) in a single
> SQLite transaction, permanently preventing multi-account replay.
> *(Receipts: Phase 27 Tasks 53 & 54, PR #11, 2026-10-28. Released & live.)*

> 📚 **Documentation Impact**: ADMIN.md (SuperLobster TLS management & invite codes) - ARCHITECTURE.md (Delta #32, routes, 33 suites) - CHANGELOG.md (0.0.2.9 Build 31) - README.md - SECURITY.md - docs/architecture/transport-security.md - docs/admin/superlobster.md - docs/user-journey/registration-login.md — ✅ synced.

- [x] **Task 53: [Security Engine] Native Zero-Command TLS, Self-Signed Certificate Authority & Ephemeral Invite Codes**

Description: Establish the autonomous cryptographic transport foundation and single-use invite ledger.
(1) Native TLS Engine `src/server/tls.ts`: Automatically generate self-signed ECDSA (`prime256v1`) certificates
with SAN support (`localhost`, `127.0.0.1`, LAN IPs), persist in `certs/`, and mount dual HTTP-to-HTTPS redirect listeners.
(2) In-Memory Context Hot-Reloading: Implement `POST /api/admin/tls/regenerate` writing fresh certs and calling
`setSecureContext(...)` dynamically without restarting the Node server.
(3) Single-Use Invite Code Engine: Implement `POST /api/admin/invites` (15m TTL, custom notes), `GET /api/invites/verify/:token`,
and `POST /api/auth/register-with-invite` executing atomic one-time token burn in SQLite.
(4) HTTPS & Origin Parity: Update `systemRoutes.ts` to recognize `TLS_ENABLED=true` and flag cookies `Secure`.
(5) Prove transport security, context hot-reloading, invite token lifecycle, and replay defense in `tests/tls-admin.test.ts`.

> Success Criteria: Server boots with TLS without manual OpenSSL commands; HTTP redirects to HTTPS; cert regeneration
> hot-reloads context cleanly; invite codes verify, pre-fill, and burn atomically on registration; reuse fails closed;
> full test oracle + `tsc` + build pass 100% green.

- [x] **Task 54: [UI Component] SuperLobster Transport Hub, The Reef Handshake QR Pairing & Share Signup Flow**

Description: Deliver the SuperLobster admin management plane and decoupled onboarding interface.
(1) SuperLobster View in Admin Panel: Add dedicated "SuperLobster" tab with live HTTPS indicator, protocol version,
SHA-256 cert fingerprint, valid domains, expiry countdown, and interactive certificate regeneration modal guarded by `ConfirmDialog`.
(2) The Reef Handshake Invite Generator: Modal to create 15-minute invite codes with custom notes, one-click share URL
clipboard copy (`https://<host>:<port>/?invite=tok_...`), and high-contrast bioluminescent SVG QR code modal for mobile camera scanning.
(3) Admin Invite Ledger: Real-time table displaying active vs burned invite tokens with live status countdown chips.
(4) Decoupled Share Signup Flow: Landing gateway auto-captures `?invite=tok_...`, scrubs query parameter from address bar,
validates token with server, pre-fills invite code, locks out non-invite forms, and transitions directly into the unlocked Grotto upon registration.

> Success Criteria: SuperLobster tab renders real-time TLS diagnostics and triggers zero-downtime cert regeneration;
> invite generator produces copyable URLs and scannable QR codes; invite ledger updates dynamically; landing gateway
> scrubs URL and atomically burns invite token on signup; full test oracle + `tsc` + build pass 100% green.

---

### Phase 26: Import Lifecycle Tracking, Ephemeral Retention Window & Batch Ingestion Quarantine [v0.0.2.8 (Build 30)] ✅

> Phase Feature Set Overview:
> Introduces an underlying organizational lifecycle and ephemeral tracking system for imported records
> across all vault types (passwords, notes, and SSH keys). Solves import remorse, accidental migrations, and
> foreign schema clutter by stamping records with an ephemeral `imported_at` timestamp and unique `import_batch_id`.
> Governed by a configurable Time-To-Live (TTL) retention window (30m, 60m, 90m, or manual), items maintain
> temporary imported status that automatically self-destructs into standard permanent records upon timer expiry.
> Implements "Auto-Graduate on Edit" (editing any imported item immediately adopts it and drops the ephemeral tag),
> cross-type parity, and progressive disclosure: the UI remains completely silent and visually clean with ZERO
> imported controls or banners visible unless active imported records are present in the vault. When active, surfaces
> bioluminescent countdown chips, quick filter toggles, a post-import action hatch in the import view, and one-click
> atomic batch revert/purge backed by Reef Modernist `ConfirmDialog` controls. Configurable via a dedicated "Config"
> settings surface.
> *(Receipts: Phase 26 Tasks 51 & 52, PR #10, 2026-10-24. Released & live.)*

> 📚 **Documentation Impact**: docs/vault-features/import-export.md (import lifecycle, batch fingerprinting & TTL self-destruct) - docs/vault-features/the-grotto.md (progressive disclosure & batch purge) - ARCHITECTURE.md (Import Ledger & Delta #31) - BLUEPRINT.md - reference/blueprint-schema.md - README.md — ✅ synced.

- [x] **Task 51: [Functionality] Ephemeral Import Ledger, Time-to-Live (TTL) Engine & Multi-Batch Tracking**

Description: Establish the Bedrock data layer and lifecycle engine for imported items.
(1) Database Migration `0010_import_lifecycle.{up,down}.sql`: add `imported_at TEXT` (ISO timestamp) and
`import_batch_id TEXT` (indexed UUID or prefixed hash `imp_<uuid>`) across `vault_pearls`, `vault_secure_notes`,
and `vault_ssh_keys`. Backfill defaults to NULL (existing items are permanently graduated).
(2) Import Ledger & Batch Stamping: Update `POST /api/vault/bulk-import` and individual note/key creation loops
to generate an atomic `import_batch_id` per ingestion event and stamp `imported_at = new Date().toISOString()`.
Ensure Layer 2 metadata encryption preserves these fields securely.
(3) TTL Expiration & Auto-Graduation Engine: Implement lazy and scheduled graduation logic. Items where
`now - imported_at > retention_minutes` have their imported status dropped seamlessly on retrieval and periodic
cleanup sweeps.
(4) "Auto-Graduate on Edit" Adoption Semantics: Updating an item (via `PUT /api/vault/:id`, `PUT /api/notes/:id`,
`PUT /api/keys/:id`) resets `imported_at = NULL` and `import_batch_id = NULL`, recognizing user adoption.
(5) Batch Operations API: Implement `POST /api/vault/import-batches/:id/graduate` (promotes all items in batch to
permanent) and `DELETE /api/vault/import-batches/:id` (atomic batch rollback purging items and cascading linked
attachments with audit logging).
(6) Prove zero-knowledge preservation, multi-type parity, and TTL self-destruct in `tests/vault-imported-tracking.test.ts`.

> Success Criteria: Bulk imports across pearls, notes, and SSH keys atomically receive matching `import_batch_id`
> and timestamps; items past the retention TTL automatically graduate to normal items; editing an item immediately
> clears its imported status; batch revert completely purges all batch records and linked attachments in a single
> transaction; full test oracle + `tsc` + build stay clean.

- [x] **Task 52: [UI Component] "Config" Settings Surface, Ephemeral Import Badges & Rapid Batch Purge**

Description: Deliver the progressive-disclosure UI layer across Settings, VaultShell, and ImportExportView.
(1) Progressive Disclosure Invariant: The UI is strictly silent with ZERO import-related filter chips, banners,
or batch options rendered UNLESS active items with unexpired `imported_at` flags exist in state.
(2) New "Config" Settings Surface: In `Sidebar.tsx` under settings mode, add a dedicated "Config" navigation tab
leading to `ConfigSettingsView.tsx`. Provide a Reef Modernist segmented button selector for Import Retention Window
(`[30 min | 60 min | 90 min | Manual / Never]`), an "Auto-Graduate on Edit" toggle, and local encrypted preference
persistence.
(3) Dynamic "Imported" Filter & Bioluminescent Badges: When active imported items exist, dynamically display an
"Imported" filter chip in `ItemListPane.tsx` showing active count and live countdown (`📥 Imported (42) • 58m left`).
In item list and detail panes, active records display pulsing bioluminescent chips (`📥 Imported`) with individual
"Graduate" and "Delete" actions.
(4) Post-Import Action Hatch & Rapid Batch Purge: In `ImportExportView.tsx` upon successful import (and in a floating
banner in `VaultShell.tsx` while viewing imported items), render an actionable hatch: direct button to "Review Items",
live TTL countdown, "Graduate All", and "Revert Import" (triggering an atomic batch rollback guarded by `ConfirmDialog`).
(5) Tri-state multi-select integration: selecting all under the "Imported" filter targets the batch for instant bulk
deletion or graduation.

> Success Criteria: No import-related badges or filters appear when no imported items exist (100% silent and clean);
> completing an import immediately surfaces the "Imported" filter, countdown chip, and action hatch; Config settings
> allow adjusting retention between 30/60/90m and manual; graduation and batch deletion function reliably with
> ConfirmDialog confirmation; full test oracle + `tsc` + build pass 100% green.

---

### Phase 25: Habitat Full-Archive Mobility & Reactive Ingestion Dock [v0.0.2.7 (Build 29)] ✅

> Phase Feature Set Overview:
> Elevates vault portability and user sovereignty to first-class status, 1-upping industry standards
> (such as Bitwarden's write-only attachment zip). Solves both halves of the attachment archive challenge:
> (1) **Habitat Archive Packaging (Task 49)**: A client-side, zero-knowledge streamed export engine that
> packages unencrypted or encrypted vault records alongside all decrypted binary attachments inside a
> single `.zip` archive. Prevents filename collision bugs via deterministic, human-readable directory
> structures (`attachments/<pod>/<item_title>__[<id_short>]/<file_name>`) backed by an embedded manifest
> in the JSON export.
> (2) **Two-Stage Ingestion Pipeline & Reactive Ingestion Dock (Task 50)**: Ingesting an archive splits
> into two phases to completely eliminate browser freezing and chore-like upload modal traps:
>   - **Stage 1 (Instant Vault Ingestion, <2s)**: Reads the ZIP's central directory, extracts the primary
>     vault JSON, and bulk-inserts all records atomically via `POST /api/vault/bulk-import`. Items immediately
>     appear in the user's dashboard and folder tree.
>   - **Stage 2 (Non-Blocking Reactive Ingestion Dock)**: Hands off attachment payloads to a persistent,
>     floating "Abyssal Ingestion Dock" in `VaultShell.tsx` that streams encrypted multipart uploads in the
>     background. Items with in-flight uploads render bioluminescent pulsing chips (`📎 Uploading 45%...`) that
>     transition to `📎 Verified` upon completion, with pause, cancel, and per-item retry ergonomics.
> *(Receipts: Phase 25 Tasks 49 & 50, 2026-10-20. Released & live.)*

> 📚 **Documentation Impact**: docs/vault-features/import-export.md (Habitat ZIP specification & ingestion dock) - docs/vault-features/attachments.md (archive mobility) - ARCHITECTURE.md (Two-Stage Ingestion Pipeline, Delta #30) - BLUEPRINT.md - README.md — ✅ synced.

- [x] **Task 49: [Functionality] Habitat ZIP Packaging Engine & Streamed Attachment Decryption**

Description: Implement client-side ZIP archive creation and attachment decryption in
`src/lib/habitatExport.ts`. When the user initiates a Habitat export, iterate through all
vault items with linked attachments; fetch encrypted BLOBs via `GET /api/attachments/:id/file`
using streamed chunking; decrypt each file in-memory using active session `shellKey`; stream
files into a browser ZIP writer (e.g. `client-zip` / `fflate` streaming reader/writer) with
constant bounded memory overhead (O(largest single file), never O(total archive)).
Establish a deterministic collision-proof directory layout:
`attachments/<pod>/<item_title>__[<id_short>]/<file_name>` with path-sanitization against path
traversal (`../`). Generate an embedded `attachment_manifest` inside the root
`shellguard_vault_export.json` mapping each attachment ID, file name, parent item ID, size,
and checksum. Auth-gated behind ClawKey verification.

> Success Criteria: Exporting a habitat with multiple attachments (including items sharing identical
> filenames) packages cleanly into a valid ZIP; memory footprint stays bounded; server never sees
> decrypted bytes (zero-knowledge); manifest accurately links every file to its parent; tests in
> `tests/unit/habitat-export.test.ts` verify round-trip packaging and zero collision overwrites;
> full test oracle + `tsc` + build stay clean.

- [x] **Task 50: [UI Component] Two-Stage Ingestion Pipeline & Reactive Abyssal Ingestion Dock**

Description: Deliver the universal archive ingestion interface in `ImportExportView.tsx` and
`VaultShell.tsx`.
(1) **Universal Zip Sniffer & Stage 1 Unpacker**: Dropzone accepts `.zip` or unzipped folders
(via `webkitdirectory`). Detects Habitat ZIP, extracts root JSON, displays breakdown in Batch
Import Preview modal (passwords, notes, keys, detected attachments count & total MB), and
immediately commits primary items via `POST /api/vault/bulk-import` (<2s), closing the modal.
(2) **Abyssal Ingestion Dock**: Minimized, floating Reef Modernist dock in `VaultShell.tsx`
(bottom-right viewport) displaying real-time background ingestion queue (`Ingesting Attachments • 3 of 12 completed (28%) [████░░░░]`).
Supports expand/collapse, pause, resume, cancel, and per-item retry.
(3) **Reactive Item State Synchronization**: In `ItemDetailPane.tsx` and `ItemListPane.tsx`,
items with attachments currently in the ingestion pipeline render glowing pulsing indicator
chips (`📎 filename (Uploading 45%...)`). Once an attachment's multipart upload completes and
links to the parent item, state updates reactively to verified ready state without page reload.
(4) `beforeunload` guard warns user if navigating away while background ingestion is active.

> Success Criteria: Dropping a Habitat ZIP restores primary vault items in under 2 seconds; background
> dock smoothly processes queued attachment uploads without freezing the UI or blocking vault browsing;
> in-flight attachment chips render real-time progress and transition to ready state; pause/cancel
> controls function reliably; full test oracle + `tsc` + build pass 100% green.

---

## 🏛️ Historical Archive (Phases 1 through 24)

Earlier development phases (`v0.0.0.0` void through `v0.0.2.6` Build 28) are permanently archived in:
👉 **[`ROADMAP-HISTORY.md`](.agents/brain/ROADMAP-HISTORY.md)**

| Phase | Version | Milestone Summary | Tasks |
|:---|:---|:---|:---|
| **Phase 1** | `Baseline: v0.0.0.1 (Build 2)` | Scaffold, Auth & API Molt | Tasks 01 & 02 |
| **Phase 2** | `Baseline: v0.0.0.2 (Build 3)` | SQLite Bedrock, Security Kernel & Identity Bridge | Tasks 03 & 04 |
| **Phase 3** | `Baseline: v0.0.0.3 (Build 4)` | Vault CRUD, Opacity Invariant & Lobster Keys | Tasks 05 & 06 |
| **Phase 4** | `Baseline: v0.0.0.4 (Build 5)` | Test Oracle, Hardened Rekey & Container Deployment | Tasks 07 & 08 |
| **Phase 5** | `Baseline: v0.0.0.5 (Build 6)` | Per-Row Metadata Encryption & Port Molt | Tasks 09 & 10 |
| **Phase 6** | `Baseline: v0.0.0.5 (Build 7)` | SuperLobster Admin Plane & Failsafe Backups | Tasks 11 & 12 |
| **Phase 7** | `Baseline: v0.0.0.6 (Build 8)` | Multi-Account Architecture, QuickLogin & Landing Gateway | Tasks 13 & 14 |
| **Phase 8** | `Baseline: v0.0.0.7 (Build 9)` | Vault UX Renaissance — Pods, Lock Hardening & NavIntent | Tasks 15 & 16 |
| **Phase 9** | `v0.0.1 (Build 10)` | Genesis Release, Origin-Safety Fallbacks & Version Alignment | Tasks 17 & 18 |
| **Phase 10** | `v0.0.1.2 (Build 11)` | Deployment Hotfixes, Dev-Loop Rules & Rolling RELEASE File | Tasks 19 & 20 |
| **Phase 11** | `v0.0.1.3 (Build 12)` | Release Publishing CI, SVG Iconography & Doc Re-Alignment | Tasks 21 & 22 |
| **Phase 12** | `v0.0.1.4 (Build 13)` | Pure-TS WebCrypto Fallback Engine & Release Gating | Tasks 23 & 24 |
| **Phase 13** | `v0.0.1.5 (Build 14)` | Bitwarden-Style Custom Fields & Dynamic Linked Properties | Tasks 25 & 26 |
| **Phase 14** | `v0.0.1.6 (Build 15)` | Native LAN TLS, TOFU & --release Publishing | Tasks 27 & 28 |
| **Phase 15** | `v0.0.1.7 (Build 16)` | `sgtotp.bak` Import Compatibility Layer & Strict Release Mirror | Tasks 29 & 30 |
| **Phase 16** | `v0.0.1.8 (Build 17)` | Docs Bridge Parity, Agentic Infrastructure & Version Resolver — Summit | Tasks 31 & 32 |
| **Phase 17** | `v0.0.1.9 (Build 20)` | Key Ledger Hardening & Pod Purity — Security Hotfix | Tasks 33 & 34 |
| **Phase 18** | `v0.0.2.0 (Build 20)` | Unified Bitwarden-Style Item Composition & In-Browser Keypair Generation | Tasks 35 & 36 |
| **Phase 19** | `v0.0.2.1 (Build 22)` | Attachment SQLite BLOB Migration & Streaming Architecture | Tasks 37 & 38 |
| **Phase 20** | `v0.0.2.2 (Build 24)` | Vault Tagging System & Granular Filter Bar | Tasks 39 & 40 |
| **Phase 21** | `v0.0.2.3 (Build 25)` | Bulk Import Endpoint & Batch Operations | Tasks 41 & 42 |
| **Phase 22** | `v0.0.2.4 (Build 26)` | Search Consolidation & Control Ergonomics | Tasks 43 & 44 |
| **Phase 23** | `v0.0.2.5 (Build 27)` | Bitwarden-Model Item Integrity & Attachment Relational Cascade | Tasks 45 & 46 |
| **Phase 24** | `v0.0.2.6 (Build 28)` | Cryptographic Audit Hardening & Third-Party Auditability | Tasks 47 & 48 |

---
