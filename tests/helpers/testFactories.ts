import crypto from 'node:crypto';
import request from 'supertest';
import type { Express } from 'express';

/**
 * Deterministic factories for ShellGuard fixtures.
 *
 * Everything goes through the running app (supertest) rather than raw SQL so
 * the suites stay decoupled from migration DDL details. The only direct-SQL
 * knowledge in the harness lives in tests/helpers/testDb.ts (SG_TABLES).
 *
 * Payload blobs are OPAQUE ShellCryption-shaped fixtures — JSON strings that
 * look like client-side AES-GCM-256 output ({v, alg, iv, ct, aad}) but are
 * NOT real cryptography. That is the point: the server must never inspect or
 * transform them (opacity invariant).
 */

const uuidv4 = () => crypto.randomUUID();
const randomHex = (bytes: number) => crypto.randomBytes(bytes).toString('hex');
const b64 = (n: number) => crypto.randomBytes(n).toString('base64');

// ─── Identity ────────────────────────────────────────────────────────────────

export interface Identity {
  uuid: string;
  username: string;
  /** sha256 hex of the hu- key — the only thing the server ever stores */
  keyHash: string;
  /** Raw human key (`hu-…`); client-side secret, used only for token exchange */
  humanKey: string;
}

export function newIdentity(prefix = 'sg_test'): Identity {
  const humanKey = `hu-${randomHex(32)}`;
  return {
    uuid: uuidv4(),
    username: `${prefix}_${randomHex(6)}`,
    keyHash: crypto.createHash('sha256').update(humanKey).digest('hex'),
    humanKey,
  };
}

/** POST /api/auth/register — asserts the {success} envelope. */
export async function registerIdentity(app: Express, identity?: Partial<Identity>): Promise<Identity> {
  const full: Identity = { ...newIdentity(), ...identity };
  const res = await request(app)
    .post('/api/auth/register')
    .send({ uuid: full.uuid, username: full.username, keyHash: full.keyHash });

  if (res.status !== 201 || res.body?.success !== true) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return full;
}

// ─── Vault entities ──────────────────────────────────────────────────────────

/**
 * Builds an opaque ShellCryption blob bound to a table:id AAD, exactly like
 * the real client's AES-GCM envelope shape. Fixture only — no real crypto.
 */
export function shellCryptionBlob(table: string, id: string, plaintext = `secret-${randomHex(8)}`): string {
  return JSON.stringify({
    v: 1,
    alg: 'AES-GCM-256',
    iv: b64(12),
    ct: b64(Buffer.byteLength(plaintext)),
    aad: `${table}:${id}`,
  });
}

export interface PearlPayload {
  id: string;
  title: string;
  secret: string; // ShellCryption blob
  username: string;
  url: string;
  type: string;
  category: string;
  notes: string;
}

export function makePearlPayload(overrides: Partial<PearlPayload> = {}): PearlPayload {
  const id = overrides.id ?? uuidv4();
  return {
    id,
    title: `Vault Pearl ${randomHex(3)}`,
    secret: shellCryptionBlob('vault_pearls', id),
    username: shellCryptionBlob('vault_pearls', `${id}:username`),
    url: 'https://reef.example/login',
    type: 'password',
    category: 'Personal',
    notes: '',
    ...overrides,
  };
}

export interface NotePayload {
  id: string;
  title: string;
  content: string; // ShellCryption blob
  category: string;
}

export function makeNotePayload(overrides: Partial<NotePayload> = {}): NotePayload {
  const id = overrides.id ?? uuidv4();
  return {
    id,
    title: `Secure Note ${randomHex(3)}`,
    content: shellCryptionBlob('vault_secure_notes', id),
    category: 'Work',
    ...overrides,
  };
}

export interface SshKeyPayload {
  id: string;
  title: string;
  key_value: string; // ShellCryption blob
  username: string;
  category: string;
}

export function makeSshKeyPayload(overrides: Partial<SshKeyPayload> = {}): SshKeyPayload {
  const id = overrides.id ?? uuidv4();
  return {
    id,
    title: `SSH Key ${randomHex(3)}`,
    key_value: shellCryptionBlob('vault_ssh_keys', id),
    username: 'deploy',
    category: 'Servers',
    ...overrides,
  };
}

export interface AttachmentPayload {
  id: string;
  title: string;
  file_data: string; // base64 ShellCryption blob
  file_name: string;
  mime_type: string;
  category: string;
}

export function makeAttachmentPayload(overrides: Partial<AttachmentPayload> = {}): AttachmentPayload {
  const id = overrides.id ?? uuidv4();
  return {
    id,
    title: `Attachment ${randomHex(3)}`,
    file_data: Buffer.from(shellCryptionBlob('vault_secure_attachments', id), 'utf8').toString('base64'),
    file_name: 'recovery-codes.enc',
    mime_type: 'application/octet-stream',
    category: 'Documents',
    ...overrides,
  };
}

/**
 * Base64 payload of approximately `megabytes` of raw bytes (~4/3 in chars).
 * Used to probe the ~10MB attachment cap without touching the 32mb body limit.
 */
export function oversizedBase64(rawBytes: number): string {
  return Buffer.alloc(rawBytes).toString('base64');
}

// ─── Lobster Keys (agent keys) ───────────────────────────────────────────────

export interface LobsterKeyHandle {
  id: string;
  apiKey: string;
  permissions: Record<string, boolean>;
}

export const PERMISSION_PRESETS = {
  readOnly: { canRead: true, canWrite: false, canEdit: false, canDelete: false },
  writeOnly: { canRead: false, canWrite: true, canEdit: false, canDelete: false },
  editOnly: { canRead: false, canWrite: false, canEdit: true, canDelete: false },
  readWrite: { canRead: true, canWrite: true, canEdit: false, canDelete: false },
  full: { canRead: true, canWrite: true, canEdit: true, canDelete: true },
} as const;

/**
 * POST /api/agent-keys as a human — returns the raw lb- key.
 * The server generates the lb- prefixed key; we never fabricate one.
 */
export async function createLobsterKey(
  app: Express,
  humanToken: string,
  permissions: Partial<Record<string, boolean>> = PERMISSION_PRESETS.readWrite,
  name = 'Harness Lobster'
): Promise<LobsterKeyHandle> {
  const resolved: Record<string, boolean> = { ...PERMISSION_PRESETS.full, ...permissions };

  const res = await request(app)
    .post('/api/agent-keys')
    .set('Authorization', `Bearer ${humanToken}`)
    .send({
      name,
      description: 'created by testFactories',
      permissions: resolved,
    });

  if (res.status !== 201 || res.body?.data?.apiKey === undefined) {
    throw new Error(`lobster key creation failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    id: res.body.data.id,
    apiKey: res.body.data.apiKey,
    permissions: resolved,
  };
}
