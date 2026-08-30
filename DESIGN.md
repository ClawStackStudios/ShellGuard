---
name: Reef Modernist (Dual-Mode Design System)
colors:
  light:
    bg-base: '241 245 249'          # Ocean Mist / slate-100
    bg-surface: '255 255 255'       # Crisp White
    text-main: '15 23 42'           # slate-900
    text-muted: '100 116 139'       # slate-500
    border-subtle: '203 213 225'    # slate-300
    header-border: '#3b0764'        # ShellGuard Dark Purple
    glass-bg: 'rgba(255, 255, 255, 0.85)'
  dark:
    bg-base: '15 20 25'             # Abyssal Dark
    bg-surface: '23 28 33'          # Deep Subsurface
    text-main: '222 227 234'        # Luminous Shell
    text-muted: '135 146 152'       # Abyssal Muted
    border-subtle: '61 72 78'       # Carapace Ridge
    header-border: '#e4048a'        # Lobster Red
    glass-bg: 'rgba(23, 28, 33, 0.85)'
  brand:
    lobster-red: '#e4048a'
    claw-cyan: '#06b6d4'
    shellguard-purple: '#3b0764'
    ocean: '#1e0f15'
    deep-teal: '#47343a'
    shell-white: '#f8dbe3'
typography:
  headline:
    fontFamily: Outfit, sans-serif
    weights: ['700', '800']
    letterSpacing: -0.02em
  body:
    fontFamily: Inter, system-ui, sans-serif
    weights: ['400', '500', '600']
    letterSpacing: -0.01em
  mono:
    fontFamily: JetBrains Mono, monospace
    weights: ['400', '500', '700']
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  2xl: 1.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

# 🦞 ShellGuard Design System — Reef Modernist

## 💎 Brand & Visual Identity

**Reef Modernist** is a dual-mode, high-security design language created for the **ShellGuard** exoskeletal vault ecosystem. It embodies **Bioluminescent Defense**—organic marine resilience fused with sharp, mathematical cryptographic precision.

The interface treats data protection not as an opaque monolith, but as an active, luminous carapace. Translucent glass surfaces, neon energy conduits (Lobster Red & Claw Cyan), and clean typographic hierarchy instill immediate confidence and effortless control.

### 🌟 Core Design Pillars
1. **Exoskeletal Resilience:** Containers ("Shells") feature soft, rounded perimeters (`rounded-2xl` / `rounded-3xl`) with high-contrast, structured interior grids.
2. **Bioluminescent Glow:** Subdued atmospheric lighting and directional glows highlight active items, clipboard copies, and TOTP countdown pulses.
3. **Dual-Mode Fluidity:** Seamless transitions between **Ocean Mist** (Light Mode) and **Abyssal Dark** (Dark Mode) using the browser View Transitions API circular reveal.
4. **Master-Detail Ergonomics:** Responsive three-pane navigation that eliminates jarring page transitions, keeping the user grounded in their vault context.

---

## 🎨 Theme System & Color Tokens

ShellGuard uses CSS Custom Properties bound to Tailwind utility classes (`bg-theme-base`, `bg-theme-surface`, `text-theme-main`, `text-theme-muted`, `border-theme-subtle`), ensuring flawless theme switching and custom opacity support.

| Token | Light Mode (Ocean Mist) | Dark Mode (Abyssal Dark) | Usage |
|:---|:---|:---|:---|
| `--bg-base` | `rgb(241, 245, 249)` | `rgb(15, 20, 25)` | Primary canvas and viewport floor |
| `--bg-surface` | `rgb(255, 255, 255)` | `rgb(23, 28, 33)` | Cards, inspection panes, and modal backgrounds |
| `--text-main` | `rgb(15, 23, 42)` | `rgb(222, 227, 234)` | Primary titles, secret values, and form labels |
| `--text-muted` | `rgb(100, 116, 139)` | `rgb(135, 146, 152)` | Secondary metadata, dates, and placeholder text |
| `--border-subtle` | `rgb(203, 213, 225)` | `rgb(61, 72, 78)` | Card borders, table dividers, and input outlines |
| `--header-border` | `#3b0764` (Purple) | `#e4048a` (Lobster Red) | Brand boundary accent line under header |

