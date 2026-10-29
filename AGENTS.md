# This is the ShellGuard project. Project rules are as follows.

## 1. Project Meaning & Purpose

- **Mission:** Self-hosted zero-knowledge secrets vault for humans and autonomous AI agents. Eliminates third-party cloud trust while enabling safe agentic collaboration.
- **Collaborative Zero-Knowledge:** AI agents operate under scoped LobsterKeys©™ (`lb-`) with structural permissions (`canRead`, `canWrite`, `canEdit`, `canDelete`) to organize metadata. Secrets remain mathematically opaque, client-encrypted ciphertext blobs.
- **Triple-Layer Bedrock:** Layer 1 Client ShellCryption©™ (AES-GCM-256 via WebCrypto HKDF of `hu-` key) + Layer 2 Server MetadataGuard (per-row AES-256-GCM) + Layer 3 Storage SQLCipher (`better-sqlite3-multiple-ciphers`).
- **Stateless Identity Authentication:** No master passwords on server. Client transmits SHA-256 hashes of `hu-` or `lb-` keys; database stores only hashes and validates via constant-time comparison.
- **Native Streaming BLOB Storage:** Raw ciphertext stored in SQLite BLOBs with Busboy streaming uploads (500MB max, 1GB quota) and 1MB chunked `substr()` downloads. Zero base64 inflation.
- **The Reef Handshake:** Zero-touch mobile pairing via QR (`shellguard://pair`). Host identity anchored by root EC P-256 key (`DATA_DIR/instance.key`) signing TLS rotation proofs for auto-healing sync.
- **Existence Constraint:** Build features around security, never security around features. A compromised host or DB dump must yield zero plaintext.

---

## 2. Project Rules

### Top-Level Invariables
1. **Zero-Knowledge by Construction:** Server and background processes must NEVER see, process, or log plaintext secrets or raw keys (`hu-`, `lb-`).
2. **Mandatory Ownership Scoping:** All user SQL queries must enforce `WHERE owner_uuid = ?`. Cross-tenant queries return `404 Not Found`, never `403`.
3. **Segregated Append-Only Audit:** All mutations log to `audit.sqlite`, strictly isolated from `db.sqlite`. Redaction of sensitive fields is non-negotiable.
4. **Sovereign Agent Boundaries:** `.agents/` (Antigravity), `.clinerules/` (Cline), `.jules/` (Jules). Zero cross-home writes, mirrors, or commits.
5. **Host Preservation & Cloud CI Gate:** Host CPU/RAM is constrained. **NEVER run `npm test`, `npm run build`, or `npm run docs:build` locally on host.** Static lint locally (`npm run lint`); push and tail cloud verification on GitHub Actions (`.github/workflows/ci.yml`) via `gh run watch`. Task completion requires 100% green cloud CI.
6. **Documentation Bows to Code:** Root manifests and the VitePress portal (`docs/`) must 100% reflect runtime code truth. Zero dangling claims.

### Immutable Operating Rules
1. **Validate at Trust Boundaries:** All HTTP request bodies must validate through Zod schemas before reaching route handlers.
2. **Never Execute Data:** User inputs and decrypted attachment payloads must never be evaluated dynamically (`eval`, shell execution, or unsanitized HTML).
3. **Fail Closed:** On missing key material, rate exhaustion, or crypto errors, fail immediately with a secure terminal response.
4. **Two-Layer Commit Attribution:** Conventional Commits with mandatory `User: <name>` and `AI: <agent>` trailers.
5. **Fix the Gap, Not the Error:** Expected output is the invariant. Restate it before each fix. Expected vs actual is the gap. Fix the gap, not the error.
6. **Confirm Before Building:** Unverified is not known. Confirm before you build.

---

## 3. Project Patterns

- **Envelope Contract:** Success responses wrap in `{ success: true, data: T }` unwrapped centrally by `src/services/api/restAdapter.ts`. Errors use `{ error, message }`.
- **In-Place Metadata Encryption:** `MetadataGuard` stores JSON ciphertext envelopes in standard TEXT columns. Unencrypted legacy values pass through unchanged.
- **Eye-beside-Copy Ergonomics:** Unmask toggle sits immediately to the **LEFT** of Copy on all masked fields. Proportional, length-truthful masking invariant.
- **Hash-Only Key Ledger:** Plaintext `lb-` returned once at creation. Database persists only SHA-256 `key_hash` and 12-char fingerprint. Constant-time `timingSafeEqual()` verification.
- **WebCrypto Insecure Origin Fallback:** Non-secure HTTP LAN origins automatically branch to pure-TS engine (`src/lib/webCryptoFallback.ts`) for cryptographic primitives.
- **Dual Export Derivation:** ClawKeys derive via HKDF-SHA256; passphrases derive via PBKDF2-HMAC-SHA256 (600,000 iterations) with WebCrypto off-thread acceleration and pure-TS fallback.
- **Zero Native Browser Dialogs:** Modals must use accessible custom cards (`ConfirmDialog`, `PodModal`, `ItemFormModal`). Never invoke `alert()`, `confirm()`, or `prompt()`.
- **Express 5 Static Route Precedence:** Static and bulk endpoints (`/bulk-import`, `/bulk`, `/quota`) MUST be registered before dynamic parameter routes (`/:id`).

