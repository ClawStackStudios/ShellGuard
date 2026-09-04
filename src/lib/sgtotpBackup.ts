// sgtotpBackup.ts — Parser/mapper for the ShellGuard-TOTP Android `sgtotp.bak` format.
//
// Contract source of truth: ShellGuard-TOTP `BackupManager.kt` + `ShellCryptionEngine.kt`.
// - Encrypted envelope: HKDF-SHA256 (ikm = export key string, salt = envelope.ownerUuid,
//   info = "clawchives-shellcryption-v1", 32 bytes) → AES-GCM-256, AAD `totp_backup:{ownerUuid}`.
// - Checksum: SHA-256 hex over the EXACT decrypted JSON string of the item array.
// - Accepted inputs: encrypted `shellguard-totp-backup-v1`, plaintext
//   `shellguard-totp-plain-export-v1`, or a bare `BackupItemDto[]` array.
//
// Security notes:
// - Decryption happens client-side only; the server never sees the export key or plaintext seeds.
// - Uses the pure TypeScript webCryptoFallback primitives so it works on plain-HTTP LAN origins
//   where `crypto.subtle` is undefined.
// - Imported items receive FRESH web UUIDs (never reuse Android ids) and their category is
//   normalized via normalizePod() per the locked pod decision.

import { hkdfSha256, aesGcmDecrypt, sha256 } from './webCryptoFallback.ts';
import { normalizePod } from './podUtils.ts';

export const SGTOTP_BACKUP_TYPE = 'shellguard-totp-backup-v1';
export const SGTOTP_PLAIN_FORMAT = 'shellguard-totp-plain-export-v1';
const HKDF_INFO = 'clawchives-shellcryption-v1';

/** Mirrors the Android `BackupItemDto`. */
export interface SgTotpBackupItem {
  id: string;
  ownerUuid: string;
  title: string;
  username?: string | null;
  category?: string | null;
  secret: string;
  algorithm?: string;
  digits?: number;
  period?: number;
  isLocalOnly?: boolean;
  syncState?: string;
  remoteUpdatedAt?: string | null;
  localUpdatedAt?: number;
}

export interface SgTotpBackupEnvelope {
  version?: number;
  type: string;
  format?: string;
  protectionMode?: string;
  isBiometricEnabled?: boolean;
  pinLength?: number | null;
  createdAt?: number;
  ownerUuid?: string;
  itemCount?: number;
  checksumSha256: string;
  encryptedEnvelopeJson: string;
}

export interface SgTotpPlainExport {
  version?: number;
  format: string;
  createdAt?: number;
  itemCount?: number;
  checksumSha256?: string;
  items: SgTotpBackupItem[];
}

export type SgTotpBackupKind = 'encrypted' | 'plain' | 'array';

export interface ParsedSgTotpBackup {
  kind: SgTotpBackupKind;
  items: SgTotpBackupItem[];
  ownerUuid?: string;
  protectionMode?: string;
}


/** Sniffs which of the three accepted shapes a raw file body is, without decrypting. */
export function sniffSgTotpBackup(rawText: string): SgTotpBackupKind {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Not a valid sgtotp.bak file: content is not valid JSON.');
  }

  if (Array.isArray(parsed)) {
    return 'array';
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.type === SGTOTP_BACKUP_TYPE) {
    return 'encrypted';
  }
  if (obj.format === SGTOTP_PLAIN_FORMAT && Array.isArray(obj.items)) {
    return 'plain';
  }
  throw new Error('Not a recognized sgtotp.bak backup (missing type/format markers).');
}

/** Parses (and for encrypted envelopes, decrypts + checksum-verifies) a sgtotp.bak body. */
export function parseSgTotpBackup(rawText: string, exportKey?: string): ParsedSgTotpBackup {
  const kind = sniffSgTotpBackup(rawText);

  if (kind === 'array') {
    return { kind, items: parseItems(JSON.parse(rawText)) };
  }

  const obj = JSON.parse(rawText);
  if (kind === 'plain') {
    const plain = obj as SgTotpPlainExport;
    const items = parseItems(plain.items);
    // Advisory check only: the checksum was computed over kotlinx-pretty-printed JSON,
    // which cannot be byte-reproduced from parsed objects.
    return { kind, items };
  }

  // Encrypted envelope — the export key is mandatory.
  if (!exportKey) {
    throw new Error('SGTOTP_MISSING_KEY');
  }
  const envelope = obj as SgTotpBackupEnvelope;
  const ownerUuid = envelope.ownerUuid || 'local';
  const plainJson = decryptEnvelope(envelope.encryptedEnvelopeJson, exportKey, ownerUuid);

  // Enforced integrity check: SHA-256 over the exact decrypted string (byte-exact —
  // we hold the string itself, so kotlinx pretty-printing is irrelevant here).
  const actual = toHex(sha256(new TextEncoder().encode(plainJson)));
  if (actual.toLowerCase() !== envelope.checksumSha256.toLowerCase()) {
    throw new Error('Backup integrity checksum mismatch — file may be corrupted or tampered with.');
  }

  const items = parseItems(JSON.parse(plainJson));
  return { kind, items, ownerUuid, protectionMode: envelope.protectionMode };
}

