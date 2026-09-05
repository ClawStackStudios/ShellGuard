---
title: Privacy Policy
description: Official Privacy Policy for ShellGuard and ShellGuard-TOTP Companion
---

# ShellGuard Privacy Policy

<CopyPage />

**Effective Date:** September 4, 2026  
**Publisher:** ClawStack Studios  
**Applications Covered:** ShellGuard (Self-Hosted Web Vault & API) and ShellGuard-TOTP (Android Companion Application)

---

## 1. Executive Summary & Sovereignty Invariant

ShellGuard is built on a non-negotiable architectural invariant: **Zero-Knowledge by Design and Complete User Sovereignty**.

We believe that your credentials, two-factor authentication (TOTP) seeds, SSH keys, secure notes, and encrypted files belong exclusively to you. ClawStack Studios does not operate centralized user databases, does not track your behavior, does not harvest analytics, and mathematically cannot decrypt your vault contents.

> [!IMPORTANT]
> **Summary of Key Commitments:**
> - **Zero Data Collection:** We collect zero personal data, zero email addresses, zero IP logs, and zero telemetry.
> - **Client-Side Encryption:** All secrets are sealed client-side before storage or transmission using military-grade authenticated encryption.
> - **Zero Third-Party Trackers:** No advertising SDKs, no behavioral trackers, no Google Analytics, no Firebase, and no telemetry services.
> - **Self-Hosted & Local-First:** You host your own server or run the mobile companion completely offline. ClawStack Studios has no backdoors and no access to your infrastructure.

