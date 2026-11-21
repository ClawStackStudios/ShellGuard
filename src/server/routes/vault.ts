import crypto from 'node:crypto';
import { Router } from 'express';
import db, { audit, auditDb } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { VaultSchemas } from '../validation/schemas.js';
import { fieldCipher } from '../utils/fieldEncryption.js';
import { prepareWrite, prepareRead, prepareReadAll } from '../utils/metadataGuard.js';
import { normalizeTagsForDb, filterByTags } from '../utils/tagUtils.js';
import { publishMutation } from '../utils/reactiveRiver.js';

const router = Router();

// Permission mapping (delta #11): GET→canRead · POST→canWrite · PUT→canEdit · DELETE→canDelete

/**
 * 🐚 GET /api/vault — list the caller's pearls.
 * Supports ?tags=finance,infra for tag intersection filtering.
 * Metadata is decrypted server-side before response (when DB_ENCRYPTION_KEY is set).
 */
router.get('/', requireAuth, requirePermission('canRead'), async (req: AuthRequest, res) => {
  try {
    const items = db
      .prepare('SELECT * FROM vault_pearls WHERE owner_uuid = ? ORDER BY created_at DESC')
      .all(req.userUuid) as Record<string, unknown>[];
    const decrypted = await prepareReadAll('vault_pearls', items, fieldCipher);
    const filtered = filterByTags(decrypted, typeof req.query.tags === 'string' ? req.query.tags : undefined);
    res.json({ success: true, data: filtered });
  } catch (err: any) {
    console.error('Vault GET error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure retrieving vault passwords.' });
  }
});

/**
 * 🐚 POST /api/vault — lock a new pearl in the vault.
 * Payloads are stored byte-for-byte; only their length is validated.
 */
