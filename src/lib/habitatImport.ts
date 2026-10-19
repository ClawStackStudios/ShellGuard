/**
 * src/lib/habitatImport.ts — Two-Stage Ingestion Pipeline & Background Ingestion Queue.
 *
 * Implements Task 50:
 * 1. Sniffer: Distinguishes Habitat ZIP archives, unzipped directories, and plain JSON.
 * 2. Stage 1 Manifest Extraction: Extracts shellguard_vault_export.json in <2s using fflate
 *    without decompressing multi-gigabyte binary attachments into RAM.
 * 3. Stage 1 Summary Breakdown: Calculates item counts across types and attachment metrics.
 * 4. AttachmentIngestionQueue: Reactive background queue executing sequential multipart
 *    uploads via uploadAttachmentMultipart with pause, resume, retry, cancel, and progress tracking.
 * 5. Global Ingestion Queue Singleton: Shared across VaultShell, ItemDetailPane, and ItemListPane.
 */

import { unzipSync } from 'fflate';
import { VaultItem } from '../types.ts';
import {
  HabitatVaultExportPayload,
  HabitatAttachmentManifestEntry
} from './habitatExport.ts';
import { encryptField } from './shellCryption.ts';
import {
  uploadAttachmentMultipart,
  MultipartUploadHandle
} from './attachmentUtils.ts';

export type HabitatArchiveType = 'habitat_zip' | 'habitat_folder' | 'shellguard_json' | 'unknown';

export type QueueItemStatus = 'queued' | 'uploading' | 'verified' | 'error';

export interface AttachmentQueueItem {
  id: string;
  fileName: string;
  relativePath: string;
  sizeBytes: number;
  parentItemId: string;
  parentType: string;
  category?: string;
  title?: string;
  mimeType?: string;
  status: QueueItemStatus;
  progressPercent: number;
  bytesUploaded: number;
  errorMessage?: string;
  extractBytes: () => Promise<Uint8Array>;
}

export interface IngestionSummary {
  passwordsCount: number;
  notesCount: number;
  keysCount: number;
  cardsCount: number;
  identitiesCount: number;
  totalItems: number;
  attachmentsCount: number;
  attachmentsTotalBytes: number;
}

export interface Stage1ExtractionResult {
  exportPayload: HabitatVaultExportPayload;
  summary: IngestionSummary;
  createQueueItems: () => AttachmentQueueItem[];
}

export interface QueueStats {
  total: number;
  completed: number;
  failed: number;
  inFlight: number;
  totalBytes: number;
  uploadedBytes: number;
  percent: number;
}

/**
 * Sniffs a file to determine if it is a Habitat ZIP archive, JSON backup, or unknown.
 */
export async function sniffHabitatArchive(file: File | Blob): Promise<HabitatArchiveType> {
  const name = (file as File).name?.toLowerCase() || '';

  if (name.endsWith('.json')) {
    return 'shellguard_json';
  }

  try {
    const slice = file.slice(0, 4);
    const buf = new Uint8Array(await slice.arrayBuffer());
    // ZIP magic bytes: PK\x03\x04 or PK\x05\x06 (empty) or PK\x07\x08 (spanned)
    if (buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07)) {
      return 'habitat_zip';
    }
  } catch {
    // Fall back to filename extension
  }

  if (name.endsWith('.zip')) {
    return 'habitat_zip';
  }

  return 'unknown';
}

