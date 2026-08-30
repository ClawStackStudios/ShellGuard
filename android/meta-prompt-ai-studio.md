# 🤖 Master Meta-Prompt: ShellGuard-TOTP Android Application

> **INSTRUCTIONS & MULTI-STAGE PROMPTS FOR GOOGLE AI STUDIO (ANDROID BUILD MODE)**  
> *Aligned with ClawStack Mobile Standards and Google AI Studio Feature Architecture.*

---

## 📋 Multi-Stage Execution Strategy

To ensure optimal token economy and avoid context degradation in **Google AI Studio**:

```mermaid
flowchart TD
    Step0["🚀 Stage 0: Initial 'First Build' Prompt<br/>(Scaffold Structure, Gradle & Security Foundation)"]
    UploadContext["📂 Stage 1: Upload Full /android Context Files into AI Studio Project"]
    Phase1["⚡ Stage 2: Phase 1 — Cryptographic Engine & Live Display<br/>(Task 01: Core Crypto & TOTP · Task 02: Dynamic Theme & Countdown UI)"]
    Phase2["🗄️ Stage 3: Phase 2 — Local Persistence & Authenticator Screen<br/>(Task 03: SQLCipher Room · Task 04: List Screen, Gestures & Empty State)"]
    Phase3["🔐 Stage 4: Phase 3 — Vault Onboarding & Biometric Security<br/>(Task 05: KeyStore Biometrics & Auto-Lock · Task 06: Hatch Vault Wizard & LockScreen)"]
    Phase4["📷 Stage 5: Phase 4 — CameraX QR Scanner & Backup Engine<br/>(Task 07: UriParser & BackupManager · Task 08: Live Scanner & Manual Add)"]
    Phase5["🌐 Stage 6: Phase 5 — Self-Hosted Server Gateway & Bidirectional Sync<br/>(Task 09: Two-Way Delta Sync & WorkManager · Task 10: Spotlight Tour, Settings & Theme Picker)"]
    Phase6["🎨 Stage 7: Phase 6 — Adaptive Launcher Icon & Release Hardening<br/>(Task 11: ProGuard/R8 & Backup Rules · Task 12: Adaptive Icon, Splash & System Polish)"]

    Step0 --> UploadContext
    UploadContext --> Phase1
    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 --> Phase5
    Phase5 --> Phase6
```

---

## 🚀 Stage 0: The "First Build" Initial Scaffold Prompt

> **📖 Required Reference Files Attached in AI Studio**:  
> 1. [`architecture.md`](./architecture.md) — System boundaries, security invariants, `FLAG_SECURE`, and build topology.  
> 2. [`crypto-and-keystore.md`](./crypto-and-keystore.md) — `ClawCrypto.hashHumanKey` and `AndroidKeyStoreHelper` biometric wrapper.  

Copy and paste this exact prompt into Google AI Studio as the **First Build Message**:

