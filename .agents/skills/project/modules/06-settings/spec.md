# 06 — User Settings, Bioluminescent Theming & Owner Preferences

[`SettingsView.tsx`](../../../../src/components/SettingsView.tsx) and [`ConfigSettingsView.tsx`](../../../../src/components/ConfigSettingsView.tsx) manage per-owner vault preferences persisted server-side via `GET /api/settings/:key` and `PUT /api/settings/:key` (`src/server/routes/settings.ts`). Both endpoints strictly enforce `requireAuth` → `requireHuman`, ensuring autonomous agents (`lb-` keys) can never inspect or mutate user settings, auto-lock timeouts, or pod color registries.

Visual customization adheres to the **Reef Modernist** token architecture (`--bg-base`, `--bg-surface`, `--text-main`, `--text-muted`, `--border-subtle`, `--header-border`) switching seamlessly between **Abyssal Dark** (`#0F1419` / `#171C21`) and **Ocean Mist** light mode. Pod and Tag bioluminescence is powered by [`podUtils.ts`](../../../../src/lib/podUtils.ts), which provides a deterministic 16-color oceanic palette hash with optional user-assigned custom color overrides stored in owner settings—while strictly upholding `DEFAULT_ROOT_PODS = []` and `INITIAL_DEFAULT_COLORS = {}`.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/SettingsView.tsx`, `src/components/ConfigSettingsView.tsx`
- **Backend Routes & Client Libs**: `src/server/routes/settings.ts`, `src/lib/podUtils.ts`
- **Deep Specs**:
  - [Reef Modernist UI & Design System (§1 Design Tokens, §5 Pod Invariants, §8 Tagging)](../../specs/ui/ui-ux-design-system.md)
  - [Routes & API Contracts (§5 Server-Side Settings Storage)](../../specs/network/routes-and-contracts.md)
- **Verification Oracles**: `tests/settings.test.ts`, `tests/unit/podUtils.test.ts`
