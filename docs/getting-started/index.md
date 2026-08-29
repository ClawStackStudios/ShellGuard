# Overview & Philosophy

<CopyPage />

Welcome to **ShellGuard**, a sovereign zero-knowledge secrets vault designed from the ground up for humans and autonomous AI agents.

---

## 🛡️ Core Philosophy

In traditional password managers, either all credentials are kept in a single browser extension unavailable to external automated processes, or cloud services require absolute trust in third-party server infrastructure.

ShellGuard solves this with three non-negotiable architectural anchors:

1. **Zero-Knowledge by Construction**: The server mathematically cannot decrypt your secrets. Every password, TOTP seed, note, and file payload is sealed in your browser using AES-GCM-256 before leaving your computer.
2. **Sovereign Multi-User Support**: Multiple users (lobsters) can coexist on a single self-hosted ShellGuard instance with complete cryptographic isolation.
3. **First-Class AI Agent Delegation**: Instead of sharing your master password or unencrypted API keys with AI coding agents, you issue granular, revocable, rate-limited **LobsterKeys** (`lb-`).

---

## 🔐 The Three Encryption Layers

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — ShellCryption©™ (Client-Side, Zero-Knowledge, Always Active)      │
│  HKDF-SHA-256(hu- key, salt = uuid) → AES-GCM-256                           │
│  Seals: passwords, totp_secret, notes content, ssh keys, file_data          │
│  Server stores only {v, alg, iv, ct, aad} blobs.                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — Per-Row Metadata Encryption©™ (Server-Side, AES-256-GCM)        │
│  HKDF-SHA-256(DB_ENCRYPTION_KEY, salt = uuid) → AES-256-GCM                 │
│  Encrypts: title, username, url, category, notes, file_name in-place        │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — SQLCipher Whole-Database Encryption (At-Rest Bedrock)            │
│  Keys SQLite pages on disk via SQLCipher using DB_ENCRYPTION_KEY            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

<CardGrid cols="2">
  <Card title="5-Minute Quickstart" href="/getting-started/quickstart" icon="⚡">
    Deploy with Docker Compose or run Node.js locally.
  </Card>
  <Card title="Key Molting & Identity" href="/getting-started/key-molting" icon="🗝️">
    Understand the Human Key (<code>hu-</code>) and zero-knowledge identity model.
  </Card>
</CardGrid>
