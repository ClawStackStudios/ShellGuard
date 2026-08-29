/**
 * LobsterKeyWizard — ShellGuard©™
 *
 * 4-step modal for generating Lobster Keys:
 * details → permissions → expiration → review → generated
 *
 * Fully themed with ShellGuard Reef Modernist design system (lobster-red & claw-cyan).
 */

import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertTriangle, Eye, EyeOff, Copy, CheckCircle, Clock } from 'lucide-react';
import { restAdapter } from '../../services/api/restAdapter';
import { LobsterKey } from './LobsterKeysTab';

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 'details' | 'permissions' | 'expiration' | 'review' | 'generated';

export type PermissionLevel = "READ" | "WRITE" | "EDIT" | "MOVE" | "FULL" | "ECOSYSTEM" | "CUSTOM";

export interface AgentPermission {
  level: PermissionLevel;
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canMove: boolean;
  canDelete: boolean;
}

interface FormData {
  name: string;
  description: string;
  permissionLevel: PermissionLevel;
  customPermissions?: AgentPermission;
  expirationType: 'never' | '30d' | '60d' | '90d' | 'custom';
  customExpirationDate: string;
  rateLimit: number;
}

const STEPS: WizardStep[] = ['details', 'permissions', 'expiration', 'review', 'generated'];
const STEP_LABELS: Record<WizardStep, string> = {
  details: 'Details',
  permissions: 'Permissions',
  expiration: 'Expiration',
  review: 'Review',
  generated: 'Done',
};

const INITIAL_FORM: FormData = {
  name: '',
  description: '',
  permissionLevel: 'READ',
  customPermissions: { level: 'CUSTOM', canRead: false, canWrite: false, canEdit: false, canMove: false, canDelete: false },
  expirationType: 'never',
  customExpirationDate: '',
  rateLimit: 0,
};

export const PERMISSION_CONFIGS: Record<PermissionLevel, AgentPermission> = {
  READ: { level: "READ", canRead: true, canWrite: false, canEdit: false, canMove: false, canDelete: false },
  WRITE: { level: "WRITE", canRead: true, canWrite: true, canEdit: false, canMove: false, canDelete: false },
  EDIT: { level: "EDIT", canRead: true, canWrite: true, canEdit: true, canMove: false, canDelete: false },
  MOVE: { level: "MOVE", canRead: true, canWrite: true, canEdit: true, canMove: true, canDelete: false },
  ECOSYSTEM: { level: "ECOSYSTEM", canRead: true, canWrite: true, canEdit: true, canMove: true, canDelete: false },
  FULL: { level: "FULL", canRead: true, canWrite: true, canEdit: true, canMove: true, canDelete: true },
  CUSTOM: { level: "CUSTOM", canRead: false, canWrite: false, canEdit: false, canMove: false, canDelete: false },
};

export const PERMISSION_INFO: Record<PermissionLevel, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  ECOSYSTEM: {
    label: "ClawStack Ecosystem",
    description: "1-Click Preset: Optimized for ClawChives, CaraBase & ShellGuard. Includes all capabilities except permanent deletion.",
    color: "text-lobster-red",
    bgColor: "bg-lobster-red/10",
    borderColor: "border-lobster-red",
    icon: "🦀"
  },
  READ: {
    label: "Read Only",
    description: "Can read vault items and secrets. Cannot create, modify, or delete.",
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: "📖"
  },
  WRITE: {
    label: "Write",
    description: "Can create new vault items. Cannot modify or delete existing items.",
    color: "text-claw-cyan",
    bgColor: "bg-claw-cyan/10",
    borderColor: "border-claw-cyan/30",
    icon: "✏️"
  },
  EDIT: {
    label: "Edit",
    description: "Can read, write, and modify vault items. Cannot delete.",
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    icon: "🔧"
  },
  MOVE: {
    label: "Move",
    description: "Can read, write, edit, and reorganize vault pods. Cannot delete.",
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    icon: "📁"
  },
  FULL: {
    label: "Full Access",
    description: "Complete control over all vault operations including deletion.",
    color: "text-lobster-red",
    bgColor: "bg-red-500/10",
    borderColor: "border-lobster-red/30",
    icon: "🔑"
  },
  CUSTOM: {
    label: "Custom",
    description: "Granular control over specific actions.",
    color: "text-theme-main",
    bgColor: "bg-theme-base",
    borderColor: "border-theme-subtle",
    icon: "⚙️"
  },
};

