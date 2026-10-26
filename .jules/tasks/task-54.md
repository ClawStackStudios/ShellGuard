# Task 54: SuperLobster Transport & Pairing Tab, Gateway Invite Lock & 4-Zone Docs

> **Milestone**: Stage 1 / Phase 27 (Task 54 of 54) — Era 2 Genesis
> **Domain**: Admin Transport UI, Reef Handshake Pairing QR, Share Signups Engine, Address Bar Sanitizer & 4-Zone Docs Parity
> **Target Branch**: `stage/phase-27-tls-control-plane`
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User: Lucas <lucas@clawstack.com>` / `AI: Google Jules <jules@google.com>`)

---

## 🎯 Objective & Architectural Seam

Implement the frontend user interface, mobile pairing experience, invite gateway handling, and 4-zone documentation parity for ShellGuard Phase 27:

1. **SuperLobster `Transport & Pairing` Tab (`src/components/Admin/TlsManagementTab.tsx`)**:
   - Add a new tab to `src/components/Admin/SuperLobsterPanel.tsx` with a key or shield icon (`ShieldCheck` / `Cpu`).
   - Structure into 3 cards:
     - **Card 1: Active TLS Status**:
       - Displays enabled/disabled badge (Emerald when enabled, Amber when disabled with helpful proxy note).
       - Displays SHA-256 cert fingerprint, active SANs list, and expiration date.
       - "Download Certificate (.pem)" button triggering browser download of `cert.pem`.
       - "Regenerate Certificate" button (confirm dialog) calling `POST /api/admin/tls/generate` with `{ extraHosts: [window.location.hostname] }`.
     - **Card 2: Reef Handshake Mobile Pairing**:
       - Renders pairing QR code for companion mobile apps.
       - QR content: `shellguard://pair?endpoint=${encodeURIComponent(origin)}&cert=${fingerprint}&instance=${instancePublicKey}`.
       - ⚠️ **SECURITY INVARIANT**: Must render QR code via `QRCode.toDataURL()` inside `<img src={dataUrl} />`. Never inject raw SVG or use `dangerouslySetInnerHTML`.
     - **Card 3: Share Signups (Admin Invite Engine)**:
       - Displays current public registration status badge (*"Public Signups: OPEN"* or *"Public Signups: CLOSED (Invite Only)"*).
       - Form to mint invites: TTL dropdown (`1 hour`, `6 hours`, `24 hours`, `7 days`) + optional label + "Create Invite" button.
       - On creation, opens a modal with 1-click "Copy Link" and scannable QR code.
       - Active Invites Table: lists label, relative expiration time, created at, and a "Revoke" button with confirmation.
       - ⚠️ **DECOUPLED ADMIN INVARIANTS**: The SuperLobster administrator can create invites at any time, even if `DISABLE_SIGNUPS=true` / `allow_signups=false`. Bespoke invites always unlock identity creation.

2. **Landing Gateway & Address Bar Sanitizer (`App.tsx`, `LandingView.tsx`, `SetupView.tsx`)**:
   - In `App.tsx`:
     - On mount, inspect `window.location.search` for `?invite=inv_...`.
     - If detected: store token in React state and immediately sanitize the address bar:
       ```ts
       window.history.replaceState({}, '', window.location.pathname);
       ```
     - Fetch `GET /api/public/signup-status?invite=${token}`.
   - In `LandingView.tsx`:
     - If `signupsAllowed === false`, hide or disable the "Hatch Identity" button and display: *"Registration is invite-only on this instance"*.
     - If a valid invite token exists, automatically advance to `SetupView.tsx`.
   - In `SetupView.tsx`:
     - Pass `inviteToken` in the payload to `POST /api/auth/register`.

3. **4-Zone Documentation Parity**:
   - **Zone 1 (Root Manifests)**:
     - Update `ARCHITECTURE.md` (§5 Transport Security + Delta #32).
     - Update `ADMIN.md` (§2 Threat Model & §3.1 table with TLS and invite actions).
     - Update `SECURITY.md` (Transport matrix, `instance.key` immutability, `DISABLE_SIGNUPS`).
     - Update `README.md` (Docker environment variables table).
     - Update `CHANGELOG.md` (`[Unreleased]` with Phase 27 entries).
     - Update `ROADMAP.md` (mark Phase 27 active, rolling window).
   - **Zone 4 (VitePress Portal)**:
     - Author `docs/deployment/https-tls.md`: Complete guide on Docker variables (`TLS_ENABLED`), bind mounts (`./data:/app/data`), internal mechanics, and TLS enabled vs disabled comparative matrix.
     - Author `docs/superlobster/transport.md`: Administrator guide for cert inspection, SAN reflection, and the Share Signups invite engine.
     - Author `docs/companion/pairing.md`: Mobile companion onboarding guide for scanning the Reef Handshake QR, the `"Allow ShellGuard Cert"` mobile toggle, and cert rotation healing.
     - Register the 3 new pages in `docs/.vitepress/config.ts`.
     - Verify `npm run docs:build` compiles cleanly with **0 broken markdown links**.

---

## 📁 Files in Scope
- `src/components/Admin/TlsManagementTab.tsx` (NEW)
- `src/components/Admin/SuperLobsterPanel.tsx` (MODIFY)
- `src/components/LandingView.tsx` (MODIFY)
- `src/components/SetupView.tsx` (MODIFY)
- `src/App.tsx` (MODIFY)
- `docs/deployment/https-tls.md` (NEW)
- `docs/superlobster/transport.md` (NEW)
- `docs/companion/pairing.md` (NEW)
- `docs/.vitepress/config.ts` (MODIFY)
- `ARCHITECTURE.md`, `ADMIN.md`, `SECURITY.md`, `README.md`, `CHANGELOG.md`, `ROADMAP.md` (MODIFY)
