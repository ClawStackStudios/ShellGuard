import crypto from 'crypto';

/**
 * Per-row server-side metadata encryption.
 *
 * Encrypts sensitive-but-searchable metadata columns (title, username, url,
 * category, notes, file_name) with AES-256-GCM.  The derived key is seeded
 * from DB_ENCRYPTION_KEY via HKDF-SHA256, so the same env var that enables
 * SQLCipher whole-DB encryption also governs per-row field encryption.
 *
 * Stored envelope — a self-describing JSON string in the same TEXT column:
 *   { v:1, alg:"SG-META", iv:"<b64>", ct:"<b64>" }
 *
 * Deliberately distinct from the client's ShellCryption envelope
 * ({ alg:"AES-GCM-256", ... }) so the two systems never confuse each other.
 *
 * When DB_ENCRYPTION_KEY is not set, every function is a no-op passthrough.
 *
 * Implementation note: uses Node native crypto (createCipheriv / hkdfSync)
 * rather than crypto.webcrypto.subtle for maximum environment compatibility.
 */

// ── Constants ────────────────────────────────────────────────────────────────

const ALG = 'SG-META';
const IV_LENGTH = 12;           // 96 bits — standard for AES-GCM
const KEY_LENGTH = 32;          // 256 bits
const HKDF_SALT = 'shellguard-metadata-encryption-v1';
const HKDF_INFO = 'sg-meta-aes-256-gcm';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FieldCipher {
  encrypt: (plaintext: string, aad?: string) => Promise<string>;
  decrypt: (envelope: string, aad?: string) => Promise<string>;
  isActive: true;
}

interface EncryptedEnvelope {
  v: number;
  alg: string;
  iv: string;
  ct: string;    // ciphertext || auth tag (appended by Node crypto)
}

// ── Key derivation ───────────────────────────────────────────────────────────

/**
 * Derives an AES-256 key from DB_ENCRYPTION_KEY (base64) via HKDF-SHA256.
 * Deterministic — same input always produces the same key.
 */
export function deriveMetadataKey(encryptionKeyB64: string): Buffer {
  const rawKey = Buffer.from(encryptionKeyB64, 'base64');
  return Buffer.from(crypto.hkdfSync('sha256', rawKey, HKDF_SALT, HKDF_INFO, KEY_LENGTH));
}

// ── Encrypt / Decrypt ────────────────────────────────────────────────────────

/**
 * Encrypt a single plaintext string with AES-256-GCM.
 * Returns the self-describing JSON envelope.  Empty/falsy strings pass through.
 * The 16-byte GCM auth tag is appended to ciphertext by Node's cipher.final().
 */
export async function encryptField(
  plaintext: string,
  key: Buffer,
  aad?: string,
): Promise<string> {
  if (!plaintext) return plaintext;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  if (aad) {
    cipher.setAAD(Buffer.from(aad, 'utf8'));
  }

  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // ct = ciphertext || tag (single base64 value; decrypt splits tag from end)
  const ctWithTag = Buffer.concat([enc, tag]);

  const envelope: EncryptedEnvelope = {
    v: 1,
    alg: ALG,
    iv: iv.toString('base64'),
    ct: ctWithTag.toString('base64'),
  };
  return JSON.stringify(envelope);
}

/**
 * Decrypt a single field.  If the value is not a SG-META envelope
 * (legacy plaintext, empty string, ShellCryption blob, etc.), returns it
 * unchanged for backward compatibility.
 */
export async function decryptField(
  envelope: string,
  key: Buffer,
  aad?: string,
): Promise<string> {
  if (!envelope) return envelope;

  let parsed: EncryptedEnvelope;
  try {
    parsed = JSON.parse(envelope);
  } catch {
    // Not JSON — legacy plaintext, return as-is
    return envelope;
  }

  if (!parsed || parsed.alg !== ALG) {
    // Not a SG-META envelope — passthrough
    return envelope;
  }

  try {
    const ctWithTag = Buffer.from(parsed.ct, 'base64');
    const iv = Buffer.from(parsed.iv, 'base64');

    // Split: last 16 bytes are the GCM auth tag
    const enc = ctWithTag.subarray(0, ctWithTag.length - 16);
    const tag = ctWithTag.subarray(ctWithTag.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    if (aad) {
      decipher.setAAD(Buffer.from(aad, 'utf8'));
    }

    const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    // Tampered ciphertext, wrong key, or corrupt IV
    console.error('[FieldEncryption] Decryption failed — tampered or wrong key');
    return '[decryption failed]';
  }
}

// ── Type guard ───────────────────────────────────────────────────────────────

/**
 * Returns true if the value is a SG-META encrypted envelope.
 * False for plaintext, empty strings, ShellCryption blobs, etc.
 */
export function isEncryptedField(value: unknown): boolean {
  if (typeof value !== 'string' || !value.startsWith('{')) return false;
  try {
    const parsed = JSON.parse(value);
    return parsed?.alg === ALG;
  } catch {
    return false;
  }
}

// ── Singleton factory ────────────────────────────────────────────────────────

/**
 * Creates a FieldCipher from a DB_ENCRYPTION_KEY value.
 * Returns null if the key is not set (plaintext passthrough mode).
 */
export async function createFieldCipher(
  encryptionKey: string | undefined,
): Promise<FieldCipher | null> {
  if (!encryptionKey) return null;

  const key = deriveMetadataKey(encryptionKey);

  return {
    encrypt: (plaintext: string, aad?: string) => encryptField(plaintext, key, aad),
    decrypt: (envelope: string, aad?: string) => decryptField(envelope, key, aad),
    isActive: true as const,
  };
}

/**
 * Module-level singleton. Initialized once at import time.
 * Call initFieldCipher() during server bootstrap to populate this.
 */
export let fieldCipher: FieldCipher | null = null;

/**
 * Bootstrap function — call once during server startup.
 * Reads process.env.DB_ENCRYPTION_KEY and creates the singleton cipher.
 */
export async function initFieldCipher(): Promise<void> {
  const key = process.env.DB_ENCRYPTION_KEY;
  fieldCipher = await createFieldCipher(key);

  if (fieldCipher) {
    console.log('[FieldEncryption] AES-256-GCM metadata encryption active.');
  } else {
    console.log('[FieldEncryption] Metadata encryption disabled (DB_ENCRYPTION_KEY not set).');
  }
}