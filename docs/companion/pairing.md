# The Reef Handshake & Visual Mobile Pairing

Pairing a mobile device to your ShellGuard instance securely shouldn't require manually entering long IP addresses, ports, or certificate fingerprints on a touchscreen. ShellGuard introduces **The Reef Handshake**, a zero-touch onboarding protocol.

## How It Works

From the SuperLobster control panel, administrators can access the **Transport & Mobile Pairing** tab to reveal a QR code.

When you open ShellGuard Mobile and tap "Scan QR":
1. The app decodes the `shellguard://pair` URI containing the server's endpoints, TLS fingerprint, and Instance Identity Anchor.
2. The client reaches out to the server and verifies the connection matches the expected TLS fingerprint.
3. The server's identity is pinned cryptographically on the device using the Instance Identity Anchor.

## Auto-Healing Trust

If the server administrator regenerates the TLS certificate, the server produces a signed **Rotation Manifest** (`manifest.json`) using its immutable `instance.key`.

When the mobile app encounters an untrusted certificate, it retrieves the public manifest. If the manifest signature matches the pinned Instance Identity Anchor, the mobile app automatically updates its trusted fingerprint—seamlessly auto-healing the connection without requiring the user to re-scan a QR code.
