# Transport Control Plane & Mobile Pairing

The **Transport & Mobile Pairing Hub** is a section within the SuperLobster control panel designed to provide visibility into transport security and facilitate zero-touch onboarding for mobile devices.

## Status Overview

The hub provides real-time indicators of your current connection:
- 🟢 **Active HTTPS (TLS 1.3)**: Indicates that TLS is enabled.
- 🟡 **Cleartext HTTP (LAN Only)**: Warns that `TLS_ENABLED` is false, and metadata is visible over the network.
- **Fingerprint Pill**: Displays the SHA-256 fingerprint of the active leaf certificate.

## The Reef Handshake QR Pairing Card

To simplify mobile onboarding, the panel generates a dynamic vector SVG QR Code containing a `shellguard://pair` URI.

The URI embeds:
- LAN and Tailscale reachability vectors.
- The active certificate fingerprint.
- The public Instance Identity Anchor (Public Key).

Users can scan this QR code directly from the ShellGuard Mobile app to seamlessly pair their device and establish a pinned trust relationship without manually typing IP addresses or certificate hashes.

## Certificate Actions

The toolbar allows administrators to:
- **Download Certificate (.pem)**: Export the public certificate to install in system trust stores.
- **Regenerate Self-Signed Cert**: Generate a new leaf certificate and rotation manifest. Mobile clients will seamlessly update their pinned certificate using the signed rotation manifest.
