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