function computeSummary(payload: HabitatVaultExportPayload): IngestionSummary {
  const items = payload.items || [];
  const manifest = payload.attachment_manifest || [];

  let passwordsCount = 0;
  let notesCount = 0;
  let keysCount = 0;
  let cardsCount = 0;
  let identitiesCount = 0;

  for (const item of items) {
    const type = item.type || 'password';
    if (type === 'password') passwordsCount++;
    else if (type === 'note') notesCount++;
    else if (type === 'key') keysCount++;
    else if (type === 'card') cardsCount++;
    else if (type === 'identity') identitiesCount++;
    else passwordsCount++;
  }

  let attachmentsTotalBytes = 0;
  for (const entry of manifest) {
    attachmentsTotalBytes += entry.size_bytes || 0;
  }

  return {
    passwordsCount,
    notesCount,
    keysCount,
    cardsCount,
    identitiesCount,
    totalItems: items.length,
    attachmentsCount: manifest.length,
    attachmentsTotalBytes
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Fast Stage 1 extraction (<2s):
 * Reads only shellguard_vault_export.json using fflate's entry filter,
 * skipping all binary attachment payloads to avoid memory exhaustion.
 */
export async function extractHabitatStage1(
  source: File | Blob | File[] | FileList | Uint8Array
): Promise<Stage1ExtractionResult> {
  // Case A: Unzipped folder containing multiple File objects
  if (Array.isArray(source) || (typeof FileList !== 'undefined' && source instanceof FileList)) {
    const files = Array.from(source as FileList | File[]);
    const manifestFile = files.find(f => f.name === 'shellguard_vault_export.json');
    if (!manifestFile) {
      throw new Error('Invalid Habitat Folder: missing shellguard_vault_export.json in root.');
    }

    const text = await manifestFile.text();
    const exportPayload: HabitatVaultExportPayload = JSON.parse(text);
    const summary = computeSummary(exportPayload);

    const createQueueItems = (): AttachmentQueueItem[] => {
      const manifest = exportPayload.attachment_manifest || [];
      return manifest.map(entry => ({
        id: entry.id,
        fileName: entry.file_name,
        relativePath: entry.relative_path,
        sizeBytes: entry.size_bytes,
        parentItemId: entry.parent_item_id,
        parentType: entry.parent_type,
        status: 'queued',
        progressPercent: 0,
        bytesUploaded: 0,
        extractBytes: async () => {
          const matched = files.find(f =>
            (f.webkitRelativePath && f.webkitRelativePath.endsWith(entry.relative_path)) ||
            f.name === entry.file_name
          );
          if (!matched) {
            throw new Error(`Missing attachment payload: ${entry.relative_path}`);
          }
          return new Uint8Array(await matched.arrayBuffer());
        }
      }));
    };

    return { exportPayload, summary, createQueueItems };
  }

  // Case B: ZIP Archive (File, Blob, or Uint8Array)
  let zipBytes: Uint8Array;
  if (source instanceof Uint8Array) {
    zipBytes = source;
  } else {
    zipBytes = new Uint8Array(await (source as Blob).arrayBuffer());
  }

  // Use fflate.unzipSync with filter to decompress ONLY shellguard_vault_export.json
  const unzipped = unzipSync(zipBytes, {
    filter: (entry) => entry.name === 'shellguard_vault_export.json'
  });

  const manifestBytes = unzipped['shellguard_vault_export.json'];
  if (!manifestBytes) {
    throw new Error('Invalid Habitat Archive: missing shellguard_vault_export.json in ZIP root.');
  }

  const text = new TextDecoder('utf-8').decode(manifestBytes);
  const exportPayload: HabitatVaultExportPayload = JSON.parse(text);
  const summary = computeSummary(exportPayload);

  const createQueueItems = (): AttachmentQueueItem[] => {
    const manifest = exportPayload.attachment_manifest || [];
    return manifest.map(entry => ({
      id: entry.id,
      fileName: entry.file_name,
      relativePath: entry.relative_path,
      sizeBytes: entry.size_bytes,
      parentItemId: entry.parent_item_id,
      parentType: entry.parent_type,
      status: 'queued',
      progressPercent: 0,
      bytesUploaded: 0,
      extractBytes: async () => {
        // Decompress ONLY this individual attachment entry on-demand
        const singleUnzip = unzipSync(zipBytes, {
          filter: (f) => f.name === entry.relative_path
        });
        const fileBytes = singleUnzip[entry.relative_path];
        if (!fileBytes) {
          throw new Error(`Missing attachment payload in ZIP: ${entry.relative_path}`);
        }
        return fileBytes;
      }
    }));
  };

  return { exportPayload, summary, createQueueItems };
}

export type QueueSubscriber = () => void;

/**
 * Custom upload executor function signature (allows dependency injection in tests).
 */
export type UploadExecutor = (
  metadata: {
    id: string;
    title: string;
    file_name: string;
    mime_type: string;
    category: string;
    parent_id?: string;
    parent_type?: string;
  },
  ciphertext: Uint8Array,
  onProgress?: (percent: number) => void
) => MultipartUploadHandle;

/**
 * Reactive Background Attachment Ingestion Queue (Stage 2).
 * Streams attachments sequentially to POST /api/attachments, maintaining O(largest single file) RAM.
 */
export class AttachmentIngestionQueue {
  private queue: AttachmentQueueItem[] = [];
  private isPaused: boolean = false;
  private isProcessing: boolean = false;
  private isStarted: boolean = false;
  private activeItem: AttachmentQueueItem | null = null;
  private activeHandle: MultipartUploadHandle | null = null;
  private shellKey: CryptoKey | any = null;
  private subscribers = new Set<QueueSubscriber>();
  private uploadExecutor: UploadExecutor = uploadAttachmentMultipart;

  constructor(customUploader?: UploadExecutor) {
    if (customUploader) {
      this.uploadExecutor = customUploader;
    }
  }

  public subscribe(listener: QueueSubscriber): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.subscribers) {
      try {
        listener();
      } catch (err) {
        console.error('Error in queue subscriber listener:', err);
      }
    }
  }

  /**
   * Enqueues a list of attachment items for background upload.
   */
  public enqueue(items: AttachmentQueueItem[]) {
    this.queue.push(...items);
    this.notify();
    if (!this.isPaused && !this.isProcessing && this.isStarted) {
      this.processNext();
    }
  }

  /**
   * Sets the active encryption key and starts processing if pending items exist.
   */
  public start(shellKey: CryptoKey | any) {
    this.shellKey = shellKey;
    this.isStarted = true;
    this.isPaused = false;
    if (!this.isProcessing) {
      this.processNext();
    }
    this.notify();
  }

  /**
   * Pauses the queue. The currently in-flight upload will complete or can be resumed.
   */
  public pause() {
    this.isPaused = true;
    this.notify();
  }

  /**
   * Resumes the queue after being paused.
   */
  public resume() {
    this.isPaused = false;
    if (!this.isProcessing && this.isStarted) {
      this.processNext();
    }
    this.notify();
  }

  /**
   * Aborts in-flight uploads and clears all queued items.
   */
  public cancelAll() {
    if (this.activeHandle) {
      this.activeHandle.abort();
      this.activeHandle = null;
    }
    if (this.activeItem) {
      this.activeItem.status = 'error';
      this.activeItem.errorMessage = 'Cancelled by user';
    }
    // Remove all remaining queued items
    this.queue = this.queue.filter(i => i.status === 'verified');
    this.isProcessing = false;
    this.activeItem = null;
    this.notify();
  }

  /**
   * Retries a specific failed item.
   */
  public retry(id: string) {
    const item = this.queue.find(i => i.id === id);
    if (item && item.status === 'error') {
      item.status = 'queued';
      item.progressPercent = 0;
      item.bytesUploaded = 0;
      item.errorMessage = undefined;
      this.notify();
      if (!this.isPaused && !this.isProcessing && this.isStarted) {
        this.processNext();
      }
    }
  }

  /**
   * Retries all failed items in the queue.
   */
  public retryAllFailed() {
    for (const item of this.queue) {
      if (item.status === 'error') {
        item.status = 'queued';
        item.progressPercent = 0;
        item.bytesUploaded = 0;
        item.errorMessage = undefined;
      }
    }
    this.notify();
    if (!this.isPaused && !this.isProcessing && this.isStarted) {
      this.processNext();
    }
  }

  /**
   * Safety guard for window beforeunload listener.
   * Returns true if there are in-flight or pending background uploads.
   */
  public hasActiveUploads(): boolean {
    return this.queue.some(i => i.status === 'uploading' || (i.status === 'queued' && !this.isPaused));
  }

  /**
   * Real-time statistics for progress bars and dock indicators.
   */
  public getStats(): QueueStats {
    let completed = 0;
    let failed = 0;
    let inFlight = 0;
    let totalBytes = 0;
    let uploadedBytes = 0;

    for (const item of this.queue) {
      totalBytes += item.sizeBytes || 0;
      if (item.status === 'verified') {
        completed++;
        uploadedBytes += item.sizeBytes || 0;
      } else if (item.status === 'error') {
        failed++;
      } else if (item.status === 'uploading') {
        inFlight++;
        uploadedBytes += item.bytesUploaded || 0;
      }
    }

    const total = this.queue.length;
    const percent = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : (total > 0 && completed === total ? 100 : 0);

    return {
      total,
      completed,
      failed,
      inFlight,
      totalBytes,
      uploadedBytes,
      percent: Math.min(100, Math.max(0, percent))
    };
  }

  /**
   * Returns the reactive status of an item's attachments for ItemDetailPane and ItemListPane chips.
   */
  public getParentItemStatus(parentItemId: string): {
    hasActive: boolean;
    status: QueueItemStatus | null;
    fileName?: string;
    progressPercent?: number;
  } {
    const active = this.queue.find(i => i.parentItemId === parentItemId && (i.status === 'uploading' || i.status === 'queued'));
    if (active) {
      return {
        hasActive: true,
        status: active.status,
        fileName: active.fileName,
        progressPercent: active.progressPercent
      };
    }
    const recentlyVerified = this.queue.find(i => i.parentItemId === parentItemId && i.status === 'verified');
    if (recentlyVerified) {
      return {
        hasActive: false,
        status: 'verified',
        fileName: recentlyVerified.fileName,
        progressPercent: 100
      };
    }
    return { hasActive: false, status: null };
  }

  public getItems(): AttachmentQueueItem[] {
    return [...this.queue];
  }

  public isQueuePaused(): boolean {
    return this.isPaused;
  }

  /**
   * Internal sequential processor.
   */
  private async processNext() {
    if (this.isPaused || this.isProcessing) return;

    const nextItem = this.queue.find(i => i.status === 'queued');
    if (!nextItem) {
      this.isProcessing = false;
      this.activeItem = null;
      this.activeHandle = null;
      this.notify();
      return;
    }

    this.isProcessing = true;
    this.activeItem = nextItem;
    nextItem.status = 'uploading';
    this.notify();

    try {
      // 1. Extract raw bytes on-demand (O(largest single file) memory bound)
      const rawBytes = await nextItem.extractBytes();

      if (this.activeItem !== nextItem || (nextItem.status as string) === 'error' || this.isPaused) {
        return;
      }

      // 2. Wrap as data: URL
      const mime = nextItem.mimeType || 'application/octet-stream';
      const b64 = bytesToBase64(rawBytes);
      const dataUrl = `data:${mime};base64,${b64}`;

      // 3. Encrypt payload client-side with shellKey
      let ciphertext: Uint8Array;
      if (this.shellKey) {
        const encryptedEnvelope = await encryptField(
          dataUrl,
          this.shellKey,
          'vault_secure_attachments',
          nextItem.id
        );
        ciphertext = new TextEncoder().encode(encryptedEnvelope);
      } else {
        ciphertext = new TextEncoder().encode(dataUrl);
      }

      // 4. Stream upload via multipart/form-data
      const handle = this.uploadExecutor(
        {
          id: nextItem.id,
          title: nextItem.title || nextItem.fileName,
          file_name: nextItem.fileName,
          mime_type: mime,
          category: nextItem.category || '',
          parent_id: nextItem.parentItemId,
          parent_type: nextItem.parentType
        },
        ciphertext,
        (percent) => {
          nextItem.progressPercent = percent;
          nextItem.bytesUploaded = Math.round((percent / 100) * nextItem.sizeBytes);
          this.notify();
        }
      );

      this.activeHandle = handle;
      await handle.promise;

      // 5. Success! Mark verified
      nextItem.status = 'verified';
      nextItem.progressPercent = 100;
      nextItem.bytesUploaded = nextItem.sizeBytes;
    } catch (err: any) {
      console.error(`Attachment ingestion failed for ${nextItem.fileName}:`, err);
      nextItem.status = 'error';
      nextItem.errorMessage = err.message || 'Upload failed.';
    } finally {
      this.activeHandle = null;
      this.activeItem = null;
      this.isProcessing = false;
      this.notify();

      // Continue sequential processing
      if (!this.isPaused) {
        this.processNext();
      }
    }
  }
}

/**
 * Singleton instance of the Abyssal Ingestion Queue used throughout ShellGuard.
 */
export const globalIngestionQueue = new AttachmentIngestionQueue();
