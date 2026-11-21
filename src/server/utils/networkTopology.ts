import dns from 'dns';
import http from 'http';
import os from 'os';

export interface HostInterfacesClassification {
  /** RFC 1918 LAN IPv4 addresses first, followed by non-Tailscale private IPv6. */
  lanIps: string[];
  /** Tailscale RFC 6598 (100.64.0.0/10) IPv4 and fd7a:115c:a1e0::/48 IPv6 addresses. */
  tailscaleIps: string[];
  /** All deduplicated non-internal addresses across every active interface. */
  allNonInternalIps: string[];
}

export interface HostTopology extends HostInterfacesClassification {
  /** True when at least one Tailscale interface address is active on the host. */
  tailscaleActive: boolean;
  /** Normalized MagicDNS FQDN (e.g. `shellguard.tail1234.ts.net`), or null if unavailable. */
  magicDnsName: string | null;
}

export interface TopologyDetectionDeps {
  interfaces?: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  localApiResolver?: () => Promise<string | null>;
  reverseDns?: (ip: string) => Promise<string[]>;
  env?: NodeJS.ProcessEnv;
}

const TAILSCALE_SOCKET_PATH = '/var/run/tailscale/tailscaled.sock';
const PROBE_TIMEOUT_MS = 1000;

let cachedMagicDnsName: string | null = null;

/** Strip trailing dot and validate that a hostname is a clean *.ts.net MagicDNS FQDN. */
export function normalizeMagicDnsName(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/\.+$/, '').toLowerCase();
  if (!cleaned || !cleaned.endsWith('.ts.net') || /[\s/\\]/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/** True if IP belongs to Tailscale CGNAT (100.64.0.0/10) or Tailscale ULA (fd7a:115c:a1e0::/48). */
export function isTailscaleIp(ip: string): boolean {
  const bare = ip.split('%')[0].trim().toLowerCase();
  const ipv4Parts = bare.split('.');
  if (ipv4Parts.length === 4) {
    const a = Number(ipv4Parts[0]);
    const b = Number(ipv4Parts[1]);
    if (Number.isInteger(a) && Number.isInteger(b) && a === 100 && b >= 64 && b <= 127) {
      return true;
    }
  }
  return bare.startsWith('fd7a:115c:a1e0:');
}

/** True if IP belongs to RFC 1918 private LAN IPv4 (10/8, 172.16/12, 192.168/16). */
export function isPrivateLanIp(ip: string): boolean {
  const bare = ip.split('%')[0].trim();
  const parts = bare.split('.');
  if (parts.length !== 4) return false;
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/**
 * Partition non-internal host addresses into LAN vs Tailscale vectors.
 * Pure & synchronous so both TLS SAN generation and pairing routes share one classifier.
 */
export function classifyHostInterfaces(
  interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces(),
): HostInterfacesClassification {
  const lanIpv4: string[] = [];
  const lanIpv6: string[] = [];
  const tsIpv4: string[] = [];
  const tsIpv6: string[] = [];
  const allNonInternalIps: string[] = [];
  const seen = new Set<string>();

  for (const iface of Object.values(interfaces)) {
    for (const addr of iface ?? []) {
      if (!addr || addr.internal || !addr.address || seen.has(addr.address)) continue;
      seen.add(addr.address);
      allNonInternalIps.push(addr.address);

      if (isTailscaleIp(addr.address)) {
        if (addr.family === 'IPv4' || !addr.address.includes(':')) {
          tsIpv4.push(addr.address);
        } else {
          tsIpv6.push(addr.address);
        }
      } else if (isPrivateLanIp(addr.address)) {
        lanIpv4.push(addr.address);
      } else if (addr.address.includes(':') && !addr.address.toLowerCase().startsWith('fe80:')) {
        lanIpv6.push(addr.address);
      }
    }
  }

  return {
    lanIps: [...lanIpv4, ...lanIpv6],
    tailscaleIps: [...tsIpv4, ...tsIpv6],
    allNonInternalIps,
  };
}

/** Query tailscaled LocalAPI over Unix socket with a strict 1s timeout; returns null on absence. */
export function queryTailscaleLocalApi(
  socketPath: string = TAILSCALE_SOCKET_PATH,
  timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (val: string | null) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };

    try {
      const req = http.request(
        { socketPath, path: '/localapi/v0/status', method: 'GET', timeout: timeoutMs },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            finish(null);
            return;
          }
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            if (body.length < 65536) body += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              finish(normalizeMagicDnsName(parsed?.Self?.DNSName));
            } catch {
              finish(null);
            }
          });
        },
      );
      req.on('timeout', () => {
        req.destroy();
        finish(null);
      });
      req.on('error', () => finish(null));
      req.end();
    } catch {
      finish(null);
    }
  });
}

