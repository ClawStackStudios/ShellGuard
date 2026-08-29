# 🦞 ShellGuard — Release v0.0.1.4

## *Pure Cryptographic Sovereignty & Unraid LAN Fallback Engine*

```
███████╗██╗  ██╗███████╗██╗     ██╗      ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
██╔════╝██║  ██║██╔════╝██║     ██║     ██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
███████╗███████║█████╗  ██║     ██║     ██║  ███╗██║   ██║███████║██████╔╝██║  ██║
╚════██║██╔══██║██╔══╝  ██║     ██║     ██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
███████║██║  ██║███████╗███████╗███████╗╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
                          ~ **ClawStack Mobile Studios©™** ~ 
```

---

## 🚀 The Core Summary

Welcome to **v0.0.1.4** of **ShellGuard**! This release implements an autonomous, zero-dependency pure TypeScript **WebCrypto Fallback Engine** (`src/lib/webCryptoFallback.ts`), resolving the browser limitation where `window.crypto.subtle` is undefined on non-secure HTTP origins (such as Unraid and local LAN deployments). We also fortified client-side drag-and-drop event handling and streaming downloads to ensure a rock-solid, zero-friction experience across all home-lab setups.

---

## 💎 Key Themes & Highlights

### 🛡️ 1. Pure TypeScript WebCrypto Fallback Engine

Browsers strictly disable `window.crypto.subtle` in non-secure HTTP contexts (e.g. `http://192.168.x.x:6464`), triggering `Cannot read properties of undefined (reading 'digest')`.

* **Universal SHA-256 & HMAC:** Implemented pure TypeScript FIPS 180-4 SHA-256 and RFC 2104 HMAC algorithms in `src/lib/webCryptoFallback.ts` for instant, reliable identity token hashing without requiring HTTPS.
* **HKDF-SHA256 Key Derivation:** Full RFC 5869 Extract-and-Expand key derivation to generate 256-bit AES-GCM encryption keys directly on non-secure origins.
* **NIST SP 800-38D AES-256-GCM:** Pure JS AES-GCM engine with GHASH authentication tag verification and Additional Authenticated Data (AAD) binding, 100% byte-for-byte compatible with native WebCrypto.
* **Hybrid Cryptographic Dispatch:** `src/lib/crypto.ts` and `src/lib/shellCryption.ts` seamlessly use hardware-accelerated `crypto.subtle` when available and transparently fall back to the pure engine when on plain LAN HTTP.

### 🌐 2. Client-Side Drag-and-Drop Shield

* **Global Navigation Prevention:** Attached global `dragover` and `drop` `e.preventDefault()` handlers to `window` in `src/App.tsx`, preventing Chrome from accidentally navigating to dropped `.json` files when dropped outside dropzones.
* **TOTP QR Code Blob Downloads:** Converted raw `data:` URI links to in-memory Blob streams via `downloadAttachment` in `src/components/Generator/GeneratorToolView.tsx`.

---

## 🏗️ Architectural Topology Map

```text
┌────────────────────────────────────────────────────────────────────────┐
│               🌐 Browser Client (HTTP LAN / HTTPS Web)                 │
│  ┌────────────────────────────┐    ┌────────────────────────────────┐  │
│  │ Native WebCrypto (HTTPS)   │    │ Pure TS Fallback Engine (HTTP) │  │
│  │ (Hardware-Accelerated)     │    │ (SHA-256 / HKDF / AES-GCM)     │  │
│  └─────────────┬──────────────┘    └───────────────┬────────────────┘  │
│                └─────────────────┬─────────────────┘                   │
│                                  ▼                                     │
│                     🔐 ShellCryption Data Layer                        │
│                     (Zero-Knowledge Vault Vaults)                      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   │ [Encrypted JSON Payloads & Hashes]
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 🔌 Express REST API / Bedrock SQLite                   │
│                       Port 6464 (HTTP / Docker)                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Commit Ledger (Since `v0.0.1.3`)

* `8fff3f0` — **fix(crypto):** implement pure TypeScript WebCrypto fallback for HTTP LAN origins
* `415b1c8` — **fix(ui):** prevent browser navigation on drag-drop and convert QR downloads to Blobs

---

## ⚡ Deployment & Upgrade Instructions

### Unraid Community Apps / Docker Deployments

Force-update your ShellGuard Docker container on Unraid to pull the latest image:

```bash
docker pull ghcr.io/clawstackstudios/shellguard:main
docker restart ShellGuard
```

---

*The Code That Molts.*

**Maintained by ClawStack Studios under AGPL-3.0 license.**
