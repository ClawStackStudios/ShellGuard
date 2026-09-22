# Encrypted Vault Attachments

<CopyPage />

ShellGuard features a dedicated **Reference Model** for encrypted file attachments, allowing you to attach license files, recovery keys, certificates, or documents directly to your vault pearls and secure notes.

---

## 📎 The Reference Model Architecture

Instead of bloating credential rows with monolithic payloads, ShellGuard stores each attached file as an independent, fully encrypted record in `vault_secure_attachments`:

```text
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│        vault_pearls (Login)          │       │      vault_secure_attachments       │
│                                      │       │                                      │
│  uuid: "pearl-123"                   │       │  uuid: "att-456"                     │
│  title: "AWS Root Credentials"       │       │  file_name: "root_credentials.csv"   │
│  attachments: '["att-456","att-789"]'├──────►│  file_data: { AES-GCM-256 blob }     │
└──────────────────────────────────────┘       │  size_bytes: 42100                   │
                                               │                                      │
┌──────────────────────────────────────┐       │                                      │
│      vault_secure_notes (Note)       │       │  uuid: "att-789"                     │
│                                      │       │  file_name: "server_cert.pem"        │
│  uuid: "note-321"                    │       │  file_data: { AES-GCM-256 blob }     │
│  title: "Cluster Recovery Protocol"  │       │  size_bytes: 8400                    │
│  attachments: '["att-789"]'          ├──────►│                                      │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
```

### Key Technical Properties:

1. **500 MB Hard Limit Per Attachment**: Enforced mid-stream by the server's `Busboy` multipart handler (`ATTACHMENT_MAX_MB`, default 500MB per attachment) — a breach destroys the request and returns `413`, never buffering past the ceiling.
2. **1000 MB (1 GB) Grotto Quota Per Owner**: Total stored ciphertext is capped per `owner_uuid` (`GROTTO_QUOTA_MB`, default 1000MB) via an exact `SUM(size_bytes)` aggregate — over-quota uploads yield `413` and store nothing.
3. **Unlimited Attachments Per Parent Item**: A login pearl or secure note can link to as many individual file attachments as needed via its JSON UUID array.
4. **Atomic Cascade Deletion**: When a vault pearl or secure note is deleted (`DELETE /api/vault/:id`, `DELETE /api/vault/bulk`, or `DELETE /api/notes/:id`), the backend automatically performs a foreign-key-safe cascade deletion of all linked attachment records in `vault_secure_attachments`.
5. **Client-Side Encryption & Decryption**: File bytes are encrypted in your browser before upload; the ShellCryption envelope streams as multipart bytes (no base64 inflation). The list endpoint never carries payloads — downloads stream the BLOB in 1MB chunks from `GET /api/attachments/:id/file` and decrypt in browser memory.
6. **Inline Previews**: Common image types and PDFs render in an encrypted preview modal — PDFs load from a Blob object URL (never a `data:` URI, honoring the insecure-origin invariant).
