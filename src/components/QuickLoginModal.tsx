import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X,
  Shield, 
  Upload, 
  Key, 
  AlertCircle, 
  FileKey2, 
  UploadCloud, 
  KeyRound, 
  Loader2
} from "lucide-react";
import { restAdapter } from "../services/api/restAdapter.ts";
import { hashToken } from "../lib/crypto.ts";
import { deriveShellKey } from "../lib/shellCryption.ts";
import { Lobster } from "../types.ts";

export interface AuthModalConfig {
  mode: "unlock" | "add";
  target?: Lobster | null;
}

interface QuickLoginModalProps {
  config: AuthModalConfig;
  onClose: () => void;
  onSuccess: (l: { uuid: string; username: string; displayName?: string }, token: string, sk: CryptoKey, rk: string) => void;
}

export function QuickLoginModal({ config, onClose, onSuccess }: QuickLoginModalProps) {
  const { mode: initialMode, target } = config;
  // If unlocking, default to pasting (since most users just paste the key). If adding, upload is more common.
  const [tab, setTab] = useState<"upload" | "paste">(initialMode === "unlock" ? "paste" : "upload");
  const [fileError, setFileError] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Paste state
  const [pasteKey, setPasteKey] = useState("");
  
  // Reset states when config changes
  useEffect(() => {
    setTab(initialMode === "unlock" ? "paste" : "upload");
    setPasteKey("");
    setSelectedFile(null);
    setFileError(null);
    setPasteError(null);
  }, [config]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileError(null);
    }
  };

  const processUpload = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setFileError(null);

    try {
      const text = await selectedFile.text();
      const identity = JSON.parse(text);

      if (!identity.uuid || !identity.token || !identity.username) {
        throw new Error("Invalid identity file format.");
      }

      if (target && identity.uuid !== target.uuid) {
        throw new Error(`Identity file belongs to user ${identity.username}, expected ${target.username}`);
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
      setIsProcessing(false);
    }
  };

  const processPaste = async () => {
    if (!pasteKey.startsWith("hu-") || pasteKey.length !== 67) {
      setPasteError("Invalid ShellKey©™ format.");
      return;
    }

    setIsProcessing(true);
    setPasteError(null);

    try {
      const keyHash = await hashToken(pasteKey);
      const pearl = await restAdapter.POST("/api/auth/token", {
        ...(target ? { uuid: target.uuid } : {}),
        keyHash
      });

      if (target && pearl.user.uuid !== target.uuid) {
        throw new Error(`ShellKey belongs to ${pearl.user.username}, expected ${target.username}`);
      }

      const sk = await deriveShellKey(pasteKey, pearl.user.uuid);
      onSuccess({
        uuid: pearl.user.uuid,
        username: pearl.user.username,
        displayName: pearl.user.displayName || pearl.user.username
      }, pearl.token, sk, pasteKey);
    } catch (err: any) {
      setPasteError(err.message || "Identity verification failed.");
      setIsProcessing(false);
    }
  };

  const isPasteKeyValid = pasteKey.startsWith("hu-") && pasteKey.length === 67;
  const targetDisplayName = target ? (target.displayName || target.username) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-[#1a0c12] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-lobster-red bg-slate-100 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-900/20 rounded-full transition-colors z-10"
          >
            <X size={16} />
          </button>

          <div className="p-6 pt-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-lobster-red to-[#e4048a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-lobster-red/20">
                <span className="text-2xl select-none">🦞</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {targetDisplayName ? `Unlock ${targetDisplayName}` : "Add Identity"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {targetDisplayName ? `Provide your sovereign identity key for ${target.username}` : "Import an existing identity to your device"}
              </p>
            </div>

            {/* Mode toggle tabs */}
            <div className="flex rounded-xl border border-theme-subtle overflow-hidden mb-5">
              <button
                onClick={() => setTab("paste")}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  tab === "paste" 
                    ? "bg-theme-main text-theme-base" 
                    : "bg-theme-base text-theme-muted hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Key Paste
              </button>
              <button
                onClick={() => setTab("upload")}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-l border-theme-subtle ${
                  tab === "upload" 
                    ? "bg-theme-main text-theme-base" 
                    : "bg-theme-base text-theme-muted hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <FileKey2 className="w-3.5 h-3.5" />
                Upload File
              </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[160px]">
              {tab === "paste" ? (
                <motion.div 
                  key="paste-mode"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-headline font-bold uppercase tracking-widest text-theme-subtle">
                      ShellKey©™
                    </label>
                    <textarea 
                      value={pasteKey}
                      onChange={(e) => setPasteKey(e.target.value.trim())}
                      placeholder="hu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-slate-50 dark:bg-black/20 border border-theme-subtle rounded-xl px-4 py-3 text-xs text-theme-main focus:outline-none focus:border-lobster-red focus:ring-1 focus:ring-lobster-red transition-all font-mono placeholder:text-theme-muted h-24 resize-none leading-relaxed break-all"
                    />
                  </div>

                  {pasteError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-snug">{pasteError}</p>
                    </div>
                  )}

                  <button 
                    onClick={processPaste}
                    disabled={!isPasteKeyValid || isProcessing}
                    className="w-full py-3.5 bg-theme-main hover:bg-theme-main/90 text-theme-base font-headline font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-theme-main/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> VERIFYING...</>
                    ) : (
                      <><Key className="w-4 h-4" /> UNLOCK VAULT</>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="upload-mode"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input 
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                      id="identity-upload-modal"
                    />
                    <label 
                      htmlFor="identity-upload-modal"
                      className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-colors ${
                        selectedFile 
                          ? "border-green-500/50 bg-green-500/5 dark:bg-green-500/10" 
                          : "border-theme-subtle hover:border-lobster-red/50 hover:bg-lobster-red/5"
                      }`}
                    >
                      {selectedFile ? (
                        <>
                          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3 text-green-600 dark:text-green-400">
                            <Shield className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-theme-main mb-1">Identity Prepared</p>
                          <p className="text-[10px] text-theme-subtle font-mono truncate max-w-full px-4">{selectedFile.name}</p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-theme-subtle/20 rounded-full flex items-center justify-center mb-3 text-theme-muted">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-theme-main mb-1">Select Identity File</p>
                          <p className="text-[10px] text-theme-subtle">Click to browse or drag & drop</p>
                        </>
                      )}
                    </label>
                  </div>

                  {fileError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-snug">{fileError}</p>
                    </div>
                  )}

                  <button 
                    onClick={processUpload}
                    disabled={!selectedFile || isProcessing}
                    className="w-full py-3.5 bg-theme-main hover:bg-theme-main/90 text-theme-base font-headline font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-theme-main/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> VERIFYING...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> VERIFY & UNLOCK</>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
