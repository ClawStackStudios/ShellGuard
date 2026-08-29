# Cryptographic Threat Model & Hardening

<CopyPage />

ShellGuard's security model addresses modern web vault threats and adversarial server compromise scenarios.

---

## 🛡️ Threat Mitigation Matrix

| Threat ID | Threat Scenario | Architectural Mitigation |
|---|---|---|
| **T1: Server DB Exfiltration** | An attacker steals `data/db.sqlite` from the host filesystem. | Secrets remain unbreakable AES-GCM-256 ciphertexts. If `DB_ENCRYPTION_KEY` is active, metadata and raw database pages are also fully encrypted. |
| **T2: Metadata Inference** | An attacker inspects item titles or URLs to profile targets. | Per-Row Metadata Encryption (Layer 2) encrypts titles, URLs, and notes in-place on the database. |
| **T3: Admin Abuse** | Malicious holder of `ADMIN_TOKEN` tries to exfiltrate passwords. | The `/superlobster` panel uses a strict metadata response model. Passwords and secret blobs are never returned in admin API routes. |
| **T4: Backup Exfiltration** | Attacker calls an API to download the database file. | **Zero download endpoints by design.** All backup snapshots are written server-side to `DATA_DIR/backups/`. Restorations are offline-only file swaps. |
| **T5: In-Memory Leakage** | Long-running browser session leaves keys vulnerable to XSS. | Auto-Lock Inactivity Retractor wipes decrypted state from memory after configurable idle timeout. |
| **T6: Brute Force Attacks** | Attacker attempts rapid login or admin guessing. | Dedicated rate limiters (5 attempts / 10 min on admin auth, 100 / 15 min on user token exchange). |

---

## 🔒 OWASP Top 10 Coverage

- **A01: Broken Access Control**: Strict ownership scoping (`WHERE owner_uuid = ?`) verified across all CRUD routes via automated security test gates.
- **A02: Cryptographic Failures**: Standardized Web Crypto API + Node.js native `crypto.createCipheriv` with random 96-bit IVs and unique HKDF salt bindings.
- **A03: Injection**: 100% parameterized SQLite prepared statements with strict Zod runtime schema validation.
- **A04: Insecure Design**: Zero-knowledge mathematics render the server fundamentally incapable of revealing secrets.