```markdown
# FIRST BUILD PROMPT: ShellGuard-TOTP Android Foundation

## 🎯 Objective
Initialize and scaffold the complete internal architecture and security foundation for **ShellGuard-TOTP**, a privacy-first 2FA companion Android application built on the **Bitwarden Authenticator** model and conforming to the **ClawStack Mobile Architecture** (`ClawChives-Mobile`).

**Tagline**: *"Store and generate 2FA verification codes on your device."*

## 📖 Reference Architecture Files
Before writing code, inspect and adhere to:
- `architecture.md`: Section 1 (System Role), Section 2 (Boundaries), and Section 4 (Threat Model).
- `crypto-and-keystore.md`: Section 4 (AndroidKeyStoreHelper) and Section 5 (ClawCrypto).

## 🛡️ Core Operating Invariant
"Build features around security, not security around features."
Do NOT build complex user interface components in this initial build. Focus 100% on scaffolding the project structure, Gradle build files, dependencies, SQLCipher initialization, Android KeyStore hardware wrappers, network security configuration, and application security boundaries.

## 🛠️ Technical Specifications & Dependencies
- **Target SDK**: 35 / 36 (Min SDK: 24), Java 11 / 17, Kotlin 2.2+
- **Package Name**: `com.clawstack.shellguard.totp`
- **Gradle Plugins (`app/build.gradle.kts` & `libs.versions.toml`)**:
  - `alias(libs.plugins.android.application)`
  - `alias(libs.plugins.kotlin.compose)`
  - `alias(libs.plugins.kotlin.serialization)`
  - `alias(libs.plugins.google.devtools.ksp)`
- **Key Dependencies**:
  - Jetpack Compose + Material 3 + Navigation Compose
  - AndroidX Coroutines + Kotlinx Serialization JSON (`1.7.3`)
  - Ktor HTTP Client (`io.ktor:ktor-client-core:2.3.12`, `io.ktor:ktor-client-android:2.3.12`, `io.ktor:ktor-client-content-negotiation:2.3.12`, `io.ktor:ktor-serialization-kotlinx-json:2.3.12`)
  - SQLCipher for Android (`net.zetetic:sqlcipher-android:4.5.4` or `4.6.0`)
  - AndroidX Room (`2.7.0`) with KSP
  - CameraX (`1.5.0`) + Google ML Kit Barcode Scanning (`17.3.0`)
  - AndroidX Biometric (`1.2.0-alpha05`) / `androidx.security:security-crypto:1.1.0-alpha06`
  - AndroidX WorkManager (`2.9.0`)

## 📐 Required Deliverables for this First Build:
1. `gradle/libs.versions.toml` & `app/build.gradle.kts`: Clean, conflict-free dependency resolution.
2. `AndroidManifest.xml`:
   - Permissions: `CAMERA`, `USE_BIOMETRIC`, `INTERNET`, `ACCESS_NETWORK_STATE`.
   - Declarations for Application class and `MainActivity`.
   - Network Security Config XML allowing cleartext traffic *only* on local LAN private IPs (`192.168.x.x`, `10.x.x.x`) for self-hosted instances over HTTP.
3. `ShellGuardTotpApp.kt` (Application Class):
   - Initializes SQLCipher library: `System.loadLibrary("sqlcipher")` or `SQLiteDatabase.loadLibs(this)`.
4. `MainActivity.kt`:
   - Enforces `window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)` on `onCreate` to block screen capture and task-switcher previews.
   - Minimal Compose container placeholder.
5. `crypto/ClawCrypto.kt` & `crypto/AndroidKeyStoreHelper.kt`:
   - `ClawCrypto.hashHumanKey(rawKey)`: SHA-256 lowercase 64-char hex string generator.
   - `AndroidKeyStoreHelper`: Generates and manages the hardware-backed AES-256-GCM key (`sg_totp_biometric_wrapper`) in `AndroidKeyStore` with `setUserAuthenticationRequired(true)` to securely tie biometric prompts to hardware key access.
6. Clean package hierarchy under `com.clawstack.shellguard.totp` (`crypto`, `data`, `engine`, `ui`).

Scaffold this foundational structure now. Verify compilation and ensure zero dependency conflicts.
```

---

## 📂 Stage 1: Uploading Context Files

Once the AI Studio agent finishes the First Build scaffold:
1. Upload the remaining documentation files from `/android/` into the AI Studio project directory (or attach them to the chat):
   - [`DESIGN.md`](./DESIGN.md)
   - [`app-icon-and-splash.md`](./app-icon-and-splash.md)
   - [`routes-and-contracts.md`](./routes-and-contracts.md)
   - [`room-storage-schema.md`](./room-storage-schema.md)
   - [`totp-engine-spec.md`](./totp-engine-spec.md)
   - [`ui-ux-design-system.md`](./ui-ux-design-system.md)
   - [`roadmap.md`](./roadmap.md)
   - [`README.md`](./README.md)

---

## ⚡ Stage 2: Phase 1 Prompt — Cryptographic Engine & Live Display

> **📖 Required Reference Files for Phase 1**:  
> 1. [`totp-engine-spec.md`](project/totp-engine-spec.md) — Section 1 (RFC 6238 TotpEngine), Section 2 (Base32Decoder), Section 3 (TotpTicker with Kotlin Time).  
> 2. [`crypto-and-keystore.md`](project/crypto-and-keystore.md) — Section 1 (HKDF Parity), Section 2 (Envelope Schema), Section 3 (ShellCryptionEngine with AAD `vault_pearls_totp:{id}`).  
> 3. [`DESIGN.md`](DESIGN.md) — Section 2 (Theme Tokens), Section 4 (TotpCard with Spring Bounce), Section 5 (TotpCountdownRing Canvas Arc).  

