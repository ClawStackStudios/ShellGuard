import { Router } from 'express';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { SshKeySchemas } from '../validation/schemas.js';

const router = Router();

// Permission mapping (delta #11): GET→canRead · POST→canWrite · PUT→canEdit · DELETE→canDelete

router.get('/', requireAuth, requirePermission('canRead'), (req: AuthRequest, res) => {
  try {
    const items = db
      .prepare('SELECT * FROM vault_ssh_keys WHERE owner_uuid = ? ORDER BY created_at DESC')
      .all(req.userUuid);
    res.json({ success: true, data: items });
  } catch (err: any) {
    console.error('SSH keys GET error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure retrieving keys.' });
  }
});

router.post('/', requireAuth, requirePermission('canWrite'), validateBody(SshKeySchemas.create), (req: AuthRequest, res) => {
  const { id, title, key_value, username, category } = req.body;
  try {
    db.prepare(`
      INSERT INTO vault_ssh_keys (id, owner_uuid, title, key_value, username, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userUuid, title.trim(), key_value, username || '', category || 'Personal', new Date().toISOString());

    audit.log('SSH_KEY_CREATED', {
      action: 'ssh_key_created',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || 'Personal' },
    });

    res.status(201).json({ success: true, data: { id, title: title.trim(), category: category || 'Personal' } });
  } catch (err: any) {
    console.error('SSH keys POST error:', err);
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, error: 'A key with this ID already exists.' });
    }
    res.status(500).json({ success: false, error: 'Bedrock failure locking key.' });
  }
});

router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(SshKeySchemas.update), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, key_value, username, category } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Key not found.' });
    }

    db.prepare('UPDATE vault_ssh_keys SET title = ?, key_value = ?, username = ?, category = ? WHERE id = ? AND owner_uuid = ?')
      .run(title.trim(), key_value, username || '', category || 'Personal', id, req.userUuid);

    audit.log('SSH_KEY_UPDATED', {
      action: 'ssh_key_updated',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || 'Personal' },
    });

    res.json({ success: true, data: { id, title: title.trim(), category: category || 'Personal' } });
  } catch (err: any) {
    console.error('SSH keys PUT error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure updating key.' });
  }
});

router.delete('/:id', requireAuth, requirePermission('canDelete'), (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT id, category FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Key not found.' });
    }

    db.prepare('DELETE FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?').run(id, req.userUuid);

    audit.log('SSH_KEY_DELETED', {
      action: 'ssh_key_deleted',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: row.category },
    });

    res.json({ success: true, data: { message: 'Key removed.' } });
  } catch (err: any) {
    console.error('SSH keys DELETE error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure removing key.' });
  }
});

export default router;
