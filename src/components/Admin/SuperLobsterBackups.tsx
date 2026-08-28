/**
 * SuperLobsterBackups.tsx — ShellGuard©™
 *
 * The buttery-smooth failsafe: toggle backups on/off, hit "Back up now",
 * watch the encrypted copies land in DATA_DIR/backups/. No download —
 * ever (T6). Restore is offline by design (ADMIN.md §5).
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { DatabaseBackup, Loader2, Zap, CheckCircle2, HardDriveDownload } from 'lucide-react';
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
      setMessage(!backupEnabled ? 'Automatic backups enabled.' : 'Automatic backups disabled.');
      setTimeout(() => setMessage(null), 3000);
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
      const result = await adminApi('/api/admin/backup', { method: 'POST' });
      setMessage(`Backup written: ${(result.files ?? []).join(', ')}`);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBackingUp(false);
    }
  };

  const interval = parseInt(settings.backup_interval_minutes ?? '1440', 10);
  const intervalLabel = interval >= 1440 ? `every ${Math.round(interval / 1440)} day(s)` : `every ${interval} min`;
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <DatabaseBackup size={16} className="text-claw-cyan" />
        <h2 className="text-sm font-black uppercase tracking-wider text-theme-muted">Failsafe Backups</h2>
      </div>

      {/* The big toggle */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-theme-main text-lg">Automatic Backups</p>
            <p className="text-sm text-theme-muted">
              {backupEnabled
                ? <>ON — encrypted snapshots {intervalLabel}, keeping last {settings.backup_retention_count ?? 7}.</>
                : 'OFF — no scheduled backups are taken.'}
            </p>
          </div>
          <button
            onClick={toggleBackups}
            disabled={toggling}
            className={`relative w-16 h-9 rounded-full transition-colors cursor-pointer shrink-0 ${
              backupEnabled ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
            title={backupEnabled ? 'Disable automatic backups' : 'Enable automatic backups'}
          >
            <span
              className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow transition-all ${
                backupEnabled ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-5 pt-5 border-t border-theme-subtle flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-theme-main">Back up now</p>
            <p className="text-xs text-theme-muted">One-shot snapshot of db.sqlite + audit.sqlite (Online Backup API — WAL-safe).</p>
          </div>
          <button
            onClick={backupNow}
            disabled={backingUp}
            className="px-5 py-2.5 bg-gradient-to-r from-claw-cyan to-deep-teal hover:from-cyan-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
          >
            {backingUp ? <><Loader2 size={15} className="animate-spin" /> Snapshotting…</> : <><Zap size={15} /> Back Up Now</>}
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={14} /> {message}</p>}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>

      {/* Restore notice */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-5 text-sm text-theme-muted flex items-start gap-3">
        <HardDriveDownload size={18} className="text-claw-cyan mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-theme-main mb-1">Restoring is offline by design</p>
          <p className="leading-relaxed">
            There is deliberately no download or upload here. To restore: stop the instance, copy a
            backup into <code className="font-mono text-xs bg-theme-base px-1.5 py-0.5 rounded">DATA_DIR</code>,
            set <code className="font-mono text-xs bg-theme-base px-1.5 py-0.5 rounded">DB_ENCRYPTION_KEY</code> to
            the key in force at backup time, start. Full procedure in <code className="font-mono text-xs">ADMIN.md</code>.
          </p>
        </div>
      </div>
      {/* Backup list */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-5">
        <p className="text-[10px] uppercase tracking-widest font-bold text-theme-muted mb-3">
          Backup sets ({backups.length}) — DATA_DIR/backups/
        </p>
        {backups.length === 0 ? (
          <p className="text-theme-muted text-sm">No backups yet. Toggle on or hit "Back up now".</p>
        ) : (
          <div className="space-y-2">
            {backups.map(b => (
              <div key={b.name} className="flex items-center justify-between gap-3 bg-theme-base border border-theme-subtle rounded-xl px-4 py-2.5 text-sm">
                <span className="font-mono text-xs text-theme-main truncate">{b.name}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-theme-muted">{formatBytes(b.bytes)}</span>
                  <span className="font-mono text-xs text-theme-muted">{new Date(b.created).toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
