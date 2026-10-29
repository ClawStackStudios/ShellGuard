# 02.02 — Vault Workspace: Item Detail Pane, Composite Types & Live TOTP

[`ItemDetailPane.tsx`](../../../../../src/components/vault/ItemDetailPane.tsx) renders decrypted vault records across all four domain tables (`vault_pearls`, `vault_secure_notes`, `vault_ssh_keys`, and `vault_secure_attachments`) and composite Pearl sub-types (`password`, `card`, `identity`). Every sensitive field enforces the **Eye-Beside-Copy Ergonomic Law**: masked fields (`••••••••`) pair an inline visibility toggle directly adjacent to a one-click clipboard copy button with transient emerald confirmation feedback. Payment cards format numbers dynamically through [`cardUtils.ts`](../../../../../src/lib/cardUtils.ts) (Amex `4-6-5` spacing vs standard `4-4-4-4` grouping, brand detection, Luhn check, and masked CVV), while SSH keys render dual-key PEM blocks (public key + ShellCrypted private key) with SHA-256 fingerprint pills.

When a Pearl contains a `totp_secret` (decrypted under AAD `vault_pearls_totp:{id}`) or a custom field of type `linked` targeting `totp`, [`TotpDisplay.tsx`](../../../../../src/components/TotpDisplay.tsx) and [`totpUtils.ts`](../../../../../src/lib/totpUtils.ts) compute live RFC 6238 6- or 8-digit codes locally using a 30-second countdown ring that shifts from ClawCyan (`#06b6d4`) to coral warning when $<5\text{s}$ remain. Password items also expose a collapsible **Password History** drawer (`vault_pearls_history:{id}` AAD) and secondary launchable login `uris`.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/vault/ItemDetailPane.tsx`, `src/components/TotpDisplay.tsx`
- **Client Libraries**: `src/lib/shellCryption.ts`, `src/lib/totpUtils.ts`, `src/lib/cardUtils.ts`
- **Deep Specs**:
  - [ShellCryption™ Client-Side Encryption Specification (§3.A AAD Namespace Registry)](../../../specs/crypto/shellcryption-spec.md)
  - [Reef Modernist UI & Design System (§7 Custom Fields Render Behavior)](../../../specs/ui/ui-ux-design-system.md)
- **Verification Oracles**: `tests/unit/cardUtils.test.ts`, `tests/unit/totpUtils.test.ts`, `tests/vault-crud.test.ts`
