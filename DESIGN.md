---
name: Reef Modernist
colors:
  surface: '#1e0f15'
  surface-dim: '#1e0f15'
  surface-bright: '#47343a'
  surface-container-lowest: '#180a0f'
  surface-container-low: '#27171d'
  surface-container: '#2b1b21'
  surface-container-high: '#36252b'
  surface-container-highest: '#423036'
  on-surface: '#f8dbe3'
  on-surface-variant: '#e1bdc8'
  inverse-surface: '#f8dbe3'
  inverse-on-surface: '#3d2b32'
  outline: '#a98893'
  outline-variant: '#5a3f49'
  surface-tint: '#ffb0cd'
  primary: '#ffb0cd'
  on-primary: '#640039'
  primary-container: '#e4048a'
  on-primary-container: '#130007'
  inverse-primary: '#b7006e'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#dd3739'
  on-tertiary-container: '#150001'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9e4'
  primary-fixed-dim: '#ffb0cd'
  on-primary-fixed: '#3e0021'
  on-primary-fixed-variant: '#8c0053'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#1e0f15'
  on-background: '#f8dbe3'
  surface-variant: '#423036'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system establishes a high-security, high-energy environment for digital asset protection. The brand personality is "Bioluminescent Defense"—it is vibrant, watchful, and impenetrable. It combines the organic resilience of marine life with the sharp, technical precision of modern cybersecurity.

The visual style is a hybrid of **Glassmorphism** and **High-Contrast Neon**. It utilizes deep "oceanic" voids as a canvas for glowing, translucent layers. The emotional response should be one of "Vibrant Security"—where the user feels protected within a sophisticated, bioluminescent armor.

**Key Stylistic Pillars:**
- **Submerged Depth:** Use of transparency and background blurs to create a sense of looking through water.
- **Crustacean Resilience:** UI elements should feel like "shells"—protective containers with soft-curved exteriors but rigid, high-contrast interiors.
- **Electric Accents:** Neon-inspired primary and secondary colors against near-black backgrounds to draw immediate attention to critical security actions.

## Colors

The palette is rooted in the "Abyssal Zone," utilizing high-saturation accents to slice through a dark, high-density background.

- **Primary (Deep Pink):** Used for "Claw" actions (primary buttons), active states, and critical brand moments. It represents the strength of the ecosystem.
- **Secondary (Cyan):** Used for informational elements, progress indicators, and "Navigation Vents." It provides a high-tech, bioluminescent contrast.
- **Tertiary (Red):** Reserved strictly for "Breach" warnings, destructive actions, and critical security alerts.
- **Neutral/Ocean:** The background and surface colors create the "Tidepool" hierarchy. The primary background is the deep ocean, while surfaces are slightly lighter, mimicking shallower waters for active content.

## Typography

The typography system is engineered for maximum legibility and a "technical-editorial" feel.

- **Headline (Sora):** A geometric, futuristic sans-serif used for major page titles and headers. Bold and Extra Bold weights are preferred to emphasize the "strong" nature of the security platform.
- **Body (Geist):** A clean, developer-friendly typeface used for all standard interface text. Its precise kerning and clear letterforms ensure security details are easily parsed.
- **Labels & Mono (JetBrains Mono):** Used for secrets, passwords, keys, and technical metadata. This font ensures zero ambiguity between similar characters (e.g., 'O' vs '0').

## Layout & Spacing

This design system uses a **Fluid Grid** approach within a "Tidepool" layout model. Elements flow naturally within their containers, but the containers themselves follow a strict 8px-based spacing rhythm.

- **Desktop Layout:** A 12-column grid with wide 48px margins to create a "sanctuary" feel for sensitive data.
- **Mobile Layout:** A 4-column grid with 16px margins, prioritizing vertical stackability.
- **Spacing Philosophy:** Use larger gaps (`stack-lg`) between different "Shells" (cards) and tighter gaps (`stack-sm`) for related internal components like input labels and fields.

## Elevation & Depth

Elevation in this design system is conveyed through **Submergence Levels** rather than traditional shadows.

1.  **Level 0 (Floor):** The "Ocean" background (#0f1419).
2.  **Level 1 (Submerged):** Surface Light (#161e27) with no blur. Used for persistent sidebar or footer areas.
3.  **Level 2 (Shell):** Surface Light with a 1px solid border (White at 10% opacity) and a subtle 4px backdrop blur. This is the standard state for cards and list items.
4.  **Level 3 (Floating):** Surface Light with a 20px backdrop blur and a vibrant inner-glow (Cyan or Magenta at 15% opacity). Reserved for modals, popovers, and active "Secret" reveals.

Avoid heavy black shadows. Instead, use a subtle "Bioluminescent Glow"—a drop shadow with 0px spread, 12px blur, using the primary or secondary color at a very low (8-12%) opacity.

## Shapes

The shape language reflects the "Shell" metaphor. 

- **Outer Shells:** Main containers and cards use `rounded-lg` (1rem) or `rounded-xl` (1.5rem) to mimic the smooth, protective exterior of a crustacean.
- **Inner Components:** Buttons, inputs, and chips use standard `roundedness: 2` (0.5rem) to provide a structural, modern feel.
- **Interactive Elements:** Small interactive icons or "pills" may use a fully rounded (pill-shaped) style to distinguish them from data-bearing containers.

## Components

### The "Claw" (Buttons)
Primary buttons use the Brand Primary (#e4048a) background with White text. They feature a slight horizontal gradient toward a lighter pink on the right edge. Secondary buttons ("Vents") use an outline style with the Secondary Cyan (#06b6d4) and a 12px backdrop blur.

### "Shell" Cards
Cards are the primary data container. They must use the Level 2 Elevation (Submerged) with a 1px border. When a card is hovered, the border color should transition to the Primary Magenta or Secondary Cyan.

### "Vents" (Input Fields)
Inputs should have a dark, recessed appearance—background: #0f1419 with a 1px border. On focus, the border glows with the Secondary Cyan and applies a subtle outer glow (4px blur).

### "Barnacles" (Chips/Tags)
Used for categorizing secrets (e.g., "Work", "Personal"). These are small, semi-transparent pills with a low-opacity background of the color they represent (Cyan for tech, Magenta for finance).

### "The Reef" (Lists)
Lists of secrets should be separated by subtle dividers (White at 5% opacity). Each list item should have a hover state that slightly increases its backdrop blur, making it "float" toward the user.

### Terminology for UI
- **Vault:** "The Grotto"
- **Master Password:** "The Keel"
- **Auto-lock:** "Retract"
- **Categories:** "Tidepools"
- **Security Audit:** "Sonar Scan"