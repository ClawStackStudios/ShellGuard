/**
 * SuperLobsterSettings.tsx — ShellGuard©™
 *
 * Whitelist-only settings editor (T5): retention days + backup config.
 * Everything else on the instance is read-only by design.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { Settings2, Save, Loader2, Lock } from 'lucide-react';
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
      setFeedback('Settings saved.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: string, label: string, hint: string) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">{label}</label>
      <input
        type="number"
        value={settings[key] ?? ''}
        onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
        className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm font-mono text-theme-main focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none"
      />
      <p className="text-[11px] text-theme-muted/70 mt-1.5">{hint}</p>
    </div>
  );

  if (error && !settings) return <p className="text-red-500 text-sm">{error}</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings2 size={16} className="text-claw-cyan" />
        <h2 className="text-sm font-black uppercase tracking-wider text-theme-muted">System Settings</h2>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-500 flex items-start gap-2">
        <Lock size={16} className="mt-0.5 shrink-0" />
        <p>
          Only operational settings are editable here. Crypto configuration
          (<code className="font-mono text-xs">DB_ENCRYPTION_KEY</code>, <code className="font-mono text-xs">ADMIN_TOKEN</code>,
          TTLs) is env-owned by design — changing keys from a web panel would be a data-loss path.
        </p>
      </div>

      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {field('audit_retention_days', 'Audit Retention (days)', 'How long non-system audit events are kept. Default 90.')}
          {field('uptime_retention_days', 'Uptime Retention (days)', 'How long SYSTEM_START/SHUTDOWN events are kept. Default 30.')}
          {field('backup_interval_minutes', 'Backup Interval (minutes)', 'Minimum 15. Default 1440 (daily). Backup toggle lives in Backups.')}
          {field('backup_retention_count', 'Backup Retention (count)', 'How many backup sets to keep. Default 7.')}
        </div>

        {feedback && <p className="text-sm text-emerald-400">{feedback}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-claw-cyan to-deep-teal hover:from-cyan-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
        >
          {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
