---
title: ClawStack & ShellGuard Lexicon (Glossary)
description: Authoritative Definitions of Concepts, Protocols, and Ecosystem Terminology
---

# 📖 ClawStack & ShellGuard Lexicon

<CopyPage />

An authoritative reference defining core concepts, cryptographic protocols, data models, and ecosystem terms used across ShellGuard and ClawStack Studios.

---

### 🐚 The Grotto
The primary vault dashboard in ShellGuard where users manage, search, create, and organize their credentials, notes, SSH keys, file attachments, and custom fields.

### 🦞 Lobster
A registered sovereign human identity or autonomous agent operating within the ClawStack ecosystem. In the database, all users are stored in the `lobsters` table.

### 🔮 Pearl
A single password or login credential record stored inside the vault (`vault_pearls`). Contains encrypted credentials, optional TOTP seeds, attachments, and custom fields.

### 🗂️ Pod
A user-defined hierarchical category (e.g. `Personal`, `Work/AWS`, `Finance`) grouping related pearls and notes. Pods support dynamic color palettes and automatic sanitization.

### 🗝️ Human Key (`hu-`)
The 67-character sovereign client secret that serves as both the user's login identity and the root of Zero-Knowledge decryption. The server never stores the `hu-` key; it only verifies a constant-time SHA-256 hash (`key_hash`).

### 🤖 LobsterKey (`lb-`)
A 67-character granular API key issued to autonomous AI agents (stored in `agent_keys`). Allows scoped, programmatic access to designated vault secrets with configurable expiration dates, rate limits, and permission masks (`read`, `write`, `delete`, `admin`).

### 🦞 SuperLobster
The instance administration control plane available at `/superlobster`. Provides real-time health metrics, WAL-safe SQLite snapshots, user cascade deletions, and automated backup scheduling. Protected by an isolated cookie session using `ADMIN_TOKEN`.

### 🛡️ ShellCryption©™
The client-side cryptographic protocol developed by ClawStack Studios. Combines HKDF-SHA-256 key derivation with AES-GCM-256 authenticated encryption bound to unique Additional Authenticated Data (AAD) namespaces (e.g. `vault_pearls:{id}`). Guarantees absolute server zero-knowledge.

### 🩺 Forensic Reef
The segregated, append-only SQLite database located at `DATA_DIR/audit.sqlite`. Records immutable logs of all security, authentication, and mutation events. The Forensic Reef is strictly isolated from data restores and can never be truncated by regular user actions.

### 🪞 One-Way Mirror Sync
The cross-ecosystem architectural topology between the ShellGuard Web Vault and the native [ShellGuard-TOTP Android Companion](/companion/). The mobile companion acts as an offline, read-only mirror for vault logins containing TOTP seeds, while locally generated tokens remain private to the device.

### 📦 `.sgtotp.bak`
The sovereign backup envelope format produced by the ShellGuard-TOTP companion. Supports both encrypted (`shellguard-totp-backup-v1` via HKDF-SHA256 and AES-GCM-256 with AAD verification and SHA-256 integrity checksums) and plaintext (`shellguard-totp-plain-export-v1`) archives.

### 🔐 Three Secrets Model
The architectural model governing ShellGuard's key segregation:
1. `hu-` Key: Owned by the human; controls client-side ShellCryption.
2. `lb-` Key: Owned by the AI agent; controls scoped REST API delegation.
3. `SENSITIVE_KEY`: Held by the server; controls Layer 2 metadata encryption and Layer 3 SQLCipher whole-DB storage.

### 🛡️ `FLAG_SECURE`
The Android window manager flag enforced across all activities in the ShellGuard-TOTP mobile companion. Blocks screenshots, screen recordings, and recent apps task-switcher snapshots from exposing sensitive 2FA seeds or rolling codes.
