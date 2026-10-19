/**
 * src/lib/habitatExport.ts — Habitat Full-Archive Mobility & Streaming ZIP Packaging Engine.
 *
 * Implements Task 49:
 * 1. Bounded Memory Streaming: Async generator yielding file chunks sequentially to
 *    client-zip, maintaining strict O(largest single file) RAM bound.
 * 2. Deterministic Collision-Proof Layout:
 *    attachments/<pod>/<item_title>__[<id_short>]/<file_name>
 * 3. Path Traversal Defense: Strips ../, controls chars, and falls back cleanly.
 * 4. Embedded Manifest: Injects attachment_manifest into shellguard_vault_export.json.
 * 5. ClawKey Challenge Verification helper.
 */

import { downloadZip } from 'client-zip';
import { VaultItem } from '../types.ts';
import { decryptField } from './shellCryption.ts';
import { fetchAttachmentEnvelope, parseAttachmentIds } from './attachmentUtils.ts';
import { sha256 } from './webCryptoFallback.ts';
import { hashToken } from './crypto.ts';
import { restAdapter } from '../services/api/restAdapter.ts';

export interface HabitatAttachmentManifestEntry {
  id: string;
  file_name: string;
  parent_item_id: string;
  parent_type: string;
  size_bytes: number;
  sha256_checksum: string;
  relative_path: string;
}

export interface HabitatVaultExportPayload {
  app: string;
  version: string;
  format: 'shellguard_habitat_archive_v1';
  exportedAt: string;
  ownerUuid?: string;
  itemCount: number;
  items: VaultItem[];
  attachment_manifest: HabitatAttachmentManifestEntry[];
}

export interface AttachmentMetadata {
  id: string;
  file_name: string;
  title?: string;
  parent_id?: string;
  parent_type?: string;
  size_bytes?: number;
  mime_type?: string;
  category?: string;
}

export interface HabitatExportOptions {
  items: VaultItem[];
  shellKey?: CryptoKey | any;
  ownerUuid?: string;
  /** Custom envelope fetcher (for offline tests or mock environments). Defaults to fetchAttachmentEnvelope. */
  fetchAttachmentBlob?: (attachmentId: string) => Promise<string>;
  /** Optional pre-fetched attachment metadata list from GET /api/attachments. */
  attachmentMetadataList?: AttachmentMetadata[];
  /** Optional progress callback. */
  onProgress?: (progress: { current: number; total: number; filename: string }) => void;
}

/**
 * Sanitizes a single path component (folder or filename) to eliminate
 * directory traversal attacks (../), control characters, and illegal symbols.
 */
export function sanitizePathComponent(name: string, fallback: string = 'unknown'): string {
  if (!name || typeof name !== 'string') return fallback;

  // 1. Strip null bytes and ASCII control characters (0-31, 127)
  let clean = name.replace(/[\x00-\x1f\x7f]/g, '');

  // 2. Prevent path traversal: strip ../ and ..\ sequences recursively
  clean = clean.replace(/(\.\.[\/\\])+/g, '').replace(/[\/\\]\.\./g, '');

  // 3. Replace slashes and backslashes with underscores to keep component flat
  clean = clean.replace(/[/\\]+/g, '_');

  // 4. If the result collapses to pure dots or whitespace, fallback
  if (/^\.+$/.test(clean) || clean.trim().length === 0) {
    return fallback;
  }

  // 5. Trim leading/trailing whitespace
  clean = clean.trim();

  return clean.length > 0 ? clean : fallback;
}

/**
 * Builds the canonical deterministic relative path for an attachment inside the ZIP archive:
 * attachments/<pod>/<item_title>__[<id_short>]/<file_name>
 */
