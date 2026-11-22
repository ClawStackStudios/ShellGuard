import React, { useEffect, useRef, useState } from 'react';
import { X, Wifi, Globe, RefreshCw, ShieldCheck, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  networkResolver,
  type TransportConfigState,
  type TransportMode,
  type VectorProbeResult,
} from '../../lib/networkResolver.ts';
import { getApiBaseUrl } from '../../config/apiConfig.ts';
import type { RiverStatus } from '../../hooks/useReactiveRiver.ts';

export interface TransportDiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  riverStatus?: RiverStatus;
}

function formatHostLabel(url: string | null): string {
  if (!url) return 'Default Origin';
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function getHealthBadge(
  url: string | null | undefined,
  probe: VectorProbeResult | undefined,
  isRacing: boolean,
) {
  if (isRacing && url) {
    return {
      label: 'Measuring',
      className: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse',
    };
  }
  if (!url) {
    return {
      label: 'Unreachable',
      className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
  }
  if (probe?.status === 'online') {
    return {
      label: 'Reachable',
      className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    };
  }
  if (probe?.status === 'timeout' || probe?.status === 'error') {
    return {
      label: 'Unreachable',
      className: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    };
  }
  return {
    label: 'Standby',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
}

export function TransportDiagnosticsDrawer({
  isOpen,
  onClose,
  riverStatus = 'disconnected',
}: TransportDiagnosticsDrawerProps) {
  const [state, setState] = useState<TransportConfigState>(() => networkResolver.getState());
  const [isRacing, setIsRacing] = useState(false);
  const [tlsFingerprint, setTlsFingerprint] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    return networkResolver.subscribe(setState);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setState(networkResolver.getState());
    closeBtnRef.current?.focus();

    const base = getApiBaseUrl();
    fetch(`${base}/api/public/tls-manifest`, { credentials: 'omit', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const fp = payload?.data?.certFingerprint;
        setTlsFingerprint(typeof fp === 'string' ? fp : null);
      })
      .catch(() => setTlsFingerprint(null));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRaceNow = async () => {
    setIsRacing(true);
    try {
      await networkResolver.discoverEndpoints(getApiBaseUrl());
      await networkResolver.race();
    } finally {
      setIsRacing(false);
    }
  };

  const handleModeChange = (mode: TransportMode) => {
    networkResolver.setMode(mode);
    void networkResolver.race();
  };

  const lanUrl = state.endpoints.lan[0] ?? null;
  const tsUrl = state.endpoints.tailscale ?? null;
  const lanBadge = getHealthBadge(lanUrl, state.lastRtts.lan, isRacing);
  const tsBadge = getHealthBadge(tsUrl, state.lastRtts.tailscale, isRacing);
  const activeProbe = state.activeVector ? state.lastRtts[state.activeVector] : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="transport-drawer-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="relative z-10 w-full max-w-md h-full bg-theme-surface border-l border-theme-subtle shadow-2xl flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="p-5 border-b border-theme-subtle flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="text-claw-cyan" size={20} />
                <h2 id="transport-drawer-title" className="text-lg font-black text-theme-main">
                  Transport Diagnostics
                </h2>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Close Transport Diagnostics"
                className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-base transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Active Transport Banner */}
              <div className="p-4 rounded-2xl border border-claw-cyan/30 bg-claw-cyan/5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-claw-cyan mb-1">
                    Active Transport · River {riverStatus}
                  </div>
                  <div className="text-sm font-bold text-theme-main truncate flex items-center gap-1.5">
                    {state.activeVector === 'tailscale' ? (
                      <>
                        <Globe size={15} className="text-claw-magenta shrink-0" />
                        <span>🌐 Tailscale Mesh: {formatHostLabel(state.activeUrl)}</span>
                      </>
                    ) : (
                      <>
                        <Zap size={15} className="text-claw-cyan shrink-0" />
                        <span>⚡ LAN Direct: {formatHostLabel(state.activeUrl)}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-theme-base border border-theme-subtle text-theme-main shrink-0">
                  {activeProbe?.rttMs !== null && activeProbe?.rttMs !== undefined
                    ? `${activeProbe.rttMs}ms`
                    : '--'}
                </span>
              </div>

              {/* Dual Vector Telemetry Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-theme-muted">
                  Reachability Vectors
                </h3>

                <div className="p-4 rounded-2xl border border-theme-subtle bg-theme-base/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-theme-main flex items-center gap-2">
                      <Wifi size={15} className="text-claw-cyan" />
                      LAN Direct
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${lanBadge.className}`}>
                      {lanBadge.label}
                      {state.lastRtts.lan?.rttMs != null ? ` · ${state.lastRtts.lan.rttMs}ms` : ''}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-theme-muted truncate">
                    {lanUrl || 'No LAN vector discovered'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-theme-subtle bg-theme-base/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-theme-main flex items-center gap-2">
                      <Globe size={15} className="text-claw-magenta" />
                      Tailscale Mesh
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${tsBadge.className}`}>
                      {tsBadge.label}
                      {state.lastRtts.tailscale?.rttMs != null ? ` · ${state.lastRtts.tailscale.rttMs}ms` : ''}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-theme-muted truncate">
                    {tsUrl || 'Not active on host'}
                  </p>
                </div>
              </div>

              {/* Pinning Mode Selector */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-theme-muted">
                  Transport Pinning Mode
                </h3>
                <div className="flex bg-theme-base border border-theme-subtle rounded-xl overflow-hidden text-xs font-semibold">
                  {(
                    [
                      { id: 'auto', label: 'Auto (Race)' },
                      { id: 'force-lan', label: 'Force LAN' },
                      { id: 'force-tailscale', label: 'Force Tailscale' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleModeChange(opt.id)}
                      className={`flex-1 py-2.5 px-2 text-center transition-all cursor-pointer border-r last:border-r-0 border-theme-subtle ${
                        state.mode === opt.id
                          ? 'bg-claw-cyan text-ocean-dark font-black'
                          : 'text-theme-main hover:bg-theme-surface'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Race Now Action */}
              <button
                type="button"
                onClick={handleRaceNow}
                disabled={isRacing}
                className="w-full py-2.5 px-4 rounded-xl bg-claw-cyan hover:brightness-110 text-ocean-dark font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={16} className={isRacing ? 'animate-spin' : ''} />
                {isRacing ? 'Racing Vectors…' : 'Race Now'}
              </button>

              {/* TLS Certificate Fingerprint */}
              <div className="p-4 rounded-2xl border border-theme-subtle bg-theme-base/60 space-y-1.5">
                <div className="text-xs font-bold text-theme-main flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  TLS Certificate Fingerprint (SHA-256)
                </div>
                <p className="text-[11px] font-mono text-theme-muted break-all">
                  {tlsFingerprint || 'Unavailable (HTTP mode or no rotation manifest)'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
