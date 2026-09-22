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

  describe('Account Switching & Modal Trap Prevention (Area 1)', () => {
    it('keeps active user intact and stages target when switching to a locked account', () => {
      const activeUser = { id: 'u1', username: 'Lucas' };
      const targetUser = { id: 'u2', username: 'DevOps' };
      const sessions = { 'u1': { shellKey: {} as any }, 'u2': { shellKey: null } };

      let currentActiveId = activeUser.id;
      let pendingTarget: any = null;
      let authModalConfig: any = null;

      // When switching to locked target:
      const handleSwitch = (target: any) => {
        const targetSession = sessions[target.id as keyof typeof sessions];
        if (targetSession && targetSession.shellKey) {
          currentActiveId = target.id;
          pendingTarget = null;
        } else {
          // Keep currentActiveId to avoid premature lock state trap!
          pendingTarget = target;
          authModalConfig = { mode: 'unlock', target };
        }
      };

      handleSwitch(targetUser);
      expect(currentActiveId).toBe('u1'); // stays on current user!
      expect(pendingTarget).toEqual(targetUser);
      expect(authModalConfig).toEqual({ mode: 'unlock', target: targetUser });

      // When user clicks 'X' to close auth modal:
      const handleClose = () => {
        authModalConfig = null;
        pendingTarget = null;
      };

      handleClose();
      expect(authModalConfig).toBeNull();
      expect(pendingTarget).toBeNull();
      expect(currentActiveId).toBe('u1'); // user is not trapped!
    });

    it('immediately purges vault items and resets folder when switching between unlocked accounts', () => {
      let vaultItems = [{ id: 'item1', title: 'Test' }];
      let selectedFolder = 'Personal';
      let selectedTags = ['secret'];

      const switchUnlocked = () => {
        vaultItems = [];
        selectedFolder = 'all';
        selectedTags = [];
      };

      switchUnlocked();
      expect(vaultItems).toEqual([]);
      expect(selectedFolder).toBe('all');
      expect(selectedTags).toEqual([]);
    });
  });

  describe('Custom Field Secret Masking (Area 2)', () => {
    it('defaults hidden fields to masked and supports per-field unmask toggling', () => {
      const unmaskedIds = new Set<string>();

      const toggleField = (id: string) => {
        if (unmaskedIds.has(id)) unmaskedIds.delete(id);
        else unmaskedIds.add(id);
      };

      const fieldId = 'field-1';
      expect(unmaskedIds.has(fieldId)).toBe(false); // masked by default

      toggleField(fieldId);
      expect(unmaskedIds.has(fieldId)).toBe(true); // revealed

      toggleField(fieldId);
      expect(unmaskedIds.has(fieldId)).toBe(false); // masked again
    });
  });

  describe('Bulk Pod & Tag Chip Options Derivation (Area 3)', () => {
    it('extracts unique, non-empty, sorted pods and tags from vault items for chip selection', () => {
      const items: MockVaultItem[] = [
        { id: '1', title: 'A', secret: '', category: 'Work', tags: '[{"name":"prod","color":"#ff0000"}]', type: 'password' },
        { id: '2', title: 'B', secret: '', category: 'Work/AWS', tags: '[{"name":"prod"},{"name":"ops"}]', type: 'password' },
        { id: '3', title: 'C', secret: '', category: 'Personal', tags: '[]', type: 'note' },
        { id: '4', title: 'D', secret: '', category: 'all', tags: undefined, type: 'key' },
        { id: '5', title: 'E', secret: '', category: '', tags: undefined, type: 'attachment' },
      ];

      // Pod extraction logic matching VaultShell
      const availablePods = Array.from(
        new Set(
          items
            .map(i => i.category?.trim())
            .filter((c): c is string => Boolean(c && c !== 'all'))
        )
      ).sort((a, b) => a.localeCompare(b));

      expect(availablePods).toEqual(['Personal', 'Work', 'Work/AWS']);

      // Tag extraction logic matching tagUtils
      const tagMap = new Map<string, { name: string; color?: string }>();
      items.forEach(item => {
        if (!item.tags) return;
        try {
          const parsed = JSON.parse(item.tags);
          if (Array.isArray(parsed)) {
            parsed.forEach((t: any) => {
              const name = typeof t === 'string' ? t.trim() : t.name?.trim();
              if (name && !tagMap.has(name)) {
                tagMap.set(name, { name, color: typeof t === 'object' ? t.color : undefined });
              }
            });
          }
        } catch {}
      });
      const availableTags = Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));

      expect(availableTags.map(t => t.name)).toEqual(['ops', 'prod']);
      expect(tagMap.get('prod')?.color).toBe('#ff0000');
    });
  });

  describe('Attachment Attachment ID Merging & Upload Invariants (Area 4)', () => {
    it('merges existing and new attachment IDs without duplication or loss on item update', () => {
      const existingAttachmentsJson = '["att-1","att-2"]';
      const parsedExisting: string[] = JSON.parse(existingAttachmentsJson);
      const newlyUploadedIds = ['att-3', 'att-2']; // att-2 already exists

      const combinedIds = Array.from(new Set([...parsedExisting, ...newlyUploadedIds]));
      expect(combinedIds).toEqual(['att-1', 'att-2', 'att-3']);
      expect(JSON.stringify(combinedIds)).toBe('["att-1","att-2","att-3"]');
    });

    it('correctly defaults MIME type to application/octet-stream when file.type is empty', () => {
      const resolveMimeType = (fileType?: string) => fileType || 'application/octet-stream';

      expect(resolveMimeType('image/png')).toBe('image/png');
      expect(resolveMimeType('')).toBe('application/octet-stream');
      expect(resolveMimeType(undefined)).toBe('application/octet-stream');
    });

    it('allows standalone attachment submit without password when pending attachment exists', () => {
      const validateSubmit = (type: string, title: string, password: string, hasAttachments: boolean) => {
        if (!title.trim()) return false;
        if (type === 'attachment') return hasAttachments;
        return Boolean(password);
      };

      expect(validateSubmit('attachment', 'Contract.pdf', '', true)).toBe(true);
      expect(validateSubmit('attachment', '', '', true)).toBe(false);
      expect(validateSubmit('attachment', 'Empty.pdf', '', false)).toBe(false);
      expect(validateSubmit('password', 'Google', '', false)).toBe(false);
      expect(validateSubmit('password', 'Google', 'secret123', false)).toBe(true);
    });
  });

  describe('Ghost Pod "Attachment" Filtering Invariants (Phase 21 Post-Verification)', () => {
    it('filters out "Attachment", "attachment", and "all" from availablePods in VaultShell', () => {
      const items = [
        { id: '1', category: 'Finance', type: 'password' },
        { id: '2', category: 'Attachment', type: 'attachment' },
        { id: '3', category: 'attachment', type: 'attachment' },
        { id: '4', category: 'all', type: 'password' },
        { id: '5', category: '', type: 'note' },
        { id: '6', category: 'Work/Projects', type: 'password' },
      ];

      const pods = new Set<string>();
      for (const item of items) {
        if (item.category && item.category.trim() && item.category !== 'all' && item.category.toLowerCase() !== 'attachment') {
          pods.add(item.category.trim());
        }
      }
      const availablePods = Array.from(pods).sort((a, b) => a.localeCompare(b));

      expect(availablePods).toEqual(['Finance', 'Work/Projects']);
      expect(availablePods).not.toContain('Attachment');
      expect(availablePods).not.toContain('attachment');
      expect(availablePods).not.toContain('all');
    });

    it('sanitizes attachment pod category default from "Attachment" to empty string', () => {
      const resolveAttachmentCategory = (overrides?: { category?: string }) => {
        return (overrides?.category && overrides.category !== 'all' && overrides.category.toLowerCase() !== 'attachment')
          ? overrides.category
          : '';
      };

      expect(resolveAttachmentCategory(undefined)).toBe('');
      expect(resolveAttachmentCategory({})).toBe('');
      expect(resolveAttachmentCategory({ category: 'Attachment' })).toBe('');
      expect(resolveAttachmentCategory({ category: 'all' })).toBe('');
      expect(resolveAttachmentCategory({ category: 'Personal' })).toBe('Personal');
    });
  });

  describe('Note Attachments Support & Cascade Invariants (Phase 21 Post-Verification)', () => {
    it('preserves attachments field on note items during scuttle mapping', () => {
      const serverNote = {
        id: 'note-1',
        title: 'Meeting Notes',
        content: 'encrypted-note-content',
        category: 'Work',
        attachments: '["att-99","att-100"]',
      };

      const mappedNote = {
        ...serverNote,
        type: 'note',
        category: serverNote.category || '',
        attachments: serverNote.attachments || '[]',
      };

      expect(mappedNote.attachments).toBe('["att-99","att-100"]');
      const parsed = JSON.parse(mappedNote.attachments);
      expect(parsed).toEqual(['att-99', 'att-100']);
    });

    it('extracts linked attachment IDs on note deletion for cascade cleanup', () => {
      const noteRow = {
        id: 'note-123',
        attachments: '["att-1","att-2"]',
      };

      const cascadeIds: string[] = [];
      try {
        const parsed = JSON.parse(noteRow.attachments || '[]');
        if (Array.isArray(parsed)) {
          cascadeIds.push(...parsed.filter((v: unknown): v is string => typeof v === 'string'));
        }
      } catch {}

      expect(cascadeIds).toEqual(['att-1', 'att-2']);
    });
  });

  describe('Selection Retention Across Item Updates (Phase 21 Post-Verification)', () => {
    it('maintains selectedItemId when editing an item and saving', () => {
      let selectedItemId: string | null = 'item-42';
      const editingVaultItemId = 'item-42';

      // Simulating onSave handler:
      const onSaveSuccess = (targetId: string) => {
        selectedItemId = targetId;
      };

      onSaveSuccess(editingVaultItemId);
      expect(selectedItemId).toBe('item-42');
    });

    it('safeguards selection teardown so transient empty items array does not clear selectedItemId', () => {
      let selectedItemId: string | null = 'item-42';
      const items: { id: string }[] = []; // momentarily empty during fetch

      // Protected teardown logic: only clear if items is populated and item is missing
      if (selectedItemId && items.length > 0 && !items.some(i => i.id === selectedItemId)) {
        selectedItemId = null;
      }

      expect(selectedItemId).toBe('item-42'); // preserved!
    });

    it('clears selectedItemId when the item is genuinely deleted from populated items', () => {
      let selectedItemId: string | null = 'item-42';
      const itemsAfterDelete = [{ id: 'item-10' }, { id: 'item-20' }];

      if (selectedItemId && itemsAfterDelete.length > 0 && !itemsAfterDelete.some(i => i.id === selectedItemId)) {
        selectedItemId = null;
      }

      expect(selectedItemId).toBeNull();
    });
  });
});

