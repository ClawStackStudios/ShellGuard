import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  User, 
  ArrowRight, 
  Loader2, 
  Shield, 
  Copy, 
  Check, 
  Zap, 
  Download, 
  ArrowLeft, 
  Key, 
  CheckCircle2,
  X
} from "lucide-react";
import { 
  generateUUID, 
  generateHumanKey, 
  hashToken, 
  downloadIdentityFile 
} from "../lib/crypto.ts";
import { deriveShellKey } from "../lib/shellCryption.ts";
import { restAdapter } from "../services/api/restAdapter.ts";
import { InteractiveBrand } from "./Branding/InteractiveBrand.tsx";

interface SetupViewProps {
  onSuccess: (lobster: { uuid: string; username: string; displayName?: string }, token: string, shellKey: CryptoKey, rk: string) => void;
  onSwitch: () => void;
  onCancel?: () => void;
}

export function SetupView({ onSuccess, onSwitch, onCancel }: SetupViewProps) {
  const [step, setStep] = useState<"hatching" | "verification" | "success">("hatching");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [wizardState, setWizardState] = useState<{ uuid: string; key: string } | null>(null);
  const [isHatching, setIsHatching] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const validateUsername = (val: string) => {
    return /^[a-z0-9_-]{3,32}$/.test(val);
  };

  const startHatching = () => {
    if (!validateUsername(username)) return;
    setIsHatching(true);
    setError(null);

    setTimeout(() => {
      const uuid = generateUUID();
      const key = generateHumanKey();
      setWizardState({ uuid, key });
      setIsHatching(false);
      setStep("verification");
    }, 1000);
  };

  const handleCopy = () => {
    if (!wizardState) return;
    navigator.clipboard.writeText(wizardState.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!wizardState) return;
    downloadIdentityFile(username, wizardState.uuid, wizardState.key, displayName || username);
    setIsDownloaded(true);
  };

  const completeWizard = async () => {
    if (!wizardState || !isDownloaded) return;
    setIsCompleting(true);
    setError(null);

    try {
      const keyHash = await hashToken(wizardState.key);
      
      // 1. Register the new identity
      const reg = await restAdapter.POST("/api/auth/register", { 
        username, 
        displayName: displayName || undefined,
        keyHash, 
        uuid: wizardState.uuid 
      });
      
      // 2. Exchange key hash for an API token (Login)
      const pearl = await restAdapter.POST("/api/auth/token", { 
        uuid: wizardState.uuid, 
        keyHash 
      });

      // 3. Derive the local shell key for encryption
      const sk = await deriveShellKey(wizardState.key, wizardState.uuid);
      
      // 4. Set step to success first to show transition
      setStep("success");

      // 5. Complete with onSuccess after showing success animation
      setTimeout(() => {
        onSuccess({
          uuid: pearl.user.uuid,
          username: pearl.user.username,
          displayName: pearl.user.displayName || displayName || pearl.user.username
        }, pearl.token, sk, wizardState.key);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred during vault key sealing.");
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-ocean text-slate-900 dark:text-slate-50 antialiased h-screen flex flex-col justify-center items-center p-4 overflow-hidden relative selection:bg-[#e4048a]/30">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#e4048a]/10 dark:bg-[#e4048a]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#06b6d4]/10 dark:bg-[#06b6d4]/5 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px] bg-white dark:bg-surf-container backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-[#e4048a]/40 dark:border-[#e4048a]/30 p-6 sm:p-8 flex flex-col relative z-10"
      >
        {/* ── Mascot Icon Badge ────────────────────────────────────────── */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surf-lowest border-2 border-[#e4048a]/30 dark:border-[#e4048a]/40 p-1.5 flex items-center justify-center shadow-lg shadow-[#e4048a]/10 overflow-hidden">
            <img 
              alt="ShellGuard Mascot" 
              className="w-full h-full object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSfYl2iW58fcItndpb33YLC-eXcwHrJn91lWPyxfPRB1sOnsHDEr4mmbPVk6nKKgzGsMs_OHJLiixrFZuFyg0yfh2iXJK9OJ_bw4RymO6lfK1jPEnU8CsgNnNG4ETqnhc9pt3qeTF1cCF_xKC2SGNocpU7npOy_I-IiCTo-P-LEZxTIVs5n3n3BdIP-fYLmoTZEc08AIpbreKj31u8-Z6czOrXRAw8m0eke0h9TPb2LFitwkAIoSWXSrh331NpyjhEJbqnEK0MLLKwjg"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* ── Brand Header (Interactive Bouncing Letters) ──────────────── */}
        <div className="text-center flex flex-col items-center">
          <InteractiveBrand 
            suffix="Wizard" 
            size="xl" 
            variant="prominent"
            showIcon={false}
            showCopyright={true}
            className="justify-center"
          />
          <p className="text-[10px] sm:text-[11px] font-headline font-extrabold uppercase tracking-[0.22em] text-[#06b6d4] dark:text-[#06b6d4] mt-2">
            HATCH YOUR SOVEREIGN IDENTITY
          </p>
        </div>

        {/* ── Progress Indicators (Two horizontal pills) ───────────────── */}
        {step !== "success" && (
          <div className="flex items-center justify-center gap-3 my-4" id="progress-bar">
            <div 
              className="h-1.5 w-24 sm:w-28 rounded-full bg-[#06b6d4] shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all duration-500" 
              id="bar-1" 
            />
            <div 
              className={`h-1.5 w-24 sm:w-28 rounded-full transition-all duration-500 ${
                step === "verification" 
                  ? "bg-[#e4048a] shadow-[0_0_12px_rgba(228,4,138,0.6)]" 
                  : "bg-slate-200 dark:bg-white/10"
              }`} 
              id="bar-2" 
            />
          </div>
        )}

        {/* ── Error Banner ──────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 p-3 mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl" id="error-banner">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-650 dark:text-red-400" id="error-message">
              {error}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 1: INITIALIZE IDENTITY (HATCHING) ────────────────────── */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {step === "hatching" && (
            <motion.div 
              key="hatching"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col"
            >
              {/* Center User Avatar Badge */}
              <div className="w-16 h-16 bg-[#06b6d4]/10 dark:bg-[#06b6d4]/15 border border-[#06b6d4]/25 rounded-full flex items-center justify-center mx-auto mb-4 text-[#06b6d4]">
                <User className="w-8 h-8 stroke-[1.8]" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-headline font-bold text-center text-slate-900 dark:text-white mb-2 tracking-tight">
                Initialize Your Identity
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs text-center leading-relaxed max-w-xs mx-auto mb-5">
                Choose your handle in the reef. This will be anchored to your cryptographic key.
              </p>

              {/* Form Input: USERNAME * */}
              <div className="space-y-1 mb-3">
                <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  USERNAME <span className="text-[#06b6d4] text-xs font-bold">*</span>
                </label>
                <input 
                  type="text"
                  autoComplete="off" 
                  maxLength={32}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="larry_lobster" 
                  className="w-full bg-slate-50/80 dark:bg-surf-lowest/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 transition-all font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                />
              </div>

              {/* Form Input: DISPLAY NAME (optional) */}
              <div className="space-y-1 mb-5">
                <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  DISPLAY NAME <span className="text-slate-400 dark:text-slate-500 font-normal lowercase text-[10px]">(optional)</span>
                </label>
                <input 
                  type="text"
                  autoComplete="off" 
                  maxLength={48}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Larry Lobster" 
                  className="w-full bg-slate-50/80 dark:bg-surf-lowest/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                />
              </div>

              {/* Action Button: HATCH IDENTITY */}
              <button 
                onClick={startHatching}
                disabled={!validateUsername(username) || isHatching}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#0e7490] text-white font-headline font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#06b6d4]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {!isHatching ? (
                  <>
                    HATCH IDENTITY
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    HATCHING IDENTITY...
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 2: VERIFICATION & HARDENING ──────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {step === "verification" && wizardState && (
            <motion.div 
              key="verification"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-center mb-2">
                <div className="w-16 h-16 bg-[#06b6d4]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-[#06b6d4]" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-1.5 text-slate-900 dark:text-white">Vault Hardening Initiated!</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed italic">
                  "A secrets manager without a shell is just a database. Harden your vault."
                </p>
              </div>

              {/* Key Display Card */}
              <div className="bg-slate-50 dark:bg-surf-lowest rounded-xl p-3 border border-slate-200 dark:border-white/10 space-y-2 shadow-inner">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      VaultKey©™
                    </span>
                    <p className="font-mono text-xs text-[#06b6d4] break-all leading-tight mt-1" id="info-key">
                      {wizardState.key}
                    </p>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${
                      copied 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-slate-200/50 hover:bg-slate-200 dark:bg-white/5 text-slate-500 hover:text-[#06b6d4] dark:hover:text-[#06b6d4]"
                    }`}
                    title="Copy Key"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="pt-2.5 border-t border-slate-200 dark:border-white/5">
                  <span className="text-[9px] font-mono font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    Vault UUID
                  </span>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1" id="info-uuid">
                    {wizardState.uuid}
                  </p>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-red-50 border border-red-100 dark:bg-[#e4048a]/5 dark:border-[#e4048a]/20 rounded-xl p-2.5 flex gap-2 italic">
                <Zap className="w-4 h-4 text-red-500 dark:text-[#e4048a] flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-650 dark:text-[#e4048a]/80 leading-relaxed font-semibold uppercase tracking-tight">
                  YOUR VAULTKEY IS NOT STORED ON OUR SERVERS. DOWNLOAD THE VAULT ACCESS FILE OR LOSE ACCESS FOREVER.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleDownload}
                  className={`w-full py-3.5 flex items-center justify-center gap-2.5 font-headline font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all border-2 ${
                    isDownloaded 
                      ? "border-green-500 text-green-500 bg-green-500/10" 
                      : "border-slate-300 dark:border-[#06b6d4] text-slate-700 dark:text-[#06b6d4] hover:bg-slate-100 dark:hover:bg-[#06b6d4]/10"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isDownloaded ? "Vault File Stashed!" : "Download Vault Access File"}
                  </span>
                </button>

                <button 
                  onClick={completeWizard}
                  disabled={!isDownloaded || isCompleting}
                  className="w-full py-3 bg-gradient-to-r from-[#e4048a] to-[#ef4444] hover:from-[#c80378] hover:to-[#dc2626] text-white font-headline font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#e4048a]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {!isCompleting ? (
                    <span className="flex items-center gap-2">
                      Confirm & Complete
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Securing Vault...
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ── STEP 3: SUCCESS ───────────────────────────────────────────── */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {step === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-4"
            >
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-headline font-black mb-3 text-slate-900 dark:text-white">Vault Sealed</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                  Your shell is hardened. Your vault is sovereign. Submerging into ShellGuard...
                </p>
                <div className="flex justify-center">
                  <Loader2 className="animate-spin h-6 w-6 text-[#e4048a]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer Navigation & Credits ────────────────────────────── */}
        {step !== "success" && (
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-center gap-6 text-[11px] font-headline font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <button 
                onClick={onSwitch}
                className="hover:text-[#e4048a] dark:hover:text-[#e4048a] transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                BACK TO REEF
              </button>
              <button 
                onClick={onSwitch}
                className="hover:text-[#06b6d4] dark:hover:text-[#06b6d4] transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
              >
                <Key className="w-3.5 h-3.5" />
                EXISTING BURROW
              </button>
              {onCancel && (
                <button 
                  onClick={onCancel}
                  className="hover:text-slate-700 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                  CANCEL
                </button>
              )}
            </div>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-medium mt-6">
              STABILIZED BY CRUSTAGENT©™ — 2026
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

