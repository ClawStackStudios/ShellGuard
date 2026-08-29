import React from 'react';
import { VaultItem, VaultItemType } from '../../types.ts';
import { Favicon } from './Favicon.tsx';
import { Key, FileText, Binary, Search, ArrowUpDown } from 'lucide-react';
import { getPodColor } from '../../lib/podUtils.ts';
import { extractDomain } from '../../lib/urlUtils.ts';

interface ItemListPaneProps {
  items: VaultItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTypeFilter: VaultItemType | "all";
}

export function ItemListPane({
  items,
  selectedItemId,
  onSelectItem,
  searchQuery,
  onSearchChange,
  activeTypeFilter
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
      <div className="p-3 border-b border-theme-subtle bg-theme-surface flex-shrink-0 flex items-center gap-2">
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

      {/* List Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
