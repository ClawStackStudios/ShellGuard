# 🔐 ShellGuard — ShellCryption™ Client-Side Encryption Specification

> **The zero-knowledge engine: key derivation, envelope format, AAD binding & decrypt semantics**
> *Pulled into existence by the coherence audit (Phase 16.5). Grows with the walk.*

---

## §1. Role in the Triple-Layer Model

ShellCryption™ is **Layer 1** — the client-side engine that makes the
zero-knowledge invariant possible. It runs entirely in the browser; the
plaintext and the derived key never leave the client, and the server stores
only opaque envelopes it cannot open.

| Layer | Engine | File | Sees plaintext? |
|:---|:---|:---|:---|
| 1. ShellCryption (this spec) | HKDF-SHA256 + AES-GCM-256 | `src/lib/shellCryption.ts` | Only the client |
| 2. Per-row metadata | SG-META (see `encryption-layers-spec.md` §2) | `src/server/utils/fieldEncryption.ts` | Server, transiently |
| 3. SQLCipher at rest | Whole-DB | better-sqlite3-multiple-ciphers | Nobody |

**The firewall (inviolable):** ShellCryption payload columns — `secret`,
`content`, `key_value`, `file_data`, `totp_secret`, `custom_fields` — are
**NEVER registered in `metadataGuard.ts`**. They are already zero-knowledge
ciphertext; server-side re-encryption would double-encrypt and break the
model. See `encryption-layers-spec.md` §3.

---

## §2. Key Derivation (`deriveShellKey`)

```
HKDF-SHA-256(
  ikm  = hu- key string          (the human root key, client-generated)
  salt = userUuid                (per-identity salt — keys never cross accounts)
  info = "clawchives-shellcryption-v1"
  L    = 32 bytes
) → AES-GCM-256 key, non-extractable
```

- The same `info` string is shared with the Android companion's
  `ShellCryptionEngine.kt` (see `compatibility_layer.md`) — this is what makes
  the cross-project `sgtotp.bak` bridge decryptable on both sides.
- The derived `shellKey` lives in React state for the session only and is
  **zeroized on lock/logout** — purged from memory together with all decrypted
  plaintext (see §6).
- Salt is the **user UUID**, so two identities in the multi-account session
  manager (see `ui-ux-design-system.md` §3) never derive the same key.

---

## §3. Envelope Format

Every encrypted field is a self-describing JSON envelope stored in the same
TEXT column as plaintext would occupy — no schema changes:

```json
{
  "v": 1,
  "alg": "AES-GCM-256",
  "iv":  "<base64, 96-bit random IV>",
  "ct":  "<base64, ciphertext with the 128-bit GCM auth tag appended>",
  "aad": "<table>:<recordId>"
}
```

- **IV**: 96 bits, fresh per encryption, from `crypto.getRandomValues` with a
  `Math.random` last-resort fallback (origin-safety, Phase 9).
- **AAD binding**: the GCM additional-data string is `table:recordId` —
  an envelope moved to another row or table **fails authentication** on decrypt.
- The envelope format is byte-identical whether produced by native WebCrypto
  or the pure TypeScript fallback engine (§5) — callers never branch.

## §3.A. AAD Namespace Registry

| AAD namespace | Binds | Notes |
|:---|:---|:---|
| `vault_pearls:{id}` | Pearl `secret` | |
| `vault_pearls_totp:{id}` | Pearl `totp_secret` | Re-encryption target for imported Android seeds |
| `vault_pearls_custom:{id}` | Pearl `custom_fields` blob | |
| `vault_pearls_history:{id}` | Pearl `password_history` blob | Client-side sealed password generation history (Phase 21 Sub-Phase) |
| `vault_secure_notes:{id}` | Note `content` | |
| `vault_secure_notes_custom:{id}` | Note `custom_fields` blob | |
| `vault_ssh_keys:{id}` | SSH key `key_value` | |
| `vault_ssh_keys_custom:{id}` | SSH key `custom_fields` blob | |
| `vault_secure_attachments:{id}` | Attachment `file_data` | |
| `totp_backup:{ownerUuid}` | `sgtotp.bak` import bridge | Distinct derivation — salt = envelope `ownerUuid` (see `import-export-spec.md` §2) |

Namespace uniqueness per table per field prevents **envelope shuffling**
between item types.

---

## §4. Encrypt / Decrypt Semantics (`encryptField` / `decryptField`)

**Encrypt** — `encryptField(plaintext, shellKey, table, recordId)`:
1. Escape hatch: if `VITE_SHELLCRYPTION_ENABLED === 'false'`, return the
   plaintext as-is (local dev only; never set in production).
2. Generate the 96-bit IV, build the AAD string, encrypt AES-GCM-256.
3. Return the envelope JSON (§3).

**Decrypt** — `decryptField(encryptedJson, shellKey, table, recordId)` —
the passthrough ladder, in order:
1. **Non-JSON input** (`SyntaxError` on parse) → return input unchanged
   (legacy plaintext).
2. **JSON without envelope shape** (missing `v`, `alg`, `iv`, or `ct`) →
   return input unchanged (plaintext that happens to be JSON).
3. **AAD mismatch** (envelope `aad` ≠ `table:recordId`) → **throw** — never
   return a guessed plaintext for a bound envelope.
4. **Engine unavailable** → throw (a CryptoKey with no `crypto.subtle` and no
   fallback raw key is an unrecoverable state).
5. **GCM auth failure or any other error** → return the sentinel
   `⚠️ [Decryption Failed]` (wrong key/identity, corrupted blob).

> Invariant: steps 1–2 are what make the legacy-plaintext backward
> compatibility of `encryption-layers-spec.md` §3 possible — both engines
> coexist in one column, discriminated by envelope shape alone.

---

## §5. The Engine Selector (Native ↔ Pure TypeScript)

`deriveShellKey` and the field functions route through an availability
check — the caller never branches:

- **Native path**: `crypto.subtle.importKey(HKDF)` → `deriveKey` →
  `crypto.subtle.encrypt/decrypt` (secure origins).
- **Fallback path**: `webCryptoFallback.ts` (see
  `encryption-layers-spec.md` §5) — `hkdfSha256` returns raw bytes wrapped in
  a `ShellKeyFallback` object (`_rawKey`, algorithm-tagged, non-extractable
  semantics), then `aesGcmEncrypt`/`aesGcmDecrypt`. This is the plain-HTTP
  LAN topology (Unraid at `192.168.x.x`).
- Both paths emit the identical envelope (§3); `tests/unit/webCryptoFallback.test.ts`
  proves native-vector parity for the fallback primitives, and
  `tests/unit/customFields.test.ts` + `tests/unit/sgtotpBackup.test.ts`
  exercise full round-trips through the engine.

---

## §6. Invariants

1. **Plaintext never crosses the wire** — the server stores §3 envelopes
   byte-for-byte and treats them as opaque (opacity invariant,
   `routes-and-contracts.md` §3).
2. **The `hu-` key is never transmitted** — only its SHA-256 hash authenticates
   (see `key-hierarchy-spec.md` §2); the derived key exists in client memory
   only and is purged on lock, logout, and session expiry.
3. **AAD is binding, not advisory** — envelope relocation fails closed (§4.3).
4. **One engine, one envelope** — native and fallback output are
   indistinguishable; any divergence is a defect.
5. **The firewall holds** — ShellCryption columns are absent from
   `metadataGuard.ts`, forever (§1).

---