router.post('/', requireAuth, requirePermission('canWrite'), validateBody(VaultSchemas.create), async (req: AuthRequest, res) => {
  const { id, title, secret, username, url, uris, type, category, tags, notes, totp_secret, password_history, attachments, custom_fields } = req.body;
  const normalizedTags = normalizeTagsForDb(tags);

  try {
    const toStore = await prepareWrite('vault_pearls', {
      title: title.trim(),
      username: username ? username.trim() : '',
      url: url ? url.trim() : '',
      category: category || '',
      tags: normalizedTags,
      notes: notes || '',
    }, fieldCipher);

    db.prepare(`
      INSERT INTO vault_pearls (id, owner_uuid, title, secret, username, url, uris, type, category, tags, notes, totp_secret, password_history, attachments, custom_fields, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userUuid,
      toStore.title,
      secret,
      toStore.username,
      toStore.url,
      uris || '[]',
      type || 'password',
      toStore.category,
      toStore.tags,
      toStore.notes,
      totp_secret || '',
      password_history || '[]',
      attachments || '[]',
      custom_fields || '',
      new Date().toISOString()
    );

    audit.log('VAULT_ITEM_CREATED', {
      action: 'vault_item_created',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemType: type || 'password', itemId: id, category: category || '', tags: normalizedTags },
    });

    publishMutation(req.userUuid, 'vault_pearls', id, 'upsert');

    res.status(201).json({
      success: true,
      data: { id, title: title.trim(), username: username ? username.trim() : '', url: url ? url.trim() : '', type: type || 'password', category: category || '', tags: normalizedTags },
    });
  } catch (err: any) {
    console.error('Vault POST error:', err);
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, error: 'A vault entry with this ID already exists.' });
    }
    res.status(500).json({ success: false, error: 'Bedrock failure locking password in vault.' });
  }
});

/**
 * 🐚 POST /api/vault/bulk-import — Multi-domain bulk import (pearls, notes, SSH keys).
 * Executes inside a single atomic database transaction with per-record validation.
 */
router.post('/bulk-import', requireAuth, requirePermission('canWrite'), validateBody(VaultSchemas.bulkImport), async (req: AuthRequest, res) => {
  const { items, import_batch_id } = req.body;
  const errors: { index: number; reason: string }[] = [];
  const inserted: string[] = [];

  const importBatchId = import_batch_id || ('imp_' + crypto.randomUUID());
  const importedAt = new Date().toISOString();

  const insertPearlStmt = db.prepare(`
    INSERT INTO vault_pearls (id, owner_uuid, title, secret, username, url, uris, type, category, tags, notes, totp_secret, password_history, attachments, custom_fields, created_at, imported_at, import_batch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertNoteStmt = db.prepare(`
    INSERT INTO vault_secure_notes (id, owner_uuid, title, content, category, tags, custom_fields, attachments, created_at, imported_at, import_batch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertKeyStmt = db.prepare(`
    INSERT INTO vault_ssh_keys (id, owner_uuid, title, key_value, username, category, tags, custom_fields, attachments, created_at, imported_at, import_batch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Prepare all writes asynchronously before opening the transaction
  const preparedItems: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const rawItem = items[i];
    const validation = VaultSchemas.bulkImportItem.safeParse(rawItem);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      const fieldPath = issue?.path?.join('.') || 'item';
      errors.push({ index: i, reason: `${fieldPath}: ${issue?.message || 'Invalid item schema'}` });
      continue;
    }

    const item = validation.data;
    const itemType = item.type || 'password';
    try {
      const normalizedTags = normalizeTagsForDb(item.tags);
      if (itemType === 'note') {
        const toStore = await prepareWrite('vault_secure_notes', {
          title: item.title.trim(),
          category: item.category || '',
          tags: normalizedTags,
        }, fieldCipher);
        preparedItems.push({ index: i, domain: 'vault_secure_notes', original: item, toStore, normalizedTags });
      } else if (itemType === 'key') {
        const toStore = await prepareWrite('vault_ssh_keys', {
          title: item.title.trim(),
          username: item.username ? item.username.trim() : '',
          category: item.category || '',
          tags: normalizedTags,
        }, fieldCipher);
        preparedItems.push({ index: i, domain: 'vault_ssh_keys', original: item, toStore, normalizedTags });
      } else {
        const toStore = await prepareWrite('vault_pearls', {
          title: item.title.trim(),
          username: item.username ? item.username.trim() : '',
          url: item.url ? item.url.trim() : '',
          category: item.category || '',
          tags: normalizedTags,
          notes: item.notes || '',
        }, fieldCipher);
        preparedItems.push({ index: i, domain: 'vault_pearls', original: item, toStore, normalizedTags });
      }
    } catch (err: any) {
      errors.push({ index: i, reason: err.message });
    }
  }

  try {
    const runImport = db.transaction((itemsToInsert: any[]) => {
      const nowIso = new Date().toISOString();
      for (const p of itemsToInsert) {
        try {
          if (p.domain === 'vault_secure_notes') {
            insertNoteStmt.run(
              p.original.id,
              req.userUuid,
              p.toStore.title,
              p.original.content || p.original.secret,
              p.toStore.category,
              p.toStore.tags,
              p.original.custom_fields || '',
              p.original.attachments || '[]',
              nowIso,
              importedAt,
              importBatchId
            );
          } else if (p.domain === 'vault_ssh_keys') {
            insertKeyStmt.run(
              p.original.id,
              req.userUuid,
              p.toStore.title,
              p.original.key_value || p.original.secret,
              p.toStore.username,
              p.toStore.category,
              p.toStore.tags,
              p.original.custom_fields || '',
              p.original.attachments || '[]',
              nowIso,
              importedAt,
              importBatchId
            );
          } else {
            insertPearlStmt.run(
              p.original.id,
              req.userUuid,
              p.toStore.title,
              p.original.secret,
              p.toStore.username,
              p.toStore.url,
              p.original.uris || '[]',
              p.original.type || 'password',
              p.toStore.category,
              p.toStore.tags,
              p.toStore.notes,
              p.original.totp_secret || '',
              p.original.password_history || '[]',
              p.original.attachments || '[]',
              p.original.custom_fields || '',
              nowIso,
              importedAt,
              importBatchId
            );
          }
          inserted.push(p.original.id);
        } catch (err: any) {
          errors.push({ index: p.index, reason: err.message });
        }
      }
    });

    runImport(preparedItems);

    const insertedSet = new Set(inserted);
    if (inserted.length > 0) {
      auditDb.transaction(() => {
        for (const p of preparedItems) {
          if (insertedSet.has(p.original.id)) {
            const eventName = p.domain === 'vault_secure_notes' ? 'NOTE_CREATED' : p.domain === 'vault_ssh_keys' ? 'SSH_KEY_CREATED' : 'VAULT_ITEM_CREATED';
            const actionName = p.domain === 'vault_secure_notes' ? 'note_created' : p.domain === 'vault_ssh_keys' ? 'ssh_key_created' : 'vault_item_created';
            audit.log(eventName, {
              action: actionName,
              outcome: 'success',
              actor: req.userUuid,
              details: { itemType: p.original.type || 'password', itemId: p.original.id, category: p.toStore.category || '', tags: p.normalizedTags, bulk: true, importBatchId },
            });
          }
        }
      })();
      // Emit 1 coalesced SSE frame for the entire batch instead of N per-item frames
      publishMutation(req.userUuid, 'vault_pearls', importBatchId, 'upsert');
    }

    if (errors.length > 0) {
      res.status(207).json({
        success: true,
        data: {
          inserted,
          errors,
          import_batch_id: importBatchId,
          imported_at: importedAt,
        }
      });
    } else {
      res.status(201).json({
        success: true,
        data: {
          inserted,
          import_batch_id: importBatchId,
          imported_at: importedAt,
        }
      });
    }

  } catch (err: any) {
    console.error('Vault POST bulk-import error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure during bulk import.' });
  }
});

/**
 * 🐚 DELETE /api/vault/bulk — Multi-domain bulk delete (pearls, notes, keys, attachments).
 * Executes inside a single atomic transaction and cascades to attachments.
 */
router.delete('/bulk', requireAuth, requirePermission('canDelete'), validateBody(VaultSchemas.bulkDelete), async (req: AuthRequest, res) => {
  const { ids } = req.body;
  const deleted: string[] = [];
  const errors: { id: string; reason: string }[] = [];
  const cascadeAuditEvents: { itemId: string; cascadeFrom: string }[] = [];
  const deletedRecords: { id: string; domain: string }[] = [];

  const getPearlStmt = db.prepare('SELECT attachments FROM vault_pearls WHERE id = ? AND owner_uuid = ?');
  const delPearlStmt = db.prepare('DELETE FROM vault_pearls WHERE id = ? AND owner_uuid = ?');

  const getNoteStmt = db.prepare('SELECT attachments FROM vault_secure_notes WHERE id = ? AND owner_uuid = ?');
  const delNoteStmt = db.prepare('DELETE FROM vault_secure_notes WHERE id = ? AND owner_uuid = ?');

  const getKeyStmt = db.prepare('SELECT attachments FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?');
  const delKeyStmt = db.prepare('DELETE FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?');

  const getAttStmt = db.prepare('SELECT parent_id, parent_type FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?');
  const delAttStmt = db.prepare('DELETE FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?');

  const cascadeDeleteAttachments = (rawAttachments: string | undefined, parentId: string) => {
    let cascadeIds: string[] = [];
    try {
      const parsed = JSON.parse(rawAttachments || '[]');
      if (Array.isArray(parsed)) cascadeIds = parsed.filter((v: unknown): v is string => typeof v === 'string');
    } catch { }
    for (const attId of cascadeIds) {
      const result = delAttStmt.run(attId, req.userUuid);
      if (result.changes > 0) {
        cascadeAuditEvents.push({ itemId: attId, cascadeFrom: parentId });
      }
    }
  };

  try {
    const runBulkDelete = db.transaction((itemsToDelete: string[]) => {
      for (const id of itemsToDelete) {
        try {
          const pearlRow = getPearlStmt.get(id, req.userUuid) as { attachments?: string } | undefined;
          if (pearlRow) {
            cascadeDeleteAttachments(pearlRow.attachments, id);
            delPearlStmt.run(id, req.userUuid);
            deleted.push(id);
            deletedRecords.push({ id, domain: 'vault_pearls' });
            continue;
          }

          const noteRow = getNoteStmt.get(id, req.userUuid) as { attachments?: string } | undefined;
          if (noteRow) {
            cascadeDeleteAttachments(noteRow.attachments, id);
            delNoteStmt.run(id, req.userUuid);
            deleted.push(id);
            deletedRecords.push({ id, domain: 'vault_secure_notes' });
            continue;
          }

          const keyRow = getKeyStmt.get(id, req.userUuid) as { attachments?: string } | undefined;
          if (keyRow) {
            cascadeDeleteAttachments(keyRow.attachments, id);
            delKeyStmt.run(id, req.userUuid);
            deleted.push(id);
            deletedRecords.push({ id, domain: 'vault_ssh_keys' });
            continue;
          }

          const attRow = getAttStmt.get(id, req.userUuid) as { parent_id?: string; parent_type?: string } | undefined;
          if (attRow) {
            delAttStmt.run(id, req.userUuid);
            if (attRow.parent_id && attRow.parent_type) {
              const parentTable = attRow.parent_type === 'note' ? 'vault_secure_notes'
                : attRow.parent_type === 'key' ? 'vault_ssh_keys'
                : 'vault_pearls';
              const parentRow = db.prepare(`SELECT attachments FROM ${parentTable} WHERE id = ? AND owner_uuid = ?`).get(attRow.parent_id, req.userUuid) as { attachments?: string } | undefined;
              if (parentRow?.attachments) {
                try {
                  const arr = JSON.parse(parentRow.attachments);
                  if (Array.isArray(arr)) {
                    db.prepare(`UPDATE ${parentTable} SET attachments = ? WHERE id = ? AND owner_uuid = ?`)
                      .run(JSON.stringify(arr.filter((a: string) => a !== id)), attRow.parent_id, req.userUuid);
                  }
                } catch { }
              }
            }
            deleted.push(id);
            deletedRecords.push({ id, domain: 'vault_attachments' });
            continue;
          }

          errors.push({ id, reason: 'Not found' });
        } catch (err: any) {
          errors.push({ id, reason: err.message });
        }
      }
    });

    runBulkDelete(ids);

    if (cascadeAuditEvents.length > 0 || deletedRecords.length > 0) {
      auditDb.transaction(() => {
        for (const att of cascadeAuditEvents) {
          audit.log('ATTACHMENT_DELETED', {
            action: 'attachment_deleted',
            outcome: 'success',
            actor: req.userUuid,
            details: { itemId: att.itemId, cascadeFrom: att.cascadeFrom, bulk: true },
          });
        }
        for (const rec of deletedRecords) {
          const eventName = rec.domain === 'vault_secure_notes' ? 'NOTE_DELETED'
            : rec.domain === 'vault_ssh_keys' ? 'SSH_KEY_DELETED'
            : rec.domain === 'vault_attachments' ? 'ATTACHMENT_DELETED'
            : 'VAULT_ITEM_DELETED';
          const actionName = rec.domain === 'vault_secure_notes' ? 'note_deleted'
            : rec.domain === 'vault_ssh_keys' ? 'ssh_key_deleted'
            : rec.domain === 'vault_attachments' ? 'attachment_deleted'
            : 'vault_item_deleted';
          audit.log(eventName, {
            action: actionName,
            outcome: 'success',
            actor: req.userUuid,
            details: { itemId: rec.id, bulk: true },
          });
        }
      })();
      if (deleted.length > 0) {
        // Emit 1 coalesced SSE frame for the entire bulk delete
        publishMutation(req.userUuid, 'vault_pearls', 'bulk', 'delete');
      }
    }

    if (errors.length > 0) {
      res.status(207).json({
        success: true,
        data: {
          deleted,
          errors
        }
      });
    } else {
      res.json({
        success: true,
        data: { deleted }
      });
    }

  } catch (err: any) {
    console.error('Vault DELETE bulk error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure during bulk delete.' });
  }
});

/**
 * 🐚 PATCH /api/vault/bulk-metadata — Multi-domain bulk metadata update (category / tags).
 * Updates Layer 2 metadata only without touching Layer 1 encrypted secrets.
 */
router.patch('/bulk-metadata', requireAuth, requirePermission('canEdit'), validateBody(VaultSchemas.bulkMetadata), async (req: AuthRequest, res) => {
  const { updates } = req.body;
  const updated: string[] = [];
  const errors: { id: string; reason: string }[] = [];

  // Prepare Layer 2 metadata writes asynchronously before opening the synchronous transaction
  const preparedUpdates: Array<{
    id: string;
    domain: 'vault_pearls' | 'vault_secure_notes' | 'vault_ssh_keys';
    hasCategory: boolean;
    hasTags: boolean;
    encryptedCategory?: string;
    encryptedTags?: string;
    rawCategory?: string;
    rawTags?: string;
  }> = [];

  try {
    for (const u of updates) {
      const hasCategory = u.category !== undefined;
      const hasTags = u.tags !== undefined;
      if (!hasCategory && !hasTags) {
        errors.push({ id: u.id, reason: 'No metadata fields provided' });
        continue;
      }

      const domain: 'vault_pearls' | 'vault_secure_notes' | 'vault_ssh_keys' =
        u.type === 'note' ? 'vault_secure_notes'
        : u.type === 'key' ? 'vault_ssh_keys'
        : 'vault_pearls';

      const fieldsToEncrypt: Record<string, string> = {};
      const rawTags = hasTags ? normalizeTagsForDb(u.tags) : undefined;
      if (hasCategory) fieldsToEncrypt.category = u.category || '';
      if (hasTags) fieldsToEncrypt.tags = rawTags!;

      const encrypted = await prepareWrite(domain, fieldsToEncrypt, fieldCipher);
      preparedUpdates.push({
        id: u.id,
        domain,
        hasCategory,
        hasTags,
        encryptedCategory: hasCategory ? (encrypted.category as string) : undefined,
        encryptedTags: hasTags ? (encrypted.tags as string) : undefined,
        rawCategory: hasCategory ? (u.category || '') : undefined,
        rawTags,
      });
    }

    const runBulkMetadata = db.transaction(() => {
      for (const p of preparedUpdates) {
        const setClauses: string[] = [];
        const params: any[] = [];
        if (p.hasCategory) {
          setClauses.push('category = ?');
          params.push(p.encryptedCategory);
        }
        if (p.hasTags) {
          setClauses.push('tags = ?');
          params.push(p.encryptedTags);
        }
        params.push(p.id, req.userUuid);

        const info = db.prepare(`UPDATE ${p.domain} SET ${setClauses.join(', ')} WHERE id = ? AND owner_uuid = ?`).run(...params);
        if (info.changes === 0) {
          errors.push({ id: p.id, reason: 'Not found' });
        } else {
          updated.push(p.id);
        }
      }
    });

    runBulkMetadata();

    if (updated.length > 0) {
      const updatedSet = new Set(updated);
      auditDb.transaction(() => {
        for (const p of preparedUpdates) {
          if (updatedSet.has(p.id)) {
            audit.log('VAULT_METADATA_UPDATED', {
              action: 'vault_metadata_updated',
              outcome: 'success',
              actor: req.userUuid,
              details: { itemId: p.id, domain: p.domain, bulk: true, ...(p.hasCategory ? { category: p.rawCategory } : {}), ...(p.hasTags ? { tags: p.rawTags } : {}) },
            });
          }
        }
      })();
      publishMutation(req.userUuid, 'vault_pearls', 'bulk-metadata', 'upsert');
    }

    if (errors.length > 0) {
      res.status(207).json({ success: true, data: { updated, errors } });
    } else {
      res.json({ success: true, data: { updated } });
    }
  } catch (err: any) {
    console.error('Vault PATCH bulk-metadata error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure during bulk metadata update.' });
  }
});

