import React, { useState, useMemo } from 'react';
import { VaultItem, VaultItemType } from '../../types.ts';
import { ItemListPane } from './ItemListPane.tsx';
import { ItemDetailPane } from './ItemDetailPane.tsx';
import { isItemInPod } from '../../lib/podUtils.ts';
import { filterItemsByTags } from '../../lib/tagUtils.ts';

interface VaultShellProps {
  items: VaultItem[];
  selectedFolder: string;
  activeTypeFilter: VaultItemType | "all";
  isLocked: boolean;
  selectedTags?: string[];
  onToggleTag?: (tagName: string) => void;
  onClearTags?: () => void;
  /** Phase 19: streams + decrypts an attachment payload on demand. */
  onFetchAttachment?: (id: string) => Promise<string>;
  onAdd: (type?: VaultItemType) => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
  onBulkMoveToPod?: (ids: string[], category: string) => void;
  onBulkAssignTags?: (ids: string[], tags: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export function VaultShell({
  items,
  selectedFolder,
  activeTypeFilter,
  isLocked,
  selectedTags = [],
  onToggleTag,
  onClearTags,
  onFetchAttachment,
  onAdd,
  onEdit,
  onDelete,
  onBulkMoveToPod,
  onBulkAssignTags,
  onBulkDelete
}: VaultShellProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilterMode, setTagFilterMode] = useState<'AND' | 'OR'>('AND');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

    // Filter by tags
    if (selectedTags.length > 0) {
      result = filterItemsByTags(result, selectedTags, tagFilterMode);
    }

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
  }, [items, activeTypeFilter, selectedFolder, selectedTags, tagFilterMode, searchQuery]);

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

  const handleToggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    }
  };

  const [isBulkActionMenuOpen, setIsBulkActionMenuOpen] = useState(false);

  return (
    <div className="h-full w-full flex flex-col lg:flex-row bg-theme-base overflow-hidden relative">
      {/* Left List Pane */}
      <div className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 h-full relative">
        <ItemListPane 
          items={filteredItems}
          selectedItemId={selectedItemId}
          onSelectItem={(id) => setSelectedItemId(id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTypeFilter={activeTypeFilter}
          selectedTags={selectedTags}
          tagFilterMode={tagFilterMode}
          onToggleTag={onToggleTag}
          onClearTags={onClearTags}
          onToggleFilterMode={() => setTagFilterMode(m => m === 'AND' ? 'OR' : 'AND')}
          selectedItems={selectedItems}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />

        {/* Floating Bulk Action Bar */}
        {selectedItems.size > 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-theme-surface border border-theme-subtle rounded-xl shadow-lg p-2 flex items-center justify-between z-20">
            <span className="text-sm font-semibold text-theme-main px-2">
              {selectedItems.size} selected
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const targetPod = prompt('Enter pod name to move to:');
                  if (targetPod !== null && onBulkMoveToPod) {
                    onBulkMoveToPod(Array.from(selectedItems), targetPod);
                    setSelectedItems(new Set());
                  }
                }}
                className="px-2 py-1 text-xs font-semibold text-theme-main hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Move to Pod
              </button>
              <button
                onClick={() => {
                  const tagsInput = prompt('Enter tags (comma-separated):');
                  if (tagsInput !== null && onBulkAssignTags) {
                    const tags = tagsInput.split(',').map(t => String(t).trim()).filter(Boolean);
                    onBulkAssignTags(Array.from(selectedItems), tags as string[]);
                    setSelectedItems(new Set());
                  }
                }}
                className="px-2 py-1 text-xs font-semibold text-theme-main hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Assign Tag
              </button>
              <button
                onClick={() => {
                  const ids = Array.from(selectedItems);
                  if (confirm(`Are you sure you want to delete ${ids.length} items?`)) {
                    if (onBulkDelete) {
                      onBulkDelete(ids);
                      setSelectedItems(new Set());
                    }
                  }
                }}
                className="px-2 py-1 text-xs font-semibold text-lobster-red hover:bg-lobster-red/10 rounded-lg transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        )}
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
          onFetchAttachment={onFetchAttachment}
        />
      </div>
    </div>
  );
}
