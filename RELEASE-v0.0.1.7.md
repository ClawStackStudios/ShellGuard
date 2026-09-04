# 🦞 ShellGuard — Release v0.0.1.7

## *Cross-Ecosystem Sovereign 2FA — Web Vault & Android Companion In Lockstep*

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

Welcome to **v0.0.1.7** of **ShellGuard**! This release cements full cross-ecosystem interoperability between the self-hosted ShellGuard web vault and our standalone companion application, [**ShellGuard-TOTP (Android)**](https://github.com/ClawStackStudios/ShellGuard-TOTP/releases). 

With the new `sgtotp.bak` client-side import engine, users can directly import mobile 2FA backups into the web vault. The system effortlessly parses encrypted `shellguard-totp-backup-v1` envelopes (via HKDF-SHA256 and AES-GCM-256 with AAD verification and SHA-256 integrity checksum enforcement), unencrypted `shellguard-totp-plain-export-v1` files, and bare JSON arrays. Imported seeds are sanitized, assigned fresh UUIDs, mapped into normalized user pods, and encrypted into standard vault pearls. Under our **One-Way Mirror Sync** architecture, these newly imported secrets seamlessly mirror back down to the Android app during subsequent sync cycles. 

This release also resolves strict TypeScript type invariants, formalizes cross-ecosystem documentation in `ARCHITECTURE.md` and `compatibility_layer.md`, embeds Gemini identity and architectural constraints in `AGENTS.md`, and verifies a 100% green test oracle across all 13 test suites.

---

## 💎 Key Themes & Highlights

### 📱 1. `sgtotp.bak` Import Compatibility Layer & Client-Side Decryption

* **Universal Format Sniffing:** `src/lib/sgtotpBackup.ts` auto-sniffs uploaded backup files to detect encrypted envelopes (`shellguard-totp-backup-v1`), structured plaintext exports (`shellguard-totp-plain-export-v1`), or bare JSON item arrays without leaking plaintext.
* **Pure Client-Side Zero-Knowledge Decryption:** Encrypted envelopes are decrypted strictly in the browser using pure TypeScript WebCrypto fallback primitives (`hkdfSha256` and `aesGcmDecrypt`). The user's export PIN or passphrase and unencrypted seeds never cross the network to the server.
* **Enforced AAD & Checksum Integrity:** Key derivation uses HKDF-SHA256 (`ikm = exportKey`, `salt = ownerUuid`, `info = "clawchives-shellcryption-v1"`). Decryption verifies AAD `totp_backup:{ownerUuid}` to eliminate substitution attacks, and strictly checks the SHA-256 hash of the decrypted payload against the envelope checksum.
* **Sanitization & Pod Normalization:** Base32 secrets are validated and stripped of whitespace and hyphens. Fresh web UUIDs are assigned to prevent ID collision, and category strings are passed through `normalizePod()` to ensure seamless integration into the user's existing pod hierarchy.
* **Interactive Export-Key Modal:** `ImportExportView.tsx` automatically detects encrypted `.bak` uploads and displays an interactive modal prompting for the export key before completing the client-side import.

### ☁️ 2. One-Way Mirror Sync Architecture

* **Isolated Local Codes:** Codes created directly on the Android device remain local (`isLocalOnly = true`), keeping mobile additions completely autonomous and isolated from upstream synchronization conflicts.
* **Downstream Mirroring:** The Android companion pulls remote `vault_pearls` via `GET /api/vault` as a read-only mirror, organizing them into a distinct `"☁️ Synced from ShellGuard"` dashboard group.
* **Ecosystem Bridge:** The mobile app exports *only* local codes into `sgtotp.bak`. Importing this file into the web vault elevates local mobile codes to sovereign vault pearls, which then mirror back down to all connected mobile clients.
* **Official Companion Release Links:** Integrated direct pointers to [ShellGuard-TOTP Releases](https://github.com/ClawStackStudios/ShellGuard-TOTP/releases) in `README.md`, `ARCHITECTURE.md`, and release documentation.

### 🛡️ 3. Repository Hygiene & Identity Governance

* **Identity Configuration (`AGENTS.md`):** Added explicit instructions and negative invariants governing Gemini/Antigravity behavior, memory-bank verification, and multi-agent orchestration limits.
* **Architecture Alignment:** Formalized the cross-ecosystem boundary in `ARCHITECTURE.md` and added `compatibility_layer.md` as the authoritative wire-format specification.
* **Clean Build Gates:** Cleaned up temporary Android spec files in the root repository to maintain clean separation between the web vault codebase and the native Android repository.

### 🧪 4. Complete Verification & Type Safety

* **22 Dedicated Unit Tests:** `tests/unit/sgtotpBackup.test.ts` validates format detection, encrypted round-trip decryption, wrong-key rejection, tampered checksum detection, AAD substitution prevention, Base32 normalization, and pod mapping.
* **100% Passing Test Oracle:** **202 tests passing across all 13 test suites** (0 failures).
* **Strict Type Safety:** Zero TypeScript compiler errors (`tsc --noEmit`) and a clean production Vite bundle.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────┐
│                 ShellGuard Web Vault (:6464)                │
│       • Sovereign single-source-of-truth for vault pearls   │
│       • Master ShellCryption key (hu-) in browser memory     │
│       • Full CRUD on logins, notes, SSH keys, attachments   │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ☁️ Read-Only Mirror│ (GET /api/vault)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              📱 ShellGuard-TOTP (Android Client)            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ "☁️ Synced from ShellGuard" (Read-Only Mirror Group)   │  │
│  │   • Downstream mirror of web vault TOTP records       │  │
│  │   • Offline cache in SQLCipher Room DB               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ "📱 Local Vault" (On-Device Codes, isLocalOnly = true) │  │
│  │   • Scanned QR codes & manual additions on device     │  │
│  │   • Hardware-backed Android KeyStore protection       │  │
│  │   • NEVER pushed upstream directly                    │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
              📦 sgtotp.bak    │ (Export Local Codes Only)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Web Vault Import Compatibility Layer            │
│       • Format sniffing: encrypted / plain / bare array     │
│       • Client-side HKDF + AES-GCM-256 decryption           │
│       • Enforced SHA-256 payload checksum verification      │
│       • Base32 sanitization, fresh UUIDs, pod normalization │
│       • Encrypted into vault_pearls (mirrors downstream)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Changes by Layer

| Component | Files | Description |
|:---|:---|:---|
| **Client Utilities** | `src/lib/sgtotpBackup.ts` | `sgtotp.bak` format sniffer, HKDF/AES-GCM client decryptor, AAD + checksum verification, and `mapSgTotpItemsToVaultItems` |
| **Settings UI** | `src/components/Settings/ImportExportView.tsx` | Export-key modal for encrypted `.bak` imports, file upload handler, and notification feedback |
| **Specifications** | `compatibility_layer.md` | Formal 2-way data interoperability specification and schema definitions |
| **Documentation** | `README.md`, `ARCHITECTURE.md` | Added ShellGuard-TOTP Android companion links, One-Way Mirror Sync topology, and updated version badges |
| **Tests** | `tests/unit/sgtotpBackup.test.ts` | 22 comprehensive unit tests covering cryptographic round-trips, tampered checksums, and parser edge cases |
| **Identity & CI** | `AGENTS.md`, `.github/workflows/release.yml` | Gemini identity rules and release document mirroring configuration |

---

## 📋 Commit Ledger (Since `v0.0.1.6`)

* `[pending]` — **chore:** prepare release v0.0.1.7 with ShellGuard-TOTP companion sync
* `09f4c57` — **feat:** sgtotp.bak import compatibility layer with ShellGuard-TOTP
* `68da985` — **feat:** add AGENTS.md configuration for Gemini identity and architectural constraints
* `7b7a90c` — **feat:** implement dynamic theme engine with adaptive light/dark mode and multi-accent support
* `074eab0` — **merge:** strict RELEASE-doc mirror in release pipeline
* `7054595` — **ci:** strict RELEASE-doc mirror in release pipeline
* `b0fcc47` — **chore:** remove outdated release notes for v0.0.1.5
* `138952b` — **docs:** add themed release notes for v0.0.1.6

---

## ⚡ Deployment & Upgrade Instructions

### Using Containerized Environments (Self-Hosted / Production)

```bash
docker pull ghcr.io/clawstackstudios/shellguard:v0.0.1.7
docker restart shellguard
```

### Upgrading from Source

```bash
git fetch --tags
git checkout v0.0.1.7
npm install
npm run build
npm run scuttle:prod
```

### Companion Android Client

Download the latest APK or release bundle for the standalone Android Authenticator from:
👉 **[ShellGuard-TOTP GitHub Releases](https://github.com/ClawStackStudios/ShellGuard-TOTP/releases)**

---

*The Code That Molts.*

**Maintained by ClawStack Mobile Studios©™ under AGPL-3.0 license.**