import type { Database } from 'better-sqlite3-multiple-ciphers';

/**
 * Attachment BLOB backfill (Phase 19, v0.0.2.1).
 *
 * Runs in code immediately after migration 0005 because SQLite has no
 * base64-to-bytes re-encoding primitive for existing rows. Migration 0005
 * rebuilds `vault_secure_attachments` with a BLOB-declared `file_data`
 * column, but legacy rows copied verbatim still carry TEXT (the ShellCryption
 * envelope string). This backfill re-encodes every TEXT row to raw utf8
 * bytes and records the true length in `size_bytes`.
 *
 * Idempotent: only rows whose file_data is a string (legacy TEXT) are
 * touched — freshly written BLOB rows are skipped.
 * Fail-closed: the whole sweep is one transaction — a partial conversion
 * (some rows re-encoded, others not) cannot persist.
 * VACUUM after commit so the legacy TEXT pages don't linger as byte-level
 * ghosts (same pattern as keyLedger.ts).
 */
export function migrateAttachmentBlobs(db: Database): void {
  const cols = (db.prepare('PRAGMA table_info(vault_secure_attachments)').all() as any[]).map((c) => c.name);
  if (!cols.includes('size_bytes')) {
    throw new Error('[Attachment BLOB] ❌ vault_secure_attachments.size_bytes missing — run migration 0005 first.');
  }

  const legacy = db
    .prepare("SELECT id, file_data FROM vault_secure_attachments WHERE typeof(file_data) = 'text'")
    .all() as { id: string; file_data: string }[];

  if (legacy.length === 0) return; // already migrated / fresh install

  const upd = db.prepare('UPDATE vault_secure_attachments SET file_data = ?, size_bytes = ? WHERE id = ?');

  const tx = db.transaction(() => {
    for (const row of legacy) {
      const bytes = Buffer.from(row.file_data, 'utf8');
      upd.run(bytes, bytes.length, row.id);
    }
  });
  tx();

  db.exec('VACUUM;');

  console.log(`[Attachment BLOB] 📦 Re-encoded ${legacy.length} legacy attachment row(s) to native BLOB storage.`);
}