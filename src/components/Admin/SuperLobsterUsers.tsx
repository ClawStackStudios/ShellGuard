/**
 * SuperLobsterUsers.tsx — ShellGuard©™
 *
 * Lobsters overview: strict-metadata-only user table (T3 — the server
 * enforces this; the UI can only display what it gets). Cascade delete
 * with type-to-confirm + server-side expect double-check (T4).
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { Users, Trash2, Loader2, AlertTriangle, Search } from 'lucide-react';
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
        setUsers(res.data ?? res ?? []);
        setTotal(res.pagination?.total ?? (res.data ?? res ?? []).length);
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

  const filtered = query.trim()
    ? users.filter(u =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        (u.display_name ?? '').toLowerCase().includes(query.toLowerCase()))
    : users;

  if (loading) return <p className="text-theme-muted text-sm animate-pulse">Counting lobsters…</p>;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-claw-cyan" />
          <h2 className="text-sm font-black uppercase tracking-wider text-theme-muted">
            {total} Lobster{total === 1 ? '' : 's'} on this reef
          </h2>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by name…"
            className="bg-theme-base border border-theme-subtle rounded-xl pl-9 pr-4 py-2 text-sm text-theme-main placeholder:text-slate-400 focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none w-56"
          />
        </div>
      </div>
      {/* Users table */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-theme-muted border-b border-theme-subtle">
                <th className="text-left px-4 py-3 font-bold">Lobster</th>
                <th className="text-left px-4 py-3 font-bold">Created</th>
                <th className="text-left px-4 py-3 font-bold">Last Login</th>
                <th className="text-center px-3 py-3 font-bold">Pearls</th>
                <th className="text-center px-3 py-3 font-bold">Notes</th>
                <th className="text-center px-3 py-3 font-bold">Keys</th>
                <th className="text-center px-3 py-3 font-bold">Files</th>
                <th className="text-center px-3 py-3 font-bold">lb- Keys</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.uuid} className="border-b border-theme-subtle/50 hover:bg-claw-cyan/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-theme-main">{u.display_name || u.username}</p>
                    <p className="text-xs text-theme-muted font-mono">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-theme-muted text-xs font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-theme-muted text-xs font-mono">{u.last_login ? new Date(u.last_login).toLocaleString() : 'never'}</td>
                  <td className="px-3 py-3 text-center font-mono text-theme-main">{u.pearl_count}</td>
                  <td className="px-3 py-3 text-center font-mono text-theme-main">{u.note_count}</td>
                  <td className="px-3 py-3 text-center font-mono text-theme-main">{u.key_count}</td>
                  <td className="px-3 py-3 text-center font-mono text-theme-main">{u.attachment_count}</td>
                  <td className="px-3 py-3 text-center font-mono text-theme-main">{u.active_keys}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setTarget(u); setConfirmText(''); setDeleteError(null); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Cascade delete this lobster"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-theme-muted">No lobsters match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cascade-delete confirmation modal */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-theme-surface border border-theme-subtle rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-xl font-bold text-theme-main">Delete {target.username}?</h3>
            </div>
            <p className="text-theme-muted text-sm mb-4 leading-relaxed">
              This <strong className="text-red-400">permanently destroys</strong> all vault data for
              <span className="font-mono text-theme-main"> @{target.username}</span> —
              {' '}{target.pearl_count} pearls, {target.note_count} notes, {target.key_count} keys,
              {' '}{target.attachment_count} attachments, {target.active_keys} agent keys.
              Zero-knowledge means <strong>nobody can restore this</strong>, not even you.
            </p>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
              Type <span className="font-mono text-red-400">{target.username}</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoFocus
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm font-mono text-theme-main focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none mb-4"
            />
            {deleteError && <p className="text-xs text-red-500 mb-3">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setTarget(null); setConfirmText(''); }}
                className="px-4 py-2.5 text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={confirmText !== target.username || deleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-red-950/40 disabled:opacity-40 transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                {deleting ? <><Loader2 size={15} className="animate-spin" /> Deleting…</> : <><Trash2 size={15} /> Delete Forever</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
