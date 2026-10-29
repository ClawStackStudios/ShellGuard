# 04 — Lobster Keys: Agent Delegation & Claw-Strength Permissions

[`LobsterKeysTab.tsx`](../../../../src/components/LobsterKeysTab.tsx) and [`agentKeys.ts`](../../../../src/server/routes/agentKeys.ts) implement the Human-to-Agent delegation boundary (`/api/agent-keys`). Every route in this domain enforces `requireAuth` followed by `requireHuman`—an agent (`lb-` session) can never mint, list, revoke, or delete Lobster Keys. Minting guides the human owner through a 4-step wizard ( Identity Label → Claw-Strength Permission Matrix → Rate Limit & TTL Expiry → One-Time Plaintext Reveal). The generated `lb-` + 64 base62 key (67 chars total) is returned **once** in the mint response; the server persists only `SHA-256(lbKey)` in `lobster_keys` alongside scoped permissions, per-key `rate_limit`, and `expires_at`.

At runtime, when an autonomous agent authenticates with its `lb-` key hash to obtain an `api-` session token, every subsequent vault request passes through `requireAuth` → per-key LRU rate limiting (auth-before-limit ordering is an inviolable Phase 2 invariant) → `requirePermission(perm)`. The five permission masks (`canRead` → `GET`, `canWrite` → `POST`, `canEdit` → `PUT`, `canDelete` → `DELETE`, and `canAdmin` reserved false for agents) fail closed with `403 Forbidden` when omitted, and revoking (`PATCH /api/agent-keys/:id/revoke`) or deleting a key immediately terminates agent access without disrupting human sessions.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/LobsterKeysTab.tsx`
- **Backend Routes & Ledger**: `src/server/routes/agentKeys.ts`, `src/server/middleware/auth.ts`, `src/lib/keyLedger.ts`
- **Deep Specs**:
  - [Key Hierarchy Specification (§1–§4 Lifecycle, Claw Strength & requireHuman)](../../specs/crypto/key-hierarchy-spec.md)
  - [Routes & API Contracts (§4 Lobster Keys Lifecycle)](../../specs/network/routes-and-contracts.md)
- **Verification Oracles**: `tests/security.test.ts`, `tests/auth-flow.test.ts`
