---
title: The Grotto & Pod Organization
description: Vault Dashboard, Custom Fields, Hierarchical Pods, and In-Memory TOTP
---

# 🐚 The Grotto & Pod Organization

<CopyPage />

**The Grotto** is the primary vault dashboard in ShellGuard where users organize and manage their sovereign secrets into hierarchical, color-coded **Pods**.

---

## 🔑 Supported Item Types

| Item Type | Icon | Encrypted Payload Fields | Metadata Fields (Layer 2 Encrypted) |
| :--- | :--- | :--- | :--- |
| **Vault Pearl (Login)** | 🔑 | `secret` (Password), `totp_secret` (Seed), `attachments` (File IDs), `custom_fields` | `title`, `username`, `url`, `category`, `notes`, `tags` |
| **Secure Note** | 📝 | `content` (Markdown body), `custom_fields` | `title`, `category`, `notes`, `tags` |
| **SSH Key** | 💻 | `key_value` (Private Key — raw or generated keypair JSON), `custom_fields` | `title`, `username`, `category`, `notes`, `tags` |
| **Encrypted Attachment**| 📎 | Encrypted file BLOB (AES-GCM up to 500 MB streaming, 1000 MB quota) | `title`, `file_name`, `mime_type`, `category` |

> **Pod tallies count primary items only** — attachments are children of their
> login/note/key (linked via the parent's `attachments` ID array) and never
> inflate folder badges, even though they appear in the encrypted corpus.

---

## 🔑 In-Browser SSH Keypair Generation & Dual-Key Management

When adding or managing an **SSH Key**, ShellGuard provides an integrated, zero-knowledge keypair lifecycle engineered for terminal ergonomics and OpenSSH compliance:

### 1. In-Browser Keypair Generation
- **Supported Algorithms**: Ed25519 (high-security Edwards-curve signature algorithm, 256-bit) and RSA-4096 (legacy compatibility).
- **Zero-Knowledge Generation**: Keys are derived entirely inside browser RAM via the WebCrypto API (`crypto.subtle`). Private keys never touch the network in plaintext.
- **`ssh-keygen` Parity**: Public and private key outputs are byte-identical to standard OpenSSH `ssh-keygen -t ed25519` and `ssh-keygen -t rsa -b 4096` implementations.

### 2. Dual-Key Architecture & Serialization
- **Dual-Key Storage**: Generated keypairs serialize into a structured JSON envelope `{ "publicKey": "...", "privateKey": "..." }` sealed client-side inside the `key_value` column under Layer 1 ShellCryption.
- **Transparent Backward Compatibility**: ShellGuard's parser (`parseSshKeySecret`) automatically detects whether `key_value` contains a dual-key JSON object or a legacy raw PEM string. Legacy keys continue to unmask and copy flawlessly without database migrations.
- **Decoupled Form Inputs**: The item edit modal provides dedicated, decoupled input fields for the **Private Key (PEM)** and the **OpenSSH Public Key**, preventing JSON serialization strings from ever leaking into user-facing textareas.

### 3. Clean PKCS#8 PEM Presentation & Formatting Invariants
- **Strict RFC 7468 Framing**: Private keys strictly preserve their canonical `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` delimiters. Without these exact boundaries, tools like `ssh -i`, `ssh-add`, and Git clients fail with *"invalid format"* errors.
- **Multi-Line Styled Code Block**: Unmasking the private key renders a formatted, monospace `<pre>` block that clearly displays indentation and line wraps.
- **Eye-Beside-Copy Ergonomics**: The unmask (Eye/EyeOff) toggle sits immediately to the left of the Copy action, preserving full-value mask invariants (`••••••••`) until deliberately revealed.

### 4. Terminal Ergonomics & Deployment Actions
The Item Detail Pane equips engineers with zero-friction deployment actions:
- **Copy Public Key**: Copies the standard single-line OpenSSH public string (e.g. `ssh-ed25519 AAAAC3... shellguard-generated`).
- **Copy `authorized_keys` Command**: Copies a ready-to-run shell one-liner:
  ```bash
  echo "ssh-ed25519 AAAAC3... user@host" >> ~/.ssh/authorized_keys
  ```
  Paste directly into an SSH session or cloud-init configuration to grant immediate server access.
- **Download `.pem`**: Generates and downloads `<sanitized-title>.pem` directly in the browser with standard `0600`-compatible line breaks for immediate use with `ssh -i <key>.pem user@host`.

> [!NOTE]
> Keypair generation requires a **secure context** (HTTPS or `localhost`) — the WebCrypto API is unavailable on plain-HTTP LAN origins. On insecure origins, ShellGuard displays a helpful notice while continuing to allow pasting, editing, and downloading existing keys. This browser platform constraint is handled with graceful fallbacks.

---

## 🧩 Bitwarden-Style Custom Fields

ShellGuard supports rich custom fields for vault pearls, secure notes, and SSH keys, matching Bitwarden's flexibility while maintaining triple-layer zero-knowledge encryption.

### Supported Field Types:

1. **Text**: Plain textual key-value metadata (e.g. security questions, recovery emails, server ports).
2. **Hidden**: Obfuscated masked values with one-click copy and toggle reveal (e.g. PINs, API secrets, master passwords).
3. **Checkbox**: Boolean flags for credential states (e.g. *"2FA Activated"*, *"Requires VPN"*).
4. **Linked**: Dynamic pointers referencing existing item fields (`Username`, `Password`, `URL`, `Notes`, `TOTP`), preventing manual re-entry when fields are shared.

### Cryptographic Isolation:
- Custom fields are serialized to JSON and encrypted client-side before submission.
- Uses distinct AAD (Additional Authenticated Data) binding namespaces:
  - Pearls: `vault_pearls_custom:{id}`
  - Notes: `vault_secure_notes_custom:{id}`
  - SSH Keys: `vault_ssh_keys_custom:{id}`
- Stored as opaque ciphertext in the `custom_fields` TEXT column (Migration `0003_custom_fields.up.sql`).

---

## 🎨 User-Driven Pods & Hierarchical Categories

ShellGuard provides 100% user-driven pod categorization with zero hardcoded phantom folders:

- **Hierarchical Pathing**: Sub-pods are created using `/` delimiters (e.g., `Work/AWS`, `Personal/Banking`).
- **Accent Palettes**: Pods can be color-coded with curated bioluminescent hues (Emerald `#10b981`, Cyan `#06b6d4`, Gold `#f59e0b`, Purple `#8b5cf6`, Rose `#e4048a`).
- **Category Normalization**: Input categories are sanitized via `normalizePod()` to ensure whitespace trimming, forward slash consistency, and safe grouping.
- **Cascade to Uncategorized**: Deleting a pod safely shifts its child items to uncategorized (`""`), preventing accidental credential loss.

---

## 🏷️ Vault Tagging System & Granular Filter Bar

ShellGuard supports multi-dimensional tagging alongside hierarchical pods:
- **Tag Selector Input**: Add and remove tags as keyboard chips with autocomplete suggestions and inline color palette selection.
- **Unified Color Engine**: Tags and pods share a bioluminescent palette engine with deterministic string hashing (`hashStringToColor`) and explicit user overrides.
- **Sidebar Tag Cloud**: A collapsible "TAGS" section in the navigation tree reflects all assigned tags with item counts.
- **Granular Filter Bar**: Combine multiple tag filters with dynamic `AND` / `OR` intersection logic, clearing filters with a single click.

---

## ⏱️ Built-In TOTP Authenticator Engine

ShellGuard includes a zero-knowledge, client-side TOTP engine:
- **Seed Ingestion**: Paste a Base32 secret seed (`JBSWY3DPEHPK3PXP`) or scan a QR code.
- **Zero-Knowledge Storage**: The TOTP seed is encrypted client-side inside the `totp_secret` column.
- **Client-Side Generation**: RFC 6238 6-digit dynamic codes and 30-second countdown rings calculate directly in browser RAM without server interaction.
- **Companion Mirroring**: Stored TOTP seeds seamlessly mirror to the native [ShellGuard-TOTP Android companion](/companion/) for offline authentication on your mobile device.

---

## ⚡ Batch Multi-Selection, Pod Reassignment & Bulk Operations

ShellGuard provides rich batch management tools to organize, migrate, and prune credentials in bulk:

- **Tri-State Multi-Selection**: Select individual items via checkbox, or toggle select-all across filtered views using the header tri-state checkbox.
- **Floating Action Bar**: Displays selected item counts with bulk actions (Move to Pod, Assign Tags, Delete Selected). Guarded automatically against display when the vault is locked (`!isLocked`).
- **Bulk Move to Pod**: Move multiple logins, notes, or keys to a destination pod in one action, fully preserving tags and metadata.
- **Bulk Tag Assignment**: Add tags across multiple selected items without wiping pre-existing tags.
- **Bulk Delete with Safe Cascade**: Batch remove selected items with a Reef Modernist confirmation modal (`ConfirmDialog`); automatically cascades deletions to linked file attachments without orphan records.
- **Bulk Import with 207 Multi-Status**: Import up to 1,000 items in a single atomic transaction. Any malformed records are reported with granular error resolution chips indicating item index, title, and validation reason while valid items persist cleanly.
