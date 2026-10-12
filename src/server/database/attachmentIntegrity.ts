import { Database } from 'better-sqlite3';
import { audit } from './index.js';

/**
 * Phase 23: Backfill parent references for existing attachments and quarantine orphans.
 */
export function quarantineOrphanAttachments(db: Database) {
  // We only run this logic if the parent_id column exists.
  // It was added in migration 0009.
  const checkCol = db.prepare("PRAGMA table_info(vault_secure_attachments)").all() as any[];
  if (!checkCol.some(c => c.name === 'parent_id')) return { linked: 0, quarantined: 0 };

  // 1. Relink: Find all attachments whose parent_id is NULL
  // Look through vault_pearls, vault_secure_notes, vault_ssh_keys attachments column
  const unlinkedAttachments = db.prepare("SELECT id, owner_uuid FROM vault_secure_attachments WHERE (parent_id IS NULL OR parent_id = '') AND is_quarantined = 0").all() as {id: string, owner_uuid: string}[];

  if (unlinkedAttachments.length === 0) return { linked: 0, quarantined: 0 };

  const tables = ['vault_pearls', 'vault_secure_notes', 'vault_ssh_keys'];
  const tableToType: Record<string, string> = {
      'vault_pearls': 'password', // or 'card', etc., we will set a generic type or infer if possible. We default to 'pearl' here if unknown. We'll grab type column for pearls.
      'vault_secure_notes': 'note',
      'vault_ssh_keys': 'key'
  };

  let relinkedCount = 0;
  let quarantinedCount = 0;

  const updateParent = db.prepare("UPDATE vault_secure_attachments SET parent_id = ?, parent_type = ? WHERE id = ?");
  const quarantine = db.prepare("UPDATE vault_secure_attachments SET is_quarantined = 1, quarantined_at = ? WHERE id = ?");

  for (const att of unlinkedAttachments) {
      let foundParent = false;
      for (const table of tables) {
          // It's a JSON array, we can use LIKE for a quick check, then parse to be sure
          let possibleParents: any[] = [];
          if (table === 'vault_pearls') {
            possibleParents = db.prepare(`SELECT id, type, attachments FROM ${table} WHERE owner_uuid = ? AND attachments LIKE ?`).all(att.owner_uuid, `%${att.id}%`);
          } else {
            possibleParents = db.prepare(`SELECT id, attachments FROM ${table} WHERE owner_uuid = ? AND attachments LIKE ?`).all(att.owner_uuid, `%${att.id}%`);
          }

          for (const parent of possibleParents) {
              let parsed: string[] = [];
              try { parsed = JSON.parse(parent.attachments); } catch(e) {}
              if (parsed.includes(att.id)) {
                  let pType = tableToType[table];
                  if (table === 'vault_pearls' && parent.type) {
                      // Note: type in vault_pearls might be empty, fallback to 'password'
                      pType = parent.type || 'password';
                  }

                  updateParent.run(parent.id, pType, att.id);
                  foundParent = true;
                  relinkedCount++;
                  break;
              }
          }
          if (foundParent) break;
      }

      if (!foundParent) {
          quarantine.run(new Date().toISOString(), att.id);
          quarantinedCount++;
          audit.log('ATTACHMENT_QUARANTINED', {
            action: 'attachment_quarantined',
            outcome: 'success',
            actor: att.owner_uuid,
            details: { itemId: att.id },
          });
      }
  }

  if (relinkedCount > 0 || quarantinedCount > 0) {
      console.log(`[DB] Attachment Integrity: relinked ${relinkedCount}, quarantined ${quarantinedCount} orphans.`);
  }
  return { linked: relinkedCount, quarantined: quarantinedCount };
}