Copy and paste this prompt to execute **Phase 1 (Tasks 01 & 02)**:

```markdown
# PHASE 1 EXECUTION: Cryptographic Engine & Live Countdown Display

## 📖 Reference Documentation
Before writing code, inspect:
- `totp-engine-spec.md`: Section 1 (TotpEngine.kt), Section 2 (Base32Decoder.kt), Section 3 (TotpTicker.kt).
- `crypto-and-keystore.md`: Section 1, 2, and 3 (ShellCryptionEngine.kt HKDF + AES-GCM AAD).
- `DESIGN.md`: Section 2 (Color Tokens), Section 4 (TotpCard.kt), Section 5 (TotpCountdownRing.kt).

Execute Phase 1 adhering to the Functionality + UI Component pairing:

### Task 01: [Functionality] Thread-Safe RFC 6238 TOTP Engine, ShellCryption HKDF & Comprehensive Unit Tests
- Create the core TOTP generation logic in `com.clawstack.shellguard.totp.engine` that implements RFC 6238, using the Kotlin Time library (`kotlin.time.Duration`, `kotlin.time.TimeSource`) for counter synchronization:
  - Standard time-based one-time password generator using stored secret keys from the Room database.
  - Generates current 6-digit or 8-digit codes based on system time.
  - Supports HMAC-SHA1, HMAC-SHA256, and HMAC-SHA512 hashing algorithms with 30s/60s time steps.
  - High performance, thread-safe, and zero memory allocations in hot loops.
- Implement `engine/Base32Decoder.kt` (RFC 4648 compliance).
- Implement `crypto/ShellCryptionEngine.kt`:
  - HKDF-SHA256 key derivation (`ikm = huKey.toByteArray()`, `salt = userUuid.toByteArray()`, `info = "clawchives-shellcryption-v1"`, length = 32 bytes).
  - AES-GCM-256 `decryptField(encryptedJson, shellKey, table, recordId)` and `encryptField(...)` with strict AAD binding verification (`vault_pearls_totp:<id>`).
- **Comprehensive Unit Tests (`test/` source set)**:
  - Add `TotpEngineTest.kt` in `test/` verifying RFC 6238 reference vectors (secret `"12345678901234567890"`, time `59s` -> `"287082"`, time `1111111109s` -> `"081804"`, time `1111111111s` -> `"140504"`, time `1234567890s` -> `"890059"`, time `2000000000s` -> `"692790"` across 6 and 8 digits).
  - Add `ShellCryptionEngineTest.kt` in `test/` verifying deterministic HKDF-SHA256 derivation per user, AES-GCM-256 roundtrip encryption/decryption, and AAD tamper detection (tampered `table` or `recordId` throwing authentication tag verification failure).

### Task 02: [UI Component] Dynamic Theme Engine, Live TOTP Countdown Display & Progress Ring
- Implement `ui/theme/Color.kt`, `Theme.kt`, and `Type.kt` matching the **Reef Modernist** design system in `DESIGN.md`:
  - Dual-mode base tokens: Dark base `#0F1419`, Dark surface `#171C21`, Dark elevated `#1E252C`, Text main `#DEE3EA`, Border `#3D484E`.
  - Brand accents: Lobster Red `#E4048A`, Claw Cyan `#06B6D4`, Deep Purple `#3B0764`, Coral Orange `#F97316`, Emerald `#10B981`.
  - Implement `ThemeAccent` enum with 6 curated palettes (`REEF_DEFAULT`, `CYAN_VENT`, `PURPLE_SHELL`, `EMERALD_TRENCH`, `AMBER_FLARE`, `MONOCHROME`).
  - Implement `LocalShellGuardColors` `staticCompositionLocalOf` for dynamic Compose color inheritance across dark/light and custom accents.
- Implement `engine/TotpTicker.kt` (reactive Flow emitting 1s ticks synchronized with Kotlin Time).
- Implement `ui/components/TotpCountdownRing.kt` (Canvas arc depleting counter-clockwise, smooth animated transition from secondary accent -> `BrandCoralOrange` -> `BrandLobsterRed` as expiration nears).
- Implement `ui/components/TotpCard.kt` displaying large monospace split codes (`123 456`), spring touch bounce scale (`0.97f`), haptic feedback, and the countdown ring.

