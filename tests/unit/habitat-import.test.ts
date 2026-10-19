import { describe, it, expect, vi } from 'vitest';
import {
  sniffHabitatArchive,
  extractHabitatStage1,
  AttachmentIngestionQueue,
  AttachmentQueueItem
} from '../../src/lib/habitatImport.ts';
import { exportHabitatArchive, HabitatExportOptions } from '../../src/lib/habitatExport.ts';
import { VaultItem } from '../../src/types.ts';

describe('Habitat Ingestion Pipeline & Queue (Task 50)', () => {
  describe('Archive Sniffing (sniffHabitatArchive)', () => {
    it('identifies ZIP files via magic bytes (PK\\x03\\x04)', async () => {
      // Standard ZIP header: 0x50, 0x4B, 0x03, 0x04
      const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      const blob = new Blob([zipHeader], { type: 'application/octet-stream' });
      const sniffed = await sniffHabitatArchive(blob);
      expect(sniffed).toBe('habitat_zip');
    });

    it('identifies ZIP files via filename extension', async () => {
      const file = new File(['dummy'], 'backup.zip', { type: 'application/zip' });
      const sniffed = await sniffHabitatArchive(file);
      expect(sniffed).toBe('habitat_zip');
    });

    it('identifies plain JSON files via extension', async () => {
      const file = new File(['{}'], 'vault_export.json', { type: 'application/json' });
      const sniffed = await sniffHabitatArchive(file);
      expect(sniffed).toBe('shellguard_json');
    });

    it('identifies unknown files cleanly', async () => {
      const file = new File(['arbitrary text'], 'notes.txt', { type: 'text/plain' });
      const sniffed = await sniffHabitatArchive(file);
      expect(sniffed).toBe('unknown');
    });
  });

  describe('Stage 1 Instant Manifest Extraction (extractHabitatStage1)', () => {
    it('extracts root manifest in <2s and computes accurate category summary', async () => {
      const mockItems: VaultItem[] = [
        { id: 'p1', title: 'DB Password', type: 'password', category: 'Infra', secret: 'abc', attachments: '["a1"]', created_at: 1, updated_at: 1 },
        { id: 'p2', title: 'API Password', type: 'password', category: 'Infra', secret: 'def', attachments: '[]', created_at: 1, updated_at: 1 },
        { id: 'n1', title: 'Secret Note', type: 'note', category: 'Notes', secret: 'note text', attachments: '[]', created_at: 1, updated_at: 1 },
        { id: 'k1', title: 'Bastion Key', type: 'key', category: 'Keys', secret: 'ssh-rsa', attachments: '[]', created_at: 1, updated_at: 1 },
        { id: 'c1', title: 'Debit Card', type: 'card', category: 'Finance', secret: '1234', attachments: '[]', created_at: 1, updated_at: 1 }
      ];

      const exportOptions: HabitatExportOptions = {
        items: mockItems,
        ownerUuid: 'user-999',
        attachmentMetadataList: [
          { id: 'a1', file_name: 'db.cert', parent_id: 'p1', parent_type: 'password' }
        ],
        fetchAttachmentBlob: async () => 'data:text/plain;base64,VEVTVF9DRVJU' // "TEST_CERT"
      };

      const zipResponse = exportHabitatArchive(exportOptions);
      const zipBytes = new Uint8Array(await zipResponse.arrayBuffer());

      const startTime = performance.now();
      const stage1 = await extractHabitatStage1(zipBytes);
      const elapsedMs = performance.now() - startTime;

      // Acceptance criterion 1: Sub-2-second extraction
      expect(elapsedMs).toBeLessThan(2000);

      // Verify breakdown counts
      expect(stage1.summary.passwordsCount).toBe(2);
      expect(stage1.summary.notesCount).toBe(1);
      expect(stage1.summary.keysCount).toBe(1);
      expect(stage1.summary.cardsCount).toBe(1);
      expect(stage1.summary.totalItems).toBe(5);
      expect(stage1.summary.attachmentsCount).toBe(1);
      expect(stage1.summary.attachmentsTotalBytes).toBe(9); // "TEST_CERT" is 9 bytes

      // Verify lazy extraction closure
      const queueItems = stage1.createQueueItems();
      expect(queueItems.length).toBe(1);
      expect(queueItems[0].id).toBe('a1');
      expect(queueItems[0].fileName).toBe('db.cert');

      // Execute on-demand extraction
      const extractedBytes = await queueItems[0].extractBytes();
      expect(new TextDecoder().decode(extractedBytes)).toBe('TEST_CERT');
    });

    it('throws descriptive error if shellguard_vault_export.json is absent', async () => {
      // Empty ZIP archive bytes
      const emptyZip = new Uint8Array([
        0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);

      await expect(extractHabitatStage1(emptyZip)).rejects.toThrow(
        /missing shellguard_vault_export\.json/
      );
    });
  });

  describe('AttachmentIngestionQueue Reactive State Container', () => {
    it('executes sequential uploads and updates progress reactively', async () => {
      const mockUploader = vi.fn((metadata, ciphertext, onProgress) => {
        onProgress?.(50);
        onProgress?.(100);
        return {
          promise: Promise.resolve(),
          abort: vi.fn()
        };
      });

      const queue = new AttachmentIngestionQueue(mockUploader);

      const item1: AttachmentQueueItem = {
        id: 'att-1',
        fileName: 'doc1.pdf',
        relativePath: 'attachments/doc1.pdf',
        sizeBytes: 1000,
        parentItemId: 'item-parent-1',
        parentType: 'password',
        status: 'queued',
        progressPercent: 0,
        bytesUploaded: 0,
        extractBytes: async () => new Uint8Array([1, 2, 3])
      };

      const item2: AttachmentQueueItem = {
        id: 'att-2',
        fileName: 'doc2.pdf',
        relativePath: 'attachments/doc2.pdf',
        sizeBytes: 2000,
        parentItemId: 'item-parent-2',
        parentType: 'password',
        status: 'queued',
        progressPercent: 0,
        bytesUploaded: 0,
        extractBytes: async () => new Uint8Array([4, 5, 6])
      };

      const listener = vi.fn();
      queue.subscribe(listener);

      queue.enqueue([item1, item2]);
      queue.start(null); // start without encryption key for mock test

      // Wait a tick for async execution
      await new Promise(r => setTimeout(r, 20));

      expect(mockUploader).toHaveBeenCalledTimes(2);
      expect(item1.status).toBe('verified');
      expect(item2.status).toBe('verified');

      const stats = queue.getStats();
      expect(stats.completed).toBe(2);
      expect(stats.total).toBe(2);
      expect(stats.percent).toBe(100);
      expect(queue.hasActiveUploads()).toBe(false);
    });

    it('pauses and resumes queue cleanly', async () => {
      let resolveUpload: () => void = () => {};
      const mockUploader = vi.fn(() => {
        const promise = new Promise<void>((resolve) => {
          resolveUpload = resolve;
        });
        return { promise, abort: vi.fn() };
      });

      const queue = new AttachmentIngestionQueue(mockUploader);

      const item1: AttachmentQueueItem = {
        id: 'att-p1',
        fileName: 'f1.txt',
        relativePath: 'attachments/f1.txt',
        sizeBytes: 100,
        parentItemId: 'p1',
        parentType: 'password',
        status: 'queued',
        progressPercent: 0,
        bytesUploaded: 0,
        extractBytes: async () => new Uint8Array([1])
      };

      const item2: AttachmentQueueItem = {
        id: 'att-p2',
        fileName: 'f2.txt',
        relativePath: 'attachments/f2.txt',
        sizeBytes: 100,
        parentItemId: 'p2',
        parentType: 'password',
        status: 'queued',
        progressPercent: 0,
        bytesUploaded: 0,
        extractBytes: async () => new Uint8Array([2])
      };

      queue.enqueue([item1, item2]);
      queue.start(null);

      // In flight
      expect(queue.hasActiveUploads()).toBe(true);
      expect(item1.status).toBe('uploading');

      // Pause while first is in-flight
      queue.pause();
      expect(queue.isQueuePaused()).toBe(true);

      // Complete first upload
      resolveUpload();
      await new Promise(r => setTimeout(r, 10));

      expect(item1.status).toBe('verified');
      // Second item should remain queued because queue is paused
      expect(item2.status).toBe('queued');

      // Resume
      queue.resume();
      expect(item2.status).toBe('uploading');
    });

    it('cancels all active and pending uploads on user request', async () => {
      const abortFn = vi.fn();
      const mockUploader = vi.fn(() => ({
        promise: new Promise<void>(() => {}), // stays pending
        abort: abortFn
      }));

      const queue = new AttachmentIngestionQueue(mockUploader);
      const item: AttachmentQueueItem = {
        id: 'cancel-att',
        fileName: 'abort.bin',
        relativePath: 'attachments/abort.bin',
        sizeBytes: 500,
        parentItemId: 'p',
        parentType: 'password',
        status: 'queued',
        progressPercent: 0,
        bytesUploaded: 0,
        extractBytes: async () => new Uint8Array([1])
      };

      queue.enqueue([item]);
      queue.start(null);

      expect(item.status).toBe('uploading');
      queue.cancelAll();

      expect(abortFn).toHaveBeenCalled();
      expect(queue.hasActiveUploads()).toBe(false);
    });

    it('tracks item status for reactive chips via getParentItemStatus', async () => {
      const queue = new AttachmentIngestionQueue();
      const item: AttachmentQueueItem = {
        id: 'chip-att',
        fileName: 'contract.pdf',
        relativePath: 'attachments/contract.pdf',
        sizeBytes: 1024,
        parentItemId: 'parent-item-xyz',
        parentType: 'password',
        status: 'uploading',
        progressPercent: 45,
        bytesUploaded: 460,
        extractBytes: async () => new Uint8Array([1])
      };

      queue.enqueue([item]);

      const status = queue.getParentItemStatus('parent-item-xyz');
      expect(status.hasActive).toBe(true);
      expect(status.status).toBe('uploading');
      expect(status.progressPercent).toBe(45);
      expect(status.fileName).toBe('contract.pdf');
    });
  });
});
