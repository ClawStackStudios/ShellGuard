import React from 'react';
import { VaultItem, VaultItemType } from '../../types.ts';
import { Favicon } from './Favicon.tsx';
import { Key, FileText, Binary, Search, ArrowUpDown, X, Tag as TagIcon } from 'lucide-react';
import { getPodColor, getTagColor } from '../../lib/podUtils.ts';
import { parseTags } from '../../lib/tagUtils.ts';
import { extractDomain } from '../../lib/urlUtils.ts';

interface ItemListPaneProps {
  items: VaultItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTypeFilter: VaultItemType | "all";
  selectedTags?: string[];
  tagFilterMode?: 'AND' | 'OR';
  onToggleTag?: (tagName: string) => void;
  onClearTags?: () => void;
  onToggleFilterMode?: () => void;
  selectedItems?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export function ItemListPane({
  items,
  selectedItemId,
  onSelectItem,
  searchQuery,
  onSearchChange,
  activeTypeFilter,
  selectedTags = [],
  tagFilterMode = 'AND',
  onToggleTag,
  onClearTags,
  onToggleFilterMode,
  selectedItems = new Set(),
  onToggleSelect,
  onToggleSelectAll
}: ItemListPaneProps) {
  
  const getTypeIcon = (type?: VaultItemType) => {
    switch (type) {
      case "note": return <FileText size={12} className="text-emerald-500" />;
      case "key": return <Binary size={12} className="text-purple-500" />;
      default: return <Key size={12} className="text-claw-cyan" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-base lg:border-r border-theme-subtle">
      {/* Search Header */}
      <div className="px-3 h-16 border-b border-theme-subtle bg-theme-surface flex-shrink-0 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search vault..."
            className="w-full bg-slate-100 dark:bg-slate-900/60 border border-theme-subtle focus:border-claw-cyan/70 focus:bg-theme-surface rounded-xl pl-8 pr-3 py-1.5 text-sm text-theme-main placeholder:text-slate-500 outline-none transition-all"
          />
        </div>
        <button 
          className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          title="Sort"
        >
          <ArrowUpDown size={16} />
        </button>
      </div>

      {/* Granular Tag Filter Bar */}
      {selectedTags.length > 0 && (
        <div className="px-3 py-2 border-b border-theme-subtle bg-slate-50/70 dark:bg-slate-900/50 flex flex-col gap-1.5 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TagIcon size={12} className="text-claw-cyan" />
              <span className="text-[11px] font-medium text-theme-muted">
                Filter ({items.length} {items.length === 1 ? 'result' : 'results'})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {onToggleFilterMode && selectedTags.length > 1 && (
                <button
                  type="button"
                  onClick={onToggleFilterMode}
                  className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-md bg-theme-subtle/50 hover:bg-theme-subtle text-theme-main transition-colors"
                  title={`Switch to ${tagFilterMode === 'AND' ? 'OR' : 'AND'} mode`}
                >
                  {tagFilterMode}
                </button>
              )}
              {onClearTags && (
                <button
                  type="button"
                  onClick={onClearTags}
                  className="text-[11px] font-semibold text-claw-cyan hover:text-cyan-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {selectedTags.map((tagName) => {
              const tagColor = getTagColor(tagName);
              return (
                <span
                  key={tagName}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md border shadow-xs"
                  style={{
                    backgroundColor: `${tagColor}15`,
                    borderColor: `${tagColor}35`,
                    color: tagColor,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
                  <span className="truncate max-w-[100px]">{tagName}</span>
                  {onToggleTag && (
                    <button
                      type="button"
                      onClick={() => onToggleTag(tagName)}
                      className="hover:opacity-75 ml-0.5"
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* List Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {items.length > 0 && onToggleSelectAll && (
          <div className="flex items-center gap-3 p-2.5 px-3 mb-1 border-b border-theme-subtle">
            <input
              type="checkbox"
              checked={selectedItems.size > 0 && selectedItems.size === items.length}
              ref={input => {
                if (input) {
                  input.indeterminate = selectedItems.size > 0 && selectedItems.size < items.length;
                }
              }}
              onChange={onToggleSelectAll}
              className="w-4 h-4 rounded border-theme-subtle text-claw-cyan focus:ring-claw-cyan"
            />
            <span className="text-xs font-semibold text-theme-muted">
              {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select All'}
            </span>
          </div>
        )}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-theme-muted p-8 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search size={20} />
            </div>
            <p className="text-sm">No items found</p>
          </div>
        ) : (
          items.map(item => {
            const isSelected = selectedItemId === item.id;
            const type = item.type || "password";
            
            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                  isSelected 
                    ? "bg-claw-cyan/10 border border-claw-cyan/30 shadow-sm"
                    : "bg-theme-surface border border-transparent hover:border-theme-subtle hover:shadow-sm"
                }`}
              >
                {/* Checkbox */}
                {onToggleSelect && (
                  <div className="flex-shrink-0 flex items-center justify-center pl-1 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => onToggleSelect(item.id)}
                      className="w-4 h-4 rounded border-theme-subtle text-claw-cyan focus:ring-claw-cyan cursor-pointer"
                    />
                  </div>
                )}
                {/* Favicon / Icon */}
                <div className="flex-shrink-0">
                  <Favicon url={item.url} title={item.title} size={36} />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-theme-main truncate">{item.title}</span>
                    {item.totp_secret && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Has TOTP" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-theme-muted truncate">
                    {activeTypeFilter === "all" && getTypeIcon(type)}
                    <span className="truncate">{item.username || extractDomain(item.url) || "No username"}</span>
                  </div>
                </div>

                {/* Right Edge Badges */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {item.category && item.category !== "all" && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getPodColor(item.category) }} />
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold truncate max-w-[60px]">{item.category.split('/').pop()}</span>
                    </div>
                  )}
                  {/* Tag Indicator Dots */}
                  {parseTags(item.tags).length > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {parseTags(item.tags).slice(0, 3).map((t, idx) => (
                        <span
                          key={`${t.name}-${idx}`}
                          className="w-1.5 h-1.5 rounded-full shadow-xs"
                          style={{ backgroundColor: t.color || getTagColor(t.name) }}
                          title={t.name}
                        />
                      ))}
                      {parseTags(item.tags).length > 3 && (
                        <span className="text-[8px] text-slate-400 font-mono">+{parseTags(item.tags).length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
