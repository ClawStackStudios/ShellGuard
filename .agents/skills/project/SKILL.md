---
name: project
description: Deterministic modular specification and build harness for ShellGuard. Pairs feature-activity screen modules and ground-truth core specifications with a sliding release stage timeline and Dual-Testing Teamwork gates.
---

# Project Skill — Modular Specification & Build Harness

> **Core Axiom:** `modules/<activity>/spec.md` holds the surface, component, and interaction invariants; `specs/<domain>/*.md` holds the ground-truth cryptographic, relational, network, and administrative specifications; and `stages/stage-XX/prompt.md` holds the active 2-task execution slice governed by **Dual-Testing Teamwork**.

## 1. The Dual-Channel & Dual-Testing Execution Protocol

When building or modifying any stage or feature activity in ShellGuard, execute four deterministic steps:
1. **Locate the Target Slice:** Read [`meta-prompt-antigravity.md`](./meta-prompt-antigravity.md) (and [`ROADMAP-ERA2.md`](./ROADMAP-ERA2.md)) to identify the active leading-edge directory in `stages/` (the lowest-numbered directory), or navigate directly to the relevant feature-activity directory in `modules/`.
2. **Inspect the Component & Spec Oracles First (`view_file`):** Every `stages/stage-XX/prompt.md` and `modules/<activity>/spec.md` links to its target React components (`src/components/**`), server routes (`src/server/**`), and domain specifications in `specs/`. Invoke `view_file` on the linked oracles **before writing any code** so every trust boundary, schema, and UI control is locked.
3. **Execute the 2-Task Slice:** Every stage (and sub-stage) pairs **Task A [Functionality / Security Engine]** with **Task B [UI Component & Walk-the-Docs]**. Every clause is **Generative** (unfolds across UI, `restAdapter`, Zod schemas, Express 5 routes, and SQLite Bedrock), **Falsifiable** (omitting a clause fails a specific Vitest or build-gate assertion), and **Decompressible**.
4. **Verify via Dual-Testing Teamwork & Molt ("Built for the Delete Key"):**
   - **Agent Gate:** Run the local static typecheck (`npm run lint`), push to a scoped branch for GitHub Actions Cloud CI verification (`gh run watch` — never run heavy `npm test` or `npm run build` locally on host), and present the **Live Verification Checklist**.
   - **Human Gate (Lucas):** Performs physical live verification in the running application/terminal and signs off.
   - **Molt:** Upon stage completion and merge to `main`, prune **ONLY the completed `stages/stage-XX/` directory** (`modules/` and `specs/` remain permanent ground truth).

## 2. Three-Pillar Directory Cartography

```text
.agents/skills/project/
├── SKILL.md                                           # Entrypoint & Dual-Testing Execution Protocol
├── meta-prompt-antigravity.md                         # Sliding release router & stage-to-module/spec index
├── ROADMAP-ERA2.md                                    # Era 2 master schedule & 2-task phase ledger
│
├── modules/                                           # PILLAR 1: Feature-Activity Screen Modules (13 Modules)
│   ├── 01-auth-gateway/spec.md                        # -> LandingView, SetupView, AuthGateway, Share Invites
│   ├── 02-vault-workspace/
│   │   ├── 01-shell-and-list/spec.md                  # -> VaultShell, SidebarFolderTree, ItemListPane, Search
│   │   ├── 02-item-detail-and-totp/spec.md            # -> ItemDetailPane (Logins, Cards, Identities, Notes, Keys)
│   │   ├── 03-item-form-and-custom-fields/spec.md     # -> ItemFormModal, CustomFields, TagSelectorInput
│   │   └── 04-lock-and-multi-account/spec.md          # -> QuickLoginModal, sessionManager, NavIntent, Retract
│   ├── 03-generator-suite/spec.md                     # -> GeneratorToolView, keyGen, totpUtils
│   ├── 04-lobster-keys/spec.md                        # -> LobsterKeysTab, 4-Step Wizard, Hash-Only Key Ledger
│   ├── 05-import-export-habitat/
│   │   ├── 01-bitwarden-and-dual-export/spec.md       # -> ImportExportView, bitwarden.ts, vaultExport.ts, sgtotp.bak
│   │   ├── 02-habitat-zip-and-ingestion-dock/spec.md  # -> habitatExport.ts, habitatImport.ts, AbyssalIngestionDock
│   │   └── 03-ephemeral-import-quarantine/spec.md     # -> Migration 0010 quarantine, auto-graduation, batch revert
│   ├── 06-settings/spec.md                            # -> SettingsView, ConfigSettingsView, Pod/Tag Color Engine
│   └── 07-superlobster-admin/
│       ├── 01-admin-gate-and-reef-status/spec.md      # -> SuperLobsterGate, Login, Status, Users, Settings, Audit, Backups
│       └── 02-transport-and-mobile-pairing/spec.md    # -> TlsManagementTab, Reef Handshake QR, Share Signups
│
├── specs/                                             # PILLAR 2: Ground-Truth Core Specifications
│   ├── architecture/architecture.md                   # System Role, Boundaries, Topology & Native LAN TLS
│   ├── crypto/
│   │   ├── key-hierarchy-spec.md                      # hu-, lb-, api-, and ik (instance.key) lifecycles
│   │   ├── encryption-layers-spec.md                  # Triple-layer model, metadataGuard, WebCrypto fallback
│   │   └── shellcryption-spec.md                      # Layer 1 HKDF-SHA256, AES-GCM-256 envelopes, AAD registry
│   ├── storage/
│   │   ├── database-schema.md                         # DATA_DIR layout, SQLite Bedrock DDL, audit segregation
│   │   └── import-export-spec.md                      # Backup intake, format sniffing & sgtotp.bak bridge
│   ├── network/routes-and-contracts.md                # Uniform envelope, REST endpoints, batch & SSE contracts
│   ├── admin/admin-suite-spec.md                      # SuperLobster threat model (T1-T2), admin API & rules
│   ├── ui/ui-ux-design-system.md                      # Reef Modernist tokens, master-detail & pairing surfaces
│   └── verification/verification-gates.md             # Test suites, per-suite isolation, build gates & release roll
│
└── stages/                                            # PILLAR 3: Sliding Release Timeline (Pruned on Merge)
    ├── stage-28.1-envar-core-crypto/prompt.md         # ACTIVE LEADING EDGE (Tasks 55 & 56)
    ├── stage-28.2-envar-network-tls/prompt.md         # Queued (Tasks 57 & 58)
    ├── stage-28.3-envar-storage-container/prompt.md   # Queued (Tasks 59 & 60)
    ├── stage-28.4-reactive-river-sse/prompt.md        # Queued (Tasks 61 & 62)
    ├── stage-29-dual-homed-magicdns/prompt.md         # Queued (Tasks 63 & 64)
    ├── stage-30-offline-delta-journal/prompt.md       # Queued (Tasks 65 & 66)
    ├── stage-31-p2p-direct-reef-sync/prompt.md        # Queued (Tasks 67 & 68)
    └── stage-32-hardware-enclave/prompt.md            # Queued (Tasks 69 & 70)
```
