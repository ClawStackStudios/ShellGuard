/**
 * SuperLobsterPanel.tsx — ShellGuard©™
 *
 * Container for the SuperLobster control plane. Internal section nav:
 * Reef Status · Lobsters · Settings · Backups · Audit Reef.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Users, Settings2, DatabaseBackup, ScrollText, LogOut, Shield } from 'lucide-react';
import { useSuperLobster } from './SuperLobsterContext.tsx';
import { SuperLobsterStatus } from './SuperLobsterStatus.tsx';
import { SuperLobsterUsers } from './SuperLobsterUsers.tsx';
import { SuperLobsterSettings } from './SuperLobsterSettings.tsx';
import { SuperLobsterBackups } from './SuperLobsterBackups.tsx';
import { SuperLobsterAudit } from './SuperLobsterAudit.tsx';

type Section = 'status' | 'users' | 'settings' | 'backups' | 'audit';

const SECTIONS: Array<{ id: Section; label: string; icon: React.ReactNode }> = [
  { id: 'status', label: 'Reef Status', icon: <Activity size={16} /> },
  { id: 'users', label: 'Lobsters', icon: <Users size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings2 size={16} /> },
  { id: 'backups', label: 'Backups', icon: <DatabaseBackup size={16} /> },
  { id: 'audit', label: 'Audit Reef', icon: <ScrollText size={16} /> },
];

export function SuperLobsterPanel() {
  const { logout } = useSuperLobster();
  const [section, setSection] = useState<Section>('status');

  return (
    <div className="min-h-screen bg-theme-base text-theme-main selection:bg-[#e4048a]/30">
      {/* Header */}
      <header className="border-b border-theme-subtle bg-theme-surface/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#e4048a]/10 border border-[#e4048a]/30 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-[#e4048a]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black tracking-tight font-[Sora] leading-tight">SuperLobster</h1>
              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold leading-tight">
                Instance Control Plane
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-theme-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={15} /> Lock Shell
          </button>
        </div>

        {/* Section nav */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                section === s.id
                  ? 'bg-[#e4048a]/15 text-[#e4048a] border border-[#e4048a]/30'
                  : 'text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {section === 'status' && <SuperLobsterStatus />}
            {section === 'users' && <SuperLobsterUsers />}
            {section === 'settings' && <SuperLobsterSettings />}
            {section === 'backups' && <SuperLobsterBackups />}
            {section === 'audit' && <SuperLobsterAudit />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
