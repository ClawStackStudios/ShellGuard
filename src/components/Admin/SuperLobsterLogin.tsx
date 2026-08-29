/**
 * SuperLobsterLogin.tsx — ShellGuard©™
 *
 * Token gate for the SuperLobster Panel. Reef Modernist styling,
 * distinct from the user-facing vault aesthetic.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { useSuperLobster } from './SuperLobsterContext.tsx';
import { BouncyBrand } from '../ui/BouncyBrand.tsx';

export function SuperLobsterLogin() {
  const { login, panelDisabled } = useSuperLobster();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await login(token);
      // Context flips isAdmin — panel renders on next pass.
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-base flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#e4048a]/30">
      {/* Ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#e4048a]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#06b6d4]/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <a
          href="/"
          onClick={(e) => {
            if (window.location.pathname !== '/' || window.location.hash) {
              e.preventDefault();
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          className="absolute -top-2 left-0 inline-flex items-center gap-1.5 text-sm text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to the reef
        </a>

        <div className="bg-theme-surface border-t-2 border-[#e4048a] border-x border-b border-theme-subtle rounded-2xl shadow-2xl p-8">
          {/* Centered brand header — CaraBase-style polish */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#e4048a]/10 rounded-2xl flex items-center justify-center shadow-lg shadow-[#e4048a]/20 border border-[#e4048a]/30">
              <Shield size={32} className="text-[#e4048a]" />
            </div>
            <div className="flex justify-center mt-4">
              <BouncyBrand variant="subtle" className="text-2xl justify-center tracking-tight" />
            </div>
            <h1 className="text-xl font-bold text-theme-main mt-2 tracking-tight font-[Sora]">
              SuperLobster Login
            </h1>
            <p className="text-sm text-[#e4048a]/80 mt-1">
              The Reef is sealed. Sovereign access only.
            </p>
          </div>

          {panelDisabled ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-500">
              The SuperLobster Panel is not enabled on this instance. Set the
              <code className="mx-1 px-1.5 py-0.5 bg-theme-base rounded font-mono text-xs">ADMIN_TOKEN</code>
              environment variable to enable it.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                  Admin Token
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter Admin Token…"
                    className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:border-claw-cyan focus:ring-2 focus:ring-[#06b6d4]/40 outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!token || isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-[#e4048a] to-[#b7006e] hover:from-[#f01a97] hover:to-[#c90077] text-white font-bold rounded-xl shadow-lg shadow-[#e4048a]/20 hover:shadow-[#e4048a]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Unlocking the shell…</>
                ) : (
                  <><KeyRound size={16} /> Login With Admin Token</>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-theme-muted/60 font-mono">
          Sovereign Data Policy Enforced · Sessions are volatile · 20-minute sliding expiry
        </p>
      </motion.div>
    </div>
  );
}
