# 🕸️ Stage 31 Execution Prompt — P2P Direct Reef Sync Across Independent Nodes

> **Milestone**: Provisional `v0.0.3.3 (Build 35)` — Phase 31 (Tasks 67 & 68)  
> **Execution Law**: Strict 2-Task Pairing (Task 67 [Functionality] + Task 68 [UI Component & Walk-the-Docs]).

---

## 📖 Context & Spec Oracles (Read First)

Before writing code, inspect:
- [`.agents/skills/project/specs/architecture/architecture.md`](../../specs/architecture/architecture.md): §5.2 (`instance.key` identity anchor) & §5.4 (Reactive River).
- [`.agents/skills/project/specs/crypto/key-hierarchy-spec.md`](../../specs/crypto/key-hierarchy-spec.md): §1.4 (`ik` EC P-256 Instance Identity Key).
- [`.agents/skills/project/specs/crypto/encryption-layers-spec.md`](../../specs/crypto/encryption-layers-spec.md): §1–§3 (Zero-knowledge opacity & metadata boundaries).

---

## 🛠️ Execution Tasks (Strict 2-Task Pairing)

### Task 67: [Functionality] Mutual Instance Key Authentication & Multi-Reef Grotto Replication

- **Peer Reef Replication Engine (`src/server/sync/peerReefSync.ts` & `src/server/routes/admin.ts`)**:
  - Enable two or more independent self-hosted ShellGuard Reef nodes to establish mutually authenticated peer replication channels signed by their respective `DATA_DIR/instance.key` (EC P-256) anchors.
  - Replicate opaque Layer 1 ShellCryption envelopes and native Grotto attachment blobs across paired nodes without either server ever possessing the client `hu-` key.
- **Automated Verification**:
  - Author `tests/peer-reef-sync.test.ts` proving mutual ECDSA peer handshake, owner-scoped envelope replication, and tamper rejection.

### Task 68: [UI Component & Walk-the-Docs] SuperLobster Peer Reef Topology Map & Sync Controls

- **Peer Reef Mesh Tab (`src/components/admin/PeerReefMeshTab.tsx`)**:
  - Add a **Peer Reef Mesh** management view inside `/superlobster` allowing administrators to pair secondary home-lab/offsite backup Reef nodes via `shellguard://peer` URIs, inspect replication lag, and trigger manual or continuous mirror sync.
- **4-Zone Walk-the-Docs**:
  - Synchronize `ARCHITECTURE.md`, `ADMIN.md`, `docs/superlobster/`, and `CHANGELOG.md`.
