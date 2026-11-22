export type TransportMode = 'auto' | 'force-lan' | 'force-tailscale';
export type TransportVector = 'lan' | 'tailscale' | 'custom';
export type ProbeStatus = 'online' | 'timeout' | 'error' | 'idle';

export interface VectorProbeResult {
  vector: TransportVector;
  url: string;
  status: ProbeStatus;
  rttMs: number | null;
  checkedAt: number;
}

export interface ReachabilityEndpoints {
  lan: string[];
  tailscale: string | null;
  custom?: string | null;
}

export interface TransportConfigState {
  mode: TransportMode;
  activeUrl: string | null;
  activeVector: TransportVector | null;
  endpoints: ReachabilityEndpoints;
  lastRtts: Partial<Record<TransportVector, VectorProbeResult>>;
  lastProbedAt: number | null;
}

export interface NetworkResolverDeps {
  fetchFn?: typeof fetch;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  now?: () => number;
  windowTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'> | null;
}

export const TRANSPORT_CONFIG_STORAGE_KEY = 'sg_transport_config';
export const LAN_PROBE_TIMEOUT_MS = 1200;
export const TAILSCALE_PROBE_TIMEOUT_MS = 3000;
export const CUSTOM_PROBE_TIMEOUT_MS = 2000;

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function getTimeoutForVector(vector: TransportVector): number {
  if (vector === 'lan') return LAN_PROBE_TIMEOUT_MS;
  if (vector === 'tailscale') return TAILSCALE_PROBE_TIMEOUT_MS;
  return CUSTOM_PROBE_TIMEOUT_MS;
}

function defaultStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function createInitialState(): TransportConfigState {
  return {
    mode: 'auto',
    activeUrl: null,
    activeVector: null,
    endpoints: { lan: [], tailscale: null, custom: null },
    lastRtts: {},
    lastProbedAt: null,
  };
}

export class NetworkResolver {
  private state: TransportConfigState;
  private readonly fetchFn: typeof fetch;
  private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  private readonly now: () => number;
  private readonly windowTarget: Pick<Window, 'addEventListener' | 'removeEventListener'> | null;
  private readonly listeners = new Set<(state: TransportConfigState) => void>();
  private raceGeneration = 0;
  private inFlightRace: Promise<TransportConfigState> | null = null;

  constructor(deps: NetworkResolverDeps = {}) {
    this.fetchFn = deps.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    this.storage = deps.storage !== undefined ? deps.storage : defaultStorage();
    this.now = deps.now ?? (() => Date.now());
    this.windowTarget =
      deps.windowTarget !== undefined
        ? deps.windowTarget
        : typeof window !== 'undefined'
          ? window
          : null;
    this.state = this.loadState();
  }

  /** Returns the currently active resolved base URL, or null if not yet resolved. */
  getActiveBaseUrl(): string | null {
    return this.state.activeUrl;
  }

  private loadState(): TransportConfigState {
    const base = createInitialState();
    if (!this.storage) return base;
    try {
      const raw = this.storage.getItem(TRANSPORT_CONFIG_STORAGE_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return base;
      const mode: TransportMode =
        parsed.mode === 'force-lan' || parsed.mode === 'force-tailscale' ? parsed.mode : 'auto';
      const lan = Array.isArray(parsed.endpoints?.lan)
        ? parsed.endpoints.lan.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0)
        : [];
      const tailscale = typeof parsed.endpoints?.tailscale === 'string' ? parsed.endpoints.tailscale : null;
      const custom = typeof parsed.endpoints?.custom === 'string' ? parsed.endpoints.custom : null;
      return {
        mode,
        activeUrl: typeof parsed.activeUrl === 'string' ? parsed.activeUrl : null,
        activeVector:
          parsed.activeVector === 'lan' || parsed.activeVector === 'tailscale' || parsed.activeVector === 'custom'
            ? parsed.activeVector
            : null,
        endpoints: { lan, tailscale, custom },
        lastRtts: parsed.lastRtts && typeof parsed.lastRtts === 'object' ? parsed.lastRtts : {},
        lastProbedAt: typeof parsed.lastProbedAt === 'number' ? parsed.lastProbedAt : null,
      };
    } catch {
      return base;
    }
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(TRANSPORT_CONFIG_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore quota / privacy mode storage failures
    }
  }

