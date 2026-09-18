import { Router } from 'express';
import Busboy from 'busboy';
import db, { audit } from '../database/index.js';
import { AuthRequest, requireAuth, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { AttachmentSchemas } from '../validation/schemas.js';
import { fieldCipher } from '../utils/fieldEncryption.js';
import { prepareWrite, prepareRead, prepareReadAll } from '../utils/metadataGuard.js';

const router = Router();

// Permission mapping (delta #11): GET→canRead · POST→canWrite · PUT→canEdit · DELETE→canDelete
//
// Phase 19 wire contract:
//   - POST is MULTIPART (Busboy): the client ShellCrypts the file BEFORE upload,
//     so the streamed part is already-encrypted bytes. The server enforces
//     storage limits and linkage — NEVER content (zero-knowledge invariant).
//   - GET / (list) returns METADATA ONLY — the payload BLOB is never included
//     in list responses. Payloads stream from GET /:id/file in chunks, so a
//     download never loads the whole BLOB into Node's RSS.
//   - PUT is metadata-only (title/file_name/mime_type/category). File
//     replacement re-uploads. The router sits behind the global 1mb JSON
//     body parser — metadata-only bodies fit trivially.

/** Hard per-file ceiling: 50MB of ciphertext (env: ATTACHMENT_MAX_MB). */
export const MAX_ATTACHMENT_BYTES =
  (parseInt(process.env.ATTACHMENT_MAX_MB ?? '50', 10) || 50) * 1024 * 1024;

/** Per-owner grotto quota: 500MB total stored ciphertext (env: GROTTO_QUOTA_MB). */
export const GROTTO_QUOTA_BYTES =
  (parseInt(process.env.GROTTO_QUOTA_MB ?? '500', 10) || 500) * 1024 * 1024;

/** Read/download chunk size for incremental BLOB streaming (1MB). */
const BLOB_CHUNK_BYTES = 1024 * 1024;

function grottoUsage(ownerUuid: string): number {
  const row = db
    .prepare('SELECT COALESCE(SUM(size_bytes), 0) AS used FROM vault_secure_attachments WHERE owner_uuid = ?')
    .get(ownerUuid) as { used: number };
  return row.used || 0;
}

// ─── GET / — metadata-only list (payload BLOBs never leave via this route) ──
router.get('/', requireAuth, requirePermission('canRead'), async (req: AuthRequest, res) => {
  try {
    const items = db
      .prepare(`SELECT id, title, size_bytes, file_name, mime_type, category, created_at
                FROM vault_secure_attachments WHERE owner_uuid = ? ORDER BY created_at DESC`)
      .all(req.userUuid) as Record<string, unknown>[];
    const decrypted = await prepareReadAll('vault_secure_attachments', items, fieldCipher);
    res.json({ success: true, data: decrypted });
  } catch (err: any) {
    console.error('Attachments GET error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure retrieving attachments.' });
  }
});

// ─── GET /:id/file — streamed BLOB download (chunked substr reads) ──────────
router.get('/:id/file', requireAuth, requirePermission('canRead'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db
      .prepare('SELECT size_bytes FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?')
      .get(id, req.userUuid) as { size_bytes: number } | undefined;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Attachment not found.' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', String(row.size_bytes));
    res.setHeader('Cache-Control', 'no-store');

    const readChunk = db.prepare(
      'SELECT substr(file_data, ?, ?) AS chunk FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?'
    );
    for (let offset = 1; offset <= row.size_bytes; offset += BLOB_CHUNK_BYTES) {
      const chunkRow = readChunk.get(offset, BLOB_CHUNK_BYTES, id, req.userUuid) as { chunk: Buffer };
      if (!res.write(chunkRow.chunk)) {
        await new Promise<void>((resolve) => res.once('drain', resolve));
      }
    }
    res.end();

    audit.log('ATTACHMENT_DOWNLOADED', {
      action: 'attachment_downloaded',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, bytes: row.size_bytes },
    });
  } catch (err: any) {
    console.error('Attachments file-stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Bedrock failure streaming attachment.' });
    } else {
      res.end();
    }
  }
});