Verify all unit tests pass and the countdown ring renders smoothly at 60fps.
```

---

## 🗄️ Stage 3: Phase 2 Prompt — Encrypted Persistence & Authenticator Screen

> **📖 Required Reference Files for Phase 2**:  
> 1. [`room-storage-schema.md`](project/room-storage-schema.md) — Section 2 (Entities: TotpItemEntity, SyncMetadataEntity), Section 3 (DAOs), Section 4 (ShellGuardTotpDatabase SQLCipher Builder).  
> 2. [`DESIGN.md`](DESIGN.md) — Section 4 (TotpCard), Section 6 (PodFilterChips), Section 7 (ClipboardToastPill), Section 8 (TotpEmptyState).  
> 3. [`ui-ux-design-system.md`](project/ui-ux-design-system.md) — Section 2 & 4 (MVI TotpViewModel).  

Copy and paste this prompt to execute **Phase 2 (Tasks 03 & 04)**:

```markdown
# PHASE 2 EXECUTION: Local Encrypted Persistence & Offline Authenticator Screen

## 📖 Reference Documentation
Before writing code, inspect:
- `room-storage-schema.md`: Section 2 (TotpItemEntity.kt), Section 3 (TotpItemDao.kt), Section 4 (ShellGuardTotpDatabase.kt).
- `DESIGN.md`: Section 6 (PodFilterChips.kt), Section 7 (ClipboardToastPill.kt), Section 8 (TotpEmptyState.kt).
- `ui-ux-design-system.md`: Section 4 (TotpViewModel.kt).

Execute Phase 2 adhering to the Functionality + UI Component pairing:

### Task 03: [Functionality] AndroidX Room with SQLCipher Secure Persistence
- Define Room entity and DAO for storing encrypted TOTP secrets in `com.clawstack.shellguard.totp.data`, ensuring compatibility with SQLCipher for encrypted persistence:
  - Set up AndroidX Room with SQLCipher whole-database encryption (`net.zetetic:sqlcipher-android`) initialized in the Application class.
  - Define `data/local/entities/TotpItemEntity.kt` for storing TOTP secrets:
    - Account name/title, username/email, secret key, issuer, algorithm, period, digits, category/pod, and `is_local_only`.
  - Define `SyncMetadataEntity.kt` and `AppConfig.kt`.
  - Implement `data/local/dao/TotpItemDao.kt` for CRUD and reactive queries:
    - `observeAllTotpItems(ownerUuid)` returning `Flow<List<TotpItemEntity>>`.
    - `searchTotpItems(ownerUuid, query)` returning `Flow<List<TotpItemEntity>>`.
    - `pruneDeletedRemoteItems(ownerUuid, activeRemoteIds)` protecting `is_local_only` items.
  - Implement `data/local/ShellGuardTotpDatabase.kt` with SQLCipher `SupportFactory`.
- *Verification*: Write instrumented/unit tests verifying database creation, encryption, and CRUD operations.

### Task 04: [UI Component] Reef Modernist Authenticator List Screen, Empty State & Gestures
- Implement `ui/viewmodels/TotpListViewModel.kt` (MVI StateFlow combining Room DB Flow + TotpTicker + search query + pod category filter + `deleteItem` + `offlineCodesCount`).
- Develop a Material 3 'Empty State' component (`ui/components/TotpEmptyState.kt`) for the main dashboard integrating the 3D locked shell illustration (`R.drawable.ic_locked_shell`) that prompts the user to add their first 2FA code via QR code scanner or manual entry.
- Implement `ui/components/TotpCard.kt` & `SwipeableTotpCard.kt`:
  - Large monospace split digits (`123 456`) and dynamic Canvas countdown ring.
  - **Swipe-to-Delete**: Wrap card in `SwipeToDismissBox` (end-to-start swipe reveals LobsterRed trash bin action to delete item from Room DB).
  - **Tap-and-Hold (Long-Press) to Edit**: Trigger edit secret navigation/sheet on long-press.
  - **Tap to Copy**: Copy clean code to clipboard with haptic feedback and auto-clearing toast (`ClipboardToastPill.kt`).
  - **Provenance Indicator**: Show `📱 Local Only` vs `☁️ Synced` badge.
