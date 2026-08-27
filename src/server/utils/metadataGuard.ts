/**
 * Metadata column registry and encrypt/decrypt helpers for per-row field encryption.
 *
 * Each vault table has a defined set of "metadata" columns that are encrypted
 * server-side with AES-256-GCM (via fieldEncryption.ts) before storage.
 * ShellCryption blobs (secret, content, key_value, file_data, totp_secret)
 * are NEVER touched by this module — they remain opaque client-side ciphertext.
 */

import type { FieldCipher } from './fieldEncryption.js';
import { isEncryptedField } from './fieldEncryption.js';

// ── Column registry ──────────────────────────────────────────────────────────

const METADATA_COLUMNS: Record<string, readonly string[]> = {
  vault_pearls:              ['title', 'username', 'url', 'category', 'notes'] as const,
  vault_secure_notes:        ['title', 'category'] as const,
  vault_ssh_keys:            ['title', 'username', 'category'] as const,
  vault_secure_attachments:  ['title', 'file_name', 'category'] as const,
};

// ── Transform helpers ────────────────────────────────────────────────────────

/**
 * Encrypts the metadata columns of a row for database storage.
 * Non-metadata columns pass through untouched.  Empty strings are skipped.
 */
export async function prepareWrite(
  tableName: string,
  body: Record<string, unknown>,
  cipher: FieldCipher | null,
): Promise<Record<string, unknown>> {
  if (!cipher) return body;

  const cols = METADATA_COLUMNS[tableName];
  if (!cols) return body;                   // unknown table — passthrough

  const out: Record<string, unknown> = { ...body };
  for (const col of cols) {
    const val = out[col];
    if (typeof val === 'string' && val.length > 0) {
      out[col] = await cipher.encrypt(val);
    }
    // Non-string or empty strings stay as-is
  }
  return out;
}

/**
 * Decrypts the metadata columns of a DB row before API response.
 * Non-encrypted values (legacy plaintext, empty strings) pass through unchanged.
 */
export async function prepareRead(
  tableName: string,
  row: Record<string, unknown>,
  cipher: FieldCipher | null,
): Promise<Record<string, unknown>> {
  if (!cipher) return row;

  const cols = METADATA_COLUMNS[tableName];
  if (!cols) return row;

  const out: Record<string, unknown> = { ...row };
  for (const col of cols) {
    const val = out[col];
    if (typeof val === 'string' && isEncryptedField(val)) {
      out[col] = await cipher.decrypt(val);
    }
    // Non-string or non-encrypted pass through
  }
  return out;
}

/**
 * Decrypts metadata for an array of DB rows.
 */
export async function prepareReadAll(
  tableName: string,
  rows: Record<string, unknown>[],
  cipher: FieldCipher | null,
): Promise<Record<string, unknown>[]> {
  if (!cipher || rows.length === 0) return rows;
  return Promise.all(rows.map(row => prepareRead(tableName, row, cipher)));
}