// ─── POST / — multipart streaming upload (Busboy → bounded buffer → BLOB) ───
// better-sqlite3 exposes no incremental BLOB I/O (openBlob), so the write
// path peaks at the ciphertext size (≤50MB, hard-capped MID-STREAM by
// Busboy's fileSize limit — a breach destroys the request, never buffers
// past the ceiling). The read path is the memory-critical one and is fully
// chunked (GET /:id/file + metadata-only list).
router.post('/', requireAuth, requirePermission('canWrite'), (req: AuthRequest, res) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('multipart/form-data')) {
    return res.status(415).json({
      success: false,
      error: 'Attachment uploads require multipart/form-data (streamed ciphertext).',
    });
  }

  let busboy: Busboy.Busboy;
  try {
    busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_ATTACHMENT_BYTES + 1, files: 1, fields: 16, fieldSize: 4096 },
    });
  } catch {
    return res.status(400).json({ success: false, error: 'Malformed multipart payload.' });
  }

  const fields: Record<string, string> = {};
  const chunks: Buffer[] = [];
  let received = 0;
  let fileSeen = false;
  let settled = false;

  const finish = (code: number, body: Record<string, unknown>) => {
    if (settled) return;
    settled = true;
    res.status(code).json(body);
  };

  const abort = (code: number, message: string) => {
    if (settled) return;
    settled = true;
    req.unpipe(busboy);
    req.resume();
    res.status(code).json({ success: false, error: message });
  };

  busboy.on('field', (name, value) => {
    fields[name] = value;
  });

  busboy.on('file', (_name, stream) => {
    fileSeen = true;
    stream.on('data', (d: Buffer) => {
      received += d.length;
      if (received > MAX_ATTACHMENT_BYTES) {
        abort(413, `Attachment exceeds the ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB per-file ceiling.`);
        stream.destroy();
        return;
      }
      chunks.push(d);
    });
    stream.on('limit', () => {
      abort(413, `Attachment exceeds the ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB per-file ceiling.`);
    });
  });

  busboy.on('error', () => abort(400, 'Malformed multipart payload.'));

  busboy.on('close', () => {
    if (settled) return;
    void (async () => {
      try {
        // Fail-closed field validation (opaque ciphertext: length/type ONLY —
        // the server never inspects contents; zero-knowledge invariant).
        const id = fields.id ?? '';
        const title = (fields.title ?? '').trim();
        const file_name = (fields.file_name ?? '').slice(0, 512);
        const mime_type = (fields.mime_type ?? '').slice(0, 255);
        const category = (fields.category ?? '').slice(0, 64);

        if (!id || id.length > 64) return finish(400, { success: false, error: 'Invalid attachment id.' });
        if (!title || title.length > 255) return finish(400, { success: false, error: 'Invalid attachment title.' });
        if (!fileSeen) return finish(400, { success: false, error: 'Missing file payload.' });

        const ciphertext = Buffer.concat(chunks);
        if (ciphertext.length === 0) return finish(400, { success: false, error: 'Empty file payload.' });

        // Grotto quota (per owner_uuid).
        if (grottoUsage(req.userUuid) + ciphertext.length > GROTTO_QUOTA_BYTES) {
          return finish(413, { success: false, error: 'Grotto storage quota exceeded (500MB per owner).' });
        }

        const toStore = await prepareWrite('vault_secure_attachments', { title, file_name, category }, fieldCipher);

        db.prepare(`
          INSERT INTO vault_secure_attachments (id, owner_uuid, title, file_data, size_bytes, file_name, mime_type, category, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, req.userUuid, toStore.title, ciphertext, ciphertext.length, toStore.file_name, mime_type, toStore.category, new Date().toISOString());

        audit.log('ATTACHMENT_UPLOADED', {
          action: 'attachment_uploaded',
          outcome: 'success',
          actor: req.userUuid,
          details: { itemId: id, category, bytes: ciphertext.length, mimeType: mime_type },
        });

        finish(201, { success: true, data: { id, title, category, size_bytes: ciphertext.length } });
      } catch (err: any) {
        console.error('Attachments POST error:', err);
        if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return finish(400, { success: false, error: 'An attachment with this ID already exists.' });
        }
        finish(500, { success: false, error: 'Bedrock failure locking attachment.' });
      }
    })();
  });

  req.pipe(busboy);
});

// ─── PUT /:id — metadata-only update (file replacement = re-upload) ─────────
router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(AttachmentSchemas.update), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, file_name, mime_type, category } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Attachment not found.' });
    }

    const toStore = await prepareWrite('vault_secure_attachments', {
      title: title.trim(),
      file_name: file_name || '',
      category: category || '',
    }, fieldCipher);

    db.prepare('UPDATE vault_secure_attachments SET title = ?, file_name = ?, mime_type = ?, category = ? WHERE id = ? AND owner_uuid = ?')
      .run(toStore.title, toStore.file_name, mime_type || '', toStore.category, id, req.userUuid);

    audit.log('ATTACHMENT_UPDATED', {
      action: 'attachment_updated',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: category || '', mimeType: mime_type || '' },
    });

    res.json({ success: true, data: { id, title: title.trim(), category: category || '' } });
  } catch (err: any) {
    console.error('Attachments PUT error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure updating attachment.' });
  }
});

router.delete('/:id', requireAuth, requirePermission('canDelete'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT id, category, size_bytes FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?').get(id, req.userUuid) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Attachment not found.' });
    }

    const decryptedRow = await prepareRead('vault_secure_attachments', row, fieldCipher);

    db.prepare('DELETE FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?').run(id, req.userUuid);

    audit.log('ATTACHMENT_DELETED', {
      action: 'attachment_deleted',
      outcome: 'success',
      actor: req.userUuid,
      details: { itemId: id, category: decryptedRow.category, bytes: row.size_bytes ?? 0 },
    });

    res.json({ success: true, data: { message: 'Attachment removed.' } });
  } catch (err: any) {
    console.error('Attachments DELETE error:', err);
    res.status(500).json({ success: false, error: 'Bedrock failure removing attachment.' });
  }
});

export default router;
