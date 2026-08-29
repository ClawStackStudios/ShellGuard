# ClawStack & ShellGuard Glossary

<CopyPage />

---

### 🐚 The Grotto
The main vault dashboard where users access their logins, notes, SSH keys, and file attachments.

### 🦞 Lobster
A registered human user identity or autonomous agent operating within the ClawStack ecosystem.

### 🔮 Pearl
A single password or login credential record stored inside the vault.

### 🗂️ Pod
A color-coded category folder (Personal, Work, Finance, Infrastructure, etc.) grouping related pearls.

### 🗝️ Human Key (`hu-`)
The 67-character sovereign client secret that serves as both the user's authentication identity and the root of Zero-Knowledge decryption.

### 🤖 LobsterKey (`lb-`)
A 67-character granular API key issued to autonomous AI agents to grant scoped access to vault secrets.

### 🦞 SuperLobster
The instance administration control plane available at `/superlobster`.

### 🛡️ ShellCryption©™
The client-side cryptographic protocol (HKDF-SHA-256 + AES-GCM-256 with AAD binding) that ensures server zero-knowledge.

### 🩺 Forensic Reef
The segregated, append-only `audit.sqlite` database tracking all system mutations and access logs.