/**
 * 🐚 POST /api/vault/import-batches/:id/graduate — Graduate an entire import batch to permanent status.
 * Atomically clears imported_at and import_batch_id across pearls, notes, and SSH keys.
 */
router.post('/import-batches/:id/graduate', requireAuth, requirePermission('canEdit'), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    let graduatedCount = 0;
    const runGraduate = db.transaction(() => {
      const pRes = db.prepare('UPDATE vault_pearls SET imported_at = NULL, import_batch_id = NULL WHERE import_batch_id = ? AND owner_uuid = ?').run(id, req.userUuid);
      const nRes = db.prepare('UPDATE vault_secure_notes SET imported_at = NULL, import_batch_id = NULL WHERE import_batch_id = ? AND owner_uuid = ?').run(id, req.userUuid);
      const kRes = db.prepare('UPDATE vault_ssh_keys SET imported_at = NULL, import_batch_id = NULL WHERE import_batch_id = ? AND owner_uuid = ?').run(id, req.userUuid);
      graduatedCount = pRes.changes + nRes.changes + kRes.changes;
    });

    runGraduate();

    audit.log('IMPORT_BATCH_GRADUATED', {
      action: 'import_batch_graduated',
      outcome: 'success',
      actor: req.userUuid,
      details: { batchId: id, graduatedCount },
    });

    if (graduatedCount > 0) {
      publishMutation(req.userUuid, 'vault_pearls', id, 'upsert');
    }

    res.json({
      success: true,
      data: {
        graduated_count: graduatedCount,
      },
    });
  } catch (err: any) {
    console.error('Import batch graduate error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure graduating import batch.' });
  }
});

