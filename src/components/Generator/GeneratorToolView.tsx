import React, { useState, useEffect, useMemo } from 'react';
import { 
  Copy, 
  RefreshCw, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  X, 
  User, 
  Tag, 
  FileText, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  FolderPlus, 
  History, 
  Trash2, 
  ArrowUpRight, 
  QrCode, 
  Smartphone, 
  Download, 
  Clock, 
  ClipboardX, 
  Zap,
  Globe,
  Sliders
} from 'lucide-react';
import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';
import { GeneratorOptions } from './GeneratorOptions.tsx';
import { FlickerRevealText } from './FlickerRevealText.tsx';
import { 
  getGlobalGeneratorConfig, 
  setGlobalGeneratorConfig, 
  generatePassword, 
  GeneratorConfig,
  evaluatePasswordComplexity,
  isTotpSecret,
  formatTotpUri
} from '../../lib/generator.ts';
import { 
  copyWithAutoClear, 
  subscribeClipboardState, 
  forceClearClipboardNow, 
  cancelClipboardAutoClear,
  ClipboardClearState 
} from '../../lib/clipboardManager.ts';
import { VaultItemType } from '../../types.ts';
import { motion, AnimatePresence } from 'motion/react';

interface GeneratorToolViewProps {
  onSaveToVault?: (item: {
    title: string;
    secret: string;
    username: string;
    url: string;
    category: string;
    type: VaultItemType;
    notes?: string;
    totp_secret?: string;
  }) => Promise<void>;
}

interface HistoryItem {
  id: string;
  secret: string;
  timestamp: number;
  type: "password" | "passphrase" | "totp";
}

const SESSION_HISTORY_KEY = "sg_generator_session_history";

