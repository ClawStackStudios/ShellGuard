/**
 * SuperLobsterSettings.tsx — ShellGuard©™
 *
 * Whitelist-only settings editor (T5): retention days + backup config.
 * Everything else on the instance is read-only by design.
 * Aligned with CaraBase configuration forms and input presets.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { Settings2, Save, Loader2, Lock, CheckCircle2, AlertTriangle, Clock, Database } from 'lucide-react';
import { useSuperLobster } from './SuperLobsterContext.tsx';

export function SuperLobsterSettings() {
  const { adminApi } = useSuperLobster();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi('/api/admin/settings')
      .then((s: any) => setSettings(s ?? {}))
      .catch(err => setError(err.message));
  }, [adminApi]);

  const num = (key: string, fallback: number) => {
    const v = parseInt(settings[key] ?? '', 10);
    return Number.isNaN(v) ? fallback : v;
  };

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await adminApi('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          audit_retention_days: num('audit_retention_days', 90),
          uptime_retention_days: num('uptime_retention_days', 30),
          backup_interval_minutes: num('backup_interval_minutes', 1440),
          backup_retention_count: num('backup_retention_count', 7),
        }),
      });
      setFeedback('Operational parameters saved to instance state.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderFieldWithPresets = (
    key: string,
    label: string,
    unit: string,
    hint: string,
    presets: Array<{ label: string; value: number }>
  ) => {
    const currentValue = num(key, 0);
    return (
      <div className="bg-theme-base/60 border border-theme-subtle/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-theme-main">
            {label}
          </label>
          <span className="text-[10px] font-mono font-bold text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20 px-2 py-0.5 rounded">
            {unit}
          </span>
        </div>

        <div className="relative">
          <input
            type="number"
            min={1}
            value={settings[key] ?? ''}
            onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full bg-theme-surface border border-theme-subtle rounded-xl px-4 py-2.5 text-sm font-mono text-theme-main focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] outline-none transition-all shadow-sm"
          />
        </div>

        {/* Preset quick-chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] text-theme-muted uppercase font-bold mr-1">Presets:</span>
          {presets.map(p => {
            const isSelected = currentValue === p.value;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, [key]: String(p.value) }))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/40 shadow-sm'
                    : 'bg-theme-surface hover:bg-theme-base text-theme-muted hover:text-theme-main border-theme-subtle'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-theme-muted leading-relaxed">{hint}</p>
      </div>
    );
  };

  if (error && !settings) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-sm text-red-400 flex items-center gap-3">
        <AlertTriangle size={18} className="shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header title */}
      <div>
        <h2 className="text-xl font-bold font-[Sora] text-theme-main tracking-tight flex items-center gap-2.5">
          <Settings2 size={20} className="text-[#06b6d4]" />
          Instance Configuration
        </h2>
        <p className="text-xs text-theme-muted mt-0.5">
          Operational log retention policies and automated backup cadences
        </p>
      </div>

      {/* Env-Ownership Lock Notice */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-5 text-xs text-theme-muted flex items-start gap-3 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
          <Lock size={16} />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-theme-main text-sm">Strict Environment Key Ownership</p>
          <p className="leading-relaxed">
            Only operational parameters are modifiable here. Cryptographic master keys
            (<code className="font-mono text-amber-400 font-bold">DB_ENCRYPTION_KEY</code>, <code className="font-mono text-amber-400 font-bold">ADMIN_TOKEN</code>,
            and token TTLs) are bound strictly to environment variables. Changing encryption keys via web interface is permanently prohibited to prevent key-loss paths.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Section: Retention */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-muted flex items-center gap-2 mb-4">
            <Clock size={14} className="text-[#06b6d4]" /> Retention & Pruning Policies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldWithPresets(
              'audit_retention_days',
              'Audit Reef Retention',
              'Days',
              'How long security, auth, and mutation audit events are stored in audit.sqlite. (Default: 90 days)',
              [
                { label: '30d', value: 30 },
                { label: '90d', value: 90 },
                { label: '180d', value: 180 },
                { label: '365d', value: 365 },
              ]
            )}

            {renderFieldWithPresets(
              'uptime_retention_days',
              'Uptime Session Retention',
              'Days',
              'How long SYSTEM_START and SHUTDOWN heartbeat records are retained. (Default: 30 days)',
              [
                { label: '7d', value: 7 },
                { label: '14d', value: 14 },
                { label: '30d', value: 30 },
                { label: '90d', value: 90 },
              ]
            )}
          </div>
        </div>

        {/* Section: Backups */}
        <div className="pt-4 border-t border-theme-subtle/70">
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-muted flex items-center gap-2 mb-4">
            <Database size={14} className="text-[#e4048a]" /> Automated Backup Engine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldWithPresets(
              'backup_interval_minutes',
              'Backup Cadence',
              'Minutes',
              'Interval between live SQLite Online Backup snapshots. Minimum 15 minutes. (Default: 1440 = 24h)',
              [
                { label: '15m', value: 15 },
                { label: '1h', value: 60 },
                { label: '12h', value: 720 },
                { label: '24h', value: 1440 },
                { label: '7d', value: 10080 },
              ]
            )}

            {renderFieldWithPresets(
              'backup_retention_count',
              'Backup Sets Kept',
              'Snapshots',
              'Number of historical snapshot sets preserved on disk before rotation purges oldest. (Default: 7)',
              [
                { label: '3 sets', value: 3 },
                { label: '7 sets', value: 7 },
                { label: '14 sets', value: 14 },
                { label: '30 sets', value: 30 },
              ]
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#22d3ee] hover:to-[#06b6d4] text-white font-bold rounded-xl shadow-lg shadow-[#06b6d4]/20 hover:shadow-[#06b6d4]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2 text-xs cursor-pointer"
          >
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> Saving Changes…</>
            ) : (
              <><Save size={15} /> Save Operational Settings</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
