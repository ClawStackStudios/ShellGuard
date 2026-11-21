import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';

const testDataDir: string = vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-net-topo-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  return dir;
});

const {
  isTailscaleIp,
  isPrivateLanIp,
  classifyHostInterfaces,
  detectHostTopology,
  normalizeMagicDnsName,
  resetTopologyCache,
} = await import('../../src/server/utils/networkTopology.js');
const { collectSubjectAltNames } = await import('../../src/server/utils/tlsManager.js');
const { db, auditDb } = await import('../../src/server/database/index.js');

function iface(address: string, family: 'IPv4' | 'IPv6' = 'IPv4', internal = false): os.NetworkInterfaceInfo {
  return {
    address,
    netmask: family === 'IPv4' ? '255.255.255.0' : 'ffff:ffff:ffff:ffff::',
    family,
    mac: '00:00:00:00:00:00',
    internal,
    cidr: family === 'IPv4' ? `${address}/24` : `${address}/64`,
  } as os.NetworkInterfaceInfo;
}

describe('Zero-Config Dual-Homed Network Topology & Tailscale SAN Detection (Issue #21)', () => {
  beforeEach(() => {
    resetTopologyCache();
  });

  afterAll(() => {
    db.close();
    auditDb.close();
    fs.rmSync(testDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  it('classifies RFC 6598 CGNAT (100.64.0.0/10) and RFC 1918 LAN IPs accurately', () => {
    expect(isTailscaleIp('100.64.0.1')).toBe(true);
    expect(isTailscaleIp('100.127.255.254')).toBe(true);
    expect(isTailscaleIp('fd7a:115c:a1e0::1')).toBe(true);
    expect(isTailscaleIp('100.63.255.254')).toBe(false);
    expect(isTailscaleIp('100.128.0.1')).toBe(false);
    expect(isTailscaleIp('192.168.1.10')).toBe(false);

    expect(isPrivateLanIp('192.168.1.50')).toBe(true);
    expect(isPrivateLanIp('10.0.0.5')).toBe(true);
    expect(isPrivateLanIp('172.16.0.10')).toBe(true);
    expect(isPrivateLanIp('172.31.255.254')).toBe(true);
    expect(isPrivateLanIp('172.15.0.1')).toBe(false);
    expect(isPrivateLanIp('172.32.0.1')).toBe(false);
    expect(isPrivateLanIp('100.89.12.34')).toBe(false);
  });

  it('normalizes MagicDNS FQDNs and rejects non-ts.net or malformed hosts', () => {
    expect(normalizeMagicDnsName('ShellGuard-NAS.tail1234.ts.net.')).toBe('shellguard-nas.tail1234.ts.net');
    expect(normalizeMagicDnsName('  box.ts.net  ')).toBe('box.ts.net');
    expect(normalizeMagicDnsName('example.com')).toBeNull();
    expect(normalizeMagicDnsName('bad host.ts.net')).toBeNull();
    expect(normalizeMagicDnsName('')).toBeNull();
  });

  it('detects both LAN and Tailscale concurrently via LocalAPI when Tailscale is active', async () => {
    const interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      lo: [iface('127.0.0.1', 'IPv4', true)],
      eth0: [iface('172.18.0.42', 'IPv4', false)],
      tailscale0: [
        iface('100.92.14.88', 'IPv4', false),
        iface('fd7a:115c:a1e0::42', 'IPv6', false),
      ],
    };

    const topology = await detectHostTopology({
      interfaces,
      localApiResolver: async () => 'shellguard-node.tail9876.ts.net.',
      reverseDns: async () => {
        throw new Error('reverseDns should not be called when LocalAPI succeeds');
      },
    });

    expect(topology.tailscaleActive).toBe(true);
    expect(topology.lanIps).toEqual(['172.18.0.42']);
    expect(topology.tailscaleIps).toEqual(['100.92.14.88', 'fd7a:115c:a1e0::42']);
    expect(topology.magicDnsName).toBe('shellguard-node.tail9876.ts.net');

    const sans = collectSubjectAltNames({ interfaces, magicDnsHost: topology.magicDnsName });
    expect(sans).toContainEqual({ type: 7, ip: '172.18.0.42' });
    expect(sans).toContainEqual({ type: 7, ip: '100.92.14.88' });
    expect(sans).toContainEqual({ type: 2, value: 'shellguard-node.tail9876.ts.net' });
  });

  it('falls back to reverse DNS when LocalAPI is unavailable', async () => {
    const interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      eth0: [iface('192.168.50.10', 'IPv4', false)],
      utun4: [iface('100.101.202.5', 'IPv4', false)],
    };

    const topology = await detectHostTopology({
      interfaces,
      localApiResolver: async () => null,
      reverseDns: async (ip) => (ip === '100.101.202.5' ? ['unraid-vault.tailabc.ts.net'] : []),
    });

    expect(topology.tailscaleActive).toBe(true);
    expect(topology.magicDnsName).toBe('unraid-vault.tailabc.ts.net');
    expect(topology.lanIps).toEqual(['192.168.50.10']);
  });

  it('gracefully defaults to single-interface LAN mode without probing when Tailscale is absent', async () => {
    const interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      lo: [iface('127.0.0.1', 'IPv4', true)],
      eth0: [iface('192.168.1.25', 'IPv4', false)],
    };
    const localApiSpy = vi.fn(async () => 'should-not-run.ts.net');
    const reverseDnsSpy = vi.fn(async () => ['should-not-run.ts.net']);

    const topology = await detectHostTopology({
      interfaces,
      localApiResolver: localApiSpy,
      reverseDns: reverseDnsSpy,
      env: { TS_CERT_DOMAIN: 'stale-env.ts.net' },
    });

    expect(topology.tailscaleActive).toBe(false);
    expect(topology.lanIps).toEqual(['192.168.1.25']);
    expect(topology.tailscaleIps).toEqual([]);
    expect(topology.magicDnsName).toBeNull();
    expect(localApiSpy).not.toHaveBeenCalled();
    expect(reverseDnsSpy).not.toHaveBeenCalled();

    const sans = collectSubjectAltNames({ interfaces, magicDnsHost: 'stale-env.ts.net' });
    expect(sans).toContainEqual({ type: 7, ip: '192.168.1.25' });
    expect(sans.some(s => s.value?.endsWith('.ts.net'))).toBe(false);
  });
});
