/**
 * SuperLobsterUsers.tsx — ShellGuard©™
 *
 * Lobsters overview: strict-metadata-only user table (T3 — the server
 * enforces this; the UI can only display what it gets). Cascade delete
 * with type-to-confirm + server-side expect double-check (T4).
 * Aligned with CaraBase user directory and modal design language.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Users, Trash2, Loader2, AlertTriangle, Search, Key, ShieldAlert, FileText, Paperclip, Bot, X } from 'lucide-react';
import { useSuperLobster } from './SuperLobsterContext.tsx';

interface LobsterRow {
  uuid: string;
  username: string;
  display_name: string | null;
  created_at: string;
  pearl_count: number;
  note_count: number;
  key_count: number;
  attachment_count: number;
  active_keys: number;
  last_login: string | null;
}

export function SuperLobsterUsers() {
  const { adminApi } = useSuperLobster();
  const [users, setUsers] = useState<LobsterRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Delete flow state
  const [target, setTarget] = useState<LobsterRow | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi('/api/admin/users?limit=200')
      .then((res: any) => {
        const list = res.data ?? res ?? [];
        setUsers(list);
        setTotal(res.pagination?.total ?? list.length);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const executeDelete = async () => {
    if (!target || confirmText !== target.username || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi(`/api/admin/users/${target.uuid}`, {
        method: 'DELETE',
        body: JSON.stringify({ expect: confirmText }),
      });
      setTarget(null);
      setConfirmText('');
      load();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Aggregated totals across all loaded lobsters
  const metrics = useMemo(() => {
    return users.reduce(
      (acc, u) => {
        acc.pearls += u.pearl_count || 0;
        acc.notes += u.note_count || 0;
        acc.keys += u.key_count || 0;
        acc.attachments += u.attachment_count || 0;
        acc.agentKeys += u.active_keys || 0;
        return acc;
      },
      { pearls: 0, notes: 0, keys: 0, attachments: 0, agentKeys: 0 }
    );
  }, [users]);

  const filtered = query.trim()
    ? users.filter(u =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        (u.display_name ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : users;

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-theme-surface border border-theme-subtle rounded-2xl p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl h-64 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-sm text-red-400 flex items-center gap-3">
        <AlertTriangle size={18} className="shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold font-[Sora] text-theme-main tracking-tight flex items-center gap-2.5">
            <Users size={20} className="text-[#06b6d4]" />
            Lobsters Directory
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Strict metadata overview with zero-knowledge cascade deletion controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-xs font-mono font-bold text-[#06b6d4]">
            {total} Lobster{total === 1 ? '' : 's'} Registered
          </span>
        </div>
      </div>

      {/* CaraBase Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
            <Users size={12} className="text-[#e4048a]" /> Lobsters
          </p>
          <p className="text-2xl font-black font-mono text-theme-main mt-1">{total}</p>
        </div>
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
            <Key size={12} className="text-[#06b6d4]" /> Pearls
          </p>
          <p className="text-2xl font-black font-mono text-theme-main mt-1">{metrics.pearls}</p>
        </div>
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
            <FileText size={12} className="text-purple-400" /> Notes
          </p>
          <p className="text-2xl font-black font-mono text-theme-main mt-1">{metrics.notes}</p>
        </div>
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-emerald-400" /> SSH Keys
          </p>
          <p className="text-2xl font-black font-mono text-theme-main mt-1">{metrics.keys}</p>
        </div>
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
            <Paperclip size={12} className="text-amber-400" /> Files
          </p>
          <p className="text-2xl font-black font-mono text-theme-main mt-1">{metrics.attachments}</p>
        </div>
        <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-theme-muted tracking-wider flex items-center gap-1.5">
            <Bot size={12} className="text-[#e4048a]" /> lb- Keys
          </p>
          <p className="text-2xl font-black font-mono text-theme-main mt-1">{metrics.agentKeys}</p>
        </div>
      </div>

      {/* Search toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search lobsters by username or display name…"
            className="w-full bg-theme-surface border border-theme-subtle rounded-xl pl-10 pr-9 py-2.5 text-xs text-theme-main placeholder:text-theme-muted focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] outline-none transition-all shadow-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <span className="text-xs font-mono text-theme-muted">
          Showing {filtered.length} of {total}
        </span>
      </div>

      {/* Users table */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-theme-muted border-b border-theme-subtle bg-theme-base/50">
                <th className="text-left px-5 py-3.5 font-bold">Lobster</th>
                <th className="text-left px-4 py-3.5 font-bold">Hatched</th>
                <th className="text-left px-4 py-3.5 font-bold">Last Activity</th>
                <th className="text-center px-3 py-3.5 font-bold">Pearls</th>
                <th className="text-center px-3 py-3.5 font-bold">Notes</th>
                <th className="text-center px-3 py-3.5 font-bold">Keys</th>
                <th className="text-center px-3 py-3.5 font-bold">Files</th>
                <th className="text-center px-3 py-3.5 font-bold">Agents</th>
                <th className="px-5 py-3.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-subtle/50">
              {filtered.map(u => {
                const initial = (u.display_name || u.username).charAt(0).toUpperCase();
                return (
                  <tr key={u.uuid} className="hover:bg-[#06b6d4]/5 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e4048a]/20 to-[#06b6d4]/20 border border-theme-subtle flex items-center justify-center font-bold text-xs text-theme-main shrink-0 shadow-sm">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-theme-main truncate text-sm">
                            {u.display_name || u.username}
                          </p>
                          <p className="text-[11px] text-theme-muted font-mono truncate">
                            @{u.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-theme-muted font-mono whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-theme-muted font-mono whitespace-nowrap">
                      {u.last_login ? (
                        <span className="text-theme-main">{new Date(u.last_login).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-theme-muted/50">never</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-theme-base border border-theme-subtle font-mono font-bold text-theme-main">
                        {u.pearl_count}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-theme-base border border-theme-subtle font-mono font-bold text-theme-main">
                        {u.note_count}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-theme-base border border-theme-subtle font-mono font-bold text-theme-main">
                        {u.key_count}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-theme-base border border-theme-subtle font-mono font-bold text-theme-main">
                        {u.attachment_count}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-block min-w-6 px-1.5 py-0.5 rounded-md bg-[#e4048a]/10 text-[#e4048a] border border-[#e4048a]/20 font-mono font-bold">
                        {u.active_keys}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => { setTarget(u); setConfirmText(''); setDeleteError(null); }}
                        className="p-2 text-theme-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title={`Cascade delete @${u.username}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-theme-muted">
                    No lobsters match "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cascade-delete confirmation modal */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-theme-surface border-t-2 border-red-500 border-x border-b border-theme-subtle rounded-2xl shadow-2xl p-6 max-w-lg w-full">
            <div className="flex items-center gap-3.5 mb-4 text-red-400">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-red-950/40">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold font-[Sora] text-theme-main">
                  Cascade Delete Lobster
                </h3>
                <p className="text-xs text-red-400 font-mono">@{target.username}</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-xs text-red-300 leading-relaxed space-y-2">
              <p>
                This action is <strong>irreversible</strong> and permanently destroys the entire vault grotto for <strong className="text-white font-mono">@{target.username}</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-red-200">
                <li>{target.pearl_count} Pearls (Logins)</li>
                <li>{target.note_count} Secure Notes</li>
                <li>{target.key_count} SSH & GPG Keys</li>
                <li>{target.attachment_count} Encrypted Attachments</li>
                <li>{target.active_keys} Active LobsterKeys</li>
              </ul>
              <p className="text-[11px] text-red-400/80 pt-1">
                Zero-knowledge invariant: Decryption seeds do not exist on the server. Nobody can restore this.
              </p>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
              Type <span className="font-mono text-red-400 bg-theme-base px-1.5 py-0.5 rounded border border-theme-subtle">{target.username}</span> to confirm:
            </label>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoFocus
              placeholder={target.username}
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm font-mono text-theme-main focus:border-red-500 focus:ring-2 focus:ring-red-500/30 outline-none mb-4 transition-all"
            />

            {deleteError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setTarget(null); setConfirmText(''); }}
                className="px-4 py-2.5 text-theme-muted hover:text-theme-main hover:bg-theme-base rounded-xl font-bold text-xs transition-colors cursor-pointer border border-transparent hover:border-theme-subtle"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={confirmText !== target.username || deleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-xs cursor-pointer"
              >
                {deleting ? (
                  <><Loader2 size={14} className="animate-spin" /> Purging Grotto…</>
                ) : (
                  <><Trash2 size={14} /> Delete Forever</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
