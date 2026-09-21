import React, { useState, useMemo, useEffect } from 'react';
import { VaultItem, VaultItemType } from '../../types.ts';
import { ItemListPane } from './ItemListPane.tsx';
import { ItemDetailPane } from './ItemDetailPane.tsx';
import { isItemInPod } from '../../lib/podUtils.ts';
import { filterItemsByTags } from '../../lib/tagUtils.ts';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';

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
  onDelete: (item: VaultItem) => Promise<void> | void;
  onBulkMoveToPod?: (ids: string[], category: string) => void;
  onBulkAssignTags?: (ids: string[], tags: string[]) => void;
  onBulkDelete?: (ids: string[]) => Promise<void> | void;
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
  const [bulkModalType, setBulkModalType] = useState<'movePod' | 'assignTag' | 'delete' | null>(null);
  const [bulkModalInput, setBulkModalInput] = useState('');

  useEffect(() => {
    if (isLocked) {
      setSelectedItems(new Set());
      setBulkModalType(null);
    }
  }, [isLocked]);

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
        {!isLocked && selectedItems.size > 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-theme-surface border border-theme-subtle rounded-xl shadow-lg p-2 flex items-center justify-between z-20">
            <span className="text-sm font-semibold text-theme-main px-2">
              {selectedItems.size} selected
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setBulkModalInput('');
                  setBulkModalType('movePod');
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-theme-main hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Move to Pod
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkModalInput('');
                  setBulkModalType('assignTag');
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-theme-main hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Assign Tag
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkModalType('delete');
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-lobster-red hover:bg-lobster-red/10 rounded-lg transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkModalType === 'delete'}
        title="Delete Selected Items"
        description={`Are you sure you want to delete ${selectedItems.size} selected item(s)? This action will cascade to any associated attachments and cannot be undone.`}
        confirmText="Delete Items"
        cancelText="Cancel"
        onConfirm={async () => {
          if (onBulkDelete) {
            const idsToDelete: string[] = Array.from(selectedItems);
            if (selectedItemId && selectedItems.has(selectedItemId)) {
              setSelectedItemId(null);
            }
            setSelectedItems(new Set());
            setBulkModalType(null);
            await onBulkDelete(idsToDelete);
          } else {
            setBulkModalType(null);
          }
        }}
        onCancel={() => setBulkModalType(null)}
      />

      {/* Bulk Move / Tag Modal */}
      {bulkModalType && bulkModalType !== 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-theme-surface border border-theme-subtle rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-theme-main">
              {bulkModalType === 'movePod' ? 'Move to Pod' : 'Assign Tags'}
            </h2>
            <p className="mt-2 text-sm text-theme-muted">
              {bulkModalType === 'movePod'
                ? `Enter the destination pod name for the ${selectedItems.size} selected item(s):`
                : `Enter comma-separated tags to assign to the ${selectedItems.size} selected item(s):`}
            </p>
            <div className="mt-4">
              <input
                type="text"
                autoFocus
                value={bulkModalInput}
                onChange={(e) => setBulkModalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (bulkModalType === 'movePod') {
                      if (onBulkMoveToPod) {
                        onBulkMoveToPod(Array.from(selectedItems), bulkModalInput.trim());
                        setSelectedItems(new Set());
                      }
                    } else if (bulkModalType === 'assignTag') {
                      if (onBulkAssignTags) {
                        const tags = bulkModalInput.split(',').map(t => t.trim()).filter(Boolean);
                        onBulkAssignTags(Array.from(selectedItems), tags);
                        setSelectedItems(new Set());
                      }
                    }
                    setBulkModalType(null);
                    setBulkModalInput('');
                  }
                }}
                placeholder={bulkModalType === 'movePod' ? 'e.g. Work, Personal, Finance' : 'e.g. urgent, vpn, server'}
                className="w-full bg-theme-base border border-theme-subtle rounded-xl p-3 text-sm text-theme-main placeholder:text-slate-500 outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-all"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setBulkModalType(null);
                  setBulkModalInput('');
                }}
                className="px-4 py-2 text-sm font-medium border border-theme-subtle text-theme-main rounded-xl hover:bg-theme-base transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (bulkModalType === 'movePod') {
                    if (onBulkMoveToPod) {
                      onBulkMoveToPod(Array.from(selectedItems), bulkModalInput.trim());
                      setSelectedItems(new Set());
                    }
                  } else if (bulkModalType === 'assignTag') {
                    if (onBulkAssignTags) {
                      const tags = bulkModalInput.split(',').map(t => t.trim()).filter(Boolean);
                      onBulkAssignTags(Array.from(selectedItems), tags);
                      setSelectedItems(new Set());
                    }
                  }
                  setBulkModalType(null);
                  setBulkModalInput('');
                }}
                className="px-4 py-2 text-sm font-bold bg-claw-cyan hover:bg-cyan-500 text-ocean-dark rounded-xl shadow-lg shadow-claw-cyan/20 transition-all cursor-pointer"
              >
                {bulkModalType === 'movePod' ? 'Move' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right Detail Pane */}
      <div className="flex-1 min-w-0 h-full">
        <ItemDetailPane
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onEdit={onEdit}
          onDelete={async (item) => {
            if (selectedItemId === item.id) {
              setSelectedItemId(null);
            }
            await onDelete(item);
          }}
          isLocked={isLocked}
          attachmentItemsById={attachmentItemsById}
          onFetchAttachment={onFetchAttachment}
        />
      </div>
    </div>
  );
}
