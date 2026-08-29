import React, { useRef, useState, useEffect, useMemo } from "react";
import { 
  X, 
  Settings, 
  LogOut, 
  LayoutGrid, 
  User, 
  Bot, 
  Zap, 
  ArrowUpDown, 
  Key, 
  Search, 
  CornerDownLeft,
  FileText,
  FileCode,
  Paperclip
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InteractiveBrand } from "../Branding/InteractiveBrand.tsx";
import { SidebarFolderTree } from "../Vault/SidebarFolderTree.tsx";
import { VaultItem, VaultItemType } from "../../types.ts";

interface SidebarProps {
  view: string;
  setView: (view: any) => void;
  settingsMode: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onClose: () => void;
  onLogout: () => void;
  // Vault specific
  vaultItems: VaultItem[];
  selectedFolder: string;
  setSelectedFolder: (folder: string) => void;
  handleRenamePod: (oldPod: string, newPod: string) => void;
  handleDeletePod: (podToDelete: string) => void;
  scuttleVault: () => void;
  scuttleAgents: () => void;
}

export function Sidebar({
  view,
  setView,
  settingsMode,
  isCollapsed,
  setIsCollapsed,
  onClose,
  onLogout,
  vaultItems,
  selectedFolder,
  setSelectedFolder,
  handleRenamePod,
  handleDeletePod,
  scuttleVault,
  scuttleAgents
}: SidebarProps) {
  
  // Search State
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcuts for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === "Escape") {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to dismiss search results dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current && 
        !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter vault items in real time for global search
  const matchingVaultItems = useMemo(() => {
    if (!headerSearchQuery.trim()) return [];
    const q = headerSearchQuery.toLowerCase();
    return vaultItems.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      const matchCategory = item.category?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchSecret = item.type === "note" && item.secret?.toLowerCase().includes(q);
      return Boolean(matchTitle || matchUser || matchUrl || matchCategory || matchNotes || matchSecret);
    });
  }, [vaultItems, headerSearchQuery]);

  const handleSelectSearchResult = (item: VaultItem) => {
    setHeaderSearchQuery(item.title);
    setView("vault");
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView("vault");
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-theme-surface border-r border-theme-subtle transition-colors duration-300">
      {/* Logo Area */}
      <div className={`p-4 border-b border-theme-subtle flex items-center shrink-0 h-16 ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
        {isCollapsed ? (
          <div className="w-9 h-9 bg-gradient-to-br from-[#e4048a] to-[#ef4444] rounded-xl flex items-center justify-center shadow-lg shadow-[#e4048a]/20 flex-shrink-0 cursor-pointer" onClick={() => setIsCollapsed(false)}>
            <span className="text-xl select-none">🦞</span>
          </div>
        ) : (
          <>
            <InteractiveBrand showIcon={true} onClick={() => {}} />
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Main Sidebar Layout */}
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        {settingsMode ? (
          <div className="p-3 flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
            {!isCollapsed && (
              <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 mt-2">
                Settings
              </p>
            )}
            
            <button 
              onClick={() => { setView('settings'); if (window.innerWidth < 1024) onClose(); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold transition-all duration-200 ease-out active:scale-[0.98] ${view === "settings" ? "bg-claw-cyan/10 dark:bg-claw-cyan/20 text-claw-cyan shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title={isCollapsed ? "Profile" : undefined}
            >
              <User className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              {!isCollapsed && "Profile"}
            </button>

            <button 
              onClick={() => { setView('settings_agents'); scuttleAgents(); if (window.innerWidth < 1024) onClose(); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold transition-all duration-200 ease-out active:scale-[0.98] ${view === "settings_agents" || view === "agents" ? "bg-lobster-red/10 dark:bg-lobster-red/20 text-lobster-red shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title={isCollapsed ? "Lobster Keys" : undefined}
            >
              <Bot className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              {!isCollapsed && "Lobster Keys"}
            </button>

            <button 
              onClick={() => { setView('settings_generator'); if (window.innerWidth < 1024) onClose(); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold transition-all duration-200 ease-out active:scale-[0.98] ${view === "settings_generator" ? "bg-claw-cyan/10 dark:bg-claw-cyan/20 text-claw-cyan shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title={isCollapsed ? "Generator Settings" : undefined}
            >
              <Zap className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              {!isCollapsed && "Generator Settings"}
            </button>

            <button 
              onClick={() => { setView('settings_import_export'); if (window.innerWidth < 1024) onClose(); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold transition-all duration-200 ease-out active:scale-[0.98] ${view === "settings_import_export" ? "bg-claw-cyan/10 dark:bg-claw-cyan/20 text-claw-cyan shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title={isCollapsed ? "Import & Export" : undefined}
            >
              <ArrowUpDown className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              {!isCollapsed && "Import & Export"}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col p-3 custom-scrollbar">
            {!isCollapsed && (
              <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 mt-1">
                Dashboard
              </p>
            )}

            {/* 🔍 Sidebar Search Bar */}
            <div className="relative mb-2">
              {!isCollapsed ? (
                <>
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <Search 
                      size={15} 
                      className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                        isSearchFocused ? "text-claw-cyan" : "text-slate-400"
                      }`} 
                    />
                    <input
                      ref={searchInputRef}
                      id="sidebar-vault-search-input"
                      type="text"
                      value={headerSearchQuery}
                      onChange={(e) => {
                        setHeaderSearchQuery(e.target.value);
                        if (!isSearchFocused) setIsSearchFocused(true);
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder="Search vault..."
                      className="w-full bg-theme-base/90 hover:bg-theme-base focus:bg-theme-base border border-theme-subtle focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan rounded-xl pl-8 pr-8 py-2 text-xs text-theme-main placeholder:text-slate-400 outline-none transition-all shadow-sm"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {headerSearchQuery ? (
                        <button
                          type="button"
                          onClick={() => {
                            setHeaderSearchQuery("");
                            searchInputRef.current?.focus();
                          }}
                          className="p-1 text-slate-400 hover:text-theme-main rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          title="Clear search"
                        >
                          <X size={12} />
                        </button>
                      ) : (
                        <kbd className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm pointer-events-none">
                          <span>⌘K</span>
                        </kbd>
                      )}
                    </div>
                  </form>

                  {/* Quick Live Search Results Dropdown */}
                  <AnimatePresence>
                    {isSearchFocused && headerSearchQuery.trim().length > 0 && (
                      <motion.div
                        ref={searchDropdownRef}
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-1.5 bg-theme-surface border border-theme-subtle rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 flex flex-col"
                      >
                        <div className="p-2 border-b border-theme-subtle flex items-center justify-between text-[11px] text-theme-muted bg-theme-base/60">
                          <span className="font-semibold text-theme-main flex items-center gap-1">
                            <Search size={11} className="text-claw-cyan" />
                            {matchingVaultItems.length} found
                          </span>
                          <span className="text-[9px]">Press Enter</span>
                        </div>

                        <div className="overflow-y-auto divide-y divide-theme-subtle/50 py-0.5 max-h-52 custom-scrollbar">
                          {matchingVaultItems.length > 0 ? (
                            matchingVaultItems.slice(0, 6).map((item) => {
                              const isPass = item.type === "password";
                              const isNote = item.type === "note";
                              const isKey = item.type === "key";

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleSelectSearchResult(item)}
                                  className="w-full px-2.5 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-left flex items-center gap-2 cursor-pointer group"
                                >
                                  <div className="w-6 h-6 rounded bg-theme-base border border-theme-subtle flex items-center justify-center flex-shrink-0 text-slate-500 group-hover:text-claw-cyan transition-colors">
                                    {isPass ? <Key size={12} /> : isNote ? <FileText size={12} /> : isKey ? <FileCode size={12} /> : <Paperclip size={12} />}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs text-theme-main truncate group-hover:text-claw-cyan transition-colors">
                                        {item.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-theme-muted truncate">
                                      {item.username && (
                                        <span className="font-mono truncate">{item.username}</span>
                                      )}
                                      {item.category && (
                                        <span className="truncate text-slate-400">· {item.category}</span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-xs text-theme-muted">
                              <p className="font-semibold text-theme-main mb-0.5">No items found</p>
                              <p className="text-[11px]">No matches for "{headerSearchQuery}".</p>
                            </div>
                          )}
                        </div>

                        {matchingVaultItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setView("vault");
                              setIsSearchFocused(false);
                            }}
                            className="p-2 text-center text-[11px] font-bold text-claw-cyan bg-theme-base/80 hover:bg-theme-base border-t border-theme-subtle transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>Open in Vault</span>
                            <CornerDownLeft size={11} />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsCollapsed(false);
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                      setIsSearchFocused(true);
                    }, 150);
                  }}
                  className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-claw-cyan hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Search Vault (⌘K / /)"
                >
                  <Search size={18} />
                </button>
              )}
            </div>

            {/* Divider line under search bar */}
            <div className="pt-2.5 mt-2.5 border-t border-theme-subtle flex-1 flex flex-col min-h-0 space-y-1.5">
              <button 
                onClick={() => { setView('vault'); setSelectedFolder('all'); scuttleVault(); if (window.innerWidth < 1024) onClose(); }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold transition-all duration-200 ease-out active:scale-[0.98] ${view === "vault" && selectedFolder === "all" ? "bg-claw-cyan/10 dark:bg-claw-cyan/20 text-claw-cyan shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                title={isCollapsed ? "Passwords" : undefined}
              >
                <Key className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                {!isCollapsed && "Passwords"}
              </button>

              <button 
                onClick={() => { setView('generator'); if (window.innerWidth < 1024) onClose(); }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold transition-all duration-200 ease-out active:scale-[0.98] ${view === "generator" ? "bg-claw-cyan/10 dark:bg-claw-cyan/20 text-claw-cyan shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                title={isCollapsed ? "Password Generator" : undefined}
              >
                <Zap className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                {!isCollapsed && "Password Generator"}
              </button>

              <SidebarFolderTree
                items={vaultItems}
                selectedFolder={selectedFolder}
                onSelectFolder={(folder) => {
                  setSelectedFolder(folder);
                  setView('vault');
                  scuttleVault();
                  if (window.innerWidth < 1024) onClose();
                }}
                onRenameFolder={handleRenamePod}
                onDeleteFolder={handleDeletePod}
                isCollapsed={isCollapsed}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Utility Bar */}
      <div className="p-3 border-t border-theme-subtle shrink-0">
        <div className="space-y-1.5">
          {settingsMode ? (
            <button
              onClick={() => { setView('vault'); if (window.innerWidth < 1024) onClose(); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer`}
              title={isCollapsed ? "Back to Dashboard" : undefined}
            >
              <LayoutGrid className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              {!isCollapsed && "Back to Dashboard"}
            </button>
          ) : (
            <button
              onClick={() => { setView('settings'); if (window.innerWidth < 1024) onClose(); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold text-claw-cyan hover:bg-claw-cyan/10 transition-all cursor-pointer`}
              title={isCollapsed ? "System Settings" : undefined}
            >
              <Settings className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              {!isCollapsed && "System Settings"}
            </button>
          )}

          <button
            onClick={() => { onLogout(); if (window.innerWidth < 1024) onClose(); }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2.5'} rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
