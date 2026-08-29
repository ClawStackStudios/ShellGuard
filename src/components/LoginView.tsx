import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Upload, 
  Key, 
  Lock, 
  Loader2, 
  CheckCircle,
  FileText
} from "lucide-react";
import { BouncyBrand } from "./ui/BouncyBrand.tsx";
import { restAdapter } from "../services/api/restAdapter.ts";
import { hashToken } from "../lib/crypto.ts";
import { deriveShellKey } from "../lib/shellCryption.ts";

interface LoginViewProps {
  onSuccess: (l: any, t: string, sk: CryptoKey, rk: string) => void;
  onSwitch: () => void;
  onBack?: () => void;
}

export function LoginView({ onSuccess, onSwitch, onBack }: LoginViewProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pasteKey, setPasteKey] = useState("");
  const [pasteUuid, setPasteUuid] = useState("");
  const [pasteUsername, setPasteUsername] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const cleanKeyString = (raw: string): string => {
    let cleaned = raw.trim();
    // Strip wrapping quotes if any
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    return cleaned;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        setError("Please select a .json identity file");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file.name.endsWith(".json")) {
        setError("Please select a .json identity file");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const validateKeyFormat = (key: string): boolean => {
    const cleaned = cleanKeyString(key);
    return cleaned.startsWith("hu-") && cleaned.length === 67;
  };

  const handleLogin = async () => {
    if (mode === "upload" && !selectedFile) {
      setError("Please select or drop your Vault Access File (.json).");
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      if (mode === "upload") {
        const text = await selectedFile!.text();
        let identity: any;
        try {
          identity = JSON.parse(text);
        } catch {
          throw new Error("Could not parse file. Please ensure it is a valid JSON identity file.");
        }

        const token = identity.token || identity.key || identity.secret || identity.identityKey;
        const uuid = identity.uuid || identity.id;
        const username = identity.username || identity.user || identity.displayName || "human";

        if (!token) {
          throw new Error("Identity file missing access key (token).");
        }

        const cleanedToken = cleanKeyString(token);
        const keyHash = await hashToken(cleanedToken);
        
        const pearl = await restAdapter.POST("/api/auth/token", { 
          uuid: uuid || undefined, 
          keyHash 
        });

        const userUuid = pearl.user?.uuid || uuid;
        const sk = await deriveShellKey(cleanedToken, userUuid);
        onSuccess({
          uuid: userUuid,
          username: pearl.user?.username || username,
          displayName: pearl.user?.displayName || identity.displayName || username
        }, pearl.token, sk, cleanedToken);
      } else {
        let keyToUse = cleanKeyString(pasteKey);
        let uuidToUse = pasteUuid.trim();
        let usernameToUse = pasteUsername.trim();

        // Check if user pasted full JSON string into the key field
        if (keyToUse.startsWith("{") && keyToUse.endsWith("}")) {
          try {
            const parsed = JSON.parse(keyToUse);
            if (parsed.token || parsed.key || parsed.secret) {
              keyToUse = cleanKeyString(parsed.token || parsed.key || parsed.secret);
            }
            if (parsed.uuid || parsed.id) uuidToUse = parsed.uuid || parsed.id;
            if (parsed.username || parsed.user) usernameToUse = parsed.username || parsed.user;
          } catch {
            // Ignore parse errors, proceed with keyToUse
          }
        }

        if (!validateKeyFormat(keyToUse)) {
          throw new Error("Invalid ShellKey©™ format. Sovereign keys start with 'hu-' and are 67 characters long.");
        }

        const keyHash = await hashToken(keyToUse);

        const pearl = await restAdapter.POST("/api/auth/token", {
          uuid: uuidToUse || undefined,
          keyHash
        });

        const userUuid = pearl.user?.uuid || uuidToUse;
        const sk = await deriveShellKey(keyToUse, userUuid);
        onSuccess({
          uuid: userUuid,
          username: pearl.user?.username || usernameToUse || "human",
          displayName: pearl.user?.displayName || usernameToUse || pearl.user?.username || "human"
        }, pearl.token, sk, keyToUse);
      }
    } catch (err: any) {
      setError(err.message || "Identity verification failed. Please check your key or identity file.");
      setIsLoggingIn(false);
    }
  };

  const isCurrentKeyValid = validateKeyFormat(pasteKey);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-t-2 border-[#e4048a] dark:border-slate-800 relative transition-colors duration-300"
    >
      {/* ── Top Back to Home Button ── */}
      <button 
        onClick={onBack || onSwitch}
        className="absolute top-6 left-6 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 py-1 px-2 rounded-lg transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </button>

      {/* ── Brand Header with Bouncy Letters ── */}
      <div className="flex flex-col items-center mt-10 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-[#e4048a] to-[#06b6d4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#e4048a]/20 overflow-hidden border border-[#e4048a]/50 p-2 mb-3">
          <img 
            src="/assets/shellguard-logo.png" 
            alt="ShellGuard" 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="text-center mb-1 flex justify-center">
          <BouncyBrand variant="subtle" className="text-2xl justify-center tracking-tight" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Login with your ShellGuard©™ identity
        </p>
      </div>

      {/* ── Mode Toggle Tabs ── */}
      <div className="flex rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6 p-1 border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => { setMode("upload"); setError(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mode === "upload" 
              ? "bg-[#e4048a] text-white shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50"
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload File
        </button>
        <button
          onClick={() => { setMode("paste"); setError(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mode === "paste" 
              ? "bg-[#e4048a] text-white shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Paste ShellKey©™
        </button>
      </div>

      {/* ── Upload Mode ── */}
      {mode === "upload" && (
        <div className="mb-6 space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 mb-2">Your Identity File</div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("identity-upload")?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                selectedFile 
                  ? "border-[#e4048a] bg-[#e4048a]/5 dark:bg-[#e4048a]/10" 
                  : "border-slate-300 dark:border-slate-700 hover:border-[#e4048a] hover:bg-slate-50 dark:hover:bg-slate-800/45"
              }`}
            >
              <input
                type="file"
                id="identity-upload"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoggingIn}
              />
              {selectedFile ? (
                <div className="text-[#e4048a] font-medium text-sm flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" /> {selectedFile.name}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">Click to upload your identity file</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">.json files only</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex gap-3">
            <Lock className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Can't find your identity file?</h3>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                Your identity file is the only way to access your account. If you've lost it, you'll need to molt a new identity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Paste Mode ── */}
      {mode === "paste" && (
        <div className="mb-6 space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 mb-2">ShellKey©™</div>
            <input 
              type="password"
              placeholder="hu-..."
              value={pasteKey}
              onChange={(e) => {
                setPasteKey(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#e4048a]/20 focus:border-[#e4048a]"
              spellCheck={false}
            />
            {isCurrentKeyValid && (
              <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle className="w-3.5 h-3.5" /> Valid 67-char ShellKey©™ format
              </p>
            )}
          </div>

          <div className="bg-[#e4048a]/5 dark:bg-[#e4048a]/10 border border-[#e4048a]/20 dark:border-[#e4048a]/30 rounded-xl p-4 flex gap-3">
            <div className="text-[#e4048a] bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1">One-Field Login</h3>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                Your ShellKey©™ is all you need to login. Advanced options are available for troubleshooting.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-transparent border-0 cursor-pointer block"
          >
            {isAdvancedOpen ? "Hide Advanced Options" : "Show Advanced Options (UUID/Username)"}
          </button>

          <AnimatePresence>
            {isAdvancedOpen && (
              <motion.div 
                key="advanced"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3 pt-2"
              >
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">Your UUID (Optional)</label>
                  <input
                    type="text"
                    value={pasteUuid}
                    onChange={(e) => setPasteUuid(e.target.value)}
                    placeholder="550e8400-e29b-41d4-a716-446655440000"
                    className="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#e4048a]"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">Username (Optional)</label>
                  <input
                    type="text"
                    value={pasteUsername}
                    onChange={(e) => setPasteUsername(e.target.value)}
                    placeholder="your-username"
                    className="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#e4048a]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && <div className="mb-4 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-2.5 rounded-xl text-center">{error}</div>}

      {/* ── Login Action Button ── */}
      <button
        onClick={handleLogin}
        disabled={isLoggingIn || (mode === "upload" && !selectedFile) || (mode === "paste" && !pasteKey.trim())}
        className="w-full py-3 bg-gradient-to-r from-[#e4048a] to-[#be185d] hover:from-[#d0037c] hover:to-[#a2134e] text-white rounded-xl font-semibold text-sm shadow-md shadow-[#e4048a]/20 hover:shadow-[#e4048a]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
      >
        <Key className="w-4 h-4" />
        {isLoggingIn ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
        ) : (
          mode === "upload" ? "Login with Identity File" : "Login with ShellKey©™"
        )}
      </button>

      {/* ── Bottom Switch Link ── */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <span>New to the reef? </span>
        <button onClick={onSwitch} className="text-[#e4048a] font-bold hover:underline cursor-pointer ml-1">
          Molt a New Identity
        </button>
      </div>
    </motion.div>
  );
}
