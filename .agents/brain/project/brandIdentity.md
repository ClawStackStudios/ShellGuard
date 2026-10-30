# Brand Identity — ShellGuard

## Brand Name & Tagline
- **Canonical Product Name**: ShellGuard©™ (Stylized: **Shell**`#e4048a`**Guard**`#06b6d4` with superscript `©™`)
- **Tagline**: *Zero-knowledge, post-quantum resilient credential vault with hardware enclave biometric sync.*

## Design Language: Reef Modernist
The Reef Modernist design language draws from bioluminescent deep-sea reef ecosystems and lightweight titanium carapace protection. It marries deep abyssal surfaces with sharp, luminous accents (Lobster Pink, Coral Cyan, Bioluminescent Emerald), organic yet geometric squircle curves (`22px–24px` radii), tactile spring physics, and high-legibility typographic hierarchies.

## Color Palette
| Token | Light Mode | Dark Mode (Abyssal) | Purpose |
|---|---|---|---|
| `--sg-floor` | `#f1f5f9` (Ocean Mist) | `#0f1419` (Abyssal Floor) | Page floor / background |
| `--sg-card-bg` | `#ffffff` (Crisp Pearl) | `#171c21` (Carapace Plate) | Elevated cards & surface panels |
| `--sg-card-border` | `rgba(226, 232, 240, 0.9)` | `rgba(255, 255, 255, 0.08)` | Container contours & boundaries |
| `--sg-header-seam` | `#7e22ce` (ShellGuard Purple) | `#e4048a` (Bioluminescent Pink) | Horizon seam & active boundaries |
| `--sg-header-seam-glow`| `rgba(126, 34, 206, 0.15)` | `rgba(228, 4, 138, 0.4)` | Sub-header ambient illumination |
| `--sg-accent-pink` | `#e4048a` | `#e4048a` | Primary CTA, brand mark, key accents |
| `--sg-accent-cyan` | `#06b6d4` | `#06b6d4` | Secondary accents, badges, telemetry |
| `--sg-accent-emerald` | `#10b981` | `#10b981` | Cryptographic verification, online status |

## Typography Matrix
1. **Display & Headings**: `Outfit` (700 Bold / 800 ExtraBold, letter-spacing `-0.025em`) — Structural, modern, geometric character for brand titles, section headlines, and modal headers.
2. **Body & Prose**: `Inter` (400 Regular / 500 Medium / 600 SemiBold) — Neutral, humanistic reading clarity across dense vault lists and technical guides.
3. **Telemetry & Cryptography**: `JetBrains Mono` (500 Medium / 600 SemiBold) — Proportional monospace tabular figures for keys, hashes, tokens, envars, and code blocks.

## Component DNA
- **Carapace Squircles**: Cards, containers, and elevated surfaces use `22px–24px` corner radii (`border-radius: 24px`) with fine `1px` subtle translucent borders. Never sharp 90° corners, never rigid brutalist boxes.
- **Pill Controls**: Primary and secondary CTA action buttons use full pill geometry (`border-radius: 9999px`) with gentle scale-and-lift hover spring physics (`transform: translateY(-2px) scale(1.02)`).
- **Horizon Seam**: Top navigation bars anchor the viewport with a signature `2px` bottom border (`#7e22ce` in light mode, `#e4048a` in dark mode) paired with a diffuse ambient glow drop.
- **Top-Right Ambient Glow**: Featured cards incorporate a subtle, non-distracting radial gradient pseudo-element (`::after`) in the upper-right corner reflecting bioluminescent depths.
- **Eye-Beside-Copy Ergonomics**: On all secret masking rows, the unmask toggle Eye sits immediately LEFT of Copy.

## Voice & Tone
- **General Tone**: Confident, technically precise, respectful, and zero-nonsense.
- **Error States**: Direct, diagnostic, and actionable without blaming the operator (e.g., *"Database key invalid: Check DB_ENCRYPTION_KEY base64 format."*).
- **Success States**: Quiet, reassuring, and immediate (e.g., *"Copied to clipboard"* with emerald checkmark).
- **Onboarding / Empty States**: Welcoming, orienting, and self-guiding without patronizing tutorials.

## Iconography & Motion
- **Icon Style**: Lucide-style outlined vector paths (`2px` stroke width) with crisp geometry.
- **Theme Transitions**: View Transitions API circular wipe originating from trigger click coordinates `(clientX, clientY)` over 950ms using `cubic-bezier(0.4, 0, 0.2, 1)`, respecting `prefers-reduced-motion`.
- **Spring Physics**: Interactive badges and brand letters respond with snappy spring curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

## Cross-Platform Parity Anchors
- Web client (`src/`), mobile Android companion (`ShellGuard-TOTP`), and documentation portal (`docs/`) all share identical hex tokens, font pairings, and branding glyphs.
