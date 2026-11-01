/**
 * storageConfig.ts — ShellGuard©™
 *
 * Storage Quota Ceilings & Bounds Enforcement.
 * Clamps per-file ciphertext attachment ceiling and per-owner grotto quotas.
 */

/** Validates and clamps ATTACHMENT_MAX_MB between 1MB and 2000MB (default 500MB). */
export function getSafeAttachmentMaxMb(raw?: string): number {
  const parsed = parseInt(raw ?? '500', 10);
  if (isNaN(parsed) || parsed < 1) return 500;
  if (parsed > 2000) return 2000;
  return parsed;
}

/** Validates and clamps GROTTO_QUOTA_MB between 1MB and 100000MB (default 1000MB). */
export function getSafeGrottoQuotaMb(raw?: string): number {
  const parsed = parseInt(raw ?? '1000', 10);
  if (isNaN(parsed) || parsed < 1) return 1000;
  if (parsed > 100000) return 100000;
  return parsed;
}
