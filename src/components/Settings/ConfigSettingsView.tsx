import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { restAdapter } from '../../services/api/restAdapter.ts';

export function ConfigSettingsView() {
  const [retentionWindow, setRetentionWindow] = useState<number>(30); // 30m, 60m, 90m, or 0 (Manual)
  const [autoGraduate, setAutoGraduate] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    restAdapter.GET<{ retention_window_minutes?: number; auto_graduate_edit?: boolean }>('/api/settings/import_lifecycle')
      .then((res) => {
        if (res && res.retention_window_minutes !== undefined) {
          setRetentionWindow(res.retention_window_minutes);
        }
        if (res && res.auto_graduate_edit !== undefined) {
          setAutoGraduate(res.auto_graduate_edit);
        }
      })
      .catch((err) => {
        console.warn('Could not load import lifecycle preferences, using defaults:', err);
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
        <h2 className="text-3xl font-black text-theme-main flex items-center gap-3">
          <Settings className="text-claw-cyan" size={30} />
          Configuration
        </h2>
        <p className="text-theme-muted mt-1">
          Manage system lifecycle behaviors, ephemeral quarantine retention, and auto-graduation rules.
        </p>
      </div>

      <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden shadow-sm">
        <div className="p-6 border-b border-theme-subtle">
          <div className="flex items-center gap-2 text-theme-main">
            <Clock className="text-claw-cyan" size={20} />
            <h3 className="text-lg font-bold">Import Lifecycle & Ephemeral Quarantine</h3>
          </div>
          <p className="text-sm text-theme-muted mt-1">
            Configure how long newly imported batches remain in the quarantine inspection window before auto-graduating to permanent vault status.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Retention Window Segmented Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Quarantine Retention Window
            </label>
            <div className="flex bg-theme-base border border-theme-subtle rounded-xl overflow-hidden text-sm font-semibold">
              {[30, 60, 90, 0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRetentionWindow(val)}
                  className={`flex-1 py-3 text-center transition-all cursor-pointer border-r last:border-r-0 border-theme-subtle ${
                    retentionWindow === val
                      ? 'bg-claw-cyan text-ocean-dark font-black shadow-sm'
                      : 'text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {val === 0 ? 'Manual / Never' : `${val} min`}
                </button>
              ))}
            </div>
            <p className="text-xs text-theme-muted mt-2 leading-relaxed">
              Imported items will feature a bioluminescent countdown badge and remain eligible for instant batch rollback.
              Selecting <strong>Manual / Never</strong> keeps imported records in quarantine until you explicitly graduate them or edit them.
            </p>
          </div>

          {/* Auto-Graduate on Edit Toggle */}
          <div className="flex items-center justify-between p-4 bg-theme-base border border-theme-subtle rounded-2xl">
            <div className="pr-4">
              <div className="text-sm font-bold text-theme-main mb-1 flex items-center gap-2">
                <ShieldCheck size={16} className="text-claw-cyan" />
                Auto-Graduate on Edit
              </div>
              <div className="text-xs text-theme-muted leading-relaxed">
                Automatically graduate an imported item to the permanent vault when you edit or curate it.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoGraduate}
                onChange={(e) => setAutoGraduate(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-claw-cyan"></div>
            </label>
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-3 bg-claw-cyan hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-ocean-dark font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-claw-cyan/20 w-full sm:w-auto"
            >
              {isSaving ? (
                <span className="inline-block animate-spin">🐚</span>
              ) : (
                <Save size={16} />
              )}
              <span>Save Configuration</span>
            </button>
          </div>

          <AnimatePresence>
            {savedSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3.5 bg-claw-cyan/10 border border-claw-cyan/30 rounded-xl text-claw-cyan text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Configuration successfully saved and applied.</span>
              </motion.div>
            )}

            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3.5 bg-lobster-red/10 border border-lobster-red/30 rounded-xl text-lobster-red text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle size={16} />
                <span>{saveError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