  private notify(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // Isolate subscriber errors
      }
    }
  }

  getState(): TransportConfigState {
    return {
      ...this.state,
      endpoints: {
        lan: [...this.state.endpoints.lan],
        tailscale: this.state.endpoints.tailscale,
        custom: this.state.endpoints.custom ?? null,
      },
      lastRtts: { ...this.state.lastRtts },
    };
  }

  subscribe(listener: (state: TransportConfigState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setEndpoints(endpoints: Partial<ReachabilityEndpoints>): void {
    const lan =
      endpoints.lan !== undefined
        ? endpoints.lan.map(normalizeBaseUrl).filter(Boolean)
        : this.state.endpoints.lan;
    const tailscale =
      endpoints.tailscale !== undefined
        ? endpoints.tailscale
          ? normalizeBaseUrl(endpoints.tailscale)
          : null
        : this.state.endpoints.tailscale;
    const custom =
      endpoints.custom !== undefined
        ? endpoints.custom
          ? normalizeBaseUrl(endpoints.custom)
          : null
        : (this.state.endpoints.custom ?? null);

    this.state.endpoints = { lan, tailscale, custom };
    this.applyPinningOrDefault();
    this.persist();
    this.notify();
  }

  setMode(mode: TransportMode): void {
    this.state.mode = mode;
    this.applyPinningOrDefault();
    this.persist();
    this.notify();
  }

  private applyPinningOrDefault(): void {
    if (this.state.mode === 'force-lan') {
      this.state.activeVector = 'lan';
      this.state.activeUrl = this.state.endpoints.lan[0] ?? null;
      return;
    }
    if (this.state.mode === 'force-tailscale') {
      this.state.activeVector = 'tailscale';
      this.state.activeUrl = this.state.endpoints.tailscale ?? null;
      return;
    }
    if (!this.state.activeUrl) {
      if (this.state.endpoints.lan[0]) {
        this.state.activeVector = 'lan';
        this.state.activeUrl = this.state.endpoints.lan[0];
      } else if (this.state.endpoints.tailscale) {
        this.state.activeVector = 'tailscale';
        this.state.activeUrl = this.state.endpoints.tailscale;
      } else if (this.state.endpoints.custom) {
        this.state.activeVector = 'custom';
        this.state.activeUrl = this.state.endpoints.custom;
      }
    }
  }

  async discoverEndpoints(seedBaseUrl = ''): Promise<ReachabilityEndpoints | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      const base = seedBaseUrl ? normalizeBaseUrl(seedBaseUrl) : '';
      const res = await this.fetchFn(`${base}/api/public/endpoints`, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const payload = await res.json();
      const data = payload?.data ?? payload;
      if (!data || !Array.isArray(data.lan)) return null;
      this.setEndpoints({
        lan: data.lan,
        tailscale: typeof data.tailscale === 'string' ? data.tailscale : null,
      });
      return this.getState().endpoints;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async probeVector(vector: TransportVector, url: string): Promise<VectorProbeResult> {
    const normalized = normalizeBaseUrl(url);
    const timeoutMs = getTimeoutForVector(vector);
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    const startedAt = this.now();
    try {
      const res = await this.fetchFn(`${normalized}/api/health`, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      const rttMs = Math.max(0, Math.round(this.now() - startedAt));
      return {
        vector,
        url: normalized,
        status: res.ok ? 'online' : 'error',
        rttMs: res.ok ? rttMs : null,
        checkedAt: this.now(),
      };
    } catch {
      return {
        vector,
        url: normalized,
        status: timedOut ? 'timeout' : 'error',
        rttMs: null,
        checkedAt: this.now(),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  race(): Promise<TransportConfigState> {
    if (this.inFlightRace) {
      return this.inFlightRace;
    }
    this.inFlightRace = this.executeRace().finally(() => {
      this.inFlightRace = null;
    });
    return this.inFlightRace;
  }

  private async executeRace(): Promise<TransportConfigState> {
    const generation = ++this.raceGeneration;
    const candidates: Array<{ vector: TransportVector; url: string }> = [];

    if (this.state.endpoints.lan[0]) {
      candidates.push({ vector: 'lan', url: this.state.endpoints.lan[0] });
    }
    if (this.state.endpoints.tailscale) {
      candidates.push({ vector: 'tailscale', url: this.state.endpoints.tailscale });
    }
    if (this.state.endpoints.custom) {
      candidates.push({ vector: 'custom', url: this.state.endpoints.custom });
    }

    // Strict manual pinning: refresh telemetry without altering active vector/URL
    if (this.state.mode === 'force-lan' || this.state.mode === 'force-tailscale') {
      this.applyPinningOrDefault();
      this.state.lastProbedAt = this.now();
      this.persist();
      this.notify();

      if (candidates.length > 0) {
        await Promise.allSettled(
          candidates.map(async ({ vector, url }) => {
            const result = await this.probeVector(vector, url);
            if (generation !== this.raceGeneration) return;
            this.state.lastRtts[vector] = result;
          }),
        );
        if (generation === this.raceGeneration) {
          this.persist();
          this.notify();
        }
      }
      return this.getState();
    }

    if (candidates.length === 0) {
      return this.getState();
    }

    let winnerSettled = false;
    const probes = candidates.map(({ vector, url }) =>
      this.probeVector(vector, url).then((result) => {
        if (generation === this.raceGeneration) {
          this.state.lastRtts[vector] = result;
        }
        return result;
      }),
    );

    // Resolve immediately on the first healthy responder without waiting on slower timeouts
    const fastestWinner = await new Promise<VectorProbeResult | null>((resolve) => {
      let remaining = probes.length;
      for (const p of probes) {
        p.then((result) => {
          if (!winnerSettled && result.status === 'online') {
            winnerSettled = true;
            resolve(result);
            return;
          }
          remaining -= 1;
          if (!winnerSettled && remaining === 0) {
            resolve(null);
          }
        });
      }
    });

    if (generation === this.raceGeneration) {
      this.state.lastProbedAt = this.now();
      if (fastestWinner) {
        this.state.activeUrl = fastestWinner.url;
        this.state.activeVector = fastestWinner.vector;
      } else {
        this.applyPinningOrDefault();
      }
      this.persist();
      this.notify();
    }

    // Let slower/timing-out probes finish populating telemetry in the background
    void Promise.allSettled(probes).then(() => {
      if (generation !== this.raceGeneration) return;
      this.persist();
      this.notify();
    });

    return this.getState();
  }

  attachLifecycleListeners(): () => void {
    if (!this.windowTarget) return () => {};
    const handleOnline = () => {
      void this.race();
    };
    this.windowTarget.addEventListener('online', handleOnline);
    return () => {
      this.windowTarget?.removeEventListener('online', handleOnline);
    };
  }

  reset(): void {
    this.raceGeneration += 1;
    this.state = createInitialState();
    try {
      this.storage?.removeItem(TRANSPORT_CONFIG_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    this.notify();
  }
}

export const networkResolver = new NetworkResolver();