interface LobsterKeyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyGenerated: (key: LobsterKey) => void;
}

export function LobsterKeyWizard({ isOpen, onClose, onKeyGenerated }: LobsterKeyWizardProps) {
  const [step, setStep] = useState<WizardStep>('details');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [generatedKey, setGeneratedKey] = useState<LobsterKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMasked, setIsMasked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep('details');
      setForm(INITIAL_FORM);
      setGeneratedKey(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentIdx = STEPS.indexOf(step);
  const isLastConfigStep = step === 'review';

  const isStepValid = (): boolean => {
    if (step === 'details') return form.name.trim().length >= 2;
    if (step === 'permissions') {
      if (form.permissionLevel === 'CUSTOM') {
        const c = form.customPermissions;
        return !!c && (c.canRead || c.canWrite || c.canEdit || c.canMove || c.canDelete);
      }
      return true;
    }
    if (step === 'expiration') {
      if (form.expirationType === 'custom') return form.customExpirationDate.length > 0;
      return true;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 'review') {
      await handleGenerate();
      return;
    }
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  };

  const handleBack = () => {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      let permissions: Record<string, boolean> = {};
      const basePerms = form.permissionLevel === 'CUSTOM' && form.customPermissions
        ? form.customPermissions
        : PERMISSION_CONFIGS[form.permissionLevel];

      const { level: _, ...permsOnly } = basePerms;
      permissions = permsOnly;

      const expirationDate = form.expirationType === 'custom' 
        ? new Date(form.customExpirationDate).toISOString()
        : null;

      const rateLimit = form.rateLimit > 0 ? form.rateLimit : null;

      const res = await restAdapter.POST<{ success?: boolean; data?: LobsterKey } & LobsterKey>('/api/agent-keys', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        permissions,
        expirationType: form.expirationType,
        expirationDate: expirationDate || undefined,
        rateLimit: rateLimit || undefined
      });

      // Handle envelope unwrapping or direct response
      const key: LobsterKey = (res as any)?.data ? (res as any).data : res;
      setGeneratedKey(key);
      setStep('generated');
      onKeyGenerated(key);
    } catch (e: any) {
      setError(e.message || 'Failed to generate key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const rawKey = generatedKey?.key || generatedKey?.apiKey || generatedKey?.api_key;
    if (!rawKey) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawKey);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = rawKey;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const formatExpirationDate = () => {
    if (form.expirationType === 'never') return 'Never expires';
    if (form.expirationType === 'custom') {
      if (!form.customExpirationDate) return 'Custom date';
      return new Date(form.customExpirationDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    }
    const days = parseInt(form.expirationType, 10);
    return new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const rawSpawnedKey = generatedKey?.key || generatedKey?.apiKey || generatedKey?.api_key || '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-theme-surface border-2 border-lobster-red/40 dark:border-lobster-red/50 rounded-3xl shadow-2xl shadow-lobster-red/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-theme-subtle">
          <div className="flex items-center gap-3">
            <div className="bg-lobster-red/10 p-2.5 rounded-2xl text-lobster-red border border-lobster-red/20">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-theme-main">Hatch a Lobster Key</h2>
              <p className="text-sm text-theme-muted">
                Create a secure <span className="text-claw-cyan font-mono font-bold">lb-</span> API key
              </p>
            </div>
          </div>
          {step !== 'generated' && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-base transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'generated' && (
          <div className="px-6 py-3 border-b border-theme-subtle bg-theme-base">
            <div className="flex items-center gap-2">
              {(['details', 'permissions', 'expiration', 'review'] as WizardStep[]).map((s, i) => {
                const isCompleted = currentIdx > i;
                const isCurrent = step === s;
                return (
                  <React.Fragment key={s}>
                    {i > 0 && (
                      <div className={`flex-1 h-0.5 rounded-full ${isCompleted ? 'bg-claw-cyan' : 'bg-theme-subtle'}`} />
                    )}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-lobster-red/10 text-lobster-red'
                        : isCompleted
                        ? 'text-claw-cyan'
                        : 'text-theme-muted'
                    }`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isCurrent
                          ? 'bg-lobster-red text-white'
                          : isCompleted
                          ? 'bg-claw-cyan text-slate-950 font-bold'
                          : 'bg-theme-subtle text-theme-muted'
                      }`}>
                        {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
                      </span>
                      <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-lobster-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-lobster-red font-medium">{error}</p>
            </div>
          )}

          {/* ── Details ──────────────────────────────────────────────────── */}
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-theme-main mb-1">
                  Agent Name <span className="text-lobster-red">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sync Bot"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-theme-subtle bg-theme-base px-3.5 text-sm text-theme-main placeholder-theme-muted focus:outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-theme-main mb-1">
                  Description <span className="text-theme-muted font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="What will this agent do?"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-theme-subtle bg-theme-base px-3.5 py-2.5 text-sm text-theme-main placeholder-theme-muted focus:outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan resize-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* ── Permissions ───────────────────────────────────────────────── */}
          {step === 'permissions' && (
            <div className="space-y-4">
              <p className="text-sm text-theme-muted">
                Select the permission level for this agent. Choose the minimum level required.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(PERMISSION_INFO) as PermissionLevel[]).map((level) => {
                  const info = PERMISSION_INFO[level];
                  const isSelected = form.permissionLevel === level;
                  
                  return (
                    <div
                      key={level}
                      onClick={() => setForm(f => ({ ...f, permissionLevel: level }))}
                      className={`cursor-pointer transition-all rounded-2xl p-4 border-2 ${
                        isSelected
                          ? `${info.bgColor} ${info.borderColor} ring-1 ring-lobster-red/50 shadow-sm`
                          : "border-theme-subtle hover:border-theme-muted bg-theme-base"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`text-2xl ${isSelected ? "" : "opacity-50 grayscale transition-all"}`}>
                          {info.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold text-base ${info.color}`}>
                              {info.label}
                            </h3>
                            {isSelected && (
                              <Check className="w-5 h-5 text-lobster-red ml-auto flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-theme-muted mt-1">
                            {info.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {PERMISSION_CONFIGS[level].canRead && (
                              <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
                                Read
                              </span>
                            )}
                            {PERMISSION_CONFIGS[level].canWrite && (
                              <span className="px-2.5 py-0.5 bg-claw-cyan/10 text-claw-cyan text-xs font-semibold rounded-full border border-claw-cyan/20">
                                Write
                              </span>
                            )}
                            {PERMISSION_CONFIGS[level].canEdit && (
                              <span className="px-2.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold rounded-full border border-orange-500/20">
                                Edit
                              </span>
                            )}
                            {PERMISSION_CONFIGS[level].canMove && (
                              <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-full border border-purple-500/20">
                                Move
                              </span>
                            )}
                            {PERMISSION_CONFIGS[level].canDelete && (
                              <span className="px-2.5 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full border border-red-500/20">
                                Delete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {form.permissionLevel === "CUSTOM" && form.customPermissions && (
                <div className="mt-4 p-5 bg-theme-base border border-theme-subtle rounded-2xl space-y-4">
                  <h4 className="font-bold text-theme-main text-sm">Custom Permissions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(["canRead", "canWrite", "canEdit", "canMove", "canDelete"] as const).map((flag) => (
                      <label key={flag} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.customPermissions![flag]}
                          onChange={(e) =>
                            setForm(f => ({
                              ...f,
                              customPermissions: {
                                ...f.customPermissions!,
                                [flag]: e.target.checked,
                              },
                            }))
                          }
                          className="w-5 h-5 rounded border-theme-subtle text-lobster-red focus:ring-lobster-red/20 bg-theme-surface cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-theme-main capitalize">
                          {flag.replace("can", "")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Expiration ────────────────────────────────────────────────── */}
          {step === 'expiration' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-theme-main mb-2">Expiration</label>
                <select
                  value={form.expirationType}
                  onChange={(e) => setForm(f => ({ ...f, expirationType: e.target.value as FormData['expirationType'] }))}
                  className="w-full h-11 rounded-xl border border-theme-subtle bg-theme-base px-3.5 text-sm text-theme-main focus:outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-colors"
                >
                  <option value="never">Never expires</option>
                  <option value="30d">30 days</option>
                  <option value="60d">60 days</option>
                  <option value="90d">90 days</option>
                  <option value="custom">Custom date</option>
                </select>
              </div>
              {form.expirationType === 'never' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Security Notice</p>
                    <p className="text-xs text-theme-muted mt-1">Keys that never expire require careful manual rotation. Consider setting an expiration date.</p>
                  </div>
                </div>
              )}
              {form.expirationType !== 'never' && form.expirationType !== 'custom' && (
                <div className="p-4 bg-theme-base border border-theme-subtle rounded-2xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-claw-cyan" />
                  <p className="text-sm text-theme-main">
                    Expires on <span className="font-bold text-claw-cyan">{formatExpirationDate()}</span>
                  </p>
                </div>
              )}
              {form.expirationType === 'custom' && (
                <div>
                  <label className="block text-sm font-bold text-theme-main mb-1">Custom Date</label>
                  <input
                    type="date"
                    value={form.customExpirationDate}
                    onChange={(e) => setForm(f => ({ ...f, customExpirationDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-11 rounded-xl border border-theme-subtle bg-theme-base px-3.5 text-sm text-theme-main focus:outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-colors"
                  />
                </div>
              )}
              {/* Rate limit inline in expiration step */}
              <div className="pt-3 border-t border-theme-subtle">
                <label className="block text-sm font-bold text-theme-main mb-3">
                  Rate Limit — <span className="text-claw-cyan font-bold">{form.rateLimit === 0 ? '∞ Unlimited' : `${form.rateLimit} req/min`}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={form.rateLimit}
                  onChange={(e) => setForm(f => ({ ...f, rateLimit: parseInt(e.target.value, 10) }))}
                  className="w-full h-2 bg-theme-base rounded-lg appearance-none cursor-pointer accent-claw-cyan"
                />
                <div className="flex gap-2 mt-3">
                  {[0, 60, 300, 1000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, rateLimit: v }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        form.rateLimit === v
                          ? 'bg-claw-cyan text-slate-950 shadow-sm'
                          : 'bg-theme-base text-theme-muted hover:text-theme-main hover:bg-theme-surface border border-theme-subtle'
                      }`}
                    >
                      {v === 0 ? '∞' : v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Review ────────────────────────────────────────────────────── */}
          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-theme-main">Review Configuration</h3>
              <div className="bg-theme-base border border-theme-subtle rounded-2xl p-5 space-y-3.5">
                {[
                  { label: 'Name', value: form.name },
                  { label: 'Description', value: form.description || '—' },
                  { label: 'Permissions', value: form.permissionLevel === 'CUSTOM' ? 'Custom' : PERMISSION_INFO[form.permissionLevel].label },
                  { label: 'Expiration', value: formatExpirationDate() },
                  { label: 'Rate Limit', value: form.rateLimit === 0 ? 'Unlimited' : `${form.rateLimit} req/min` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-theme-muted">{label}</span>
                    <span className="font-bold text-theme-main">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Generated ─────────────────────────────────────────────────── */}
          {step === 'generated' && generatedKey && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-lobster-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-lobster-red/20 text-lobster-red">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-theme-main">🦞 Lobster Key Spawned!</h3>
                <p className="text-theme-muted mt-1.5 text-sm">
                  Copy it now — it won't be shown again.
                </p>
              </div>
              <div className="border-2 border-claw-cyan/40 bg-claw-cyan/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">API Key</span>
                  <button
                    type="button"
                    onClick={() => setIsMasked(v => !v)}
                    className="text-theme-muted hover:text-theme-main p-1 rounded-lg"
                  >
                    {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-theme-surface border border-theme-subtle rounded-xl px-4 py-3 font-mono text-sm break-all text-claw-cyan font-bold">
                    {isMasked ? rawSpawnedKey.replace(/./g, '•') : rawSpawnedKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-4 py-3 bg-lobster-red hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-lg shadow-red-500/20"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-lobster-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-lobster-red">Security Notice</p>
                  <p className="text-xs text-theme-muted mt-1">Store this key securely. Do not share it publicly or commit it to version control.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme-subtle bg-theme-base flex items-center justify-between">
          {step !== 'generated' ? (
            <>
              <button
                type="button"
                onClick={step === 'details' ? onClose : handleBack}
                disabled={isGenerating}
                className="px-4 py-2.5 text-sm font-bold border border-theme-subtle text-theme-main rounded-xl hover:bg-theme-surface transition-colors disabled:opacity-50"
              >
                {step === 'details' ? 'Cancel' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid() || isGenerating}
                className="px-6 py-2.5 text-sm font-bold bg-lobster-red hover:bg-red-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                {isGenerating ? 'Generating...' : isLastConfigStep ? 'Hatch Key 🦞' : 'Next →'}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2.5 text-sm font-bold bg-lobster-red hover:bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-red-500/20"
              >
                Done 🦞
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
