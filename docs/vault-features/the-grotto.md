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
| **Vault Pearl (Login)** | 🔑 | `secret` (Password), `totp_secret` (Seed), `attachments` (File IDs), `custom_fields` | `title`, `username`, `url`, `category`, `notes` |
| **Secure Note** | 📝 | `content` (Markdown body), `custom_fields` | `title`, `category`, `notes` |
| **SSH Key** | 💻 | `key_value` (Private Key), `custom_fields` | `title`, `username`, `category`, `notes` |
| **Encrypted Attachment**| 📎 | `file_data` (Base64 payload up to 10 MB) | `title`, `file_name`, `mime_type`, `category` |

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

## ⏱️ Built-In TOTP Authenticator Engine

ShellGuard includes a zero-knowledge, client-side TOTP engine:
- **Seed Ingestion**: Paste a Base32 secret seed (`JBSWY3DPEHPK3PXP`) or scan a QR code.
- **Zero-Knowledge Storage**: The TOTP seed is encrypted client-side inside the `totp_secret` column.
- **Client-Side Generation**: RFC 6238 6-digit dynamic codes and 30-second countdown rings calculate directly in browser RAM without server interaction.
- **Companion Mirroring**: Stored TOTP seeds seamlessly mirror to the native [ShellGuard-TOTP Android companion](/companion/) for offline authentication on your mobile device.
