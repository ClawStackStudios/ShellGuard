# 🦞 ShellGuard — Release v0.0.1.5

## *Zero-Knowledge Bitwarden Custom Fields & Ergonomic Modal Architecture*

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

Welcome to **v0.0.1.5** of **ShellGuard**! This release introduces full support for **Bitwarden-Style Custom Fields** (`Text`, `Hidden`, `Checkbox`, and dynamic `Linked` properties) across vault logins, secure notes, and SSH keys. Every custom field is encrypted client-side with AES-256-GCM under item-scoped AAD namespaces, backed by automated database schema migration `0003_custom_fields.up.sql`. We also refined our master-detail form modals with pinned headers/footers, spacious `max-w-3xl` widths, smooth internal element scrolling, and an upward-expanding dropup menu with click-outside dismissal.

---

## 💎 Key Themes & Highlights

### 🛡️ 1. Zero-Knowledge Bitwarden Custom Fields

Vault items now support adding arbitrary user-defined custom fields matching standard Bitwarden conventions:

* **📝 Text Fields:** Plaintext key-value storage for non-secret metadata (e.g. employee IDs, security questions, secondary handles) with instant one-click copy.
* **🔒 Hidden Secrets:** Fully masked fields (`••••••••••••`) for PINs, recovery codes, and sensitive tokens with one-click show/hide reveal toggles and copy protection.
* **☑️ Checkbox Toggles:** Boolean state flags with crisp visual badges (`☑ Enabled` / `☐ Disabled`) for auto-renew, MFA enforced, and account status indicators.
* **🔗 Dynamic Linked Properties:** Live references to core item attributes (`Username`, `Password`, `URL`, `Notes`, `TOTP`) dynamically resolved at render time without data duplication, including real-time TOTP countdown tokens.

### 🔐 2. Client-Side Cryptographic Isolation & Database Migration 0003

Custom field payloads maintain ShellGuard's strict zero-knowledge security guarantees:

* **Item-Scoped AAD Namespaces:** Ciphertexts are authenticated using dedicated Additional Authenticated Data:
  - `vault_pearls_custom:{id}`
  - `vault_secure_notes_custom:{id}`
  - `vault_ssh_keys_custom:{id}`
* **Zero Double-Encryption:** Column `custom_fields` is explicitly omitted from server-side `metadataGuard.ts`, guaranteeing that automated agent keys (`lb-`) and the server database store only opaque client ciphertext without double-encrypting under `DB_ENCRYPTION_KEY`.
* **Automated SQLite Migration `0003`:** `migrations/0003_custom_fields.up.sql` applies non-destructive `ALTER TABLE` operations across `vault_pearls`, `vault_secure_notes`, and `vault_ssh_keys`.

### 🎨 3. Master-Detail Modal Architecture & Dropup Ergonomics

Refined data-entry dialogs for a modern, fluid desktop and mobile experience:

* **Internal Element Scrolling:** Pinned the modal header (Title, Favicon, Close `X`) and action footer (Cancel, Save changes) while enabling internal element scrolling (`flex-1 overflow-y-auto custom-scrollbar`) on a fixed `h-[90vh] md:h-[85vh]` dialog card.
* **Spacious `max-w-3xl` Width:** Expanded modal width to 768px (`max-w-3xl`), eliminating cramped layouts in 2-column forms.
* **Unified Upward Dropup:** Consolidated the separate custom field action button into the primary "+ Add Extra Field" selection menu with an upward animated pop-in (`bottom-full mb-2`) and click-outside backdrop dismissal.
* **Sleek Custom Scrollbars:** Added custom translucent scrollbar utilities in `src/index.css`.

### 🧪 4. Complete Verification & Test Oracle Parity

* **Node.js 22 WebCrypto Test Mocking:** Fixed prototype descriptor mocking on `Crypto.prototype` for robust non-secure origin simulation in Vitest.
* **Dedicated Custom Field Test Suites:** Added [`tests/unit/customFields.test.ts`](file:///config/Documents/workspace-lucas/projects/Agents/ShellGuard/tests/unit/customFields.test.ts) and expanded [`tests/vault-crud.test.ts`](file:///config/Documents/workspace-lucas/projects/Agents/ShellGuard/tests/vault-crud.test.ts) with byte-for-byte roundtrip assertions.
* **100% Verification Matrix:** **172 tests passing across all 11 test suites** (0 failures) and clean production Vite bundle (`✓ 2173 modules transformed. ✓ built in 1m 1s`).

---

## 📦 Changes by Layer

| Component | Files | Description |
|:---|:---|:---|
| **Types** | `src/types.ts` | Added `CustomField`, `CustomFieldType`, `CustomFieldLinkedProperty` interfaces |
| **Migrations** | `migrations/0003_custom_fields.up.sql` | Adds `custom_fields TEXT DEFAULT ''` to pearls, notes, and SSH keys |
| **Schemas** | `src/server/validation/schemas.ts` | Added `custom_fields: z.string().max(500000).optional()` validator |
| **Server Routes** | `src/server/routes/vault.ts`, `notes.ts`, `sshKeys.ts` | Handled `custom_fields` on POST/PUT endpoints |
| **Frontend Crypto** | `src/App.tsx` | AES-256-GCM encryption on create/update and decryption on read |
| **UI Components** | `ItemFormModal.tsx`, `ItemDetailPane.tsx` | Inline custom field editor, inspection cards, dropup menu, and modal layout |
| **Design System** | `src/index.css` | Added sleek translucent custom scrollbar styles |
| **Test Suites** | `tests/unit/customFields.test.ts`, `tests/vault-crud.test.ts` | Added 4-type roundtrip, AAD binding, and resolver test coverage |

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
git checkout v0.0.1.5
npm install
npm run build
npm run scuttle:prod
```
