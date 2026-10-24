import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { restAdapter } from '../../services/api/restAdapter.ts';
import { motion } from 'framer-motion';

export function ConfigSettingsView() {
  const [retentionWindow, setRetentionWindow] = useState<number>(30); // 30m, 60m, 90m, or 0 (Manual)
  const [autoGraduate, setAutoGraduate] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    restAdapter.GET<{ retention_window_minutes?: number; auto_graduate_edit?: boolean }>('/api/settings/import_lifecycle').then((res) => {
      if (res.retention_window_minutes !== undefined) {
        setRetentionWindow(res.retention_window_minutes);
      }
      if (res.auto_graduate_edit !== undefined) {
        setAutoGraduate(res.auto_graduate_edit);
      }
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    try {
      await restAdapter.PUT('/api/settings/import_lifecycle', {
        retention_window_minutes: retentionWindow,
        auto_graduate_edit: autoGraduate,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-3xl font-black text-theme-main">Configuration</h2>
        <p className="text-theme-muted mt-1">Manage global system behaviors.</p>
      </div>

      <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">
        <div className="p-6 border-b border-theme-subtle">
          <h3 className="text-lg font-bold flex items-center gap-2 text-theme-main">
            <Settings className="text-claw-cyan" size={20} />
            Import Lifecycle & Ephemeral Quarantine
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure how long imported items remain in quarantine before auto-graduating to the permanent vault.
          </p>
        </div>
        <div className="p-6 space-y-6">

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Retention Window
            </label>
            <div className="flex bg-theme-base border border-theme-subtle rounded-xl overflow-hidden text-sm font-semibold">
              {[30, 60, 90, 0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRetentionWindow(val)}
                  className={`flex-1 py-3 text-center transition-colors cursor-pointer border-r last:border-r-0 border-theme-subtle ${
                    retentionWindow === val
                      ? 'bg-claw-cyan text-ocean-dark'
                      : 'text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {val === 0 ? 'Manual' : `${val}m`}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Imported items will show a bioluminescent badge and remain eligible for rapid batch purge until the timer expires.
              Selecting <strong>Manual</strong> means items remain quarantined until you explicitly approve them.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-theme-base border border-theme-subtle rounded-xl">
            <div>
              <div className="text-sm font-bold text-theme-main mb-1">Auto-Graduate on Edit</div>
              <div className="text-xs text-slate-500">Automatically clear the quarantine flag when you modify an imported item.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoGraduate}
                onChange={(e) => setAutoGraduate(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-claw-cyan"></div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-3 bg-claw-cyan hover:bg-claw-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed text-ocean-dark font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm w-full sm:w-auto"
            >
              {isSaving ? (
                <span className="inline-block animate-spin">🐚</span>
              ) : (
                <Save size={16} />
              )}
              <span>Save Configuration</span>
            </button>
          </div>

          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-claw-cyan/10 border border-claw-cyan/30 rounded-xl text-claw-cyan text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 size={15} />
              <span>Configuration successfully applied.</span>
            </motion.div>
          )}

          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-lobster-red/10 border border-lobster-red/30 rounded-xl text-lobster-red text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle size={15} />
              <span>{saveError}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