/**
 * 🐚 DELETE /api/vault/import-batches/:id — Transactionally revert an import batch.
 * Purges all records and cascades to linked attachments.
 */
router.delete('/import-batches/:id', requireAuth, requirePermission('canDelete'), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    let deletedCount = 0;
    let deletedAttachments = 0;

    const runRevert = db.transaction(() => {
      const pearls = db.prepare('SELECT id, attachments FROM vault_pearls WHERE import_batch_id = ? AND owner_uuid = ?').all(id, req.userUuid) as { id: string; attachments?: string }[];
      const notes = db.prepare('SELECT id, attachments FROM vault_secure_notes WHERE import_batch_id = ? AND owner_uuid = ?').all(id, req.userUuid) as { id: string; attachments?: string }[];
      const keys = db.prepare('SELECT id, attachments FROM vault_ssh_keys WHERE import_batch_id = ? AND owner_uuid = ?').all(id, req.userUuid) as { id: string; attachments?: string }[];

      const allItems = [...pearls, ...notes, ...keys];
      if (allItems.length === 0) {
        return;
      }

      const itemIds = allItems.map(i => i.id);

      const attachmentIdSet = new Set<string>();
      for (const item of allItems) {
        try {
          const parsed = JSON.parse(item.attachments || '[]');
          if (Array.isArray(parsed)) {
            for (const attId of parsed) {
              if (typeof attId === 'string') attachmentIdSet.add(attId);
            }
          }
        } catch { }
      }

      const delAttachmentStmt = db.prepare('DELETE FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?');
      const delAttachmentByParentStmt = db.prepare('DELETE FROM vault_secure_attachments WHERE parent_id = ? AND owner_uuid = ?');

      for (const attId of attachmentIdSet) {
        const attRes = delAttachmentStmt.run(attId, req.userUuid);
        deletedAttachments += attRes.changes;
      }

      for (const parentId of itemIds) {
        const pRes = delAttachmentByParentStmt.run(parentId, req.userUuid);
        deletedAttachments += pRes.changes;
      }

      const pDel = db.prepare('DELETE FROM vault_pearls WHERE import_batch_id = ? AND owner_uuid = ?').run(id, req.userUuid);
      const nDel = db.prepare('DELETE FROM vault_secure_notes WHERE import_batch_id = ? AND owner_uuid = ?').run(id, req.userUuid);
      const kDel = db.prepare('DELETE FROM vault_ssh_keys WHERE import_batch_id = ? AND owner_uuid = ?').run(id, req.userUuid);

      deletedCount = pDel.changes + nDel.changes + kDel.changes;
    });

    runRevert();

    if (deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Import batch not found or already purged.' });
    }

    audit.log('IMPORT_BATCH_REVERTED', {
      action: 'import_batch_reverted',
      outcome: 'success',
      actor: req.userUuid,
      details: { batchId: id, deletedCount, deletedAttachments },
    });

    publishMutation(req.userUuid, 'vault_pearls', id, 'delete');

    res.json({
      success: true,
      data: {
        deleted_count: deletedCount,
        deleted_attachments: deletedAttachments,
      },
    });
  } catch (err: any) {
    console.error('Import batch revert error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure reverting import batch.' });
  }
});

