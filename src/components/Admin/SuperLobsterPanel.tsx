/**
 * SuperLobsterPanel.tsx — ShellGuard©™
 *
 * Container for the SuperLobster control plane. Internal section nav:
 * Reef Status · Lobsters · Settings · Backups · Audit Reef.
 * Aligned with CaraBase dashboard card-grid aesthetic & spring physics.
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
import { BouncyBrand } from '../ui/BouncyBrand.tsx';

type Section = 'status' | 'users' | 'settings' | 'backups' | 'audit';

const SECTIONS: Array<{ id: Section; label: string; icon: React.ReactNode; count?: string }> = [
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
    <div className="min-h-screen bg-theme-base text-theme-main selection:bg-[#e4048a]/30 relative overflow-x-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[45vw] h-[300px] rounded-full bg-[#e4048a]/5 blur-[120px] pointer-events-none -z-0" />
      <div className="absolute top-20 right-1/4 w-[35vw] h-[300px] rounded-full bg-[#06b6d4]/5 blur-[120px] pointer-events-none -z-0" />

      {/* Header */}
      <header className="border-b-2 border-[#e4048a] bg-theme-surface/85 backdrop-blur-xl sticky top-0 z-20 shadow-sm shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e4048a]/20 to-[#e4048a]/5 border border-[#e4048a]/30 flex items-center justify-center shrink-0 shadow-lg shadow-[#e4048a]/10">
              <Shield size={20} className="text-[#e4048a]" />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <BouncyBrand variant="subtle" className="text-lg tracking-tight" />
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-[#e4048a]/15 text-[#e4048a] font-bold border border-[#e4048a]/30">
                  SuperLobster
                </span>
              </div>
              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold leading-tight mt-0.5">
                Instance Control Plane
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live session pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span>Reef Online</span>
            </div>

            {/* Lock Shell button */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-theme-muted hover:text-red-400 hover:bg-red-500/10 border border-theme-subtle hover:border-red-500/30 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
              title="End admin session and lock control plane"
            >
              <LogOut size={14} /> Lock Shell
            </button>
          </div>
        </div>

        {/* Section nav */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1 flex gap-1.5 overflow-x-auto scrollbar-none">
          {SECTIONS.map(s => {
            const isActive = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#e4048a]/15 text-[#e4048a] border border-[#e4048a]/35 shadow-sm shadow-[#e4048a]/15'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-base/80 border border-transparent'
                }`}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
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
