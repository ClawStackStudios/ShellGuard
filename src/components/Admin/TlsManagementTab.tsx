import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Download, Copy, Check, Server, Network, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useSuperLobster } from './SuperLobsterContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';

interface TlsStatus {
  enabled: boolean;
  protocol: string;
  port: string;
  fingerprint: string;
  instancePublicKey: string;
  subjectAltNames: Array<{ type: number; value?: string; ip?: string }>;
  certExpiresAt: string;
  pairingUri: string;
}

interface ShareableInvite {
  key?: string;
  label: string;
  token: string;
  uri: string;
  qrDataUrl: string;
}

export function TlsManagementTab() {
  const { adminApi } = useSuperLobster();
  const { success, error, info } = useToast();
  const [status, setStatus] = useState<TlsStatus | null>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [sessionInvites, setSessionInvites] = useState<Record<string, ShareableInvite>>({});
  const [activeShareInvite, setActiveShareInvite] = useState<ShareableInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    fetchStatus();
    fetchInvites();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await adminApi<TlsStatus>('/api/admin/tls/status');
      if (data && typeof data.enabled === 'boolean') {
        setStatus(data);
        if (data.pairingUri) {
          try {
            const url = await QRCode.toDataURL(data.pairingUri, { width: 200, margin: 1 });
            setQrDataUrl(url);
          } catch (e) { console.error('QR generation failed:', e); }
        }
      }
    } catch (e) {
      console.error('Failed to fetch TLS status:', e);
    }
    setLoading(false);
  };

  const fetchInvites = async () => {
    try {
      const data = await adminApi<any[]>('/api/admin/invites');
      const list = Array.isArray(data) ? data : [];
      setInvites(list.filter((i: any) => new Date(i.expires_at).getTime() > Date.now()));
    } catch (e) {
      console.error('Failed to fetch invites:', e);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await adminApi('/api/admin/tls/generate', { method: 'POST', body: JSON.stringify({}) });
      success('Certificate regenerated successfully. Clients must re-accept it.');
      await fetchStatus();
    } catch (e: any) {
      error(e.message || 'Failed to regenerate certificate.');
    }
    setGenerating(false);
    setShowConfirm(false);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    info('Copied to clipboard');
  };

  if (loading && !status) return <div className="p-8 text-theme-muted">Loading TLS status...</div>;

  return (
    <div className="space-y-6">
      {(!status || !status.enabled) ? (
        <div className="p-8 bg-theme-panel rounded-xl border border-theme-border flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="w-12 h-12 rounded-full bg-coral-500/10 flex items-center justify-center mb-4">
            <Shield className="text-coral-500 w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-theme-main mb-2">Cleartext HTTP (LAN Only)</h3>
          <p className="text-theme-muted max-w-md">
            Transport encryption is currently disabled (TLS_ENABLED=false).
            ShellCryption still protects vault payloads, but metadata is visible on the local network.
          </p>
        </div>
      ) : (
        <div className="bg-theme-panel rounded-xl border border-theme-border p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -z-10" />

          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-theme-main flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Active HTTPS ({status.protocol})
              </h2>
              <p className="text-theme-muted text-sm">Port {status.port} • Self-Signed Leaf Certificate</p>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
              Protected
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pairing Card */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                {qrDataUrl ? <img src={qrDataUrl} alt="Reef Handshake QR" className="rounded-lg" /> : <div className="w-[200px] h-[200px] bg-slate-100 animate-pulse rounded-lg" />}
              </div>
              <div className="flex gap-2 mb-4">
                <div className="px-2 py-1 bg-theme-base border border-theme-border rounded text-xs text-theme-muted flex items-center gap-1">
                  <Network className="w-3 h-3" />
                  LAN IP: {status.subjectAltNames.find(s => s.ip && (s.ip.startsWith('192.168.') || s.ip.startsWith('10.')))?.ip || '127.0.0.1'}
                </div>
                {status.subjectAltNames.find(s => s.value && s.value.endsWith('.ts.net'))?.value && (
                  <div className="px-2 py-1 bg-theme-base border border-theme-border rounded text-xs text-theme-muted flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    Tailscale: {status.subjectAltNames.find(s => s.value && s.value.endsWith('.ts.net'))?.value}
                  </div>
                )}
              </div>

              <div className="text-center mb-4">
                <p className="text-sm font-medium text-theme-main">The Reef Handshake</p>
                <p className="text-xs text-theme-muted mt-1 px-4">Open ShellGuard Mobile → Tap Scan QR on login screen.</p>
              </div>

              <button
                onClick={() => copyText(status.pairingUri, 'uri')}
                className="px-4 py-2 bg-theme-base hover:bg-theme-border border border-theme-border rounded-lg text-sm text-theme-main transition-colors flex items-center gap-2 w-full justify-center"
              >
                {copied === 'uri' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied === 'uri' ? 'Copied URI!' : 'Copy Pairing String'}
              </button>
            </div>

            {/* Details & Actions */}
            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-2 block">
                  Certificate Fingerprint (SHA-256)
                </label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-theme-base border border-theme-border px-3 py-2 rounded-lg text-theme-main font-mono break-all flex-1">
                    {status.fingerprint}
                  </code>
                  <button
                    onClick={() => copyText(status.fingerprint, 'fp')}
                    className="p-2 bg-theme-base border border-theme-border hover:bg-theme-border rounded-lg text-theme-muted hover:text-theme-main transition-colors shrink-0"
                    title="Copy Fingerprint"
                  >
                    {copied === 'fp' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-2 block">
                  Instance Identity Anchor (Public Key)
                </label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-theme-base border border-theme-border px-3 py-2 rounded-lg text-theme-muted font-mono truncate flex-1" title={status.instancePublicKey}>
                    {status.instancePublicKey.substring(0, 32)}...
                  </code>
                  <button
                    onClick={() => copyText(status.instancePublicKey, 'ik')}
                    className="p-2 bg-theme-base border border-theme-border hover:bg-theme-border rounded-lg text-theme-muted hover:text-theme-main transition-colors shrink-0"
                    title="Copy Instance Key"
                  >
                    {copied === 'ik' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-theme-muted mt-2">
                  This key persists across cert regenerations to sign rotation proofs.
                </p>
              </div>

              <div className="pt-4 border-t border-theme-border flex flex-col gap-3">
                <a
                  href="/api/admin/tls/cert"
                  download
                  className="px-4 py-2 bg-theme-base hover:bg-theme-border border border-theme-border rounded-lg text-sm text-theme-main transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate (.pem)
                </a>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-4 py-2 bg-coral-500/10 hover:bg-coral-500/20 text-coral-500 border border-coral-500/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Self-Signed Cert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Signups & Gateway */}
      <div className="bg-theme-panel rounded-xl border border-theme-border p-6 mt-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#e4048a]/5 rounded-full blur-[80px] -z-10" />

        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-theme-main flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-[#e4048a]" />
              Share Signups & Gateway
            </h2>
            <p className="text-theme-muted text-sm">Generate single-use invite tokens for new identities.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-2 block">
                Invite Label
              </label>
              <input
                id="invite-label"
                type="text"
                placeholder="e.g. Alice's Phone"
                className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-subtle"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-2 block">
                Expires In
              </label>
              <select
                id="invite-ttl"
                className="w-full bg-theme-base border border-theme-border rounded-lg px-4 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-subtle"
              >
                <option value="1h">1 Hour</option>
                <option value="6h">6 Hours</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={async () => {
                  const labelInput = document.getElementById('invite-label') as HTMLInputElement;
                  const label = labelInput?.value || 'Invite';
                  const ttl = (document.getElementById('invite-ttl') as HTMLSelectElement)?.value || '24h';
                  try {
                    const res = await adminApi<{ inviteToken: string; key?: string }>('/api/admin/invites', {
                      method: 'POST',
                      body: JSON.stringify({ label, ttl }),
                    });
                    const token = res?.inviteToken;
                    if (token) {
                      const uri = window.location.origin + '/?invite=' + token;
                      let inviteQr = '';
                      try {
                        inviteQr = await QRCode.toDataURL(uri, { width: 220, margin: 1 });
                      } catch (e) {
                        console.error('Invite QR generation failed:', e);
                      }
                      const shareData: ShareableInvite = {
                        key: res.key,
                        label,
                        token,
                        uri,
                        qrDataUrl: inviteQr,
                      };
                      if (res.key) {
                        setSessionInvites(prev => ({ ...prev, [res.key!]: shareData }));
                      }
                      setActiveShareInvite(shareData);

                      try {
                        await navigator.clipboard.writeText(uri);
                        success('Invite created and copied to clipboard!');
                      } catch {
                        info('Invite created! Copy the link or scan the QR code below.');
                      }
                      fetchInvites();
                      if (labelInput) labelInput.value = '';
                    } else {
                      error('Failed to generate invite');
                    }
                  } catch (e: any) {
                    error(e.message || 'Failed to create invite');
                  }
                }}
                className="px-6 py-2 bg-[#e4048a] hover:bg-[#c90378] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Invite
              </button>
            </div>
          </div>

          {/* Active Share Card (Modal / Banner with QR Code & One-Click Copy) */}
          {activeShareInvite && (
            <div className="p-6 bg-theme-base/80 border-2 border-[#e4048a]/40 rounded-xl relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 mt-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e4048a]/15 border border-[#e4048a]/30 flex items-center justify-center text-[#e4048a]">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-theme-main flex items-center gap-2">
                      Share Invite: <span className="text-[#e4048a]">{activeShareInvite.label}</span>
                    </h3>
                    <p className="text-xs text-theme-muted">
                      Scan the QR code directly with mobile or send the single-use link to hatch a new vault.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveShareInvite(null)}
                  className="p-1.5 text-theme-muted hover:text-theme-main rounded-lg hover:bg-theme-panel transition-colors"
                  title="Close Share Card"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 pt-4 border-t border-theme-border">
                {activeShareInvite.qrDataUrl && (
                  <div className="bg-white p-3.5 rounded-xl shadow-md border border-slate-200 shrink-0 text-center">
                    <img
                      src={activeShareInvite.qrDataUrl}
                      alt="Invite QR Code"
                      className="w-40 h-40 rounded"
                    />
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">Scan to Hatch</p>
                  </div>
                )}

                <div className="flex-1 w-full space-y-4">
                  <div>
                    <label className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5 block">
                      Invite Link (Full URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={activeShareInvite.uri}
                        className="text-xs bg-theme-panel border border-theme-border px-3 py-2.5 rounded-lg text-theme-main font-mono flex-1 select-all focus:outline-none"
                      />
                      <button
                        onClick={() => copyText(activeShareInvite.uri, 'share-uri')}
                        className="px-4 py-2.5 bg-[#e4048a] hover:bg-[#c90378] text-white rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                      >
                        {copied === 'share-uri' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        {copied === 'share-uri' ? 'Copied URL!' : 'Copy URL'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5 block">
                      Raw Invite Token
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-theme-panel border border-theme-border px-3 py-2 rounded-lg text-theme-muted font-mono flex-1 truncate select-all">
                        {activeShareInvite.token}
                      </code>
                      <button
                        onClick={() => copyText(activeShareInvite.token, 'share-token')}
                        className="px-3 py-2 bg-theme-base border border-theme-border hover:bg-theme-panel text-theme-main rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
                      >
                        {copied === 'share-token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === 'share-token' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-amber-400/90 flex items-center gap-1.5">
                    <span>⚠️</span> This invite token is only accessible while this browser tab stays open.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-sm font-medium text-theme-main mb-4">Active Invites</h3>
            {invites.length === 0 ? (
              <p className="text-sm text-theme-muted">No active invites.</p>
            ) : (
              <div className="border border-theme-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-theme-base text-theme-muted border-b border-theme-border">
                    <tr>
                      <th className="px-4 py-2 font-medium">Label</th>
                      <th className="px-4 py-2 font-medium">Expires At</th>
                      <th className="px-4 py-2 font-medium">Share & QR</th>
                      <th className="px-4 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {invites.map((inv: any) => {
                      const sessionInvite = sessionInvites[inv.key];
                      return (
                        <tr key={inv.key}>
                          <td className="px-4 py-3 text-theme-main font-medium">{inv.owner_uuid}</td>
                          <td className="px-4 py-3 text-theme-muted">{new Date(inv.expires_at).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {sessionInvite ? (
                              <button
                                onClick={() => setActiveShareInvite(sessionInvite)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e4048a]/10 hover:bg-[#e4048a]/20 text-[#e4048a] border border-[#e4048a]/20 rounded text-xs font-medium transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                Show QR & Link
                              </button>
                            ) : (
                              <span className="text-xs text-theme-muted italic">
                                Encrypted (Single-reveal)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={async () => {
                                try {
                                  await adminApi(`/api/admin/invites/${inv.key}`, { method: 'DELETE' });
                                  success('Invite revoked');
                                  setSessionInvites(prev => {
                                    const updated = { ...prev };
                                    delete updated[inv.key];
                                    return updated;
                                  });
                                  if (activeShareInvite?.key === inv.key) {
                                    setActiveShareInvite(null);
                                  }
                                  fetchInvites();
                                } catch(e: any) { error(e.message || 'Failed to revoke invite'); }
                              }}
                              className="text-coral-500 hover:text-coral-400 text-xs font-medium"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Regenerate Certificate?"
        description="This will generate a new 10-year leaf certificate and sign a new rotation manifest. Paired mobile clients will silently heal trust using the manifest, but web browsers will show the security warning again."
        onConfirm={handleGenerate}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
