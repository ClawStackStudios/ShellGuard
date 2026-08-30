# 🎨 ShellGuard-TOTP — Jetpack Compose UI & Design System

> **Reef Modernist ("Bioluminescent Defense") Design Tokens, Standardized ClawStack Gateway Login & Native 2FA Screens**  
> *Targeted for Google AI Studio Android Application Generator.*

---

## 1. Design Strategy: Standardized Gateway + Pure Native 2FA UI

The UI architecture follows a deliberate dual strategy:
1. **The Gateway Login Screen**: A faithful **1:1 standardized port** of the signature ClawStack Gateway Login screen (`ClawChives-Mobile`), visually aligned to ShellGuard's Reef Modernist branding. This maintains brand cohesion across all ClawStack mobile apps.
2. **Post-Login Authenticator Screens**: Highly optimized, pure native Android Material 3 Jetpack Compose interfaces engineered specifically for high-speed 2FA retrieval, glanceable live tickers, large monospace split codes, and CameraX barcode scanning.

---

## 2. Reef Modernist Theme Tokens & Dynamic Theme Engine (`Color.kt` & `Theme.kt`)

```kotlin
package com.clawstack.shellguard.totp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color

// ── Canonical ShellGuard Brand Colors ───────────────────────────
val BrandLobsterRed = Color(0xFFE4048A)      // Primary Action / Brand Gradient
val BrandClawCyan = Color(0xFF06B6D4)        // Secondary Action / Active Vents
val BrandPurple = Color(0xFF3B0764)          // ShellGuard Dark Purple
val BrandCoralOrange = Color(0xFFF97316)      // Countdown Warning (< 10s)
val BrandEmerald = Color(0xFF10B981)          // Success / Validated State

// ── Dark Mode Tokens (Abyssal Dark) ─────────────────────────────
val DarkBgBase = Color(0xFF0F1419)           // Canvas Viewport Floor
val DarkBgSurface = Color(0xFF171C21)        // Card / Container Surface
val DarkBgElevated = Color(0xFF1E252C)       // Sheets / Modals / Toolbars
val DarkTextMain = Color(0xFFDEE3EA)         // Luminous Shell Headlines & Codes
val DarkTextMuted = Color(0xFF879298)        // Secondary Subtitles & Timestamps
val DarkBorderSubtle = Color(0xFF3D484E)     // Carapace Ridge 1dp Outlines

// ── Light Mode Tokens (Ocean Mist) ──────────────────────────────
val LightBgBase = Color(0xFFF1F5F9)          // Ocean Mist Canvas
val LightBgSurface = Color(0xFFFFFFFF)       // Crisp White Card Surface
val LightBgElevated = Color(0xFFF8FAFC)      // Elevated Surfaces
val LightTextMain = Color(0xFF0F172A)        // Slate 900 Typography
val LightTextMuted = Color(0xFF64748B)       // Slate 500 Subtitles
val LightBorderSubtle = Color(0xFFCBD5E1)    // Slate 300 Outlines

// ── Theme Accents Enum ──────────────────────────────────────────
enum class ThemeAccent(
    val displayName: String,
    val primaryColor: Color,
    val secondaryColor: Color
) {
    REEF_DEFAULT("Reef Bioluminescent", BrandLobsterRed, BrandClawCyan),
    CYAN_VENT("Electric Cyan", BrandClawCyan, BrandLobsterRed),
    PURPLE_SHELL("Imperial Shell", Color(0xFFA855F7), BrandClawCyan),
    EMERALD_TRENCH("Emerald Bio-Flora", BrandEmerald, BrandClawCyan),
    AMBER_FLARE("Solar Vent", Color(0xFFF59E0B), BrandLobsterRed),
    MONOCHROME("Minimalist Pearl", Color(0xFFF8FAFC), Color(0xFF879298))
}

enum class ThemeMode {
    SYSTEM, DARK, LIGHT
}

// ── Dynamic Color Scheme Carrier ─────────────────────────────────
data class ShellGuardCustomColors(
    val bgBase: Color,
    val bgSurface: Color,
    val bgElevated: Color,
    val textMain: Color,
    val textMuted: Color,
    val borderSubtle: Color,
    val primaryAccent: Color,
    val secondaryAccent: Color,
    val warning: Color = BrandCoralOrange,
    val danger: Color = BrandLobsterRed
)

val LocalShellGuardColors = staticCompositionLocalOf<ShellGuardCustomColors> {
    error("No ShellGuardColors provided")
}

@Composable
fun ShellGuardTheme(
    themeMode: ThemeMode = ThemeMode.DARK,
    accent: ThemeAccent = ThemeAccent.REEF_DEFAULT,
    content: @Composable () -> Unit
) {
    val isDark = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.DARK -> true
        ThemeMode.LIGHT -> false
    }

    val customColors = if (isDark) {
        ShellGuardCustomColors(
            bgBase = DarkBgBase,
            bgSurface = DarkBgSurface,
            bgElevated = DarkBgElevated,
            textMain = DarkTextMain,
            textMuted = DarkTextMuted,
            borderSubtle = DarkBorderSubtle,
            primaryAccent = accent.primaryColor,
            secondaryAccent = accent.secondaryColor
        )
    } else {
        ShellGuardCustomColors(
            bgBase = LightBgBase,
            bgSurface = LightBgSurface,
            bgElevated = LightBgElevated,
            textMain = LightTextMain,
            textMuted = LightTextMuted,
            borderSubtle = LightBorderSubtle,
            primaryAccent = accent.primaryColor,
            secondaryAccent = accent.secondaryColor
        )
    }

    val materialColors = if (isDark) {
        darkColorScheme(
            primary = accent.primaryColor,
            onPrimary = if (accent == ThemeAccent.MONOCHROME) DarkBgBase else Color.White,
            secondary = accent.secondaryColor,
            background = DarkBgBase,
            onBackground = DarkTextMain,
            surface = DarkBgSurface,
            onSurface = DarkTextMain,
            surfaceVariant = DarkBgElevated,
            onSurfaceVariant = DarkTextMuted,
            outline = DarkBorderSubtle,
            error = BrandLobsterRed
        )
    } else {
        lightColorScheme(
            primary = accent.primaryColor,
            onPrimary = Color.White,
            secondary = accent.secondaryColor,
            background = LightBgBase,
            onBackground = LightTextMain,
            surface = LightBgSurface,
            onSurface = LightTextMain,
            surfaceVariant = LightBgElevated,
            onSurfaceVariant = LightTextMuted,
            outline = LightBorderSubtle,
            error = BrandLobsterRed
        )
    }

    CompositionLocalProvider(LocalShellGuardColors provides customColors) {
        MaterialTheme(
            colorScheme = materialColors,
            typography = ShellGuardTypography,
            content = content
        )
    }
}
```

