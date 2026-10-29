# 02.01 — Vault Workspace: Master-Detail Shell, Pod Tree & Search

[`VaultShell.tsx`](../../../../../src/components/vault/VaultShell.tsx) orchestrates the three-pane Bitwarden-style master-detail workspace (`SidebarFolderTree.tsx` → `ItemListPane.tsx` → `ItemDetailPane.tsx`). All folder ("Pod") state obeys the **Zero Hardcoded Pods Invariant**: `DEFAULT_ROOT_PODS = []` and `INITIAL_DEFAULT_COLORS = {}` in [`podUtils.ts`](../../../../../src/lib/podUtils.ts)—pods exist strictly when created by the user or harvested from item categories, normalized through `normalizePod()`, with sub-pod hierarchy matched via `targetPod + "/"` prefix semantics. Deleting a pod cascades its items cleanly to uncategorized (`""`) via optimistic local state updates backed by `PUT` syncs.

Discovery across the active vault combines [`vaultSearch.ts`](../../../../../src/lib/vaultSearch.ts) (searching decrypted titles, usernames, URLs, secondary `uris`, notes, custom field values, and tags in client memory) with the collapsible **Tags Reef** and **Granular Filter Bar** (`AND` / `OR` boolean tag logic, active bioluminescent tag chips, and live item counts). Multi-select checkboxes in `ItemListPane.tsx` activate the floating batch action bar supporting owner-scoped bulk deletion (`DELETE /api/vault/bulk`, cascading linked attachments) and batch category/tag reassignment.

---

## Component & Spec Oracles

- **UI Surfaces**: `src/components/vault/VaultShell.tsx`, `src/components/vault/SidebarFolderTree.tsx`, `src/components/vault/ItemListPane.tsx`
- **Client Libraries**: `src/lib/podUtils.ts`, `src/lib/vaultSearch.ts`
- **Deep Specs**:
  - [Reef Modernist UI & Design System (§5 Master-Detail & Pod Invariants, §8 Vault Tagging)](../../../specs/ui/ui-ux-design-system.md)
  - [Routes & API Contracts (§3 Vault Domain Endpoints & Batch Operations)](../../../specs/network/routes-and-contracts.md)
- **Verification Oracles**: `tests/vault-crud.test.ts`, `tests/unit/podUtils.test.ts`, `tests/unit/vaultSearch.test.ts`
