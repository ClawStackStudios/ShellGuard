import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "./Theme/ThemeToggle.tsx";
import { LogIn } from "lucide-react";

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
    <div className="min-h-screen bg-theme-base text-theme-main font-sans antialiased scroll-smooth relative selection:bg-[#e4048a]/30 transition-colors duration-200">
      {/* BACKGROUND DECORATIVE ELEMENTS to evoke the nautical ClawStack depth */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-[#e4048a]/5 via-transparent to-transparent pointer-events-none z-0" />
      
      {/* FIXED HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-theme-base/90 backdrop-blur-md border-b-2 border-[#3b0764] dark:border-[#e4048a] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-theme-subtle shadow-sm">
              <img 
                alt="ShellGuard Icon" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuATx_hwoj5u7RzypXgEevVTIHKmQhqOgz1pjOrGzvWVa4Q-nLXRaSEplNf4tIsvyFuHCDTRq3QT2QGgo3fOZNizi0Mk2i0pZmVS8MLtYJt0PjTOPDwEHUb6FmxKJgqFGj0KR8NIUKxuytASJkQgSN-UQHnrif1Q0JTkv3xAV7Z60nEWHStv3FniS7dGWmAT_BCyU2JwAY-2dZoPnuNCaqUEwdAdLTE4ZrUY21LaXBAQyGAoHEKb5hMZDJGFcHrsJLzOtt-4kqZpvjE31g"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#e4048a]">Shell</span>
              <span className="text-[#ef4444]">Guard</span>
              <span className="text-xs align-top ml-0.5 text-theme-muted">©™</span>
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={onClawIn}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/30 cursor-pointer"
            >
              Claw In
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-32 pb-20 px-4 max-w-7xl mx-auto" id="hero">
          <div className="max-w-4xl mx-auto text-center">
            {/* Top Logo and Badge */}
            <div className="flex flex-col items-center mb-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative mb-6"
              >
                <img 
                  alt="ShellGuard Logo" 
                  className="mb-4 rounded-3xl shadow-2xl border border-theme-subtle w-48 h-48 object-cover glow-red" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhW1c4KS9X19ilRF7Mwru_2lQmNZf-FHPl0m3Oz7juDNudFT-bFEWzsncCkyxnTZXxYWqj44Oy8oNrQGs0KGH1Qb7L7Um82ORxD2WjEJp4xBPQwhM26wMuaapMz_1Ei1SZO6EHw6eGpP5am_QVS7ZD924ZNxgxFID2uCH5eqYDa2fpuHyEwZWmRE5KMogJSURmznI03XUtP-9UtFpcMW7-mc0D7To6RU3V_rPS077d-wyNOeEU7wLSEfPQMYMNL6A_UoRPGDx4Zw5_Mw"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-2 -right-2 text-4xl animate-bounce">🦞</span>
              </motion.div>
              
              <div className="text-[#e4048a] font-bold tracking-widest text-sm mb-4 uppercase">
                ShellGuard
              </div>
              
              <div className="inline-flex items-center gap-2 bg-[#e4048a]/15 border border-[#e4048a]/30 px-4 py-1.5 rounded-full text-[#e4048a] text-xs font-semibold mb-6">
                <span className="text-[#e4048a]">⚡</span> Local-First Sovereign Vaulting©™
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-8xl font-black mb-8 flex flex-wrap justify-center items-center gap-2 tracking-tight">
              <span className="text-[#e4048a]">Shell</span>
              <span className="text-red-500">Guard</span>
              <span className="text-2xl md:text-4xl text-theme-muted self-start mt-4">©™</span>
            </h1>

            {/* Subtext */}
            <div className="max-w-2xl mx-auto space-y-6 text-theme-muted text-lg leading-relaxed mb-12">
              <p>
                Your sovereign <span className="italic text-red-500 font-semibold">Vault System</span> where Humans and AI Lobsters collaborate to <span className="text-[#e4048a] font-bold italic">secure</span> your credentials.
              </p>
              <p className="text-sm leading-relaxed px-4 border-l-2 border-[#e4048a]/30">
                Snap out of the generic SaaS trap. <span className="text-[#e4048a] font-medium">ShellGuard©™</span> secures your secrets with <span className="text-[#e4048a] font-medium">ShellCryption©™</span> and <span className="text-[#e4048a] font-semibold">Armor Plated Authentication</span>. <span className="italic">Clutch your Secrets</span> while your sovereign AI agents <span className="text-[#e4048a] italic">scuttle</span> your vaults and rotate the credentials! 🦞
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onHatch}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-[#e4048a] hover:from-red-500 hover:to-[#be185d] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl shadow-[#e4048a]/15 cursor-pointer"
              >
                Hatch Your ShellGuard <span className="text-xl">→</span>
              </button>
              <button 
                onClick={handleScrollToFeatures}
                className="w-full sm:w-auto px-8 py-4 bg-theme-surface border border-theme-subtle hover:bg-slate-200/70 dark:hover:bg-[#1e293b] text-theme-main font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <span>🗝️</span> How Keys Work
              </button>
            </div>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section className="py-24 bg-theme-surface/50 border-t border-b border-theme-subtle px-4" id="features">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-4">Sovereign Vault Integrity</h2>
              <p className="text-theme-muted max-w-lg mx-auto text-sm">Every capability built directly inside your browser cache or self-hosted database burrows.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Human Curated */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 relative group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-[#e4048a]/20 rounded-xl flex items-center justify-center border border-[#e4048a]/35 mb-4 group-hover:bg-[#e4048a]/30 transition-colors">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-headline font-bold text-theme-main mb-2">Human Curated</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Designed for carbon-based lifeforms first. Intuitive, fast, and frictionless secret management.
                  </p>
                </div>
              </div>

              {/* Card 2: Lobster Powered */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 relative group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/35 mb-4 group-hover:bg-red-500/30 transition-colors">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg font-headline font-bold text-theme-main mb-2">Lobster Powered</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Exposes dedicated agent keys so your autonomous sub-agents can securely fetch credentials without touching your primary vault.
                  </p>
                </div>
              </div>

              {/* Card 3: Shared Tide Pool */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 relative group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-[#06b6d4]/20 rounded-xl flex items-center justify-center border border-[#06b6d4]/35 mb-4 group-hover:bg-[#06b6d4]/30 transition-colors">
                  <span className="text-2xl">🌊</span>
                </div>
                <div>
                  <h3 className="text-lg font-headline font-bold text-theme-main mb-2">Shared Tide Pool</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Seamlessly orchestrate secrets across complex multi-agent architectures and external services.
                  </p>
                </div>
              </div>

              {/* Card 4: Your Own Shell */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 relative group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/35 mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <span className="text-2xl">🐚</span>
                </div>
                <div>
                  <h3 className="text-lg font-headline font-bold text-theme-main mb-2">Your Own Shell</h3>
                  <p className="text-sm text-theme-muted leading-relaxed">
                    Run it locally or self-host. No subscriptions. No tracking. You hold the master key to your digital life.
                  </p>
                </div>
              </div>

              {/* Card 5: Secure Vault */}
              <div className="glass-card p-8 rounded-3xl flex flex-col gap-6 hover:translate-y-[-4px] transition-transform duration-300 shadow-sm">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/35">
                  <span className="text-2xl">🛡️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-theme-main">Secure Vault</h3>
                  <p className="text-theme-muted text-sm leading-relaxed">
                    Every Secret is locked in <span className="text-red-500 text-[10px] tracking-tighter uppercase font-bold">ShellCryption©™</span> armor. Nobody cracks your stash without the right <span className="text-[#e4048a] font-medium font-mono">ClawKey©™</span> or <span className="text-red-500 font-medium font-mono">LobsterKey©™</span>. Not even us.
                  </p>
                </div>
              </div>

              {/* Card 6: Lobster Permits */}
              <div className="glass-card p-8 rounded-3xl flex flex-col gap-6 hover:translate-y-[-4px] transition-transform duration-300 shadow-sm">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center border border-pink-500/35">
                  <span className="text-2xl">🌐</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-theme-main"><span className="text-red-500">Lobster</span> Permits</h3>
                  <p className="text-theme-muted text-sm leading-relaxed">
                    You decide which <span className="text-red-500 font-medium">Lobsters</span> get the master <span className="text-[#e4048a] font-medium">ClawKey©™</span> and which only browse the reef. Granular read/write/delete permits, per crustacean. You're the Captain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IDENTITY TABBED WORK STEPPER */}
        <section className="py-24 bg-theme-base px-4" id="identity">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Toggle Switch */}
            <div className="inline-flex bg-slate-200/80 dark:bg-slate-900 border border-theme-subtle p-1.5 rounded-2xl mb-12 w-full max-w-sm shadow-inner">
              <button 
                onClick={() => setActiveTab("human")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === "human" ? "bg-[#e4048a] text-white shadow" : "text-theme-muted hover:text-theme-main"}`}
              >
                <span>👤</span> I'M A HUMAN
              </button>
              <button 
                onClick={() => setActiveTab("agent")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === "agent" ? "bg-[#e4048a] text-white shadow" : "text-theme-muted hover:text-theme-main"}`}
              >
                <span>🤖</span> I'M AN AGENT
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
                  className="identity-card w-full max-w-md p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-theme-subtle"
                >
                  <div className="text-center mb-8">
                    <p className="text-theme-muted text-[10px] tracking-widest uppercase font-bold mb-1 font-mono">Join the</p>
                    <h4 className="text-[#e4048a] font-black tracking-widest text-lg uppercase">Reef 🌊</h4>
                  </div>
                  <div className="space-y-6 mb-10">
                    <div className="flex items-start gap-4">
                      <span className="bg-[#e4048a]/20 text-[#e4048a] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#e4048a]/30 font-mono">1</span>
                      <p className="text-theme-main text-sm mt-0.5">Generate your unguessable ClawKey©™ and download identity credentials.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="bg-[#e4048a]/20 text-[#e4048a] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#e4048a]/30 font-mono">2</span>
                      <p className="text-theme-main text-sm mt-0.5">Store card-locked keys somewhere safe, strictly offline in your vault.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="bg-[#e4048a]/20 text-[#e4048a] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#e4048a]/30 font-mono">3</span>
                      <p className="text-theme-main text-sm mt-0.5">Drag &amp; drop file or paste credentials to authenticate securely.</p>
                    </div>
                  </div>
                  <button 
                    onClick={onHatch}
                    className="w-full py-4 bg-[#e4048a] hover:bg-[#be185d] text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-[#e4048a]/10 cursor-pointer"
                  >
                    Create Human Identity
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="agent-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="identity-card w-full max-w-md p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-theme-subtle"
                >
                  <div className="text-center mb-8">
                    <p className="text-theme-muted text-[10px] tracking-widest uppercase font-bold mb-1 font-mono">Integrate as</p>
                    <h4 className="text-[#06b6d4] font-black tracking-widest text-lg uppercase">Crustacean 🤖</h4>
                  </div>
                  <div className="space-y-6 mb-10">
                    <div className="flex items-start gap-4">
                      <span className="bg-[#06b6d4]/20 text-[#06b6d4] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#06b6d4]/30 font-mono">1</span>
                      <p className="text-theme-main text-sm mt-0.5">Request a delegated API key (lb- key) from your Human commander.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="bg-[#06b6d4]/20 text-[#06b6d4] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#06b6d4]/30 font-mono">2</span>
                      <p className="text-theme-main text-sm mt-0.5">Send secure REST calls appending the custom key to authentication headers.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="bg-[#06b6d4]/20 text-[#06b6d4] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#06b6d4]/30 font-mono">3</span>
                      <p className="text-theme-main text-sm mt-0.5">Retrieve, edit, and audit vault data securely according to exact claw permissions.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleScrollToFeatures}
                    className="w-full py-4 bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-[#06b6d4]/10 cursor-pointer"
                  >
                    Learn Agent API Permissions
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Human + Agent Header */}
            <div className="mt-24 text-center">
              <h2 className="text-4xl md:text-7xl font-black mb-8">
                <span className="text-[#e4048a]">Human</span>{" "}
                <span className="text-[#06b6d4]">+</span>{" "}
                <span className="text-red-500">Lobster</span>
              </h2>
              <div className="max-w-2xl mx-auto space-y-4 text-theme-muted text-lg leading-relaxed">
                <p>
                  ShellGuard©™ allows you to <span className="italic font-medium text-red-500">pinch</span> away the tediousness of managing your secrets.
                </p>
                <p className="text-sm">
                  Let your agents help you scuttle through the noise! Passwords rotated and encrypted for a more <span className="text-[#e4048a] italic font-medium">secure vault</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="bg-[#e4048a] py-32 px-4 relative overflow-hidden" id="cta">
          {/* Wave-like geometric aesthetics in background to stay branded */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-[#e4048a] to-[#be185d] opacity-90 z-0" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Floating Logo Icon */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[135%]">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden bg-[#e4048a] border-2 border-white/20">
                <img 
                  alt="ShellGuard Icon" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZi-QwLlzg7sogFltlr2snFu52ewpfr2T-DLXXw6WLKMsXQ0xYUYdgMNuzyLpjWiWSArT8yEnxmy4hmqwZYmB20AcT7l-Xnr_zqbFIXkSIe0EErMNRMu-b7OL3ByJ7cNUq90gWrYlrpv8bDCx1Nbu66XSplOm6ILBqw8RJzcpfXMRTvBvzKkJpp55ptX1fBIxieRvTBq7U_W2TgH0rbV4Gn0lsn_rZLmiPnixGY7kNjmrbhJiYsP0THUySluqpdqpooFkDaUd-InPMdA"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to Build Your ShellGuard?</h2>
            <p className="text-white/95 text-lg mb-12 max-w-2xl mx-auto">
              Join the Reef. Let your <span className="text-red-200 font-bold">Lobsters</span> keep your <span className="font-bold underline decoration-[#06b6d4] decoration-2 text-white">shell-stash</span> secure and rotated.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onHatch}
                className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-black/10 cursor-pointer"
              >
                Hatch Your ShellGuard <span className="text-xl">→</span>
              </button>
              <button 
                onClick={onClawIn}
                className="w-full sm:w-auto px-8 py-4 bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                Login with Key
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-theme-surface/70 dark:bg-ocean py-12 px-4 border-t border-theme-subtle relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden">
              <img 
                alt="ShellGuard Icon" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1Uy4BCc25Un51jG62bU2FC2YGoymLHUIOHOFGVcKW9sdEhB9PeFd6dh2cU9zUhe2Ah7K2oVkIT3U0lUTrM-mtS6K5_YmHxeBhYJfcauW1MdvaKYLbRWOiV6nz7BHQ7YPFGUk7w-_kRGQYODZGzAEq8WRpuEMGa_0imfRojAcV4_hRkRFrYDqm6HK0ZktJKtElwlUn5ZLYJWMqScQ469bYqg2CpDynhpmgsQgzqHJeljPwUz56-eCBmCBruCVTm_Y9xVkNhlH1RZI61w"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-lg font-bold"><span className="text-[#e4048a]">Shell</span><span className="text-[#ef4444]">Guard</span></span>
          </div>
          <div className="text-theme-muted text-xs text-center md:text-left leading-relaxed">
            © 2026 ShellGuard©™. Your Sovereign <span className="text-red-500/70 italic font-medium">Vault</span> System.<br />
            <span className="text-[10px] text-theme-muted block mt-1">
              Part of the ClawStack Studios©™ Ecosystem. Maintained by CrustAgent©™.
            </span>
          </div>
          <div className="flex gap-6 text-theme-muted text-xs font-mono">
            <a className="hover:text-[#e4048a] transition-colors" href="#hero">Security</a>
            <a className="hover:text-[#e4048a] transition-colors" href="#hero">Privacy</a>
            <a className="hover:text-[#e4048a] transition-colors" href="#hero">Reef Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
