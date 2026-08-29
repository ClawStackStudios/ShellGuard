import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNavIntent,
  setNavIntent,
  getStoredLobsters,
  saveStoredLobsters,
  getActiveLobsterId,
  setActiveLobsterId,
  getSessions,
  setSessionForUser,
  removeSessionForUser,
  activateUserSession,
} from '../../src/lib/sessionManager.ts';
import { Lobster } from '../../src/types.ts';

// Mock localStorage and sessionStorage for node test environment
class StorageMock implements Storage {
  private store: Record<string, string> = {};

  get length() {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe('sessionManager - NavIntent and Session Lifecycle', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new StorageMock();
    (globalThis as any).sessionStorage = new StorageMock();
  });

  describe('NavIntent Management', () => {
    it('defaults to "landing" when no intent is stored', () => {
      expect(getNavIntent()).toBe('landing');
    });

    it('persists and retrieves "dashboard" intent correctly', () => {
      setNavIntent('dashboard');
      expect(getNavIntent()).toBe('dashboard');
    });

    it('persists and retrieves "landing" intent on logout', () => {
      setNavIntent('dashboard');
      expect(getNavIntent()).toBe('dashboard');

      setNavIntent('landing');
      expect(getNavIntent()).toBe('landing');
    });

    it('falls back to "landing" on corrupt/unexpected storage value', () => {
      localStorage.setItem('sg_nav_intent', 'unknown_state');
      expect(getNavIntent()).toBe('landing');
    });
  });

  describe('Multi-Identity Lobsters Registry', () => {
    const dummyLobster1: Lobster = {
      uuid: 'uuid-lobster-1',
      username: 'Pinchy',
      role: 'captain',
      email: 'pinchy@ocean.net',
      super_lobster: false,
    };

    const dummyLobster2: Lobster = {
      uuid: 'uuid-lobster-2',
      username: 'Clawdia',
      role: 'guard',
      email: 'clawdia@ocean.net',
      super_lobster: false,
    };

    it('saves and retrieves stored lobsters registry', () => {
      expect(getStoredLobsters()).toEqual([]);
      saveStoredLobsters([dummyLobster1, dummyLobster2]);
      expect(getStoredLobsters()).toEqual([dummyLobster1, dummyLobster2]);
    });

    it('manages active lobster id', () => {
      expect(getActiveLobsterId()).toBeNull();
      setActiveLobsterId('uuid-lobster-1');
      expect(getActiveLobsterId()).toBe('uuid-lobster-1');

      setActiveLobsterId(null);
      expect(getActiveLobsterId()).toBeNull();
    });
  });

  describe('Per-User Session Management in sessionStorage', () => {
    it('sets, activates, and removes user session tokens in sessionStorage', () => {
      expect(getSessions()).toEqual({});

      setSessionForUser('uuid-lobster-1', 'token-123', 'raw-key-abc');
      const sessions = getSessions();
      expect(sessions['uuid-lobster-1']).toEqual({
        token: 'token-123',
        rawKey: 'raw-key-abc',
      });

      // Activate sets active headers and syncs legacy keys
      const active = activateUserSession('uuid-lobster-1');
      expect(active).toEqual({
        token: 'token-123',
        rawKey: 'raw-key-abc',
      });
      expect(getActiveLobsterId()).toBe('uuid-lobster-1');

      // Remove session
      removeSessionForUser('uuid-lobster-1');
      expect(getSessions()['uuid-lobster-1']).toBeUndefined();
    });
  });
});
