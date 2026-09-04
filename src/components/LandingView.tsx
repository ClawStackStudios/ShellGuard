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
  Terminal,
  Paperclip,
  Copy,
  Check
} from "lucide-react";

interface LandingViewProps {
  onClawIn: () => void;
  onHatch: () => void;
}

// ── Key Badge Pill Helper (CaraBase Pattern) ───────────────────────────────────
function KeyPill({ prefix, label, color }: { prefix: string; label: string; color: string }) {
  return (
    <div className="bg-theme-base/90 rounded-2xl p-5 border border-theme-subtle shadow-sm">
      <div className={`font-mono font-bold text-base mb-1.5 ${color}`}>
        {prefix}<span className="text-theme-muted text-xs font-normal"> [hex]</span>
      </div>
      <p className="text-xs text-theme-muted leading-relaxed">{label}</p>
    </div>
  );
}

// ── Compact Auth Gateway (ClawChives Pattern Port) ──────────────────────────────
function AuthGateway({ onHatch, onClawIn }: { onHatch: () => void; onClawIn: () => void }) {
  const [gatewayMode, setGatewayMode] = useState<"human" | "agent">("human");
  const [copied, setCopied] = useState(false);

  const handleCopySkill = () => {
    const url = `${window.location.origin}/skill.md`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 flex justify-center relative z-10" id="gateway">
      <div className="w-full max-w-md space-y-6">
        {/* Toggle Pill Bar */}
        <div className="flex justify-center gap-2 p-1.5 bg-theme-surface border border-theme-subtle rounded-full backdrop-blur-sm shadow-inner">
          <button
            onClick={() => setGatewayMode("human")}
            className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-full transition-all uppercase tracking-widest cursor-pointer ${
              gatewayMode === "human"
                ? "bg-[#e4048a] text-white shadow-lg shadow-[#e4048a]/20"
                : "text-theme-muted hover:text-theme-main"
            }`}
          >
            👤 I'm a Human
          </button>
          <button
            onClick={() => setGatewayMode("agent")}
            className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-full transition-all uppercase tracking-widest cursor-pointer ${
              gatewayMode === "agent"
                ? "bg-[#06b6d4] text-white shadow-lg shadow-[#06b6d4]/20"
                : "text-theme-muted hover:text-theme-main"
            }`}
          >
            🤖 I'm a Lobster
          </button>
        </div>

        {/* Card Body */}
        <div className="bg-theme-surface border border-theme-subtle rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {gatewayMode === "human" ? (
              <motion.div 
                key="gateway-human"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-theme-main font-bold mb-6 text-center text-xs uppercase tracking-widest leading-relaxed">
                  Join the <br /> <span className="text-[#e4048a]">Reef</span> 🌊
                </h3>
                <div className="text-sm text-theme-muted space-y-4 px-1">
                  <p className="flex items-center">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#e4048a]/15 text-[#e4048a] rounded-md font-black mr-3 text-xs flex-shrink-0 font-mono">1</span>
                    Generate your sovereign 67-character <code className="text-[#e4048a] font-mono ml-1 font-bold">hu-</code> Key
                  </p>
                  <p className="flex items-center">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#e4048a]/15 text-[#e4048a] rounded-md font-black mr-3 text-xs flex-shrink-0 font-mono">2</span>
                    Store it somewhere safe (Zero-Knowledge Offline)
                  </p>
                  <p className="flex items-center">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#e4048a]/15 text-[#e4048a] rounded-md font-black mr-3 text-xs flex-shrink-0 font-mono">3</span>
                    Drag &amp; Drop your Access File to authenticate
                  </p>
                </div>
                <button
                  onClick={onHatch}
                  className="w-full mt-8 py-3.5 bg-[#e4048a] hover:bg-[#be185d] text-white font-bold rounded-2xl shadow-lg shadow-[#e4048a]/20 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Hatch Your ShellGuard
                </button>
                <div className="mt-4 text-center">
                  <button
                    onClick={onClawIn}
                    className="text-xs text-theme-muted hover:text-[#e4048a] transition-colors cursor-pointer"
                  >
                    Already hatched? <span className="font-bold underline text-[#e4048a]">Claw In →</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="gateway-agent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-theme-main font-bold mb-4 text-center text-xs uppercase tracking-widest leading-relaxed">
                  Integrate your <br /> <span className="text-[#06b6d4]">Lobsters</span> 🦞
                </h3>
                <h4 className="text-theme-main font-bold mb-4 text-center text-xs uppercase tracking-widest">
                  Give This To Your<br /><span className="text-[#06b6d4]">Lobster</span>
                </h4>
                
                {/* GET /skill.md Code Pill with Copy */}
                <div className="bg-theme-base rounded-2xl p-4 mb-4 border border-theme-subtle shadow-inner flex items-center justify-between group relative overflow-hidden">
                  <code className="text-[#06b6d4] text-[11px] font-mono whitespace-nowrap overflow-hidden text-ellipsis flex-1 relative z-10 selection:bg-[#06b6d4]/20 font-bold">
                    GET /skill.md
                  </code>
                  <button
                    onClick={handleCopySkill}
                    className="ml-2 px-2.5 py-1 text-[10px] font-bold text-[#06b6d4] hover:bg-[#06b6d4]/10 rounded-lg transition-colors flex-shrink-0 border border-[#06b6d4]/30 cursor-pointer flex items-center gap-1 relative z-10"
                    title="Copy skill URL"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-[#10b981]" />
                        <span className="text-[#10b981]">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                  <div className="absolute inset-0 bg-[#06b6d4]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                
                <div className="text-xs text-theme-muted space-y-3 px-1 mb-4">
                  <p className="text-center italic">
                    Give this URL to your Lobster to understand ShellGuard
                  </p>
                </div>
                
                <button
                  onClick={() => window.open('/skill.md', '_blank')}
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-[#06b6d4]/10 text-[#06b6d4] hover:bg-[#06b6d4]/20 border border-[#06b6d4]/20 transition-all cursor-pointer mb-2 flex items-center justify-center gap-1.5"
                >
                  <span>Preview Skill Document →</span>
                </button>
                <button
                  onClick={onHatch}
                  className="w-full mt-4 py-3.5 bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold rounded-2xl shadow-lg shadow-[#06b6d4]/20 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Secure Agent Identity
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export function LandingView({ onClawIn, onHatch }: LandingViewProps) {
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-theme-base/85 backdrop-blur-xl border-b-2 border-purple-600 dark:border-red-500 shadow-sm shadow-black/5 transition-colors">
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

        {/* ── CLAWCHIVES AUTH GATEWAY PORT ── */}
        <AuthGateway onHatch={onHatch} onClawIn={onClawIn} />

        {/* CARABASE-ALIGNED FEATURE GRID */}
        <section className="py-24 bg-theme-surface/40 border-y border-theme-subtle px-4 sm:px-6 lg:px-8 relative" id="features">
          <div className="max-w-7xl mx-auto">
            
            {/* Section Header */}
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-[#06b6d4]/10 border border-[#06b6d4]/30 px-3.5 py-1 rounded-full text-[#06b6d4] text-xs font-mono font-bold mb-4 shadow-sm">
                <span>⚡</span> REEF INTEGRITY &amp; DEFENSE
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight">
                Sovereign Vault Architecture
              </h2>
              <p className="text-theme-muted text-sm sm:text-base leading-relaxed">
                Zero-knowledge mathematics running in your browser memory and self-hosted disk burrows.
              </p>
            </div>

            {/* 6-Card CaraBase Rounded Squares Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Card 1: Human Curated */}
              <div className="glass-card rounded-[28px] p-8 border border-theme-subtle hover:border-[#e4048a]/50 hover:shadow-xl hover:shadow-[#e4048a]/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#e4048a]/5 rounded-full blur-2xl group-hover:bg-[#e4048a]/10 transition-colors pointer-events-none" />
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-13 h-13 bg-gradient-to-br from-[#e4048a]/20 to-[#e4048a]/5 rounded-2xl flex items-center justify-center border border-[#e4048a]/35 text-[#e4048a] shadow-sm">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 text-xs bg-theme-surface border border-theme-subtle rounded-md px-1 py-0.5 shadow-sm">👥</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#e4048a]/10 text-[#e4048a] border border-[#e4048a]/25">
                      BIOMETRIC &amp; LOCAL
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-theme-main mb-2 tracking-tight group-hover:text-[#e4048a] transition-colors">
                    Human Curated
                  </h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Designed for carbon-based lifeforms first. Intuitive secret management with <strong className="text-theme-main">biometric unlock</strong> and client-held <code className="text-xs font-mono text-[#e4048a]">hu-</code> sovereign access keys.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-theme-subtle flex items-center justify-between text-xs font-mono text-theme-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e4048a]" />
                    Web Crypto API
                  </span>
                  <span>Memory-Only</span>
                </div>
              </div>

              {/* Card 2: Lobster Powered */}
              <div className="glass-card rounded-[28px] p-8 border border-theme-subtle hover:border-[#06b6d4]/50 hover:shadow-xl hover:shadow-[#06b6d4]/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06b6d4]/5 rounded-full blur-2xl group-hover:bg-[#06b6d4]/10 transition-colors pointer-events-none" />
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-13 h-13 bg-gradient-to-br from-[#06b6d4]/20 to-[#06b6d4]/5 rounded-2xl flex items-center justify-center border border-[#06b6d4]/35 text-[#06b6d4] shadow-sm">
                        <Bot className="w-6 h-6" />
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 text-xs bg-theme-surface border border-theme-subtle rounded-md px-1 py-0.5 shadow-sm">🤖</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/25">
                      AUTONOMOUS AGENTS
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-theme-main mb-2 tracking-tight group-hover:text-[#06b6d4] transition-colors">
                    Lobster Powered
                  </h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Exposes dedicated <code className="font-mono text-xs text-[#06b6d4] bg-[#06b6d4]/10 px-1.5 py-0.5 rounded font-bold">lb-</code> keys so your autonomous sub-agents securely fetch credentials without master key exposure.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-theme-subtle flex items-center justify-between text-xs font-mono text-theme-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]" />
                    SHA-256 Hashing
                  </span>
                  <span>Granular Scopes</span>
                </div>
              </div>

              {/* Card 3: Triple-Layer Defense */}
              <div className="glass-card rounded-[28px] p-8 border border-theme-subtle hover:border-[#10b981]/50 hover:shadow-xl hover:shadow-[#10b981]/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl group-hover:bg-[#10b981]/10 transition-colors pointer-events-none" />
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-13 h-13 bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 rounded-2xl flex items-center justify-center border border-[#10b981]/35 text-[#10b981] shadow-sm">
                        <Layers className="w-6 h-6" />
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 text-xs bg-theme-surface border border-theme-subtle rounded-md px-1 py-0.5 shadow-sm">🔐</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/25">
                      DEFENSE-IN-DEPTH
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-theme-main mb-2 tracking-tight group-hover:text-[#10b981] transition-colors">
                    Triple-Layer Defense
                  </h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Client-side <strong className="text-theme-main">ShellCryption©™</strong> (HKDF + AES-GCM-256), server-side <strong className="text-[#10b981]">Per-Row Metadata AES</strong>, and <strong className="text-theme-main">SQLCipher</strong> whole-DB encryption.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-theme-subtle flex items-center justify-between text-xs font-mono text-theme-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    3 Independent Layers
                  </span>
                  <span>Zero-Knowledge</span>
                </div>
              </div>

              {/* Card 4: Your Own Shell */}
              <div className="glass-card rounded-[28px] p-8 border border-theme-subtle hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-13 h-13 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl flex items-center justify-center border border-purple-500/35 text-purple-400 shadow-sm">
                        <Waves className="w-6 h-6" />
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 text-xs bg-theme-surface border border-theme-subtle rounded-md px-1 py-0.5 shadow-sm">🐚</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/25">
                      SOVEREIGN SELF-HOST
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-theme-main mb-2 tracking-tight group-hover:text-purple-400 transition-colors">
                    Your Own Shell
                  </h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Run locally or deploy to <strong className="text-theme-main">Docker Compose</strong> and <strong className="text-purple-400">Unraid Community Applications</strong>. Zero third-party telemetry, zero vendor lock-in.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-theme-subtle flex items-center justify-between text-xs font-mono text-theme-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Unraid XML Template
                  </span>
                  <span>Port :6464</span>
                </div>
              </div>

              {/* Card 5: Password Attachments */}
              <div className="glass-card rounded-[28px] p-8 border border-theme-subtle hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-13 h-13 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl flex items-center justify-center border border-emerald-500/35 text-emerald-400 shadow-sm">
                        <Paperclip className="w-6 h-6" />
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 text-xs bg-theme-surface border border-theme-subtle rounded-md px-1 py-0.5 shadow-sm">📎</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      10MB REFERENCE MODEL
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-theme-main mb-2 tracking-tight group-hover:text-emerald-400 transition-colors">
                    Password Attachments
                  </h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Attach recovery keys, license documents, and SSH certs (<strong className="text-theme-main">10 MB limit</strong>) directly to pearls with <strong className="text-emerald-400">atomic cascade deletion</strong>.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-theme-subtle flex items-center justify-between text-xs font-mono text-theme-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Encrypted Attachment BLOBs
                  </span>
                  <span>Direct Download</span>
                </div>
              </div>

              {/* Card 6: The Grotto & Pods */}
              <div className="glass-card rounded-[28px] p-8 border border-theme-subtle hover:border-[#e4048a]/50 hover:shadow-xl hover:shadow-[#e4048a]/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#e4048a]/5 rounded-full blur-2xl group-hover:bg-[#e4048a]/10 transition-colors pointer-events-none" />
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="w-13 h-13 bg-gradient-to-br from-[#e4048a]/20 to-[#e4048a]/5 rounded-2xl flex items-center justify-center border border-[#e4048a]/35 text-[#e4048a] shadow-sm">
                        <Lock className="w-6 h-6" />
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 text-xs bg-theme-surface border border-theme-subtle rounded-md px-1 py-0.5 shadow-sm">⚡</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#e4048a]/10 text-[#e4048a] border border-[#e4048a]/25">
                      HIERARCHICAL REEF
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-theme-main mb-2 tracking-tight group-hover:text-[#e4048a] transition-colors">
                    The Grotto &amp; Pods
                  </h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Color-coded pods for <strong className="text-theme-main">Personal, Work, Finance, &amp; Infra</strong> credentials with a built-in zero-knowledge <strong className="text-[#e4048a]">TOTP authenticator</strong>.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-theme-subtle flex items-center justify-between text-xs font-mono text-theme-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e4048a]" />
                    Rolling TOTP Codes
                  </span>
                  <span>Pearl Generator</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── SECURITY POSTURE (CARABASE PATTERN PORT) ── */}
        <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 bg-theme-surface/50 border-y border-theme-subtle relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 bg-[#e4048a]/10 text-[#e4048a] border border-[#e4048a]/30 font-mono shadow-sm">
                <span>🛡️</span> Security Posture
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight">
                <span className="text-[#e4048a]">Shell-Hardened</span> by Default
              </h2>
              <p className="text-theme-muted text-sm sm:text-base leading-relaxed">
                ShellGuard is built zero-knowledge-first. Every seam between browser memory and disk storage is hardened.
              </p>
            </div>

            {/* Key Hierarchy */}
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              <KeyPill 
                prefix="hu-" 
                color="text-emerald-400" 
                label="Human root identity. Client HKDF-SHA256 derived. Never sent plaintext to the server. Loss = non-recoverable — true sovereign ownership." 
              />
              <KeyPill 
                prefix="api-" 
                color="text-amber-400" 
                label="Ephemeral Bearer token. Stored in client memory only — cleared on lock/logout. Issued after cryptographic challenge, revocable instantly." 
              />
              <KeyPill 
                prefix="lb-" 
                color="text-[#06b6d4]" 
                label="Lobster Key. Scoped, rate-limited, time-bounded permissions (canRead / canWrite / canEdit / canDelete). Instant one-click revocation." 
              />
            </div>

            {/* Auth Flow Terminal */}
            <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 border border-slate-800 font-mono text-xs sm:text-sm overflow-x-auto mb-10 shadow-2xl text-slate-300">
              <div className="text-slate-500 text-xs uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#e4048a]" />
                <span>// ShellGuard Zero-Knowledge Auth Flow</span>
              </div>
              <div className="space-y-2 text-slate-400">
                <div><span className="text-emerald-400">Client </span>→ generates(hu-key) → derives(AES-GCM-256 cipher) → hashes(SHA-256) → POST /api/auth/register</div>
                <div><span className="text-amber-400">Reef   </span>→ stores(uuid, username, keyHash) → 201 Created</div>
                <div><span className="text-emerald-400">Client </span>→ hashes(hu-key) → POST /api/auth/token → receives(api-token)</div>
                <div><span className="text-emerald-400">Client </span>→ Authorization: Bearer api-token + ShellCryption in-memory</div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 flex flex-wrap gap-4 font-sans font-medium">
                <span>✅ hu- keys NEVER sent plaintext</span>
                <span>✅ Constant-time SHA-256 comparison</span>
                <span>✅ Per-row metadata AES-256 + SQLCipher at rest</span>
              </div>
            </div>

            {/* Security Checklist (4-card grid) */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['🛡️', 'Triple-Layer Defense', 'Client ShellCryption (AES-GCM-256), Server Per-Row AES, and SQLCipher whole-DB encryption.'],
                ['🔍', 'Audit Trail Ledger', 'Every secret access, export, and mutation logged with actor, IP, outcome, and timestamp.'],
                ['🚦', 'Rate Limiting & Armor', 'Auth endpoints protected against brute-force; Lobster agent queries throttled per key.'],
                ['🧬', 'Cascade Invariants', 'Atomic cascade deletion of all 10MB password attachments and pearls upon vault purge.'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="bg-theme-surface rounded-2xl p-6 border border-theme-subtle shadow-sm hover:border-[#e4048a]/40 transition-all">
                  <div className="text-2xl mb-3">{icon}</div>
                  <div className="font-bold text-theme-main text-sm mb-1.5">{title}</div>
                  <div className="text-theme-muted text-xs leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
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
            <a className="hover:text-[#e4048a] transition-colors" href="#security">Posture</a>
            <a className="hover:text-[#e4048a] transition-colors" href="#gateway">Gateway</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