---

## 3. Standardized ClawStack Gateway Login (`GatewayScreen.kt`)

Faithfully ported from `ClawChives-Mobile`, aligned to ShellGuard's visual branding:

```kotlin
package com.clawstack.shellguard.totp.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.clawstack.shellguard.totp.ui.theme.*
import com.clawstack.shellguard.totp.ui.viewmodels.GatewayUiState
import com.clawstack.shellguard.totp.ui.viewmodels.GatewayViewModel

@Composable
fun GatewayScreen(
    viewModel: GatewayViewModel,
    modifier: Modifier = Modifier,
    onLoginSuccess: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val savedServerUrl by viewModel.savedServerUrl.collectAsStateWithLifecycle(initialValue = null)
    val savedKey by viewModel.savedKey.collectAsStateWithLifecycle(initialValue = null)

    var isUploadMode by remember { mutableStateOf(false) }
    var protocol by remember { mutableStateOf("https") }
    var serverHost by remember { mutableStateOf("") }
    var serverPort by remember { mutableStateOf("") }
    var isUrlValid by remember { mutableStateOf(true) }
    var urlErrorMessage by remember { mutableStateOf("") }
    var isProtocolDropdownExpanded by remember { mutableStateOf(false) }
    var isHostFocused by remember { mutableStateOf(false) }
    var isPortFocused by remember { mutableStateOf(false) }
    var keyText by remember { mutableStateOf("") }
    var uploadedKey by remember { mutableStateOf<String?>(null) }
    var uploadedFileName by remember { mutableStateOf<String?>(null) }

    val focusManager = LocalFocusManager.current
    val context = LocalContext.current

    fun parseAndSetUrl(input: String) {
        var raw = input.trim()
        if (raw.isEmpty()) {
            serverHost = ""
            return
        }
        if (raw.startsWith("https://", ignoreCase = true)) {
            protocol = "https"
            raw = raw.substring("https://".length)
        } else if (raw.startsWith("http://", ignoreCase = true)) {
            protocol = "http"
            raw = raw.substring("http://".length)
        }

        if (raw.contains(":")) {
            val parts = raw.split(":")
            serverHost = parts[0]
            if (parts.size > 1) {
                val portAndPath = parts[1]
                val slashIndex = portAndPath.indexOf('/')
                if (slashIndex != -1) {
                    serverPort = portAndPath.substring(0, slashIndex).filter { it.isDigit() }
                    serverHost += portAndPath.substring(slashIndex)
                } else {
                    serverPort = portAndPath.filter { it.isDigit() }
                }
            }
        } else {
            serverHost = raw
        }
    }

    val fileLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            try {
                val text = context.contentResolver.openInputStream(it)?.bufferedReader()?.use { r -> r.readText() }
                if (text != null) {
                    var fileName = "shellguard_identity.json"
                    context.contentResolver.query(it, null, null, null, null)?.use { cursor ->
                        val nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                        if (nameIndex != -1 && cursor.moveToFirst()) {
                            fileName = cursor.getString(nameIndex)
                        }
                    }
                    val extractedKey = cleanAndExtractKey(text)
                    if (extractedKey.isNotEmpty()) {
                        uploadedKey = extractedKey
                        uploadedFileName = fileName
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    LaunchedEffect(savedServerUrl) {
        savedServerUrl?.let { url ->
            if (serverHost.isEmpty() && url.isNotEmpty()) parseAndSetUrl(url)
        }
    }

    LaunchedEffect(savedKey) {
        savedKey?.let { key ->
            if (keyText.isEmpty() && key.isNotEmpty()) {
                keyText = key
                isUploadMode = false
            }
        }
    }

    LaunchedEffect(uiState) {
        if (uiState is GatewayUiState.Success) {
            onLoginSuccess()
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // ShellGuard Brand Icon
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(LobsterRed),
            contentAlignment = Alignment.Center
        ) {
            Text(text = "🐚", fontSize = 40.sp)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Brand Title
        Text(
            text = buildAnnotatedString {
                withStyle(style = SpanStyle(color = LobsterRed)) { append("Shell") }
                withStyle(style = SpanStyle(color = ClawCyan)) { append("Guard") }
                withStyle(style = SpanStyle(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f), fontSize = 12.sp)) { append(" ©™") }
            },
            fontWeight = FontWeight.Bold,
            fontSize = 24.sp
        )

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "Authenticator Gateway",
            color = MaterialTheme.colorScheme.onBackground,
            fontWeight = FontWeight.Bold,
            fontSize = 26.sp
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "Login with your ShellKey©™ identity",
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
            fontSize = 15.sp
        )

        Spacer(modifier = Modifier.height(28.dp))

        // Segmented URL Bar
        val animatedPortWidth by animateDpAsState(
            targetValue = if (isPortFocused) 105.dp else 65.dp,
            label = "PortWidth"
        )

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .zIndex(100f)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .border(
                            width = if (isHostFocused || isPortFocused || !isUrlValid) 1.5.dp else 1.dp,
                            color = if (!isUrlValid) MaterialTheme.colorScheme.error else if (isPortFocused) LobsterRed else if (isHostFocused) ClawCyan else MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(12.dp)
                        ),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Protocol Button
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxHeight()
                            .background(if (!isUrlValid) MaterialTheme.colorScheme.error else ClawCyan)
                            .clickable { isProtocolDropdownExpanded = !isProtocolDropdownExpanded }
                            .padding(horizontal = 14.dp)
                    ) {
                        Text(
                            text = if (protocol == "https") "https://" else "http://",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = if (isProtocolDropdownExpanded) Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                            contentDescription = "Select protocol",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    // Host Input
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier.weight(1f),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            if (serverHost.isEmpty()) {
                                Text(
                                    text = "vault.example.com",
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                    fontSize = 14.sp
                                )
                            }
                            BasicTextField(
                                value = serverHost,
                                onValueChange = {
                                    parseAndSetUrl(it)
                                    isUrlValid = true
                                },
                                textStyle = TextStyle(
                                    color = MaterialTheme.colorScheme.onBackground,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium
                                ),
                                cursorBrush = SolidColor(if (isHostFocused) ClawCyan else MaterialTheme.colorScheme.onBackground),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                                keyboardActions = KeyboardActions(onNext = { focusManager.clearFocus() }),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .onFocusChanged { isHostFocused = it.isFocused }
                            )
                        }
                    }

                    // Divider
                    Box(
                        modifier = Modifier
                            .width(1.dp)
                            .height(24.dp)
                            .background(if (!isUrlValid) MaterialTheme.colorScheme.error else if (isPortFocused) LobsterRed else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
                    )

                    // Port Section
                    Box(
                        modifier = Modifier
                            .width(animatedPortWidth)
                            .height(56.dp)
                            .background(if (!isUrlValid) MaterialTheme.colorScheme.error.copy(alpha = 0.12f) else if (isPortFocused) LobsterRed.copy(alpha = 0.12f) else Color.Transparent)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier.weight(1f),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                if (serverPort.isEmpty()) {
                                    Text(
                                        text = "Port",
                                        color = if (!isUrlValid) MaterialTheme.colorScheme.error else if (isPortFocused) LobsterRed.copy(alpha = 0.6f) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                        fontSize = 14.sp
                                    )
                                }
                                BasicTextField(
                                    value = serverPort,
                                    onValueChange = { input ->
                                        serverPort = input.filter { it.isDigit() }
                                        isUrlValid = true
                                    },
                                    textStyle = TextStyle(
                                        color = if (!isUrlValid) MaterialTheme.colorScheme.error else if (isPortFocused) LobsterRed else MaterialTheme.colorScheme.onBackground,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    cursorBrush = SolidColor(if (isPortFocused) LobsterRed else MaterialTheme.colorScheme.onBackground),
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                                    keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .onFocusChanged { isPortFocused = it.isFocused }
                                )
                            }
                        }
                    }
                }

                if (!isUrlValid) {
                    Text(
                        text = urlErrorMessage,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(start = 16.dp, top = 4.dp)
                    )
                }
            }

            // Protocol Dropdown
            AnimatedVisibility(
                visible = isProtocolDropdownExpanded,
                enter = expandVertically(expandFrom = Alignment.Top) + fadeIn(),
                exit = shrinkVertically(shrinkTowards = Alignment.Top) + fadeOut(),
                modifier = Modifier
                    .zIndex(110f)
                    .padding(start = 0.dp, top = 60.dp)
            ) {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, ClawCyan.copy(alpha = 0.5f)),
                    modifier = Modifier.width(110.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    protocol = "http"
                                    isProtocolDropdownExpanded = false
                                    isUrlValid = true
                                }
                                .background(if (protocol == "http") ClawCyan.copy(alpha = 0.12f) else Color.Transparent)
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "http://",
                                color = if (protocol == "http") ClawCyan else MaterialTheme.colorScheme.onSurface,
                                fontWeight = if (protocol == "http") FontWeight.Bold else FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                        HorizontalDivider(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    protocol = "https"
                                    isProtocolDropdownExpanded = false
                                    isUrlValid = true
                                }
                                .background(if (protocol == "https") ClawCyan.copy(alpha = 0.12f) else Color.Transparent)
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "https://",
                                color = if (protocol == "https") ClawCyan else MaterialTheme.colorScheme.onSurface,
                                fontWeight = if (protocol == "https") FontWeight.Bold else FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Mode Toggles: Upload File vs Paste Key
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f))
                .border(1.dp, MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(topStart = 12.dp, bottomStart = 12.dp))
                    .background(if (isUploadMode) ClawCyan else Color.Transparent)
                    .clickable { isUploadMode = true }
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "Upload File", color = if (isUploadMode) Color.White else MaterialTheme.colorScheme.onBackground)
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(topEnd = 12.dp, bottomEnd = 12.dp))
                    .background(if (!isUploadMode) ClawCyan else Color.Transparent)
                    .clickable { isUploadMode = false }
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "Paste ShellKey©™", color = if (!isUploadMode) Color.White else MaterialTheme.colorScheme.onBackground)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (isUploadMode) {
            UploadFileView(
                uploadedFileName = uploadedFileName,
                onTap = { fileLauncher.launch("application/json") },
                onClear = {
                    uploadedKey = null
                    uploadedFileName = null
                }
            )
        } else {
            PasteKeyView(
                keyText = keyText,
                onKeyTextChanged = { keyText = it },
                hasSavedKey = savedKey != null,
                onClearSavedKey = {
                    viewModel.clearSavedKey()
                    keyText = ""
                }
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        val isFormValid = if (isUploadMode) {
            uploadedKey != null && serverHost.isNotBlank()
        } else {
            keyText.isNotBlank() && serverHost.isNotBlank()
        }

        Button(
            onClick = {
                val cleanHost = serverHost.trim()
                    .removePrefix("https://")
                    .removePrefix("http://")
                val finalUrl = buildString {
                    append(if (protocol == "https") "https://" else "http://")
                    append(cleanHost)
                    if (serverPort.isNotBlank()) {
                        append(":")
                        append(serverPort.trim())
                    }
                }
                val targetKey = cleanAndExtractKey(if (isUploadMode) uploadedKey.orEmpty() else keyText)
                viewModel.login(finalUrl, targetKey)
            },
            enabled = uiState !is GatewayUiState.Loading && isFormValid,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = ClawCyan)
        ) {
            if (uiState is GatewayUiState.Loading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            } else {
                Text("Login with Identity", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = AbyssalDeep)
            }
        }
    }
}

@Composable
fun UploadFileView(
    uploadedFileName: String?,
    onTap: () -> Unit,
    onClear: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .border(
                    width = 1.dp,
                    color = if (uploadedFileName != null) ClawCyan else MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(12.dp)
                )
                .clip(RoundedCornerShape(12.dp))
                .background(if (uploadedFileName != null) ClawCyan.copy(alpha = 0.05f) else Color.Transparent)
                .clickable { onTap() },
            contentAlignment = Alignment.Center
        ) {
            if (uploadedFileName != null) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
                    Text(text = "🐚 Identity Loaded Successfully!", color = ClawCyan, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "File: $uploadedFileName", color = MaterialTheme.colorScheme.onBackground, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Tap to change file", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f), fontSize = 11.sp)
                }
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "Tap to upload your identity file", color = MaterialTheme.colorScheme.onBackground, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                    Text(text = ".json files only", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f), fontSize = 14.sp)
                }
            }
        }

        if (uploadedFileName != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onClear,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Remove File", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        WarningBox()
    }
}

@Composable
fun PasteKeyView(
    keyText: String,
    onKeyTextChanged: (String) -> Unit,
    hasSavedKey: Boolean,
    onClearSavedKey: () -> Unit
) {
    var passwordVisible by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = keyText,
            onValueChange = onKeyTextChanged,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Paste your hu- or lb- key here...") },
            shape = RoundedCornerShape(12.dp),
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                        contentDescription = if (passwordVisible) "Hide key" else "Show key",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = ClawCyan,
                unfocusedBorderColor = MaterialTheme.colorScheme.surfaceVariant
            )
        )

        if (hasSavedKey && keyText.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onClearSavedKey,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Clear Saved Key", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        WarningBox()
    }
}

@Composable
fun WarningBox() {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = WarningBoxBg),
        border = BorderStroke(1.dp, WarningBoxBg.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
            Icon(
                imageVector = Icons.Filled.Lock,
                contentDescription = "Warning",
                tint = WarningText,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text("Can't find your identity file?", color = WarningText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Your identity file or hu- key is the only way to access your vault. If lost, vault secrets cannot be recovered.",
                    color = WarningText.copy(alpha = 0.8f),
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
            }
        }
    }
}

fun cleanAndExtractKey(rawInput: String): String {
    val trimmed = rawInput.trim()
    if (trimmed.isEmpty()) return ""

    val tokenJsonMatch = """"token"\s*:\s*"([^"]+)"""".toRegex().find(trimmed)
    if (tokenJsonMatch != null) {
        val extracted = tokenJsonMatch.groupValues[1].trim()
        if (extracted.isNotEmpty()) return extracted
    }

    val keyPatternMatch = """(hu-|lb-)[a-zA-Z0-9_-]+""".toRegex().find(trimmed)
    if (keyPatternMatch != null) {
        return keyPatternMatch.value.trim()
    }

    return trimmed.removeSurrounding("\"").removeSurrounding("'").trim()
}
```