> [!TIP]
> **Google Play Store Reviewers & Mobile Users:**  
> For the Google Play Data Safety declaration and Android-specific permission details, jump directly to the [ShellGuard-TOTP Android Companion Specification](#shellguard-totp-android-companion).

---

## 2. Information We Do NOT Collect

Because ShellGuard is a sovereign, self-hosted system:

1. **No Account Data:** You do not create an account with ClawStack Studios. Your authentication identity (the 67-character `hu-` Human Key) is generated locally by you and validated against your own private database instance.
2. **No Vault Contents or Metadata:** Passwords, usernames, TOTP secrets, notes, URLs, and attachment files are never visible to ClawStack Studios or the host server in unencrypted form.
3. **No Telemetry or Usage Analytics:** We do not collect crash reports, device identifiers, session lengths, feature usage metrics, or diagnostic telemetry.
4. **No Commercial Data Brokerage:** We do not sell, rent, monetize, or disclose any user information to third parties or advertising networks.

---

## 3. Cryptographic Zero-Knowledge Architecture

ShellGuard implements a triple-layer defense model designed to maintain zero-knowledge protection even in untrusted environments:

1. **Client-Side ShellCryption©™:**
   - Decryption keys are derived directly on your client device from your `hu-` Human Key using **HKDF-SHA-256** (RFC 5869) with cryptographically random salts.
   - All secret payloads are encrypted client-side using **AES-GCM-256** with unique 96-bit initialization vectors (IV) and Authenticated Additional Data (AAD) binding to prevent record tampering.
   - The self-hosted server only ever receives and stores ciphertext blobs.
2. **Per-Row Metadata Encryption:**
   - Server-side AES-256-GCM protects record labels, categories, and titles at rest in the local SQLite database.
3. **Whole-Database Encryption (SQLCipher):**
   - The underlying database file (`vault.sqlite`) is protected via 256-bit AES cipher engines.

Because encryption and decryption occur strictly on your endpoint device, **ClawStack Studios, network intermediaries, and unauthorized third parties cannot decrypt your secrets.**

---

## 4. Hardware & Device Permissions (Mobile & Web)

The ShellGuard ecosystem (including the ShellGuard-TOTP Android companion) requests only the minimum hardware permissions necessary to perform user-initiated cryptographic operations.

| Permission | Purpose | Data Handling & Retention |
| :--- | :--- | :--- |
| **Camera (`android.permission.CAMERA`)** | Scanning standard 2FA/TOTP QR setup codes (`otpauth://`) into the vault. | **100% In-Memory Processing.** Video frames are analyzed locally in real-time by the scanning engine. No photographs or video recordings are saved to disk or transmitted over any network. |
| **Biometric Hardware (`USE_BIOMETRIC`, `USE_FINGERPRINT`)** | Unlocking the application using fingerprint or face recognition for quick, secure access. | **Hardware Secure Enclave Isolation.** Biometric verification is executed entirely by the operating system (Android Keystore / BiometricPrompt). ShellGuard never receives, inspects, or stores your biometric data. |
| **Storage & File Access (SAF)** | Importing or exporting encrypted backup archives (e.g. `sgtotp.bak`, encrypted JSON). | **User-Initiated Only.** File access is invoked strictly through the system file picker when you manually export or restore a backup. Encrypted files are written only to the storage location you designate. |
| **Network Access (`INTERNET`, `ACCESS_NETWORK_STATE`)** | Synchronizing encrypted payloads with your own self-hosted ShellGuard instance (if configured). | **Zero Studio Endpoints.** Network communication occurs exclusively between your device and your configured self-hosted server URL. ShellGuard-TOTP functions 100% offline if sync is disabled. |

### Screen Security (`FLAG_SECURE`)
In the ShellGuard-TOTP mobile companion, Android window screenshot protection (`FLAG_SECURE`) is enabled by default. This prevents the operating system, background screen recorders, and the task-switcher carousel from capturing previews of your dynamic two-factor authentication codes.

---

## 5. ShellGuard-TOTP Android Companion Specification {#shellguard-totp-android-companion}

This section serves as the formal **Data Safety & Regulatory Disclosure** for the **ShellGuard-TOTP Android companion application**, published by ClawStack Studios on the Google Play Store and GitHub Releases.

### Google Play Data Safety Fast-Card

| Google Play Data Safety Requirement | ShellGuard-TOTP Disclosed Status | Technical Verification |
| :--- | :--- | :--- |
| **Personal Data Collected** | **None (0 bytes)** | The application does not collect, log, or transmit any user data, names, emails, device IDs, or crash logs. |
| **Third-Party Data Sharing** | **None (0 bytes)** | Zero user data is shared with third parties, ad networks, data brokers, or ClawStack Studios. |
| **Data in Transit** | **Encrypted (TLS 1.3)** | User-configured synchronization communicates directly and exclusively with your private self-hosted server over HTTPS/WSS. Sync is completely optional. |
| **Data at Rest** | **Hardware-Backed Encryption** | All seeds and vault items are encrypted at rest using AES-GCM-256 with keys backed by the Android hardware KeyStore. |
| **Data Deletion Mechanism** | **User-Directed Purge** | Clearing app storage or uninstalling the application immediately and irreversibly deletes all vault data and cryptographic keys. |
| **Target Audience & Age** | **General Audience (13+)** | The app does not target children under 13 and collects no information from any age group. |

### Technical Architecture & Permission Invariants

#### 1. In-Memory Ephemeral Camera Processing (`android.permission.CAMERA`)
- **Strict Scope:** The camera permission is requested exclusively when you tap the "Scan QR" button to ingest a two-factor authentication setup key (`otpauth://totp/...`).
- **Zero Disk Persistence:** Video frames are analyzed in volatile memory in real-time by the local scanning engine (CameraX / ML Kit). No photographs, video streams, or image buffers are ever written to persistent disk or transmitted over any network.
- **Gallery Import Fallback:** If you choose to scan a QR code from an existing screenshot or image, selection occurs strictly through the system photo picker (Storage Access Framework), decoding the QR code in RAM without granting the app broad media storage access.

#### 2. Hardware Enclave Biometric Security (`USE_BIOMETRIC`, `USE_FINGERPRINT`)
- **KeyStore Master Wrapping:** Your local vault encryption keys are secured inside the Android Hardware Security Module (Trusted Execution Environment / StrongBox Keymaster).
- **Biometric Isolation:** When you authenticate via fingerprint or facial recognition, verification is performed entirely by the Android operating system (`BiometricPrompt`). ShellGuard-TOTP never receives, inspects, or stores your biometric data; it only receives a cryptographically signed authentication signal from the OS to unwrap the in-memory cipher.

#### 3. Air-Gapped / Offline-First Invariant (`INTERNET`, `ACCESS_NETWORK_STATE`)
- **Default Offline Stance:** ShellGuard-TOTP is designed to function completely offline without any network access. All RFC 6238 time-based one-time password calculations occur locally on-device based on the hardware system clock.
- **Self-Hosted One-Way Mirror Sync:** Network permissions are exercised *only* if you explicitly configure synchronization with your private self-hosted ShellGuard instance. Even in this mode, communication is direct between your device and your personal server URL. Zero telemetry, health pings, or analytics are sent to ClawStack Studios or any external server.

#### 4. Encrypted Backup Archives (`sgtotp.bak`)
- **User-Initiated Storage:** When exporting or importing backups, the app requests file access solely through the Android Storage Access Framework (SAF) system picker.
- **Client-Side Sealing:** The backup archive (`sgtotp.bak`) is encrypted client-side using **HKDF-SHA-256** and **AES-GCM-256** with Authenticated Additional Data (AAD) verification and a cryptographic SHA-256 checksum before writing to your chosen storage location.

#### 5. Screen Capture Suppression (`FLAG_SECURE`) & RAM Zeroization
- **Screenshot & Recents Suppression:** Window screenshot protection (`FLAG_SECURE`) is enabled by default. This prevents background screen recorders, display capture software, and the Android task-switcher preview carousel from capturing visible 6-digit TOTP codes.
- **Lifecycle Auto-Lock:** An `AppLifecycleObserver` actively monitors app state. When the app is backgrounded or the device screen turns off, decrypted keys and OTP codes in memory are automatically cleared and the vault returns to a locked state.

---

## 6. Autonomous AI Agent Delegation (LobsterKeys)

ShellGuard provides an administrative mechanism to issue granular API keys (`lb-` LobsterKeys) to autonomous AI agents:

- Agents operate under strict role-based scopes (e.g., read-only metadata organization, categorized auditing).
- Agent keys authenticate via constant-time SHA-256 cryptographic hashing.
- AI agents do **not** receive your `hu-` Human Master Key and cannot decrypt zero-knowledge pearl secrets unless explicitly granted permission by you within your self-hosted instance.
- No interaction between your agents and your vault is monitored, proxied, or recorded by ClawStack Studios.

---

## 7. Third-Party Services & Dependencies

- **No Third-Party SDKs:** The application does not embed third-party analytics libraries (such as Google Analytics, Firebase, Flurry, Mixpanel), ad networks, or social authentication SDKs.
- **Open-Source Dependencies:** All software dependencies are audited, open-source libraries (e.g., standard WebCrypto APIs, Lucide icons, SQLite/SQLCipher engines) running locally within your application binary or container.

---

## 8. Data Retention & Sovereign Deletion

Because you own the infrastructure and device storage:

- **Complete Data Deletion:** Uninstalling the ShellGuard-TOTP companion app from your mobile device immediately purges all locally stored vault items, encryption salts, and cached keys.
- **Self-Hosted Deletion:** Deleting the container volumes or executing the instance database purge command permanently and irrevocably destroys the database (`vault.sqlite` and `audit.sqlite`). ClawStack Studios retains no backups or secondary copies.

---

## 9. Children’s Privacy

ShellGuard is a general-purpose security and cryptographic utility. We do not knowingly solicit, collect, or process information from children under the age of 13 (or under 16 in the European Union). Because the software collects no personal information whatsoever, no child data is ever processed or retained.

---

## 10. Changes to This Privacy Policy

As ShellGuard evolves, this Privacy Policy may be updated to reflect new cryptographic capabilities or architectural improvements. 

All revisions are committed directly to our public Git repository with full version-controlled attribution. The latest version will always be published canonically at our official documentation site:
- **Canonical Privacy Policy URL:** `https://clawstackstudios.github.io/ShellGuard/privacy`
- **ShellGuard-TOTP Deep Link:** `https://clawstackstudios.github.io/ShellGuard/privacy#shellguard-totp-android-companion`

---

## 11. Contact Information & Community Audit

If you have questions regarding this Privacy Policy, our zero-knowledge cryptographic model, or our compliance posture:

- **Direct Inquiries:** [clawstackstudios@protonmail.com](mailto:clawstackstudios@protonmail.com)
- **Public Issue Tracker & Security Discussions:** [github.com/clawstackstudios/shellguard/issues](https://github.com/clawstackstudios/shellguard/issues)
- **Open-Source Codebase:** [github.com/clawstackstudios/shellguard](https://github.com/clawstackstudios/shellguard)

*Maintained with cryptographic rigor by ClawStack Studios.*
