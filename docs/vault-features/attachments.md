# Password Attachments

<CopyPage />

ShellGuard features a dedicated **Reference Model** for password file attachments, allowing you to attach license files, recovery keys, certificates, or documents directly to your vault pearls.

---

## 📎 The Reference Model Architecture

Instead of bloating login rows with monolithic payloads, ShellGuard stores each attached file as an independent, fully encrypted record in `vault_secure_attachments`:

```text
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│        vault_pearls (Login)          │       │      vault_secure_attachments       │
│                                      │       │                                      │
│  uuid: "pearl-123"                   │       │  uuid: "att-456"                     │
│  title: "AWS Root Credentials"       │       │  file_name: "root_credentials.csv"   │
│  attachments: '["att-456","att-789"]'├──────►│  file_data: { AES-GCM-256 blob }     │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
```

### Key Technical Properties:

1. **10 MB Hard Limit Per File**: Enforced with Zod schema validation (`14,000,000` base64 character limit) and a 32 MB Express body parser ceiling scoped to `/api/attachments`.
2. **Unlimited Attachments Per Pearl**: A pearl can link to as many individual file attachments as needed via its JSON UUID array.
3. **Atomic Cascade Deletion**: When a vault pearl is deleted, the backend automatically performs a foreign-key-safe cascade deletion of all linked attachment records.
4. **Client-Side Encryption & Decryption**: File bytes are converted to Base64 and encrypted in your browser before upload. On download, files decrypt in browser memory and trigger a native download prompt.
