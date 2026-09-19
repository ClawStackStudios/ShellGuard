# 🎨 ShellGuard — Reef Modernist UI & Design System

> **Design tokens, the gateway pattern, session UX & brand motion**
> *Pulled into existence by Phase 7. Grows with the walk.*

---

## §1. Reef Modernist Design Tokens (CSS Custom Properties)

Dual-mode theming via Tailwind-mapped CSS variables — every component reads
tokens, never hardcoded colors:

| Token | Ocean Mist (light) | Abyssal Dark (dark) | Usage |
|:---|:---|:---|:---|
| `--bg-base` | `rgb(241 245 249)` | `rgb(15 20 25)` | Canvas viewport floor |
| `--bg-surface` | white | `#171C21` | Cards, modals, sidebars |
| `--text-main` | `rgb(15 23 42)` | `rgb(222 227 234)` | Titles, secret values, labels |
| `--text-muted` | slate-500 | `#879298` | Subtitles, timestamps |
| `--border-subtle` | `#CBD5E1` | `#3D484E` | Dividers, 1dp outlines |
| `--header-border` | `#3b0764` purple | `#e4048a` lobster red | Brand boundary line |

Brand constants: **LobsterRed `#e4048a`** (primary action), **ClawCyan
`#06b6d4`** (secondary/agent accents), brand gradient `#e4048a → #ec4899 →
#06b6d4`. Countdown warnings use coral orange; success uses emerald.

---

## §2. The Gateway Pattern (ClawChives Port)

The login surface is a faithful port of the ClawStack gateway: a **compact
dual-mode AuthGateway** embedded in `LandingView`:

- Mode tabs: **human** (`hu-` key — "Generate your sovereign 67-character
  `hu-` Key") and **agent** (`lb-` key).
- Monospace key inputs with brand-colored prefixes.
- The gateway doubles as **education**: an inline protocol diagram renders the
  actual key lifecycle (`Client → generates(hu-key) → derives(AES-GCM-256) →
  hashes(SHA-256) → POST /api/auth/register`) with the invariant stated
  verbatim: *"✅ hu- keys NEVER sent plaintext"*.
- Success CTA (`Hatch`) navigates into the vault.

---

## §3. Session & Multi-Account UX

- `sessionManager.ts` — client-side multi-account session store: per-identity
  sessions, active identity switching, identity isolation.
- `QuickLoginModal` — the lock/unlock surface: switch between known accounts
  or re-unlock the current one without a full login; keyed by session state.
- `NavIntent` persistence: navigation intent survives reloads
  (hardened fully in a later phase; the pattern starts here).
- Lock discipline: mutations are denied while locked.

---

## §4. Brand Motion & Marketing Surface

- `BouncyBrand.tsx` — animated brand element (spring bounce on the shell mark).
- `LandingView.tsx` — hero, feature grid (carbon-based-first UX, `lb-` agent
  key delegation), protocol education section, footer navigation.
---

## §5. Master-Detail Vault Architecture & Pod Invariants (Phase 8)

- **Three-pane master-detail** (`VaultShell`, `ItemListPane`, `ItemDetailPane`,
  unified `ItemFormModal`) replaces monolithic tabs — Bitwarden-style layout.
- **Zero hardcoded pods (inviolable)**: `DEFAULT_ROOT_PODS = []`,
  `INITIAL_DEFAULT_COLORS = {}`. Pods exist only when the user creates them or
  assigns items to them. No "Personal", no "Work" — nothing.
- **Pod normalization invariant**: ALL comparisons between tree paths and item
  categories go through `normalizePod()`; sub-pod matches use
  `targetPod + "/"` prefix semantics.
- **Optimistic mutations**: local state updates immediately, then syncs;
  pod deletion cascades items to uncategorized (`""`).
- **Lock discipline**: every mutation path is guarded by `isLocked` —
  pod management, item mutations, add-menus all deny while locked.
- **`NavIntent`**: explicit navigation intent (`sg_nav_intent` in
  sessionManager) — `"landing"` persists across manual logout,
  `"dashboard"` with quick unlock on lock/reload.

## §6. Claw-In Navigation & Identity-Aware Tools

- Drag-and-drop key files onto the gateway; improved `hu-`/`lb-` key
  validation before submission.
- `LobsterKeysTab` extracted into its own dedicated component.
- Generator configuration binds to the **current user identity**;
  TOTP issuer defaults renamed to ShellGuard.

## §7. Custom Fields Render Behavior (Phase 13)

`ItemFormModal` hosts the custom-fields section (restructured with dropdown
positioning + backdrop for the add-field menu; scrollable body with pinned
header/footer). `ItemDetailPane` renders per type:

| Type | Render behavior |
|:---|:---|
| 📝 **Text** | Label, plaintext value, one-click copy button |
| 🔒 **Hidden** | Label, masked value (`••••••••`), eye toggle reveal, one-click copy |
| ☑️ **Checkbox** | Label, boolean status chip (`☑ Enabled` / `☐ Disabled`) |
| 🔗 **Linked** | Label, `Linked to [Property]` badge, dynamically resolved value from the parent item (username / password / url / notes), copy button; `totp` renders the live `TotpDisplay` with 30s countdown |

Linked fields are **live views**, not copies — the stored `value` is the
source property name; resolution happens at render time against the
decrypted parent item.

---

## §8. Vault Tagging System & Granular Filter Bar (Phase 20)

`TagSelectorInput` powers tag entry across `ItemFormModal`:
- Interactive chips with remove buttons (`x`), autocomplete dropdown suggestions dynamically harvested from all existing vault items, keyboard navigation (Enter/Comma to commit, Backspace to delete previous chip), and bioluminescent color assignment via `podUtils.ts`.

`SidebarFolderTree` & `ItemListPane` power multi-dimensional discovery:
- Collapsible **Tags Reef** in the left sidebar displaying all active tags with item counts and bioluminescent accent indicators.
- **Granular Filter Bar** above the item list with:
  - Multi-select active tag chips with one-click removal.
  - AND / OR logic toggle button (matching items containing all tags or any tag).
  - Clear All button and live matching item counts.
- `ItemDetailPane` and item list rows render bioluminescent tag pill badges using `podUtils.ts`'s 16-color deterministic palette and custom user color overrides.

---