export function GeneratorToolView({ onSaveToVault }: GeneratorToolViewProps) {
  const [config, setConfig] = useState<GeneratorConfig>(getGlobalGeneratorConfig());
  const [generated, setGenerated] = useState("");
  const [generationKey, setGenerationKey] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [copiedTotpUri, setCopiedTotpUri] = useState(false);

  // Global Clipboard Auto-Clear state subscription
  const [clipboardState, setClipboardState] = useState<ClipboardClearState>({
    isActive: false,
    secondsRemaining: 0,
    totalSeconds: 0,
    isCleared: false,
  });

  useEffect(() => {
    const unsubscribe = subscribeClipboardState((state) => {
      setClipboardState(state);
    });
    return unsubscribe;
  }, []);

  // QR Code & TOTP states
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [liveTotpCode, setLiveTotpCode] = useState<string>("");
  const [totpSecondsRemaining, setTotpSecondsRemaining] = useState<number>(30);

  // Session History (Last 5 generated passwords)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [revealedHistory, setRevealedHistory] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);

  // Save to Vault Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [modalSecret, setModalSecret] = useState("");
  const [saveTitle, setSaveTitle] = useState("");
  const [saveUsername, setSaveUsername] = useState("");
  const [saveUrl, setSaveUrl] = useState("");
  const [saveCategory, setSaveCategory] = useState("Personal");
  const [saveNotes, setSaveNotes] = useState("");
  const [showSecretInModal, setShowSecretInModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isCurrentSecretTotp = useMemo(() => {
    return config.type === "totp" || isTotpSecret(generated);
  }, [config.type, generated]);

  const totpUri = useMemo(() => {
    if (!generated) return "";
    return formatTotpUri(
      generated, 
      config.totpIssuer || "SeaGuard", 
      config.totpAccount || "User"
    );
  }, [generated, config.totpIssuer, config.totpAccount]);

  useEffect(() => {
    handleGenerate(config);
  }, [config]);

  // Dynamically generate QR code for secret if TOTP or when requested
  useEffect(() => {
    if (!generated) {
      setQrCodeDataUrl(null);
      return;
    }

    const payload = isCurrentSecretTotp ? totpUri : generated;

    QRCode.toDataURL(payload, {
      width: 200,
      margin: 1.5,
      color: {
        dark: '#031b26',
        light: '#ffffff'
      }
    })
      .then((dataUrl) => setQrCodeDataUrl(dataUrl))
      .catch((err) => {
        console.error("QR Code generation error:", err);
        setQrCodeDataUrl(null);
      });
  }, [generated, isCurrentSecretTotp, totpUri]);

  // Live TOTP code generator & countdown timer
  useEffect(() => {
    if (!isCurrentSecretTotp || !generated) {
      setLiveTotpCode("");
      return;
    }

    const clean = generated.replace(/[\s-]/g, "").toUpperCase();

    const updateTotp = () => {
      try {
        const totp = new OTPAuth.TOTP({
          issuer: config.totpIssuer || "SeaGuard",
          label: config.totpAccount || "User",
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(clean)
        });
        const token = totp.generate();
        setLiveTotpCode(`${token.slice(0, 3)} ${token.slice(3)}`);
        
        const epoch = Math.floor(Date.now() / 1000);
        const remaining = 30 - (epoch % 30);
        setTotpSecondsRemaining(remaining);
      } catch {
        setLiveTotpCode("");
      }
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [generated, isCurrentSecretTotp, config.totpIssuer, config.totpAccount]);

  const handleGenerate = (cfg: GeneratorConfig) => {
    const nextPassword = generatePassword(cfg);
    setGenerated(nextPassword);
    setGenerationKey((prev) => prev + 1);
    
    // Auto-show QR code when generating TOTP keys for convenient immediate scanning
    if (cfg.type === "totp") {
      setShowQrCode(true);
    }
    
    // Track in session history (last 5, avoid immediate consecutive duplicates)
    setHistory((prev) => {
      if (prev.length > 0 && prev[0].secret === nextPassword) {
        return prev;
      }
      const newItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        secret: nextPassword,
        timestamp: Date.now(),
        type: cfg.type,
      };
      const updated = [newItem, ...prev.filter(item => item.secret !== nextPassword)].slice(0, 5);
      try {
        sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // sessionStorage write fallback
      }
      return updated;
    });
  };

  const handleConfigChange = (newConfig: GeneratorConfig) => {
    setConfig(newConfig);
    setGlobalGeneratorConfig(newConfig); // Auto-save as global preference
  };

  const handleCopyRawPassword = async (targetPassword?: string, historyId?: string) => {
    const rawString = typeof targetPassword === 'string' ? targetPassword : generated;
    if (!rawString) return;

    await copyWithAutoClear(rawString, {
      label: config.type === "totp" ? "TOTP Key" : config.type === "passphrase" ? "Passphrase" : "Password",
      clearSeconds: config.clipboardClearSeconds ?? 30,
      overrideAutoClear: config.autoClearClipboard ?? true,
    });

    if (historyId) {
      setCopiedHistoryId(historyId);
      setTimeout(() => setCopiedHistoryId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleCopyTotpUri = async () => {
    if (!totpUri) return;
    await copyWithAutoClear(totpUri, {
      label: "TOTP URI",
      clearSeconds: config.clipboardClearSeconds ?? 30,
      overrideAutoClear: config.autoClearClipboard ?? true,
    });
    setCopiedTotpUri(true);
    setTimeout(() => setCopiedTotpUri(false), 2000);
  };

  const handleRestoreFromHistory = (item: HistoryItem) => {
    setGenerated(item.secret);
    setGenerationKey((prev) => prev + 1);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      sessionStorage.removeItem(SESSION_HISTORY_KEY);
    } catch {
      // sessionStorage clear
    }
  };

  const toggleHistoryReveal = (id: string) => {
    setRevealedHistory((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenSaveModal = (targetSecret?: string) => {
    const secretToSave = targetSecret || generated;
    setModalSecret(secretToSave);
    setSaveTitle(isCurrentSecretTotp ? (config.totpIssuer || "2FA Authenticator") : "");
    setSaveUsername(isCurrentSecretTotp ? (config.totpAccount || "") : "");
    setSaveUrl("");
    setSaveCategory("Personal");
    setSaveNotes("");
    setSaveError(null);
    setSaveSuccess(false);
    setShowSecretInModal(false);
    setIsSaveModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) {
      setSaveError("Please provide a name/title for this vault item.");
      return;
    }

    if (!onSaveToVault) {
      setSaveError("Vault persistence handler is unavailable.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const secretToSave = modalSecret || generated;
      await onSaveToVault({
        title: saveTitle.trim(),
        secret: secretToSave,
        username: saveUsername.trim(),
        url: saveUrl.trim(),
        category: saveCategory || "Personal",
        type: "password",
        totp_secret: isCurrentSecretTotp ? secretToSave : undefined,
        notes: saveNotes.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaveModalOpen(false);
        setSaveSuccess(false);
      }, 1400);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save item to vault.");
    } finally {
      setIsSaving(false);
    }
  };

  const complexity = evaluatePasswordComplexity(generated);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-theme-main flex items-center gap-2.5">
            <Zap className="text-claw-cyan" size={24} />
            <span>Password Generator</span>
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Generate cryptographically secure passwords, passphrases, and 2FA tokens.
          </p>
        </div>

        {/* History Quick Toggle Button */}
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showHistory
                ? 'bg-claw-cyan/15 border-claw-cyan/40 text-claw-cyan'
                : 'bg-theme-surface border-theme-subtle text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History size={14} />
            <span>Recent ({history.length})</span>
          </button>
        )}
      </div>

      {/* ── Active Clipboard Auto-Purge Countdown Banner ── */}
      <AnimatePresence>
        {clipboardState.isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-cyan-950/70 border border-claw-cyan/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-cyan-200 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-claw-cyan" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-claw-cyan">
                    <span>Auto-Purging Clipboard in</span>
                    <span className="font-mono bg-cyan-900 px-1.5 py-0.2 rounded border border-cyan-700 text-white font-black text-[11px]">
                      {clipboardState.secondsRemaining}s
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300/80">
                    Sensitive secret will be wiped from system clipboard memory
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => forceClearClipboardNow()}
                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Purge clipboard immediately"
                >
                  <ClipboardX size={12} />
                  <span>Purge Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => cancelClipboardAutoClear()}
                  className="px-2 py-1 bg-cyan-900/60 hover:bg-cyan-900 text-cyan-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Keep in clipboard"
                >
                  Keep
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Primary Generator Canvas Card ── */}
      <div className="bg-theme-surface rounded-3xl border border-theme-subtle shadow-xl overflow-hidden p-5 sm:p-6 space-y-5">
        
        {/* 1. Hero Secret Display & Dynamic Scramble Box */}
        <div className="relative">
          <motion.div 
            animate={{
              borderColor: copied ? '#10b981' : undefined,
              boxShadow: copied ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
            }}
            transition={{ duration: 0.2 }}
            className={`w-full bg-slate-100/70 dark:bg-slate-950 border-2 rounded-2xl p-6 sm:p-7 flex items-center justify-center min-h-[110px] break-all relative transition-colors overflow-hidden ${
              copied ? 'border-emerald-500 bg-emerald-500/5' : 'border-theme-subtle'
            }`}
          >
            <FlickerRevealText 
              text={generated} 
              triggerKey={generationKey}
              durationMs={380}
              className="text-xl sm:text-2xl font-mono text-theme-main font-bold text-center tracking-tight leading-relaxed select-all"
            />
          </motion.div>
        </div>

        {/* 2. Unified Action Command Toolbar (No redundant buttons) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Copy Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCopyRawPassword()}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer whitespace-nowrap ${
              copied
                ? 'bg-emerald-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-400'
                : 'bg-gradient-to-r from-claw-cyan to-deep-teal hover:from-cyan-500 hover:to-teal-600 text-white shadow-cyan-500/20'
            }`}
          >
            {copied ? (
              <>
                <Check size={17} className="stroke-[3]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={17} />
                <span>Copy {config.type === 'totp' ? 'Key' : 'Password'}</span>
              </>
            )}
          </motion.button>

          {/* Regenerate Action */}
          <button
            type="button"
            onClick={() => handleGenerate(config)}
            className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-theme-main rounded-xl transition-all shadow-xs cursor-pointer group flex items-center justify-center"
            title="Generate new secret"
          >
            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-300 text-claw-cyan" />
          </button>

          {/* Save to Vault Action */}
          <button
            type="button"
            onClick={() => handleOpenSaveModal()}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-theme-main text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            title="Save to Vault"
          >
            <FolderPlus size={16} className="text-claw-cyan" />
            <span className="hidden xs:inline">Save</span>
          </button>

          {/* QR Code Action Toggle */}
          <button
            type="button"
            onClick={() => setShowQrCode(!showQrCode)}
            className={`p-3 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center ${
              showQrCode
                ? 'bg-claw-cyan text-white shadow-cyan-500/20'
                : isCurrentSecretTotp
                  ? 'bg-claw-cyan/15 text-claw-cyan border border-claw-cyan/30 hover:bg-claw-cyan/25'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-theme-muted hover:text-theme-main'
            }`}
            title={showQrCode ? "Hide QR Code" : "Show QR Code"}
          >
            <QrCode size={18} />
          </button>
        </div>

        {/* 3. Sleek Mathematical Strength & Entropy Status */}
        <div className="p-3.5 bg-slate-50/60 dark:bg-slate-900/40 border border-theme-subtle rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {complexity.score >= 75 ? (
                <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
              ) : complexity.score >= 50 ? (
                <Shield className="text-amber-500 shrink-0" size={16} />
              ) : (
                <ShieldAlert className="text-red-500 shrink-0" size={16} />
              )}
              <span className="font-bold text-theme-main">Strength:</span>
              <span className={`font-bold ${complexity.textColor}`}>
                {complexity.level}
              </span>
            </div>

            <div className="flex items-center gap-2 text-theme-muted font-mono text-[11px]">
              <span>~{complexity.entropyBits} bits entropy</span>
              <span>•</span>
              <span>{complexity.crackTime}</span>
            </div>
          </div>

          {/* Segmented Strength Bar */}
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((seg) => {
              const segThreshold = seg * 20;
              const isActive = complexity.score >= segThreshold - 10;
              return (
                <div
                  key={seg}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? complexity.color : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* 4. Collapsible 2FA QR Code & Live Authenticator Preview */}
        <AnimatePresence>
          {(showQrCode || isCurrentSecretTotp) && qrCodeDataUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-claw-cyan/30 shadow-lg flex flex-col sm:flex-row items-center gap-4">
                {/* QR Code Canvas */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="bg-white p-2.5 rounded-xl shadow-md">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="TOTP Secret QR Code" 
                      className="w-32 h-32 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] text-cyan-300/80 mt-1 flex items-center gap-1 font-medium">
                    <Smartphone size={11} /> Scan with Authenticator
                  </span>
                </div>

                {/* Secret Details & Live Code */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-claw-cyan flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      {isCurrentSecretTotp ? "2FA TOTP Token" : "Secret QR Code"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      RFC 6238
                    </span>
                  </div>

                  {/* Live TOTP rolling preview */}
                  {isCurrentSecretTotp && liveTotpCode && (
                    <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-400">Live Code Preview</div>
                        <div className="text-xl font-mono font-black text-claw-cyan tracking-wider">
                          {liveTotpCode}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400">
                        <Clock size={13} />
                        <span>{totpSecondsRemaining}s</span>
                      </div>
                    </div>
                  )}

                  {/* QR Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isCurrentSecretTotp && (
                      <button
                        type="button"
                        onClick={handleCopyTotpUri}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                          copiedTotpUri 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {copiedTotpUri ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedTotpUri ? "URI Copied" : "Copy URI"}</span>
                      </button>
                    )}
                    
                    <a
                      href={qrCodeDataUrl}
                      download={`seaguard-totp-qr-${Date.now()}.png`}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>Download QR</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Generator Studio Configuration Tabs & Controls */}
        <GeneratorOptions config={config} onChange={handleConfigChange} />
      </div>

      {/* ── Progressive Session History (Recent Passwords Drawer) ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-theme-surface rounded-3xl border border-theme-subtle p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-claw-cyan" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                    Session History (Last {history.length} / 5)
                  </h3>
                </div>

                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-theme-muted hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
                    title="Clear Session History"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-4 text-xs text-theme-muted">
                  No secrets generated in this session yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item, index) => {
                    const isRevealed = revealedHistory[item.id] || false;
                    const isCopiedItem = copiedHistoryId === item.id;
                    const isCurrent = item.secret === generated;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrent 
                            ? 'bg-claw-cyan/5 border-claw-cyan/40' 
                            : 'bg-slate-50/60 dark:bg-slate-900/40 border-theme-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="text-xs font-mono font-bold text-theme-muted w-4">
                            #{index + 1}
                          </span>
                          <div className="overflow-hidden">
                            <div className="font-mono text-xs sm:text-sm font-bold text-theme-main truncate max-w-[180px] sm:max-w-[280px]">
                              {isRevealed ? item.secret : '•'.repeat(Math.min(item.secret.length, 20))}
                            </div>
                            <div className="text-[10px] text-theme-muted flex items-center gap-1.5 mt-0.5">
                              <span className="capitalize">{item.type}</span>
                              <span>•</span>
                              <span>{item.secret.length} chars</span>
                              {isCurrent && (
                                <span className="text-claw-cyan font-bold">• Active</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleHistoryReveal(item.id)}
                            className="p-1.5 text-theme-muted hover:text-theme-main rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isRevealed ? "Hide" : "Reveal"}
                          >
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          
                          <button
                            onClick={() => handleCopyRawPassword(item.secret, item.id)}
                            className={`p-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                              isCopiedItem
                                ? 'bg-emerald-500 text-white'
                                : 'text-theme-muted hover:text-theme-main hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                            title="Copy secret"
                          >
                            {isCopiedItem ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => handleRestoreFromHistory(item)}
                              className="p-1.5 text-theme-muted hover:text-theme-main rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Restore to generator"
                            >
                              <ArrowUpRight size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenSaveModal(item.secret)}
                            className="p-1.5 text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                            title="Save to Vault"
                          >
                            <FolderPlus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Save to Vault Modal ── */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-theme-surface w-full max-w-lg rounded-3xl border border-theme-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-theme-subtle flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-claw-cyan/10 text-claw-cyan rounded-xl">
                    <FolderPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-theme-main">Save to Secure Vault</h3>
                    <p className="text-xs text-theme-muted">Save generated secret directly into your encrypted vault</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="p-2 text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveSubmit} className="p-6 overflow-y-auto space-y-4">
                {saveSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 flex flex-col items-center justify-center text-center space-y-3 text-emerald-500"
                  >
                    <CheckCircle2 size={44} className="animate-bounce" />
                    <h4 className="text-base font-bold">Successfully Saved!</h4>
                    <p className="text-xs text-theme-muted">Your credential is encrypted and securely stored in your vault.</p>
                  </motion.div>
                ) : (
                  <>
                    {saveError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-medium">
                        {saveError}
                      </div>
                    )}

                    {/* Pre-populated Generated Secret Box */}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Secret to Save</span>
                        <span className={`text-[10px] font-mono ${evaluatePasswordComplexity(modalSecret).textColor}`}>
                          {evaluatePasswordComplexity(modalSecret).level} ({evaluatePasswordComplexity(modalSecret).score}/100)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSecretInModal ? "text" : "password"}
                          value={modalSecret}
                          onChange={(e) => setModalSecret(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-900 border border-theme-subtle rounded-xl px-3.5 py-2.5 pr-20 text-xs sm:text-sm font-mono text-theme-main outline-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowSecretInModal(!showSecretInModal)}
                            className="p-1.5 text-theme-muted hover:text-theme-main rounded-lg cursor-pointer"
                            title={showSecretInModal ? "Hide" : "Show"}
                          >
                            {showSecretInModal ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyRawPassword(modalSecret)}
                            className="p-1.5 text-theme-muted hover:text-theme-main rounded-lg cursor-pointer"
                            title="Copy Password"
                          >
                            <Copy size={15} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item Title */}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5">
                        Item Title <span className="text-lobster-red">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. GitHub, AWS, Work Email"
                        value={saveTitle}
                        onChange={(e) => setSaveTitle(e.target.value)}
                        className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3.5 py-2.5 text-sm text-theme-main outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-all"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5">
                        Username / Email
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                        <input
                          type="text"
                          placeholder="e.g. user@example.com"
                          value={saveUsername}
                          onChange={(e) => setSaveUsername(e.target.value)}
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-theme-main outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-all"
                        />
                      </div>
                    </div>

                    {/* URL */}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5">
                        Website / Service URL
                      </label>
                      <div className="relative">
                        <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                        <input
                          type="text"
                          placeholder="e.g. https://github.com"
                          value={saveUrl}
                          onChange={(e) => setSaveUrl(e.target.value)}
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-theme-main outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-all"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5">
                        Category
                      </label>
                      <div className="relative">
                        <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                        <input
                          type="text"
                          placeholder="e.g. Personal, Work, Finance"
                          value={saveCategory}
                          onChange={(e) => setSaveCategory(e.target.value)}
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-theme-main outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-all"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5">
                        Encrypted Notes
                      </label>
                      <div className="relative">
                        <FileText size={15} className="absolute left-3.5 top-3 text-theme-muted" />
                        <textarea
                          rows={2}
                          placeholder="Additional confidential notes..."
                          value={saveNotes}
                          onChange={(e) => setSaveNotes(e.target.value)}
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-theme-main outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-all"
                        />
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-3 border-t border-theme-subtle flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsSaveModalOpen(false)}
                        className="px-4 py-2.5 text-xs font-bold text-theme-muted hover:text-theme-main rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-gradient-to-r from-claw-cyan to-deep-teal hover:from-cyan-500 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Encrypting & Saving...</span>
                          </>
                        ) : (
                          <>
                            <FolderPlus size={14} />
                            <span>Save Item</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