export function buildHabitatAttachmentRelativePath(
  pod: string | undefined | null,
  itemTitle: string | undefined | null,
  itemId: string,
  fileName: string
): string {
  const cleanPod = (pod && pod !== 'all') ? sanitizePathComponent(pod, 'Uncategorized') : 'Uncategorized';
  const cleanTitle = sanitizePathComponent(itemTitle || '', 'Untitled').replace(/\s+/g, '_');
  const shortId = (itemId || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8) || '00000000';
  const cleanFileName = sanitizePathComponent(fileName || '', 'attachment');

  return `attachments/${cleanPod}/${cleanTitle}__[${shortId}]/${cleanFileName}`;
}

/**
 * Resolves path collisions if multiple attachments within the same item share an identical file name.
 */
export function deduplicateRelativePath(basePath: string, existingPaths: Set<string>): string {
  if (!existingPaths.has(basePath)) {
    existingPaths.add(basePath);
    return basePath;
  }

  const lastDot = basePath.lastIndexOf('.');
  const lastSlash = basePath.lastIndexOf('/');
  let nameWithoutExt = basePath;
  let ext = '';

  if (lastDot > lastSlash && lastDot !== -1) {
    nameWithoutExt = basePath.slice(0, lastDot);
    ext = basePath.slice(lastDot);
  }

  let counter = 2;
  let candidate = `${nameWithoutExt}_${counter}${ext}`;
  while (existingPaths.has(candidate)) {
    counter++;
    candidate = `${nameWithoutExt}_${counter}${ext}`;
  }
  existingPaths.add(candidate);
  return candidate;
}

/**
 * Computes hexadecimal SHA-256 checksum of binary data.
 */