---

## 4. Post-Login Authenticator Screens (Pure Native Android UI)

### A. Navigation Graph & Start Destination (`TotpNavHost.kt`)

Manages transitions between `'Login'`, `'CodeList'`, `'AddSecret'`, `'Scanner'`, and `'Settings'`, enforcing `'Login'` as the initial start destination:

```kotlin
package com.clawstack.shellguard.totp.ui.navigation

import androidx.compose.animation.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.clawstack.shellguard.totp.ui.screens.*
import com.clawstack.shellguard.totp.ui.viewmodels.AuthViewModel
import com.clawstack.shellguard.totp.ui.viewmodels.TotpListViewModel

sealed class Screen(val route: String) {
    object HatchVault : Screen("hatch_vault")
    object CodeList : Screen("code_list")
    object Login : Screen("login")
    object Gateway : Screen("gateway")
    object AddSecret : Screen("add_secret")
    object EditSecret : Screen("edit_secret/{itemId}") {
        fun createRoute(itemId: String) = "edit_secret/$itemId"
    }
    object QrScanner : Screen("qr_scanner")
    object Settings : Screen("settings")
}

@Composable
fun TotpNavHost(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    totpListViewModel: TotpListViewModel,
    modifier: Modifier = Modifier
) {
    val isVaultHatched by authViewModel.isVaultHatched.collectAsStateWithLifecycle()
    val isBiometricEnabled by authViewModel.isBiometricEnabled.collectAsStateWithLifecycle()
    val authState by authViewModel.authState.collectAsStateWithLifecycle()

    // ── First-Launch & Authentication Destination Routing ──
    val startRoute = when {
        !isVaultHatched -> Screen.HatchVault.route
        isBiometricEnabled && authState !is AuthState.Authenticated -> Screen.Login.route
        else -> Screen.CodeList.route
    }

    NavHost(
        navController = navController,
        startDestination = startRoute,
        modifier = modifier
    ) {
        composable(
            route = Screen.HatchVault.route,
            enterTransition = { fadeIn() },
            exitTransition = { fadeOut() }
        ) {
            HatchVaultScreen(
                onVaultHatched = { masterSecret, useBiometrics ->
                    authViewModel.hatchNewVault(masterSecret, useBiometrics)
                    navController.navigate(Screen.CodeList.route) {
                        popUpTo(Screen.HatchVault.route) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.CodeList.route,
            enterTransition = { fadeIn() },
            exitTransition = { fadeOut() }
        ) {
            TotpListScreen(
                viewModel = totpListViewModel,
                onAddSecretClick = { navController.navigate(Screen.AddSecret.route) },
                onEditSecretClick = { itemId -> navController.navigate(Screen.EditSecret.createRoute(itemId)) },
                onScanQrClick = { navController.navigate(Screen.QrScanner.route) },
                onSettingsClick = { navController.navigate(Screen.Settings.route) }
            )
        }

        composable(
            route = Screen.Login.route,
            enterTransition = { fadeIn() },
            exitTransition = { fadeOut() }
        ) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.CodeList.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.Gateway.route,
            enterTransition = { slideInVertically(initialOffsetY = { it }) + fadeIn() },
            exitTransition = { slideOutVertically(targetOffsetY = { it }) + fadeOut() }
        ) {
            GatewayScreen(
                onLoginSuccess = {
                    totpListViewModel.syncRemoteVault()
                    navController.popBackStack()
                }
            )
        }

        composable(
            route = Screen.AddSecret.route,
            enterTransition = { slideInVertically(initialOffsetY = { it }) + fadeIn() },
            exitTransition = { slideOutVertically(targetOffsetY = { it }) + fadeOut() }
        ) {
            AddSecretScreen(
                onSaveSecret = { newItem ->
                    totpListViewModel.addManualItem(newItem)
                    navController.popBackStack()
                },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.QrScanner.route,
            enterTransition = { slideInVertically(initialOffsetY = { it }) + fadeIn() },
            exitTransition = { slideOutVertically(targetOffsetY = { it }) + fadeOut() }
        ) {
            QrScannerScreen(
                onCodeScanned = { scannedUri ->
                    totpListViewModel.importScannedUri(scannedUri)
                    navController.popBackStack()
                },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.Settings.route,
            enterTransition = { slideInHorizontally(initialOffsetX = { it }) + fadeIn() },
            exitTransition = { slideOutHorizontally(targetOffsetX = { it }) + fadeOut() }
        ) {
            SettingsScreen(
                serverUrl = authViewModel.serverUrl.value,
                userName = authViewModel.userName.value,
                lastSyncTime = totpListViewModel.lastSyncTime.value,
                offlineCodesCount = totpListViewModel.offlineCodesCount.value,
                isBiometricEnabled = authViewModel.isBiometricEnabled.value,
                onConnectServerClick = { navController.navigate(Screen.Gateway.route) },
                onDisconnectServerClick = { authViewModel.disconnectServer() },
                onManualSyncClick = { totpListViewModel.syncRemoteVault() },
                onDisplayOfflineCodesClick = {
                    totpListViewModel.filterOfflineCodesOnly()
                    navController.popBackStack()
                },
                onToggleBiometric = { authViewModel.setBiometricEnabled(it) },
                onExportBackupClick = { totpListViewModel.exportBackup() },
                onImportBackupClick = { totpListViewModel.importBackup() },
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}
```