- Implement `ui/screens/TotpListScreen.kt`:
  - App opens directly to this dashboard in standalone offline mode.
  - Header with ShellGuard logo, settings navigation icon, and connectivity status badge (`🟢 Synced` or `🟡 Offline Vault`).
  - Search bar and horizontal Pod category filter chips (`PodFilterChips.kt`: `[All Accounts]`, `[☁️ Synced]`, `[📱 Local Only]`, dynamic pods).
  - Displays `TotpEmptyState` when 0 items exist.

Verify that searching filters items instantly, swipe-to-delete removes items, long-press triggers edit, and empty state renders cleanly.
```

---

---

## 🔐 Stage 4: Phase 3 Prompt — Vault Onboarding & Biometric Security Lifecycle

> **📖 Required Reference Files for Phase 3**:  
> 1. [`crypto-and-keystore.md`](./crypto-and-keystore.md) — Section 4 (AndroidKeyStoreHelper.kt Biometrics), Section 5 (ClawCrypto.kt).  
> 2. [`ui-ux-design-system.md`](./ui-ux-design-system.md) — Section 4.B (HatchVaultScreen.kt), Section 4.A (TotpNavHost.kt), Section 4.C (LoginScreen.kt / LockScreen.kt).  
> 3. [`DESIGN.md`](./DESIGN.md) — Section 10 (HatchVaultScreen Layout).  

Copy and paste this prompt to execute **Phase 3 (Tasks 05 & 06)**:

```markdown
# PHASE 3 EXECUTION: Vault Onboarding & Biometric Security Lifecycle

## 📖 Reference Documentation
Before writing code, inspect:
- `crypto-and-keystore.md`: Section 4 (AndroidKeyStoreHelper.kt), Section 5 (ClawCrypto.kt).
- `ui-ux-design-system.md`: Section 4 (TotpNavHost.kt, HatchVaultScreen.kt, LoginScreen.kt / LockScreen.kt).
- `DESIGN.md`: Section 10 (HatchVaultScreen.kt).

Execute Phase 3 adhering to the Functionality + UI Component pairing:

### Task 05: [Functionality] Hardware KeyStore Biometric Sealing, FLAG_SECURE & Inactivity Auto-Lock
- Implement `crypto/AndroidKeyStoreHelper.kt`:
  - Hardware-backed AES-256-GCM secret key generation in AndroidKeyStore (`setUserAuthenticationRequired(true)`, `setInvalidatedByBiometricEnrollment(true)`).
  - Cipher initialization (`getBiometricCipher`) for biometric crypto-object wrapping.
- Implement `crypto/ClawCrypto.kt` for `hu-`/`lb-` key SHA-256 hashing.
- Apply `FLAG_SECURE` in `MainActivity.kt` (`window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)`) to prevent screenshot leaks and task-switcher recents thumbnail snooping.
- Implement `AppLifecycleObserver.kt` (via `ProcessLifecycleOwner`) to observe app backgrounding and manage auto-lock timeouts.

### Task 06: [UI Component] "Hatch New Vault" Onboarding Wizard & Biometric LockScreen
- Implement `ui/screens/HatchVaultScreen.kt` (**"Hatch New Vault" Initial Launch Onboarding Wizard**):
  - **Step 1 (Welcome & Mode)**: 3D locked shell badge (`ic_locked_shell`), welcome text, and protection selector: `[ PIN Code (4–8 digits) ]` vs `[ Master Password ]`.
  - **Step 2 (Protection Setup)**: 4–8 digit PIN input (or strong passphrase) with confirmation match, and optional **Biometric Switch Card** (`"Enable Biometric Unlock?"` with explicit Skip/Toggle option).
  - **Step 3 (Success Orientation)**: Celebrates vault initialization and transitions to the dashboard.
- Implement `ui/screens/LockScreen.kt` / `LoginScreen.kt` (**AndroidKeyStore & Biometric Gate**):
  - Triggers `androidx.biometric.BiometricPrompt` with `BiometricPrompt.PromptInfo`.
  - Integrates with `AndroidKeyStoreHelper.getBiometricCipher()` to gate access to the main dashboard.
  - Handles authentication success (navigates to `CodeList`), failure, and PIN/Master Key fallback gracefully.
