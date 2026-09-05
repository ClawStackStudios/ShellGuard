# 🦞 ShellGuard — Release v0.0.1.8

## *Canonical Compliance & Full Documentation Bridge Parity — Official Privacy Policy, Mobile Companion Portal, and Ground-Truth Architecture*

```text
███████╗██╗   ██╗███████╗██╗     ██╗              ██████╗   ██╗   ██╗   █████╗    ██████╗     ██████╗ 
██╔════╝██║   ██║██╔════╝██║     ██║              ██╔═══╝   ██║   ██║  ██╔══██╗  ██╔══██╗    ██╔══██╗
███████╗███████║█████╗   ██║     ██║              ██║ ███╗  ██║   ██║  ███████║  ██████╔╝    ██║   ██║
╚════██║██╔══██║██╔══╝   ██║     ██║              ██║   ██║  ██║   ██║  ██╔══██║  ██╔══██╗    ██║   ██║
███████║██║   ██║███████╗███████╗███████╗  ╚██████╔╝╚██████╝  ██║   ██║  ██║   ██║   ██████╔╝
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═════╝   ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═╝   ╚═════╝
                                                  ~ **ClawStack Mobile Studios©™** ~
```

---

## 🚀 The Core Summary

Welcome to **v0.0.1.8** of **ShellGuard**! This release establishes the official, canonical **Privacy Policy** required for Google Play Store compliance, introduces a dedicated **ShellGuard-TOTP Native Companion Documentation Portal**, and achieves 100% two-sided bridge parity between our runtime codebase and user documentation.

We resolved documentation drift across database schemas, published missing top-level index portals (`/vault-features/`, `/deployment/`, `/reference/`), documented Bitwarden-style custom fields, Native LAN TLS (`TLS_ENABLED=true`), and `.sgtotp.bak` Android backup decryption, and aligned the **3-Step Rapid Onboarding** lifecycle (Configure & Generate Keys &rarr; Start & Verify Container &rarr; Launch Vault & Molt Identity) across all documentation entry points.

---

## 💎 Key Themes & Highlights

### ⚖️ 1. Official Privacy Policy & Google Play Store Compliance

* **Canonical Hosting at `/privacy`:** Published the official privacy policy in the permanent VitePress portal (`docs/privacy.md`), publicly accessible via GitHub Pages for mobile app store review guidelines.
* **Dedicated ShellGuard-TOTP Specification (Section 5):** Added deep-link anchor `{#shellguard-totp-android-companion}` with a Google Play Data Safety Fast-Card table confirming zero data collection, zero analytics, zero trackers, and zero third-party sharing.
* **Hardware Permission Disclosures:** Detailed explicit technical scopes for `android.permission.CAMERA` (ephemeral in-memory frame analysis; zero frames saved to disk or cache), Biometrics (hardware enclave isolation via Android KeyStore with zero biometric credential leakage), and Storage Access Framework (scoped user-initiated `.sgtotp.bak` backup export/import without broad media permissions).
* **Display Shielding:** Documented `FLAG_SECURE` window protection blocking screen captures, screen sharing, and task-switcher previews.

### 📱 2. ShellGuard-TOTP Native Mobile Companion Documentation Suite

* **System Topology & Mirror Sync (`docs/companion/index.md`):** Formalized the One-Way Mirror Sync architecture distinguishing sovereign local tokens from read-only mirrored vault credentials with interactive Mermaid dataflow diagrams.
* **Hardware Security & KeyStore Enclaves (`docs/companion/security.md`):** Deep-dived into TEE and StrongBox Keymaster AES-GCM-256 key wrapping, `BiometricPrompt` zero-knowledge biometric isolation, memory zeroization, and auto-lock lifecycles.
* **Encrypted Backups Wire Format (`docs/companion/sync-and-backups.md`):** Specified the `shellguard-totp-backup-v1` envelope, HKDF-SHA256 derivation, AES-GCM-256 authenticated encryption with AAD (`totp_backup:{ownerUuid}`), and SHA-256 integrity verification.
* **RFC 6238 TOTP Engine (`docs/companion/totp-engine.md`):** Detailed the mathematical time-step algorithm ($T = \lfloor (t - T_0)/X \rfloor$), dynamic truncation, HMAC-SHA1/256/512 support, RFC 4648 Base32 sanitization, `otpauth://` URI parameter decoding, and CameraX + ML Kit barcode analysis.

### 🌉 3. Two-Sided Bridge Parity & Documentation Hubs

