/**
 * 🐚 sessionManager: Multi-identity session & storage orchestrator for ShellGuard©™
 *
 * Manages per-user local identity registries (`sg_lobsters`), active selection,
 * and memory-bound session credentials (`sg_sessions`) in sessionStorage.
 */

import { Lobster } from "../types.ts";
import { SESSION_KEYS } from "../services/api/restAdapter.ts";

const STORAGE_KEYS = {
  LOBSTERS: "sg_lobsters",
  ACTIVE_ID: "sg_active_lobster_id",
  SESSIONS: "sg_sessions",
  LEGACY_LOBSTER: "sg_lobster",
  LEGACY_RAW_KEY: "sg_raw_key",
  NAV_INTENT: "sg_nav_intent",
};

export interface SessionData {
  token: string;
  rawKey: string;
}

export type NavIntent = "landing" | "dashboard";

export function getNavIntent(): NavIntent {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NAV_INTENT);
    if (raw === "landing" || raw === "dashboard") return raw;
  } catch (e) {
    console.error("Failed to read sg_nav_intent", e);
  }
  return "landing";
}

export function setNavIntent(intent: NavIntent) {
  try {
    localStorage.setItem(STORAGE_KEYS.NAV_INTENT, intent);
  } catch (e) {
    console.error("Failed to save sg_nav_intent", e);
  }
}

export function getStoredLobsters(): Lobster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOBSTERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse sg_lobsters", e);
  }
  return [];
}

export function saveStoredLobsters(lobsters: Lobster[]) {
  localStorage.setItem(STORAGE_KEYS.LOBSTERS, JSON.stringify(lobsters));
}

export function getActiveLobsterId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
}

export function setActiveLobsterId(uuid: string | null) {
  if (uuid) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, uuid);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
  }
}

export function getSessions(): Record<string, SessionData> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse sg_sessions", e);
  }
  return {};
}

export function saveSessions(sessions: Record<string, SessionData>) {
  sessionStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function setSessionForUser(uuid: string, token: string, rawKey: string) {
  const sessions = getSessions();
  sessions[uuid] = { token, rawKey };
  saveSessions(sessions);

  // Sync active token for restAdapter
  sessionStorage.setItem(SESSION_KEYS.TOKEN, token);
  sessionStorage.setItem(STORAGE_KEYS.LEGACY_RAW_KEY, rawKey);
}

export function removeSessionForUser(uuid: string) {
  const sessions = getSessions();
  delete sessions[uuid];
  saveSessions(sessions);
}

export function activateUserSession(uuid: string): SessionData | null {
  const sessions = getSessions();
  const session = sessions[uuid];
  if (session) {
    sessionStorage.setItem(SESSION_KEYS.TOKEN, session.token);
    sessionStorage.setItem(STORAGE_KEYS.LEGACY_RAW_KEY, session.rawKey);
    setActiveLobsterId(uuid);
    return session;
  }
  // Clear restAdapter token if no active session
  sessionStorage.removeItem(SESSION_KEYS.TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.LEGACY_RAW_KEY);
  setActiveLobsterId(uuid);
  return null;
}

export function migrateLegacySession(): { lobsters: Lobster[]; activeId: string | null } {
  let lobsters = getStoredLobsters();
  let activeId = getActiveLobsterId();

  const legacyLobsterStr = localStorage.getItem(STORAGE_KEYS.LEGACY_LOBSTER);
  const legacyToken = sessionStorage.getItem(SESSION_KEYS.TOKEN);
  const legacyRawKey = sessionStorage.getItem(STORAGE_KEYS.LEGACY_RAW_KEY);

  if (legacyLobsterStr) {
    try {
      const legacyLobster: Lobster = JSON.parse(legacyLobsterStr);
      if (!lobsters.some(l => l.uuid === legacyLobster.uuid)) {
        lobsters.push(legacyLobster);
        saveStoredLobsters(lobsters);
      }
      if (!activeId) {
        activeId = legacyLobster.uuid;
        setActiveLobsterId(activeId);
      }
      if (legacyToken && legacyRawKey) {
        setSessionForUser(legacyLobster.uuid, legacyToken, legacyRawKey);
      }
      localStorage.removeItem(STORAGE_KEYS.LEGACY_LOBSTER);
    } catch (e) {
      console.error("Legacy migration error", e);
    }
  }

  return { lobsters, activeId };
}
