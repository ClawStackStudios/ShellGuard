/**
 * One-time batch decrypt script for downgrading.
 *
 * Run BEFORE downgrading to a version without per-row encryption.
 * Reverses the SG-META envelope back to plaintext in all vault tables.
 *
 * Idempotent — skips rows that are not SG-META encrypted.
 *
 * Usage:
 *   DB_ENCRYPTION_KEY=<base64-key> DATA_DIR=./data npx tsx scripts/decrypt-existing-metadata.ts
 */

import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import path from 'node:path';
import { createFieldCipher, isEncryptedField } from '../src/server/utils/fieldEncryption.js';

const TABLES: Record<string, readonly string[]> = {
  vault_pearls:              ['title', 'username', 'url', 'category', 'notes'],
  vault_secure_notes:        ['title', 'category'],
  vault_ssh_keys:            ['title', 'username', 'category'],
  vault_secure_attachments:  ['title', 'file_name', 'category'],
};

async function main(): Promise<void> {
  const keyB64 = process.env.DB_ENCRYPTION_KEY;
  if (!keyB64) {
    console.error('[decrypt-metadata] DB_ENCRYPTION_KEY not set — cannot decrypt without the key.');
    process.exit(1);
  }

  const cipher = await createFieldCipher(keyB64);
  if (!cipher) {
    console.error('[decrypt-metadata] Could not create cipher from key.');
    process.exit(1);
  }

  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'db.sqlite');

  if (!fs.existsSync(dbPath)) {
    console.log(`[decrypt-metadata] No database found at ${dbPath}. Nothing to do.`);
    return;
  }

  const db = new Database(dbPath);

  let totalDecrypted = 0;
  let totalSkipped = 0;

  for (const [table, columns] of Object.entries(TABLES)) {
    const rows = db.prepare(`SELECT id, ${columns.join(', ')} FROM ${table}`).all() as Record<string, unknown>[];
    console.log(`[decrypt-metadata] ${table}: ${rows.length} rows to scan`);

    let decrypted = 0;
    let skipped = 0;

    const updateCols = columns.map(c => `${c} = ?`).join(', ');
    const updateStmt = db.prepare(`UPDATE ${table} SET ${updateCols} WHERE id = ?`);

    for (const row of rows) {
      const newValues: unknown[] = [];
      let changed = false;

      for (const col of columns) {
        const val = row[col];
        if (typeof val === 'string' && isEncryptedField(val)) {
          const plain = await cipher.decrypt(val);
          newValues.push(plain);
          changed = true;
        } else {
          newValues.push(val); // already plaintext, empty, or non-string
        }
      }

      if (changed) {
        updateStmt.run(...newValues, row.id);
        decrypted++;
      } else {
        skipped++;
      }
    }

    console.log(`[decrypt-metadata]   decrypted: ${decrypted}, skipped: ${skipped}`);
    totalDecrypted += decrypted;
    totalSkipped += skipped;
  }

  db.close();
  console.log(`[decrypt-metadata] ✅ Done. Total: ${totalDecrypted} decrypted, ${totalSkipped} skipped.`);
}

main().catch(err => {
  console.error('[decrypt-metadata] Fatal error:', err);
  process.exit(1);
});