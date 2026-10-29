# 02.04 — Vault Workspace: Retract Lock, Zeroization & Multi-Account Sessions

Session lifecycle and multi-account isolation are governed by [`sessionManager.ts`](../../../../../src/lib/sessionManager.ts) and [`QuickLoginModal.tsx`](../../../../../src/components/QuickLoginModal.tsx). Each authenticated Lobster identity is isolated by `user.uuid` inside `sessionStorage` (`sg_sessions`, `sg_active_user`), allowing instant account switching or re-unlocking without cross-contaminating derived keys (`deriveShellKey` salts HKDF with `userUuid`). Navigation continuity across page reloads is controlled by the explicit `NavIntent` state machine (`sg_nav_intent`: `"dashboard"` preserves the workspace across refreshes and triggers `QuickLoginModal` when locked; `"landing"` persists across explicit logouts).

Triggering **Retract** (manual lock or inactivity auto-lock timer) executes immediate cryptographic zeroization: the in-memory `shellKey` reference and all decrypted vault arrays (`pearls`, `notes`, `sshKeys`, `attachments`) are purged from React state, and every mutation path across `VaultShell`, `ItemFormModal`, and pod management is hard-blocked by the `isLocked` guard until the user re-presents their `hu-` key to re-derive `shellKey`.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/QuickLoginModal.tsx`, `src/App.tsx`
- **Client Libraries**: `src/lib/sessionManager.ts`, `src/lib/shellCryption.ts`
- **Deep Specs**:
  - [Reef Modernist UI & Design System (§3 Session & Multi-Account UX, §5 NavIntent)](../../../specs/ui/ui-ux-design-system.md)
  - [ShellCryption™ Client-Side Encryption Specification (§2 Key Derivation, §6 Invariants)](../../../specs/crypto/shellcryption-spec.md)
- **Verification Oracles**: `tests/unit/sessionManager.test.ts`, `tests/auth-flow.test.ts`
