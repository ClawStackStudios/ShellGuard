// Row parsers — convert snake_case SQLite rows to camelCase API responses

export function parseAgentKey(row: any) {
  if (!row) return null;
  // Phase 17 (Key Ledger): explicit allow-list projection — key material and
  // hash columns are structurally absent from every API response. The mint
  // route attaches the plaintext apiKey to the ONE-TIME mint response only.
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    keyFingerprint: row.key_fingerprint ?? null,
    permissions: JSON.parse(row.permissions ?? '{}'),
    isActive: Boolean(row.is_active),
    expirationType: row.expiration_type,
    expirationDate: row.expiration_date,
    rateLimit: row.rate_limit,
    createdAt: row.created_at,
    lastUsed: row.last_used,
  };
}
