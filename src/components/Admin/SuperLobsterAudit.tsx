/**
 * SuperLobsterAudit.tsx — ShellGuard©™
 *
 * Audit Reef viewer: recent admin/auth/backup security events.
 * Read-only. The reef is append-only and survives restores (T7).
 * Aligned with CaraBase security event ledger and filter chip design.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState, useMemo } from 'react';
import { ScrollText, CheckCircle2, XCircle, Shield, AlertTriangle, Filter, RefreshCw, Bot, User } from 'lucide-react';
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

type FilterCategory = 'all' | 'admin' | 'auth' | 'mutations' | 'failures';

export function SuperLobsterAudit() {
  const { adminApi } = useSuperLobster();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const load = () => {
    setLoading(true);
    adminApi<AuditEvent[]>('/api/admin/audit?limit=150')
      .then(e => setEvents(e ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (activeFilter === 'admin') {
        return e.actor_type === 'admin' || e.event_type.startsWith('ADMIN');
      }
      if (activeFilter === 'auth') {
        return e.event_type.includes('AUTH') || e.event_type.includes('LOGIN') || e.event_type.includes('TOKEN');
      }
      if (activeFilter === 'mutations') {
        return e.event_type.includes('CREATE') || e.event_type.includes('UPDATE') || e.event_type.includes('DELETE') || e.event_type.includes('BACKUP');
      }
      if (activeFilter === 'failures') {
        return e.outcome === 'failure' || e.outcome === 'error';
      }
      return true;
    });
  }, [events, activeFilter]);

  const getEventBadge = (eventType: string) => {
    if (eventType.startsWith('ADMIN')) {
      return 'bg-[#e4048a]/10 text-[#e4048a] border-[#e4048a]/30';
    }
    if (eventType.includes('DELETE') || eventType.includes('PURGE')) {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
    if (eventType.includes('AUTH') || eventType.includes('LOGIN')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
    if (eventType.includes('BACKUP')) {
      return 'bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/30';
    }
    return 'bg-theme-base text-theme-main border-theme-subtle';
  };

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold font-[Sora] text-theme-main tracking-tight flex items-center gap-2.5">
            <ScrollText size={20} className="text-[#06b6d4]" />
            Audit Reef Security Ledger
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Append-only record of admin operations, authentication attempts, and vault mutations
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 text-theme-muted hover:text-theme-main rounded-xl bg-theme-surface border border-theme-subtle transition-colors cursor-pointer"
          title="Refresh audit stream"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase font-bold text-theme-muted flex items-center gap-1 mr-1">
          <Filter size={12} /> Filter:
        </span>
        {[
          { id: 'all', label: `All Events (${events.length})` },
          { id: 'admin', label: 'SuperLobster Admin' },
          { id: 'auth', label: 'Auth & Tokens' },
          { id: 'mutations', label: 'Mutations & Backups' },
          { id: 'failures', label: 'Failures' },
        ].map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as FilterCategory)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#e4048a]/15 text-[#e4048a] border-[#e4048a]/40 shadow-sm'
                  : 'bg-theme-surface hover:bg-theme-base text-theme-muted hover:text-theme-main border-theme-subtle'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-sm text-red-400 flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && events.length === 0 && (
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-8 h-64 animate-pulse" />
      )}

      {!loading && events.length === 0 && (
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-12 text-center text-theme-muted text-xs">
          No security events recorded in the audit reef yet.
        </div>
      )}

      {events.length > 0 && (
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-theme-muted border-b border-theme-subtle bg-theme-base/50">
                  <th className="text-left px-5 py-3.5 font-bold">When</th>
                  <th className="text-left px-4 py-3.5 font-bold">Event Type</th>
                  <th className="text-left px-4 py-3.5 font-bold">Actor</th>
                  <th className="text-left px-4 py-3.5 font-bold">Outcome</th>
                  <th className="text-left px-5 py-3.5 font-bold">IP & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle/50">
                {filteredEvents.map((e, i) => {
                  const isAdmin = e.actor_type === 'admin' || e.actor === 'SUPERLOBSTER';
                  const isAgent = e.actor_type === 'lobster_key' || (e.actor && e.actor.startsWith('lb-'));
                  const isSuccess = e.outcome === 'success';

                  return (
                    <tr key={`${e.timestamp}-${i}`} className="hover:bg-[#06b6d4]/5 transition-colors">
                      <td className="px-5 py-3 text-xs font-mono text-theme-muted whitespace-nowrap">
                        {new Date(e.timestamp).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md border font-mono text-[11px] font-bold ${getEventBadge(e.event_type)}`}>
                          {e.event_type}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#e4048a]/15 text-[#e4048a] border border-[#e4048a]/30 font-mono text-[11px] font-bold">
                            <Shield size={11} /> SUPERLOBSTER
                          </span>
                        ) : isAgent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[11px]">
                            <Bot size={11} /> {e.actor?.slice(0, 10)}…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-theme-muted font-mono text-[11px]">
                            <User size={11} /> {e.actor?.slice(0, 8) ?? 'system'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {e.outcome ?? 'unknown'}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-xs font-mono text-theme-muted truncate max-w-xs">
                        <span className="text-theme-main font-semibold mr-2">{e.ip_address ?? '—'}</span>
                        {e.details && <span className="text-theme-muted/70 text-[11px]">{e.details}</span>}
                      </td>
                    </tr>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-theme-muted">
                      No security events match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
