# Pearl Password Generator

<CopyPage />

The **Pearl Generator** provides cryptographically secure password generation with configurable character sets, entropy estimation, and session-only history.

---

## 🎲 Cryptographic Randomness

All generated pearls use the browser's `crypto.getRandomValues()` CSPRNG (Cryptographically Secure Pseudorandom Number Generator) to eliminate predictable seeding vulnerabilities.

### Configurable Presets:
- **Length**: 8 to 128 characters (default: 24).
- **Uppercase letters**: `A-Z`
- **Lowercase letters**: `a-z`
- **Numbers**: `0-9`
- **Symbols**: `!@#$%^&*()_+-=[]{}|;:,.<>?`
- **Avoid Ambiguous Characters**: Omits visually confusing characters (`1`, `l`, `I`, `0`, `O`).

---

## 📊 Real-Time Entropy Scoring

Every generated pearl is evaluated in real-time across four metric tiers:
- **Weak** (< 40 bits)
- **Fair** (40–64 bits)
- **Strong** (65–85 bits)
- **Crustacean Armored** (> 85 bits)

---

## 📜 Ephemeral Session History

The generator maintains a local history of generated pearls during your active session so you never lose a newly created credential before saving it to a pearl. When your vault locks, the generator history is purged from memory.
