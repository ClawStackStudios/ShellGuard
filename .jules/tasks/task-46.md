# Task 46: Bitwarden-Model Dashboard — Add-Menu Correction & Type-Truthful Display

> **Milestone**: Stage 24 / Phase 23 (Task 46 of 52)
> **Domain**: Frontend UI Architecture, Dashboard List Stream & Form Ergonomics
> **Target Branch**: `stage/phase-23-item-integrity`
> **Attribution**: Conventional Commits with Two-Layer Attribution (`User:` / `AI:`)

---

## 🎯 Objective & Architectural Seam

Make the user interface tell the item-model truth in strict alignment with the Bitwarden architecture:

1. **Header Add-Menu Correction**:
   - In `src/components/Layout/Header.tsx`, remove `'attachment'` from the `+` add-item dropdown list.
   - The add menu must offer only primary creatable vault items:
     - 🔑 Password (`password`)
     - 💳 Credit Card (`card`)
     - 🪪 Identity (`identity`)
     - 📝 Secure Note (`note`)
     - 🗝 SSH Key (`key`)
2. **ItemFormModal & Attachment Upload Flow**:
   - Remove standalone attachment handling (`type === 'attachment'`) in `src/components/Vault/ItemFormModal.tsx`.
   - Attachments enter exclusively via the attachment section attached to a parent item.
   - In `src/App.tsx`, remove standalone attachment creation (lines 593–614). Ensure `uploadAttachmentRecord` passes `parentId` and `parentType` across all primary item creation and editing handlers.
3. **Deterministic Type-Aware Sorting**:
   - In `src/components/Vault/VaultShell.tsx` (and `ItemListPane.tsx`), when `activeTypeFilter === "all"`, sort items deterministically:
     1. Type Order: Passwords (`password`) → Credit Cards (`card`) → Identities (`identity`) → Secure Notes (`note`) → SSH Keys (`key`).
     2. Recency within Type: `new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()`.
4. **Contextual Filter Empty States**:
   - In `src/components/Vault/ItemListPane.tsx`, render empty state copy tailored to the active filter:
     - `"all"`: `"No items found"`
     - `"password"`: `"No passwords found"`
     - `"card"`: `"No credit cards found"`
     - `"identity"`: `"No identities found"`
     - `"note"`: `"No secure notes found"`
     - `"key"`: `"No SSH keys found"`
5. **Detail Pane Guarantee**:
   - In `src/components/Vault/ItemDetailPane.tsx`, verify attachments continue to render only inside their parent's detail pane with download and preview actions.

---

## 📁 Files in Scope

- `src/components/Layout/Header.tsx`
- `src/components/Vault/ItemFormModal.tsx`
- `src/components/Vault/ItemListPane.tsx`
- `src/components/Vault/VaultShell.tsx`
- `src/App.tsx`
- `src/lib/attachmentUtils.ts` (if uploadAttachmentRecord options need updating)
- `tests/unit/itemSorting.test.ts` (new or updated unit tests verifying type-aware sorting)

---

## 🔒 Invariants & Acceptance Criteria

1. **No Standalone Attachment Surfaces**:
   - The `+` dropdown in `Header.tsx` contains NO "📎 Attachment" option.
   - No form surface allows creating an attachment without a parent item.
2. **Deterministic Type Ordering**:
   - When viewing "All Items", items group by type in the defined hierarchy (Passwords → Cards → Identities → Notes → Keys), with newest items first within each group.
3. **Type-Specific Empty States**:
   - Selecting a type filter with 0 items displays the appropriate empty state title and icon.
4. **Modularity & Granularity Limits**:
   - Components must not exceed project file-length ceilings (~250-line target, 500-line ceiling).
5. **Verification**:
   - `npm run lint` (`tsc --noEmit`) passes with zero errors.
   - `npm run build` succeeds cleanly.
   - `npm test` runs 100% green.
