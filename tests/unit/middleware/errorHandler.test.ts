import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Unit tests for the centralized error handler.
 *
 * Contract: parse failures → 400, UNIQUE constraint → 409, FK violation → 400,
 * and unknown errors are MASKED in production (no stack, no internal message).
 *
 * The middleware lands with the Phase 2 security kernel; until then the suite
 * self-skips so `npm test` stays green pre-merge (see tests/README.md gates).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const handlerFile = path.resolve(__dirname, '../../../src/server/middleware/errorHandler.ts');
const handlerExists = fs.existsSync(handlerFile);

interface ErrorHandlerFn {
  (err: Record<string, unknown> & Error, req: unknown, res: unknown, next: unknown): void;
}

function makeMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    headersSent: false,
    statusCode: 500,
  };
}

describe.skipIf(!handlerExists)('errorHandler middleware', () => {
  let errorHandler: ErrorHandlerFn;
  let mockRes: ReturnType<typeof makeMockRes>;
  const mockReq = { method: 'POST', url: '/api/vault' };
  let originalEnv: string | undefined;

  beforeAll(async () => {
    ({ errorHandler } = (await import(handlerFile)) as { errorHandler: ErrorHandlerFn });
  });

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    mockRes = makeMockRes();
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv;
  });

  describe('JSON parse failures', () => {
    it('map body-parser entity.parse.failed to 400 Invalid JSON payload', () => {
      const err = new Error('Unexpected token h in JSON') as Error & { type?: string };
      err.type = 'entity.parse.failed';

      errorHandler(err, mockReq, mockRes, vi.fn());

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Invalid JSON payload' });
    });
  });

  describe('Database constraint violations', () => {
    it('maps UNIQUE constraint failures to 409', () => {
      const err = new Error('UNIQUE constraint failed: lobsters.username');

      errorHandler(err, mockReq, mockRes, vi.fn());

      expect(mockRes.status).toHaveBeenCalledWith(409);
      const body = mockRes.json.mock.calls[0][0] as Record<string, unknown>;
      expect(body.success).toBe(false);
      expect(typeof body.error).toBe('string');
      // the raw SQL detail must not leak into the response
      expect(String(body.error)).not.toContain('lobsters.username');
    });

    it('maps FOREIGN KEY constraint failures to 400', () => {
      const err = new Error('FOREIGN KEY constraint failed');

      errorHandler(err, mockReq, mockRes, vi.fn());

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Unknown errors', () => {
    it('are masked in production: generic message, no stack, no internals', () => {
      process.env.NODE_ENV = 'production';
      const err = new Error('SQLITE_BUSY: database is locked — super secret path /home/lucas');

      errorHandler(err, mockReq, mockRes, vi.fn());

      expect(mockRes.status).toHaveBeenCalledWith(500);
      const body = mockRes.json.mock.calls[0][0] as Record<string, unknown>;
      expect(body.success).toBe(false);
      expect(body.error).not.toContain('SQLITE_BUSY');
      expect(body.error).not.toContain('/home/lucas');
      expect((body as { stack?: string }).stack).toBeUndefined();
    });

    it('may surface the raw message in non-production for debuggability', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error('Dev-only diagnostic');

      errorHandler(err, mockReq, mockRes, vi.fn());

      expect(mockRes.status).toHaveBeenCalledWith(500);
      const body = mockRes.json.mock.calls[0][0] as Record<string, unknown>;
      expect(body.success).toBe(false);
    });

    it('never includes a stack trace in the JSON body in any mode', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error('With stack');
      err.stack = 'Error: With stack\n    at boom (file.ts:1:1)';

      errorHandler(err, mockReq, mockRes, vi.fn());

      const body = mockRes.json.mock.calls[0][0] as Record<string, unknown>;
      expect((body as { stack?: string }).stack).toBeUndefined();
    });
  });
});
