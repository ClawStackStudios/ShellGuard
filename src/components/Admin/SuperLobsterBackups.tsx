/**
 * SuperLobsterBackups.tsx — ShellGuard©™
 *
 * The buttery-smooth failsafe: toggle backups on/off, hit "Back up now",
 * watch the encrypted copies land in DATA_DIR/backups/. No download —
 * ever (T6). Restore is offline by design (ADMIN.md §5).
 * Aligned with CaraBase backup control and offline disaster recovery UI.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { DatabaseBackup, Loader2, Zap, CheckCircle2, AlertTriangle, ShieldCheck, Terminal, FileCheck, HardDrive, RefreshCw } from 'lucide-react';
import { useSuperLobster } from './SuperLobsterContext.tsx';

interface BackupFile {
  name: string;
  bytes: number;
  created: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SuperLobsterBackups() {
  const { adminApi } = useSuperLobster();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [backingUp, setBackingUp] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    adminApi('/api/admin/settings').then((s: any) => setSettings(s ?? {})).catch(() => {});
    adminApi<BackupFile[]>('/api/admin/backups').then(b => setBackups(b ?? [])).catch(() => {});
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const backupEnabled = settings.backup_enabled === 'true';

  const toggleBackups = async () => {
    setToggling(true);
    setError(null);
    try {
      await adminApi('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ backup_enabled: !backupEnabled }),
      });
      setSettings(prev => ({ ...prev, backup_enabled: String(!backupEnabled) }));
      setMessage(!backupEnabled ? 'Automatic backup engine activated.' : 'Automatic backup scheduler suspended.');
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  };

  const backupNow = async () => {
    setBackingUp(true);
    setError(null);
    try {
      const result = await adminApi<any>('/api/admin/backup', { method: 'POST' });
      setMessage(`Failsafe snapshot generated: ${(result.files ?? []).join(', ')}`);
      load();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBackingUp(false);
    }
  };

  const interval = parseInt(settings.backup_interval_minutes ?? '1440', 10);
  const intervalLabel = interval >= 1440 ? `Every ${Math.round(interval / 1440)} day(s)` : `Every ${interval} min`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold font-[Sora] text-theme-main tracking-tight flex items-center gap-2.5">
            <DatabaseBackup size={20} className="text-[#06b6d4]" />
            Failsafe Backup Engine
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Live SQLite Online Backup API snapshots, rotation, and offline restore protocols
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 text-theme-muted hover:text-theme-main rounded-xl bg-theme-surface border border-theme-subtle transition-colors cursor-pointer"
          title="Refresh backup ledger"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Hero Backup Controller Card */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="font-bold text-theme-main text-lg">Scheduled Backups</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                backupEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
              }`}>
                {backupEnabled ? 'ACTIVE' : 'SUSPENDED'}
              </span>
            </div>
            <p className="text-xs text-theme-muted leading-relaxed">
              {backupEnabled
                ? `${intervalLabel} encrypted snapshot cadence. Preserving last ${settings.backup_retention_count ?? 7} snapshot sets in DATA_DIR/backups/.`
                : 'Automated background backup timer is currently inactive. Manual one-shot snapshots remain available.'}
            </p>
          </div>

          <button
            onClick={toggleBackups}
            disabled={toggling}
            className={`relative w-16 h-9 rounded-full transition-all duration-300 cursor-pointer shrink-0 shadow-inner ${
              backupEnabled ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            title={backupEnabled ? 'Disable automatic backups' : 'Enable automatic backups'}
          >
            <span
              className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300 ${
                backupEnabled ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Manual Trigger Bar */}
        <div className="mt-6 pt-5 border-t border-theme-subtle/70 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-theme-main text-sm">Instant Snapshot</p>
            <p className="text-xs text-theme-muted">
              Live WAL-consistent copy of <code className="font-mono text-[11px] text-theme-main">db.sqlite</code> + <code className="font-mono text-[11px] text-theme-main">audit.sqlite</code>
            </p>
          </div>
          <button
            onClick={backupNow}
            disabled={backingUp}
            className="px-5 py-2.5 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#22d3ee] hover:to-[#06b6d4] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/20 hover:shadow-[#06b6d4]/40 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 text-xs cursor-pointer"
          >
            {backingUp ? (
              <><Loader2 size={14} className="animate-spin" /> Snapshotting Grotto…</>
            ) : (
              <><Zap size={14} /> Back Up Now</>
            )}
          </button>
        </div>

        {message && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Offline Disaster Recovery Callout */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-5 text-xs text-theme-muted space-y-3 shadow-sm relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/30 flex items-center justify-center shrink-0 text-[#06b6d4]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="font-bold text-theme-main text-sm">Sovereign Offline Restore Protocol</p>
            <p className="leading-relaxed mt-0.5">
              To prevent credential exfiltration (T6 threat model), backups are never downloaded or uploaded via HTTP. Restorations are performed directly on the host system:
            </p>
          </div>
        </div>

        <div className="bg-theme-base border border-theme-subtle rounded-xl p-3.5 font-mono text-[11px] text-theme-main space-y-2">
          <div className="flex items-center gap-2 text-[#06b6d4] font-bold">
            <Terminal size={13} />
            <span>Host Validation & Recovery CLI:</span>
          </div>
          <p className="text-theme-muted select-all bg-black/40 px-2.5 py-1.5 rounded border border-theme-subtle/50">
            npm run scuttle:restore -- --backup DATA_DIR/backups/backup-&lt;timestamp&gt; --key &lt;DB_ENCRYPTION_KEY&gt;
          </p>
        </div>
      </div>

      {/* Backup Ledger */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <HardDrive size={15} className="text-[#06b6d4]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-muted">
              Preserved Backup Sets ({backups.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-theme-muted">
            Directory: DATA_DIR/backups/
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="py-10 text-center text-theme-muted text-xs">
            <p>No backup snapshots recorded on disk yet.</p>
            <p className="text-[11px] text-theme-muted/60 mt-1">Enable automated scheduling or trigger "Back Up Now" above.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {backups.map(b => (
              <div
                key={b.name}
                className="flex items-center justify-between gap-3 bg-theme-base/70 border border-theme-subtle/80 hover:border-[#06b6d4]/30 rounded-xl px-4 py-3 text-xs transition-all duration-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCheck size={15} className="text-emerald-400 shrink-0" />
                  <span className="font-mono text-theme-main font-semibold truncate">{b.name}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 font-mono text-theme-muted">
                  <span className="px-2 py-0.5 rounded bg-theme-surface border border-theme-subtle text-[11px] text-theme-main font-bold">
                    {formatBytes(b.bytes)}
                  </span>
                  <span className="text-[11px] hidden sm:inline">
                    {new Date(b.created).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
