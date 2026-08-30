---
roadmap_version: 2.0.0
last_updated: 2026-08-30
current_position: "Phase 1: Cryptographic Engine & Live Display — Sprint 1.1: Core Crypto & UI Ticker"
statistics:
  description: "Deterministic 6-Phase build roadmap for ShellGuard-TOTP Android Authenticator application. Engineered strictly in synergistic 2-task phases where Task A delivers core functionality and Task B delivers the corresponding UI/UX component."
  features_completed: "░░░░░░░░░░ 0%"
  features_in_progress: "░░░░░░░░░░ 0%"
---

# Master Project Roadmap — ShellGuard-TOTP Android

Systemic Design Rule: This roadmap follows a deterministic 6-Phase structure built on the principle: "Build features around security, not security around features." Each Phase contains strictly 2 paired tasks: **Task A (Core Functionality / Security Engine)** followed immediately by **Task B (Corresponding UI Component / Interactive State)**.

------------------ Current Position ------------------

## Phase 1: Cryptographic Engine & Live Countdown Display

> Phase Feature Set Overview:
> Delivers mathematical parity with ShellGuard's ShellCryption (HKDF-SHA256 + AES-GCM-256 with AAD binding) and a thread-safe RFC 6238 TOTP computation engine (HMAC-SHA1/256/512, 6/8 digits), paired immediately with the reactive 1-second ticker, color-transitioning progress ring, and unit test suites.

- [ ]  Task 01: [Functionality] Thread-Safe RFC 6238 TOTP Engine, ShellCryption HKDF & Comprehensive Unit Tests

Description: Create the core TOTP generation logic in `com.clawstack.shellguard.totp.engine` that implements RFC 6238, using the Kotlin Time library (`kotlin.time.Duration`, `kotlin.time.TimeSource`) for counter synchronization. Implement the standard TOTP algorithm using stored secret keys from the Room database. The engine generates current 6-digit or 8-digit codes based on system time, supporting SHA-1, SHA-256, and SHA-512 hashing algorithms with 30s/60s time steps in a thread-safe, zero-allocation manner in hot loops. Implement `ShellCryptionEngine` providing HKDF-SHA256 key derivation (`ikm = huKey`, `salt = userUuid`, `info = "clawchives-shellcryption-v1"`) and AES-GCM-256 with strict AAD binding (`vault_pearls_totp:{id}`). Create `TotpEngineTest.kt` and `ShellCryptionEngineTest.kt` in `test/` verifying RFC 6238 vectors and AAD tamper detection.

> Success Criteria: Unit tests prove 100% cryptographic compatibility with web client envelopes. `TotpEngine` passes all RFC 6238 reference test vectors across SHA-1, SHA-256, and SHA-512 with thread safety.

- [ ]  Task 02: [UI Component] Dynamic Reef Modernist Theme Engine, Reactive Ticker & Animated Progress Ring

Description: Implement `ui/theme/Color.kt`, `Theme.kt`, and `Type.kt` matching the Reef Modernist design system (`DarkBgBase` `#0F1419`, `DarkBgSurface` `#171C21`, `DarkTextMain` `#DEE3EA`, `DarkBorderSubtle` `#3D484E`). Implement `ThemeAccent` enum with 6 curated palettes (`REEF_DEFAULT`, `CYAN_VENT`, `PURPLE_SHELL`, `EMERALD_TRENCH`, `AMBER_FLARE`, `MONOCHROME`) and `LocalShellGuardColors` `staticCompositionLocalOf` for dynamic Compose color inheritance. Build `TotpTicker` reactive Flow (emitting 1-second ticks synchronized with Kotlin Time) and construct the `TotpCountdownRing` Canvas component. The ring visually depletes counter-clockwise over the 30s period, smoothly animating colors from secondary accent (30s–11s) → `CoralOrange` (10s–6s) → `LobsterRed` (5s–0s). Build the `TotpCard` composable displaying formatted split digits (`123 456`) with spring bounce interactions.

