# Task 52: "Config" Settings Surface, Ephemeral Import Badges & Rapid Batch Purge

> **Milestone**: Stage 27 / Phase 26 (Task 52 of 52) — **ACTIVE**  
> **Domain**: Progressive Disclosure UI, Retention Configuration, Bioluminescent Chips & Batch Rollback Modal  
> **Target Branch**: `stage/phase-26-import-lifecycle`  
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User:` / `AI:`)  

---

## 🎯 Objective & Architectural Seam

Deliver the frontend progressive disclosure and configuration surfaces:

1. **The Progressive Disclosure Invariant**:
   - The UI MUST be 100% silent and clean with **ZERO** import-related filter chips, countdown banners, or action hatches rendered UNLESS active items with unexpired `imported_at` flags exist in state.

2. **New "Config" Settings Surface (`ConfigSettingsView.tsx`)**:
   - Add a "Config" tab to `src/components/Sidebar.tsx` under settings mode.
   - Author `src/components/Settings/ConfigSettingsView.tsx` with:
     - Reef Modernist segmented button selector for Import Retention Window: `[30 min | 60 min | 90 min | Manual / Never]`.
     - Toggle switch for "Auto-Graduate on Edit" (defaults to ON).
     - Persist preferences locally (in vault settings or localStorage encrypted under active session).

3. **Dynamic "Imported" Filter & Bioluminescent Badges**:
   - In `src/components/Vault/ItemListPane.tsx`:
     - Dynamically render an "Imported" filter chip when unexpired imported items exist, displaying active count and live countdown (`📥 Imported (42) • 58m left`).
     - In the item list, render a pulsing bioluminescent badge (`📥 Imported`) with inline "Graduate" and "Delete" quick buttons.
   - In `src/components/Vault/ItemDetailPane.tsx`:
     - Render an ephemeral status card displaying remaining time, batch identifier, "Graduate to Vault", and "Remove Item".

4. **Post-Import Action Hatch & Rapid Batch Purge**:
   - In `src/components/Settings/ImportExportView.tsx`:
     - Upon successful import, render an instant Action Hatch: "Review Items", live countdown, "Graduate All", and "Revert Import".
     - Clicking "Revert Import" triggers `DELETE /api/vault/import-batches/:id` guarded by the Reef Modernist `ConfirmDialog` (zero native browser `confirm()`).
   - In `src/components/Vault/VaultShell.tsx`:
     - Mount a floating action bar when filtering by imported items with tri-state selection for bulk graduation or purge.
     - ⚠️ **ADJACENCY INVARIANT**: Ensure the floating action bar does not collide with or obscure the floating `AbyssalIngestionDock` in the bottom-right viewport.

5. **Documentation & Manifest Alignment**:
   - Update `docs/vault-features/import-export.md` (import lifecycle & TTL).
   - Update `docs/vault-features/the-grotto.md` (progressive disclosure & Config settings).
   - Update `ARCHITECTURE.md` (Delta #31: Import Lifecycle Ledger).
   - Update `CHANGELOG.md` (`[Unreleased]`).

---

## 📁 Files in Scope

- `src/components/Sidebar.tsx`
- `src/components/Settings/ConfigSettingsView.tsx` (New)
- `src/components/Vault/ItemListPane.tsx`
- `src/components/Vault/ItemDetailPane.tsx`
- `src/components/Settings/ImportExportView.tsx`
- `src/components/Vault/VaultShell.tsx`
- `docs/vault-features/import-export.md`
- `docs/vault-features/the-grotto.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`

---

## 🔒 Invariants & Acceptance Criteria

1. **Progressive Disclosure**: Zero import badges/filters visible when 0 active imported items exist.
2. **Ergonomic Safety**: "Revert Import" and "Delete Batch" always guarded by Reef Modernist `ConfirmDialog`.
3. **No Dock Collision**: Floating batch bar does not collide with `AbyssalIngestionDock`.
4. **Build & Lint**: `npm run lint` and `npm run docs:build` pass 100% green.
