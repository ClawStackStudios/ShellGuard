# 🦞 ShellGuard — Release v0.0.2.6

> **"The Cryptographic Audit Hardening & Third-Party Auditability"** — Phase 24: Vector Parity, Mechanized Constant-Time Sweeps, Auditor's Battery & Threat Model Addendum  
> **ClawStack Studios ©™** · 2026-10-18 · AGPL-3.0

The reef achieves mathematical certainty and transparent third-party auditability. ShellGuard **v0.0.2.6 (Build 28)** hardens the cryptographic core — proving pure-TypeScript WebCrypto fallback parity against official NIST/RFC standards vectors, mechanizing constant-time comparisons across all authentication and administrative key paths, codifying an automated Docs-as-Code claim battery into the build gates, and formalizing runtime operational realities in the threat model.

```text
███████╗██╗   ██╗███████╗██╗     ██╗              ██████╗   ██╗   ██╗   █████╗    ██████╗     ██████╗ 
██╔════╝██║   ██║██╔════╝██║     ██║              ██╔═══╝   ██║   ██║  ██╔══██╗  ██╔══██╗   ██╔════╝ 
███████╗███████║█████╗   ██║     ██║              ██║ ███╗  ██║   ██║  ███████║  ██████╔╝   ███████╗ 
╚════██║██╔══██║██╔══╝   ██║     ██║              ██║   ██║  ██║   ██║  ██╔══██║  ██╔══██╗   ██╔═══██╗
███████║██║   ██║███████╗███████╗███████╗  ╚██████╔╝╚██████╝  ██║   ██║  ██║   ██║  ╚██████╔╝
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝    ╚═════╝   ╚═════╝   ╚═╝  ╚═╝  ╚═╝   ╚═╝   ╚═════╝ 
                                              ~ **ClawStack Studios©™** ~
```

---

## 🚀 The Core Summary

Welcome to **v0.0.2.6 (Build 28)** of **ShellGuard**! This release elevates our cryptographic assertions from declarative claims into executable mathematical proofs. We have closed the final open soft spot in our cryptography suite: unskipping and proving our pure-TypeScript WebCrypto fallback engine against official published standards vectors (FIPS 180-4 SHA-256, RFC 2104 HMAC-SHA256, RFC 5869 HKDF-SHA256, and NIST SP 800-38D AES-256-GCM), achieving byte-identical parity with Node.js native cryptographic primitives. Furthermore, we have mechanized constant-time comparisons across all sensitive key comparison sites, introduced an automated Docs-as-Code claim battery into our build gates, and enriched our threat model with transparent operational boundaries.

---

## 💎 Key Themes & Highlights

### 🛡️ 1. Pure-TS WebCrypto Fallback Vector Parity (Task 47)
- **Unskipped Standards Verification (`tests/unit/webCryptoFallback.test.ts`)**: The pure-TS WebCrypto fallback test suite (skipped since v0.0.1.2) is now fully unskipped, green, and executed on every CI run.
- **Published Vector Compliance**:
  - **SHA-256**: Verified against official FIPS 180-4 published test vectors (`""`, `"abc"`, 1M `'a'` stress vectors).
  - **HMAC-SHA256**: Verified against RFC 2104 / RFC 4231 standard test vectors.
  - **HKDF-SHA256**: Verified against RFC 5869 test vectors (extract-and-expand with PRK, salt, and info bindings).
  - **AES-256-GCM**: Verified against NIST SP 800-38D standard vectors (256-bit zero key, 96-bit IV, 128-bit plaintext, tag verification).
- **Byte-Identical Native Parity**: Proved that pure-TS fallback output matches native Node.js `crypto` output byte-for-byte across every supported cipher and hash.

### ⏱️ 2. Mechanized Constant-Time Comparison Sweep (Task 47)
- **Universal Constant-Time Utility (`src/server/utils/crypto.ts`)**: Implemented `constantTimeCompare(a, b)` using Node's `crypto.timingSafeEqual` with dummy comparison buffering on length mismatch, eliminating timing side-channel leaks.
- **Key-Path Refactoring**: Refactored `src/server/routes/auth.ts`, `src/server/routes/admin.ts`, and `src/server/middleware/auth.ts` to route all secret comparisons (passwords, tokens, human keys, agent keys) through `constantTimeCompare`.
- **Automated AST/Regex Build Gate (`tests/build-gates.test.ts`)**: Wired an automated sweep asserting zero raw `===` or `!==` comparisons on secret tokens or key material across server routes and middleware.

### 🧪 3. The Auditor's Claim Battery (Task 48)
- **Docs-as-Code Invariant**: Codified an automated claim battery in `tests/build-gates.test.ts` to ensure documentation strictly bows to code reality:
  - **L1 (Rate Limiters)**: Asserts documented rate limits match `src/server/middleware/rateLimiter.ts`.
  - **L3 (Key Prefixes)**: Asserts documented key prefix strings (`hu-`, `lb-`) match `src/server/utils/crypto.ts` and `src/lib/crypto.ts`.
  - **L4 (Permission Masks)**: Asserts documented permission masks match Zod schemas in `src/server/validation/schemas.ts`.
  - **L5 (AAD Namespaces)**: Asserts documented AAD namespace templates match cryptographic test fixtures.