export function computeSha256Hex(data: Uint8Array): string {
  const hashBytes = sha256(data);
  return Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts a data URL (or raw plaintext) to raw binary bytes and mime type.
 */
export function dataUrlToUint8Array(dataUrl: string): { bytes: Uint8Array; mime: string } {
  if (dataUrl.startsWith('data:')) {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(parts[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return { bytes: u8arr, mime };
  }
  const bytes = new TextEncoder().encode(dataUrl);
  return { bytes, mime: 'text/plain' };
}

/**
 * Verifies ClawKey format and authenticates against the backend before unencrypted export.
 */
export async function verifyClawKeyChallenge(clawKey: string, userUuid: string): Promise<boolean> {
  const trimmed = (clawKey || '').trim();
  if (!trimmed.startsWith('hu-') || trimmed.length !== 67) {
    throw new Error('Invalid ClawKey©™ format (must start with hu- and be 67 characters).');
  }
  const keyHash = await hashToken(trimmed);
  const response = await restAdapter.POST('/api/auth/token', {
    uuid: userUuid,
    keyHash
  });
  return !!response;
}

interface AttachmentWorkItem {
  attId: string;
  parentItemId: string;
  parentType: string;
  pod: string;
  itemTitle: string;
  fileNameHint?: string;
}

/**
 * Collects attachment references across all vault items.
 */
function collectAttachmentWorkItems(
  items: VaultItem[],
  metadataMap: Map<string, AttachmentMetadata>
): AttachmentWorkItem[] {
  const workItems: AttachmentWorkItem[] = [];

  for (const item of items) {
    const attIds = parseAttachmentIds(item.attachments);
    for (const attId of attIds) {
      const meta = metadataMap.get(attId);
      workItems.push({
        attId,
        parentItemId: item.id,
        parentType: item.type || 'password',
        pod: item.category || meta?.category || '',
        itemTitle: item.title || '',
        fileNameHint: meta?.file_name
      });
    }
  }

  return workItems;
}

/**
 * Async generator that sequentially decrypts and streams each archive file into client-zip.
 * Bounded memory: each file buffer is garbage collected after being yielded, ensuring O(largest single file) RAM.
 */
export async function* generateHabitatArchiveStream(
  options: HabitatExportOptions
): AsyncGenerator<{ name: string; input: Uint8Array }> {
  const { items, shellKey, ownerUuid, onProgress } = options;
  const fetchEnvelope = options.fetchAttachmentBlob || fetchAttachmentEnvelope;

  const metadataMap = new Map<string, AttachmentMetadata>();
  if (options.attachmentMetadataList) {
    for (const meta of options.attachmentMetadataList) {
      metadataMap.set(meta.id, meta);
    }
  }

  const workItems = collectAttachmentWorkItems(items, metadataMap);
  const totalAttachments = workItems.length;

  const manifest: HabitatAttachmentManifestEntry[] = [];
  const usedPaths = new Set<string>();

  // Temporary list of decrypted files to stream
  // To keep memory strictly bounded to O(largest single file), we process attachments one-by-one.
  for (let i = 0; i < workItems.length; i++) {
    const item = workItems[i];
    
    // 1. Fetch ciphertext envelope
    const envelope = await fetchEnvelope(item.attId);

    // 2. Decrypt in-memory using active shellKey (or plaintext fallback)
    let plaintextDataUrl = envelope;
    if (shellKey) {
      plaintextDataUrl = await decryptField(envelope, shellKey, 'vault_secure_attachments', item.attId);
      if (plaintextDataUrl === '⚠️ [Decryption Failed]') {
        throw new Error(`Decryption failed for attachment ${item.attId} (${item.fileNameHint || 'unknown'}).`);
      }
    }

    // 3. Convert to binary payload
    const { bytes } = dataUrlToUint8Array(plaintextDataUrl);

    // 4. Resolve filename and deterministic relative path
    const rawFileName = item.fileNameHint || `attachment_${item.attId.slice(0, 8)}`;
    const initialPath = buildHabitatAttachmentRelativePath(item.pod, item.itemTitle, item.parentItemId, rawFileName);
    const finalRelativePath = deduplicateRelativePath(initialPath, usedPaths);

    // 5. Compute checksum and record manifest entry
    const sha256Hex = computeSha256Hex(bytes);
    manifest.push({
      id: item.attId,
      file_name: sanitizePathComponent(rawFileName, 'attachment'),
      parent_item_id: item.parentItemId,
      parent_type: item.parentType,
      size_bytes: bytes.byteLength,
      sha256_checksum: sha256Hex,
      relative_path: finalRelativePath
    });

    onProgress?.({
      current: i + 1,
      total: totalAttachments,
      filename: rawFileName
    });

    // 6. Yield attachment file to client-zip stream
    yield {
      name: finalRelativePath,
      input: bytes
    };
  }

  // 7. Yield the root shellguard_vault_export.json manifest containing all records and attachment references
  const exportPayload: HabitatVaultExportPayload = {
    app: 'ShellGuard Vault Backup',
    version: '1.0',
    format: 'shellguard_habitat_archive_v1',
    exportedAt: new Date().toISOString(),
    ownerUuid,
    itemCount: items.length,
    items,
    attachment_manifest: manifest
  };

  const manifestJsonBytes = new TextEncoder().encode(JSON.stringify(exportPayload, null, 2));
  yield {
    name: 'shellguard_vault_export.json',
    input: manifestJsonBytes
  };
}

/**
 * Initiates the client-side streaming ZIP export using client-zip.
 * Returns a standard Response object from which a Blob or stream can be read.
 */
export function exportHabitatArchive(options: HabitatExportOptions): Response {
  return downloadZip(generateHabitatArchiveStream(options));
}

/**
 * Creates a complete ZIP Blob from the streaming archive.
 */
export async function createHabitatZipBlob(options: HabitatExportOptions): Promise<Blob> {
  const response = exportHabitatArchive(options);
  return await response.blob();
}

/**
 * Browser helper: streams the habitat archive and triggers direct file download.
 */
export async function downloadHabitatArchive(
  options: HabitatExportOptions,
  filename?: string
): Promise<void> {
  const blob = await createHabitatZipBlob(options);
  const targetName = filename || `shellguard_habitat_archive_${new Date().toISOString().slice(0, 10)}.zip`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.setAttribute('href', url);
  anchor.setAttribute('download', targetName);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
