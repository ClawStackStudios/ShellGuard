# Unraid Community Applications

<CopyPage />

ShellGuard ships with an official Unraid Community Applications XML template ([`shellguard-unraid-template.xml`](file:///config/Documents/workspace-lucas/projects/Agents/ShellGuard/shellguard-unraid-template.xml)).

---

## 🚀 Setup Steps on Unraid

1. Place the XML template inside `/boot/config/plugins/dockerMan/templates-user/`.
2. In the Unraid WebUI, go to **Docker &rarr; Add Container** and select **ShellGuard**.
3. Configure the fields:
   - **Host Port**: `6464`
   - **Appdata Path**: `/mnt/user/appdata/shellguard` &rarr; mapped to `/app/data`
   - **PUID**: `99` (nobody)
   - **PGID**: `100` (users)
   - **DB_ENCRYPTION_KEY**: Enter a 256-bit base64 key generated with `openssl rand -base64 32`.
   - **ADMIN_TOKEN**: Enter your SuperLobster administrative token.
4. Click **Apply**.
