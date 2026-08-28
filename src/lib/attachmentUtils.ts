/**
 * Shared client-side helpers for password attachments.
 *
 * Reference model: each uploaded file lives in its own vault_secure_attachments
 * row (ShellCrypted file_data + per-row encrypted metadata). The owning
 * vault_pearls row stores only a JSON array of attachment IDs — no sensitive
 * data — in its attachments column.
 */

/** Hard per-file limit: 10MB raw. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** A file picked in the UI, staged locally until the form is submitted. */
export interface PendingAttachment {
  id: string;
  file_name: string;
  mime_type: string;
  size: number;
  /** data: URL (base64) — ShellCrypted by App.tsx before upload. */
  dataUrl: string;
}

/** Safely parse the attachments JSON column into a list of attachment IDs. */
export function parseAttachmentIds(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
  } catch {
    // legacy plaintext reference — treat as empty
  }
  return [];
}

/** Human-readable byte size, e.g. "1.4 MB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Trigger a browser download from a decrypted data URL.
 * Mirrors the existing downloadIdentityFile anchor pattern.
 */
export function downloadAttachment(dataUrl: string, fileName: string) {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', dataUrl);
  anchor.setAttribute('download', fileName || 'attachment');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
