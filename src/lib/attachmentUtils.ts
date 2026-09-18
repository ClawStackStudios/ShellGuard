/**
 * Shared client-side helpers for password attachments.
 *
 * Reference model: each uploaded file lives in its own vault_secure_attachments
 * row (ShellCrypted ciphertext stored as a native BLOB + per-row encrypted
 * metadata). The owning vault_pearls row stores only a JSON array of
 * attachment IDs — no sensitive data — in its attachments column.
 *
 * Phase 19 wire contract: uploads are multipart/form-data; the ShellCryption
 * envelope string is encoded utf8 and streamed as the binary part (no base64
 * inflation). Downloads stream the BLOB from GET /:id/file; the client
 * decrypts the envelope locally. The server never sees plaintext.
 */

import { getApiBaseUrl } from '../config/apiConfig.ts';
import { SESSION_KEYS } from '../services/api/restAdapter.ts';

/** Hard per-file limit: 50MB raw (Phase 19 — matches server ATTACHMENT_MAX_MB default). */
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

/** Per-owner grotto quota mirror for client-side hints (server is authoritative). */
export const GROTTO_QUOTA_BYTES = 500 * 1024 * 1024;

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
 * Converts data URLs to Blobs to prevent browser insecure connection blocks.
 */
export function downloadAttachment(dataUrl: string, fileName: string) {
  try {
    let url = dataUrl;
    let isBlobCreated = false;

    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      url = URL.createObjectURL(blob);
      isBlobCreated = true;
    }

    const anchor = document.createElement('a');
    anchor.setAttribute('href', url);
    anchor.setAttribute('download', fileName || 'attachment');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    if (isBlobCreated) {
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  } catch {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataUrl);
    anchor.setAttribute('download', fileName || 'attachment');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}

/** Convert a data: URL to a Blob (for object-URL previews on HTTP LAN origins). */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    if (!dataUrl.startsWith('data:')) return null;
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

export interface MultipartUploadHandle {
  promise: Promise<void>;
  /** Aborts the in-flight upload (resolves the promise silently). */
  abort: () => void;
}

/**
 * Phase 19 streamed upload: POSTs an attachment via multipart/form-data,
 * reporting byte-level upload progress (XHR upload.onprogress) and supporting
 * cancellation. `ciphertext` is the ALREADY-ShellCrypted envelope encoded as
 * utf8 bytes — the server stores it verbatim (zero-knowledge).
 */
export function uploadAttachmentMultipart(metadata: {
  id: string;
  title: string;
  file_name: string;
  mime_type: string;
  category: string;
}, ciphertext: Uint8Array, onProgress?: (percent: number) => void): MultipartUploadHandle {
  const token = sessionStorage.getItem(SESSION_KEYS.TOKEN);
  const form = new FormData();
  form.append('id', metadata.id);
  form.append('title', metadata.title);
  form.append('file_name', metadata.file_name);
  form.append('mime_type', metadata.mime_type);
  form.append('category', metadata.category);
  form.append('file_data', new Blob([ciphertext as BlobPart], { type: 'application/octet-stream' }), metadata.file_name || 'attachment');

  const xhr = new XMLHttpRequest();
  let settled = false;

  const promise = new Promise<void>((resolve, reject) => {
    xhr.open('POST', `${getApiBaseUrl()}/api/attachments`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      settled = true;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        let message = 'Attachment upload failed.';
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.error) message = body.error;
        } catch { /* non-JSON error body */ }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => { settled = true; reject(new Error('Network error during attachment upload.')); };
    xhr.onabort = () => { settled = true; resolve(); };

    xhr.send(form);
  });

  return {
    promise,
    abort: () => {
      if (!settled && xhr.readyState !== XMLHttpRequest.DONE) xhr.abort();
    },
  };
}

/**
 * Streams the attachment ciphertext BLOB from GET /api/attachments/:id/file
 * and returns the envelope string (the client decrypts it with the active
 * shellKey — the server cannot).
 */
export async function fetchAttachmentEnvelope(attId: string): Promise<string> {
  const token = sessionStorage.getItem(SESSION_KEYS.TOKEN);
  const response = await fetch(`${getApiBaseUrl()}/api/attachments/${attId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Attachment fetch failed (${response.status}).`);
  }
  const buffer = await response.arrayBuffer();
  return new TextDecoder('utf8', { fatal: false }).decode(buffer);
}
