# Layer 1: Resting ShellCryption, HKDF & AAD Taxonomy

## 1. Overview & Axioms

**Resting ShellCryption** is ShellGuard's primary application-layer cryptographic protocol. It operates under two fundamental axioms:
1. **Zero-Knowledge Storage**: The server never possesses the plaintext keys required to decrypt vault contents.
2. **Context-Bound Ciphertext**: Ciphertexts cannot be transplanted between different items, fields, or users without failing cryptographic authentication.

---

## 2. Key Derivation Architecture (HKDF-SHA256)

Root client keys (`hu-` credentials, or **ClawKeys**) are never used directly to encrypt vault fields. Instead, symmetric sub-keys are derived using HMAC-based Key Derivation Function (HKDF) adhering to RFC 5869.

```text
+---------------------------------------------------------+
|                  ClawKey (hu-<Base62>)                  |
+---------------------------------------------------------+
                            |
                            v
               HKDF-Extract (Salt = owner_uuid)
                            |
                            v
              Pseudo-Random Key (PRK, 256 bits)
                            |
                            v
               HKDF-Expand (Info = "shellguard-layer1-sensitive-v1")
                            |
                            v
+---------------------------------------------------------+
|             SENSITIVE_KEY (AES-256-GCM Key)             |
+---------------------------------------------------------+
```

### Derivation Parameters
- **Hash Function**: SHA-256
- **Input Keying Material (IKM)**: `ClawKey` UTF-8 bytes (minimum 256 bits of entropy)
- **Salt**: Canonical UTF-8 bytes of `owner_uuid`
- **Info String**: `"shellguard-layer1-sensitive-v1"`
- **Output Key Length (L)**: 32 bytes (256 bits)

---

## 3. Envelope Encryption & Canonical AAD Serialization

Each encrypted field is sealed inside an AES-256-GCM envelope with an authenticated tag and Additional Authenticated Data (AAD).

### AES-GCM-256 Parameters
- **Key**: Derived `SENSITIVE_KEY` (256 bits)
- **Initialization Vector (IV)**: 12 bytes (96 bits) cryptographically random per operation (`crypto.getRandomValues`). An IV is **never reused** with the same key.
- **Authentication Tag**: 16 bytes (128 bits) appended to the ciphertext.

### Canonical AAD Serialization Formula
To prevent an adversary with database access from swapping ciphertexts across different rows or fields (ciphertext transplantation attacks), the AAD binds the ciphertext strictly to its logical context:

$$\text{AAD} = \text{owner\_uuid} \parallel \text{":"} \parallel \text{item\_id} \parallel \text{":"} \parallel \text{rev} \parallel \text{":"} \parallel \text{field\_name}$$

Where:
- `owner_uuid`: The UUIDv4 string of the vault owner.
- `item_id`: The UUIDv4 string of the parent record.
- `rev`: Monotonically increasing revision counter (`1`, `2`, `...`).
- `field_name`: The canonical field identifier (`"password"`, `"notes"`, `"totp_seed"`, `"custom_fields"`).

If an attacker attempts to copy the encrypted ciphertext of a password into an identity field or another user's vault row, decryption will abort with a Galois Counter Mode authentication failure.
