# SuperLobster Control Plane Overview

<CopyPage />

The **SuperLobster Panel** is the token-gated administrative plane for ShellGuard instance operators, accessible at the dedicated route **`/superlobster`**.

---

## 🦞 Architectural Heritage

The SuperLobster design is derived from a clean-room synthesis of the **Vaultwarden** admin model and **ClawChives** SuperAdmin architecture, hardened specifically for a zero-knowledge secrets vault:

| Project | Admin Model | Hardened Properties in ShellGuard |
|---|---|---|
| **Vaultwarden** | `/admin` (Argon2id / Token) | Online Backup API snapshots, offline file-swap restoration |
| **ClawChives** | `/admin` (Volatile in-memory sessions) | Ephemeral `sg_admin_session` cookie (20-min sliding expiry), cascade user deletions |
| **ShellGuard** | `/superlobster` (**SuperLobster Panel**) | **Strict metadata responses**, **no backup download endpoint**, **no HTTP restore endpoint** |

---

## 🔒 Security Hardening Invariants

1. **Zero Password Access**: Even the instance administrator cannot read user passwords, notes, or private keys.
2. **Strict Metadata Only**: Admin user listings return only UUIDs, usernames, item counts, and timestamps. Titles like *"My Swiss Bank"* are never visible.
3. **No Web-Based Backup Download**: Backups are written server-side to `DATA_DIR/backups/`. No HTTP download route exists, preventing credential exfiltration.
4. **Offline Restorations**: Restorations are performed offline at the shell level.

---

## SuperLobster Sub-Sections

<CardGrid cols="3">
  <Card title="Lobster Management" href="/superlobster/management" icon="👥">
    User table, storage counts, and atomic cascade deletions.
  </Card>
  <Card title="Backups Engine" href="/superlobster/backups" icon="💾">
    Automated SQLite Online Backup API snapshots and rotation.
  </Card>
  <Card title="Offline Restoration" href="/superlobster/restoration" icon="🔄">
    Step-by-step procedure using the scuttle:restore validator.
  </Card>
</CardGrid>
