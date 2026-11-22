import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NetworkResolver } from '../../src/lib/networkResolver.js';
import { createRestAdapter, ApiError } from '../../src/services/api/restAdapter.js';
import { getApiBaseUrl } from '../../src/config/apiConfig.js';
import { networkResolver } from '../../src/lib/networkResolver.js';

describe('RestAdapter & Dynamic Routing Auto-Failover (Issue #27)', () => {
  beforeEach(() => {
    networkResolver.reset();
  });

  it('integrates networkResolver.getActiveBaseUrl() into getApiBaseUrl()', () => {
    networkResolver.setEndpoints({
      lan: ['https://192.168.1.50:6565'],
      tailscale: 'https://my-vault.ts.net:6565',
    });

    expect(getApiBaseUrl()).toBe('https://192.168.1.50:6565');

    networkResolver.setMode('force-tailscale');
    expect(getApiBaseUrl()).toBe('https://my-vault.ts.net:6565');
  });

  it('retries on fallback Tailscale vector when primary LAN throws a network error, preserving bearer token', async () => {
    let activeBase = 'https://192.168.1.50:6565';

    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('https://192.168.1.50:6565')) {
        throw new TypeError('Failed to fetch: network unreachable');
      }
      if (url === 'https://my-vault.ts.net:6565/api/health') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url === 'https://my-vault.ts.net:6565/api/vault') {
        return new Response(JSON.stringify({ success: true, data: [{ id: 'pearl-1' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;

    const resolver = new NetworkResolver({ fetchFn, storage: null, windowTarget: null });
    resolver.setEndpoints({
      lan: ['https://192.168.1.50:6565'],
      tailscale: 'https://my-vault.ts.net:6565',
    });

    const adapter = createRestAdapter({
      fetchFn,
      getBaseUrl: () => resolver.getActiveBaseUrl() ?? activeBase,
      resolver,
      getToken: () => 'api-human-session-token-123',
    });

    const data = await adapter.GET<Array<{ id: string }>>('/api/vault');
    expect(data).toEqual([{ id: 'pearl-1' }]);
    expect(resolver.getActiveBaseUrl()).toBe('https://my-vault.ts.net:6565');

    // Verify bearer token was preserved on the failover retry request
    const retryCall = (fetchFn as any).mock.calls.find(
      (call: any[]) => String(call[0]) === 'https://my-vault.ts.net:6565/api/vault',
    );
    expect(retryCall).toBeTruthy();
    expect(retryCall[1].headers.Authorization).toBe('Bearer api-human-session-token-123');
  });

  it('does NOT trigger failover race when server responds with HTTP 401 or 404', async () => {
    const raceSpy = vi.fn(async () => ({
      mode: 'auto' as const,
      activeUrl: 'https://my-vault.ts.net:6565',
      activeVector: 'tailscale' as const,
      endpoints: { lan: ['https://192.168.1.50:6565'], tailscale: 'https://my-vault.ts.net:6565' },
      lastRtts: {},
      lastProbedAt: Date.now(),
    }));

    const fetchFn = vi.fn(async () => {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const adapter = createRestAdapter({
      fetchFn,
      getBaseUrl: () => 'https://192.168.1.50:6565',
      resolver: { race: raceSpy },
      getToken: () => 'api-expired',
    });

    await expect(adapter.GET('/api/vault')).rejects.toBeInstanceOf(ApiError);
    expect(raceSpy).not.toHaveBeenCalled();
  });

  it('coalesces concurrent failover races when multiple requests fail simultaneously', async () => {
    let resolverRaceCount = 0;
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('https://192.168.1.50:6565')) {
        throw new TypeError('Failed to fetch');
      }
      if (url.endsWith('/api/health')) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
    }) as unknown as typeof fetch;

    const resolver = new NetworkResolver({ fetchFn: baseFetch, storage: null, windowTarget: null });
    resolver.setEndpoints({
      lan: ['https://192.168.1.50:6565'],
      tailscale: 'https://my-vault.ts.net:6565',
    });

    const origRace = resolver.race.bind(resolver);
    vi.spyOn(resolver, 'race').mockImplementation(() => {
      resolverRaceCount += 1;
      return origRace();
    });

    const adapter = createRestAdapter({
      fetchFn: baseFetch,
      getBaseUrl: () => resolver.getActiveBaseUrl() ?? 'https://192.168.1.50:6565',
      resolver,
      getToken: () => 'api-token',
    });

    await Promise.all([
      adapter.GET('/api/vault'),
      adapter.GET('/api/notes'),
      adapter.GET('/api/keys'),
      adapter.GET('/api/attachments'),
    ]);

    expect(resolverRaceCount).toBe(4);
    // Single-flight coalescing ensures /api/health was only probed once per candidate
    const tsHealthCalls = (baseFetch as any).mock.calls.filter(
      (c: any[]) => String(c[0]) === 'https://my-vault.ts.net:6565/api/health',
    );
    expect(tsHealthCalls.length).toBe(1);
  });
});