---

### B. "Hatch New Vault" Initial Launch Onboarding Wizard (`HatchVaultScreen.kt`)

Guides users through initializing their standalone vault with a master passphrase or 4-8 digit PIN code and optional biometrics:

```kotlin
package com.clawstack.shellguard.totp.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.clawstack.shellguard.totp.ui.theme.*

enum class VaultProtectionMode { PIN, PASSWORD }

@Composable
fun HatchVaultScreen(
    onVaultHatched: (masterSecret: String, useBiometrics: Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    var step by remember { mutableStateOf(1) } // 1: Welcome/Mode, 2: Secret Setup, 3: Guided Tour
    var protectionMode by remember { mutableStateOf(VaultProtectionMode.PIN) }
    var pinOrPassword by remember { mutableStateOf("") }
    var confirmSecret by remember { mutableStateOf("") }
    var enableBiometrics by remember { mutableStateOf(false) }
    var isSecretVisible by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(AbyssalDeep)
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (step == 1) {
            // ── Step 1: Welcome & Protection Mode Selection ──────────
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(ShellSurfaceElevated)
                    .border(2.dp, ClawCyan.copy(alpha = 0.6f), RoundedCornerShape(24.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = "Hatch Vault",
                    tint = ClawCyan,
                    modifier = Modifier.size(56.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text("Hatch Your 2FA Vault", color = TextPearl, fontWeight = FontWeight.Bold, fontSize = 24.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Welcome to ShellGuard TOTP. Let's initialize your secure offline vault. Choose how you'd like to protect your codes on this device.",
                color = TextMuted,
                fontSize = 14.sp,
                lineHeight = 20.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Protection Mode Selector (PIN vs Password)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(ShellSurface)
                    .border(1.dp, ShellBorder, RoundedCornerShape(14.dp))
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(topStart = 14.dp, bottomStart = 14.dp))
                        .background(if (protectionMode == VaultProtectionMode.PIN) ClawCyan else Color.Transparent)
                        .clickable { protectionMode = VaultProtectionMode.PIN }
                        .padding(vertical = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "PIN Code (4-8 digits)",
                        color = if (protectionMode == VaultProtectionMode.PIN) AbyssalDeep else TextPearl,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(topEnd = 14.dp, bottomEnd = 14.dp))
                        .background(if (protectionMode == VaultProtectionMode.PASSWORD) ClawCyan else Color.Transparent)
                        .clickable { protectionMode = VaultProtectionMode.PASSWORD }
                        .padding(vertical = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "Master Password",
                        color = if (protectionMode == VaultProtectionMode.PASSWORD) AbyssalDeep else TextPearl,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { step = 2 },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ClawCyan)
            ) {
                Text("Continue to Protection Setup", color = AbyssalDeep, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = AbyssalDeep)
            }
        } else if (step == 2) {
            // ── Step 2: Enter PIN / Password & Biometrics Option ────
            Text(
                if (protectionMode == VaultProtectionMode.PIN) "Set Your Vault PIN" else "Set Master Password",
                color = TextPearl,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                if (protectionMode == VaultProtectionMode.PIN) "Enter a 4 to 8 digit numeric PIN" else "Enter a strong master passphrase",
                color = TextMuted,
                fontSize = 14.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = pinOrPassword,
                onValueChange = { input ->
                    if (protectionMode == VaultProtectionMode.PIN) {
                        if (input.length <= 8 && input.all { it.isDigit() }) pinOrPassword = input
                    } else pinOrPassword = input
                },
                label = { Text(if (protectionMode == VaultProtectionMode.PIN) "Enter PIN (4-8 digits)" else "Master Password") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = if (protectionMode == VaultProtectionMode.PIN) KeyboardType.NumberPassword else KeyboardType.Password),
                visualTransformation = if (isSecretVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = { isSecretVisible = !isSecretVisible }) {
                        Icon(if (isSecretVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff, contentDescription = null, tint = TextMuted)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ClawCyan, unfocusedBorderColor = ShellBorder)
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = confirmSecret,
                onValueChange = { input ->
                    if (protectionMode == VaultProtectionMode.PIN) {
                        if (input.length <= 8 && input.all { it.isDigit() }) confirmSecret = input
                    } else confirmSecret = input
                },
                label = { Text("Confirm Secret") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = if (protectionMode == VaultProtectionMode.PIN) KeyboardType.NumberPassword else KeyboardType.Password),
                visualTransformation = if (isSecretVisible) VisualTransformation.None else PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = if (confirmSecret.isNotEmpty() && confirmSecret != pinOrPassword) LobsterRed else ClawCyan,
                    unfocusedBorderColor = ShellBorder
                )
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Optional Biometric Switch Card
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = ShellSurface),
                border = BorderStroke(1.dp, ShellBorder)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.Fingerprint, contentDescription = null, tint = ClawCyan)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Enable Biometric Unlock", color = TextPearl, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text("Unlock with fingerprint or face", color = TextMuted, fontSize = 12.sp)
                        }
                    }
                    Switch(
                        checked = enableBiometrics,
                        onCheckedChange = { enableBiometrics = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = ClawCyan, checkedTrackColor = ClawCyanGlow)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            val isSecretValid = if (protectionMode == VaultProtectionMode.PIN) {
                pinOrPassword.length in 4..8 && pinOrPassword == confirmSecret
            } else {
                pinOrPassword.isNotBlank() && pinOrPassword == confirmSecret
            }

            Button(
                onClick = { step = 3 },
                enabled = isSecretValid,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ClawCyan)
            ) {
                Text("Hatch My Vault", color = AbyssalDeep, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        } else if (step == 3) {
            // ── Step 3: Interactive Guided Tour / Orientation ───────
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ClawCyan, modifier = Modifier.size(64.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("Vault Hatched Successfully!", color = TextPearl, fontWeight = FontWeight.Bold, fontSize = 22.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Here's how to get the most out of ShellGuard:", color = TextMuted, fontSize = 14.sp)

            Spacer(modifier = Modifier.height(24.dp))

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = ShellSurface),
                border = BorderStroke(1.dp, ShellBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.Top) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = ClawCyan, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("1. Add or Scan 2FA Codes", color = TextPearl, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text("Use the camera to scan QR codes or enter Base32 keys manually.", color = TextMuted, fontSize = 13.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = ShellBorder)
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(verticalAlignment = Alignment.Top) {
                        Icon(Icons.Default.CloudSync, contentDescription = null, tint = ClawCyan, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("2. Connect to Server (Optional)", color = TextPearl, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text("Whenever you're ready, tap the Settings icon in the top right and choose 'Connect to Server' to sync with your self-hosted ShellGuard vault.", color = TextMuted, fontSize = 13.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { onVaultHatched(pinOrPassword, enableBiometrics) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ClawCyan)
            ) {
                Text("Enter My Vault", color = AbyssalDeep, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}

---

### C. Biometric & Master Key Cold-Start Lock (`LoginScreen.kt`)

Designed under the **Reef Modernist** theme utilizing the `FLAG_SECURE` window context:

```kotlin
package com.clawstack.shellguard.totp.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.clawstack.shellguard.totp.ui.theme.*
import com.clawstack.shellguard.totp.ui.viewmodels.AuthState
import com.clawstack.shellguard.totp.ui.viewmodels.AuthViewModel

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onLoginSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val authState by viewModel.authState.collectAsStateWithLifecycle()
    val isBiometricAvailable by viewModel.isBiometricAvailable.collectAsStateWithLifecycle()
    var masterKeyInput by remember { mutableStateOf("") }
    var isKeyVisible by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val activity = context as? FragmentActivity

    LaunchedEffect(authState) {
        if (authState is AuthState.Authenticated) {
            onLoginSuccess()
        }
    }

    // Auto-trigger Biometric Prompt on launch if available
    LaunchedEffect(isBiometricAvailable) {
        if (isBiometricAvailable && activity != null) {
            viewModel.promptBiometrics(activity)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(AbyssalDeep)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // ── Centered 3D Locked Shell / Biometric Emblem ─────────
        Box(
            modifier = Modifier
                .size(110.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(ShellSurfaceElevated)
                .border(2.dp, ClawCyan.copy(alpha = 0.6f), RoundedCornerShape(24.dp))
                .clickable {
                    if (activity != null) viewModel.promptBiometrics(activity)
                },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Fingerprint,
                contentDescription = "Trigger Biometric Unlock",
                tint = ClawCyan,
                modifier = Modifier.size(56.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "ShellGuard Authenticator",
            color = TextPearl,
            fontWeight = FontWeight.Bold,
            fontSize = 24.sp
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "Tap fingerprint or enter master key to unlock",
            color = TextMuted,
            fontSize = 14.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        // ── Primary Biometric Trigger Button ────────────────────
        if (isBiometricAvailable) {
            Button(
                onClick = { if (activity != null) viewModel.promptBiometrics(activity) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ClawCyan)
            ) {
                Icon(Icons.Default.Fingerprint, contentDescription = null, tint = AbyssalDeep, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Unlock with Biometrics", color = AbyssalDeep, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text("— OR ENTER KEY —", color = TextMuted.copy(alpha = 0.6f), fontSize = 11.sp, fontWeight = FontWeight.Bold)

            Spacer(modifier = Modifier.height(16.dp))
        }

        // ── Fallback Master Key Input Field ─────────────────────
        OutlinedTextField(
            value = masterKeyInput,
            onValueChange = { masterKeyInput = it },
            label = { Text("Master hu- or lb- Key") },
            placeholder = { Text("hu-0195a6c1...") },
            singleLine = true,
            visualTransformation = if (isKeyVisible) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = { isKeyVisible = !isKeyVisible }) {
                    Icon(
                        imageVector = if (isKeyVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                        contentDescription = "Toggle key visibility",
                        tint = TextMuted
                    )
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = ClawCyan,
                unfocusedBorderColor = ShellBorder,
                focusedLabelColor = ClawCyan,
                unfocusedLabelColor = TextMuted,
                focusedTextColor = TextPearl,
                unfocusedTextColor = TextPearl
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { viewModel.unlockWithMasterKey(masterKeyInput) },
            enabled = masterKeyInput.isNotBlank() && authState !is AuthState.Loading,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = ShellSurfaceElevated),
            border = BorderStroke(1.dp, if (masterKeyInput.isNotBlank()) ClawCyan else ShellBorder)
        ) {
            if (authState is AuthState.Loading) {
                CircularProgressIndicator(color = ClawCyan, modifier = Modifier.size(20.dp))
            } else {
                Text("Unlock Vault", color = TextPearl, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            }
        }
    }
}
```

---

### C. Manual 2FA Account Entry (`AddSecretScreen.kt`)

```kotlin
package com.clawstack.shellguard.totp.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.clawstack.shellguard.totp.data.local.entities.TotpItemEntity
import com.clawstack.shellguard.totp.ui.theme.*
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddSecretScreen(
    onSaveSecret: (TotpItemEntity) -> Unit,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var title by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var secretKey by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var selectedAlgorithm by remember { mutableStateOf("SHA1") }
    var selectedPeriod by remember { mutableStateOf(30) }
    var selectedDigits by remember { mutableStateOf(6) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add 2FA Secret Manually", color = TextPearl, fontWeight = FontWeight.Bold, fontSize = 20.sp) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPearl)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AbyssalDeep)
            )
        },
        containerColor = AbyssalDeep
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Account / Service Name *") },
                placeholder = { Text("e.g. GitHub Corporate, AWS") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ClawCyan, unfocusedBorderColor = ShellBorder)
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Username or Email (Optional)") },
                placeholder = { Text("e.g. octocat@github.com") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ClawCyan, unfocusedBorderColor = ShellBorder)
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = secretKey,
                onValueChange = { secretKey = it },
                label = { Text("Base32 Secret Key *") },
                placeholder = { Text("JBSWY3DPEHPK3PXP") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ClawCyan, unfocusedBorderColor = ShellBorder)
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = category,
                onValueChange = { category = it },
                label = { Text("Pod / Category (Optional)") },
                placeholder = { Text("e.g. Work/Finance") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ClawCyan, unfocusedBorderColor = ShellBorder)
            )

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = {
                    val cleanSecret = secretKey.replace(" ", "").replace("-", "").uppercase()
                    val newItem = TotpItemEntity(
                        id = UUID.randomUUID().toString(),
                        ownerUuid = "local",
                        title = title.trim(),
                        username = username.trim().ifBlank { null },
                        category = category.trim().ifBlank { null },
                        secret = cleanSecret,
                        algorithm = selectedAlgorithm,
                        digits = selectedDigits,
                        period = selectedPeriod,
                        isLocalOnly = true,
                        syncState = "PENDING_SYNC"
                    )
                    onSaveSecret(newItem)
                },
                enabled = title.isNotBlank() && secretKey.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ClawCyan)
            ) {
                Icon(Icons.Default.Save, contentDescription = null, tint = AbyssalDeep, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Save 2FA Secret", color = AbyssalDeep, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}
```

---

### D. `AuthViewModel.kt` & `TotpListViewModel.kt`

```kotlin
package com.clawstack.shellguard.totp.ui.viewmodels

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.clawstack.shellguard.totp.crypto.AndroidKeyStoreHelper
import com.clawstack.shellguard.totp.data.backup.BackupManager
import com.clawstack.shellguard.totp.data.local.dao.TotpItemDao
import com.clawstack.shellguard.totp.data.local.entities.TotpItemEntity
import com.clawstack.shellguard.totp.data.repository.AuthRepository
import com.clawstack.shellguard.totp.data.repository.TotpRepository
import com.clawstack.shellguard.totp.engine.TotpTicker
import com.clawstack.shellguard.totp.engine.TotpTickerState
import com.clawstack.shellguard.totp.engine.TotpUriParser
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Authenticated(val userUuid: String, val rawKey: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {
    val isVaultHatched = MutableStateFlow(false) // Tracked in AppConfig Room table
    val authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val isBiometricAvailable = MutableStateFlow(true)
    val isBiometricEnabled = MutableStateFlow(false) // Default false until user explicitly enables
    val serverUrl = MutableStateFlow<String?>(null) // null = Standalone Offline Mode
    val userName = MutableStateFlow<String?>(null)

    fun hatchNewVault(masterSecret: String, useBiometrics: Boolean) {
        viewModelScope.launch {
            // 1. Initialize local SQLCipher DB with derived key from PIN / Master Password
            // 2. Set isVaultHatched = true and isBiometricEnabled = useBiometrics in AppConfig
            isVaultHatched.value = true
            isBiometricEnabled.value = useBiometrics
            authState.value = AuthState.Authenticated(userUuid = "local", rawKey = masterSecret)
        }
    }

    fun promptBiometrics(activity: FragmentActivity, savedIv: ByteArray? = null) {
        val executor = ContextCompat.getMainExecutor(activity)
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock ShellGuard Authenticator")
            .setSubtitle("Authenticate using your fingerprint or face")
            .setNegativeButtonText("Use PIN / Master Key")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build()

        val biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    authState.value = AuthState.Authenticated(userUuid = "local", rawKey = "biometric_unlocked")
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    // Allows fallback to PIN or Master Key without crashing
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                }
            }
        )

        try {
            if (savedIv != null) {
                val cipher = AndroidKeyStoreHelper.getBiometricCipher(Cipher.DECRYPT_MODE, savedIv)
                biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))
            } else {
                biometricPrompt.authenticate(promptInfo)
            }
        } catch (e: Exception) {
            biometricPrompt.authenticate(promptInfo)
        }
    }

    fun unlockWithMasterKey(rawKey: String) {
        viewModelScope.launch {
            authState.value = AuthState.Loading
            // Unlocks local SQLCipher cache using master key / PIN
            authState.value = AuthState.Authenticated(userUuid = "local", rawKey = rawKey)
        }
    }

    fun setBiometricEnabled(enabled: Boolean) {
        isBiometricEnabled.value = enabled
    }

    fun disconnectServer() {
        serverUrl.value = null
        userName.value = null
    }

    fun logout() {
        authState.value = AuthState.Idle
    }
}

class TotpListViewModel(
    private val totpItemDao: TotpItemDao,
    private val totpRepository: TotpRepository,
    private val backupManager: BackupManager
) : ViewModel() {
    val searchQuery = MutableStateFlow("")
    val selectedCategory = MutableStateFlow<String?>(null)
    val lastSyncTime = MutableStateFlow<String?>("Just now")

    val tickerFlow: StateFlow<TotpTickerState> = TotpTicker.observeTicker()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), TotpTickerState(System.currentTimeMillis(), 30, 1.0f))

    val itemsFlow: StateFlow<List<TotpItemEntity>> = searchQuery
        .flatMapLatest { query ->
            if (query.isBlank()) totpItemDao.observeAllTotpItems("local")
            else totpItemDao.searchTotpItems("local", query)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val offlineCodesCount: StateFlow<Int> = totpItemDao.observeAllTotpItems("local")
        .map { list -> list.count { it.isLocalOnly } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun addManualItem(item: TotpItemEntity) {
        viewModelScope.launch {
            totpItemDao.upsertItem(item)
        }
    }

    fun deleteItem(item: TotpItemEntity) {
        viewModelScope.launch {
            totpItemDao.deleteItem(item)
        }
    }

    fun filterOfflineCodesOnly() {
        selectedCategory.value = "📱 Local Only"
    }

    fun importScannedUri(rawUri: String) {
        viewModelScope.launch {
            val parsed = TotpUriParser.parse(rawUri) ?: return@launch
            val newItem = TotpItemEntity(
                id = UUID.randomUUID().toString(),
                ownerUuid = "local",
                title = parsed.title,
                username = parsed.username,
                category = parsed.issuer,
                secret = parsed.secret,
                algorithm = parsed.algorithm,
                digits = parsed.digits,
                period = parsed.period,
                isLocalOnly = true,
                syncState = "PENDING_SYNC"
            )
            totpItemDao.upsertItem(newItem)
        }
    }

    fun exportBackup() {
        // Launches JSON export via BackupManager
    }

    fun importBackup() {
        // Launches JSON import via BackupManager
    }

    fun syncRemoteVault() {
        // Triggers delta sync via TotpRepository
    }
}
```

---

### E. Interactive Spotlight Guided Tour (`SpotlightOverlay.kt`)

Dims and blurs the screen while cutting out a spotlight over targeted UI components (Settings icon / Connect button), providing an intuitive tour with a centered "Skip" button:

```kotlin
package com.clawstack.shellguard.totp.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.clawstack.shellguard.totp.ui.theme.*

@Composable
fun SpotlightOverlay(
    targetRect: Rect?,
    title: String,
    description: String,
    onTargetClick: () -> Unit,
    onSkipClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (targetRect == null) return

    Box(
        modifier = modifier
            .fillMaxSize()
            // Block touches to underlying UI while allowing tap on the cutout
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = {}
            )
    ) {
        // ── 1. Punched-Out Scrim Canvas ─────────────────────────
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer(alpha = 0.99f) // Required for BlendMode.Clear
        ) {
            // Dark abyssal backdrop
            drawRect(color = Color(0xE6030712))

            // Punch out clear circle around the target component
            val center = targetRect.center
            val radius = (targetRect.maxDimension / 2f) + 16.dp.toPx()
            drawCircle(
                color = Color.Transparent,
                radius = radius,
                center = center,
                blendMode = BlendMode.Clear
            )
        }

        // ── 2. Clickable Transparent Hitbox over Target ─────────
        Box(
            modifier = Modifier
                .offset(
                    x = (targetRect.left - 16).dp,
                    y = (targetRect.top - 16).dp
                )
                .size((targetRect.width + 32).dp, (targetRect.height + 32).dp)
                .clickable(onClick = onTargetClick)
        )

        // ── 3. Centered Tooltip Pill & Skip Button ───────────────
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = ShellSurfaceElevated),
                border = BorderStroke(1.5.dp, ClawCyan)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.CloudSync,
                        contentDescription = null,
                        tint = ClawCyan,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = title,
                        color = TextPearl,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = description,
                        color = TextMuted,
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Centered Skip Button
            OutlinedButton(
                onClick = onSkipClick,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, TextMuted.copy(alpha = 0.5f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPearl)
            ) {
                Text("Skip Tutorial", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
```


