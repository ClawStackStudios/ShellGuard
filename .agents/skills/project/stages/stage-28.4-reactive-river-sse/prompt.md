# ⚡ Stage 28.4 Execution Prompt — Sync-Native Reactive River: Authenticated SSE Stream & Sub-50ms Mutation Reconciliation

> **Milestone**: `v0.0.3.0 (Build 32)` — Phase 28, Sub-Phase 28.4 (Tasks 61 & 62 — Final Phase 28 Gate)  
> **Execution Law**: Strict 2-Task Pairing + **Dual-Testing Teamwork Gate 28.4** (Agent executes code/lint/cloud CI $\rightarrow$ User performs live multi-session physical verification and signs off to complete Phase 28).

---

## 📖 Context & Spec Oracles (Read First)

Before writing code, inspect:
- [`.agents/skills/project/specs/architecture/architecture.md`](../../specs/architecture/architecture.md): §5.4 (Sync-Native Reactive River).
- [`.agents/skills/project/specs/network/routes-and-contracts.md`](../../specs/network/routes-and-contracts.md): §6.C (`GET /api/sync/events` SSE wire contract).
- [`.agents/skills/project/modules/02-vault-workspace/01-shell-and-list/spec.md`](../../modules/02-vault-workspace/01-shell-and-list/spec.md): `VaultShell.tsx` master-detail state & item selection preservation.

---

## 🛠️ Execution Tasks (Strict 2-Task Pairing)

### Task 61: [Functionality] Authenticated SSE Stream Engine, Mutation Event Bus & Revision Tracking

- **Reactive River Event Bus (`src/server/utils/reactiveRiver.ts` & `src/server/routes/sync.ts`)**:
  - Implement `GET /api/sync/events` protected by user session or agent token (`requireAuth`).
  - Wire vault mutation routes (`vault.ts`, `notes.ts`, `sshKeys.ts`, `attachments.ts`) into an in-process `EventEmitter` scoped by `owner_uuid`, broadcasting `{ domain, id, rev, action, timestamp }` within `<50ms` of SQLite commit.
  - Maintain a bounded ring buffer per `owner_uuid` supporting `Last-Event-ID` cursor replay on short disconnects, and emit periodic `: heartbeat` comments every 25s to keep reverse-proxy/Tailscale sockets warm.
  - Set `X-Accel-Buffering: no` and `Cache-Control: no-cache, no-transform` headers so Nginx/Cloudflare proxies never buffer SSE frames.
- **Automated Verification**:
  - Author `tests/sync-events.test.ts` verifying authenticated SSE connection, strict `owner_uuid` isolation (User A never receives User B's mutation events), `<50ms` event delivery on pearl/note/key CRUD, and `Last-Event-ID` catch-up replay.

### Task 62: [UI Component] Live River Connection Indicator & Reactive State Reconciliation

- **Client Reactive River Hook (`src/hooks/useReactiveRiver.ts` & `src/components/Layout/Header.tsx`)**:
  - Subscribe to `/api/sync/events` when the vault is unlocked; automatically close the stream on vault lock or logout.
  - Render a subtle bioluminescent connection status pill (`🟢 River Connected` / `🟡 Reconnecting…`) in the dashboard header.
  - Upon receiving a mutation event from another tab, mobile device, or LobsterKey agent, fetch/decrypt the affected domain record in the background and reconcile `vaultItems` in-memory without losing the user's active item selection, scroll position, or modal focus.

---

## 🤝 Dual-Testing Teamwork Gate 28.4 (FINAL PHASE 28 SIGN-OFF)

- **Agent Role**: Run `npm run lint`, push branch to origin, and tail the full cloud verification run on GitHub Actions (`gh run watch`) until all Vitest suites, Vite build, and `docs:build` pass 100% green.
- **User Role (Lucas)**:
  1. Open two browser sessions side-by-side (or mutate via a LobsterKey agent in terminal).
  2. Physically verify the `🟢 River Connected` status pill in the header.
  3. Trigger item creation/edit/deletion in Session A and verify `<50ms` live synchronization in Session B without page reload or lost focus.
  4. Give final sign-off for Phase 28 (`v0.0.3.0 / Build 32`)!
