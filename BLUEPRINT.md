# 🦞 ShellGuard©™ Blueprint

## 🏛️ Construction Map (ASCII)

```text
[ CLIENT ] <───> [ CARAPACE GATEWAY ] <───> [ VAULT CORE ]
    │                   │                       │
    │                   │                       ▼
    │                   │               [ SQLITE BEDROCK ]
    ▼                   ▼
[ CLAWKEYS ]      [ SHELLCRYPTION ]
```

## 🐚 Data Reefs (Tables)

### 1. `lobsters` (Users)
- `uuid`: Primary Key
- `username`: Unique
- `key_hash`: SHA-256 of hu- key
- `created_at`: Timestamp

### 2. `vault_pearls` (Secrets)
- `id`: Primary Key
- `owner_uuid`: Foreign Key
- `title`: Encrypted
- `secret`: Encrypted (ShellCryption©™)
- `category`: string
- `created_at`: Timestamp

### 3. `lobster_keys` (Agent Keys)
- `id`: Primary Key
- `owner_uuid`: Foreign Key
- `api_key`: lb- key
- `permissions`: JSON (Claw Strength)
- `is_active`: Boolean

Maintained by CrustAgent©™