> Success Criteria: Composable renders a smooth 60fps countdown ring with animated color transitions. Numbers and rings update synchronously on 30s interval boundaries without frame drops or memory allocations. Theme supports dynamic Compose inheritance across dark/light and custom accents.

---

## Phase 2: Encrypted Local Persistence & Authenticator Dashboard

> Phase Feature Set Overview:
> Establishes the offline-first data layer using AndroidX Room with SQLCipher whole-database encryption initialized in the Application class, paired immediately with the complete Authenticator list screen, Material 3 Empty State view, live search bar, Pod category filter chips, and gesture controls (Swipe-to-delete, Long-press edit).

- [ ]  Task 03: [Functionality] AndroidX Room with SQLCipher Secure Persistence & Cache DAO

Description: Set up AndroidX Room with SQLCipher (`net.zetetic:sqlcipher-android`) for secure whole-database encrypted persistence, initialized properly within the Application class. Define `TotpItemEntity` for storing TOTP secrets (account name, username, secret key, issuer, algorithm, period, digits, category, `is_local_only`, `sync_state`), `SyncMetadataEntity`, and `AppConfig`. Implement `TotpItemDao` for CRUD, reactive Flow queries (`observeAllTotpItems`), keyword search, `getPendingSyncItems`, and delta pruning of obsolete remote items while strictly protecting local-only entries (`is_local_only = 1`). Implement `ShellGuardTotpDatabase` with SQLCipher `SupportFactory`.

> Success Criteria: Room database opens successfully with SQLCipher passphrase derived from KeyStore. CRUD queries execute on IO dispatchers. Database survives app process restarts and serves cached tokens offline.

- [ ]  Task 04: [UI Component] Reef Modernist Authenticator List Screen, Empty State & Gestures

Description: Develop a Material 3 'Empty State' screen (`TotpEmptyState.kt`) for the main dashboard featuring the minimalist 3D locked shell illustration (`R.drawable.ic_locked_shell`) that prompts the user to add their first 2FA code if the database is empty. Implement `TotpListScreen` with search bar, horizontal scrollable Pod category chips (`PodFilterChips.kt`), card list, settings navigation action, and one-tap clipboard copy with haptic feedback (`HapticFeedbackType.LongPress`) and auto-clearing toast. Wrap cards in `SwipeToDismissBox` (swipe-to-delete with red trash bin action) and tap-and-hold (long-press) to edit.

> Success Criteria: Screen displays cached 2FA accounts streamed from Room DB, and renders `TotpEmptyState` when 0 items exist. Search queries filter items instantly. Swipe-to-delete removes items from Room DB, and long-press triggers edit navigation.

---

## Phase 3: Vault Onboarding & Biometric Security Lifecycle

> Phase Feature Set Overview:
> Delivers the hardware-backed Android KeyStore biometric cryptographic binding, app-level `FLAG_SECURE` window protection, and inactivity auto-lock observer, paired immediately with the 3-step "Hatch New Vault" first-run onboarding wizard and the biometric `LockScreen` / `LoginScreen`.

- [ ]  Task 05: [Functionality] Hardware KeyStore Biometric Sealing, FLAG_SECURE & Inactivity Auto-Lock

Description: Implement `AndroidKeyStoreHelper` generating hardware-backed AES-256-GCM secret keys with `setUserAuthenticationRequired(true)` and `setInvalidatedByBiometricEnrollment(true)`. Implement `ClawCrypto` for `hu-`/`lb-` key SHA-256 hashing. Apply `FLAG_SECURE` to `MainActivity.window` to prevent screenshot leaks and task-switcher recents thumbnail snooping. Implement `AppLifecycleObserver` (using `ProcessLifecycleOwner`) to track app backgrounding and enforce configurable auto-lock timeouts (e.g. immediately or 1 minute after backgrounding).

