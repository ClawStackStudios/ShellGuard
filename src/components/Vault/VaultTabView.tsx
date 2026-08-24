import React from 'react';
import { Key, FileText, Binary, Paperclip } from 'lucide-react';
import { VaultItemType } from '../../types.ts';

interface VaultTabViewProps {
  activeTypeTab: VaultItemType;
  setActiveTypeTab: (type: VaultItemType) => void;
  totalPasswordsCount: number;
  totalNotesCount?: number;
  totalKeysCount?: number;
  totalAttachmentsCount?: number;
}

export function VaultTabView({
  activeTypeTab,
  setActiveTypeTab,
  totalPasswordsCount,
  totalNotesCount = 0,
  totalKeysCount = 0,
  totalAttachmentsCount = 0,
}: VaultTabViewProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-theme-subtle text-sm">
      {/* Logins Tab */}
      <button
        type="button"
        onClick={() => setActiveTypeTab("password")}
        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTypeTab === "password"
            ? "border-claw-cyan text-claw-cyan bg-claw-cyan/5"
            : "border-transparent text-theme-muted hover:text-theme-main hover:bg-slate-50 dark:hover:bg-slate-800/40"
        }`}
      >
        <Key size={16} />
        <span>Logins</span>
        <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono font-bold transition-colors ${
          activeTypeTab === "password"
            ? "bg-claw-cyan/15 text-claw-cyan"
            : "bg-slate-200 dark:bg-slate-800 text-theme-muted"
        }`}>
          {totalPasswordsCount}
        </span>
      </button>

      {/* Secure Notes Tab */}
      <button 
        type="button"
        onClick={() => setActiveTypeTab("note")}
        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTypeTab === "note"
            ? "border-claw-cyan text-claw-cyan bg-claw-cyan/5"
            : "border-transparent text-theme-muted hover:text-theme-main hover:bg-slate-50 dark:hover:bg-slate-800/40"
        }`}
      >
        <FileText size={16} />
        <span>Secure Notes</span>
        <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono font-bold transition-colors ${
          activeTypeTab === "note"
            ? "bg-claw-cyan/15 text-claw-cyan"
            : "bg-slate-200 dark:bg-slate-800 text-theme-muted"
        }`}>
          {totalNotesCount}
        </span>
      </button>

      {/* SSH & Keys Tab */}
      <button 
        type="button"
        onClick={() => setActiveTypeTab("key")}
        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTypeTab === "key"
            ? "border-claw-cyan text-claw-cyan bg-claw-cyan/5"
            : "border-transparent text-theme-muted hover:text-theme-main hover:bg-slate-50 dark:hover:bg-slate-800/40"
        }`}
      >
        <Binary size={16} />
        <span>SSH & Keys</span>
        <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono font-bold transition-colors ${
          activeTypeTab === "key"
            ? "bg-claw-cyan/15 text-claw-cyan"
            : "bg-slate-200 dark:bg-slate-800 text-theme-muted"
        }`}>
          {totalKeysCount}
        </span>
      </button>

      {/* Attachments Tab */}
      <button 
        type="button"
        onClick={() => setActiveTypeTab("attachment")}
        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTypeTab === "attachment"
            ? "border-claw-cyan text-claw-cyan bg-claw-cyan/5"
            : "border-transparent text-theme-muted hover:text-theme-main hover:bg-slate-50 dark:hover:bg-slate-800/40"
        }`}
      >
        <Paperclip size={16} />
        <span>Attachments</span>
        <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono font-bold transition-colors ${
          activeTypeTab === "attachment"
            ? "bg-claw-cyan/15 text-claw-cyan"
            : "bg-slate-200 dark:bg-slate-800 text-theme-muted"
        }`}>
          {totalAttachmentsCount}
        </span>
      </button>
    </div>
  );
}
