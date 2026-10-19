# 🧠 Jules Knowledge Store — Pre-Heated Domain Knowledge
## Stage 26: Phase 25 — Habitat Full-Archive Mobility & Reactive Ingestion Dock

> This file is maintained by the ClawStack Studios project lead to pre-heat Jules's LLM inference with exact constants, published test vectors, boundary definitions, and architectural scars before task execution.

---

## 🔐 1. Cryptographic Test Vectors (Standards Conformance)

### SHA-256 Test Vectors (NIST FIPS 180-4)
- **Vector 1 (Empty String)**:
  - Input: `""` (0 octets)
  - Digest: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- **Vector 2 (Short Message)**:
  - Input: `"abc"`
  - Digest: `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`
- **Vector 3 (448-bit Multi-Block Message)**:
  - Input: `"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"`
  - Digest: `248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1`

### HMAC-SHA256 Test Vectors (RFC 4231 / RFC 2104)
- **Test Case 1**:
  - Key: `0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b` (20 bytes)
  - Data: `"Hi There"`
  - Digest: `b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7`
- **Test Case 2**:
  - Key: `"Jefe"` (`4a656665`)
  - Data: `"what do ya want for nothing?"`
  - Digest: `5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843`
- **Test Case 3**:
  - Key: `0xaa` repeated 20 times (`aaaa...`)
  - Data: `0xdd` repeated 50 times (`dddd...`)
  - Digest: `773e20e7448d00a164939912a9f1e76e57d6a47545644dca8094f83bf0cb09f5`

### HKDF-SHA256 Test Vectors (RFC 5869)
- **Test Case 1**:
  - IKM: `0x0b` repeated 22 times
  - Salt: `000102030405060708090a0b0c` (13 bytes)
  - Info: `f0f1f2f3f4f5f6f7f8f9` (10 bytes)
  - L: 42
  - PRK: `077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e0`
  - OKM: `3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865`

### AES-256-GCM Test Vectors (NIST SP 800-38D)
- **Test Case (Empty Plaintext, 96-bit IV, 256-bit Key)**:
  - Key: `0000000000000000000000000000000000000000000000000000000000000000`
  - IV: `000000000000000000000000`
  - Plaintext: `""`
  - Ciphertext: `""`
  - Tag: `530f8afbc74536b9a963b4f1c4cb738b`
- **Test Case (128-bit Plaintext, 96-bit IV, 256-bit Key)**:
  - Key: `0000000000000000000000000000000000000000000000000000000000000000`
  - IV: `000000000000000000000000`
  - Plaintext: `00000000000000000000000000000000`
  - Ciphertext: `cea7403d4d606b6e074ec5d3baf39d18`
  - Tag: `d0d1c8a799996bf0222b55e807c48c2e`

---

## ⚡ 2. Constant-Time Timing Invariants

- **The Node.js `timingSafeEqual` Trap**:
  `crypto.timingSafeEqual(bufA, bufB)` throws a `RangeError` if `bufA.length !== bufB.length`. Wrapping this in a naive `try/catch` leaks timing information: a length mismatch returns in ~0.001ms, while equal lengths compare in ~0.015ms.
- **The Correct Pattern**:
  In `src/server/utils/crypto.ts`:
  ```typescript
  export function constantTimeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const aBuffer = Buffer.from(a, 'utf8');
    const bBuffer = Buffer.from(b, 'utf8');

    if (aBuffer.length !== bBuffer.length) {
      // Execute dummy comparison to equalize timing profile before returning false
      crypto.timingSafeEqual(aBuffer, aBuffer);
      return false;
    }
    return crypto.timingSafeEqual(aBuffer, bBuffer);
  }
  ```
- **Rule**: Never use raw `===` or `!==` or uninsulated `timingSafeEqual` on secrets, session tokens, or key hashes.

---

## 🔍 3. The Claim Battery Classes (L1–L6)

The Claim Battery in `tests/build-gates.test.ts` enforces that documentation never contradicts code truth:
- **Class L1 (Rate Limiters)**:
  - `apiLimiter`: 100 req / 1 min (`src/server/middleware/rateLimiter.ts`)
  - `authLimiter`: 10 attempts / 15 min (`src/server/middleware/rateLimiter.ts`)
  - `adminAuthLimiter`: 5 attempts / 10 min (`src/server/middleware/rateLimiter.ts`)
- **Class L2 (Database Schemas)**:
  - `vault_pearls`, `vault_secure_notes`, `vault_ssh_keys`, `vault_secure_attachments`, `lobsters`, `agent_keys`, `api_tokens`.
- **Class L3 (Key Prefixes)**:
  - `hu-` = Human Master ClawKey
  - `lb-` = Agent API LobsterKey
  - `api-` = Volatile API Session Token