- **Falsifiable Mutation Verification**: Tested to ensure any planted documentation lie immediately and loudly breaks the CI test oracle.

### 📖 4. Threat Model Addendum & Honest Security Boundaries (Task 48)
- **Transparent Operational Realities (`SECURITY.md` & `docs/architecture/threat-model.md`)**:
  - **In-Process Rate Limiting**: Explicitly documented that in-memory rate limiting resets upon container restart and multi-instance clusters share no state (under YAGNI, no Redis requirement).
  - **LRU Eviction**: Documented per-key LRU cache eviction semantics with safe fallback to SQLite database lookups.
  - **Redaction Coverage**: Enumerated credential masking and redaction regexes used throughout logging and error pipelines.
  - **Side-Channel Boundary**: Documented in `project/encryption-layers-spec.md` §5 that pure-TS AES-GCM provides functional LAN availability on plain HTTP origins, not hardware-level side-channel immunity.

---

## 🏗️ Architectural Topology Map

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                 🌐 Client Layer (React 19 + Vite 6)                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   WebCrypto Subtle API  │  │   Pure-TS WebCrypto Fallback Engine  │  │
│  │ (HTTPS / Secure Origin) │  │  (FIPS 180-4, RFC 2104, RFC 5869,    │  │
│  │                         │  │   NIST SP 800-38D Vector Parity)     │  │
│  └───────────┬─────────────┘  └──────────────────┬───────────────────┘  │
│              │                                   │                      │
│              ▼                                   ▼                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │        Zero-Knowledge Cryptographic Layer (ShellCryption)         │  │
│  │   (Client-side AES-256-GCM + PBKDF2 600k / HKDF Key Derivation)   │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │ (Opaque Ciphertext + constantTime Auth)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              🔌 Server & API Layer (Express 5 Security Kernel)          │
│  ┌───────────────────────────────────┬───────────────────────────────┐  │
│  │ constantTimeCompare() Guards      │ In-Process Rate Limiter       │  │
│  │ (Zero === comparisons on secrets) │ (Documented container memory) │  │
│  ├───────────────────────────────────┼───────────────────────────────┤  │
│  │ Auditor's Battery Build Gate      │ requirePermission() Claws     │  │
│  │ (L1-L5 docs-bow-to-code checks)   │ (Strict Zod schema masks)     │  │
│  └───────────────────────────────────┴───────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 🗄️ Bedrock Storage (SQLite + SQLCipher)                 │
│  ┌───────────────────────────┐       ┌───────────────────────────────┐  │
│  │ vault_pearls / notes / keys│ <───> │ segregated audit.sqlite       │  │
│  │ (Layer 2 metadata encrypted│       │ (Tamper-evident audit trails  │  │
│  │  + Layer 1 ShellCryption)  │       │  never joined with vault DB)  │  │
│  └───────────────────────────┘       └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Changes by Layer

| Component | Files | Description |
|:---|:---|:---|
| **Cryptographic Primitives** | `src/server/utils/crypto.ts`, `src/lib/webCryptoFallback.ts` | Added `constantTimeCompare()` with dummy length buffering; verified pure-TS standards vector parity. |
| **Authentication & Middleware** | `src/server/routes/auth.ts`, `src/server/routes/admin.ts`, `src/server/middleware/auth.ts` | Refactored all token/password equality checks to consume `constantTimeCompare()`. |
| **Verification & Build Gates** | `tests/unit/webCryptoFallback.test.ts`, `tests/build-gates.test.ts` | Unskipped fallback test suite with NIST/RFC vectors; added Auditor's Battery and mechanized constant-time comparison CI sweep. |
| **Threat Model & Security Policy** | `SECURITY.md`, `docs/architecture/threat-model.md`, `project/encryption-layers-spec.md` | Formalized auditor's addendum (rate limiter resets, LRU eviction, redaction regexes, LAN side-channel boundary). |

---

## 📋 Commit Ledger (Since `v0.0.2.5`)

* `31d28c1` — **feat(crypto):** merge Phase 24 crypto hardening & auditor battery (PR #6)
* `4ef6e07` — **docs(agents):** ratify post-review verification & adjacency sweep protocol
* `aa59622` — **feat(crypto):** Phase 24 crypto hardening and auditor battery
* `7051310` — **chore(jules):** pre-heat Phase 24 tasks, targeted knowledge, and epistemic escape hatch
* `f7f4684` — **feat(agents):** codify prep-jules-work skill and epistemic escape hatch

---

## 🚀 Upgrade & Verification Instructions

### Upgrading via Docker / Unraid
```bash
docker pull ghcr.io/clawstackstudios/shellguard:latest
docker restart shellguard
```

### Upgrading from Source
```bash
git fetch --tags
git checkout v0.0.2.6
npm install
npm run build
npm run scuttle:prod
```