- Update `ui/navigation/TotpNavHost.kt`:
  - `startDestination` checks `isVaultHatched`:
    - `!isVaultHatched` -> `Screen.HatchVault.route`
    - `isVaultHatched && isBiometricEnabled` -> `Screen.Login.route`
    - Otherwise -> `Screen.CodeList.route`

Verify first install launches into Hatch Vault, allows skipping biometrics, and enforces biometric/PIN lock on subsequent cold boots.
```

---

## 📷 Stage 5: Phase 4 Prompt — CameraX QR Scanner & Multi-Format Backup Engine

> **📖 Required Reference Files for Phase 4**:  
> 1. [`totp-engine-spec.md`](./totp-engine-spec.md) — Section 4 (TotpUriParser.kt), Section 5 (QrCodeAnalyzer.kt CameraX Pipeline).  
> 2. [`room-storage-schema.md`](./room-storage-schema.md) — Section 6 (BackupManager.kt Encrypted JSON Export/Import).  
> 3. [`ui-ux-design-system.md`](./ui-ux-design-system.md) — Section 4.C (AddSecretScreen.kt).  
> 4. [`DESIGN.md`](./DESIGN.md) — Section 6 (ScannerFab.kt).  

Copy and paste this prompt to execute **Phase 4 (Tasks 07 & 08)**:

```markdown
# PHASE 4 EXECUTION: CameraX QR Scanner & Multi-Format Backup Engine

## 📖 Reference Documentation
Before writing code, inspect:
- `totp-engine-spec.md`: Section 4 (TotpUriParser.kt), Section 5 (QrCodeAnalyzer.kt).
- `room-storage-schema.md`: Section 6 (BackupManager.kt).
- `ui-ux-design-system.md`: Section 4 (AddSecretScreen.kt).
- `DESIGN.md`: Section 6 (ScannerFab.kt).

Execute Phase 4 adhering to the Functionality + UI Component pairing:

### Task 07: [Functionality] TotpUriParser, Migration Payloads & BackupManager Engine
- Implement `engine/TotpUriParser.kt`:
  - Parses standard `otpauth://totp/...` URIs extracting `secret`, `issuer`, `username`, `algorithm` (SHA1/SHA256/SHA512), `digits` (6/8), and `period` (30/60).
  - Handles raw Base32 secret string inputs.
- Implement `data/backup/BackupManager.kt`:
  - `exportEncryptedBackup(...)`: exports Room DB items into a ShellCrypted AES-256 JSON envelope (`shellguard-totp-backup-v1`) with SHA-256 integrity checksum.
  - `importEncryptedBackup(...)`: restores and verifies encrypted backup files, validating checksums before merging into Room DB.
  - Supports standard unencrypted JSON export for user data portability.

### Task 08: [UI Component] CameraX Live Scanner, Gallery QR Picker & Manual Entry Screen
- Integrate **CameraX (`1.5.0`)** and **ML Kit Barcode Scanning (`17.3.0`)**:
  - Implement `ui/screens/QrScannerScreen.kt` with live CameraX preview composable, targeted scanner reticle, flashlight toggle button, and camera runtime permission request handler.
  - Add **"Scan from Image / Gallery"** button using `rememberLauncherForActivityResult(ActivityResultContracts.GetContent())` to scan QR codes from screenshots or downloaded photos.
- Implement `ui/screens/AddSecretScreen.kt`:
  - Clean manual entry form: Title, Username, Base32 Secret, Category/Pod, Algorithm, Digits, and Period.
  - Validates Base32 input before saving to Room DB with `syncState = "PENDING_SYNC"`.

