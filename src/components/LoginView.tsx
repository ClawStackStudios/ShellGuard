import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Shield, 
  Upload, 
  Key, 
  AlertCircle, 
  FileKey2, 
  UploadCloud, 
  KeyRound, 
  ChevronDown, 
  Lock, 
  Loader2, 
  CheckCircle 
} from "lucide-react";
import { restAdapter } from "../services/api/restAdapter.ts";
import { hashToken } from "../lib/crypto.ts";
import { deriveShellKey } from "../lib/shellCryption.ts";

interface LoginViewProps {
  key?: string;
  onSuccess: (l: any, t: string, sk: CryptoKey, rk: string) => void;
  onSwitch: () => void;
  onBack?: () => void;
}

export function LoginView({ onSuccess, onSwitch, onBack }: LoginViewProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // Upload mode states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Paste mode states
  const [pasteKey, setPasteKey] = useState("");
  const [pasteUuid, setPasteUuid] = useState("");
  const [pasteUsername, setPasteUsername] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileError(null);
    }
  };

  const handleUploadLogin = async () => {
    if (!selectedFile) return;

    setIsLoggingIn(true);
    setFileError(null);

    try {
      const text = await selectedFile.text();
      const identity = JSON.parse(text);

      if (!identity.uuid || !identity.token || !identity.username) {
        throw new Error("Invalid identity file format.");
      }

      const keyHash = await hashToken(identity.token);
      
      const pearl = await restAdapter.POST("/api/auth/token", { 
        uuid: identity.uuid, 
        keyHash 
      });

      const sk = await deriveShellKey(identity.token, identity.uuid);
      onSuccess({
        uuid: pearl.user.uuid,
        username: pearl.user.username,
        displayName: pearl.user.displayName || identity.displayName || pearl.user.username
      }, pearl.token, sk, identity.token);
    } catch (err: any) {
      setFileError(err.message || "Failed to parse identity file.");
      setIsLoggingIn(false);
    }
  };

  const handlePasteLogin = async () => {
    if (!pasteKey.startsWith("hu-") || pasteKey.length !== 67) {
      setPasteError("Invalid ShellKey©™ format.");
      return;
    }

    setIsLoggingIn(true);
    setPasteError(null);

    try {
      const keyHash = await hashToken(pasteKey);

      // The API resolves the identity from the key hash itself — no lookup hop.
      const pearl = await restAdapter.POST("/api/auth/token", {
        ...(pasteUuid ? { uuid: pasteUuid } : {}),
        keyHash
      });

      const sk = await deriveShellKey(pasteKey, pearl.user.uuid);
      onSuccess({
        uuid: pearl.user.uuid,
        username: pearl.user.username,
        displayName: pearl.user.displayName || pearl.user.username
      }, pearl.token, sk, pasteKey);
    } catch (err: any) {
      setPasteError(err.message || "Identity verification failed.");
      setIsLoggingIn(false);
    }
  };

  const isPasteKeyValid = pasteKey.startsWith("hu-") && pasteKey.length === 67;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto bg-white/95 dark:bg-[#1e0f15]/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-white/10"
    >
      <button 
        onClick={onBack || onSwitch} 
        className="mb-6 flex items-center text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Reef
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-lobster-red to-[#e4048a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-lobster-red/20">
          <span className="text-3xl select-none">🦞</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Claw In to ShellGuard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Authenticate with your sovereign identity key</p>
      </div>

      {/* ── Mode toggle tabs ── */}
      <div className="flex rounded-xl border border-theme-subtle border overflow-hidden mb-6">
        <button 
          onClick={() => setMode("upload")} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium  ${mode === "upload" ? "bg-claw-cyan text-white" : "text-theme-muted hover:bg-slate-50 dark:hover:bg-slate-800"}`}
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
        <button 
          onClick={() => setMode("paste")} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium  ${mode === "paste" ? "bg-claw-cyan text-white" : "text-theme-muted hover:bg-slate-50 dark:hover:bg-slate-800"}`}
        >
          <Key className="w-4 h-4" />
          Paste ShellKey©™
        </button>
      </div>

      {/* ── Error banner ── */}
      {(fileError || pasteError) && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-400">{fileError || pasteError}</p>
        </div>
      )}

      {mode === "upload" ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Identity File</label>
            <div className="mt-2">
              <label className={`flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed rounded-xl cursor-pointer  ${selectedFile ? 'border-claw-cyan bg-claw-cyan/5' : 'border-slate-300 dark:border-slate-700 hover:border-claw-cyan hover:bg-claw-cyan/5'}`}>
                {selectedFile ? (
                  <CheckCircle className="w-8 h-8 text-claw-cyan" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400" />
                )}
                <div className="text-left">
                  <p className="font-medium text-theme-main">
                    {selectedFile ? selectedFile.name : "Click to upload your identity file"}
                  </p>
                  <p className="text-sm text-theme-muted">
                    {selectedFile ? "File selected — click Login to proceed" : ".json files only"}
                  </p>
                </div>
                <input type="file" accept=".json" className="hidden" onChange={handleFileChange} disabled={isLoggingIn} />
              </label>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-500">Can't find your identity file?</p>
                <p className="text-sm text-amber-700 dark:text-amber-600/80 mt-1">
                  Your identity file is the only way to access your account. If you've lost it, you'll need to molt a new identity.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleUploadLogin}
            disabled={isLoggingIn || !selectedFile}
            className="w-full inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-claw-cyan to-deep-teal text-white text-base font-medium rounded-md shadow-lg shadow-cyan-200 dark:shadow-cyan-900/40  disabled:opacity-50"
          >
            {isLoggingIn ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying Identity...</>
            ) : (
              <><Key className="w-4 h-4 mr-2" /> Login with Identity File</>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">ShellKey©™</label>
            <textarea
              value={pasteKey}
              onChange={(e) => setPasteKey(e.target.value)}
              placeholder="hu-..."
              rows={3}
              className="mt-1 w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-theme-subtle border rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-claw-cyan resize-none"
              spellCheck={false}
            />
            {isPasteKeyValid && (
              <p className="mt-1 text-xs text-claw-cyan flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Valid ShellKey©™ format
              </p>
            )}
          </div>

          <div className="bg-claw-cyan/5 border border-claw-cyan/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-claw-cyan flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-claw-cyan">One-Field Login</p>
                <p className="text-sm text-theme-muted mt-1">
                  Your ShellKey©™ is all you need to login. Advanced options are available for troubleshooting.
                </p>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} 
            className="text-xs text-theme-muted hover:text-claw-cyan  flex items-center"
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
                className="overflow-hidden space-y-4"
              >
                <div className="pt-2">
                  <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Your UUID (Required for manual entry)</label>
                  <input
                    type="text"
                    value={pasteUuid}
                    onChange={(e) => setPasteUuid(e.target.value)}
                    placeholder="550e8400-e29b-41d4-a716-446655440000"
                    className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-claw-cyan"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Username (Optional)</label>
                  <input
                    type="text"
                    value={pasteUsername}
                    onChange={(e) => setPasteUsername(e.target.value)}
                    placeholder="your-username"
                    className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-claw-cyan"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={handlePasteLogin}
            disabled={isLoggingIn || !pasteKey || !pasteUuid}
            className="w-full inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-claw-cyan to-deep-teal text-white text-base font-medium rounded-md shadow-lg shadow-cyan-200 dark:shadow-cyan-900/40  disabled:opacity-50"
          >
            {isLoggingIn ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying Identity...</>
            ) : (
              <><Key className="w-4 h-4 mr-2" /> Login with ShellKey©™</>
            )}
          </button>
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-theme-subtle border text-center">
        <p className="text-slate-500 text-sm">New to the reef?</p>
        <button onClick={onSwitch} className="text-claw-cyan font-bold mt-2 hover:underline">Molt a New Identity</button>
      </div>
    </motion.div>
  );
}
