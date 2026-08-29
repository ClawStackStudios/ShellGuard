import React, { useState, useMemo } from 'react';
import { VaultItem, VaultItemType } from '../../types.ts';
import { ItemListPane } from './ItemListPane.tsx';
import { ItemDetailPane } from './ItemDetailPane.tsx';
import { isItemInPod } from '../../lib/podUtils.ts';

interface VaultShellProps {
  items: VaultItem[];
  selectedFolder: string;
  activeTypeFilter: VaultItemType | "all";
  isLocked: boolean;
  onAdd: (type?: VaultItemType) => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
}

export function VaultShell({
  items,
  selectedFolder,
  activeTypeFilter,
  isLocked,
  onAdd,
  onEdit,
  onDelete
}: VaultShellProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items.filter(i => {
      const type = i.type || "password";
      // Exclude attachments from list
      if (type === "attachment") return false;
      // Filter by type
      if (activeTypeFilter !== "all" && type !== activeTypeFilter) return false;
      // Filter by pod
      if (!isItemInPod(i.category, selectedFolder)) return false;
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        (i.title || "").toLowerCase().includes(q) ||
        (i.username || "").toLowerCase().includes(q) ||
        (i.url || "").toLowerCase().includes(q)
      );
    }

    // Sort by recency (created_at desc)
    result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return result;
  }, [items, activeTypeFilter, selectedFolder, searchQuery]);

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const attachmentItemsById = useMemo(() => {
    const map = new Map<string, VaultItem>();
    items.forEach(i => {
      if (i.type === "attachment") {
        map.set(i.id, i);
      }
    });
    return map;
  }, [items]);

  return (
    <div className="h-full w-full flex flex-col lg:flex-row bg-theme-base overflow-hidden">
      {/* Left List Pane */}
      <div className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 h-full">
        <ItemListPane 
          items={filteredItems}
          selectedItemId={selectedItemId}
          onSelectItem={(id) => setSelectedItemId(id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTypeFilter={activeTypeFilter}
        />
      </div>

      {/* Right Detail Pane */}
      <div className="flex-1 min-w-0 h-full">
        <ItemDetailPane
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onEdit={onEdit}
          onDelete={onDelete}
          isLocked={isLocked}
          attachmentItemsById={attachmentItemsById}
        />
      </div>
    </div>
  );
}
