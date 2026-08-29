import React, { useState } from 'react';
import { GeneratorConfig } from '../../lib/generator.ts';
import { 
  Hash, 
  WholeWord, 
  QrCode, 
  Clock, 
  ShieldCheck, 
  Settings2, 
  ChevronDown,
  Sparkles,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GeneratorOptionsProps {
  config: GeneratorConfig;
  onChange: (config: GeneratorConfig) => void;
  defaultAccount?: string;
}

export function GeneratorOptions({ config, onChange, defaultAccount }: GeneratorOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (updates: Partial<GeneratorConfig>) => {
    onChange({ ...config, ...updates });
  };

  const autoClear = config.autoClearClipboard ?? true;
  const clearSeconds = config.clipboardClearSeconds ?? 30;

  const durationOptions = [
    { label: "10s", value: 10 },
    { label: "20s", value: 20 },
    { label: "30s", value: 30, optimal: true },
    { label: "60s", value: 60 },
    { label: "2m", value: 120 },
    { label: "5m", value: 300 },
  ];

  const passwordLengthPresets = [12, 16, 24, 32, 64];
  const passphraseWordPresets = [3, 4, 5, 6, 8];
  const separatorOptions = ["-", "_", ".", " ", "#"];

  const effectiveAccount = config.totpAccount !== undefined ? config.totpAccount : (defaultAccount || "User");

  return (
    <div className="space-y-5">
      {/* ── Mode Selector Tabs for Password vs Passphrase (when in Password mode) ── */}
      {config.type !== 'totp' && (
        <div className="bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-theme-subtle flex gap-1">
          <button
            type="button"
            onClick={() => update({ type: "password" })}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              config.type === 'password'
                ? 'bg-claw-cyan text-white shadow-md shadow-cyan-500/20'
                : 'text-theme-muted hover:text-theme-main hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Hash size={15} />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => update({ type: "passphrase" })}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              config.type === 'passphrase'
                ? 'bg-claw-cyan text-white shadow-md shadow-cyan-500/20'
                : 'text-theme-muted hover:text-theme-main hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <WholeWord size={15} />
            <span>Passphrase</span>
          </button>
        </div>
      )}

      {/* ── Mode 1: Random Password Controls ── */}
      {config.type === 'password' && (
        <div className="space-y-4 pt-1">
          {/* Length slider with quick preset pills */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-theme-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={15} className="text-claw-cyan" />
                <label className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                  Password Length
                </label>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {passwordLengthPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => update({ length: preset })}
                      className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md transition-colors cursor-pointer ${
                        config.length === preset
                          ? 'bg-claw-cyan text-white shadow-xs'
                          : 'text-theme-muted hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <span className="text-sm font-mono font-black text-claw-cyan bg-claw-cyan/10 px-2.5 py-0.5 rounded-lg border border-claw-cyan/20">
                  {config.length}
                </span>
              </div>
            </div>

            <input
              type="range"
              min="6"
              max="64"
              value={config.length}
              onChange={(e) => update({ length: parseInt(e.target.value, 10) })}
              className="w-full accent-claw-cyan h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Character Set Toggles (Modern Interactive Chips) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: 'uppercase', label: 'Uppercase', chars: 'A-Z', state: config.uppercase },
              { key: 'lowercase', label: 'Lowercase', chars: 'a-z', state: config.lowercase },
              { key: 'numbers', label: 'Numbers', chars: '0-9', state: config.numbers },
              { key: 'symbols', label: 'Symbols', chars: '!@#$', state: config.symbols },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => update({ [item.key]: !item.state } as any)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  item.state
                    ? 'bg-claw-cyan/10 border-claw-cyan/50 text-theme-main shadow-xs'
                    : 'bg-slate-50/40 dark:bg-slate-900/30 border-theme-subtle text-theme-muted hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-theme-main">{item.label}</span>
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] transition-colors ${
                    item.state ? 'bg-claw-cyan text-white' : 'border border-slate-300 dark:border-slate-600'
                  }`}>
                    {item.state && <ShieldCheck size={12} className="stroke-[3]" />}
                  </div>
                </div>
                <span className="text-[11px] font-mono opacity-70 font-semibold">{item.chars}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Mode 2: Passphrase Controls ── */}
      {config.type === 'passphrase' && (
        <div className="space-y-4 pt-1">
          {/* Word Count Slider */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-theme-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WholeWord size={15} className="text-claw-cyan" />
                <label className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                  Word Count
                </label>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {passphraseWordPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => update({ wordCount: preset })}
                      className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md transition-colors cursor-pointer ${
                        config.wordCount === preset
                          ? 'bg-claw-cyan text-white shadow-xs'
                          : 'text-theme-muted hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
                      }`}
                    >
                      {preset}w
                    </button>
                  ))}
                </div>
                <span className="text-sm font-mono font-black text-claw-cyan bg-claw-cyan/10 px-2.5 py-0.5 rounded-lg border border-claw-cyan/20">
                  {config.wordCount} words
                </span>
              </div>
            </div>

            <input
              type="range"
              min="3"
              max="12"
              value={config.wordCount}
              onChange={(e) => update({ wordCount: parseInt(e.target.value, 10) })}
              className="w-full accent-claw-cyan h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Word Separator & Modifiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Separator Chooser */}
            <div className="bg-slate-50/60 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-theme-subtle space-y-2">
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">
                Separator
              </label>
              <div className="flex items-center gap-1.5">
                {separatorOptions.map((sep) => (
                  <button
                    key={sep}
                    type="button"
                    onClick={() => update({ separator: sep })}
                    className={`flex-1 py-1.5 font-mono text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      config.separator === sep
                        ? 'bg-claw-cyan text-white border-claw-cyan shadow-xs'
                        : 'bg-theme-base border-theme-subtle text-theme-muted hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {sep === ' ' ? 'Space' : sep}
                  </button>
                ))}
              </div>
            </div>

            {/* Capitalize Toggle */}
            <button
              type="button"
              onClick={() => update({ capitalize: !config.capitalize })}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                config.capitalize
                  ? 'bg-claw-cyan/10 border-claw-cyan/50 text-theme-main'
                  : 'bg-slate-50/40 dark:bg-slate-900/30 border-theme-subtle text-theme-muted'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-theme-main">Capitalize</span>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                  config.capitalize ? 'bg-claw-cyan text-white' : 'border border-slate-300 dark:border-slate-600'
                }`}>
                  {config.capitalize && <ShieldCheck size={12} className="stroke-[3]" />}
                </div>
              </div>
              <span className="text-[11px] font-mono opacity-70">Word1-Word2</span>
            </button>

            {/* Number Toggle */}
            <button
              type="button"
              onClick={() => update({ includeNumber: !config.includeNumber })}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                config.includeNumber
                  ? 'bg-claw-cyan/10 border-claw-cyan/50 text-theme-main'
                  : 'bg-slate-50/40 dark:bg-slate-900/30 border-theme-subtle text-theme-muted'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-theme-main">Include Number</span>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                  config.includeNumber ? 'bg-claw-cyan text-white' : 'border border-slate-300 dark:border-slate-600'
                }`}>
                  {config.includeNumber && <ShieldCheck size={12} className="stroke-[3]" />}
                </div>
              </div>
              <span className="text-[11px] font-mono opacity-70">Append 0-9</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Mode 3: 2FA TOTP Key Controls ── */}
      {config.type === 'totp' && (
        <div className="space-y-4 pt-1">
          {/* Key Length Selector */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-theme-subtle space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted">
              Base32 Secret Length
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => update({ totpLength: 16 })}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  (config.totpLength || 32) === 16
                    ? 'bg-claw-cyan/10 border-claw-cyan text-claw-cyan shadow-xs'
                    : 'bg-theme-base border-theme-subtle text-theme-muted hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-theme-main">Standard (16 chars)</div>
                  <div className="text-[10px] text-theme-muted font-normal">80-bit RFC 6238</div>
                </div>
                {(config.totpLength || 32) === 16 && <ShieldCheck size={16} className="text-claw-cyan" />}
              </button>

              <button
                type="button"
                onClick={() => update({ totpLength: 32 })}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  (config.totpLength || 32) === 32
                    ? 'bg-claw-cyan/10 border-claw-cyan text-claw-cyan shadow-xs'
                    : 'bg-theme-base border-theme-subtle text-theme-muted hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-theme-main">High Security (32 chars)</div>
                  <div className="text-[10px] text-theme-muted font-normal">160-bit (Recommended)</div>
                </div>
                {(config.totpLength || 32) === 32 && <ShieldCheck size={16} className="text-claw-cyan" />}
              </button>
            </div>
          </div>

          {/* Issuer and Account Labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                Authenticator Issuer
              </label>
              <input
                type="text"
                value={config.totpIssuer || "ShellGuard"}
                onChange={(e) => update({ totpIssuer: e.target.value })}
                placeholder="e.g. ShellGuard, GitHub, AWS"
                className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3.5 py-2.5 text-sm text-theme-main outline-none focus:border-claw-cyan transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                Account / Username
              </label>
              <input
                type="text"
                value={effectiveAccount}
                onChange={(e) => update({ totpAccount: e.target.value })}
                placeholder={`e.g. ${defaultAccount || "user@domain.com"}`}
                className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3.5 py-2.5 text-sm text-theme-main outline-none focus:border-claw-cyan transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Progressive Disclosure: Clipboard & Security Settings Drawer ── */}
      <div className="pt-2 border-t border-theme-subtle">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-2 text-xs font-bold text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-claw-cyan" />
            <span>Clipboard Security & Auto-Purge Settings</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              autoClear ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              {autoClear ? `${clearSeconds}s purge` : 'Off'}
            </span>
          </div>
          <ChevronDown size={14} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-3 space-y-3"
            >
              <div className="p-4 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl border border-theme-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-theme-main">Auto-Clear Clipboard</div>
                    <div className="text-[11px] text-theme-muted">
                      Wipes sensitive copied secrets from system memory after the chosen duration.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={autoClear}
                      onChange={(e) => update({ autoClearClipboard: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-claw-cyan"></div>
                  </label>
                </div>

                {autoClear && (
                  <div className="pt-2 border-t border-theme-subtle/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-theme-muted">Purge after:</span>
                    <div className="flex items-center gap-1">
                      {durationOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update({ clipboardClearSeconds: opt.value, autoClearClipboard: true })}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            clearSeconds === opt.value
                              ? 'bg-claw-cyan text-white shadow-xs'
                              : 'bg-theme-base border border-theme-subtle text-theme-muted hover:border-claw-cyan hover:text-theme-main'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
