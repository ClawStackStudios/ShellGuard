# Task 49: Habitat ZIP Packaging Engine & Streamed Attachment Decryption

> **Milestone**: Stage 26 / Phase 25 (Task 49 of 52) — **ACTIVE**
> **Domain**: Client-Side Archive Packaging, Streaming Decryption & Memory Boundedness
> **Target Branch**: `stage/phase-25-habitat-mobility`
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User:` / `AI:`)

---

## 🎯 Objective & Architectural Seam

Implement the client-side streaming ZIP export engine in `src/lib/habitatExport.ts`:

1. **Client-Side Streaming ZIP Packaging & Decryption**:
   - Iterate through vault items (pearls, notes, SSH keys) with linked attachment IDs.
   - For each attachment, fetch the encrypted BLOB via `GET /api/attachments/:id/file`.
   - Decrypt payload in-memory using the active session `shellKey` and AAD `vault_secure_attachments:<id>`.
   - On insecure LAN origins (plain HTTP), route through `src/lib/webCryptoFallback.ts` if `crypto.subtle` is undefined.
   - Stream files into a lightweight streaming ZIP writer (e.g. `client-zip` or `fflate`) maintaining constant bounded RAM overhead: $O(\text{largest single file})$, never buffering the entire multi-gigabyte archive into an `ArrayBuffer`.
2. **Deterministic Collision-Proof Directory Layout**:
   - Organize files in the ZIP under:
     `attachments/<pod>/<item_title>__[<id_short>]/<file_name>`
   - Sanitize path components: strip control characters, replace slashes with underscores, and strip all `../` path-traversal sequences.
   - For items with empty or missing pods, fallback to `Uncategorized`.
3. **Embedded Attachment Manifest**:
   - Embed an `attachment_manifest` array inside the root `shellguard_vault_export.json` mapping:
     ```json
     {
       "id": "att_uuid",
       "file_name": "document.pdf",
       "parent_item_id": "item_uuid",
       "parent_type": "password",
       "size_bytes": 1048576,
       "sha256_checksum": "hex_digest",
       "relative_path": "attachments/Work/Prod-DB__[a1b2c3d4]/document.pdf"
     }
     ```
4. **ClawKey Challenge Gate**:
   - Ensure the export action prompts the user for their ClawKey (`hu-`) before initiating full decrypted export.
5. **Unit Tests**:
   - Create `tests/unit/habitat-export.test.ts` testing:
     - Packaging archives with multiple items sharing identical filenames.
     - Manifest field structure and checksum calculation.
     - Path-traversal sanitization stripping `../`.

---

## 📁 Files in Scope

- `src/lib/habitatExport.ts` (New file — streaming ZIP packaging engine)
- `tests/unit/habitat-export.test.ts` (New file — unit test suite)
- `package.json` (add zero-dependency streaming zip package if needed, e.g., `client-zip` or `fflate`)

---

## 🔒 Invariants & Acceptance Criteria

1. **Zero-Knowledge Invariant**: Server never receives decrypted attachment bytes.
2. **Bounded Memory**: Memory footprint remains $O(\text{largest single file})$; no total-archive RAM buffering.
3. **Collision Safety**: Duplicate attachment filenames in different items never overwrite each other.
4. **Tests Passing**: `tests/unit/habitat-export.test.ts` passes 100% green.
