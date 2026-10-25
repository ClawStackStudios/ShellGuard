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

### 🏷️ Tag
A multi-dimensional categorization label assigned to pearls, secure notes, or SSH keys (stored in `tags` JSON array). Tags feature bioluminescent color badging, autocomplete chips, and granular multi-tag filtering with AND/OR logic in the Grotto.

### 🗝️ ClawKey (`hu-`)
*Historically aliased the **Human Key**.* The ClawKey is the 67-character sovereign client secret that serves as both the user's login identity and the root of Zero-Knowledge decryption. The server never stores the `hu-` key; it only verifies a constant-time SHA-256 hash (`key_hash`).

### 🤖 LobsterKey (`lb-`)
A 67-character granular API key issued to autonomous AI agents (stored in `agent_keys`). Allows scoped, programmatic access to designated vault secrets with configurable expiration dates, rate limits, and permission masks (`canRead`, `canWrite`, `canEdit`, `canDelete`). Since v0.0.1.9 the ledger is hash-only: the plaintext is shown exactly once at mint.

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

### 📎 Bitwarden Item Integrity Model
The foundational invariant dictating that every attachment must be a child of a primary vault item (Password, Credit Card, Identity, Secure Note, or SSH Key). Attachments cannot exist independently. Standalone attachment creation is structurally forbidden across all UI boundaries and API contracts.

### 🧹 Orphan Quarantine
An automated safety engine that executes during server boot. If the server detects any attachments that lack a valid parent item reference (`parent_id`, `parent_type`), those rows are flagged as quarantined (`is_quarantined = 1`). Quarantined attachments are hidden from lists and file streams to maintain the Bitwarden Item Integrity Model, but are never deleted to prevent accidental data loss.

### 🔐 Three Secrets Model
The architectural model governing ShellGuard's key segregation:
1. `hu-` Key: Owned by the human; controls client-side ShellCryption.
2. `lb-` Key: Owned by the AI agent; controls scoped REST API delegation.
3. `SENSITIVE_KEY`: Held by the server; controls Layer 2 metadata encryption and Layer 3 SQLCipher whole-DB storage.

### 🛡️ `FLAG_SECURE`
The Android window manager flag enforced across all activities in ShellGuard Mobile and the ShellGuard-TOTP companion. Blocks screenshots, screen recordings, and recent apps task-switcher snapshots from exposing sensitive vault items, 2FA seeds, or rolling codes.

### 📱 ShellGuard Mobile
The official native Android sovereign vault client (`com.clawstack.shellguard`). Provides full bidirectional CRUD across 5 record domains (Logins, Secure Notes, Credit Cards, Identities, SSH Keys & Passkeys), Android Autofill, Credential Provider (Passkeys), and offline-first SQLCipher 4.6.1 encryption at rest.

### 🚪 Autofill Co-Presence Gate
The heuristic engine within `ShellGuardAutofillService` that inspects view tree siblings. If an input field matches only weak username heuristics and no password field is co-present within the form container, autofill suggestion chips are strictly suppressed to eliminate false positives on search and filter bars.

### ⚠️ Amber Transport Warning
A high-contrast visual status indicator rendered on the mobile Gateway screen and Settings whenever an unencrypted `http://` URL is configured or the in-app self-signed TLS consent toggle is active, transparently alerting users to transport-layer exposure.

### 🔄 In-Place Re-Authentication
The mobile architectural mechanism that allows users to unlock their vault via Class 3 Biometrics or Master PIN locally without contacting the remote server. Decouples volatile RAM memory zeroization from KeyStore-sealed session persistence.

### 🧹 Volatile Heap Zeroization (`zeroizeMemory()`)
The systematic overwriting of in-memory byte buffers, character arrays, and derived AES keys with `0x00` upon vault lock, eliminating persistent secret exposure in Android process heap memory (OWASP Mobile M2).

### 📎 CursorWindow Chunking
The hybrid attachment streaming architecture in ShellGuard Mobile that streams binary payloads in 64KB buffers to `filesDir/vault_attachments/{uuid}.enc`, completely bypassing Android Binder's 2MB `CursorWindowAllocationException` limit.

### 📦 `.sgvault.bak`
The portable encrypted mobile vault backup archive format. Packages all 5 record domains and custom fields in a GZIP-compressed envelope encrypted via AES-GCM-256 with PBKDF2-SHA256 key derivation.

### 🌊 Habitat Full-Archive Mobility
The client-side streaming ZIP packaging and restoration architecture (`src/lib/habitatExport.ts` & `src/lib/habitatImport.ts`). Exports the complete decrypted vault manifest (`shellguard_vault_export.json`) alongside all decrypted binary attachments in a collision-proof directory hierarchy (`attachments/<pod>/<item_title>__[<id_short>]/<file_name>`) with strict $O(\text{largest single file})$ RAM bounds.

### ⚓ Abyssal Ingestion Dock
The persistent floating background queue manager in `VaultShell.tsx` powering Stage 2 of the Two-Stage Habitat Ingestion Pipeline. Streams binary attachments asynchronously after primary credentials commit in under 2 seconds, providing pause, resume, cancel-all, per-item retry, and reactive in-flight status chips (`📎 Uploading...` ➔ `📎 Verified`).

### ⏳ Ephemeral Import Quarantine (`imp_<uuid>`)
The relational import lifecycle tracking mechanism introduced in Migration `0010_import_lifecycle`. Bulk imports stamp every inserted record with an atomic batch identifier (`imp_<uuid>`) and UTC timestamp (`imported_at`). Quarantined records obey strict progressive disclosure (zero quarantine UI renders when no active quarantined items exist), auto-graduate to permanent status immediately upon user edit (`PUT`), and support 1-click atomic batch graduation or full rollback (`DELETE /api/vault/import-batches/:id`) with attachment cascade and forensic audit logging (`IMPORT_BATCH_REVERTED`).