Verify that camera scanning detects 2FA codes immediately, gallery QR import works on saved images, and manual entry persists records into Room.
```

---

## 🌐 Stage 6: Phase 5 Prompt — Self-Hosted Server Gateway & Bidirectional Delta Sync

> **📖 Required Reference Files for Phase 5**:  
> 1. [`routes-and-contracts.md`](./routes-and-contracts.md) — Section 1 (ShellResponse), Section 2 (DTOs), Section 3 (ShellGuardTotpClient), Section 4 (ApiClient), Section 5 (Two-Way Sync), Section 6 (Cleartext/VPN Transport), Section 7 (TotpSyncWorker).  
> 2. [`ui-ux-design-system.md`](./ui-ux-design-system.md) — Section 3 (GatewayScreen.kt 1:1 ClawStack Port), Section 4.E (SpotlightOverlay.kt).  
> 3. [`DESIGN.md`](./DESIGN.md) — Section 9 (SettingsScreen.kt), Section 11 (SpotlightOverlay.kt), Section 12 (Self-Hosted Transport).  

Copy and paste this prompt to execute **Phase 5 (Tasks 09 & 10)**:

```markdown
# PHASE 5 EXECUTION: Self-Hosted Server Gateway & Bidirectional Delta Sync

## 📖 Reference Documentation
Before writing code, inspect:
- `routes-and-contracts.md`: Section 3 (ShellGuardTotpClient.kt), Section 4 (ApiClient.kt), Section 5 (TotpRepository.kt Two-Way Sync), Section 6 (Cleartext/VPN), Section 7 (TotpSyncWorker.kt).
- `ui-ux-design-system.md`: Section 3 (GatewayScreen.kt), Section 4 (SpotlightOverlay.kt).
- `DESIGN.md`: Section 9 (SettingsScreen.kt), Section 11 (SpotlightOverlay.kt), Section 12 (Network Architecture).

Execute Phase 5 adhering to the Functionality + UI Component pairing:

### Task 09: [Functionality] Two-Way Bidirectional Sync, Ktor OkHttp Client & WorkManager
- Configure Android Cleartext & VPN Network Security (`res/xml/network_security_config.xml` & `AndroidManifest.xml`):
  - Set `<base-config cleartextTrafficPermitted="true">` allowing unencrypted HTTP over local LAN (`192.168.x.x`, `10.x.x.x`, `172.16.x.x`), `.local` domains, and Tailscale / WireGuard CGNAT VPN addresses (`100.64.0.0/10`).
  - Configure `AndroidManifest.xml` with `android:networkSecurityConfig="@xml/network_security_config"` and `android:usesCleartextTraffic="true"`.
- Implement `data/remote/ShellGuardTotpClient.kt` & `ApiClient.kt`:
  - Ktor OkHttp engine with `ConnectionSpec.CLEARTEXT` and `ConnectionSpec.MODERN_TLS`, relaxed X.509 TrustManager for self-signed certificates, and VPN tunnel routing.
  - `authenticate(keyHash)` -> POST `/api/auth/token`
  - `fetchVault(token)` -> GET `/api/vault`
  - `createVaultItem(token, payload)` -> POST `/api/vault` (**Upstream Push Endpoint**)
  - `updateVaultItem(token, id, payload)` -> PUT `/api/vault/:id`
- Implement `data/repository/TotpRepository.kt` (**Two-Way Bidirectional Sync**):
  - **Upstream Push**: For local items with `syncState == "PENDING_SYNC"`, derives HKDF `shellKey`, encrypts TOTP seed into `totp_secret` (AAD `vault_pearls_totp:{id}`), encrypts empty password into `secret` (AAD `vault_pearls:{id}`), and pushes via `createVaultItem` (`type = "password"`). On success, updates Room record to `isLocalOnly = false`, `syncState = "SYNCED"`.
  - **Downstream Pull**: Calls `fetchVault`, filters `totp_secret != null`, decrypts seeds, and upserts to Room DB.
- Implement `data/sync/TotpSyncWorker.kt` (**AndroidX WorkManager Periodic Delta Sync**):
  - Subclass `CoroutineWorker` scheduled via `PeriodicWorkRequestBuilder<TotpSyncWorker>(15, TimeUnit.MINUTES)`.
  - Enforce `Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()`.
  - Respect `AuthRepository` `withSyncLock` mutex to prevent concurrent sync races with UI operations.

### Task 10: [UI Component] Interactive Spotlight Guided Tour, Server Gateway & Settings
- Implement `ui/components/SpotlightOverlay.kt` (**Interactive Spotlight Guided Tour**):
  - Dims and blurs the screen background (`#E6030712`), blocking all background touches.
  - Punches a circular spotlight cutout around the **Settings Icon** in the top bar using `BlendMode.Clear`.
  - Displays a centered tooltip pill: *"To add a new server to sync to, open the settings menu"*.
  - Displays a centered `[ Skip Tutorial ]` button below the pill that dismisses the tour.
  - When Settings opens during the tour, spotlights the **"Connect to Server"** button: *"Tap 'Connect to Server' to authenticate and sync your 2FA codes with your self-hosted ShellGuard instance."*
