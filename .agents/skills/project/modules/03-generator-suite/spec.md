# 03 — Cryptographic Generator Suite (Passwords, Passphrases, SSH & TOTP)

[`GeneratorToolView.tsx`](../../../../src/components/GeneratorToolView.tsx) and [`generator.ts`](../../../../src/lib/generator.ts) provide an identity-bound cryptographic generation workbench accessible both standalone and inline from `ItemFormModal`. Password generation uses rejection-sampled CSPRNG entropy (`crypto.getRandomValues`) across configurable length, character classes (uppercase, lowercase, digits, symbols), minimum digit/symbol counts, and ambiguous character exclusion (`0O1lI`), while Diceware passphrase generation assembles multi-word high-entropy phrases with configurable separators, capitalization, and appended numbers. Generator preferences persist per-user via `sessionManager` / `/api/settings/:key`.

For developer and 2FA workflows, [`keyGen.ts`](../../../../src/lib/keyGen.ts) generates client-side SSH keypairs (**Ed25519** and **RSA-4096**) formatted as OpenSSH public keys and PKCS#8/OpenSSH PEM private keys with instant SHA-256 fingerprint calculation and one-click vault save into `vault_ssh_keys`. The TOTP seed generator (`totpUtils.ts`) mints RFC 6238 Base32 secrets and `otpauth://totp/ShellGuard:...` URIs with live QR code rendering (exported via origin-safe `Blob` + `URL.createObjectURL`).

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/GeneratorToolView.tsx`
- **Client Libraries**: `src/lib/generator.ts`, `src/lib/keyGen.ts`, `src/lib/totpUtils.ts`
- **Deep Specs**:
  - [Reef Modernist UI & Design System (§6 Claw-In Navigation & Identity-Aware Tools)](../../specs/ui/ui-ux-design-system.md)
  - [Encryption Layers Specification (§5 Origin-Safe Blob Downloads)](../../specs/crypto/encryption-layers-spec.md)
- **Verification Oracles**: `tests/unit/generator.test.ts`, `tests/unit/keyGen.test.ts`, `tests/unit/totpUtils.test.ts`
