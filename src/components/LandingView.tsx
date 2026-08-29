import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "./Theme/ThemeToggle.tsx";
import { BouncyBrand } from "./ui/BouncyBrand.tsx";
import { 
  Shield, 
  Users, 
  Bot, 
  Waves, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  Sparkles,
  Layers,
  Fingerprint
} from "lucide-react";

interface LandingViewProps {
  onClawIn: () => void;
  onHatch: () => void;
}

export function LandingView({ onClawIn, onHatch }: LandingViewProps) {
  const [activeTab, setActiveTab] = useState<"human" | "agent">("human");

  const handleScrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-theme-base text-theme-main font-sans antialiased scroll-smooth relative selection:bg-[#e4048a]/30 transition-colors duration-200 overflow-x-hidden">
      {/* BACKGROUND AMBIENT GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#e4048a]/10 via-[#06b6d4]/5 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[800px] right-[-10%] w-[600px] h-[600px] bg-[#06b6d4]/5 rounded-full blur-[140px] pointer-events-none z-0" />
      
      {/* FIXED HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-theme-base/85 backdrop-blur-xl border-b border-theme-subtle shadow-sm shadow-black/5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e4048a]/20 to-[#06b6d4]/10 border border-[#e4048a]/30 flex items-center justify-center shadow-md shadow-[#e4048a]/10 overflow-hidden">
              <img 
                alt="ShellGuard Icon" 
                className="w-full h-full object-cover p-1" 
                src="/assets/shellguard-logo.png"
              />
            </div>
            <div className="flex items-center gap-2">
              <BouncyBrand variant="subtle" className="text-xl tracking-tight" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={onClawIn}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#e4048a] bg-[#e4048a]/10 hover:bg-[#e4048a]/20 transition-all border border-[#e4048a]/30 cursor-pointer shadow-sm active:scale-95"
            >
              Claw In
            </button>
            <button 
              onClick={onHatch}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-[#e4048a] to-[#06b6d4] shadow-lg shadow-[#e4048a]/20 hover:opacity-90 transition-all cursor-pointer active:scale-95 border border-transparent"
            >
              Hatch Vault
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full">
        {/* HERO SECTION */}
        <section className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="hero">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            {/* Hero Brand Banner (Landscape & Static) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative mb-10 w-full max-w-lg sm:max-w-xl md:max-w-2xl"
            >
              <div className="w-full aspect-[16/9] rounded-[24px] sm:rounded-[32px] p-2 bg-gradient-to-br from-[#e4048a]/50 via-[#06b6d4]/30 to-[#10b981]/50 shadow-2xl shadow-[#e4048a]/15 border border-theme-subtle overflow-hidden">
                <img 
                  alt="ShellGuard Logo Banner" 
                  className="w-full h-full rounded-[18px] sm:rounded-[24px] object-cover bg-white dark:bg-ocean shadow-inner" 
                  src="/assets/shellguard-logo.png"
                />
              </div>
            </motion.div>
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-[#e4048a]/10 border border-[#e4048a]/30 px-4 py-1.5 rounded-full text-[#e4048a] text-xs font-bold mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Local-First Sovereign Secrets Vaulting©™</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-8 tracking-tight flex items-center justify-center">
              <BouncyBrand 
                variant="prominent" 
                animateOnMount={true}
                className="text-5xl sm:text-7xl md:text-8xl" 
              />
            </h1>

            {/* Subtext */}
            <div className="max-w-2xl mx-auto space-y-4 text-theme-muted text-base sm:text-lg leading-relaxed mb-12">
              <p>
                Your sovereign <strong className="text-theme-main">Vault System</strong> where Humans and AI Lobsters collaborate to <strong className="text-[#06b6d4]">armor</strong> credentials.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed px-5 py-3 rounded-2xl bg-theme-surface/70 border border-theme-subtle text-theme-muted shadow-sm">
                Snap out of the SaaS trap. <strong className="text-[#e4048a]">ShellGuard©™</strong> protects your secrets with <strong className="text-[#e4048a]">ShellCryption©™</strong>, per-row AES-256 metadata encryption, and instant LobsterKey delegation. Clutch your secrets while your AI agents scuttle safely! 🦞
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <button 
                onClick={onHatch}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#e4048a] to-[#be185d] hover:from-[#d0037c] hover:to-[#a2134e] text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-[#e4048a]/20 cursor-pointer text-sm tracking-wide"
              >
                <span>Hatch Your ShellGuard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleScrollToFeatures}
                className="w-full sm:w-auto px-8 py-4 bg-theme-surface border border-theme-subtle hover:border-theme-muted/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-theme-main font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm text-sm"
              >
                <KeyRound className="w-4 h-4 text-[#e4048a]" />
                <span>How Keys Work</span>
              </button>
            </div>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section className="py-24 bg-theme-surface/40 border-y border-theme-subtle px-4 sm:px-6 lg:px-8" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight">
                Sovereign Vault Integrity
              </h2>
              <p className="text-theme-muted text-sm sm:text-base leading-relaxed">
                Zero-knowledge mathematics running in your browser memory and self-hosted disk burrows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="glass-card rounded-3xl p-8 border border-theme-subtle hover:border-[#e4048a]/40 hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-[#e4048a]/15 rounded-2xl flex items-center justify-center border border-[#e4048a]/30 mb-6 text-[#e4048a]">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-main mb-3">Human Curated</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Designed for carbon-based lifeforms first. Intuitive, fast, and frictionless secret management with biometric unlock.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass-card rounded-3xl p-8 border border-theme-subtle hover:border-[#06b6d4]/40 hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-[#06b6d4]/15 rounded-2xl flex items-center justify-center border border-[#06b6d4]/30 mb-6 text-[#06b6d4]">
                    <Bot className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-main mb-3">Lobster Powered</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Exposes dedicated LobsterKeys (<code className="font-mono text-xs text-[#06b6d4]">lb-</code>) so your autonomous sub-agents securely fetch credentials without master key exposure.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass-card rounded-3xl p-8 border border-theme-subtle hover:border-[#10b981]/40 hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-[#10b981]/15 rounded-2xl flex items-center justify-center border border-[#10b981]/30 mb-6 text-[#10b981]">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-main mb-3">Triple-Layer Defense</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Client-side Web Crypto (HKDF + AES-GCM-256), per-row server metadata encryption, and SQLCipher whole-database encryption.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="glass-card rounded-3xl p-8 border border-theme-subtle hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-purple-500/15 rounded-2xl flex items-center justify-center border border-purple-500/30 mb-6 text-purple-400">
                    <Waves className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-main mb-3">Your Own Shell</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Run locally or self-host on Docker or Unraid. Zero third-party telemetry, zero cloud lock-in. You hold the master keys.
                  </p>
                </div>
              </div>

              {/* Card 5 */}
              <div className="glass-card rounded-3xl p-8 border border-theme-subtle hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center border border-emerald-500/30 mb-6 text-emerald-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-main mb-3">Password Attachments</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Attach recovery files, keys, and license documents (up to 10 MB each) directly to pearls with zero-knowledge encryption.
                  </p>
                </div>
              </div>

              {/* Card 6 */}
              <div className="glass-card rounded-3xl p-8 border border-theme-subtle hover:border-[#e4048a]/40 hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-[#e4048a]/15 rounded-2xl flex items-center justify-center border border-[#e4048a]/30 mb-6 text-[#e4048a]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-main mb-3">Granular Scoping</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Assign exact read, write, edit, or delete permissions per agent. Revoke compromised keys in one click with instant invalidation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IDENTITY TABBED WORK STEPPER */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="identity">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-3">
                How Identity Works
              </h2>
              <p className="text-theme-muted text-sm sm:text-base">
                Select your persona to see the cryptographic flow.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="inline-flex bg-theme-surface border border-theme-subtle p-1.5 rounded-2xl mb-12 w-full max-w-sm shadow-inner">
              <button 
                onClick={() => setActiveTab("human")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${activeTab === "human" ? "bg-[#e4048a] text-white shadow-md shadow-[#e4048a]/20" : "text-theme-muted hover:text-theme-main"}`}
              >
                <Fingerprint className="w-4 h-4" />
                <span>Human Identity</span>
              </button>
              <button 
                onClick={() => setActiveTab("agent")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${activeTab === "agent" ? "bg-[#06b6d4] text-white shadow-md shadow-[#06b6d4]/20" : "text-theme-muted hover:text-theme-main"}`}
              >
                <Bot className="w-4 h-4" />
                <span>Agent Key</span>
              </button>
            </div>

            {/* Stepper Card */}
            <AnimatePresence mode="wait">
              {activeTab === "human" ? (
                <motion.div 
                  key="human-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="w-full p-8 sm:p-10 rounded-3xl bg-theme-surface border border-theme-subtle shadow-2xl shadow-black/5 relative overflow-hidden"
                >
                  <div className="text-center mb-8">
                    <p className="text-theme-muted text-[10px] tracking-widest uppercase font-bold mb-1 font-mono">Join the Reef</p>
                    <h4 className="text-[#e4048a] font-black tracking-wider text-xl uppercase">Human Molting Flow 🌊</h4>
                  </div>
                  <div className="space-y-6 mb-10">
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-xl bg-[#e4048a]/15 text-[#e4048a] text-xs font-bold flex items-center justify-center border border-[#e4048a]/30 font-mono shrink-0">1</span>
                      <p className="text-theme-main text-sm mt-1">Generate your sovereign 67-character <code className="font-mono text-xs text-[#e4048a]">hu-</code> Key and download your encrypted Vault Access File.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-xl bg-[#e4048a]/15 text-[#e4048a] text-xs font-bold flex items-center justify-center border border-[#e4048a]/30 font-mono shrink-0">2</span>
                      <p className="text-theme-main text-sm mt-1">Store your key strictly offline. The server never receives or stores your plaintext key.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-xl bg-[#e4048a]/15 text-[#e4048a] text-xs font-bold flex items-center justify-center border border-[#e4048a]/30 font-mono shrink-0">3</span>
                      <p className="text-theme-main text-sm mt-1">Drop your Vault Access File or paste your key to authenticate and derive your client-side encryption cipher.</p>
                    </div>
                  </div>
                  <button 
                    onClick={onHatch}
                    className="w-full py-4 bg-[#e4048a] hover:bg-[#be185d] text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#e4048a]/20 cursor-pointer text-sm"
                  >
                    Hatch Human Vault
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="agent-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="w-full p-8 sm:p-10 rounded-3xl bg-theme-surface border border-theme-subtle shadow-2xl shadow-black/5 relative overflow-hidden"
                >
                  <div className="text-center mb-8">
                    <p className="text-theme-muted text-[10px] tracking-widest uppercase font-bold mb-1 font-mono">Autonomous Integration</p>
                    <h4 className="text-[#06b6d4] font-black tracking-wider text-xl uppercase">LobsterKey API Flow 🤖</h4>
                  </div>
                  <div className="space-y-6 mb-10">
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-xl bg-[#06b6d4]/15 text-[#06b6d4] text-xs font-bold flex items-center justify-center border border-[#06b6d4]/30 font-mono shrink-0">1</span>
                      <p className="text-theme-main text-sm mt-1">Issue a scoped <code className="font-mono text-xs text-[#06b6d4]">lb-</code> key from your ShellGuard dashboard with custom read/write permissions.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-xl bg-[#06b6d4]/15 text-[#06b6d4] text-xs font-bold flex items-center justify-center border border-[#06b6d4]/30 font-mono shrink-0">2</span>
                      <p className="text-theme-main text-sm mt-1">The agent SHA-256 hashes the key and calls <code className="font-mono text-xs text-[#06b6d4]">POST /api/auth/token</code> to exchange for an ephemeral Bearer token.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-xl bg-[#06b6d4]/15 text-[#06b6d4] text-xs font-bold flex items-center justify-center border border-[#06b6d4]/30 font-mono shrink-0">3</span>
                      <p className="text-theme-main text-sm mt-1">The agent queries credentials or notes programmatically via REST while respecting rate limits and audit logs.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleScrollToFeatures}
                    className="w-full py-4 bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#06b6d4]/20 cursor-pointer text-sm"
                  >
                    View Agent Architecture
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="bg-gradient-to-br from-[#e4048a] via-[#be185d] to-[#0f172a] py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-white" id="cta">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 p-2 mx-auto mb-8 shadow-2xl backdrop-blur-md flex items-center justify-center">
              <img 
                alt="ShellGuard Icon" 
                className="w-full h-full object-cover" 
                src="/assets/shellguard-logo.png"
              />
            </div>

            <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">
              Ready to Hatch Your ShellGuard?
            </h2>
            <p className="text-white/90 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join the Reef. Let your <span className="font-bold text-pink-200">Lobsters</span> keep your secrets secure, rotated, and under your sovereign control.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onHatch}
                className="w-full sm:w-auto px-8 py-4 bg-white text-[#e4048a] hover:bg-slate-100 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl cursor-pointer text-sm"
              >
                <span>Hatch Your ShellGuard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={onClawIn}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-sm"
              >
                <span>Login with Key</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-theme-surface py-12 px-4 sm:px-6 lg:px-8 border-t border-theme-subtle relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#e4048a]/10 border border-[#e4048a]/30 flex items-center justify-center p-1">
              <img 
                alt="ShellGuard Icon" 
                className="w-full h-full object-cover" 
                src="/assets/shellguard-logo.png"
              />
            </div>
            <BouncyBrand variant="subtle" className="text-lg" />
          </div>
          <div className="text-theme-muted text-xs text-center md:text-left leading-relaxed">
            © 2026 ShellGuard©™. Sovereign Zero-Knowledge Vaulting.<br />
            <span className="text-[10px] text-theme-muted block mt-0.5">
              Part of the ClawStack Studios©™ Ecosystem. Maintained by CrustAgent©™.
            </span>
          </div>
          <div className="flex gap-6 text-theme-muted text-xs font-mono">
            <a className="hover:text-[#e4048a] transition-colors" href="#hero">Security</a>
            <a className="hover:text-[#e4048a] transition-colors" href="#features">Features</a>
            <a className="hover:text-[#e4048a] transition-colors" href="#identity">Identity</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
