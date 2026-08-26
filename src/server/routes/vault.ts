import { Router } from 'express';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { VaultSchemas } from '../validation/schemas.js';

const router = Router();

// Permission mapping (delta #11): GET→canRead · POST→canWrite · PUT→canEdit · DELETE→canDelete

/**
 * 🐚 GET /api/vault — list the caller's pearls.
 */
router.get('/', requireAuth, requirePermission('canRead'), (req: AuthRequest, res) => {
  try {
    const items = db
      .prepare('SELECT * FROM vault_pearls WHERE owner_uuid = ? ORDER BY created_at DESC')
      .all(req.userUuid);
    res.json({ success: true, data: items });
  } catch (err: any) {
    console.error('Vault GET error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure retrieving vault passwords.' });
  }
});

/**
 * 🐚 POST /api/vault — lock a new pearl in the vault.
 * Payloads are stored byte-for-byte; only their length is validated.
 */
router.post('/', requireAuth, requirePermission('canWrite'), validateBody(VaultSchemas.create), (req: AuthRequest, res) => {
  const { id, title, secret, username, url, type, category, notes, totp_secret, attachments } = req.body;

  try {
    db.prepare(`
      INSERT INTO vault_pearls (id, owner_uuid, title, secret, username, url, type, category, notes, totp_secret, attachments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userUuid,
      title.trim(),
      secret,
      username ? username.trim() : '',
      url ? url.trim() : '',
      type || 'password',
      category || 'Personal',
      notes || '',
      totp_secret || '',
      attachments || '[]',
      new Date().toISOString()
    );

    audit.log('VAULT_ITEM_CREATED', {
      action: 'vault_item_created',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemType: type || 'password', itemId: id, category: category || 'Personal' },
    });

    res.status(201).json({
      success: true,
      data: { id, title: title.trim(), username: username ? username.trim() : '', url: url ? url.trim() : '', type: type || 'password', category: category || 'Personal' },
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
router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(VaultSchemas.update), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, secret, username, url, type, category, notes, totp_secret, attachments } = req.body;

  try {
    // Ownership check first so foreign IDs yield 404, not a silent no-op write.
    const existing = db.prepare('SELECT id FROM vault_pearls WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Password entry not found in your vault.' });
    }

    db.prepare(`
      UPDATE vault_pearls
      SET title = ?, secret = ?, username = ?, url = ?, type = ?, category = ?, notes = ?, totp_secret = ?, attachments = ?
      WHERE id = ? AND owner_uuid = ?
    `).run(
      title.trim(),
      secret,
      username ? username.trim() : '',
      url ? url.trim() : '',
      type || 'password',
      category || 'Personal',
      notes || '',
      totp_secret || '',
      attachments || '[]',
      id,
      req.userUuid
    );

    audit.log('VAULT_ITEM_UPDATED', {
      action: 'vault_item_updated',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemType: type || 'password', itemId: id, category: category || 'Personal' },
    });

    res.json({
      success: true,
      data: { id, title: title.trim(), username: username ? username.trim() : '', url: url ? url.trim() : '', type: type || 'password', category: category || 'Personal', notes: notes || '' },
    });
  } catch (err: any) {
    console.error('Vault PUT error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure updating password in vault.' });
  }
});

/**
 * 🐚 DELETE /api/vault/:id — crack an owned pearl out of the vault.
 */
router.delete('/:id', requireAuth, requirePermission('canDelete'), (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT type, category FROM vault_pearls WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Password entry not found in your vault.' });
    }

    db.prepare('DELETE FROM vault_pearls WHERE id = ? AND owner_uuid = ?').run(id, req.userUuid);

    audit.log('VAULT_ITEM_DELETED', {
      action: 'vault_item_deleted',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemType: row.type, itemId: id, category: row.category },
    });

    res.json({ success: true, data: { message: 'Password removed from vault.' } });
  } catch (err: any) {
    console.error('Vault DELETE error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure removing password.' });
  }
});

export default router;
