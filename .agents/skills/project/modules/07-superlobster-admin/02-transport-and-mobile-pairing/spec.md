# 07.02 — SuperLobster Admin Plane: Native LAN TLS, Zero-Restart Hot-Reload & Mobile Pairing

[`TlsManagementTab.tsx`](../../../../../src/components/admin/TlsManagementTab.tsx), [`tlsManager.ts`](../../../../../src/server/utils/tlsManager.ts), and [`instanceKey.ts`](../../../../../src/server/utils/instanceKey.ts) govern the self-hosted transport armor and zero-touch mobile pairing hub. On initial boot, the server generates an immutable EC P-256 host identity anchor at `DATA_DIR/instance.key` (`0o600` permissions) and resolves TLS leaf certificates across three tiers (BYO `TLS_CERT_PATH`/`TLS_KEY_PATH` → persisted `DATA_DIR/certs/` → fresh 10-year EC P-256 self-signed pair covering `localhost`, loopback, and all non-internal LAN/Tailscale interfaces). Whenever a leaf certificate is generated or rotated via `POST /api/admin/tls/generate`, the server signs an ECDSA-SHA256 rotation manifest ($\text{instancePrivKey}$ over $\text{fingerprint} \parallel \text{timestamp}$), hot-swaps the active Node `https.Server` context in-place via `tlsServer.setSecureContext({ cert, key })` with zero downtime, and serves the proof at `GET /api/public/tls-manifest` and `X-ShellGuard-Rotation-Proof`.

To onboard ShellGuard Mobile without manual IP or fingerprint typing, `TlsManagementTab.tsx` renders **The Reef Handshake** SVG QR code encoding `shellguard://pair?v=1&lan=<url>&ts=<url>&fp=<sha256-hex>&ik=<instance-key-hex>&alias=<name>`, alongside reachability badges, public `cert.pem` download (`GET /api/admin/tls/cert`—private keys are strictly unexportable), and the **Share Signups** invite generator (`POST /api/admin/invites`, minting single-use `inv_` links with `1h | 24h | 7d` TTLs).

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/admin/TlsManagementTab.tsx`, `src/components/admin/SuperLobsterUsers.tsx`
- **Backend Routes & Crypto**: `src/server/routes/admin.ts`, `src/server/utils/tlsManager.ts`, `src/server/utils/instanceKey.ts`
- **Deep Specs**:
  - [Architecture Specification (§5 Native LAN TLS, §5.1 Reef Handshake, §5.2 Rotation Proof)](../../../specs/architecture/architecture.md)
  - [Key Hierarchy Specification (§1.4 Instance Identity Key `ik`)](../../../specs/crypto/key-hierarchy-spec.md)
  - [Reef Modernist UI & Design System (§9 Transport Hub & Pairing Surfaces)](../../../specs/ui/ui-ux-design-system.md)
- **Verification Oracles**: `tests/tls.test.ts`, `tests/instance-key-pairing.test.ts`, `tests/admin.test.ts`
