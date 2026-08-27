/**
 * One-time batch encrypt script for existing plaintext metadata.
 *
 * After upgrading to the per-row encryption server, existing rows in the vault
 * tables still contain plaintext metadata.  This script scans all vault rows,
 * encrypts any plaintext metadata columns, and writes the ciphertext back.
 *
 * Idempotent — skips rows that are already SG-META encrypted.
 *
 * Usage:
 *   DB_ENCRYPTION_KEY=<base64-key> DATA_DIR=./data npx tsx scripts/encrypt-existing-metadata.ts
 */

import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import path from 'node:path';
import { createFieldCipher, isEncryptedField } from '../src/server/utils/fieldEncryption.js';
import type { FieldCipher } from '../src/server/utils/fieldEncryption.js';

const TABLES: Record<string, readonly string[]> = {
  vault_pearls:              ['title', 'username', 'url', 'category', 'notes'],
  vault_secure_notes:        ['title', 'category'],
  vault_ssh_keys:            ['title', 'username', 'category'],
  vault_secure_attachments:  ['title', 'file_name', 'category'],
};

async function main(): Promise<void> {
  const keyB64 = process.env.DB_ENCRYPTION_KEY;
  if (!keyB64) {
    console.error('[encrypt-metadata] DB_ENCRYPTION_KEY not set. Nothing to do.');
    process.exit(1);
  }

  const cipher = await createFieldCipher(keyB64);
  if (!cipher) {
    console.error('[encrypt-metadata] Could not create cipher from key.');
    process.exit(1);
  }

  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'db.sqlite');

  if (!fs.existsSync(dbPath)) {
    console.log(`[encrypt-metadata] No database found at ${dbPath}. Nothing to do.`);
    return;
  }

  // Open without SQLCipher key — we only need the data, not at-rest protection
  // (the SQLCipher key is a separate concern; we work on plaintext DBs too)
  const db = new Database(dbPath);

  let totalEncrypted = 0;
  let totalSkipped = 0;

  for (const [table, columns] of Object.entries(TABLES)) {
    const rows = db.prepare(`SELECT id, ${columns.join(', ')} FROM ${table}`).all() as Record<string, unknown>[];
    console.log(`[encrypt-metadata] ${table}: ${rows.length} rows to scan`);

    let encrypted = 0;
    let skipped = 0;

    const updateCols = columns.map(c => `${c} = ?`).join(', ');
    const updateStmt = db.prepare(`UPDATE ${table} SET ${updateCols} WHERE id = ?`);

    for (const row of rows) {
      const newValues: unknown[] = [];
      let changed = false;

      for (const col of columns) {
        const val = row[col];
        if (typeof val === 'string' && val.length > 0 && !isEncryptedField(val)) {
          newValues.push(await cipher.encrypt(val));
          changed = true;
        } else {
          newValues.push(val); // already encrypted, empty, or non-string
        }
      }

      if (changed) {
        updateStmt.run(...newValues, row.id);
        encrypted++;
      } else {
        skipped++;
      }
    }

    console.log(`[encrypt-metadata]   encrypted: ${encrypted}, skipped (already done): ${skipped}`);
    totalEncrypted += encrypted;
    totalSkipped += skipped;
  }

  db.close();
  console.log(`[encrypt-metadata] ✅ Done. Total: ${totalEncrypted} encrypted, ${totalSkipped} skipped.`);
}

main().catch(err => {
  console.error('[encrypt-metadata] Fatal error:', err);
  process.exit(1);
});