> Success Criteria: Hardware KeyStore key initializes securely. Android OS blocks screenshots and renders blank recents previews in the app switcher. Leaving the app and returning after timeout triggers the lock state.

- [ ]  Task 06: [UI Component] "Hatch New Vault" Onboarding Wizard & Biometric LockScreen

Description: Implement `HatchVaultScreen.kt` (**"Hatch New Vault" Initial Launch Onboarding Wizard**): Step 1 (Welcome & Mode Selector: 4–8 digit PIN vs Master Password), Step 2 (Protection setup with confirmation match + skippable Biometric Switch Card), Step 3 (Success orientation). Implement `LockScreen.kt` / `LoginScreen.kt` integrating `androidx.biometric.BiometricPrompt` with `AndroidKeyStoreHelper.getBiometricCipher()` crypto-object wrapping, handling success, error, and PIN/Master Key fallback. Update `TotpNavHost.kt` with dynamic `startDestination` routing (`HatchVault` vs `LockScreen` vs `CodeList`).

> Success Criteria: Fresh installs launch into the Hatch Vault wizard to set a 4–8 digit PIN. Biometrics can be skipped or enabled. Once hatched, cold launches display the LockScreen with biometric prompt before revealing codes.

---

## Phase 4: CameraX QR Scanner & Multi-Format Backup Engine

> Phase Feature Set Overview:
> Delivers URI parsing for standard `otpauth://totp/...` URIs, Google Authenticator migration payloads, and the encrypted JSON backup/restore engine, paired immediately with the live CameraX preview scanner, scan from gallery image picker, and manual secret entry form.

- [ ]  Task 07: [Functionality] TotpUriParser, Migration Payloads & BackupManager Engine

Description: Implement `TotpUriParser` parsing `otpauth://totp/...` URIs (extracting secret, issuer, label, username, algorithm, period, digits) and raw Base32 strings. Implement `BackupManager` for encrypted JSON backup export and import (`shellguard-totp-backup-v1`) with SHA-256 integrity checksums and `ShellCryptionEngine` validation. Support standard unencrypted backup export/import for cross-app interoperability (e.g. Aegis / Bitwarden JSON).

> Success Criteria: URI parser extracts all 2FA parameters accurately. `BackupManager` exports and imports encrypted backups, failing cleanly if a file is tampered with or corrupted.

- [ ]  Task 08: [UI Component] CameraX Live Scanner, Gallery QR Picker & Manual Entry Screen

Description: Implement `QrScannerScreen.kt` using CameraX (`1.5.0`) and ML Kit Barcode Scanning (`17.3.0`) with a composable camera preview, targeted scanner reticle, flashlight toggle, and a "Scan from Image / Gallery" file picker fallback. Implement `AddSecretScreen.kt` for manual secret entry (title, username, Base32 key, category, algorithm, period, digits).

> Success Criteria: Camera scanner detects and parses 2FA QR codes within 500ms and pre-fills account creation. Gallery picker allows scanning QR codes from saved screenshots. Manual entry screen validates Base32 secrets and saves to Room DB.

---

## Phase 5: Self-Hosted Server Gateway & Bidirectional Delta Sync

> Phase Feature Set Overview:
> Delivers Ktor HTTP/HTTPS client with local LAN/VPN cleartext transport, two-way bidirectional sync (`POST /api/vault` upstream push + `GET /api/vault` downstream pull), and WorkManager background sync, paired immediately with the interactive Spotlight guided tour, ClawStack Gateway screen, and Settings screen.

- [ ]  Task 09: [Functionality] Two-Way Bidirectional Sync, Ktor OkHttp Client & WorkManager

