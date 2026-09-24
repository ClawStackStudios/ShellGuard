import React from "react";
import { 
  X, 
  Settings, 
  LogOut, 
  LayoutGrid, 
  User, 
  Bot, 
  Zap, 
  ArrowUpDown, 
  Key
} from "lucide-react";
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
  isLocked?: boolean;
  // Vault specific
  vaultItems: VaultItem[];
  selectedFolder: string;
  setSelectedFolder: (folder: string) => void;
  handleRenamePod: (oldPod: string, newPod: string) => void;
  handleDeletePod: (podToDelete: string) => void;
  scuttleVault: () => void;
  scuttleAgents: () => void;
  activeTypeFilter: VaultItemType | "all";
  setActiveTypeFilter: (type: VaultItemType | "all") => void;
  selectedTags?: string[];
  onToggleTag?: (tagName: string) => void;
  onClearTags?: () => void;
}

export function Sidebar({
  view,
  setView,
  settingsMode,
  isCollapsed,
  setIsCollapsed,
  onClose,
  onLogout,
  isLocked = false,
  vaultItems,
  selectedFolder,
  setSelectedFolder,
  selectedTags,
  onToggleTag,
  onClearTags,
  handleRenamePod,
  handleDeletePod,
  scuttleVault,
  scuttleAgents,
  activeTypeFilter,
  setActiveTypeFilter
}: SidebarProps) {
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

            <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
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
                activeTypeFilter={activeTypeFilter}
                onActiveTypeFilterChange={(type) => {
                  setActiveTypeFilter(type);
                  setView('vault');
                  if (window.innerWidth < 1024) onClose();
                }}
                onRenameFolder={handleRenamePod}
                onDeleteFolder={handleDeletePod}
                selectedTags={selectedTags}
                onToggleTag={onToggleTag}
                onClearTags={onClearTags}
                isCollapsed={isCollapsed}
                isLocked={isLocked}
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
