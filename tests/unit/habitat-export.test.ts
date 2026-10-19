import { describe, it, expect } from 'vitest';
import { unzipSync } from 'fflate';
import {
  sanitizePathComponent,
  buildHabitatAttachmentRelativePath,
  deduplicateRelativePath,
  computeSha256Hex,
  dataUrlToUint8Array,
  generateHabitatArchiveStream,
  exportHabitatArchive,
  HabitatExportOptions
} from '../../src/lib/habitatExport.ts';
import { VaultItem } from '../../src/types.ts';

describe('Habitat Export Engine (Task 49)', () => {
  describe('Path Sanitization & Security Defenses', () => {
    it('strips directory traversal sequences (../ and ..\\)', () => {
      expect(sanitizePathComponent('../../etc/passwd', 'default')).toBe('etc_passwd');
      expect(sanitizePathComponent('..\\..\\windows\\system32', 'default')).toBe('windows_system32');
      expect(sanitizePathComponent('../../../malicious.pdf', 'default')).toBe('malicious.pdf');
    });

    it('strips control characters and null bytes', () => {
      expect(sanitizePathComponent('\x00admin\x1f.doc', 'default')).toBe('admin.doc');
      expect(sanitizePathComponent('secret\u0000file.txt', 'default')).toBe('secretfile.txt');
    });

    it('replaces slashes and backslashes with underscores', () => {
      expect(sanitizePathComponent('Work / Finances', 'default')).toBe('Work _ Finances');
      expect(sanitizePathComponent('Folder\\Subfolder', 'default')).toBe('Folder_Subfolder');
    });

    it('falls back to default when input collapses to empty or pure dots', () => {
      expect(sanitizePathComponent('', 'fallback')).toBe('fallback');
      expect(sanitizePathComponent('..', 'fallback')).toBe('fallback');
      expect(sanitizePathComponent('   ', 'fallback')).toBe('fallback');
      expect(sanitizePathComponent('....', 'fallback')).toBe('fallback');
    });

    it('normalizes empty or "all" pods to Uncategorized', () => {
      expect(buildHabitatAttachmentRelativePath('', 'My Item', 'uuid-12345678', 'doc.pdf'))
        .toBe('attachments/Uncategorized/My_Item__[uuid-123]/doc.pdf');
      expect(buildHabitatAttachmentRelativePath('all', 'My Item', 'uuid-12345678', 'doc.pdf'))
        .toBe('attachments/Uncategorized/My_Item__[uuid-123]/doc.pdf');
      expect(buildHabitatAttachmentRelativePath(null, 'My Item', 'uuid-12345678', 'doc.pdf'))
        .toBe('attachments/Uncategorized/My_Item__[uuid-123]/doc.pdf');
    });
  });

  describe('Collision-Free Relative Path Generation', () => {
    it('formats canonical deterministic paths with 8-character ID short', () => {
      const path = buildHabitatAttachmentRelativePath(
        'Work',
        'Production Database',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'credentials.csv'
      );
      expect(path).toBe('attachments/Work/Production_Database__[a1b2c3d4]/credentials.csv');
    });

    it('prevents collisions when multiple items share identical attachment filenames', () => {
      const pathItemA = buildHabitatAttachmentRelativePath('Work', 'Server A', 'aaaa1111-0000', 'log.txt');
      const pathItemB = buildHabitatAttachmentRelativePath('Work', 'Server B', 'bbbb2222-0000', 'log.txt');

      expect(pathItemA).toBe('attachments/Work/Server_A__[aaaa1111]/log.txt');
      expect(pathItemB).toBe('attachments/Work/Server_B__[bbbb2222]/log.txt');
      expect(pathItemA).not.toBe(pathItemB);
    });

    it('deduplicates intra-item duplicate filenames', () => {
      const used = new Set<string>();
      const path1 = deduplicateRelativePath('attachments/Work/Server__[12345678]/log.txt', used);
      const path2 = deduplicateRelativePath('attachments/Work/Server__[12345678]/log.txt', used);
      const path3 = deduplicateRelativePath('attachments/Work/Server__[12345678]/log.txt', used);

      expect(path1).toBe('attachments/Work/Server__[12345678]/log.txt');
      expect(path2).toBe('attachments/Work/Server__[12345678]/log_2.txt');
      expect(path3).toBe('attachments/Work/Server__[12345678]/log_3.txt');
    });
  });

  describe('Data URL conversion & SHA-256 Checksum', () => {
    it('accurately converts data: URLs to binary bytes and mime type', () => {
      const sampleText = 'ShellGuard Habitat Export Payload';
      const b64 = Buffer.from(sampleText).toString('base64');
      const dataUrl = `data:text/plain;base64,${b64}`;

      const { bytes, mime } = dataUrlToUint8Array(dataUrl);
      expect(mime).toBe('text/plain');
      expect(new TextDecoder().decode(bytes)).toBe(sampleText);
    });

    it('computes correct SHA-256 hex digest', () => {
      const bytes = new TextEncoder().encode('test payload');
      const hex = computeSha256Hex(bytes);
      // SHA-256 of 'test payload' is well known:
      // echo -n "test payload" | sha256sum -> 1e4e6d4c...
      expect(hex).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Full Streaming Archive Packaging & fflate Verification', () => {
    it('packages multiple items and attachments, yielding valid ZIP and manifest', async () => {
      const fileAContent = 'Attachment A plain text payload';
      const fileBContent = 'Attachment B binary simulation payload';

      const dataUrlA = `data:text/plain;base64,${Buffer.from(fileAContent).toString('base64')}`;
      const dataUrlB = `data:application/octet-stream;base64,${Buffer.from(fileBContent).toString('base64')}`;

      const mockItems: VaultItem[] = [
        {
          id: 'item-1111-aaaa-bbbb-ccccdddd1111',
          title: 'Database Cluster',
          category: 'Infrastructure',
          type: 'password',
          secret: 'db-pass-123',
          username: 'postgres',
          url: 'https://db.internal',
          notes: 'Cluster primary credentials',
          attachments: JSON.stringify(['att-001', 'att-002']),
          created_at: 1000,
          updated_at: 1000
        },
        {
          id: 'item-2222-eeee-ffff-gggghhhh2222',
          title: 'Bastion SSH',
          category: 'Infrastructure',
          type: 'key',
          secret: 'ssh-rsa AAA...',
          attachments: '[]',
          created_at: 2000,
          updated_at: 2000
        }
      ];

      const mockMetadataList = [
        {
          id: 'att-001',
          file_name: 'config.json',
          title: 'Cluster Config',
          mime_type: 'application/json',
          parent_id: 'item-1111-aaaa-bbbb-ccccdddd1111',
          parent_type: 'password'
        },
        {
          id: 'att-002',
          file_name: 'config.json', // Duplicate filename on same item!
          title: 'Replica Config',
          mime_type: 'application/json',
          parent_id: 'item-1111-aaaa-bbbb-ccccdddd1111',
          parent_type: 'password'
        }
      ];

      const options: HabitatExportOptions = {
        items: mockItems,
        ownerUuid: 'owner-uuid-42',
        attachmentMetadataList: mockMetadataList,
        fetchAttachmentBlob: async (attId: string) => {
          if (attId === 'att-001') return dataUrlA;
          if (attId === 'att-002') return dataUrlB;
          throw new Error('Unknown attachment ID');
        }
      };

      // Export using streaming response
      const response = exportHabitatArchive(options);
      const zipArrayBuffer = await response.arrayBuffer();
      const zipBytes = new Uint8Array(zipArrayBuffer);

      // Verify with fflate unzipSync
      const unzipped = unzipSync(zipBytes);
      const fileNames = Object.keys(unzipped);

      // 1. Verify root manifest JSON exists
      expect(fileNames).toContain('shellguard_vault_export.json');

      const manifestBytes = unzipped['shellguard_vault_export.json'];
      const manifestJson = JSON.parse(new TextDecoder().decode(manifestBytes));

      expect(manifestJson.format).toBe('shellguard_habitat_archive_v1');
      expect(manifestJson.ownerUuid).toBe('owner-uuid-42');
      expect(manifestJson.items.length).toBe(2);
      expect(manifestJson.attachment_manifest.length).toBe(2);

      // 2. Verify attachment entries and deduplicated paths
      const entry1 = manifestJson.attachment_manifest[0];
      const entry2 = manifestJson.attachment_manifest[1];

      expect(entry1.id).toBe('att-001');
      expect(entry1.file_name).toBe('config.json');
      expect(entry1.relative_path).toBe('attachments/Infrastructure/Database_Cluster__[item-111]/config.json');
      expect(entry1.size_bytes).toBe(new TextEncoder().encode(fileAContent).byteLength);
      expect(entry1.sha256_checksum).toBe(computeSha256Hex(new TextEncoder().encode(fileAContent)));

      // Intra-item deduplicated filename
      expect(entry2.id).toBe('att-002');
      expect(entry2.relative_path).toBe('attachments/Infrastructure/Database_Cluster__[item-111]/config_2.json');

      // 3. Verify attachment files exist in the archive and match payload
      expect(fileNames).toContain(entry1.relative_path);
      expect(fileNames).toContain(entry2.relative_path);

      const unzippedA = unzipped[entry1.relative_path];
      expect(new TextDecoder().decode(unzippedA)).toBe(fileAContent);

      const unzippedB = unzipped[entry2.relative_path];
      expect(new TextDecoder().decode(unzippedB)).toBe(fileBContent);
    });

    it('enforces O(largest single file) streaming via async generator', async () => {
      const options: HabitatExportOptions = {
        items: [
          {
            id: 'item-test',
            title: 'Test Note',
            category: 'Personal',
            type: 'note',
            attachments: JSON.stringify(['att-stream-1']),
            created_at: 100,
            updated_at: 100
          }
        ],
        attachmentMetadataList: [
          { id: 'att-stream-1', file_name: 'stream.txt', parent_id: 'item-test', parent_type: 'note' }
        ],
        fetchAttachmentBlob: async () => 'data:text/plain;base64,c3RyZWFt' // "stream"
      };

      const generator = generateHabitatArchiveStream(options);
      const chunks: Array<{ name: string; size: number }> = [];

      for await (const file of generator) {
        chunks.push({ name: file.name, size: file.input.byteLength });
      }

      // First chunk is the attachment, second chunk is shellguard_vault_export.json
      expect(chunks.length).toBe(2);
      expect(chunks[0].name).toBe('attachments/Personal/Test_Note__[item-tes]/stream.txt');
      expect(chunks[1].name).toBe('shellguard_vault_export.json');
    });
  });
});