### 🦞 Brand Accent Palette
- **Lobster Red (`#e4048a`):** Primary action buttons ("Claw"), active status indicators, destructive confirmations, and brand gradients.
- **Claw Cyan (`#06b6d4`):** Secondary buttons ("Vents"), focus rings, TOTP progress bars, link hovers, and custom field badges.
- **ShellGuard Purple (`#3b0764`):** Executive light-mode brand accents and cryptographic badge outlines.
- **Deep Teal (`#47343a`):** Subdued surface container contrast and card hover fills.

---

## 🔤 Typography

Typography is calibrated for instant readability and developer-grade precision:

```
Headlines:   Outfit (Bold 700 / ExtraBold 800)
Body Text:   Inter (Regular 400 / Medium 500 / SemiBold 600)
Monospace:   JetBrains Mono (Regular 400 / Bold 700)
```

- **Headlines (`font-headline` / `Outfit`):** Geometric, modern letterforms with negative tracking (`tracking-tight`) for strong brand presence and section titles.
- **Body (`font-sans` / `Inter`):** Neutral, highly legible interface typography engineered for rapid scanning across complex lists and forms.
- **Monospace (`font-mono` / `JetBrains Mono`):** Standard across all passwords, human keys (`hu-`), agent keys (`lb-`), SSH private keys, and custom field values. Guarantees zero glyph ambiguity (`0` vs `O`, `1` vs `l`).

---

## 🏛️ Master-Detail Layout Architecture

The ShellGuard vault uses a Bitwarden-style **Master-Detail Three-Pane Architecture**:

```
┌─────────────────┬─────────────────────────┬──────────────────────────────┐
│  Sidebar Tree   │     Item List Pane      │      Item Detail Pane        │
│  (Folder Pods)  │  (Search & Type Filter) │ (Secrets, Custom Fields, CF) │
│                 │                         │                              │
│ 📁 All Vaults   │ 🔍 Search secrets...    │ 🔑 GitHub Corporate         │
│ 📁 Personal     │                         │ 👤 octocat@github.com        │
│ 📁 Work/Finance │ 📝 AWS Root Key         │ •••••••••••••••• 👁️ 📋     │
│ 📁 Infrastructure│ 🔑 GitHub Corporate    │ ⏱️ 842 190 (24s)           │
│                 │ 🔒 Server SSH           │ 📝 Custom Fields (4)         │
│                 │                         │ 📎 Attachments (2)           │
└─────────────────┴─────────────────────────┴──────────────────────────────┘
```

1. **Left Sidebar (`SidebarFolderTree`):**
   - Collapsible desktop toggle (`PanelLeftClose` / `PanelLeftOpen`).
   - Hierarchical user-created Pods with customizable color badges.
   - Zero hardcoded defaults—all pods are user-governed.
2. **Middle List Pane (`ItemListPane`):**
   - Sticky top bar with real-time search, item count, and type filter tabs.
   - Item rows with Favicon integration, username preview, category chip, and favorite toggle.
3. **Right Detail Pane (`ItemDetailPane`):**
   - High-density inspection card with masked secrets and one-click copy feedback.
   - Live SVG TOTP countdown ring with animated remaining-seconds display.
   - Expandable Custom Fields and Drag-and-Drop Attachment trays.

---

## 📝 Modal Form Architecture & Ergonomics

