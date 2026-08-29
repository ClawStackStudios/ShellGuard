# The Grotto & Pod Organization

<CopyPage />

**The Grotto** is the primary vault dashboard in ShellGuard where users organize their sovereign secrets into hierarchical, color-coded **Pods**.

---

## 🐚 Supported Item Types

| Item Type | Icon | Encrypted Payload Fields | Metadata Fields |
|---|---|---|---|
| **Vault Pearl (Login)** | 🔑 | `secret` (Password), `totp_secret` (Seed), `attachments` (File IDs) | `title`, `username`, `url`, `category`, `notes` |
| **Secure Note** | 📝 | `content` (Markdown formatted body) | `title`, `category`, `notes` |
| **SSH Key** | 💻 | `key_value` (Private Key payload) | `title`, `category`, `notes` |
| **Encrypted Attachment**| 📎 | `file_data` (Base64 file payload up to 10 MB) | `file_name`, `file_type`, `file_size`, `notes` |

---

## 🎨 Pod Categories

Pods provide visual categorization and folder hierarchy for your vault pearls:

- **Personal** (Emerald `#10b981`)
- **Work** (Cyan `#06b6d4`)
- **Finance** (Gold `#f59e0b`)
- **Infrastructure** (Purple `#8b5cf6`)
- **Custom Pods** (Configurable custom labels and accent colors)

---

## ⏱️ Built-In TOTP Authenticator Engine

ShellGuard includes a zero-knowledge TOTP generator:
- Paste a TOTP base32 seed or scan a QR code.
- The secret seed is encrypted client-side with ShellCryption.
- Real-time 6-digit rolling codes and countdown timers generate entirely in browser RAM without server participation.
