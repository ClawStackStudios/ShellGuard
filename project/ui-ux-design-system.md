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
- VitePress documentation portal (`docs/`) with GitHub Pages deployment —
  the public face mirrors the in-app design language.

---
