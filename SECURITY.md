# 🛡️ Security Policy — ShellGuard

[![Security](https://img.shields.io/badge/Security-Zero_Knowledge_Vault-red?style=for-the-badge)](#)
[![Reporting](https://img.shields.io/badge/Reporting-Responsible_Disclosure-orange?style=for-the-badge)](#)

> A secrets vault is a juicier target than a bookmark manager. This document describes the security model as it actually is — including what the server *can't* protect you from.

---

## 📋 Table of Contents

<details>
<summary>Click to expand</summary>

- [Security Model Overview](#-security-model-overview)
- [Key Types](#-key-types)
- [Security Practices](#-security-practices)
- [Database Encryption](#️-database-encryption)
- [OWASP Coverage Checklist](#-owasp-coverage-checklist)
- [Attack Scenarios & Mitigations](#-attack-scenarios--mitigations)
- [Reporting a Vulnerability](#-reporting-a-vulnerability)
- [Self-Hosted Hardening Checklist](#️-self-hosted-hardening-checklist)

</details>

---

## 🔑 Security Model Overview

ShellGuard stacks **two independent layers of encryption**, and only one of them involves the server:

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER 1 — ShellCryption©™ (zero-knowledge, always on)       │
│                                                              │
│    HKDF-SHA-256(hu- key, salt = uuid) → AES-GCM-256 key      │
│    • Derived in YOUR BROWSER, lives in memory for a session  │
│    • Encrypts every secret field client-side                 │
│    • Server stores only {v, alg, iv, ct, aad} blobs          │
│    • AAD binds table:recordId → blobs can't be shuffled      │
│    • The server CANNOT decrypt your pearls. Ever.            │
│                                                              │
│  LAYER 2 — SQLCipher at rest (optional defense-in-depth)     │
│                                                              │
│    DB_ENCRYPTION_KEY → whole-file AES-256                    │
│    • Covers METADATA ONLY in practice: categories, types,    │
│      urls, mime types, timestamps, settings                  │
│    • Strongly recommended for production                     │
│    • Unset ⇒ server WARNS but NEVER BLOCKS — your choice     │
└──────────────────────────────────────────────────────────────┘
```

Identity itself is key-based — there are no passwords or accounts on a remote server.

```
┌──────────────────────────────────────────────────────────┐
│  Identity Key File: shellguard_identity_key.json         │
│                                                          │
│  {                                                       │
│    "username": "your-username",                          │
│    "uuid":     "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",   │
│    "token":    "hu-[64 random chars]"                    │
│  }                                                       │
│                                                          │
│  ⚠️  This file IS your password AND your decryption key. │
│  ⚠️  Losing it = permanent lockout of your pearls.       │
│  ⚠️  Never share it. Never commit it to version control. │
└──────────────────────────────────────────────────────────┘
```

### Key Types

| Prefix | Type | Scope | Storage |
|---|---|---|---|
| `hu-` | Human Identity Key (ShellKey©™) | One-Field login lookup; seeds ShellCryption | Server DB (`key_hash` UNIQUE index, hash only) |
| `lb-` | Lobster/Agent Key | Scoped automated access | Server DB (`lobster_keys`, hashed, revocable) |
| `api-` | REST Session Token | API session access, TTL-bound | Server DB (`api_tokens`), short-lived |

> [!TIP]
> See [ARCHITECTURE.md § Key System Architecture](./ARCHITECTURE.md) for full technical details on generation entropy, hashing and rotation.

---

## 🔒 Security Practices

<details>
<summary>Client-Side (Session Memory)</summary>

- Raw `hu-` keys are **never sent to the server**. Only the SHA-256 hash crosses the wire, exchanged via `POST /api/auth/token` for a short-lived `api-` bearer.
- The `api-` token lives in `sessionStorage` under the exported constant `sg_api_token` — it evaporates on tab close, logout, or inactivity lock ("Retract").
- The derived AES-GCM ShellCryption key is non-extractable and held only in session memory; closing the tab destroys it.
- Encryption uses per-field random IVs and AAD bound to `table:recordId`, so ciphertexts cannot be transplanted between rows.
- Generator history stays in `sessionStorage`; preferences synced to the server are non-secret only (theme, generator defaults, pods, security timeout).
- Exports of decrypted vault contents require **re-entering the `hu-` key** even mid-session (Settings → Import/Export).

</details>

<details>
<summary>Server-Side (Express & SQLite)</summary>

- **`requireAuth`**: Validates the bearer `api-` token against `api_tokens` (with expiry), injects identity + permission context.
- **`requirePermission(action)`**: Verb-mapped locks (`GET→canRead`, `POST→canWrite`, `PUT→canEdit`, `DELETE→canDelete`) enforced per agent key.
- **`requireHuman`**: Walls off `/api/settings`, `/api/agent-keys` and `/api/auth/profile` so agent keys can never mutate configuration or mint new keys.
- **Ownership scoping**: Every query filters `owner_uuid`. Cross-owner reads return 404 — no existence leak.
- **Constant-time comparison** for all key-hash checks; no timing side channels.
- **Zod validation** (`validateBody`) on every mutating route before SQL executes.
- **Helmet** security headers with a vault-appropriate CSP (no reader-mode connect-src).
- **Parameterized queries only** — `db.prepare(...).run(?, ?)` across every handler. Never string interpolation.
- **Segregated append-only audit reef** (`audit.sqlite`) records every mutation with an extended redaction list (delta #2): titles, urls, usernames, secrets, tokens and ciphertext are never logged. Retention prunes daily (90-day default, 10k row cap).
- SQLite runs WAL journal mode, `synchronous NORMAL`, enforced foreign keys, and `busy_timeout`.
- `NODE_ENV=production` disables stack traces in error responses.

</details>

<details>
<summary>Docker & Deployment Security</summary>

- Single multi-stage image on **node:20-alpine**; CI (GitHub Actions) is the only image publisher to GHCR.
- The container drops privileges via `su-exec` after remapping `PUID`/`PGID` and `chown`ing `DATA_DIR` — run as non-root on your host's terms.
- Data lives in a bind mount (`./data:/app/data`); database files get `0600` permissions and `077` umask from the connection layer.
- Only port `4545` is exposed; the frontend never talks to the database directly.
- Container `HEALTHCHECK` hits `/api/health` so orchestrators notice a cracked shell.
- `TRUST_PROXY=false` by default — flip it only behind a proxy you control, so rate limiting sees real client IPs.

</details>

---

## 🗝️ Database Encryption

ShellGuard supports **AES-256 whole-file encryption at rest** via SQLCipher (`better-sqlite3-multiple-ciphers`). This protects the metadata that zero-knowledge deliberately leaves queryable.

> [!IMPORTANT]
> **Optionality is a feature, not an oversight.**
>
> - Setting `DB_ENCRYPTION_KEY` is **strongly recommended for production** deployments.
> - It is **never required**: without it the server logs a warning at startup and runs normally — we do not block your self-hosted reef because you chose plaintext.
> - Remember what it does and doesn't cover: your secret fields are already ciphertext thanks to ShellCryption; this key additionally scrambles the *metadata* (categories, urls, timestamps, mime types, settings). That metadata is more revealing about a vault than most people assume.

### Enabling Encryption

Generate a secure key:

```bash
openssl rand -base64 32
```

**Using Docker:** set it in your compose environment:

```yaml
environment:
  - DB_ENCRYPTION_KEY=your-generated-key-here
```

Then restart:

```bash
docker compose up -d --wait
```

**Using npm:**

```bash
export DB_ENCRYPTION_KEY=your-generated-key-here
npm run start:api
```

### Re-keying & Rotation

The connection layer includes a `sqlcipher_export` fallback:

1. Set (or change) `DB_ENCRYPTION_KEY`
2. Restart the application
3. An unencrypted or differently-keyed database is transparently re-keyed in place

> [!CAUTION]
> **Key Management**: If you lose `DB_ENCRYPTION_KEY`, the file-level metadata becomes inaccessible — treat the key like a second identity file. Store it separately from your backups (password manager / secrets vault), never in the same directory as `data/`, and never committed to version control. Note that a value placed in `docker-compose.yml` is visible via `docker inspect`; use Docker Secrets on shared systems.

---

## 📊 OWASP Coverage Checklist

| Threat | Status | Implementation | Details |
|---|---|---|---|
| **SQL Injection** | ✅ Mitigated | Parameterized queries via better-sqlite3 | All access through prepared statements; no string concatenation anywhere |
| **Cross-Site Scripting (XSS)** | ✅ Mitigated | React auto-escaping + helmet CSP | No `innerHTML` sinks; strict content-security policy on top |
| **Cross-Site Request Forgery (CSRF)** | ✅ Mitigated | Bearer-token auth (not cookies) | No auth cookies exist to forge; requests require explicit `Authorization` header |
| **Authentication Bypass** | ✅ Mitigated | SHA-256 key hashes + constant-time compare | Timing-safe verification; raw keys never stored server-side |
| **Authorization Bypass** | ✅ Mitigated | `requirePermission()` + `owner_uuid` scoping | Verb-mapped permissions per route; every query owner-filtered; cross-owner reads return 404 |
| **Rate Limiting** | ✅ Mitigated | Three tiers | Global `apiLimiter` (100 req/min), `authLimiter` (5 attempts/15m, skips successful logins), per-agent LRU limiter honoring each key's configured rate limit (1–10000) |
| **Audit Trail** | ✅ Mitigated | Segregated append-only `audit.sqlite` | Every mutation logged with extended redaction; daily retention prune; tamper-resistant isolation from live data |

### Key Leakage Vectors

| Key Type | Storage | Risk | Mitigation |
|---|---|---|---|
| `hu-` keys | Client memory/sessionStorage only | Stolen if browser compromised | Never sent unhashed; cleared on tab close; seeds encryption, so theft ≠ decryption without the session |
| `api-` tokens | Server DB with expiry | Replayable until TTL | Short-lived (default 24h); purged periodically; revocable by killing the session |
| `lb-` keys | Server DB, revocable per-agent | Over-scoped or leaked keys | Granular permissions + expiry + rate limits; instant revoke in Settings → Agent Keys; audited usage |

---

## 💀 Attack Scenarios & Mitigations

These are written specifically for a **vault**: assume the attacker wants your pearls, not just your bookmarks.

#### Scenario 1: "Someone stole my `db.sqlite` file" — WITHOUT `DB_ENCRYPTION_KEY`

**Risk**: Attacker has the data file offline.

**Reality check**: Secret fields are still ShellCryption blobs — `{v, alg, iv, ct, aad}` JSON that is undecryptable without your `hu-`-derived key, which exists nowhere on the server. However, the attacker gets **metadata in plaintext**: item categories/types, entry URLs, attachment names/mime types, timestamps, usernames-as-metadata, settings. For a vault, that inventory alone tells them which bank you use and when you last rotated.

**Mitigations**:
- Enable `DB_ENCRYPTION_KEY` — this exact scenario is why it exists (see Scenario 2)
- Treat metadata as sensitive; don't put secrets-in-clear into category/url fields
- Keep `DATA_DIR` off shared network volumes

#### Scenario 2: "Someone stole my `db.sqlite` file" — WITH `DB_ENCRYPTION_KEY`

**Risk**: Attacker has an encrypted file they can't open.

**Mitigations**:
- Without `DB_ENCRYPTION_KEY` the file is inert; brute-forcing AES-256 is not feasible
- They must now steal *both* the file *and* the key — store them apart
- Rotate the key after any suspected host compromise (re-keying is automatic on restart)
- Back up the encrypted file freely; back up the key separately and encrypted

#### Scenario 3: "Someone stole my `api-` session token"

**Risk**: Attacker can impersonate your session over the API within its TTL.

**Mitigations**:
- Tokens expire via `TOKEN_TTL_DEFAULT` (default 24h; set shorter on hostile networks, e.g. `TOKEN_TTL_DEFAULT=480`)
- Expired tokens are purged periodically; a stolen token dies with its TTL
- Always terminate TLS at your reverse proxy (`ENFORCE_HTTPS=true` if terminating in-process) so tokens aren't sniffable in transit
- Session state also lives in `sessionStorage` — closing the tab is a partial kill switch

#### Scenario 4: "A malicious agent abused its over-scoped Lobster Key"

**Risk**: You gave an agent `canDelete` "just for testing". It (or whoever controls it) exfiltrates readable pearls or wrecks the grotto.

**Mitigations**:
- Grant the **minimum claw strength**: a read-only fetcher needs only `canRead`
- Agent keys cannot touch `/api/settings`, `/api/agent-keys`, or your profile (`requireHuman`) — they can never escalate by minting keys
- Per-key rate limits (1–10000 req/min) cap bulk-exfiltration speed; global limits cap total abuse
- Expiration options (`30d`/`90d`/`1y`) auto-retire stale keys
- Revoke instantly in Settings → Agent Keys; the audit reef shows everything that key ever did (timestamped, secret-free)

#### Scenario 5: "Browser memory or clipboard exposure"

**Risk**: Decrypted pearls exist in page memory and your clipboard — malware, shoulder-surfers, or paste-happy mishaps can grab them.

**Mitigations**:
- Inactivity auto-lock ("Retract") clears session state and discards the CryptoKey after your configured timeout — enable it (5/15/30 minutes)
- Copy actions go through the clipboard manager with hygiene rules; paste once and move on
- Run a supported browser, keep extensions minimal, and never install unknown ones on vault machines
- Decrypted exports require fresh `hu-` re-authentication — a locked UI isn't enough to leak a backup

#### Scenario 6: "My backups leaked"

**Risk**: A `data/` copy (cloud sync, NAS snapshot, old USB stick) escaped your control.

**Mitigations**:
- With `DB_ENCRYPTION_KEY` set, leaked backups reveal no metadata and no secrets
- Without it, secrets remain ShellCryption-protected but metadata leaks (Scenario 1) — encrypt the volume holding backups too
- Never co-locate `DB_ENCRYPTION_KEY` and backups in the same store
- Audit logs are segregated precisely so a leaked `db.sqlite` doesn't hand over behavioral history either — back up both files, secure both equally

---

## 🚨 Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report privately:

1. **Email**: Reach out to the maintainer directly (see GitHub profile).
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)
3. **Response time**: We aim to acknowledge within 72 hours.
4. **Credit**: Reporters are acknowledged in release notes (anonymity respected on request).

---

## 🛡️ Self-Hosted Hardening Checklist

Before exposing ShellGuard to anything beyond localhost:

- [ ] Set **`DB_ENCRYPTION_KEY`** (`openssl rand -base64 32`) — optional but strongly recommended
- [ ] Place the app behind **Nginx/Caddy with TLS**, or set `ENFORCE_HTTPS=true` if terminating in-process
- [ ] Set **`TRUST_PROXY=true`** only behind your reverse proxy (correct IPs for rate limiting)
- [ ] Set **`CORS_ORIGIN`** to your specific origin — not wildcard
- [ ] Restrict port `4545` to localhost/LAN and proxy publicly via TLS
- [ ] Keep **`VITE_SHELLCRYPTION_ENABLED=true`** — never ship a plaintext-at-column vault
- [ ] Set a sane **`TOKEN_TTL_DEFAULT`** for your threat model (shorter than 24h on shared networks)
- [ ] Back up **both** `data/db.sqlite` and `data/audit.sqlite` regularly — and keep the encryption key elsewhere
- [ ] Pin **`PUID`/`PGID`** to a non-root host user (Unraid template defaults: `PUID=99`/`PGID=100`)
- [ ] Review audit logs for unusual agent activity; revoke idle Lobster Keys
- [ ] Store your `hu-` identity key offline in a secure vault

---

## 🔗 Cross-References

- **Zero-knowledge invariant details**: See [ARCHITECTURE.md § Hard Constraints](./ARCHITECTURE.md)
- **Full key system technicalities**: See [ARCHITECTURE.md § Key System Architecture](./ARCHITECTURE.md)
- **Deployment instructions**: See [README.md § Running with Docker](./README.md) and [QUICKSTART.md](./QUICKSTART.md)
- **Contribution security standards**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **ClawStack security alignment**: See [CRUSTSECURITY.md](./CRUSTSECURITY.md)

---

<div align="center">

**Maintained by CrustAgent©™ — Trust the Shell.**

</div>
