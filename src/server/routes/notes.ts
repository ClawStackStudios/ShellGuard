import { Router } from 'express';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { NoteSchemas } from '../validation/schemas.js';
import { fieldCipher } from '../utils/fieldEncryption.js';
import { prepareWrite, prepareRead, prepareReadAll } from '../utils/metadataGuard.js';
import { normalizeTagsForDb, filterByTags } from '../utils/tagUtils.js';

const router = Router();

// Permission mapping (delta #11): GET→canRead · POST→canWrite · PUT→canEdit · DELETE→canDelete

router.get('/', requireAuth, requirePermission('canRead'), async (req: AuthRequest, res) => {
  try {
    const items = db
      .prepare('SELECT * FROM vault_secure_notes WHERE owner_uuid = ? ORDER BY created_at DESC')
      .all(req.userUuid) as Record<string, unknown>[];
    const decrypted = await prepareReadAll('vault_secure_notes', items, fieldCipher);
    const filtered = filterByTags(decrypted, typeof req.query.tags === 'string' ? req.query.tags : undefined);
    res.json({ success: true, data: filtered });
  } catch (err: any) {
    console.error('Notes GET error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure retrieving notes.' });
  }
});

router.post('/', requireAuth, requirePermission('canWrite'), validateBody(NoteSchemas.create), async (req: AuthRequest, res) => {
  const { id, title, content, category, tags, custom_fields, attachments } = req.body;
  try {
    const normalizedTags = normalizeTagsForDb(tags);
    const toStore = await prepareWrite('vault_secure_notes', {
      title: title.trim(),
      category: category || '',
      tags: normalizedTags,
    }, fieldCipher);

    db.prepare(`
      INSERT INTO vault_secure_notes (id, owner_uuid, title, content, category, tags, custom_fields, attachments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userUuid, toStore.title, content, toStore.category, toStore.tags, custom_fields || '', attachments || '[]', new Date().toISOString());

    audit.log('NOTE_CREATED', {
      action: 'note_created',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || '', tags: normalizedTags },
    });

    res.status(201).json({ success: true, data: { id, title: title.trim(), category: category || '', tags: normalizedTags } });
  } catch (err: any) {
    console.error('Notes POST error:', err);
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, error: 'A note with this ID already exists.' });
    }
    res.status(500).json({ success: false, error: 'Bedrock failure locking note.' });
  }
});

router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(NoteSchemas.update), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, content, category, tags, custom_fields, attachments } = req.body;
  try {
    const existing = db.prepare('SELECT id, tags, attachments FROM vault_secure_notes WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as { id: string; tags?: string; attachments?: string } | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }

    const normalizedTags = tags !== undefined ? normalizeTagsForDb(tags) : (existing.tags || '[]');
    const finalAttachments = attachments !== undefined ? attachments : (existing.attachments || '[]');

    const toStore = await prepareWrite('vault_secure_notes', {
      title: title.trim(),
      category: category || '',
      tags: normalizedTags,
    }, fieldCipher);

    db.prepare('UPDATE vault_secure_notes SET title = ?, content = ?, category = ?, tags = ?, custom_fields = ?, attachments = ? WHERE id = ? AND owner_uuid = ?')
      .run(toStore.title, content, toStore.category, toStore.tags, custom_fields || '', finalAttachments, id, req.userUuid);

    audit.log('NOTE_UPDATED', {
      action: 'note_updated',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || '', tags: normalizedTags },
    });

    res.json({ success: true, data: { id, title: title.trim(), category: category || '', tags: normalizedTags } });
  } catch (err: any) {
    console.error('Notes PUT error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure updating note.' });
  }
});

router.delete('/:id', requireAuth, requirePermission('canDelete'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT id, category, attachments FROM vault_secure_notes WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }

    const decryptedRow = await prepareRead('vault_secure_notes', row, fieldCipher);

    // Cascade delete any associated attachments
    try {
      const parsedAttachments = JSON.parse(row.attachments || '[]');
      if (Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
        const delAttachment = db.prepare('DELETE FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?');
        for (const attId of parsedAttachments) {
          if (typeof attId === 'string') {
            delAttachment.run(attId, req.userUuid);
          }
        }
      }
    } catch { }

    db.prepare('DELETE FROM vault_secure_notes WHERE id = ? AND owner_uuid = ?').run(id, req.userUuid);

    audit.log('NOTE_DELETED', {
      action: 'note_deleted',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: decryptedRow.category },
    });

    res.json({ success: true, data: { message: 'Note removed.' } });
  } catch (err: any) {
    console.error('Notes DELETE error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure removing note.' });
  }
});

export default router;