- Implement `ui/screens/GatewayScreen.kt` & `GatewayViewModel.kt`:
  - Faithful 1:1 port of ClawStack Gateway: protocol/host/port segment bar, animated port width, key file dropzone + paste ShellKey view, and warning card.
- Implement `ui/screens/SettingsScreen.kt`:
  - **Appearance & Theme Accents Card**:
    - Mode toggle selector: `[ System | Dark | Light ]`.
    - Horizontal gradient swatch picker for the 6 curated ShellGuard accent palettes (`REEF_DEFAULT`, `CYAN_VENT`, `PURPLE_SHELL`, `EMERALD_TRENCH`, `AMBER_FLARE`, `MONOCHROME`) with active selection checkmark and instant Compose preview.
  - **Server Synchronization Card**:
    - Disconnected mode: Shows "Standalone Offline Vault" with a prominent "[ Connect to Server ]" button that navigates to Gateway.
    - Connected mode: Displays `Server: [IP]`, `User: [Name]`, `Last Synced`, "[ Sync Now ]", and "[ Disconnect ]".
  - **Local Storage & Offline Codes Section**:
    - Displays total offline codes stored on device.
    - "[ Display Offline Codes on Dashboard ]" button that sets the category filter to local codes.
  - **Encrypted Backup & Restore**: "Export JSON" and "Import JSON" file pickers.
  - **Biometric Unlock Switch**: Toggle cold-start hardware biometric prompt (optional).

Verify that local 2FA tokens push to the server and appear in the Web UI under Passwords, remote tokens sync down, the theme accent picker dynamically changes app colors, and the Spotlight Tour navigates seamlessly.
```

---

## 🎨 Stage 7: Phase 6 Prompt — Adaptive App Icon, Splash Screen & Release Hardening

> **📖 Required Reference Files for Phase 6**:  
> 1. [`app-icon-and-splash.md`](./app-icon-and-splash.md) — Vector Drawables for Adaptive Icon and Android 12+ SplashScreen Setup.  

Copy and paste this prompt to execute **Phase 6 (Tasks 11 & 12)**:

```markdown
# PHASE 6 EXECUTION: Adaptive Launcher Icon, Splash Screen & Release Hardening

## 📖 Reference Documentation
Before writing code, inspect:
- `app-icon-and-splash.md`: Section 2 (Vector Drawables), Section 3 (Android 12+ Core Splash Screen).

Execute Phase 6 adhering to the Functionality + UI Component pairing:

### Task 11: [Functionality] ProGuard/R8 Hardening, Backup Rules & Release Configuration
- Create `proguard-rules.pro` with keep rules for SQLCipher, Ktor OkHttp, Kotlinx Serialization, and Room entities.
- Configure `res/xml/backup_rules.xml` and `data_extraction_rules.xml` to exclude encrypted Room databases and KeyStore preferences from unencrypted Android Cloud backup.
- Set release versioning and signing configuration in `build.gradle.kts`.

### Task 12: [UI Component] Adaptive Launcher Icon, Android 12+ Splash Screen & Edge-to-Edge Polish
- Create `res/drawable/ic_launcher_background.xml` (solid `#030712` canvas vector drawable).
- Create `res/drawable/ic_launcher_foreground.xml` (ShellGuard shield vector with `#E4048A` → `#EC4899` → `#06B6D4` gradient and clam pearl within 72dp safe zone).
- Create `res/mipmap-anydpi-v26/ic_launcher.xml` and `res/mipmap-anydpi-v26/ic_launcher_round.xml` referencing the adaptive icon layers.
- Add `androidx.core:core-splashscreen:1.0.1` and configure `Theme.App.Starting` in `res/values/styles.xml` / `themes.xml`.
- Update `MainActivity.kt` calling `installSplashScreen()` prior to `super.onCreate(savedInstanceState)`.
- Configure edge-to-edge transparent system navigation and status bar styling.

Verify release compilation, build the APK, and verify launcher icon appearance and splash transition on the device!
```