Description: Configure Android Cleartext & VPN Network Security (`network_security_config.xml` & `AndroidManifest.xml`) permitting cleartext HTTP on local LANs (`192.168.x.x`, `10.x.x.x`) and Tailscale / WireGuard VPN mesh IPs (`100.64.0.0/10`). Implement `ShellGuardTotpClient` and `ApiClient` (Ktor OkHttp with `ConnectionSpec.CLEARTEXT` and `ConnectionSpec.MODERN_TLS`, self-signed cert trust, and VPN routing). Implement `AuthRepository` with `Mutex` synchronization lock. Implement `TotpRepository.syncRemoteVault()` supporting two-way bidirectional sync: pushes local/pending items to `POST /api/vault` as `password` items with encrypted `totp_secret`, and pulls remote pearls to merge into Room DB. Register `TotpSyncWorker` using AndroidX WorkManager for 15-minute periodic background delta sync.

> Success Criteria: App connects over HTTP, HTTPS, LAN, and Tailscale VPN without cleartext errors. Local 2FA codes push to the server and appear in the ShellGuard Web UI with live countdown rings. Remote vault items sync down to Android. WorkManager executes background sync cleanly.

- [ ]  Task 10: [UI Component] Interactive Spotlight Guided Tour, Server Gateway & Settings with Theme Picker

Description: Implement `SpotlightOverlay.kt` (**Interactive Spotlight Guided Tour**): dims and blurs background, punches circular cutout over topbar Settings icon with tooltip pill and centered `[ Skip Tutorial ]` button, transitioning to spotlight the "Connect to Server" button inside Settings. Implement `GatewayScreen.kt` & `GatewayViewModel.kt` (faithful 1:1 port of ClawStack Gateway: protocol/host/port segment bar, animated port width, key file dropzone + paste ShellKey view, and warning card). Implement `SettingsScreen.kt` (Appearance & Theme Accents Card with 6 curated palette swatches + mode toggles, server sync status card, "Sync Now", "Disconnect", offline codes count & filter, encrypted backup pickers, and biometric toggle).

> Success Criteria: First launch after Hatch Vault presents the Spotlight overlay guiding the user to Settings. Gateway connects and authenticates with the server. Settings screen allows selecting theme accent palettes with live preview, manual sync, disconnecting, and toggling biometrics.

---

## Phase 6: Final Polish — Adaptive App Icon, Splash Screen & Release Hardening

> Phase Feature Set Overview:
> Delivers ProGuard/R8 release minification rules, backup exclusions, release signing configurations, and semantic versioning, paired immediately with the vector adaptive launcher icon, Android 12+ SplashScreen theme, and edge-to-edge system bar styling.

- [ ]  Task 11: [Functionality] ProGuard/R8 Hardening, Backup Rules & Release Configuration

Description: Create `proguard-rules.pro` with keep rules for SQLCipher, Ktor OkHttp, Kotlinx Serialization, and Room entities to prevent release build obfuscation crashes. Configure `res/xml/backup_rules.xml` and `data_extraction_rules.xml` to exclude encrypted Room databases and KeyStore preferences from unencrypted Android Cloud backup. Set release signing and versioning in `build.gradle.kts`.

> Success Criteria: Release APK compiles with R8 minification enabled without runtime reflection crashes or serialization issues. Cloud backups do not leak encrypted database files.

- [ ]  Task 12: [UI Component] Adaptive Launcher Icon, Android 12+ Splash Screen & Edge-to-Edge Polish

Description: Create `ic_launcher_background.xml` (solid `#030712`) and `ic_launcher_foreground.xml` (ShellGuard shield vector with `#E4048A` → `#EC4899` → `#06B6D4` gradient and clam pearl within 72dp safe zone). Add `androidx.core:core-splashscreen:1.0.1` and configure `Theme.App.Starting` in styles/themes. Call `installSplashScreen()` in `MainActivity.kt`. Apply edge-to-edge transparent system navigation and status bar styling.

> Success Criteria: App icon renders crisply on Android launchers across all adaptive icon masks (circle, squircle, rounded square). App launches with smooth Android 12+ splash animation and edge-to-edge dark theme.

