import { describe, it, expect } from 'vitest';
import { VaultItem, VaultItemType } from '../../src/types.ts';

/**
 * Pure helper matching the exact endpoint resolution logic used in App.tsx onDelete
 */
export function resolveDeleteEndpoint(type?: VaultItemType | string): string {
  if (type === 'note') return '/api/notes';
  if (type === 'key') return '/api/keys';
  if (type === 'attachment') return '/api/attachments';
  return '/api/vault';
}

/**
 * Pure helper matching the exact partition logic used in App.tsx onBulkDelete
 */
export function partitionItemsForBulkDelete(items: VaultItem[], selectedIds: string[]) {
  const itemsToDelete = items.filter(i => selectedIds.includes(i.id));
  const pearlIds = itemsToDelete
    .filter(i => i.type !== 'note' && i.type !== 'key' && i.type !== 'attachment')
    .map(i => i.id);
  const noteIds = itemsToDelete.filter(i => i.type === 'note').map(i => i.id);
  const keyIds = itemsToDelete.filter(i => i.type === 'key').map(i => i.id);
  const attIds = itemsToDelete.filter(i => i.type === 'attachment').map(i => i.id);

  return { pearlIds, noteIds, keyIds, attIds };
}

describe('Vault Item Deletion Routing & Partitioning', () => {
  it('correctly resolves delete endpoint across all item types', () => {
    expect(resolveDeleteEndpoint('password')).toBe('/api/vault');
    expect(resolveDeleteEndpoint('totp')).toBe('/api/vault');
    expect(resolveDeleteEndpoint('note')).toBe('/api/notes');
    expect(resolveDeleteEndpoint('key')).toBe('/api/keys');
    expect(resolveDeleteEndpoint('attachment')).toBe('/api/attachments');
    expect(resolveDeleteEndpoint(undefined)).toBe('/api/vault');
    expect(resolveDeleteEndpoint('custom-login')).toBe('/api/vault');
  });

  it('partitions items for bulk deletion including TOTP items under pearlIds', () => {
    const mockItems: VaultItem[] = [
      { id: 'item-pwd', type: 'password', title: 'GitHub', secret: 'pwd1', created_at: '2026-09-21' },
      { id: 'item-totp', type: 'totp', title: 'Google 2FA', secret: 'totp1', totp_secret: 'JBSWY3DPEHPK3PXP', created_at: '2026-09-21' },
      { id: 'item-note', type: 'note', title: 'Secret Note', secret: 'note1', created_at: '2026-09-21' },
      { id: 'item-key', type: 'key', title: 'Deploy Key', secret: 'ssh-rsa...', created_at: '2026-09-21' },
      { id: 'item-att', type: 'attachment', title: 'id_rsa.pub', secret: '', created_at: '2026-09-21' },
    ];

    const selectedIds = ['item-pwd', 'item-totp', 'item-note', 'item-key', 'item-att'];
    const { pearlIds, noteIds, keyIds, attIds } = partitionItemsForBulkDelete(mockItems, selectedIds);

    // Both password and totp items must be routed to pearls (/api/vault/bulk)
    expect(pearlIds).toEqual(['item-pwd', 'item-totp']);
    expect(noteIds).toEqual(['item-note']);
    expect(keyIds).toEqual(['item-key']);
    expect(attIds).toEqual(['item-att']);
  });

  it('handles partial selections correctly', () => {
    const mockItems: VaultItem[] = [
      { id: 'item-1', type: 'totp', title: 'AWS 2FA', secret: 's1', created_at: '2026-09-21' },
      { id: 'item-2', type: 'password', title: 'GitLab', secret: 's2', created_at: '2026-09-21' },
    ];

    const { pearlIds, noteIds } = partitionItemsForBulkDelete(mockItems, ['item-1']);
    expect(pearlIds).toEqual(['item-1']);
    expect(noteIds).toEqual([]);
  });
});
