# Product Context — ShellGuard

## Why This Project Exists

ShellGuard exists because the ClawStack Studios ecosystem needs a secrets vault that:

1. **Agents can use but not abuse** — AI agents need to organize, rename, and categorize vault items, but must NEVER see actual passwords, TOTP seeds, SSH keys, or file contents
2. **Zero-knowledge by design** — The server is a cipher-keeper, never a key-holder. Even a fully compromised server cannot decrypt secrets.
3. **Self-hosted sovereignty** — No cloud dependency. Your data stays on your infrastructure.

## Problems It Solves

- **Secret sprawl**: Passwords, SSH keys, TOTP seeds scattered across tools
- **Agent access control**: AI agents need vault access but must be scoped and audited
- **Metadata leakage**: Even encrypted vaults leak metadata (titles, URLs, categories) — ShellGuard encrypts these at the field level
- **Backup anxiety**: Losing your key means losing everything — ShellGuard makes this explicit and guides backup strategy

## How It Should Work

1. User generates a `hu-` identity key (one-time setup)
2. User logs in by pasting the `hu-` key (one-field login)
3. Browser derives ShellCryption key via HKDF, holds it in session memory
4. All secrets are encrypted client-side before reaching the API
5. Server stores ciphertext blobs + encrypted metadata
6. Agents authenticate with `lb-` keys, get scoped permissions, see decrypted metadata but opaque secret blobs
7. Inactivity timeout ("Retract") clears session state automatically

## User Experience Goals

- **One-field login**: Paste your `hu-` key, you're in. No username/password.
- **Unified Rich Item Composition**: Bitwarden-style primary items — passwords contain usernames, URLs, notes, live TOTP seeds, attachments, and custom fields in a single cohesive record without inflating Pod item counts.
- **Native Android Ecosystem**: Dedicated native Android Vault and TOTP Authenticator apps built with Jetpack Compose, Room offline DB, and Biometric Keystore unlock.
- **Reef Modernist design**: "Bioluminescent Defense" — deep abyssal surfaces, glowing shells
- **Instant feedback**: Every mutation returns the updated item, audit logs are real-time
- **Sovereign exports**: Comprehensive decrypted/encrypted JSON backup with all attachments, CSV metadata export
- **Agent-friendly**: `lb-` keys with granular permissions, rate limits, expiry