async function defaultReverseDns(ip: string): Promise<string[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const hostnames = await Promise.race([
      dns.promises.reverse(ip),
      new Promise<string[]>((resolve) => {
        timer = setTimeout(() => resolve([]), PROBE_TIMEOUT_MS);
        timer.unref?.();
      }),
    ]);
    return hostnames;
  } catch {
    return [];
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Auto-detect active LAN + Tailscale reachability without user configuration.
 * When Tailscale is absent, returns immediately with zero probes or warnings.
 */
export async function detectHostTopology(deps?: TopologyDetectionDeps): Promise<HostTopology> {
  const classification = classifyHostInterfaces(deps?.interfaces);
  if (classification.tailscaleIps.length === 0) {
    cachedMagicDnsName = null;
    return {
      ...classification,
      tailscaleActive: false,
      magicDnsName: null,
    };
  }

  let magicDnsName: string | null = null;

  // 1. Tailscale LocalAPI Unix socket
  const localApi = deps?.localApiResolver ?? (() => queryTailscaleLocalApi());
  magicDnsName = normalizeMagicDnsName(await localApi().catch(() => null));

  // 2. MagicDNS Reverse DNS on primary Tailscale IP
  if (!magicDnsName) {
    const rev = deps?.reverseDns ?? defaultReverseDns;
    const hostnames = await rev(classification.tailscaleIps[0]).catch(() => [] as string[]);
    for (const host of hostnames) {
      const normalized = normalizeMagicDnsName(host);
      if (normalized) {
        magicDnsName = normalized;
        break;
      }
    }
  }

  // 3. Optional environment hint when running behind a sidecar without shared socket/DNS
  if (!magicDnsName) {
    const env = deps?.env ?? process.env;
    magicDnsName = normalizeMagicDnsName(env.TS_CERT_DOMAIN || env.TAILSCALE_MAGIC_DNS);
  }

  cachedMagicDnsName = magicDnsName;
  return {
    ...classification,
    tailscaleActive: true,
    magicDnsName,
  };
}

/** Returns the last MagicDNS FQDN resolved by detectHostTopology(), or null. */
export function getCachedMagicDnsName(): string | null {
  return cachedMagicDnsName;
}

/** Reset cached MagicDNS state (intended for unit tests). */
export function resetTopologyCache(): void {
  cachedMagicDnsName = null;
}

export interface ReachabilityVectors {
  lan: string[];
  tailscale: string | null;
  currentHost: string;
  port: number;
}

export interface BuildReachabilityOptions {
  protocol: 'http' | 'https';
  port: number;
  currentHost?: string;
  interfaces?: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  magicDnsName?: string | null;
}

/**
 * Synchronously synthesize public reachability vectors from host interfaces
 * and the cached MagicDNS name (<2ms, zero DB or network I/O).
 */
export function buildReachabilityVectors(opts: BuildReachabilityOptions): ReachabilityVectors {
  const { lanIps, tailscaleIps } = classifyHostInterfaces(opts.interfaces);
  const formatHost = (host: string) => (host.includes(':') && !host.startsWith('[') ? `[${host}]` : host);

  const ipv4Lan = lanIps.filter(ip => !ip.includes(':'));
  const selectedLan = ipv4Lan.length > 0 ? ipv4Lan : lanIps;
  const lan = selectedLan.length > 0
    ? selectedLan.map(ip => `${opts.protocol}://${formatHost(ip)}:${opts.port}`)
    : [`${opts.protocol}://127.0.0.1:${opts.port}`];

  let tailscale: string | null = null;
  if (tailscaleIps.length > 0) {
    const candidateDns = opts.magicDnsName !== undefined ? opts.magicDnsName : getCachedMagicDnsName();
    const resolvedDns = normalizeMagicDnsName(candidateDns);
    const tsHost = resolvedDns ?? tailscaleIps.find(ip => !ip.includes(':')) ?? tailscaleIps[0];
    tailscale = `${opts.protocol}://${formatHost(tsHost)}:${opts.port}`;
  }

  const currentHost = (opts.currentHost || '').replace(/^\[|\]$/g, '').trim() || ipv4Lan[0] || '127.0.0.1';

  return {
    lan,
    tailscale,
    currentHost,
    port: opts.port,
  };
}
