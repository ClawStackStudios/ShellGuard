import React, { useState } from 'react';
import { Shield, Clock, Trash2, XCircle, Eye, EyeOff, Copy, CheckCircle, Download, AlertTriangle, Key } from 'lucide-react';
import { LobsterKey } from './LobsterKeysTab';

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (!key || key.length < 12) return '••••••••••••';
  return key.slice(0, 6) + '••••••••••••' + key.slice(-4);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function parsePermissions(raw: any): Record<string, boolean> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LobsterKeyCardProps {
  lobster: LobsterKey;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LobsterKeyCard({ lobster, onRevoke, onDelete }: LobsterKeyCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const isActive = lobster.is_active !== undefined ? Boolean(lobster.is_active) : (lobster.isActive ?? true);
  const displayKey = lobster.api_key || lobster.apiKey || lobster.key || '';
  const permissions = parsePermissions(lobster.permissions);
  const permKeys = Object.keys(permissions).filter((k) => permissions[k] && k.startsWith('can'));

  const createdAt = lobster.created_at || lobster.createdAt;
  const expirationDate = lobster.expiration_date || lobster.expirationDate;
  const rateLimit = lobster.rate_limit || lobster.rateLimit;

  const handleCopy = async () => {
    if (!displayKey) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(displayKey);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = displayKey;
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

  const handleDownload = () => {
    const keyData = {
      type: 'lobster_key',
      key: displayKey,
      id: lobster.id,
      name: lobster.name,
      createdAt: createdAt,
      permissions,
      expirationDate,
      rateLimit
    };
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lobster_key_${lobster.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`bg-theme-surface border-2 rounded-2xl p-5 transition-all shadow-sm ${
        isActive
          ? 'border-lobster-red/30 dark:border-lobster-red/40 hover:shadow-md hover:shadow-red-500/10'
          : 'border-theme-subtle opacity-60'
      }`}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isActive ? 'bg-lobster-red/10 text-lobster-red border-lobster-red/20' : 'bg-theme-base text-theme-muted border-theme-subtle'
          }`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base text-theme-main">{lobster.name}</h4>
              {isActive ? (
                <span className="px-2.5 py-0.5 bg-claw-cyan/10 text-claw-cyan text-xs rounded-full font-bold border border-claw-cyan/20">
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-theme-base text-theme-muted text-xs rounded-full font-medium border border-theme-subtle">
                  Revoked
                </span>
              )}
            </div>
            {lobster.description && (
              <p className="text-xs text-theme-muted mt-1 max-w-lg">{lobster.description}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isActive && (
            <button
              type="button"
              onClick={() => onRevoke(lobster.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-theme-subtle rounded-xl text-theme-main hover:bg-theme-base transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Revoke
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(lobster.id)}
            className="p-2 border border-red-200 dark:border-red-900/50 rounded-xl text-lobster-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete key"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Meta ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-start gap-2 text-theme-muted sm:col-span-2">
          <Shield className="w-4 h-4 text-theme-muted mt-0.5 flex-shrink-0" />
          <span className="mt-0.5 font-medium">Permissions:</span>
          <div className="flex flex-wrap gap-1.5 ml-1">
            {permKeys.length > 0 ? (
              permKeys.map((k) => {
                const permName = k.replace('can', '');
                let colorClass = 'bg-theme-base text-theme-muted';
                if (permName === 'Read') colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
                if (permName === 'Write') colorClass = 'bg-claw-cyan/10 text-claw-cyan border border-claw-cyan/20';
                if (permName === 'Edit') colorClass = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
                if (permName === 'Move') colorClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
                if (permName === 'Delete') colorClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
                
                return (
                  <span key={k} className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${colorClass}`}>
                    {permName}
                  </span>
                );
              })
            ) : (
              <span className="font-medium text-theme-main mt-0.5">None</span>
            )}
          </div>
        </div>
        {createdAt && (
          <div className="flex items-center gap-2 text-theme-muted">
            <Clock className="w-4 h-4 text-theme-muted" />
            <span>Created:</span>
            <span className="font-semibold text-theme-main">
              {formatDate(createdAt)}
            </span>
          </div>
        )}
        {expirationDate && (
          <div className="flex items-center gap-2 text-theme-muted">
            <AlertTriangle className="w-4 h-4 text-claw-cyan" />
            <span>Expires:</span>
            <span className="font-semibold text-claw-cyan">
              {formatDate(expirationDate)}
            </span>
          </div>
        )}
        {rateLimit ? (
          <div className="flex items-center gap-2 text-theme-muted">
            <span>Rate limit:</span>
            <span className="font-semibold text-theme-main">
              {rateLimit} req/min
            </span>
          </div>
        ) : null}
      </div>

      {/* ── Key display ─────────────────────────────────────────────────── */}
      <div className="pt-4 border-t border-theme-subtle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <Key className="w-4 h-4 flex-shrink-0 text-theme-muted" />
            <code className={`text-sm font-mono truncate px-2.5 py-1 rounded-lg bg-theme-base border border-theme-subtle ${
              isVisible ? 'text-claw-cyan font-bold' : 'text-theme-muted'
            }`}>
              {displayKey ? (isVisible ? displayKey : maskKey(displayKey)) : '••••••••••••'}
            </code>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Show/hide */}
            <button
              type="button"
              onClick={() => setIsVisible((v) => !v)}
              className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-base transition-colors"
              title={isVisible ? 'Hide key' : 'Reveal key'}
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {/* Copy */}
            {displayKey && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl text-theme-muted hover:text-claw-cyan hover:bg-theme-base transition-colors"
                title="Copy key"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-claw-cyan" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            {/* Download */}
            {displayKey && (
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-xl text-theme-muted hover:text-claw-cyan hover:bg-theme-base transition-colors"
                title="Download key JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