---

## 4. Project Navigation

> **Agent Mapping Mandate:** Do not rely on static file trees. When assigned a task, use your search tools or delegate to a sub-agent to map the exact files along the relevant seam before modifying code.

### Core Seams & Boundaries
- **Carapace Gateway (`src/server/`):** Express 5 pipeline. Static assets in root `server.ts`, domain endpoints in `routes/`, security gates in `middleware/`, database singletons in `database/`, and cryptographic wrappers in `utils/`.
- **Reef Modernist UI (`src/components/`):** React 18 SPA. Vault workspace in `Vault/`, SuperLobster admin panel in `Admin/`, generator widgets in `Generator/`, and design primitives in `ui/`. All client API mutations flow exclusively through `src/services/api/restAdapter.ts`.
- **Zero-Knowledge Core (`src/lib/`):** Client-side crypto (`shellCryption.ts`), HTTP LAN fallback engine (`webCryptoFallback.ts`), Bitwarden import harvester (`bitwarden.ts`), and keypair generators (`keyGen.ts`).
- **Persistence Bedrock (`migrations/`, `data/`):** Authoritative DDL in `migrations/` (`0001` through `0008`). Production SQLite files in `data/` (`db.sqlite`, `audit.sqlite`, `instance.key`).
- **Documentation Portal (`docs/`):** VitePress site (36+ pages) strictly mirroring runtime code truth.
- **Verification Gates (`tests/`, `.github/workflows/`):** Unit and integration suites executed strictly in cloud CI runners via `.github/workflows/ci.yml`.

---

## 5. Project Skills

| Skill | Generative Capability | Target Boundary |
|---|---|---|
| `shellguard-agent-api` | Zero-knowledge HTTP API interaction with `lb-` keys & `api-` tokens | `src/server/routes/agentKeys.ts`, `skills/shellguard/` |
| `cloud-ci-verification` | Orchestrate cloud-offloaded test/build runs on GitHub Actions; preserve host resources | `.github/workflows/ci.yml`, `git-hygiene` |
| `zero-knowledge-crypto` | WebCrypto HKDF, AES-GCM-256 envelopes, non-extractable keys, pure-TS LAN fallbacks | `src/lib/shellCryption.ts`, `src/server/utils/` |
| `docs-as-code-audit` | Verify VitePress link integrity, docs-bow-to-code alignment, single release draft | `docs/`, `tests/unit/docsLinks.test.ts` |
| `two-agent-orchestration` | Manage orchestrator/worker boundaries and PR reviews (Antigravity & Jules) | `.jules/`, PR reviews, workflows |
| `reef-modernist-ui` | Bioluminescent design tokens, dark mode, custom modals, Eye-beside-Copy layout | `src/components/`, `src/lib/cardUtils.ts` |
| `sqlite-migration-hygiene` | Author idempotent `.up.sql`/`.down.sql`, manage schema versions and streaming BLOBs | `migrations/`, `src/server/database/` |
| `bitwarden-ingestion-pipeline`| Lossless import parsing, residual field harvesting, dynamic TOTP URI decomposition | `src/lib/bitwarden.ts`, `tests/unit/` |
| `git-advanced-workflows` | Interactive rebase, autosquash, worktree task isolation, two-layer attribution | Git commits, branch management |
| `changelog-release-automation`| SemVer version calculus, Keep a Changelog sync, automated release tagging | `CHANGELOG.md`, `project/ROADMAP-ERA2.md` |

---

## References
- **Spec:** [`project/meta-prompt-ai-studio-era2.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/project/meta-prompt-ai-studio-era2.md), [`project/architecture.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/project/architecture.md), [`project/database-schema.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/project/database-schema.md), [`project/routes-and-contracts.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/project/routes-and-contracts.md), [`BLUEPRINT.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/BLUEPRINT.md)
- **Roadmap:** [`project/ROADMAP-ERA2.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/project/ROADMAP-ERA2.md)
- **Rules:** [`.agents/rules/git-hygiene.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/rules/git-hygiene.md), [`.agents/rules/docs-hygiene.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/rules/docs-hygiene.md), [`.agents/rules/cadence-and-lifecycle-prompts.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/rules/cadence-and-lifecycle-prompts.md), [`.agents/rules/self-review-checklist.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/rules/self-review-checklist.md)
- **Skills:** [`skills/shellguard/SKILL.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/skills/shellguard/SKILL.md), [`.agents/skills/doc-automation/SKILL.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/skills/doc-automation/SKILL.md), [`.agents/skills/git-advanced-workflows/SKILL.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/skills/git-advanced-workflows/SKILL.md), [`.agents/skills/changelog-automation/SKILL.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard/.agents/skills/changelog-automation/SKILL.md)