/**
 * 🐚 PUT /api/vault/:id — update an owned pearl.
 * Auto-graduates the item by clearing imported_at and import_batch_id to NULL.
 */
router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(VaultSchemas.update), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, secret, username, url, uris, type, category, tags, notes, totp_secret, password_history, attachments, custom_fields } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM vault_pearls WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Vault entry not found.' });
    }

    const normalizedTags = tags !== undefined ? normalizeTagsForDb(tags) : (existing.tags || '[]');

    const toStore = await prepareWrite('vault_pearls', {
      title: title.trim(),
      username: username ? username.trim() : '',
      url: url ? url.trim() : '',
      category: category || '',
      tags: normalizedTags,
      notes: notes || '',
    }, fieldCipher);

    db.prepare(`
      UPDATE vault_pearls
      SET title = ?, secret = ?, username = ?, url = ?, uris = ?, type = ?, category = ?, tags = ?, notes = ?, totp_secret = ?, password_history = ?, attachments = ?, custom_fields = ?, imported_at = NULL, import_batch_id = NULL
      WHERE id = ? AND owner_uuid = ?
    `).run(
      toStore.title,
      secret,
      toStore.username,
      toStore.url,
      uris !== undefined ? uris : (existing.uris || '[]'),
      type || 'password',
      toStore.category,
      toStore.tags,
      toStore.notes,
      totp_secret !== undefined ? totp_secret : (existing.totp_secret || ''),
      password_history !== undefined ? password_history : (existing.password_history || '[]'),
      attachments || '[]',
      custom_fields || '',
      id,
      req.userUuid
    );

    audit.log('VAULT_ITEM_UPDATED', {
      action: 'vault_item_updated',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemType: type || 'password', itemId: id, category: category || '', tags: normalizedTags },
    });

    publishMutation(req.userUuid, 'vault_pearls', id, 'upsert');

    res.json({
      success: true,
      data: { id, title: title.trim(), username: username ? username.trim() : '', url: url ? url.trim() : '', type: type || 'password', category: category || '', tags: normalizedTags, notes: notes || '' },
    });
  } catch (err: any) {
    console.error('Vault PUT error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure updating password in vault.' });
  }
});

