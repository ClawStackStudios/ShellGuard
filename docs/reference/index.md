---
title: Technical Reference Overview
description: Ground-Truth Specifications, Database Schemas, Design Systems, and Glossaries
---

# 📚 Technical Reference Overview

<CopyPage />

The **Technical Reference** section provides ground-truth specifications, data models, design tokens, and compliance documentation for developers, system administrators, and security auditors interacting with the ShellGuard ecosystem.

---

## 🧭 Reference Guides

<CardGrid cols="2">
  <Card title="Database Schema Ground Truth" href="/reference/blueprint-schema" icon="🗄️" tag="Database">
    Complete SQLite schema definitions for <code>lobsters</code>, <code>vault_pearls</code>, <code>agent_keys</code>, attachments, and audit tables.
  </Card>
  <Card title="Reef Modernist Design System" href="/reference/design-system" icon="🎨" tag="Design">
    Design philosophy, bioluminescent color tokens, dynamic theme palettes, typography, and motion physics.
  </Card>
  <Card title="ClawStack Lexicon (Glossary)" href="/reference/glossary" icon="📖" tag="Terminology">
    Authoritative definitions for all ecosystem terminology: Pearls, Pods, Lobsters, LobsterKeys, and ShellCryption.
  </Card>
  <Card title="ShellGuard-TOTP Companion" href="/companion/" icon="📱" tag="Mobile">
    Complete architecture, security, backup, and RFC 6238 TOTP engine specifications for the native Android companion.
  </Card>
  <Card title="Official Privacy Policy" href="/privacy" icon="⚖️" tag="Compliance">
    Comprehensive legal and regulatory disclosures, Google Play Store compliance, and zero-telemetry guarantees.
  </Card>
</CardGrid>

---

## 🔒 Architectural Invariants at a Glance

| Invariant | Implementation | Boundary |
| :--- | :--- | :--- |
| **Zero-Knowledge Core** | Client-side HKDF-SHA256 + AES-GCM-256 with AAD binding | Plaintext keys and secrets never leave the user's browser or device. |
| **Three Secrets Model** | `hu-` (Human Key), `lb-` (LobsterKey), `SENSITIVE_KEY` (Server Master) | Strict operational segregation between humans, AI agents, and server storage. |
| **Triple-Layer Defense** | Layer 1: Client ShellCryption<br/>Layer 2: Metadata AES-256-GCM<br/>Layer 3: SQLCipher Whole-DB | Defense-in-depth against physical database theft and server-side compromise. |
| **Forensic Segregation** | Append-only `audit.sqlite` separate from `db.sqlite` | Audit logs cannot be modified, deleted, or wiped by database restores. |
| **Offline-First Companion**| Hardware KeyStore + StrongBox enclave on Android | Generates 2FA codes 100% offline without network requests or external tracking. |
