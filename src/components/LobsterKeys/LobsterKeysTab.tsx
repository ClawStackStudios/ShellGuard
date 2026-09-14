/**
 * LobsterKeysTab — ShellGuard©™
 *
 * Orchestrates the Lobster Keys management tab:
 * — Lists all keys with LobsterKeyCard
 * — Opens LobsterKeyWizard for key creation
 * — Handles revoke and delete with ConfirmDialog
 * — Uses ToastContext for instant user feedback
 *
 * Direct 1:1 port of CaraBase LobsterKeysTab.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Key, Loader2 } from 'lucide-react';
import { LobsterKeyCard } from './LobsterKeyCard';
import { LobsterKeyWizard } from './LobsterKeyWizard';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { restAdapter } from '../../services/api/restAdapter';
import { useToast } from '../../context/ToastContext';

export interface LobsterKey {
  id: string;
  name: string;
  description?: string | null;
  keyFingerprint?: string | null; // Phase 17: fingerprint only — key material never listed
  permissions: any;
  expiration_type?: string;
  expirationType?: string;
  expiration_date?: string | null;
  expirationDate?: string | null;
  rate_limit?: number | null;
  rateLimit?: number | null;
  is_active?: number | boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
  last_used?: string | null;
  lastUsed?: string | null;
}

export function LobsterKeysTab() {
  const [keys, setKeys] = useState<LobsterKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toast = useToast();

  const loadKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await restAdapter.GET<LobsterKey[] | { success?: boolean; data?: LobsterKey[] }>('/api/agent-keys');
      const data: LobsterKey[] = Array.isArray(res) ? res : ((res as any)?.data || []);
      setKeys(data);
    } catch (err) {
      console.error('[LobsterKeysTab] Failed to load keys:', err);
      toast.error('Failed to load keys');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleRevoke = async (id: string) => {
    try {
      await restAdapter.PATCH(`/api/agent-keys/${id}/revoke`);
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: 0, isActive: false } : k)));
      toast.success('Key revoked successfully');
    } catch (err: any) {
      console.error('[LobsterKeysTab] Revoke failed:', err);
      toast.error(err?.message || 'Failed to revoke key');
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await restAdapter.DELETE(`/api/agent-keys/${id}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success('Key deleted successfully');
    } catch (err: any) {
      console.error('[LobsterKeysTab] Delete failed:', err);
      toast.error(err?.message || 'Failed to delete key');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleKeyGenerated = (newKey: LobsterKey) => {
    // Phase 17: the mint response carries the plaintext exactly once (wizard
    // reveal); scrub it before the key enters the card list state.
    const { apiKey: _once, key: _k, api_key: _ak, ...scrubbed } = newKey as any;
    setKeys((prev) => [scrubbed, ...prev]);
    setIsWizardOpen(false);
    toast.success('Lobster Key spawned successfully! 🦞');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-claw-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-theme-main flex items-center gap-2">
            <span className="text-lobster-red">Lobster Keys©™</span>
          </h3>
          <p className="text-sm text-theme-muted mt-0.5">
            Manage API keys for external agents and automation
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-lobster-red hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Hatch New Key
        </button>
      </div>

      {/* Key List or Empty State */}
      {keys.length === 0 ? (
        <div className="border-2 border-dashed border-theme-subtle rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-theme-surface/50">
          <div className="w-14 h-14 bg-lobster-red/10 border border-lobster-red/20 rounded-2xl flex items-center justify-center mb-4 text-lobster-red">
            <Key className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-theme-main mb-1.5">No Lobster Keys</h4>
          <p className="text-sm text-theme-muted max-w-sm mb-5">
            Hatch a Lobster Key to allow external agents and tools to securely authenticate with your Vault.
          </p>
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-lobster-red/50 text-lobster-red hover:bg-lobster-red/10 text-sm font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((lobster: LobsterKey) => (
            <LobsterKeyCard
              key={lobster.id}
              lobster={lobster}
              onRevoke={handleRevoke}
              onDelete={(id) => setConfirmDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* 4-Step Lobster Key Creation Wizard */}
      <LobsterKeyWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onKeyGenerated={handleKeyGenerated}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) executeDelete(confirmDeleteId);
        }}
        title="Delete LobsterKey?"
        description="Are you sure you want to delete this LobsterKey? Any external agents using it will permanently lose access."
        confirmText="Delete Key"
      />
    </div>
  );
}
