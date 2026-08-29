import React, { useState, useRef, useEffect } from "react";
import { 
  Menu, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  X,
  Search,
  Shield,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "../Theme/ThemeToggle.tsx";
import { Lobster, VaultItem, VaultItemType } from "../../types.ts";

interface HeaderProps {
  user: Lobster | null;
  lobsters?: Lobster[];
  activeSessions?: Record<string, boolean>;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
  view: string;
  onSwitchAccount?: (uuid: string) => void;
  onAddAccount?: () => void;
  onRemoveAccount?: (uuid: string) => void;
  onLockAccount?: (uuid: string) => void;
  // Search
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  isSearchFocused?: boolean;
  onSearchFocusChange?: (f: boolean) => void;
  matchingVaultItems?: VaultItem[];
  onSelectSearchResult?: (item: VaultItem) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  searchDropdownRef?: React.RefObject<HTMLDivElement>;
  // Add menu
  isHeaderAddMenuOpen?: boolean;
  onHeaderAddMenuToggle?: () => void;
  onOpenAdd?: (type: VaultItemType) => void;
  headerAddMenuRef?: React.RefObject<HTMLDivElement>;
  isLocked?: boolean;
}

export function Header({ 
  user, 
  lobsters = [], 
  activeSessions = {}, 
  onToggleSidebar, 
  isSidebarCollapsed = false,
  onToggleDesktopSidebar,
  view,
  onSwitchAccount,
  onAddAccount,
  onRemoveAccount,
  onLockAccount,
  searchQuery = "",
  onSearchQueryChange,
  isSearchFocused = false,
  onSearchFocusChange,
  matchingVaultItems = [],
  onSelectSearchResult,
  onSearchSubmit,
  searchInputRef,
  searchDropdownRef,
  isHeaderAddMenuOpen = false,
  onHeaderAddMenuToggle,
  onOpenAdd,
  headerAddMenuRef,
  isLocked = false,
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [removingTarget, setRemovingTarget] = useState<Lobster | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getBreadcrumbs = () => {
    const crumbs = ["ShellGuard"];
    if (view === "vault") crumbs.push("Vault", "Passwords");
    else if (view === "generator") crumbs.push("Tools", "Password Generator");
    else if (view === "settings") crumbs.push("System", "Profile");
    else if (view === "settings_agents") crumbs.push("System", "Lobster Keys");
    else if (view === "settings_generator") crumbs.push("System", "Generator");
    else if (view === "settings_import_export") crumbs.push("System", "Import & Export");
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmRemove = () => {
    if (removingTarget && onRemoveAccount) {
      onRemoveAccount(removingTarget.uuid);
      setRemovingTarget(null);
    }
  };

  const currentDisplayName = user ? (user.displayName || user.username || "Lobster") : "Identity";
  const knownLobsters = lobsters && lobsters.length > 0 ? lobsters : (user ? [user] : []);

  return (
    <header className="bg-theme-base/90 backdrop-blur-md border-b-2 border-purple-600 dark:border-red-500 px-4 md:px-6 py-2 md:py-3 flex-shrink-0 h-16 transition-colors duration-300 z-30 relative">
      <div className="flex items-center justify-between gap-4 h-full w-full">
        {/* Left Side: Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 md:gap-4">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden text-theme-main p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {onToggleDesktopSidebar && (
            <button
              type="button"
              onClick={onToggleDesktopSidebar}
              className="hidden lg:flex text-theme-muted hover:text-theme-main p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )}
          
          <div className="flex items-center gap-1.5 ml-1 md:ml-0 overflow-hidden">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span className={`text-[11px] md:text-sm font-headline tracking-wide truncate ${idx === breadcrumbs.length - 1 ? 'text-theme-main font-bold' : 'text-theme-muted font-medium'}`}>
                  {crumb}
                </span>
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-theme-subtle shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Side: Search, Add, Account Switcher & Actions */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Search bar */}
          {user && !isLocked && (
            <form onSubmit={onSearchSubmit} className="relative hidden md:flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-theme-muted pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange?.(e.target.value)}
                onFocus={() => onSearchFocusChange?.(true)}
                placeholder="Search vault… (/ or ⌘K)"
                className="h-8 w-40 lg:w-56 pl-8 pr-3 text-xs rounded-xl bg-slate-100 dark:bg-white/5 border border-theme-subtle focus:outline-none focus:ring-2 focus:ring-claw-cyan text-theme-main placeholder:text-theme-subtle transition-all"
              />
            </form>
          )}

          {/* Add button */}
          {user && !isLocked && onOpenAdd && (
            <div className="relative" ref={headerAddMenuRef}>
              <button
                type="button"
                onClick={onHeaderAddMenuToggle}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-lobster-red/10 hover:bg-lobster-red/20 border border-lobster-red/20 text-lobster-red transition-colors cursor-pointer shrink-0"
                title="Add vault item"
              >
                <Plus className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {isHeaderAddMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#1a0c12] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 p-1.5"
                  >
                    {(["password", "note", "key", "attachment"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onOpenAdd(type)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold capitalize text-theme-main hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                      >
                        {type === "password" ? "🔑 Password" : type === "note" ? "📝 Secure Note" : type === "key" ? "🗝 SSH Key" : "📎 Attachment"}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 border-l border-theme-subtle pl-3 group hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
              >
                <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-theme-muted group-hover:text-theme-main transition-colors cursor-pointer">
                  {currentDisplayName}
                </span>
                <div className="h-8 w-8 rounded-full bg-lobster-red/10 border border-lobster-red/20 flex items-center justify-center text-lobster-red font-headline font-bold text-xs shadow-sm relative shrink-0">
                  {currentDisplayName.substring(0, 2).toUpperCase()}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-theme-base" />
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-theme-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ── Account Switcher Dropdown ── */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1a0c12] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 p-2"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Known Grottos</span>
                      <span className="text-[10px] text-theme-subtle">{knownLobsters.length} account{knownLobsters.length === 1 ? '' : 's'}</span>
                    </div>

                    {/* Account List */}
                    <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                      {knownLobsters.map((acc) => {
                        const isActive = acc.uuid === user.uuid;
                        const isUnlocked = Boolean(activeSessions[acc.uuid]);
                        const name = acc.displayName || acc.username;

                        return (
                          <div
                            key={acc.uuid}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                              isActive
                                ? 'bg-lobster-red/10 border border-lobster-red/20'
                                : 'hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false);
                                if (!isActive && onSwitchAccount) onSwitchAccount(acc.uuid);
                              }}
                              className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                            >
                              <div className="relative shrink-0">
                                <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-theme-main">
                                  {name.substring(0, 2).toUpperCase()}
                                </div>
                                <span 
                                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-theme-base ${
                                    isUnlocked ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`} 
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className={`truncate font-semibold ${isActive ? 'text-lobster-red font-bold' : 'text-theme-main'}`}>
                                  {name}
                                </p>
                                <p className="text-[10px] text-theme-muted truncate">
                                  {acc.username}
                                </p>
                              </div>

                              {isActive ? (
                                <span className="text-[10px] font-bold text-lobster-red px-1.5 py-0.5 bg-lobster-red/10 rounded-md shrink-0">
                                  Active
                                </span>
                              ) : isUnlocked ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onLockAccount) onLockAccount(acc.uuid);
                                  }}
                                  className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors -mr-1"
                                  title="Lock Account"
                                >
                                  <Unlock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                </button>
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                            </button>

                            {/* Remove button (only for non-active or when multiple exist) */}
                            {lobsters.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRemovingTarget(acc);
                                }}
                                title="Remove account identity from switcher"
                                className="ml-1 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Account Action */}
                    {onAddAccount && (
                      <div className="pt-1 mt-1 border-t border-slate-100 dark:border-white/5">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onAddAccount();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-claw-cyan hover:bg-claw-cyan/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Add Another Account
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* ── Search Dropdown ── */}
      {isSearchFocused && matchingVaultItems.length > 0 && onSelectSearchResult && (
        <div
          ref={searchDropdownRef}
          className="absolute left-0 right-0 top-full z-50 mx-4 mt-1 bg-white dark:bg-[#1a0c12] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
        >
          {matchingVaultItems.slice(0, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSearchResult(item)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-none"
            >
              <Shield className="w-4 h-4 text-claw-cyan shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-theme-main truncate">{item.title}</p>
                <p className="text-[10px] text-theme-muted truncate">{item.username || item.type}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Custom Removal Confirmation Modal (Reef Modernist) ── */}
      <AnimatePresence>
        {removingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#1a0c12] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl relative"
            >
              <button
                onClick={() => setRemovingTarget(null)}
                className="absolute top-4 right-4 text-theme-muted hover:text-theme-main p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4 text-red-500">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-theme-main">Remove Identity</h3>
                  <p className="text-xs text-theme-muted">Confirm identity deletion from switcher</p>
                </div>
              </div>

              <p className="text-sm text-theme-muted mb-6 leading-relaxed">
                Are you sure you want to remove <strong className="text-theme-main font-semibold">{removingTarget.displayName || removingTarget.username}</strong> from this browser's account switcher?
                <br /><br />
                <span className="text-xs text-slate-500">
                  This does NOT delete data on the server, but you will need your identity file or ShellKey©™ to sign back in.
                </span>
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setRemovingTarget(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-theme-muted hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Identity
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