/**
 * 🐚 DELETE /api/vault/:id — crack an owned pearl out of the vault.
 */
router.delete('/:id', requireAuth, requirePermission('canDelete'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT type, category, attachments FROM vault_pearls WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Password entry not found in your vault.' });
    }

    const decryptedRow = await prepareRead('vault_pearls', row, fieldCipher);

    // Cascade delete: remove every attachment record referenced by this pearl.
    // The attachments column holds a JSON array of vault_secure_attachments IDs.
    let cascadeIds: string[] = [];
    try {
      const parsed = JSON.parse(row.attachments || '[]');
      if (Array.isArray(parsed)) cascadeIds = parsed.filter((v: unknown): v is string => typeof v === 'string');
    } catch { /* legacy plaintext garbage — nothing to cascade */ }

    if (cascadeIds.length > 0) {
      const delAttachment = db.prepare('DELETE FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?');
      for (const attId of cascadeIds) {
        const result = delAttachment.run(attId, req.userUuid);
        if (result.changes > 0) {
          audit.log('ATTACHMENT_DELETED', {
            action: 'attachment_deleted',
            outcome: 'success',
            actor: req.userUuid,
            details: { itemId: attId, cascadeFrom: id },
          });
          publishMutation(req.userUuid, 'vault_attachments', attId, 'delete');
        }
      }
    }

    db.prepare('DELETE FROM vault_pearls WHERE id = ? AND owner_uuid = ?').run(id, req.userUuid);

    audit.log('VAULT_ITEM_DELETED', {
      action: 'vault_item_deleted',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemType: decryptedRow.type, itemId: id, category: decryptedRow.category },
    });

    publishMutation(req.userUuid, 'vault_pearls', id, 'delete');

    res.json({ success: true, data: { message: 'Password removed from vault.' } });
  } catch (err: any) {
    console.error('Vault DELETE error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure removing password.' });
  }
});

export default router;
