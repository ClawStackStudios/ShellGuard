import { Router } from 'express';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { NoteSchemas } from '../validation/schemas.js';
import { fieldCipher } from '../utils/fieldEncryption.js';
import { prepareWrite, prepareRead, prepareReadAll } from '../utils/metadataGuard.js';

const router = Router();

// Permission mapping (delta #11): GET→canRead · POST→canWrite · PUT→canEdit · DELETE→canDelete

router.get('/', requireAuth, requirePermission('canRead'), async (req: AuthRequest, res) => {
  try {
    const items = db
      .prepare('SELECT * FROM vault_secure_notes WHERE owner_uuid = ? ORDER BY created_at DESC')
      .all(req.userUuid) as Record<string, unknown>[];
    const decrypted = await prepareReadAll('vault_secure_notes', items, fieldCipher);
    res.json({ success: true, data: decrypted });
  } catch (err: any) {
    console.error('Notes GET error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure retrieving notes.' });
  }
});

router.post('/', requireAuth, requirePermission('canWrite'), validateBody(NoteSchemas.create), async (req: AuthRequest, res) => {
  const { id, title, content, category } = req.body;
  try {
    const toStore = await prepareWrite('vault_secure_notes', {
      title: title.trim(),
      category: category || 'Personal',
    }, fieldCipher);

    db.prepare(`
      INSERT INTO vault_secure_notes (id, owner_uuid, title, content, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.userUuid, toStore.title, content, toStore.category, new Date().toISOString());

    audit.log('NOTE_CREATED', {
      action: 'note_created',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || 'Personal' },
    });

    res.status(201).json({ success: true, data: { id, title: title.trim(), category: category || 'Personal' } });
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
  const { title, content, category } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM vault_secure_notes WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }

    const toStore = await prepareWrite('vault_secure_notes', {
      title: title.trim(),
      category: category || 'Personal',
    }, fieldCipher);

    db.prepare('UPDATE vault_secure_notes SET title = ?, content = ?, category = ? WHERE id = ? AND owner_uuid = ?')
      .run(toStore.title, content, toStore.category, id, req.userUuid);

    audit.log('NOTE_UPDATED', {
      action: 'note_updated',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || 'Personal' },
    });

    res.json({ success: true, data: { id, title: title.trim(), category: category || 'Personal' } });
  } catch (err: any) {
    console.error('Notes PUT error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure updating note.' });
  }
});

router.delete('/:id', requireAuth, requirePermission('canDelete'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT id, category FROM vault_secure_notes WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }

    const decryptedRow = await prepareRead('vault_secure_notes', row, fieldCipher);

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
