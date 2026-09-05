# 🌊 ShellGuard — Attractor Beacon & Project Origin

> **ATTRACTOR BEACON — STATIC ARCHITECTURAL ANCHOR**
> *This document represents the immutable core intent, origin motivation, and philosophical anchor of ShellGuard. It is not modified during routine session updates. It stands as a guiding light for every architectural and security decision made across the codebase.*

---

## ⚡ The Origin: The Near-Catastrophe

ShellGuard was born out of a visceral, real-world crisis in self-hosted password management.

During a routine session, a self-hosted Bitwarden/Vaultwarden instance suffered an unexpected cascade failure upon creating a new item — triggering an instantaneous, catastrophic de-authentication of **all** logged-in sessions across all connected devices simultaneously. Because TOTP tokens, master passwords, and critical credentials lived inside the vault, the user was instantly locked out of their entire digital existence.

The **only** salvation was sheer luck and quick reflexes: an auxiliary server had a browser window that had not yet refreshed. The ethernet cord was physically ripped out to halt any background synchronization before the local cache could be purged, allowing an emergency manual export to rescue the credentials.

---

## 🛡️ The Core Philosophical Axioms of ShellGuard

1. **Data Loss & De-Auth Lockout are Existential Failures**
   - In a password manager, losing access is not an inconvenience — it is fatal.
   - Security cannot come at the cost of fragile data survival. The system must be engineered to prevent lockouts, data corruption, and catastrophic de-auth purges.

2. **Smooth, Painless Backups are First-Class Citizens**
   - Backups cannot be an afterthought or a hidden, obscure CLI script.
   - The platform must provide zero-friction, automated, live-consistent database backups (`db.sqlite` + `audit.sqlite`) via WAL-safe Online Backup APIs.
   - Restores must be mathematically verifiable, offline-safe, and rock-solid.

3. **Full Encrypted Exports with All Attachments & Keys**
   - Exporting a vault must be comprehensive. An export that leaves behind SSH keys, secure attachments, TOTP seeds, or metadata is incomplete and leaves the user exposed.
   - Full vault exports must package everything into an encrypted, transportable, standardized format that can be stored securely in offsite/cloud storage alongside user keys.

4. **Gentle Backup & Export Hygiene Reminders**
   - For standard users: The UI must gently encourage and remind users to take regular encrypted vault exports, especially after registering critical multi-factor credentials or substantial changes.
   - For advanced/self-hosted operators: The platform must urge dual-layer survival — automated database snapshots on disk + offsite encrypted vault backups with offline emergency recovery procedures.

5. **Client-Side Cache Resilience & Offline Defense**
   - The application must never destructively purge a user's locally unlocked data cache solely due to a transient network error or unexpected server-side 401 response without an explicit, safe export escape hatch.

6. **Unified Bitwarden-Style Item Composition (No Entity Clutter)**
   - Items in the vault are rich, primary records rather than disconnected entity fragments.
   - A **Login / Password** item is a first-class citizen that encapsulates passwords, usernames, URIs, embedded notes, live TOTP authentication seeds, attached files, and custom key-value fields.
   - Standalone records (Secure Notes, SSH Keypairs with generation) exist cleanly, but child attachments must belong to their parent items and never artificially inflate root Pod item counts.

7. **Cross-Platform Parity: Native Android Client Ecosystem**
   - ShellGuard is engineered from day one to support first-class native Android client applications (full Vault app + dedicated TOTP Authenticator app).
   - Android client architecture must be purely native: Kotlin, Jetpack Compose, Room Database with DAO offline persistence, Android Keystore Biometrics, and WorkManager sync.
   - The API and cryptographic envelopes (`ShellCryption` HKDF + AES-GCM-256) are completely language-agnostic, enabling 100% interoperability between Web and Android clients.

---

## 🧭 Project Vision & North Star

ShellGuard is the exoskeletal sanctuary for Humans and AI Agents across web and mobile. Every line of code, every encryption envelope, and every UI interaction must honor this foundation:

> *"Build features around security, not security around features. But never let security destroy data survivability. The vault that locks its own creator out is a prison, not a shield."*

