# 🛡️ Stage 32 Execution Prompt — Hardware Enclave Deep Anchoring & WebAuthn PRF

> **Milestone**: Provisional `v0.0.3.4 (Build 36)` — Phase 32 (Tasks 69 & 70)  
> **Execution Law**: Strict 2-Task Pairing (Task 69 [Functionality] + Task 70 [UI Component & Walk-the-Docs]).

---

## 📖 Context & Spec Oracles (Read First)

Before writing code, inspect:
- [`.agents/skills/project/specs/crypto/key-hierarchy-spec.md`](../../specs/crypto/key-hierarchy-spec.md): §1–§2 (`hu-` key lifecycle & client-only derivation).
- [`.agents/skills/project/specs/crypto/shellcryption-spec.md`](../../specs/crypto/shellcryption-spec.md): §2 (`deriveShellKey` HKDF-SHA256) & §6 (Zeroization invariants).
- [`.agents/skills/project/modules/02-vault-workspace/04-lock-and-multi-account/spec.md`](../../modules/02-vault-workspace/04-lock-and-multi-account/spec.md): `QuickLoginModal.tsx` and `sessionManager.ts` unlock flow.

---

## 🛠️ Execution Tasks (Strict 2-Task Pairing)

### Task 69: [Functionality] WebAuthn PRF Hardware Wrapping & Enclave-Backed Key Unsealing

- **Hardware Enclave Wrapper (`src/lib/hardwareEnclave.ts`)**:
  - Integrate WebAuthn Level 3 `prf` (Pseudo-Random Function) extension and platform authenticator wrapping (YubiKey, TouchID/FaceID, Windows Hello, Android StrongBox/TEE) to wrap the user's derived `shellKey` locally inside hardware-bound storage.
  - Preserve the inviolable zero-knowledge rule: hardware authenticator ceremonies unseal the wrapping key **strictly client-side**; the server never receives raw PRF outputs or `hu-` key material.
- **Automated Verification**:
  - Author `tests/unit/hardwareEnclave.test.ts` testing PRF key wrapping/unwrapping, fallback to manual `hu-` key entry when hardware is absent, and immediate zeroization on lock.

### Task 70: [UI Component & Walk-the-Docs] Hardware Passkey Enrollment Card & Biometric Quick-Unlock

- **Biometric Quick-Unlock & Enrollment (`src/components/QuickLoginModal.tsx` & `src/components/SettingsView.tsx`)**:
  - Add a **Hardware Security Key / Biometric Enclave** enrollment card in Settings and a one-tap **Unlock with Hardware Enclave** trigger inside `QuickLoginModal.tsx`.
- **4-Zone Walk-the-Docs**:
  - Synchronize `ARCHITECTURE.md`, `SECURITY.md`, `docs/security/`, and `CHANGELOG.md`.
