import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { isShellCryptionEnabled } from '../lib/shellCryption.ts';

export function ZeroKnowledgeWarningBanner() {
  if (isShellCryptionEnabled()) return null;

  return (
    <div
      data-testid="zk-warning-banner"
      role="alert"
      className="w-full bg-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md z-[100] flex-shrink-0 text-center tracking-wide"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-300 animate-pulse" />
      <span>
        ⚠️ Zero-Knowledge Encryption Disabled: Vault data and attachments are transmitted and stored unencrypted. Do NOT use in production or across untrusted networks.
      </span>
    </div>
  );
}
