# First-Class HTTPS & Built-in TLS Engine

ShellGuard includes a built-in TLS engine to provide transport security out of the box, ensuring that metadata is encrypted on the local network (LAN).

## The Transport Engine

When `TLS_ENABLED=true`, ShellGuard automatically generates a persistent, 10-year EC P-256 self-signed certificate upon first boot.
- This certificate is stored in `DATA_DIR/certs/`.
- It includes Subject Alternative Names (SANs) for `localhost` and all detected non-internal network interfaces.
- The same certificate is reused across restarts, allowing operators to pin trust (Trust on First Use - TOFU) in their browser without recurring warnings.

## Custom Certificates

If you prefer to bring your own certificates, you can provide them via environment variables:
- `TLS_CERT_PATH`: Path to the certificate file (`.pem` or `.crt`).
- `TLS_KEY_PATH`: Path to the private key file (`.key` or `.pem`).

When both variables are set, ShellGuard bypasses self-signed generation and uses the provided materials.

## Epistemic Notes
While the TLS layer protects metadata and transit, the core security boundary in ShellGuard remains **ShellCryption** (client-side encryption). TLS serves as transport armor, not the root of trust.
