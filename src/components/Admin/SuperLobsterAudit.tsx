/**
 * SuperLobsterAudit.tsx — ShellGuard©™
 *
 * Audit Reef viewer: recent admin/auth/backup security events.
 * Read-only. The reef is append-only and survives restores (T7).
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { ScrollText, CheckCircle2, XCircle } from 'lucide-react';
import { useSuperLobster } from './SuperLobsterContext.tsx';

interface AuditEvent {
  timestamp: string;
  event_type: string;
  actor: string | null;
  actor_type: string | null;
  action: string | null;
  outcome: string | null;
  ip_address: string | null;
  details: string | null;
}

export function SuperLobsterAudit() {
  const { adminApi } = useSuperLobster();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi<AuditEvent[]>('/api/admin/audit?limit=100')
      .then(e => setEvents(e ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [adminApi]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText size={16} className="text-claw-cyan" />
        <h2 className="text-sm font-black uppercase tracking-wider text-theme-muted">
          Audit Reef — admin · auth · backup events
        </h2>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {loading && <p className="text-theme-muted text-sm animate-pulse">Dredging the reef…</p>}

      {!loading && events.length === 0 && (
        <p className="text-theme-muted text-sm">No security events recorded yet.</p>
      )}

      {events.length > 0 && (
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-theme-muted border-b border-theme-subtle">
                  <th className="text-left px-4 py-3 font-bold">When</th>
                  <th className="text-left px-4 py-3 font-bold">Event</th>
                  <th className="text-left px-4 py-3 font-bold">Actor</th>
                  <th className="text-left px-4 py-3 font-bold">Outcome</th>
                  <th className="text-left px-4 py-3 font-bold">IP</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={`${e.timestamp}-${i}`} className="border-b border-theme-subtle/50 hover:bg-claw-cyan/5 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-theme-muted whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-theme-main">{e.event_type}</td>
                    <td className="px-4 py-2.5 text-xs text-theme-muted">
                      {e.actor_type === 'admin' ? <span className="text-[#e4048a] font-bold">SUPERLOBSTER</span> : (e.actor?.slice(0, 8) ?? '—')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${e.outcome === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {e.outcome === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {e.outcome ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-theme-muted">{e.ip_address ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
