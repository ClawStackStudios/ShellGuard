/**
 * SuperLobsterContext.tsx — ShellGuard©™
 *
 * State management for the SuperLobster (admin) session.
 * Cookie-based (sg_admin_session, httpOnly) — deliberately NOT the Bearer
 * restAdapter used by user sessions. Mirrors ClawChives' AdminContext.
 *
 * Maintained by CrustAgent©™
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '../../config/apiConfig';

interface SuperLobsterContextType {
  isAdmin: boolean;
  isChecking: boolean;
  /** 503 from the server = panel not enabled (ADMIN_TOKEN unset). */
  panelDisabled: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<boolean>;
  /** Cookie-session API call helper (throws on !success). */
  adminApi: <T = any>(path: string, options?: RequestInit) => Promise<T>;
}

const SuperLobsterContext = createContext<SuperLobsterContextType | null>(null);

export function SuperLobsterProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [panelDisabled, setPanelDisabled] = useState(false);

  const adminApi = useCallback(async <T = any,>(path: string, options: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });

    let body: any = null;
    try { body = await res.json(); } catch { /* empty body */ }

    if (!res.ok || body?.success === false) {
      if (res.status === 503) setPanelDisabled(true);
      throw new Error(body?.error ?? `SuperLobster request failed (${res.status})`);
    }
    return body?.data ?? body as T;
  }, []);

  const verify = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/verify`, { credentials: 'include' });
      if (res.status === 503) { setPanelDisabled(true); setIsAdmin(false); return false; }
      const data = await res.json();
      setIsAdmin(data.success === true);
      return data.success === true;
    } catch {
      setIsAdmin(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const login = useCallback(async (token: string) => {
    await adminApi('/api/admin/auth', { method: 'POST', body: JSON.stringify({ token }) });
    setIsAdmin(true);
    setPanelDisabled(false);
  }, [adminApi]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${getApiBaseUrl()}/api/admin/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* best-effort */ }
    setIsAdmin(false);
  }, []);

  useEffect(() => { verify(); }, [verify]);

  return (
    <SuperLobsterContext.Provider value={{ isAdmin, isChecking, panelDisabled, login, logout, verify, adminApi }}>
      {children}
    </SuperLobsterContext.Provider>
  );
}

export function useSuperLobster(): SuperLobsterContextType {
  const ctx = useContext(SuperLobsterContext);
  if (!ctx) throw new Error('useSuperLobster must be used within SuperLobsterProvider');
  return ctx;
}
