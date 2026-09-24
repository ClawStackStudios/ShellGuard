import { describe, it, expect } from 'vitest';
import { searchVaultItems } from '../../src/lib/vaultSearch.ts';
import { VaultItem } from '../../src/types.ts';

describe('searchVaultItems (Unified Client-Side Search Engine)', () => {
  const sampleItems: VaultItem[] = [
    {
      id: 'item-1',
      type: 'password',
      title: 'GitHub Enterprise',
      secret: 'super-secret-pw',
      username: 'octocat',
      url: 'https://github.com/login',
      uris: JSON.stringify(['https://api.github.com', 'https://enterprise.internal.net']),
      notes: 'Deployment access token stored in team grotto',
      category: 'Work',
      tags: JSON.stringify(['devops', 'infrastructure']),
      custom_fields: JSON.stringify([
        { id: 'cf-1', name: 'Organization ID', type: 'text', value: 'org-claw-9000' },
        { id: 'cf-2', name: 'Recovery PIN', type: 'hidden', value: '8842-PIN' }
      ]),
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'item-2',
      type: 'note',
      title: 'Server Provisioning Runbook',
      secret: 'Step 1: Mount the encrypted ZFS pool. Step 2: Initialize SQLCipher database.',
      category: 'Infrastructure',
      tags: 'runbook, critical',
      created_at: '2026-01-02T00:00:00Z',
    },
    {
      id: 'item-3',
      type: 'key',
      title: 'Bastion Host SSH Key',
      secret: '-----BEGIN OPENSSH PRIVATE KEY-----\nMIIE...',
      username: 'root',
      url: 'ssh://bastion.cloud.internal:2222',
      category: 'Cloud',
      tags: JSON.stringify([{ name: 'bastion', color: '#06b6d4' }]),
      created_at: '2026-01-03T00:00:00Z',
    },
    {
      id: 'item-4',
      type: 'attachment',
      title: 'VPN WireGuard Config',
      secret: '',
      file_name: 'wg-reef-home.conf',
      mime_type: 'application/x-wireguard',
      created_at: '2026-01-04T00:00:00Z',
    },
  ];

  it('returns all items when query is empty or whitespace', () => {
    expect(searchVaultItems(sampleItems, '')).toEqual(sampleItems);
    expect(searchVaultItems(sampleItems, '   ')).toEqual(sampleItems);
    expect(searchVaultItems([], 'github')).toEqual([]);
  });

  it('matches case-insensitively on item title', () => {
    const results = searchVaultItems(sampleItems, 'github');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('item-1');

    const resultsRunbook = searchVaultItems(sampleItems, 'RUNBOOK');
    expect(resultsRunbook).toHaveLength(1);
    expect(resultsRunbook[0].id).toBe('item-2');
  });

  it('matches on username', () => {
    const results = searchVaultItems(sampleItems, 'OCTOCAT');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('item-1');

    const rootResults = searchVaultItems(sampleItems, 'root');
    expect(rootResults).toHaveLength(1);
    expect(rootResults[0].id).toBe('item-3');
  });

  it('matches on primary url and secondary uris array', () => {
    // Primary URL
    const resultsUrl = searchVaultItems(sampleItems, 'github.com/login');
    expect(resultsUrl).toHaveLength(1);
    expect(resultsUrl[0].id).toBe('item-1');

    // Secondary URI
    const resultsSecondary = searchVaultItems(sampleItems, 'enterprise.internal.net');
    expect(resultsSecondary).toHaveLength(1);
    expect(resultsSecondary[0].id).toBe('item-1');

    // SSH URL
    const resultsSsh = searchVaultItems(sampleItems, 'bastion.cloud.internal');
    expect(resultsSsh).toHaveLength(1);
    expect(resultsSsh[0].id).toBe('item-3');
  });

  it('matches on notes text for login items', () => {
    const results = searchVaultItems(sampleItems, 'team grotto');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('item-1');
  });

  it('matches on decrypted note content for secure notes', () => {
    const results = searchVaultItems(sampleItems, 'encrypted ZFS pool');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('item-2');
  });

  it('matches on custom field names and values', () => {
    // Custom field name
    const resultsName = searchVaultItems(sampleItems, 'Organization ID');
    expect(resultsName).toHaveLength(1);
    expect(resultsName[0].id).toBe('item-1');

    // Custom field value
    const resultsVal = searchVaultItems(sampleItems, 'org-claw-9000');
    expect(resultsVal).toHaveLength(1);
    expect(resultsVal[0].id).toBe('item-1');

    // Hidden custom field value
    const resultsHidden = searchVaultItems(sampleItems, '8842-PIN');
    expect(resultsHidden).toHaveLength(1);
    expect(resultsHidden[0].id).toBe('item-1');
  });

  it('matches on attachment file_name', () => {
    const results = searchVaultItems(sampleItems, 'wg-reef-home.conf');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('item-4');

    const resultsPartial = searchVaultItems(sampleItems, '.conf');
    expect(resultsPartial).toHaveLength(1);
    expect(resultsPartial[0].id).toBe('item-4');
  });

  it('matches on tags (both JSON arrays and comma-separated strings)', () => {
    // JSON tags array
    const resultsDevops = searchVaultItems(sampleItems, 'devops');
    expect(resultsDevops).toHaveLength(1);
    expect(resultsDevops[0].id).toBe('item-1');

    // Comma-separated tags string
    const resultsCritical = searchVaultItems(sampleItems, 'critical');
    expect(resultsCritical).toHaveLength(1);
    expect(resultsCritical[0].id).toBe('item-2');

    // Tag object array with colors
    const resultsBastion = searchVaultItems(sampleItems, 'bastion');
    // item-3 has bastion in title, url, and tag
    expect(resultsBastion).toHaveLength(1);
    expect(resultsBastion[0].id).toBe('item-3');
  });

  it('handles malformed JSON gracefully without throwing', () => {
    const corruptedItems: VaultItem[] = [
      {
        id: 'corrupted-1',
        type: 'password',
        title: 'Corrupted Item',
        secret: 'x',
        custom_fields: '{ not valid json',
        uris: '{ not an array',
        tags: '[ malformed tag json',
        created_at: '2026-01-01T00:00:00Z',
      }
    ];

    expect(() => searchVaultItems(corruptedItems, 'query')).not.toThrow();
    // Substring fallback still matches raw string
    expect(searchVaultItems(corruptedItems, 'malformed tag')).toHaveLength(1);
  });
});
