# 🐚 ShellGuard — Era 2: The Distributed Reef & Mobile-First Fleet
### Master AI Studio Meta-Prompt Spine (Era 2: Phase 27+)

> **Era**: Era 2 — Distributed Sync, First-Class HTTPS Transport & Native Mobile Pairing  
> **Preceding Era**: Era 1 (Phases 1–26: The Bedrock & Web Vault) archived in [`.agents/internal/era-1-meta-prompt-ai-studio.md`](../.agents/internal/era-1-meta-prompt-ai-studio.md)  
> **Target Release Line**: `v0.0.2.9+`  
> **Authors**: Lucas & Antigravity  

---

## 🌊 Era 2 Architectural Thesis: The Mobile-First Inversion

In typical cloud vault architectures, mobile clients are second-class citizens retrofitted onto server-first designs. They struggle with self-signed TLS certificates on LANs, require fragile manual IP and fingerprint entry, and lack real-time synchronization.

**ShellGuard Era 2 inverts this paradigm.** The web server and native Android companion (`ShellGuard-Mobile`) operate as equal peers in a secure, sync-native relationship governed by **Four Cornerstones**:

1. **Cornerstone 1: The Reef Handshake (Zero-Touch CameraX Visual Pairing)**  
   The server generates an expressive vector pairing QR code encoding:  
   `shellguard://pair?v=1&lan=<url>&ts=<url>&fp=<sha256-hex>&ik=<instance-key-hex>&alias=<name>`  
   A single camera tap on the Android login screen securely ingests endpoints, extracts the certificate fingerprint, and pins the host identity.
2. **Cornerstone 2: The Instance Identity Anchor (Persistent Host Key & Self-Healing Proofs)**  
   `DATA_DIR/instance.key` stores a persistent EC P-256 host keypair that decouples certificate rotation from client trust. When leaf certificates rotate, the server signs an ECDSA rotation manifest (`certs/manifest.json`). Paired mobile clients verify rotation proofs and auto-heal pinned certificates silently without user friction.
3. **Cornerstone 3: Dual-Homed Network Mobility (LAN vs Tailscale Racing)**  
   Mobile clients dynamically race local LAN probes against Tailscale MagicDNS (`*.ts.net`), switching transports seamlessly and falling back to encrypted local Room/SQLCipher storage when offline.
4. **Cornerstone 4: Sync-Native Reactive River (Sub-50ms Real-Time Reconciliation)**  
   Authenticated Server-Sent Events stream (`GET /api/sync/events`) broadcasts real-time mutation markers (`{ domain, id, rev, action }`), keeping distributed clients in instant lockstep.

---

## 🧬 Required Specification Oracles for Era 2

Before executing any Era 2 stage, inspect the ground-truth specification genome in `project/`:
1. [`architecture.md`](./architecture.md) — §5 (Transport Security, The Reef Handshake, Instance Anchor, Dual-Homed Resolution, Reactive River).
2. [`key-hierarchy-spec.md`](./key-hierarchy-spec.md) — §1.4 (The Instance Identity Key `ik` / `instance.key`).
3. [`admin-suite-spec.md`](./admin-suite-spec.md) — §2, §4 (SuperLobster panel architecture, TLS endpoints & `TlsManagementTab`).
4. [`routes-and-contracts.md`](./routes-and-contracts.md) — §6 (Public TLS Manifest, Admin TLS Status/Generate, and Reactive River SSE wire contracts).
5. [`ui-ux-design-system.md`](./ui-ux-design-system.md) — §9 (SuperLobster Transport Hub, Bioluminescent Status Pills, and Vector SVG QR Card).
6. [`database-schema.md`](./database-schema.md) — §1 (DATA_DIR layout: `instance.key` mode `0o600` and `certs/manifest.json`).
7. Android Mobile Reference Corpus — `.agents/memory-bank/android/` (Application-Scoped Lazy DI, Room DAOs, KeyStore Enclave, RFC 6238 TOTP).

---

## 🌐 Stage 1 (Flagship): Phase 27 Prompt — SuperLobster TLS Control Plane, The Reef Handshake & Guided Mobile Pairing Hub [work-driven — provisional v0.0.2.9 (Build 31)]