function parseItems(raw: unknown): SgTotpBackupItem[] {
  if (!Array.isArray(raw)) {
    throw new Error('sgtotp.bak items payload is not an array.');
  }
  const items: SgTotpBackupItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const o = entry as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.title !== 'string' || typeof o.secret !== 'string') {
      continue; // Skip malformed entries rather than failing the whole import
    }
    if (!o.secret.trim()) continue; // Skip items without a seed
    items.push({
      id: o.id,
      ownerUuid: typeof o.ownerUuid === 'string' ? o.ownerUuid : 'local',
      title: o.title,
      username: typeof o.username === 'string' ? o.username : null,
      category: typeof o.category === 'string' ? o.category : null,
      secret: o.secret,
      algorithm: typeof o.algorithm === 'string' ? o.algorithm : 'SHA1',
      digits: typeof o.digits === 'number' ? o.digits : 6,
      period: typeof o.period === 'number' ? o.period : 30,
      isLocalOnly: Boolean(o.isLocalOnly),
      syncState: typeof o.syncState === 'string' ? o.syncState : 'LOCAL',
      remoteUpdatedAt: typeof o.remoteUpdatedAt === 'string' ? o.remoteUpdatedAt : null,
      localUpdatedAt: typeof o.localUpdatedAt === 'number' ? o.localUpdatedAt : 0
    });
  }
  return items;
}

/**
 * Decrypts an Android ShellCryption envelope with full AAD verification.
 * Mirrors `ShellCryptionEngine.decryptField` (table = "totp_backup", recordId = ownerUuid).
 */
function decryptEnvelope(encryptedEnvelopeJson: string, exportKey: string, ownerUuid: string): string {
  const trimmed = encryptedEnvelopeJson.trim();
  const envelope = JSON.parse(trimmed) as { v?: number; alg?: string; iv: string; ct: string; aad: string };
  if (!envelope.iv || !envelope.ct) {
    throw new Error('Invalid ShellCryption envelope in sgtotp.bak backup.');
  }

  const expectedAad = `totp_backup:${ownerUuid}`;
  if (envelope.aad !== expectedAad) {
    throw new Error(`AAD mismatch — expected '${expectedAad}'. Possible substitution attack.`);
  }

  // Same HKDF parameters as the Android engine: ikm = export key, salt = ownerUuid.
  const encoder = new TextEncoder();
  const rawKey = hkdfSha256(
    encoder.encode(exportKey),
    encoder.encode(ownerUuid),
    encoder.encode(HKDF_INFO),
    32
  );

  const iv = base64ToBytes(envelope.iv);
  const ctAndTag = base64ToBytes(envelope.ct);
  const plainBytes = aesGcmDecrypt(rawKey, iv, ctAndTag, encoder.encode(expectedAad));
  return new TextDecoder().decode(plainBytes);
}

/**
 * Normalizes a Base32 seed exactly like the Android importer:
 * strip spaces/hyphens, uppercase. Throws on clearly-invalid seeds.
 */
export function normalizeBase32Seed(secret: string): string {
  const normalized = secret.replace(/ /g, '').replace(/-/g, '').toUpperCase();
  if (!/^[A-Z2-7]+=*$/.test(normalized)) {
    throw new Error('Invalid Base32 TOTP secret for import (contains non-Base32 characters).');
  }
  if (normalized.length < 8) {
    throw new Error('TOTP secret too short to be valid.');
  }
  return normalized;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Maps parsed backup items to client-side VaultItem-compatible shapes ready for
 * `lockTheClaw` (which performs the vault_pearls_totp:{id} ShellCryption).
 * Every item gets a FRESH id — Android ids are never reused.
 */
export interface SgTotpImportCandidate {
  id: string;
  title: string;
  secret: string;
  username: string;
  url: string;
  category: string;
  type: 'password';
  notes: string;
  totp_secret: string;
  created_at: string;
  totpMeta: { algorithm: string; digits: number; period: number };
}

export function mapSgTotpItemsToVaultItems(
  items: SgTotpBackupItem[],
  generateId: () => string
): SgTotpImportCandidate[] {
  const now = new Date().toISOString();
  return items.map(item => ({
    id: generateId(),
    title: item.title,
    secret: '',
    username: item.username || '',
    url: '',
    category: normalizePod(item.category || ''),
    type: 'password' as const,
    notes: '',
    totp_secret: normalizeBase32Seed(item.secret),
    created_at: item.localUpdatedAt ? new Date(item.localUpdatedAt).toISOString() : now,
    totpMeta: {
      algorithm: item.algorithm || 'SHA1',
      digits: item.digits || 6,
      period: item.period || 30
    }
  }));
}

