// Row parsers — convert snake_case SQLite rows to camelCase API responses

export function parseAgentKey(row: any) {
  if (!row) return null;
  return {
    ...row,
    permissions: JSON.parse(row.permissions ?? '{}'),
    isActive: Boolean(row.is_active),
    expirationType: row.expiration_type,
    expirationDate: row.expiration_date,
    rateLimit: row.rate_limit,
    createdAt: row.created_at,
    lastUsed: row.last_used,
    apiKey: row.api_key,
    // remove snake_case dupes
    is_active: undefined,
    expiration_type: undefined,
    expiration_date: undefined,
    rate_limit: undefined,
    created_at: undefined,
    last_used: undefined,
    owner_uuid: undefined,
    api_key: undefined,
  };
}
