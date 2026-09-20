import { Router } from 'express';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { VaultSchemas } from '../validation/schemas.js';
import { fieldCipher } from '../utils/fieldEncryption.js';
import { prepareWrite, prepareRead, prepareReadAll } from '../utils/metadataGuard.js';
import { normalizeTagsForDb, filterByTags } from '../utils/tagUtils.js';

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
  const { id, title, secret, username, url, type, category, tags, notes, totp_secret, attachments, custom_fields } = req.body;
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
      INSERT INTO vault_pearls (id, owner_uuid, title, secret, username, url, type, category, tags, notes, totp_secret, attachments, custom_fields, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userUuid,
      toStore.title,
      secret,
      toStore.username,
      toStore.url,
      type || 'password',
      toStore.category,
      toStore.tags,
      toStore.notes,
      totp_secret || '',
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
 * 🐚 PUT /api/vault/:id — update an owned pearl.
 */
router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(VaultSchemas.update), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, secret, username, url, type, category, tags, notes, totp_secret, attachments, custom_fields } = req.body;

  try {
    // Ownership check first so foreign IDs yield 404, not a silent no-op write.
    const existing = db.prepare('SELECT id, tags FROM vault_pearls WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as { id: string; tags?: string } | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Password entry not found in your vault.' });
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
      SET title = ?, secret = ?, username = ?, url = ?, type = ?, category = ?, tags = ?, notes = ?, totp_secret = ?, attachments = ?, custom_fields = ?
      WHERE id = ? AND owner_uuid = ?
    `).run(
      toStore.title,
      secret,
      toStore.username,
      toStore.url,
      type || 'password',
      toStore.category,
      toStore.tags,
      toStore.notes,
      totp_secret || '',
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

    res.json({ success: true, data: { message: 'Password removed from vault.' } });
  } catch (err: any) {
    console.error('Vault DELETE error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure removing password.' });
  }
});

/**
 * 🐚 POST /api/vault/bulk-import — Bulk import pearls.
 * Executes inside a database transaction with per-record validation.
 */
router.post('/bulk-import', requireAuth, requirePermission('canWrite'), validateBody(VaultSchemas.bulkImport), async (req: AuthRequest, res) => {
  const { items } = req.body;
  const errors: { index: number; reason: string }[] = [];
  const inserted: string[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO vault_pearls (id, owner_uuid, title, secret, username, url, type, category, tags, notes, totp_secret, attachments, custom_fields, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const importTx = db.transaction((importItems: any[]) => {
    for (let i = 0; i < importItems.length; i++) {
      const item = importItems[i];
      try {
      } catch (err: any) {
        // Will never be reached here since async throws happen in the first loop
      }
    }
  });

  // Prepare all writes asynchronously before opening the transaction
  const preparedItems: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const normalizedTags = normalizeTagsForDb(item.tags);
      const toStore = await prepareWrite('vault_pearls', {
        title: item.title.trim(),
        username: item.username ? item.username.trim() : '',
        url: item.url ? item.url.trim() : '',
        category: item.category || '',
        tags: normalizedTags,
        notes: item.notes || '',
      }, fieldCipher);

      preparedItems.push({
        index: i,
        original: item,
        toStore,
        normalizedTags,
      });
    } catch (err: any) {
      errors.push({ index: i, reason: err.message });
    }
  }

  try {
    const runImport = db.transaction((itemsToInsert: any[]) => {
      for (const p of itemsToInsert) {
        try {
          insertStmt.run(
            p.original.id,
            req.userUuid,
            p.toStore.title,
            p.original.secret,
            p.toStore.username,
            p.toStore.url,
            p.original.type || 'password',
            p.toStore.category,
            p.toStore.tags,
            p.toStore.notes,
            p.original.totp_secret || '',
            p.original.attachments || '[]',
            p.original.custom_fields || '',
            new Date().toISOString()
          );
          inserted.push(p.original.id);

          // Cannot use audit.log here properly inside tx unless it's okay.
          // `audit.log` uses `db.prepare(...).run()`, which is synchronous and can run inside transaction.
          // Wait, audit is in `audit.sqlite` attached or separate connection?
          // Let's just log them after the transaction or it doesn't matter, it's a separate database connection in `auditLogger.ts`.
        } catch (err: any) {
          errors.push({ index: p.index, reason: err.message });
        }
      }
    });

    runImport(preparedItems);

    for (const p of preparedItems) {
      if (inserted.includes(p.original.id)) {
        audit.log('VAULT_ITEM_CREATED', {
          action: 'vault_item_created',
          outcome: 'success',
          actor: req.userUuid,
          details: { itemType: p.original.type || 'password', itemId: p.original.id, category: p.toStore.category || '', tags: p.normalizedTags, bulk: true },
        });
      }
    }

    if (errors.length > 0) {
      res.status(207).json({
        success: true,
        data: {
          inserted,
          errors
        }
      });
    } else {
      res.status(201).json({
        success: true,
        data: {
          inserted
        }
      });
    }

  } catch (err: any) {
    console.error('Vault POST bulk-import error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure during bulk import.' });
  }
});

/**
 * 🐚 DELETE /api/vault/bulk — Bulk delete items.
 * Executes inside a transaction, cascades to attachments.
 */
router.delete('/bulk', requireAuth, requirePermission('canDelete'), validateBody(VaultSchemas.bulkDelete), async (req: AuthRequest, res) => {
  const { ids } = req.body;
  const deleted: string[] = [];
  const errors: { id: string; reason: string }[] = [];

  const getStmt = db.prepare('SELECT type, category, attachments FROM vault_pearls WHERE id = ? AND owner_uuid = ?');
  const delAttachmentStmt = db.prepare('DELETE FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?');
  const delPearlStmt = db.prepare('DELETE FROM vault_pearls WHERE id = ? AND owner_uuid = ?');

  try {
    const runBulkDelete = db.transaction((itemsToDelete: string[]) => {
      for (const id of itemsToDelete) {
        try {
          const row = getStmt.get(id, req.userUuid) as any;
          if (!row) {
            errors.push({ id, reason: 'Not found' });
            continue;
          }

          let cascadeIds: string[] = [];
          try {
            const parsed = JSON.parse(row.attachments || '[]');
            if (Array.isArray(parsed)) cascadeIds = parsed.filter((v: unknown): v is string => typeof v === 'string');
          } catch { }

          if (cascadeIds.length > 0) {
            for (const attId of cascadeIds) {
              const result = delAttachmentStmt.run(attId, req.userUuid);
              if (result.changes > 0) {
                audit.log('ATTACHMENT_DELETED', {
                  action: 'attachment_deleted',
                  outcome: 'success',
                  actor: req.userUuid,
                  details: { itemId: attId, cascadeFrom: id, bulk: true },
                });
              }
            }
          }

          delPearlStmt.run(id, req.userUuid);
          deleted.push(id);

          // Cannot decrypt category inside transaction because decrypt is async,
          // so we just log the raw category (it might be encrypted, but audit logs
          // usually take it. Let's just log the id and type).
        } catch (err: any) {
          errors.push({ id, reason: err.message });
        }
      }
    });

    runBulkDelete(ids);

    for (const id of deleted) {
      audit.log('VAULT_ITEM_DELETED', {
        action: 'vault_item_deleted',
        outcome: 'success',
        actor: req.userUuid,
        details: { itemId: id, bulk: true },
      });
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

export default router;
