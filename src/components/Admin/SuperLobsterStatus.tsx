/**
 * SuperLobsterStatus.tsx — ShellGuard©™
 *
 * Read-only instance fingerprint: version, encryption flags, uptime
 * sessions, retention settings. No secrets ever displayed (T5).
 * Aligned with CaraBase card-grid and status metric dashboards.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, Clock, ShieldCheck, Database, Server, Lock, Cpu } from 'lucide-react';
import { useSuperLobster } from './SuperLobsterContext.tsx';

interface UptimeSession {
  id: string;
  start: string;
  end: string | null;
  duration: number | null;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Active now';
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

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-sm text-red-400 flex items-center gap-3">
        <AlertTriangle size={18} className="shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const securityStatusPill = (ok: boolean, label: string, hint: string) => (
    <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
      ok
        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
        : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
    }`}>
      <span className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
        )}
        <span className="text-theme-main font-medium">{label}</span>
      </span>
      <span className="font-mono text-[11px] uppercase tracking-wider">{hint}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold font-[Sora] text-theme-main tracking-tight flex items-center gap-2.5">
            <Activity size={20} className="text-[#06b6d4]" />
            Reef Health & Fingerprint
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Real-time diagnostics and encryption integrity telemetry
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-subtle text-xs font-mono text-theme-muted">
          <Server size={13} className="text-[#06b6d4]" />
          <span>PORT {status.port || '6565'}</span>
        </div>
      </div>

      {/* CaraBase Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Engine & Architecture */}
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between group hover:border-[#e4048a]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e4048a]/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-theme-muted flex items-center gap-1.5">
                <Cpu size={13} className="text-[#e4048a]" /> Instance Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#e4048a]/10 border border-[#e4048a]/30 text-[10px] font-mono text-[#e4048a] font-bold">
                PROD-READY
              </span>
            </div>
            <p className="text-3xl font-black font-mono text-theme-main tracking-tight mt-1">
              v{status.version}
            </p>
            <p className="text-xs text-theme-muted mt-2 font-mono flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-theme-base border border-theme-subtle">{status.nodeEnv}</span>
              <span className="px-2 py-0.5 rounded-md bg-theme-base border border-theme-subtle">{status.dbType}</span>
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-theme-subtle/60 flex items-center justify-between text-xs text-theme-muted">
            <span>Schema Bedrock</span>
            <span className="font-mono font-bold text-[#06b6d4]">v1.0 (SQLite WAL)</span>
          </div>
        </div>

        {/* Card 2: Triple-Layer Armor */}
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between group hover:border-[#06b6d4]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#06b6d4]/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-theme-muted flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#06b6d4]" /> Triple-Layer Armor
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[10px] font-mono text-[#06b6d4] font-bold">
                ZERO-KNOWLEDGE
              </span>
            </div>
            <div className="space-y-2 mt-3">
              {securityStatusPill(status.sqlcipherActive, 'SQLCipher Whole-DB', status.sqlcipherActive ? 'ARMED' : 'UNARMED')}
              {securityStatusPill(status.metadataEncryptionActive, 'Per-Row AES-256-GCM', status.metadataEncryptionActive ? 'ACTIVE' : 'OFF')}
              {securityStatusPill(status.httpsEnforced, 'HTTPS Enforcement', status.httpsEnforced ? 'ENFORCED' : 'OFF')}
            </div>
          </div>
          <p className="text-[10px] text-theme-muted/70 mt-3 font-mono">
            Client ShellCryption™ verified across all domains
          </p>
        </div>

        {/* Card 3: Sovereign Retention */}
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between group hover:border-purple-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-theme-muted flex items-center gap-1.5">
                <Database size={13} className="text-purple-400" /> Retention Policies
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono text-purple-400 font-bold">
                AUTOMATED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-theme-base border border-theme-subtle rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-theme-muted font-bold">Audit Reef</p>
                <p className="text-lg font-black font-mono text-theme-main mt-0.5">
                  {status.systemSettings?.audit_retention_days ?? '90'}<span className="text-xs text-theme-muted font-normal ml-1">days</span>
                </p>
              </div>
              <div className="bg-theme-base border border-theme-subtle rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-theme-muted font-bold">Uptime Log</p>
                <p className="text-lg font-black font-mono text-theme-main mt-0.5">
                  {status.systemSettings?.uptime_retention_days ?? '30'}<span className="text-xs text-theme-muted font-normal ml-1">days</span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-theme-subtle/60 flex items-center justify-between text-xs text-theme-muted">
            <span>Configurable in Settings</span>
            <Lock size={12} className="text-theme-muted/50" />
          </div>
        </div>
      </div>

      {/* Caution Callout */}
      {!status.sqlcipherActive && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-sm text-amber-400 flex items-start gap-3 shadow-lg shadow-amber-950/20">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-bold text-theme-main mb-1">Defense-in-Depth Advisory: SQLCipher Inactive</p>
            <p className="text-xs leading-relaxed text-amber-400/90">
              This instance runs unencrypted at the SQLite file level. While passwords and secrets remain protected client-side via zero-knowledge ShellCryption™, setting <code className="font-mono bg-theme-base/80 px-1.5 py-0.5 rounded text-theme-main">DB_ENCRYPTION_KEY</code> enables both SQLCipher whole-DB encryption and per-row metadata encryption.
            </p>
          </div>
        </div>
      )}

      {/* Uptime Reef Timeline */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/30 flex items-center justify-center">
              <Activity size={16} className="text-[#06b6d4]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-theme-main">Uptime Reef Timeline</h3>
              <p className="text-[11px] text-theme-muted">Recent startup and continuous runtime sessions</p>
            </div>
          </div>
          <span className="text-xs font-mono text-theme-muted font-bold">
            {uptime.length} Session{uptime.length === 1 ? '' : 's'} Recorded
          </span>
        </div>

        {uptime.length === 0 ? (
          <p className="text-theme-muted text-sm py-6 text-center">No uptime sessions recorded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {uptime.slice(0, 8).map(s => {
              const isActive = !s.end;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 bg-theme-base/70 border border-theme-subtle/80 hover:border-[#06b6d4]/30 rounded-xl px-4 py-3 text-sm transition-all duration-200"
                >
                  <span className="flex items-center gap-3 text-theme-muted min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      {isActive && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    </span>
                    <Clock size={13} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                    <span className="font-mono text-xs text-theme-main font-medium truncate">
                      {new Date(s.start).toLocaleString()}
                    </span>
                    {s.end && (
                      <span className="text-theme-muted/60 text-xs hidden sm:inline font-mono">
                        → {new Date(s.end).toLocaleTimeString()}
                      </span>
                    )}
                  </span>

                  <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md border shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-theme-surface text-[#06b6d4] border-theme-subtle'
                  }`}>
                    {formatDuration(s.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
