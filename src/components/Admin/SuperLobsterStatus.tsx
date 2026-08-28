/**
 * SuperLobsterStatus.tsx — ShellGuard©™
 *
 * Read-only instance fingerprint: version, encryption flags, uptime
 * sessions, retention settings. No secrets ever displayed (T5).
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useSuperLobster } from './SuperLobsterContext.tsx';

interface UptimeSession {
  id: string;
  start: string;
  end: string | null;
  duration: number | null;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SuperLobsterStatus() {
  const { adminApi } = useSuperLobster();
  const [status, setStatus] = useState<any>(null);
  const [uptime, setUptime] = useState<UptimeSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi('/api/admin/status'),
      adminApi<UptimeSession[]>('/api/admin/uptime').catch(() => []),
    ])
      .then(([s, u]) => { setStatus(s); setUptime(u); })
      .catch(err => setError(err.message));
  }, [adminApi]);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!status) return <p className="text-theme-muted text-sm animate-pulse">Scanning the reef…</p>;

  const flag = (ok: boolean, okText: string, offText: string) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${ok ? 'text-emerald-400' : 'text-amber-500'}`}>
      {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {ok ? okText : offText}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Fingerprint grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-bold text-theme-muted mb-2">Version</p>
          <p className="text-2xl font-black font-mono text-theme-main">v{status.version}</p>
          <p className="text-xs text-theme-muted mt-1">{status.nodeEnv} · {status.dbType}</p>
        </div>

        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-bold text-theme-muted mb-2">Encryption</p>
          <div className="space-y-1.5">
            {flag(status.sqlcipherActive, 'SQLCipher at rest', 'SQLCipher OFF — DB unencrypted')}
            {flag(status.metadataEncryptionActive, 'Per-row metadata', 'Per-row metadata OFF')}
            {flag(status.httpsEnforced, 'HTTPS enforced', 'HTTPS not enforced')}
          </div>
        </div>

        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-bold text-theme-muted mb-2">Retention (read-only)</p>
          <div className="space-y-1 text-sm text-theme-muted">
            <p>Audit: <span className="font-mono text-theme-main">{status.systemSettings?.audit_retention_days ?? '90'} days</span></p>
            <p>Uptime: <span className="font-mono text-theme-main">{status.systemSettings?.uptime_retention_days ?? '30'} days</span></p>
          </div>
          <p className="text-[10px] text-theme-muted/60 mt-2">Editable in Settings</p>
        </div>
      </div>

      {!status.sqlcipherActive && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-500">
          ⚠ This instance runs unencrypted at rest. Any backup taken now contains
          plaintext session tokens and LobsterKeys.
        </div>
      )}

      {/* Uptime history */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-claw-cyan" />
          <h2 className="text-sm font-black uppercase tracking-wider text-theme-muted">Uptime Reef</h2>
        </div>
        {uptime.length === 0 ? (
          <p className="text-theme-muted text-sm">No uptime sessions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {uptime.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 bg-theme-base border border-theme-subtle rounded-xl px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-theme-muted">
                  <Clock size={13} className={s.end ? 'text-slate-400' : 'text-emerald-400'} />
                  <span className="font-mono text-xs">{new Date(s.start).toLocaleString()}</span>
                  {s.end && <span className="text-theme-muted/50">→ {new Date(s.end).toLocaleTimeString()}</span>}
                </span>
                <span className="font-mono font-bold text-claw-cyan text-xs">{formatDuration(s.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
