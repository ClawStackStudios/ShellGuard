import { Router } from 'express';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { SshKeySchemas } from '../validation/schemas.js';
import { fieldCipher } from '../utils/fieldEncryption.js';
import { prepareWrite, prepareRead, prepareReadAll } from '../utils/metadataGuard.js';

const router = Router();

// Permission mapping (delta #11): GET→canRead · POST→canWrite · PUT→canEdit · DELETE→canDelete

router.get('/', requireAuth, requirePermission('canRead'), async (req: AuthRequest, res) => {
  try {
    const items = db
      .prepare('SELECT * FROM vault_ssh_keys WHERE owner_uuid = ? ORDER BY created_at DESC')
      .all(req.userUuid) as Record<string, unknown>[];
    const decrypted = await prepareReadAll('vault_ssh_keys', items, fieldCipher);
    res.json({ success: true, data: decrypted });
  } catch (err: any) {
    console.error('SSH keys GET error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure retrieving keys.' });
  }
});

router.post('/', requireAuth, requirePermission('canWrite'), validateBody(SshKeySchemas.create), async (req: AuthRequest, res) => {
  const { id, title, key_value, username, category, custom_fields } = req.body;
  try {
    const toStore = await prepareWrite('vault_ssh_keys', {
      title: title.trim(),
      username: username || '',
      category: category || 'Personal',
    }, fieldCipher);

    db.prepare(`
      INSERT INTO vault_ssh_keys (id, owner_uuid, title, key_value, username, category, custom_fields, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userUuid, toStore.title, key_value, toStore.username, toStore.category, custom_fields || '', new Date().toISOString());

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

router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(SshKeySchemas.update), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, key_value, username, category, custom_fields } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Key not found.' });
    }

    const toStore = await prepareWrite('vault_ssh_keys', {
      title: title.trim(),
      username: username || '',
      category: category || 'Personal',
    }, fieldCipher);

    db.prepare('UPDATE vault_ssh_keys SET title = ?, key_value = ?, username = ?, category = ?, custom_fields = ? WHERE id = ? AND owner_uuid = ?')
      .run(toStore.title, key_value, toStore.username, toStore.category, custom_fields || '', id, req.userUuid);

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

router.delete('/:id', requireAuth, requirePermission('canDelete'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT id, category FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Key not found.' });
    }

    const decryptedRow = await prepareRead('vault_ssh_keys', row, fieldCipher);

    db.prepare('DELETE FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?').run(id, req.userUuid);

    audit.log('SSH_KEY_DELETED', {
      action: 'ssh_key_deleted',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: decryptedRow.category },
    });

    res.json({ success: true, data: { message: 'Key removed.' } });
  } catch (err: any) {
    console.error('SSH keys DELETE error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure removing key.' });
  }
});

export default router;
