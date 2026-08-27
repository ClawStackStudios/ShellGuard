import { Router } from 'express';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { AttachmentSchemas } from '../validation/schemas.js';
import { fieldCipher } from '../utils/fieldEncryption.js';
import { prepareWrite, prepareRead, prepareReadAll } from '../utils/metadataGuard.js';

const router = Router();

// Permission mapping (delta #11): GET→canRead · POST→canWrite · PUT→canEdit · DELETE→canDelete
// NOTE: this router is mounted behind the scoped 32mb JSON body parser (delta #4).

router.get('/', requireAuth, requirePermission('canRead'), async (req: AuthRequest, res) => {
  try {
    const items = db
      .prepare('SELECT * FROM vault_secure_attachments WHERE owner_uuid = ? ORDER BY created_at DESC')
      .all(req.userUuid) as Record<string, unknown>[];
    const decrypted = await prepareReadAll('vault_secure_attachments', items, fieldCipher);
    res.json({ success: true, data: decrypted });
  } catch (err: any) {
    console.error('Attachments GET error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure retrieving attachments.' });
  }
});

router.post('/', requireAuth, requirePermission('canWrite'), validateBody(AttachmentSchemas.create), async (req: AuthRequest, res) => {
  const { id, title, file_data, file_name, mime_type, category } = req.body;
  try {
    const toStore = await prepareWrite('vault_secure_attachments', {
      title: title.trim(),
      file_name: file_name || '',
      category: category || 'Personal',
    }, fieldCipher);

    db.prepare(`
      INSERT INTO vault_secure_attachments (id, owner_uuid, title, file_data, file_name, mime_type, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userUuid, toStore.title, file_data, toStore.file_name, mime_type || '', toStore.category, new Date().toISOString());

    audit.log('ATTACHMENT_UPLOADED', {
      action: 'attachment_uploaded',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || 'Personal', bytes: Buffer.byteLength(file_data || ''), mimeType: mime_type || '' },
    });

    res.status(201).json({ success: true, data: { id, title: title.trim(), category: category || 'Personal' } });
  } catch (err: any) {
    console.error('Attachments POST error:', err);
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, error: 'An attachment with this ID already exists.' });
    }
    res.status(500).json({ success: false, error: 'Bedrock failure locking attachment.' });
  }
});

router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(AttachmentSchemas.update), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, file_data, file_name, mime_type, category } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Attachment not found.' });
    }

    const toStore = await prepareWrite('vault_secure_attachments', {
      title: title.trim(),
      file_name: file_name || '',
      category: category || 'Personal',
    }, fieldCipher);

    db.prepare('UPDATE vault_secure_attachments SET title = ?, file_data = ?, file_name = ?, mime_type = ?, category = ? WHERE id = ? AND owner_uuid = ?')
      .run(toStore.title, file_data, toStore.file_name, mime_type || '', toStore.category, id, req.userUuid);

    audit.log('ATTACHMENT_UPDATED', {
      action: 'attachment_updated',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || 'Personal', bytes: Buffer.byteLength(file_data || ''), mimeType: mime_type || '' },
    });

    res.json({ success: true, data: { id, title: title.trim(), category: category || 'Personal' } });
  } catch (err: any) {
    console.error('Attachments PUT error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure updating attachment.' });
  }
});

router.delete('/:id', requireAuth, requirePermission('canDelete'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT id, category FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Attachment not found.' });
    }

    const decryptedRow = await prepareRead('vault_secure_attachments', row, fieldCipher);

    db.prepare('DELETE FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?').run(id, req.userUuid);

    audit.log('ATTACHMENT_DELETED', {
      action: 'attachment_deleted',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: decryptedRow.category },
    });

    res.json({ success: true, data: { message: 'Attachment removed.' } });
  } catch (err: any) {
    console.error('Attachments DELETE error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure removing attachment.' });
  }
});

export default router;