For creating and editing vault items, ShellGuard uses the **Ergonomic Modal Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│  [Favicon] Edit Login Item (Pinned Header)              [X] │
├─────────────────────────────────────────────────────────────┤
│  ▲ SCROLLABLE FORM BODY (flex-1 overflow-y-auto)            │
│                                                             │
│  Title * [ GitHub Corporate        ]  Pod [ Work/Dev      ] │
│  Username [ octocat                ]  URL [ github.com    ] │
│  Password [ •••••••••••••••••••••• ] [ 🎲 Generator ]       │
│                                                             │
│  ── Custom Fields ────────────────────────────────────────  │
│  📝 Employee ID: ENG-8492                              [X]  │
│  🔒 Recovery PIN: •••••••• (Hidden) 👁️                 [X]  │
│  ☑️ MFA Enforced: ON                                    [X]  │
│  🔗 Backup Auth: → username                             [X]  │
│                                                             │
│  ┌─────────────────────────────────┐                       │
│  │ ⏱️ TOTP Secret                   │                       │
│  │ 📎 Attachment                   │                       │
│  │ ✨ Custom Field                  │  (Dropup Menu ▲)      │
│  └─────────────────────────────────┘                       │
│  [+ Add Extra Field               ]                         │
│  ▼                                                          │
├─────────────────────────────────────────────────────────────┤
│  (Pinned Footer)                     [ Cancel ] [ Save Item ]│
└─────────────────────────────────────────────────────────────┘
```

- **Internal Element Scrolling:** Pinned header (`shrink-0 border-b`) and pinned footer (`shrink-0 border-t`) remain permanently visible. Only the form body scrolls (`flex-1 overflow-y-auto custom-scrollbar`).
- **Fixed Viewport Ratio:** Card is locked to `h-[90vh] md:h-[85vh]` with a spacious `max-w-3xl` (768px) width.
- **Upward-Expanding Dropup:** Secondary action menus expand upward (`bottom-full mb-2`) rather than downward, backed by an invisible backdrop (`fixed inset-0 z-10`) for click-outside dismissal.
- **Sleek Custom Scrollbars:** Slim 6px translucent scrollbars with smooth cyan hover states.

---

## ✨ Bitwarden-Style Custom Fields

Custom fields are first-class citizens in the Reef Modernist design system:

| Type | Icon | Visual Presentation | Interaction |
|:---|:---|:---|:---|
| **Text** | 📝 | Monospace/sans label + plaintext value | One-click clipboard copy with green checkmark animation |
| **Hidden** | 🔒 | Masked bullets (`••••••••••••`) | Show/hide eye toggle (`Eye` / `EyeOff`) + copy button |
| **Checkbox** | ☑️ | Visual pill badge (`☑ Enabled` / `☐ Disabled`) | Color-coded status chip (Green for ON, Slate for OFF) |
| **Linked** | 🔗 | Cyan arrow chip (`→ Property Name`) + live resolved value | Dynamically resolves from decrypted item properties + live TOTP timer |

---

## 🔒 Locked Dashboard & Security States

1. **The Locked Dashboard:** When session timers expire or the user locks their vault, the master-detail layout remains visible in a frosted, secured state with a centralized `QuickLoginModal` overlay.
2. **Quick Account Switcher:** Users can switch between multiple known accounts directly from the lock overlay without reloading or losing state.
3. **Reactive Memory Purging:** Locking the vault immediately zeroes all decrypted plaintext secrets and crypto keys from React state.

---

## 📐 Elevation & Depth Hierarchy

| Level | Name | Visual Treatment | Used For |
|:---|:---|:---|:---|
| **0** | **Floor** | Theme background (`--bg-base`) | Global viewport background |
| **1** | **Submerged** | `bg-theme-surface/50` + border | Left sidebar and secondary panels |
| **2** | **Shell** | `bg-theme-surface` + `border-theme-subtle` | Data cards, list items, and detail panes |
| **3** | **Floating** | `bg-theme-surface` + 20px blur + `shadow-2xl` | Modals, dropups, and floating toolbars |
| **Glow** | **Bioluminescent** | `0 0 24px rgba(6, 182, 212, 0.2)` | Focus rings, active copy confirmations, and security alerts |