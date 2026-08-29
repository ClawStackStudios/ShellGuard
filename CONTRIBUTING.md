# 🤝 Contributing to ShellGuard

[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=for-the-badge)](#)
[![Code Style](https://img.shields.io/badge/Code_Style-TypeScript_Strict-blue?style=for-the-badge)](#)
[![Twin Policy](https://img.shields.io/badge/Twin_Verbatim-ClawChives-purple?style=for-the-badge)](#️-architectural-rules)

Thank you for your interest in contributing to ShellGuard! This guide covers everything you need to get started.

---

## 📋 Table of Contents

<details>
<summary>Click to expand</summary>

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Branch Strategy](#-branch-strategy)
- [Development Conventions](#-development-conventions)
- [Architectural Rules](#️-architectural-rules)
- [Submitting a Pull Request](#-submitting-a-pull-request)
- [Reporting Bugs](#-reporting-bugs)

</details>

---

## 🧭 Code of Conduct

Be respectful, collaborative, and constructive. Criticism should be directed at code, not people. In a vault project, assume good faith on security reports — see [SECURITY.md](./SECURITY.md) for responsible disclosure.

---

## 🚀 Getting Started

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/ShellGuard.git
cd ShellGuard

# 2. Install dependencies
#    (native module: needs python3 + make + g++ for better-sqlite3-multiple-ciphers)
npm ci

# 3. Copy the environment config
cp .env.example .env

# 4. Review the system architecture
#    See ARCHITECTURE.md — especially the Hard Constraints section

# 5. Start the frontend and backend servers together
npm run scuttle:dev-start
#   → Frontend: http://localhost:6464 (Vite + HMR, strict port)
#   → Backend:  http://localhost:6565/api/health (DATA_DIR=./data-dev)

# Or run individual servers in separate terminals:
#   Terminal 1: npm run dev:server     (API on :6565)
#   Terminal 2: npm run dev            (UI  on :6464 with HMR)
```

Reset the dev reef when migrations change under you:

```bash
npm run scuttle:dev-reset
```

---

## 🌿 Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready code |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation-only updates |

```bash
git checkout main
git pull origin main
git checkout -b feat/my-new-feature
```

---

## 🎨 Development Conventions

<details>
<summary>TypeScript & React standards</summary>

- **TypeScript strict mode** is enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) — no `any` unless justified with a comment explaining why.
- Use `import type` for type-only imports.
- Use **named exports**, not default exports (exception: React page-level components).
- All React components use **function syntax** with hooks.
- State variables use descriptive names — avoid `data`, `result`, `val`.
- Errors must be typed and handled explicitly. No silent `catch` blocks.
- CSS via Tailwind utility classes only, using the [Reef Modernist tokens](./DESIGN.md).

</details>

<details>
<summary>File & naming standards</summary>

- Component files: `PascalCase.tsx`
- Utility / service files: `camelCase.ts`
- Server modules mirror the ClawChives layout exactly (`src/server/{database,middleware,routes,utils,validation}`)
- One component per file — no bundling multiple unrelated components.
- Lobsterized naming is welcome at the edges (`isMolting`, `pearl`, `reef`, `scuttle`, `lockTheClaw`) — see [src/CRUSTAGENT.md](./src/CRUSTAGENT.md). Wire-format names (`owner_uuid`, `key_hash`, API paths) are **not** the place for whimsy.

</details>

---

## 🏗️ Architectural Rules

> These are **non-negotiable** constraints that keep the vault safe and the twin codebases diffable.

1. **The Zero-Knowledge Invariant** — The server stores secret material *only* as `{v, alg, iv, ct, aad}` ShellCryption blobs with AAD bound to `table:recordId`. Never decrypt, re-encrypt, validate, or transform secrets server-side. Never log ciphertext.
   - See [ARCHITECTURE.md § Hard Constraints](./ARCHITECTURE.md)

2. **Twin-Verbatim Policy** — Server modules stay file-for-file compatible with ClawChives so future fixes diff cleanly across both reefs. Deliberate deviations must be added to the deltas appendix ([ARCHITECTURE.md § Appendix](./ARCHITECTURE.md)) with a reason — anything else is drift.

3. **Audit on Mutation** — Every write path calls `audit.log()` against the segregated `audit.sqlite`, respecting the delta #2 redaction list (never titles, urls, usernames, secrets, tokens, or ciphertext).

4. **Migrations Required for Schema Change** — New tables/columns land as `migrations/NNNN_name.{up,down}.sql`. Inline DDL, try/catch ALTERs, and hand-edited databases are forbidden. Fresh clones must build schema v1 purely from migrations.

5. **Ownership Scoping Everywhere** — Every user-data query filters `owner_uuid`. Missing scope = security bug; the security suite will scuttle your PR.

6. **Validate at the Gate** — Every mutating endpoint gets a Zod schema via `validateBody`; error mapping flows through the centralized `errorHandler` (parse→400, UNIQUE→409, FK→400).

7. **Envelope Contract** — All API responses use `{success, data}`. Unwrapping happens once, centrally, in `restAdapter.ts`.

8. **Permission Mapping** — `GET→canRead`, `POST→canWrite`, `PUT/PATCH→canEdit`, `DELETE→canDelete`, plus `requireHuman` on configuration surfaces. No bespoke permission logic inside handlers.

9. **Tests Prove It** — Behavior changes ship with suite updates. Cross-owner isolation and the opacity invariant (server stores client blobs byte-for-byte, decryptable by nobody server-side) must stay green.

---

## 📬 Submitting a Pull Request

1. Run `npm run lint && npm run build` — zero errors required.
2. Run `npm run test:full` if you touched server behavior, auth, or validation.
3. Ensure new API endpoints have Zod schemas in `src/server/validation/` and audit coverage in their handlers.
4. Update [ARCHITECTURE.md](./ARCHITECTURE.md) if you added or moved files (especially `src/server/` structure) or introduced a deliberate ClawChives delta.
5. Update [BLUEPRINT.md](./BLUEPRINT.md) for any schema v1 evolution (with its migration number).
6. Update [ROADMAP.md](./ROADMAP.md) if your change completes or introduces a roadmap item.
7. Update [CRUSTAGENT.md](./CRUSTAGENT.md) / [src/CRUSTAGENT.md](./src/CRUSTAGENT.md) phase tracking if you completed a phase item.
8. Write a clear PR description: **what** changed, **why**, and **how to test**.
9. Link any related GitHub Issues.

---

## 🐛 Reporting Bugs

Open a GitHub Issue with:

- Steps to reproduce (minimal reproduction preferred)
- Expected vs actual behaviour
- Browser + OS version
- Any console errors (screenshot or paste) — **redact secrets first**

For **security vulnerabilities**, see [SECURITY.md § Reporting a Vulnerability](./SECURITY.md) — do **not** open a public issue.

---

## 📚 Related Documentation

- **[README.md](./README.md)** — Project overview and setup instructions
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Architecture, patterns, and hard constraints
- **[QUICKSTART.md](./QUICKSTART.md)** — First-hatch walkthrough
- **[SECURITY.md](./SECURITY.md)** — Security policy and hardening guide
- **[CRUSTSECURITY.md](./CRUSTSECURITY.md)** — ClawStack©™ standards alignment
- **[ROADMAP.md](./ROADMAP.md)** — Current and future development direction