* **Top-Level Index Hubs:** Built missing portals for `docs/vault-features/index.md`, `docs/deployment/index.md`, and `docs/reference/index.md` to eliminate navbar 404s and provide clear `<CardGrid>` navigation.
* **Database Schema Ground Truth:** Reconciled `docs/reference/blueprint-schema.md` with runtime reality (`lobsters` table name, `agent_keys` table name, `id` primary keys, `custom_fields` column, and `audit_logs` in `audit.sqlite`).
* **Bitwarden-Style Custom Fields:** Documented `Text`, `Hidden`, `Checkbox`, and `Linked` field types with client-side ShellCryption AAD namespaces in `docs/vault-features/the-grotto.md`.
* **Native LAN TLS & WebCrypto Fallback:** Documented `TLS_ENABLED=true` (self-signed 10-year EC P-256 certificate generation with dynamic LAN SANs) and pure TypeScript `webCryptoFallback.ts` for non-secure HTTP LAN contexts.
* **Onboarding Alignment:** Realigned the **3-Step Rapid Onboarding** lifecycle (Configure & Generate Keys &rarr; Start & Verify &rarr; Launch Vault & Molt Identity) across `docs/index.md`, `docs/getting-started/quickstart.md`, and `docs/deployment/docker.md`.

### 🧪 4. Full Verification Loop & Test Stabilization

* **Sequential Test Isolation:** Configured `fileParallelism: false` in `vitest.config.ts`, eliminating port collisions and SQLite migration lock contention across full-suite test runs.
* **100% Green Test Oracle:** **202 unit and integration tests passing across all 13 suites** (0 failures, 1 skipped).
* **Zero-Warning Production Documentation:** VitePress build passes 100% clean with zero broken links and zero syntax warnings (`npm run docs:build` in 37.3s).
* **Strict TypeScript Type Safety:** Clean compilation with zero errors (`tsc --noEmit`).

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       🖥️ ShellGuard Web Vault (:6464)                       │
│  • Sovereign zero-knowledge vault for logins, notes, SSH keys, attachments  │
│  • Client ShellCryption (hu- master key) + Bitwarden-style Custom Fields    │
│  • Client-side sgtotp.bak format sniffing & HKDF/AES-GCM decryption engine  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                One-Way Mirror Sync    │ (GET /api/vault read-only cache)
                and .sgtotp.bak export │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 📱 ShellGuard-TOTP Android Companion                        │
│  • Hardware KeyStore (TEE / StrongBox AES-GCM-256)                          │
│  • BiometricPrompt unlock + FLAG_SECURE window screenshot suppression       │
│  • RFC 6238 TOTP Engine (HMAC-SHA1/256/512) + CameraX in-memory scanner    │
│  • Sovereign Local Codes exported to encrypted .sgtotp.bak archives         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Changes by Layer

| Component | Files | Description |
|:---|:---|:---|
| **Compliance & Privacy** | `docs/privacy.md` | Canonical Privacy Policy with Section 5 ShellGuard-TOTP Android store disclosures. |
| **Mobile Companion Docs** | `docs/companion/*.md` | 4 comprehensive guides: Index/Topology, Security, Sync & Backups, and RFC 6238 Engine. |
| **Index Portals** | `docs/{vault-features,deployment,reference}/index.md` | 3 new top-level documentation hubs with `<CardGrid>` navigation. |
| **Technical Reference** | `docs/reference/blueprint-schema.md`, `design-system.md`, `glossary.md` | Ground-truth database schemas, design tokens, 6 theme palettes, and lexicon glossary. |
| **Deployment & Ops** | `docs/deployment/docker.md`, `reverse-proxy.md`, `unraid.md` | Complete Docker Compose guide, Native LAN TLS, and Unraid setup. |
| **Onboarding** | `docs/index.md`, `docs/getting-started/quickstart.md` | Realigned 3-Step Rapid Onboarding lifecycle (Configure &rarr; Start &rarr; Launch). |
| **Navigation & Theme** | `docs/.vitepress/config.ts` | Added Mobile Companion nav, sidebar entries, and index routing. |
| **Test Stability** | `vitest.config.ts` | Configured `fileParallelism: false` for zero-contention test execution. |

---

## 📋 Commit Ledger (Since `v0.0.1.7`)

* `ddc35f5` — **docs:** add official privacy policy and ShellGuard-TOTP store disclosures
* `124e4ab` — **docs:** document privacy policy in CHANGELOG.md
* `80babe5` — **merge:** add official privacy policy and ShellGuard-TOTP store disclosures
* `acab2ab` — **docs:** add ShellGuard-TOTP native companion documentation suite
* `700c18c` — **merge:** add ShellGuard-TOTP native companion documentation suite
* `1244c5f` — **docs:** achieve two-sided bridge parity across documentation and runtime architecture
* `e61675b` — **merge:** achieve two-sided bridge parity across documentation and runtime architecture

---

## 🚀 Upgrade & Verification Instructions

### Upgrading via Docker / Unraid
```bash
docker pull ghcr.io/clawstackstudios/shellguard:v0.0.1.8
docker restart shellguard
```

### Upgrading from Source
```bash
git fetch --tags
git checkout v0.0.1.8
npm install
npm run build
npm run scuttle:prod
```
