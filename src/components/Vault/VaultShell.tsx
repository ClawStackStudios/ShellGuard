import React, { useState, useMemo, useEffect } from 'react';
import { VaultItem, VaultItemType } from '../../types.ts';
import { ItemListPane } from './ItemListPane.tsx';
import { ItemDetailPane } from './ItemDetailPane.tsx';
import { isItemInPod } from '../../lib/podUtils.ts';
import { filterItemsByTags, extractAllTags } from '../../lib/tagUtils.ts';
import { searchVaultItems } from '../../lib/vaultSearch.ts';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import { AbyssalIngestionDock } from './AbyssalIngestionDock.tsx';
import { globalIngestionQueue } from '../../lib/habitatImport.ts';
import { restAdapter } from '../../services/api/restAdapter.ts';

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
  selectedItemId?: string | null;
  onSelectItemId?: (id: string | null) => void;
  onBatchAction?: () => Promise<void> | void;
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
  onBulkDelete,
  selectedItemId: controlledSelectedItemId,
  onSelectItemId,
  onBatchAction
}: VaultShellProps) {
  const [internalSelectedItemId, setInternalSelectedItemId] = useState<string | null>(null);
  const selectedItemId = controlledSelectedItemId !== undefined ? controlledSelectedItemId : internalSelectedItemId;
  const handleSelectItemId = (id: string | null) => {
    if (onSelectItemId) {
      onSelectItemId(id);
    } else {
      setInternalSelectedItemId(id);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilterMode, setTagFilterMode] = useState<'AND' | 'OR'>('AND');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkModalType, setBulkModalType] = useState<'movePod' | 'assignTag' | 'delete' | null>(null);
  const [bulkModalInput, setBulkModalInput] = useState('');

  // Phase 26 / Task 52: Dynamic Quarantine Filter & Batch Operations
  const [filterImportedOnly, setFilterImportedOnly] = useState(false);
  const [isGraduatingAll, setIsGraduatingAll] = useState(false);
  const [isRevertingBatch, setIsRevertingBatch] = useState(false);
  const [isConfirmingRevertBatch, setIsConfirmingRevertBatch] = useState(false);

  const importedItemsCount = useMemo(() => {
    return items.filter(i => Boolean(i.import_batch_id && i.imported_at)).length;
  }, [items]);

  useEffect(() => {
    if (importedItemsCount === 0 && filterImportedOnly) {
      setFilterImportedOnly(false);
    }
  }, [importedItemsCount, filterImportedOnly]);

  const handleGraduateAll = async () => {
    setIsGraduatingAll(true);
    try {
      const batchIds = Array.from(new Set(filteredItems.map(i => i.import_batch_id).filter(Boolean) as string[]));
      for (const bId of batchIds) {
        await restAdapter.POST(`/api/vault/import-batches/${bId}/graduate`, {});
      }
      if (onBatchAction) await onBatchAction();
    } catch (e) {
      console.error('Failed to graduate batches:', e);
    } finally {
      setIsGraduatingAll(false);
    }
  };

  const handleRevertAll = async () => {
    setIsRevertingBatch(true);
    try {
      if (globalIngestionQueue.hasActiveUploads()) {
        globalIngestionQueue.cancelAll();
      }
      const batchIds = Array.from(new Set(filteredItems.map(i => i.import_batch_id).filter(Boolean) as string[]));
      for (const bId of batchIds) {
        await restAdapter.DELETE(`/api/vault/import-batches/${bId}`);
      }
      if (selectedItemId && filteredItems.some(i => i.id === selectedItemId)) {
        handleSelectItemId(null);
      }
      if (onBatchAction) await onBatchAction();
    } catch (e) {
      console.error('Failed to revert batches:', e);
    } finally {
      setIsRevertingBatch(false);
      setIsConfirmingRevertBatch(false);
    }
  };

  useEffect(() => {
    if (isLocked) {
      setSelectedItems(new Set());
      setBulkModalType(null);
      setSearchQuery("");
      setFilterImportedOnly(false);
    }
  }, [isLocked]);

  // Browser Safety Guard: Warn user before tab closure if background ingestion is in-flight
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (globalIngestionQueue.hasActiveUploads()) {
        e.preventDefault();
        e.returnValue = 'Background attachment uploads are currently in progress. Navigating away may cause data loss.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Teardown stale selections if items change or are deleted (only when items list is populated)
  useEffect(() => {
    if (selectedItemId && items.length > 0 && !items.some(i => i.id === selectedItemId)) {
      handleSelectItemId(null);
    }
  }, [items, selectedItemId]);

  useEffect(() => {
    setSelectedItems(prev => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      for (const id of prev) {
        if (items.some(i => i.id === id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  // Extract existing pods and tags for bulk selectors (filtering out ghost Attachment pod)
  const availablePods = useMemo(() => {
    const pods = new Set<string>();
    for (const item of items) {
      if (item.category && item.category.trim() && item.category !== 'all' && item.category.toLowerCase() !== 'attachment') {
        pods.add(item.category.trim());
      }
    }
    return Array.from(pods).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const availableTags = useMemo(() => {
    return extractAllTags(items);
  }, [items]);

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

    if (filterImportedOnly) {
      result = result.filter(i => Boolean(i.import_batch_id && i.imported_at));
    }

    if (searchQuery.trim()) {
      result = searchVaultItems(result, searchQuery);
    }

    // Sort by recency (created_at desc)
    result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return result;
  }, [items, activeTypeFilter, selectedFolder, selectedTags, tagFilterMode, filterImportedOnly, searchQuery]);

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
          onSelectItem={(id) => handleSelectItemId(id)}
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
          filterImportedOnly={filterImportedOnly}
          onToggleFilterImported={() => setFilterImportedOnly(prev => !prev)}
          importedCount={importedItemsCount}
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
              handleSelectItemId(null);
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
          <div className="bg-theme-surface border border-theme-subtle rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-theme-main">
                {bulkModalType === 'movePod' ? 'Move to Pod' : 'Assign Tags'}
              </h2>
              <p className="mt-1 text-xs text-theme-muted">
                {bulkModalType === 'movePod'
                  ? `Select an existing pod or type a new destination for the ${selectedItems.size} selected item(s):`
                  : `Select existing tags or type comma-separated tags to assign to the ${selectedItems.size} selected item(s):`}
              </p>
            </div>

            {/* Existing Pods Selector */}
            {bulkModalType === 'movePod' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-theme-muted block">
                  Existing Pods (Click to Pick)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-theme-base/50 rounded-xl border border-theme-subtle">
                  <button
                    type="button"
                    onClick={() => setBulkModalInput('')}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      bulkModalInput === ''
                        ? 'bg-claw-cyan text-ocean-dark font-bold border-claw-cyan shadow-sm'
                        : 'bg-theme-surface text-theme-muted hover:text-theme-main border-theme-subtle'
                    }`}
                  >
                    (None / Root)
                  </button>
                  {availablePods.map(pod => (
                    <button
                      key={pod}
                      type="button"
                      onClick={() => setBulkModalInput(pod)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        bulkModalInput === pod
                          ? 'bg-claw-cyan text-ocean-dark font-bold border-claw-cyan shadow-sm'
                          : 'bg-theme-surface text-theme-main hover:border-claw-cyan/50 border-theme-subtle'
                      }`}
                    >
                      📁 {pod}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Tags Selector */}
            {bulkModalType === 'assignTag' && availableTags.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-theme-muted block">
                  Existing Tags (Click to Toggle)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-theme-base/50 rounded-xl border border-theme-subtle">
                  {availableTags.map(tag => {
                    const currentTags = bulkModalInput.split(',').map(t => t.trim()).filter(Boolean);
                    const isSelected = currentTags.some(t => t.toLowerCase() === tag.name.toLowerCase());
                    return (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => {
                          let updated: string[];
                          if (isSelected) {
                            updated = currentTags.filter(t => t.toLowerCase() !== tag.name.toLowerCase());
                          } else {
                            updated = [...currentTags, tag.name];
                          }
                          setBulkModalInput(updated.join(', '));
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-claw-cyan text-ocean-dark font-bold border-claw-cyan shadow-sm'
                            : 'bg-theme-surface text-theme-main hover:border-claw-cyan/50 border-theme-subtle'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                        <span className="text-[10px] opacity-60">({tag.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-theme-muted block mb-1">
                {bulkModalType === 'movePod' ? 'Pod Name' : 'Tags (Comma-Separated)'}
              </label>
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
                placeholder={bulkModalType === 'movePod' ? 'e.g. Work, Personal, Infrastructure/Cloud' : 'e.g. urgent, vpn, server'}
                className="w-full bg-theme-base border border-theme-subtle rounded-xl p-3 text-xs text-theme-main placeholder:text-slate-500 outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBulkModalType(null);
                  setBulkModalInput('');
                }}
                className="px-4 py-2 text-xs font-semibold border border-theme-subtle text-theme-main rounded-xl hover:bg-theme-base transition-colors cursor-pointer"
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
                className="px-4 py-2 text-xs font-bold bg-claw-cyan hover:bg-cyan-500 text-ocean-dark rounded-xl shadow-lg shadow-claw-cyan/20 transition-all cursor-pointer"
              >
                {bulkModalType === 'movePod' ? 'Move to Pod' : 'Assign Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right Detail Pane */}
      <div className="flex-1 min-w-0 h-full">
        <ItemDetailPane
          item={selectedItem}
          onClose={() => handleSelectItemId(null)}
          onEdit={onEdit}
          onDelete={async (item) => {
            if (selectedItemId === item.id) {
              handleSelectItemId(null);
            }
            await onDelete(item);
          }}
          isLocked={isLocked}
          attachmentItemsById={attachmentItemsById}
          onFetchAttachment={onFetchAttachment}
          onBatchAction={onBatchAction}
        />
      </div>

      {/* Abyssal Ingestion Dock: Floating Reef Modernist background queue status */}
      <AbyssalIngestionDock />

      {/* Phase 26 / Task 52 — Floating Batch Action Bar (Centered, with strict clearance from bottom-right dock) */}
      {!isLocked && filterImportedOnly && filteredItems.length > 0 && (
        <div className="fixed sm:absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 text-white border border-claw-cyan/40 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="text-xs font-bold font-mono text-amber-400 whitespace-nowrap">
              {filteredItems.length} Quarantined
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGraduatingAll}
              onClick={handleGraduateAll}
              className="px-3.5 py-1.5 bg-claw-cyan hover:bg-cyan-400 text-ocean-dark text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isGraduatingAll ? 'Graduating...' : 'Graduate All'}
            </button>
            <button
              type="button"
              disabled={isRevertingBatch}
              onClick={() => setIsConfirmingRevertBatch(true)}
              className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Revert Import
            </button>
          </div>
        </div>
      )}

      {/* Revert Quarantined Batches Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmingRevertBatch}
        title="Revert Quarantined Items"
        description={`Are you sure you want to revert all ${filteredItems.length} quarantined item(s)? All records and their associated attachments will be permanently deleted.`}
        confirmText={isRevertingBatch ? "Reverting..." : "Revert Import"}
        cancelText="Cancel"
        onConfirm={handleRevertAll}
        onCancel={() => setIsConfirmingRevertBatch(false)}
      />
    </div>
  );
}