> 🗺️ **Master Roadmap Reference**: See [`./ROADMAP-ERA2.md`](./ROADMAP-ERA2.md#phase-27-superlobster-tls-control-plane--guided-mobile-pairing-hub-work-driven-version--provisional-v0029-build-31)
> for complete specifications on **Task 53** and **Task 54**.
> **⚠️ Execution state**: QUEUED — executes immediately upon green-light from Lucas following Phase 26.
> 📚 **Documentation Impact**: Full 4-Zone Pre-Walked Documentation Suite:
> • `docs/deployment/https-tls.md` (NEW)
> • `docs/superlobster/transport.md` (NEW)
> • `docs/companion/pairing.md` (NEW)
> • `docs/.vitepress/config.ts` (sidebars & routes)
> • `docs/companion/index.md`, `security.md`, `sync-and-backups.md`
> • `docs/deployment/index.md`, `docker.md`, `unraid.md`
> • `ARCHITECTURE.md` §5 + Delta #32 · `ADMIN.md` §3.1 · `SECURITY.md` · `README.md` · `CHANGELOG.md`

Copy and paste this prompt to execute **Phase 27 (Tasks 53 & 54)** once green-lit:

```markdown
# PHASE 27 EXECUTION: SuperLobster TLS Control Plane & Guided Mobile Pairing Hub [v0.0.2.9 (Build 31)]

## 🎯 Objective
Transform ShellGuard's headless `tlsManager.ts` into a mobile-first transport control plane inside the SuperLobster panel (`/superlobster`). Implement the **Reef Handshake QR Pairing protocol** and the **Instance Identity Anchor** so Android mobile clients can pair in one camera tap and silently auto-heal through certificate rotations without developer friction. Execute a comprehensive **Walk-the-Docs** sweep across all 4 zones so documentation 100% bows to code.

## 📖 Reference Documentation & Roadmap
Before writing code, inspect:
- `project/architecture.md`: §5 (Transport Security & The Reef Handshake).
- `project/key-hierarchy-spec.md`: §1.4 (Instance Identity Key `ik`).
- `project/admin-suite-spec.md`: §2, §4 (SuperLobster panel architecture & admin routes).
- `project/routes-and-contracts.md`: §6 (TLS manifest & pairing endpoints).
- `project/ui-ux-design-system.md`: §9 (Transport indicators & QR vector container).
- `src/server/utils/tlsManager.ts`: Certificate generation, SAN IP collection, and fingerprint formatting.
- `server.ts`: Server startup, `TLS_ENABLED` evaluation, and port listening.
- `src/server/routes/admin.ts`: SuperLobster route authentication (`requireAdmin`) and audit logging.
- `ADMIN.md`: §3.1 (SuperLobster Panel scope) and §2 (Threat model).
- `.agents/workflows/walk-the-docs.md`: The 4 Documentation Zones.

Execute Phase 27 adhering strictly to the Strict 2-Task Pairing Law:

### Task 53: [Functionality] Instance Identity Key, Rotation Proof Engine & TLS Status API
- **Instance Identity Key (`src/server/utils/instanceKey.ts`)**:
  - Generate a persistent EC P-256 (`secp256r1`) keypair saved to `DATA_DIR/instance.key` with strict POSIX permissions `0o600`.
  - Persists across certificate regenerations; export public key in uncompressed hex format (`getInstancePublicKeyHex()`).
  - Provide signing function: `signWithInstanceKey(data: Buffer | string): string` (ECDSA-SHA256, DER-encoded hex).
- **Certificate Rotation Proof Engine (`src/server/utils/tlsManager.ts`)**:
  - Update `generateCertificate()` to produce a rotation manifest:
    `{ certFingerprint, timestamp, signature: signWithInstanceKey(certFingerprint + timestamp) }`.
  - Persist manifest to `DATA_DIR/certs/manifest.json`.
- **Public Proof & Admin Routes (`src/server/routes/admin.ts` & `src/server/routes/public.ts`)**:
  - `GET /api/public/tls-manifest`: Public unauthenticated endpoint returning `{ certFingerprint, instancePublicKey, timestamp, signature }`. Enables mobile clients to verify rotation proofs.
  - Return `X-ShellGuard-Rotation-Proof` HTTP response header containing the base64-encoded signed manifest.
  - `GET /api/admin/tls/status`: Returns current TLS state (`enabled`, `protocol`, `port`, `fingerprint`, `instancePublicKey`, `subjectAltNames`, `certExpiresAt`, `pairingUri`).
  - `POST /api/admin/tls/generate`: Triggers fresh certificate generation, signs new rotation proof, and returns updated pairing URI.
  - `GET /api/admin/tls/cert`: Streams public `cert.pem`. (Private `key.pem` and `instance.key` are strictly blocked from export).
- **Automated Verification**:
  - Author comprehensive integration suite `tests/tls-admin.test.ts` verifying:
    1. `instance.key` generated with mode 0o600 and immutable across cert regenerations.
    2. Public manifest returns valid ECDSA signature verifiable by instance public key.
    3. Certificate regeneration updates manifest signature without altering instance public key.
    4. Admin endpoints require admin token; private keys are never exportable via HTTP.

### Task 54: [UI Component & Walk-the-Docs] SuperLobster Transport Hub, Reef Handshake QR Modal & Full Documentation Parity
- **SuperLobster Control Plane UI (`src/client/views/admin/tabs/TlsManagementTab.tsx`)**:
  - Add "Transport & Mobile Pairing" section in the SuperLobster admin panel (`/superlobster`).
  - Real-time status indicators: display `🟢 Active HTTPS (TLS 1.3)` or `🟡 Cleartext HTTP (LAN Only)` badge, active port, and colon-delimited monospace SHA-256 certificate fingerprint with one-click copy.
  - **Reef Handshake Pairing Card**:
    - Embedded Vector SVG QR Code rendering the `shellguard://pair` URI schema:
      `shellguard://pair?v=1&lan=...&ts=...&fp=...&ik=...&alias=...`.
    - Dynamic Endpoint Badges: Visual chips for reachability vectors (`LAN IP: 192.168.x.x` and `Tailscale: *.ts.net`).
    - One-click "Copy Pairing String" with active toast feedback.
    - "Pair ShellGuard Mobile" instruction pill: *"Open ShellGuard Mobile → Tap Scan QR on login screen."*
  - **Action Toolbar**:
    - "Download Certificate (.pem)" button for public cert export.
    - "Regenerate Self-Signed Cert" button guarded by `ConfirmDialog` modal.
- **Systematic Documentation Walk Across All 4 Zones**:
  - **Zone 1 (Root Docs)**:
    - `ARCHITECTURE.md`: Expand Section §5 (Built-in TLS 1.3 engine, Reef Handshake URI, Instance Identity Anchor) and append Architectural Delta #32.
    - `ADMIN.md`: Update Section §3.1 table with TLS and mobile pairing capabilities, and document key immutability in §2 Threat Model.
    - `SECURITY.md`: Update Transport Security Matrix (LAN HTTPS + pinned certs) and document ECDSA rotation proof safe harbor.
    - `README.md`: Update feature highlights with Reef Handshake and add `TLS_ENABLED` configuration guidance.
    - `CHANGELOG.md`: Record Phase 27 deliverables under `## [Unreleased]`.
  - **Zone 2 (The Specs Genome)**:
    - Verify `project/` oracles bow 100% to implementation code.
  - **Zone 3 (Skills & Agent API)**:
    - Update `skills/shellguard/SKILL.md` and `docs/agent-integration/api-reference.md`.
  - **Zone 4 (VitePress Documentation Portal)**:
    - Author `docs/deployment/https-tls.md` ("First-Class HTTPS & Built-in TLS Engine").
    - Author `docs/superlobster/transport.md` ("Transport Control Plane & Mobile Pairing").
    - Author `docs/companion/pairing.md` ("The Reef Handshake & Visual Mobile Pairing").
    - Update `docs/.vitepress/config.ts` (add sidebars and navigation links for all three new pages).
    - Update `docs/companion/index.md`, `security.md`, and `sync-and-backups.md`.
    - Update `docs/deployment/index.md`.
- **Pre-Flight Verification Gates**:
  - `tests/unit/docsLinks.test.ts` (100% green, 0 broken links across VitePress portal).
  - `tests/unit/mermaidDiagrams.test.ts` (5/5 green).
  - `npm run docs:build` (compiles all 39+ pages cleanly).
  - `npm test`, `npm run lint`, and `npm run build` pass 100% green.

Verify that generating a certificate updates the displayed QR code and fingerprint, the public manifest returns a valid cryptographic signature under the instance key, paired mobile verification succeeds, and all tests and documentation gates pass!
```

---

## 🌊 Era 2 Active Forward Queue

The roadmap for Era 2 extends from the mobile pairing control plane into a fully distributed multi-device fleet:

- **Stage 1 (Phase 27)**: SuperLobster TLS Control Plane & Guided Mobile Pairing Hub (`v0.0.2.9 / Build 31`)
- **Stage 2 (Phase 28)**: Sync-Native Reactive River — Authenticated Server-Sent Events (SSE) Stream & Sub-50ms Mutation Reconciliation (`GET /api/sync/events`)
- **Stage 3 (Phase 29)**: Dual-Homed Network Resolution Engine — Client-Side Latency Probing & Tailscale MagicDNS Mesh Integration
- **Stage 4 (Phase 30)**: Offline Encrypted Delta Journal — Room + SQLCipher Sync Queue & Bi-Directional Conflict Resolution
- **Stage 5 (Phase 31)**: Android Hardware Enclave Anchoring — Android StrongBox / TEE KeyStore & Biometric Hardware Gateways
- **Stage 6 (Phase 32)**: P2P Multi-Reef Mesh — Distributed Grotto Sync Across Independent Nodes
