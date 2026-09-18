# REST API Reference Matrix

<CopyPage />

All ShellGuard endpoints return standard `{ success: boolean, data?: any, error?: string }` JSON response envelopes.

---

## 🧭 Endpoint Matrix

### 1. Authentication
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register new identity (`keyHash`, `username`) |
| `POST` | `/api/auth/token` | None | Exchange key hash for session Bearer token |
| `GET` | `/api/auth/validate` | Bearer Token | Validate current session token |
| `POST` | `/api/auth/logout` | Bearer Token | Invalidate current session token |
| `GET` | `/api/auth/me` | Bearer Token | Get current authenticated lobster identity |

---

### 2. Vault Pearls (Logins)
| Method | Path | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/vault` | `canRead` | List all vault pearls for owner |
| `POST` | `/api/vault` | `canWrite` | Create a new vault pearl |
| `PUT` | `/api/vault/:id` | `canEdit` | Update an existing pearl |
| `DELETE` | `/api/vault/:id` | `canDelete` | Delete pearl (cascades linked attachments) |

---

### 3. Secure Notes & SSH Keys
| Method | Path | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/notes` | `canRead` | List all secure notes |
| `POST` | `/api/notes` | `canWrite` | Create a secure note |
| `GET` | `/api/ssh-keys` | `canRead` | List all SSH keys |
| `POST` | `/api/ssh-keys` | `canWrite` | Create an SSH key |

---

### 4. Attachments (Reference Model — Phase 19 BLOB contract)
| Method | Path | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/attachments` | `canRead` | List attachment metadata only (payload BLOB never included) |
| `GET` | `/api/attachments/:id/file` | `canRead` | Stream the ciphertext BLOB (`application/octet-stream`, 1MB chunks) |
| `POST` | `/api/attachments` | `canWrite` | Multipart upload of the client-encrypted ShellCryption envelope (50 MB/file ceiling, 500 MB grotto quota per owner — `413` on breach) |
| `PUT` | `/api/attachments/:id` | `canEdit` | Metadata-only update (file replacement re-uploads) |
| `DELETE` | `/api/attachments/:id`| `canDelete` | Delete an attachment record (frees grotto quota) |

---

### 5. Health & Skill Blueprint
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | System status, database health, version |
| `GET` | `/skill.md` | None | Canonical AI agent integration skill file |
