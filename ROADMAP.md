# 🦞 ShellGuard©™ Roadmap

## 🐚 Current Molt (MVP)
- [x] ClawKeys©™ Auth (hu-, api-)
- [x] Vault CRUD (Pearls)
- [x] Lobster Key Management (lb-)
- [x] Ocean Dark Theme
- [x] Develop the Minimum Viable Product (MVP) functionality for ShellGuard. This should include basic threat detection and reporting capabilities. Ensure all user-facing elements and outputs are styled according to the 'lobsterized' aesthetic.
- [x] Design and implement the core UI components for the ShellGuard MVP, ensuring they adhere to the 'lobsterized' visual philosophy of ClawStackStudios. This includes defining color palettes, typography, button styles, and overall layout that evokes a playful, nautical, and distinctive feel.
- [x] Create and integrate a mascot or distinct branding elements for ShellGuard that are fully aligned with the 'lobsterized' philosophy. This could include splash screens, loading indicators, or notification icons featuring a character or motif inspired by ClawStackStudios' style.


## Phase 1:
- [x] Add an 'Export to CSV' button in the vault settings that allows users to export their unencrypted metadata (title, category, type) for backup purposes.

- [x] Implement an inactivity timer that automatically locks the vault and redirects the user to the login screen after [Configurable] minutes/seconds of inactivity.

- [x] Provide both the export function and inactivity function settings in the settings menu under new section, separating from the identity details. 

- [x] Add a category filter dropdown to the PasswordVaultView that allows users to toggle between 'Personal', 'Work', or 'Custom' category tags for their stored items.

## Phase 2:
- [x] Implement a feature to export decrypted vault items (logins, notes, keys) as a protected JSON file for user local backups, including a prompt for user confirmation before initiating the download.
Create this feature in the Settings, and give the settings menu a consistent sidebar with the dashboard, but put a 'Dashboard' button right below the 'Profile' sidebar entry in the settings menu. to allow users to export their decrypted vault items into a secure JSON file for local backup purposes, requiring a final re-authentication of their ShellKey©™.
* The settings menu should change dynamically to only display 'Profile' at the top part of the sidebar, and change the settings gear button to a 'Back To Dashboard' button above the 'Logout' button (use 4 square grid icon). Making the settings menu distinct from the dashboard. 

- [x] Add a 'Quick Actions' icon button to the list view of all vault items, allowing users to select actions like 'Copy Username' or 'Copy Password' values directly to the clipboard without needing to open the detail editor.

- [x] Integrate Framer Motion layout animations for the vault items grid so that cards smoothly reorder and animate when being added, deleted, or filtered.

## Phase 3:
- [ ] Animate the 'Auto-Lock Now' button in user profile settings to provide a visual 'locking' effect (like a latch closing) when clicked, confirming the vault is secured.

- [ ] Implement the idle timeout timer in the settings menu, that triggers the logout functionality if no interaction is detected in the browser for a configurable amount of time (e.g., 5, 15, or 30 minutes).

- [ ] Implement a cryptographically secure random password generator within the 'Logins' creation form, allowing users to customize length and character sets (uppercase, lowercase, numbers, symbols) before saving.

- [ ] Implement a tagging system for vault items. Add a field to the item schema, allow users to add/remove tags in the edit view, and add a sidebar filter section to display items by specific tags.

## Phase 4:
- [ ] Implement star, pin, and archive sidebar entries under the passwords entry in the sidebar. Add a main 'Dashboard' entry at the top of the sidebar list, so it is the first entry to go back to the dashboard.

- [ ] In the VaultView component, add functionality to select multiple items using checkboxes and then delete them in a single operation. Include a confirmation dialog before proceeding with the bulk deletion.

- [ ] Implement a feature that automatically logs the user out after a period of inactivity (e.g., 15 minutes). This should be tied to user interactions within the application.
Modify the Agent creation form to allow for custom permissions (READ, WRITE, DELETE) beyond the default. The UI should present checkboxes for each permission type. Update the backend to store and validate these custom permissions.

---

# DO NOT IMPLEMENT WITHOUT PLANNING 

## 🌊 Future Molts
Implement the user onboarding flow for ShellGuard that introduces the application's core features. Integrate the ClawStackStudios 'lobsterized' theme throughout the onboarding process, making it engaging and on-brand.
- [ ] Modify the Agent creation form to allow for custom permissions (READ, WRITE, DELETE) beyond the default. The UI should present checkboxes for each permission type. Update the backend to store and validate these custom permissions.
- [ ] Implement the user onboarding flow for ShellGuard that introduces the application's core features. Integrate the ClawStackStudios 'lobsterized' theme throughout the onboarding process, making it engaging and on-brand.
- [ ] Modify the Agent creation form to allow for custom permissions (READ, WRITE, DELETE) beyond the default. The UI should present checkboxes for each permission type. Update the backend to store and validate these custom permissions.
- [ ] Apply the 'lobsterized' visual design philosophy of ClawStackStudios to the ShellGuard MVP. This includes color schemes, typography, and overall aesthetic, making the UI distinctively lobster-themed.
- [ ] **ShellCryption©™ v2:** AES-256-GCM hardware-backed encryption.
- [ ] **Audit Reef:** Detailed logs of every agent access.
- [ ] **Mobile Shell:** React Native companion app.
- [ ] **P2P Sync:** Synchronize vaults across multiple reefs without a central server.
- [ ] **Biometric Claws:** FaceID/TouchID unlock for mobile shells.

Maintained by CrustAgent©™


# DEVELOPMENT IDEAS DO NOT IMPLEMENT 

Design the Minimum Viable Product (MVP) for ShellGuard, adhering strictly to the 'lobsterized' visual design philosophy of ClawStackStudios. Focus on creating the core user interface elements that define this aesthetic, including color palettes, typography, button styles, and overall layout, ensuring a cohesive and distinctive look and feel.

Build out the initial set of core features for ShellGuard, ensuring each feature's UI and user experience are deeply infused with the 'lobsterized' design language. Consider features that can be creatively re-imagined through the ClawStackStudios lens, such as user authentication, dashboard widgets, or notification systems, all while maintaining the lobster theme.