- **Class L4 (Permission Masks)**:
  - `canRead`, `canWrite`, `canEdit`, `canDelete` (defined in `src/server/validation/schemas.ts`).
- **Class L5 (AAD Namespaces)**:
  - `vault_pearls:{id}`, `vault_secure_notes:{id}`, `vault_ssh_keys:{id}`, `vault_pearls_custom:{id}`, `vault_pearls_history:{id}`.
- **Class L6 (Storage Limits)**:
  - Attachment maximum size: 500MB per file (`ATTACHMENT_MAX_MB`).
  - Vault quota: 1000MB (1GB) per owner (`GROTTO_QUOTA_MB`).

---

## 🪂 4. The Epistemic Escape Hatch Protocol

If you implement a fix or refactor where you have lower confidence—where the code compiles and passes tests, but you suspect a subtle edge case, a potential performance issue, or an architectural compromise:
1. **DO NOT disguise it**.
2. Complete the fix so the build is functional.
3. Immediately place an inline comment directly above the site:
   ```typescript
   // TODO(uncertainty): [Explain your exact doubt, assumptions made, or edge cases]
   ```
4. List your flagged uncertainty in your Pull Request description under `### ⚠️ Epistemic Flags & Surfaced Uncertainties`. Surfacing honest doubt is explicitly rewarded.

---

## 📦 5. Phase 25: Habitat Full-Archive Mobility & Reactive Ingestion Dock Contracts

### A. Attachment Streaming Routes & Wire Contracts
- **Download**: `GET /api/attachments/:id/file` streams ciphertext chunks (1MB chunks via `substr(file_data, offset, length)`).
- **Decryption**: In browser memory with active session `shellKey` and AAD string: `vault_secure_attachments:${id}`.
- **Upload**: `POST /api/attachments` using `uploadAttachmentMultipart(file, { parent_id, parent_type, ... })` from `src/lib/attachmentUtils.ts`.
- **Pre-Flight Quota Check**: `GET /api/attachments/quota` returns `{ used_bytes, quota_bytes, remaining_bytes }`.
- **Storage Limits**: `ATTACHMENT_MAX_MB = 500` (per file), `GROTTO_QUOTA_MB = 1000` (per owner).

### B. Streaming ZIP Packaging Patterns & Memory Boundedness
- **Package Choice**: Use a lightweight zero-dependency streaming zip reader/writer (e.g. `client-zip` or `fflate`).
- **Memory Ceiling**: $O(\text{largest single file})$. Do NOT buffer the entire multi-gigabyte ZIP in an `ArrayBuffer`. Stream chunks into download sink.
- **Deterministic Collision-Free Layout**:
  `attachments/<pod>/<item_title>__[<id_short>]/<file_name>`
  - Empty or missing pod falls back to `Uncategorized`.
  - Path sanitization: strip leading slashes, reject `..`, replace special characters.
- **Embedded Manifest**: Root `shellguard_vault_export.json` embeds `attachment_manifest` mapping ID, file name, parent item ID, parent type, size, checksum, and relative path.
- **ClawKey Challenge**: Gated behind user ClawKey (`hu-`) challenge confirmation.

### C. Two-Stage Ingestion Pipeline
- **Stage 1 (Instant Primary Ingestion, <2s)**:
  - Sniff `.zip` or unzipped directory.
  - Parse root `shellguard_vault_export.json`.
  - Render Batch Import Preview modal with item counts and attachment metrics.
  - Commit primary items via `POST /api/vault/bulk-import` ($<2\text{s}$) and immediately close modal to unlock the vault.
- **Stage 2 (Background Abyssal Ingestion Dock)**:
  - Mount persistent floating dock in bottom-right viewport of `VaultShell.tsx`.
  - Stream multipart attachment uploads in background queue.
  - Controls: expand/minimize, pause, resume, cancel, per-item retry.
  - Reactive chips in `ItemDetailPane.tsx` and `ItemListPane.tsx`: `📎 filename (Uploading 45%...)` ➔ `📎 filename (Verified)`.
  - Register `beforeunload` warning during active uploads.

### D. LAN WebCrypto Fallback Invariant
- On insecure LAN origins (plain HTTP), `window.crypto.subtle` is strictly `undefined`.
- Route hash calculations and AES-GCM operations through `src/lib/webCryptoFallback.ts` when native WebCrypto is unavailable.

### E. Auditor Battery Codification (L2 & L6)
- In `tests/build-gates.test.ts`:
  - **L2**: Assert all database tables in `src/server/db/schema.ts` match migration files.
  - **L6**: Assert storage limits (`ATTACHMENT_MAX_MB = 500`, `GROTTO_QUOTA_MB = 1000`) match code and documentation.
