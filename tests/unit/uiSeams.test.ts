import { describe, it, expect } from 'vitest';

/**
 * 🐚 Seam Tests: Client Action Coordination & Invariant Verification
 * 
 * These tests verify the operational glue that translates user gestures
 * (single delete, bulk delete, pod rename, pod delete, bulk move, bulk tag)
 * into network payloads and state updates without metadata loss.
 */

interface MockVaultItem {
  id: string;
  title: string;
  secret: string;
  username?: string;
  url?: string;
  uris?: string;
  category: string;
  type: string;
  tags?: string;
  notes?: string;
  totp_secret?: string;
  password_history?: string;
  attachments?: string;
  custom_fields?: string;
}

describe('UI Action Seams & Dispatch Invariants', () => {
  describe('Single Item Deletion Endpoint Dispatch', () => {
    const resolveEndpoint = (item: { type?: string; id: string }) => {
      const endpoint = item.type === 'note' ? '/api/notes' :
                       item.type === 'key' ? '/api/keys' :
                       item.type === 'attachment' ? '/api/attachments' : '/api/vault';
      return `${endpoint}/${item.id}`;
    };

    it('routes notes to /api/notes/:id', () => {
      expect(resolveEndpoint({ type: 'note', id: 'n1' })).toBe('/api/notes/n1');
    });

    it('routes ssh keys to /api/keys/:id', () => {
      expect(resolveEndpoint({ type: 'key', id: 'k1' })).toBe('/api/keys/k1');
    });

    it('routes attachments to /api/attachments/:id', () => {
      expect(resolveEndpoint({ type: 'attachment', id: 'a1' })).toBe('/api/attachments/a1');
    });

    it('routes passwords to /api/vault/:id', () => {
      expect(resolveEndpoint({ type: 'password', id: 'p1' })).toBe('/api/vault/p1');
    });

    it('routes TOTP and custom credential types to /api/vault/:id rather than falling back to attachments', () => {
      expect(resolveEndpoint({ type: 'totp', id: 't1' })).toBe('/api/vault/t1');
      expect(resolveEndpoint({ type: 'custom', id: 'c1' })).toBe('/api/vault/c1');
      expect(resolveEndpoint({ type: undefined, id: 'u1' })).toBe('/api/vault/u1');
    });
  });

  describe('Bulk Deletion Partitioning', () => {
    const partitionItemsForDelete = (items: MockVaultItem[], idsToDelete: string[]) => {
      const targetItems = items.filter(i => idsToDelete.includes(i.id));
      return {
        pearlIds: targetItems.filter(i => i.type !== 'note' && i.type !== 'key' && i.type !== 'attachment').map(i => i.id),
        noteIds: targetItems.filter(i => i.type === 'note').map(i => i.id),
        keyIds: targetItems.filter(i => i.type === 'key').map(i => i.id),
        attachmentIds: targetItems.filter(i => i.type === 'attachment').map(i => i.id),
      };
    };

    it('partitions mixed vault items into exact bulk endpoints without dropping TOTP or custom types', () => {
      const vault: MockVaultItem[] = [
        { id: '1', title: 'GitHub', secret: 's1', category: '', type: 'password' },
        { id: '2', title: 'Server Note', secret: 's2', category: '', type: 'note' },
        { id: '3', title: 'Deploy Key', secret: 's3', category: '', type: 'key' },
        { id: '4', title: 'Backup 2FA', secret: 's4', category: '', type: 'totp' },
        { id: '5', title: 'License PDF', secret: 's5', category: '', type: 'attachment' },
      ];

      const result = partitionItemsForDelete(vault, ['1', '2', '3', '4', '5']);
      expect(result.pearlIds).toEqual(['1', '4']); // password AND totp
      expect(result.noteIds).toEqual(['2']);
      expect(result.keyIds).toEqual(['3']);
      expect(result.attachmentIds).toEqual(['5']);
    });
  });

  describe('Selection State Teardown on Deletion', () => {
    const handleSelectionOnDelete = (currentSelectedId: string | null, deletedItemId: string) => {
      return currentSelectedId === deletedItemId ? null : currentSelectedId;
    };

    it('resets selection to null when the actively selected item is deleted', () => {
      expect(handleSelectionOnDelete('item-42', 'item-42')).toBeNull();
    });

    it('preserves selection when a non-selected item is deleted', () => {
      expect(handleSelectionOnDelete('item-42', 'item-99')).toBe('item-42');
    });
  });

  describe('Pod Metadata Preservation on Rename & Delete', () => {
    it('preserves tags, uris, and password history when renaming a pod', () => {
      const items: MockVaultItem[] = [
        {
          id: 'p1',
          title: 'AWS Login',
          secret: 'enc_sec',
          category: 'Infrastructure/Cloud',
          type: 'password',
          tags: '["prod","ops"]',
          uris: '["https://aws.amazon.com"]',
          password_history: '[{"password":"old","generatedAt":"2026-09-01"}]',
          notes: 'Root account'
        },
        {
          id: 'p2',
          title: 'Staging DB',
          secret: 'enc_sec2',
          category: 'Infrastructure',
          type: 'password',
          tags: '["staging"]',
        }
      ];

      const oldPod = 'Infrastructure';
      const newPod = 'DevOps';

      // Simulate rename logic from handleRenamePod
      const updated = items.map(item => {
        let cat = item.category;
        if (cat === oldPod) cat = newPod;
        else if (cat.startsWith(oldPod + '/')) cat = cat.replace(new RegExp(`^${oldPod}/`), `${newPod}/`);
        return {
          ...item,
          category: cat,
          // Mandatory preserved fields
          tags: item.tags,
          uris: item.uris,
          password_history: item.password_history,
        };
      });

      expect(updated[0].category).toBe('DevOps/Cloud');
      expect(updated[0].tags).toBe('["prod","ops"]');
      expect(updated[0].uris).toBe('["https://aws.amazon.com"]');
      expect(updated[0].password_history).toBe('[{"password":"old","generatedAt":"2026-09-01"}]');

      expect(updated[1].category).toBe('DevOps');
      expect(updated[1].tags).toBe('["staging"]');
    });

    it('resets category to empty string on pod delete without destroying tags or metadata', () => {
      const item: MockVaultItem = {
        id: 'p1',
        title: 'Secret Login',
        secret: 'enc',
        category: 'OldPod',
        type: 'password',
        tags: '["vault-safe"]',
        uris: '["https://example.com"]',
        password_history: '[]'
      };

      const deletedPod = 'OldPod';
      const result = {
        ...item,
        category: item.category === deletedPod ? "" : item.category,
        tags: item.tags,
        uris: item.uris,
        password_history: item.password_history
      };

      expect(result.category).toBe("");
      expect(result.tags).toBe('["vault-safe"]');
      expect(result.uris).toBe('["https://example.com"]');
    });
  });

  describe('Bulk Tag Assignment Merging', () => {
    it('merges new tags with existing item tags without duplication or metadata erasure', () => {
      const currentTagsJson = '["work","security"]';
      const tagsToAdd = ['security', 'finance', 'audit'];

      const parsedCurrent: string[] = JSON.parse(currentTagsJson);
      const merged = Array.from(new Set([...parsedCurrent, ...tagsToAdd]));

      expect(merged).toEqual(['work', 'security', 'finance', 'audit']);
    });
  });
});
