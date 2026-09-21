// src/lib/vaultExport.ts — Dual Encrypted/Unencrypted JSON & CSV export suite for ShellGuard.
import { VaultItem } from '../types.ts';
import { hkdfSha256, pbkdf2Sha256, aesGcmEncrypt, aesGcmDecrypt, sha256 } from './webCryptoFallback.ts';

export const SHELLGUARD_BACKUP_FORMAT = 'shellguard-vault-backup-v1';
const HKDF_INFO_BACKUP = 'shellguard-vault-backup-v1';
export const DEFAULT_PBKDF2_ITERATIONS = 600000;

export interface ShellGuardEncryptedBackupEnvelope {
  v?: number;
  version: number;
  format: string;
  kind: 'json' | 'csv';
  kdf?: 'hkdf' | 'pbkdf2';
  kdfIterations?: number;
  createdAt: number;
  salt: string; // Base64
  iv: string;   // Base64
  payload: string; // Base64 ciphertext + 16-byte tag
  checksumSha256: string; // Hex (plaintext diagnostic integrity check)
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64Str: string): Uint8Array {
  const binary = atob(b64Str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function escapeCsvField(val: unknown): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Derives a 256-bit AES key for the backup envelope.
 * For PBKDF2: prefers native WebCrypto async derivation on secure origins (sub-second for 600k iterations)
 * and falls back to pure-TS pbkdf2Sha256 on non-secure LAN origins where crypto.subtle is undefined.
 */
async function deriveKeyForEnvelope(
  keyBytes: Uint8Array,
  salt: Uint8Array,
  kdf: 'hkdf' | 'pbkdf2',
  iterations: number
): Promise<Uint8Array> {
  if (kdf === 'pbkdf2') {
    if (typeof globalThis.crypto?.subtle !== 'undefined') {
      const baseKey = await globalThis.crypto.subtle.importKey(
        'raw',
        keyBytes,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      const bits = await globalThis.crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
        baseKey,
        256
      );
      return new Uint8Array(bits);
    }
    // Fallback for insecure LAN contexts where crypto.subtle is undefined
    return pbkdf2Sha256(keyBytes, salt, iterations, 32);
  }

  const infoBytes = new TextEncoder().encode(HKDF_INFO_BACKUP);
  return hkdfSha256(keyBytes, salt, infoBytes, 32);
}

/**
 * Generates an RFC 4180 compliant CSV spreadsheet of vault items.
 * Pass `includePasswords: false` to sanitize/omit secret credentials for audit spreadsheets.
 */
export function generateVaultCsv(
  items: VaultItem[],
  options: { includePasswords?: boolean } = { includePasswords: true }
): string {
  const includePasswords = options.includePasswords !== false;
  const headers = ['Title', 'Category', 'Type', 'Username', 'Password', 'URL', 'Notes', 'TOTP', 'Tags', 'CustomFields'];
  const lines: string[] = [headers.join(',')];

  for (const item of items) {
    // Determine tags string
    let tagsStr = '';
    if (item.tags) {
      try {
        const parsedTags = JSON.parse(item.tags);
        if (Array.isArray(parsedTags)) {
          tagsStr = parsedTags.map(t => (typeof t === 'string' ? t : t.name)).join(', ');
        }
      } catch {
        tagsStr = item.tags;
      }
    }

    // Determine custom fields string representation
    let customFieldsStr = '';
    if (item.custom_fields) {
      try {
        const parsedCf = JSON.parse(item.custom_fields);
        if (Array.isArray(parsedCf)) {
          customFieldsStr = parsedCf.map(cf => `${cf.name}: ${cf.value}`).join(' | ');
        }
      } catch {
        customFieldsStr = item.custom_fields;
      }
    }

    const row = [
      escapeCsvField(item.title || ''),
      escapeCsvField(item.category || ''),
      escapeCsvField(item.type || 'password'),
      escapeCsvField(item.username || ''),
      escapeCsvField(includePasswords ? (item.secret || '') : ''),
      escapeCsvField(item.url || ''),
      escapeCsvField(item.notes || ''),
      escapeCsvField(item.totp_secret || ''),
      escapeCsvField(tagsStr),
      escapeCsvField(customFieldsStr),
    ];

    lines.push(row.join(','));
  }

  return lines.join('\r\n');
}

/**
 * Checks if a parsed payload is a ShellGuard encrypted backup envelope.
 */
export function isShellGuardEncryptedBackup(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  return (
    obj.format === SHELLGUARD_BACKUP_FORMAT &&
    typeof obj.salt === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.payload === 'string'
  );
}

/**
 * Encrypts an export payload (JSON string or CSV text) into a ShellGuard encrypted envelope.
 * Seals with AES-256-GCM using key material derived from the user's ClawKey or custom password.
 */
export async function encryptBackupPayload(
  data: string,
  secretKey: string,
  kind: 'json' | 'csv'
): Promise<ShellGuardEncryptedBackupEnvelope> {
  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(data);
  // Plaintext checksum is preserved as an explicit diagnostic layer (detects corruption vs key mismatch)
  const checksumSha256 = bytesToHex(sha256(plaintextBytes));

  // Generate random salt (16 bytes) and IV (12 bytes) using CSPRNG.
  // Never fallback to PRNG in GCM — predictability destroys confidentiality & authenticity.
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('CSPRNG unavailable: crypto.getRandomValues is required for secure backup encryption.');
  }
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const trimmedKey = secretKey.trim();
  const keyBytes = enc.encode(trimmedKey);

  // KDF Selection:
  // - High-entropy sovereign ClawKey ('hu-...' with 256 bits of entropy) -> HKDF-SHA256 is optimal.
  // - Human-supplied passphrase -> PBKDF2-HMAC-SHA256 (600,000 iterations) provides essential brute-force resistance.
  const isClawKey = trimmedKey.startsWith('hu-') && trimmedKey.length === 67;
  const kdf: 'hkdf' | 'pbkdf2' = isClawKey ? 'hkdf' : 'pbkdf2';
  const kdfIterations = isClawKey ? undefined : DEFAULT_PBKDF2_ITERATIONS;

  const derivedKey = await deriveKeyForEnvelope(keyBytes, salt, kdf, kdfIterations || DEFAULT_PBKDF2_ITERATIONS);

  // Authenticated Data
  const aad = enc.encode(`shellguard_backup:${kind}`);

  // Encrypt with AES-256-GCM
  const encryptedPayload = aesGcmEncrypt(derivedKey, iv, plaintextBytes, aad);

  return {
    v: 1,
    version: 1,
    format: SHELLGUARD_BACKUP_FORMAT,
    kind,
    kdf,
    kdfIterations,
    createdAt: Date.now(),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    payload: bytesToBase64(encryptedPayload),
    checksumSha256,
  };
}

/**
 * Decrypts a ShellGuard encrypted backup envelope, verifying integrity with SHA-256 and AAD.
 */
export async function decryptBackupPayload(
  envelope: ShellGuardEncryptedBackupEnvelope | string,
  secretKey: string
): Promise<{ data: string; kind: 'json' | 'csv' }> {
  let parsedEnv: ShellGuardEncryptedBackupEnvelope;
  if (typeof envelope === 'string') {
    try {
      parsedEnv = JSON.parse(envelope);
    } catch {
      throw new Error('Invalid backup file: Not valid JSON.');
    }
  } else {
    parsedEnv = envelope;
  }

  if (!isShellGuardEncryptedBackup(parsedEnv)) {
    throw new Error('Not a recognized ShellGuard encrypted backup envelope.');
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const salt = base64ToBytes(parsedEnv.salt);
  const iv = base64ToBytes(parsedEnv.iv);
  const payloadBytes = base64ToBytes(parsedEnv.payload);

  const trimmedKey = secretKey.trim();
  const keyBytes = enc.encode(trimmedKey);

  const kind = parsedEnv.kind || 'json';
  const aad = enc.encode(`shellguard_backup:${kind}`);

  // Derive key based on envelope metadata or fallback
  const kdf = parsedEnv.kdf || (trimmedKey.startsWith('hu-') ? 'hkdf' : 'pbkdf2');
  const iterations = parsedEnv.kdfIterations || DEFAULT_PBKDF2_ITERATIONS;

  const derivedKey = await deriveKeyForEnvelope(keyBytes, salt, kdf, iterations);

  let decryptedBytes: Uint8Array;
  try {
    decryptedBytes = aesGcmDecrypt(derivedKey, iv, payloadBytes, aad);
  } catch (err: any) {
    // If decryption failed and no explicit KDF was stored, attempt the alternate KDF for backward compatibility
    if (!parsedEnv.kdf) {
      try {
        const altKdf = kdf === 'pbkdf2' ? 'hkdf' : 'pbkdf2';
        const altKey = await deriveKeyForEnvelope(keyBytes, salt, altKdf, DEFAULT_PBKDF2_ITERATIONS);
        decryptedBytes = aesGcmDecrypt(altKey, iv, payloadBytes, aad);
      } catch {
        throw new Error('Decryption failed: Incorrect password or key provided.');
      }
    } else {
      throw new Error('Decryption failed: Incorrect password or key provided.');
    }
  }

  // Verify diagnostic plaintext checksum
  if (parsedEnv.checksumSha256) {
    const computedChecksum = bytesToHex(sha256(decryptedBytes));
    if (computedChecksum.toLowerCase() !== parsedEnv.checksumSha256.toLowerCase()) {
      throw new Error('Integrity check failed: Payload checksum mismatch.');
    }
  }

  return {
    data: dec.decode(decryptedBytes),
    kind,
  };
}
