import { z } from 'zod';

export const AuthSchemas = {
  register: z.object({
    uuid: z.string().uuid(),
    username: z.string().min(3).max(32),
    // Optional ShellGuard display name (never used as an auth factor)
    displayName: z.string().max(48).optional(),
    keyHash: z.string().length(64),
  }),
  token: z.object({
    type: z.enum(['human', 'agent']).optional(),
    uuid: z.string().uuid().optional(),
    keyHash: z.string().length(64).optional(),
    ownerKey: z.string().optional(),
  }),
  profile: z.object({
    displayName: z.string().transform(s => s.trim()).pipe(z.string().min(1).max(48)),
  }),
};

// ─── Shared field constraints ────────────────────────────────────────────────
// Zero-knowledge invariant: opaque vault payloads (secret / content /
// key_value / file_data / totp_secret) are validated by LENGTH AND TYPE ONLY.
// The server never inspects, parses, or transforms their contents.

const itemId = z.string().min(1).max(64);
const itemCategory = z.string().max(64).optional();
const itemTitle = z.string().min(1).max(255);

export const VaultSchemas = {
  create: z.object({
    id: itemId,
    title: itemTitle,
    secret: z.string().min(1).max(20000), // opaque
    username: z.string().max(255).optional(),
    url: z.string().max(2048).optional(),
    type: z.string().max(32).optional(),
    category: itemCategory,
    notes: z.string().max(10000).optional(),
    totp_secret: z.string().max(5000).optional(), // opaque
    attachments: z.string().max(2000000).optional(), // opaque JSON string
    custom_fields: z.string().max(500000).optional(), // opaque: ShellCrypted CustomField[] JSON
  }),
  update: z.object({
    title: itemTitle,
    secret: z.string().min(1).max(20000), // opaque
    username: z.string().max(255).optional(),
    url: z.string().max(2048).optional(),
    type: z.string().max(32).optional(),
    category: itemCategory,
    notes: z.string().max(10000).optional(),
    totp_secret: z.string().max(5000).optional(), // opaque
    attachments: z.string().max(2000000).optional(), // opaque JSON string
    custom_fields: z.string().max(500000).optional(), // opaque: ShellCrypted CustomField[] JSON
  }),
};

export const NoteSchemas = {
  create: z.object({
    id: itemId,
    title: itemTitle,
    content: z.string().min(1).max(10000), // opaque
    category: itemCategory,
    custom_fields: z.string().max(500000).optional(), // opaque
  }),
  update: z.object({
    title: itemTitle,
    content: z.string().min(1).max(10000), // opaque
    category: itemCategory,
    custom_fields: z.string().max(500000).optional(), // opaque
  }),
};

export const SshKeySchemas = {
  create: z.object({
    id: itemId,
    title: itemTitle,
    key_value: z.string().min(1).max(20000), // opaque
    username: z.string().max(255).optional(),
    category: itemCategory,
    custom_fields: z.string().max(500000).optional(), // opaque
  }),
  update: z.object({
    title: itemTitle,
    key_value: z.string().min(1).max(20000), // opaque
    username: z.string().max(255).optional(),
    category: itemCategory,
    custom_fields: z.string().max(500000).optional(), // opaque
  }),
};

export const AttachmentSchemas = {
  // file_data = base64 payload wrapped in a ShellCryption envelope.
  // Hard limit: 10MB raw file → ~13.3MB base64 + envelope overhead ≈ 14M chars.
  // Capped well under the scoped 32mb body limit.
  create: z.object({
    id: itemId,
    title: itemTitle,
    file_data: z.string().min(1).max(14000000), // opaque
    file_name: z.string().max(512).optional(),
    mime_type: z.string().max(255).optional(),
    category: itemCategory,
  }),
  update: z.object({
    title: itemTitle,
    file_data: z.string().min(1).max(14000000), // opaque
    file_name: z.string().max(512).optional(),
    mime_type: z.string().max(255).optional(),
    category: itemCategory,
  }),
};

export const AdminSchemas = {
  auth: z.object({
    token: z.string().min(1).max(512),
  }),
  settings: z.object({
    audit_retention_days: z.number().int().min(1).max(365).optional(),
    uptime_retention_days: z.number().int().min(1).max(365).optional(),
    backup_enabled: z.boolean().optional(),
    backup_interval_minutes: z.number().int().min(15).max(1440).optional(),
    backup_retention_count: z.number().int().min(1).max(100).optional(),
  }),
  deleteUser: z.object({
    expect: z.string().min(1).max(255), // must match target username OR uuid server-side
  }),
};

export const AgentKeySchemas = {
  create: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    apiKey: z.string().optional(),
    permissions: z.object({
      canRead: z.boolean().optional(),
      canWrite: z.boolean().optional(),
      canEdit: z.boolean().optional(),
      canMove: z.boolean().optional(),
      canDelete: z.boolean().optional(),
      level: z.string().optional(),
    }).optional(),
    expirationType: z.enum(['never', '30d', '60d', '90d', '30days', '90days', '1year', 'custom']).optional(),
    expirationDate: z.string().datetime().optional().nullable(),
    rateLimit: z.number().int().min(1).max(10000).optional().nullable(),
  }),
};
