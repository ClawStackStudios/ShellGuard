# Active Context — ShellGuard

## Current Work Focus

Documentation of the triple-layer encryption model across all project docs. Per-row metadata encryption is implemented and tested.

## Recent Changes (Sliding Window — Latest 10)

1. **2026-08-27** — Triple-layer encryption docs updated across README, SECURITY, ARCHITECTURE, BLUEPRINT, QUICKSTART
2. **2026-08-27** — Port migration: 4545→5353, 4646→5454 across all config, Docker, tests, docs
3. **2026-08-27** — Per-row AES-256-GCM metadata encryption implemented and committed (`b71af08`)
4. **2026-08-27** — AGPL-3.0 license added, npm audit vulnerabilities fixed (`f33a580`)
5. **2026-08-27** — Integration fixes: test wiring, schema validation, import paths (`695a092`)
6. **2026-08-27** — Architecture, security model, quickstart and blueprint truthfulness docs (`7eeb265`)
7. **2026-08-27** — Integration, security and build-gate suites with per-suite db isolation (`2a9b85a`)

## Active Decisions

- **Locked**: SENSITIVE_KEY derived from `hu-` key via HKDF (one secret, one file)
- **Locked**: Keep SQLCipher whole-DB encryption as defense-in-depth alongside per-row encryption
- **Locked**: No admin routes/requireAdmin this cycle (deferred per threat-model pass)
- **Locked**: Twin-verbatim policy with ClawChives (server modules mirror file-for-file)

## Important Patterns

- In-place encryption: no schema changes, encrypted JSON in same TEXT columns
- Backward compatibility: legacy plaintext passes through on read
- `DB_ENCRYPTION_KEY` governs both SQLCipher AND per-row metadata encryption
- Native Node `crypto` (NOT `crypto.webcrypto.subtle` which hangs in this environment)

## Key Learnings

- `crypto.webcrypto.subtle` hangs on Linux 6.12.24-Unraid / Node v22.23.0 — use native `crypto` module
- Empty-string defaults (`""`, `"Personal"`) get encrypted when cipher is active because the route does `category || 'Personal'`
- Test isolation requires `vi.hoisted()` to set `DATA_DIR` and `PORT` before dynamic server import
