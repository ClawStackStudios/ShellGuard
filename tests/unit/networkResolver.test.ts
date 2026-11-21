import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  NetworkResolver,
  TRANSPORT_CONFIG_STORAGE_KEY,
  LAN_PROBE_TIMEOUT_MS,
} from '../../src/lib/networkResolver.js';

function createMemoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, val: string) => {
      map.set(key, val);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe('NetworkResolver Latency Prober & Vector Racing Engine (Issue #26)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-21T15:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('picks LAN as fastest winner when both LAN (<5ms) and Tailscale (>30ms) are reachable', async () => {
    const storage = createMemoryStorage();
    const fetchFn = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const delay = url.includes('192.168.1.50') ? 3 : 45;
      return new Promise<Response>((resolve) => {
        setTimeout(() => resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })), delay);
      });
    }) as unknown as typeof fetch;

    const resolver = new NetworkResolver({ fetchFn, storage, windowTarget: null });
    resolver.setEndpoints({
      lan: ['https://192.168.1.50:6565'],
      tailscale: 'https://my-vault.tailscale.ts.net:6565',
    });

    const racePromise = resolver.race();
    await vi.advanceTimersByTimeAsync(50);
    const state = await racePromise;

    expect(state.activeVector).toBe('lan');
    expect(state.activeUrl).toBe('https://192.168.1.50:6565');
    expect(state.lastRtts.lan?.status).toBe('online');
    expect(state.lastRtts.lan?.rttMs).toBeLessThan(5);
    expect(state.lastRtts.tailscale?.status).toBe('online');
    expect(state.lastRtts.tailscale?.rttMs).toBeGreaterThanOrEqual(30);
  });

  it('fails over immediately to Tailscale when LAN probe times out at 1200ms', async () => {
    const storage = createMemoryStorage();
    const fetchFn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      return new Promise<Response>((resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
        if (url.includes('ts.net')) {
          setTimeout(() => resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })), 35);
        }
        // LAN intentionally stalls until AbortController fires at 1200ms
      });
    }) as unknown as typeof fetch;

    const resolver = new NetworkResolver({ fetchFn, storage, windowTarget: null });
    resolver.setEndpoints({
      lan: ['https://192.168.1.50:6565'],
      tailscale: 'https://my-vault.tailscale.ts.net:6565',
    });

    const racePromise = resolver.race();
    // Tailscale responds at 35ms, winning the race immediately without waiting 1200ms
    await vi.advanceTimersByTimeAsync(40);
    const immediateState = await racePromise;
    expect(immediateState.activeVector).toBe('tailscale');
    expect(immediateState.activeUrl).toBe('https://my-vault.tailscale.ts.net:6565');

    // Advance past 1200ms so LAN AbortController settles telemetry as timeout
    await vi.advanceTimersByTimeAsync(LAN_PROBE_TIMEOUT_MS);
    const settledState = resolver.getState();
    expect(settledState.lastRtts.lan?.status).toBe('timeout');
    expect(settledState.lastRtts.lan?.rttMs).toBeNull();
  });

  it('strictly enforces force-lan and force-tailscale manual pinning modes', async () => {
    const storage = createMemoryStorage();
    const fetchFn = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const delay = url.includes('192.168.1.50') ? 3 : 40;
      return new Promise<Response>((resolve) => {
        setTimeout(() => resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })), delay);
      });
    }) as unknown as typeof fetch;

    const resolver = new NetworkResolver({ fetchFn, storage, windowTarget: null });
    resolver.setEndpoints({
      lan: ['https://192.168.1.50:6565'],
      tailscale: 'https://my-vault.tailscale.ts.net:6565',
    });

    resolver.setMode('force-tailscale');
    const tsRace = resolver.race();
    await vi.advanceTimersByTimeAsync(50);
    const tsState = await tsRace;
    expect(tsState.mode).toBe('force-tailscale');
    expect(tsState.activeVector).toBe('tailscale');
    expect(tsState.activeUrl).toBe('https://my-vault.tailscale.ts.net:6565');

    resolver.setMode('force-lan');
    const lanRace = resolver.race();
    await vi.advanceTimersByTimeAsync(50);
    const lanState = await lanRace;
    expect(lanState.mode).toBe('force-lan');
    expect(lanState.activeVector).toBe('lan');
    expect(lanState.activeUrl).toBe('https://192.168.1.50:6565');

    // Strict pin to Tailscale when tailscale is null does NOT silently fall back to LAN
    resolver.setEndpoints({ tailscale: null });
    resolver.setMode('force-tailscale');
    expect(resolver.getState().activeVector).toBe('tailscale');
    expect(resolver.getState().activeUrl).toBeNull();
  });

  it('serializes and restores transport config cleanly via localStorage sg_transport_config', async () => {
    const storage = createMemoryStorage();
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;

    const first = new NetworkResolver({ fetchFn, storage, windowTarget: null });
    first.setEndpoints({
      lan: ['https://192.168.1.50:6565'],
      tailscale: 'https://my-vault.tailscale.ts.net:6565',
    });
    first.setMode('force-tailscale');
    await first.race();

    const raw = storage.getItem(TRANSPORT_CONFIG_STORAGE_KEY);
    expect(raw).toBeTruthy();

    const rehydrated = new NetworkResolver({ fetchFn, storage, windowTarget: null });
    const restored = rehydrated.getState();
    expect(restored.mode).toBe('force-tailscale');
    expect(restored.activeVector).toBe('tailscale');
    expect(restored.activeUrl).toBe('https://my-vault.tailscale.ts.net:6565');
    expect(restored.endpoints.lan).toEqual(['https://192.168.1.50:6565']);
  });

  it('discovers endpoints from /api/public/endpoints and re-races on online events', async () => {
    const storage = createMemoryStorage();
    const listeners: Record<string, Array<() => void>> = {};
    const mockWindow = {
      addEventListener: vi.fn((type: string, fn: EventListenerOrEventListenerObject) => {
        (listeners[type] ??= []).push(fn as () => void);
      }),
      removeEventListener: vi.fn((type: string, fn: EventListenerOrEventListenerObject) => {
        listeners[type] = (listeners[type] ?? []).filter(f => f !== fn);
      }),
    } as unknown as Pick<Window, 'addEventListener' | 'removeEventListener'>;

    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/public/endpoints')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              lan: ['https://192.168.1.88:6565'],
              tailscale: 'https://vault.tail123.ts.net:6565',
            },
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const resolver = new NetworkResolver({ fetchFn, storage, windowTarget: mockWindow });
    const discovered = await resolver.discoverEndpoints('https://192.168.1.88:6565');
    expect(discovered?.lan).toEqual(['https://192.168.1.88:6565']);
    expect(discovered?.tailscale).toBe('https://vault.tail123.ts.net:6565');

    const cleanup = resolver.attachLifecycleListeners();
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));

    // Fire simulated browser 'online' event
    listeners['online']?.forEach(fn => fn());
    await vi.advanceTimersByTimeAsync(10);
    expect(resolver.getState().lastProbedAt).not.toBeNull();

    cleanup();
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
  });
});
