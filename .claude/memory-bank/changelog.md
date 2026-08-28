# Changelog — ShellGuard

## [0.2.0] - 2026-08-27

### Added
- Per-row AES-256-GCM metadata encryption (title, username, url, category, notes, file_name)
- Triple-layer encryption model documentation across all project docs
- Security boundary table showing what each actor can access
- ClawKey backup guidance (2+ secure locations, lose key = lose everything)
- AGPL-3.0 license
- Per-row encryption and multi-user architecture ROADMAP items
- `fieldEncryption.ts` — core crypto module (HKDF + AES-256-GCM, native Node crypto)
- `metadataGuard.ts` — column registry + prepareWrite/prepareRead helpers
- `metadata-encryption.test.ts` — 13 tests in 3 groups (unit, API, backward-compat)
- Batch encrypt/decrypt scripts for legacy data migration
- Migration 0002 (no-op version tracker)

### Changed
- Port migration: 4545→5353, 4646→5454 across all config, Docker, tests, docs
- All vault routes (vault, notes, sshKeys, attachments) now async with metadata encrypt/decrypt
- `DB_ENCRYPTION_KEY` now governs both SQLCipher AND per-row metadata encryption
- README, SECURITY, ARCHITECTURE, BLUEPRINT, QUICKSTART updated for triple-layer model
- npm audit vulnerabilities fixed

### Fixed
- Integration fixes: test wiring, schema validation, import paths
- Test isolation: per-suite DATA_DIR and PORT allocation

### Technical Decisions
- Native Node `crypto` (NOT `crypto.webcrypto.subtle` which hangs in this environment)
- In-place encryption: no schema changes, encrypted JSON in same TEXT columns
- Backward compatibility: legacy plaintext passes through on read
- `SG-META` envelope deliberately distinct from ShellCryption's `AES-GCM-256`

---

## [0.1.0] - 2026-08-24

### Added
- Initial ShellGuard setup from ClawChives v3.4.0 twin
- Auth parity (register/token/validate + SG-only me/profile)
- Zero-knowledge invariant (ShellCryption blobs with AAD binding)
- Domain API parity (pearls, notes, SSH keys, attachments)
- LobsterKeys lifecycle (create/revoke/delete)
- Test harness (auth-flow, security, vault-crud, settings, build-gates)
- Containerization (Dockerfile, compose, Unraid template)
- CI (docker-publish → GHCR)
- Documentation suite (README, ARCHITECTURE, SECURITY, QUICKSTART, etc.)
