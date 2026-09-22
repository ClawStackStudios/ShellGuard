# Project Brief — ShellGuard

## What

ShellGuard is a privacy-first, self-hostable **secrets vault** built for the Human-Agent ecosystem. Passwords, TOTP seeds, secure notes, SSH keys, and encrypted attachments live as *pearls* behind a hardened carapace.

## Core Requirements

- **Zero-knowledge architecture**: Secrets are encrypted client-side before reaching the server. The server stores only ciphertext blobs and cannot decrypt them.
- **Triple-layer encryption**: ShellCryption (client) + Per-Row Metadata Encryption (server) + SQLCipher (whole-DB)
- **Agent isolation**: AI agents can organize vaults but never see actual passwords, TOTP seeds, SSH keys, or file contents
- **Identity-key based**: No passwords or accounts on a remote server. `hu-` keys are the root of trust.
- **Self-hostable**: Docker-first, single container, PUID/PGID aware, Unraid template included
- **AGPL-3.0 licensed**
- **Third-party auditable**: the corpus (genome → root docs → portal → code → tests) must be traversable by an external cryptologist with zero dangling claims; the claim battery (grep enforcing code first, assert doc second) is a standing gate (Phase 24)

## Goals

1. Provide a secure, self-hosted secrets vault for the ClawStack Studios ecosystem
2. Enable AI agents to assist with vault organization without accessing secrets
3. Maintain zero-knowledge invariant — server never sees plaintext secrets
4. Support per-row metadata encryption for defense-in-depth
5. Ship with comprehensive test coverage and documentation
6. Remain third-party auditable: every doc claim traceable to its enforcing code, and the code to its witnessing test (cryptographer's lens, 2026-09-16)

## Scope

- Vault CRUD: pearls (logins), secure notes, SSH keys, attachments
- **Vault tagging system** with granular filter bar (AND/OR), shared pod/tag color engine, and `?tags=a,b` intersection filtering (Phase 20)
- **Bulk operations** — transactional `POST /api/vault/bulk-import` (up to 1,000 items, HTTP 207 Multi-Status per-record error reporting) and `DELETE /api/vault/bulk` with attachment cascade; tri-state multi-select with a floating action bar (Move to Pod / Assign Tag / Delete) and a batch import wizard with preview + error-resolution chips (Phase 21)
- **Bitwarden interoperability** — native ingestion of Bitwarden JSON and CSV exports (folders→pods via `normalizePod`, compound SSH keypairs, custom fields, `otpauth://` TOTP extraction), with encrypted-export detection that guides rather than importing ciphertext (Phase 21 Sub-Phase)
- **Sovereign export suite** — zero-knowledge AES-256-GCM encrypted backup envelopes (ClawKey via HKDF, or passphrase via PBKDF2-SHA256 @600k) plus RFC 4180 CSV with a password-sanitization audit toggle (Phase 21 Sub-Phase)
- LobsterKeys (agent keys) with granular permissions, expiry, rate limits
- Password generator with complexity scoring
- Segregated append-only audit trail
- Settings sync (non-secret preferences only)
- Import/export (CSV metadata / re-auth-gated JSON)

## Out of Scope (Current Cycle)

- Multi-user architecture (roadmap item)
- Admin control plane (deferred per locked decision)
- WebAuthn/hardware-backed key storage
- Server-side search index
