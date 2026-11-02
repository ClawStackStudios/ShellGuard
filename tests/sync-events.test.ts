import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'node:http';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import { makePearlPayload } from './helpers/testFactories.js';
import { createTestUserWithToken } from './helpers/testAuth.js';
import {
  reactiveRiver,
  publishMutation,
  getEventsSince,
  formatSseEvent,
} from '../src/server/utils/reactiveRiver.js';

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-sync-events-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '64645';
  process.env.DB_ENCRYPTION_KEY = '';
  process.env.TOKEN_TTL_DEFAULT = '30m';
  process.env.AUTH_RATE_LIMIT = '1000000';
  process.env.AUTH_RATE_WINDOW = '600m';
  process.env.API_RATE_LIMIT = '1000000';
  process.env.API_RATE_WINDOW = '600m';
  process.env.ENFORCE_HTTPS = 'false';
});

let srv!: ServerHandle;
let httpServer!: http.Server;
let baseUrl!: string;
let userA!: { user: any; token: string };
let userB!: { user: any; token: string };

beforeAll(async () => {
  srv = await loadServer();
  userA = await createTestUserWithToken(srv.app);
  userB = await createTestUserWithToken(srv.app);

  // Bind an ephemeral HTTP server for live SSE streaming sockets
  await new Promise<void>((resolve) => {
    httpServer = srv.app.listen(0, '127.0.0.1', () => {
      const addr = httpServer.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer.closeAllConnections?.();
      httpServer.close(() => resolve());
    });
  }
  await releaseServer(srv);
});

describe('🌊 Phase 28.4: Reactive River SSE Stream & Mutation Engine', () => {
  describe('1. Stream Establishment & Headers', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(srv.app).get('/api/sync/events');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid token query parameter with 401', async () => {
      const res = await request(srv.app).get('/api/sync/events?token=invalid-token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('establishes SSE stream with correct unbuffered headers via query token', (done) => {
      const req = http.get(`${baseUrl}/api/sync/events?token=${encodeURIComponent(userA.token)}`, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/event-stream/);
        expect(res.headers['cache-control']).toContain('no-cache');
        expect(res.headers['cache-control']).toContain('no-transform');
        expect(res.headers['connection']).toBe('keep-alive');
        expect(res.headers['x-accel-buffering']).toBe('no');

        res.on('data', (chunk: Buffer) => {
          if (chunk.toString().includes('connected')) {
            req.destroy();
            done();
          }
        });
      });

      req.on('error', () => {
        // Destroyed cleanly on completion
      });
    });

    it('establishes SSE stream via Authorization header', (done) => {
      const req = http.get(
        `${baseUrl}/api/sync/events`,
        {
          headers: {
            Authorization: `Bearer ${userA.token}`,
          },
        },
        (res) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toMatch(/text\/event-stream/);

          res.on('data', (chunk: Buffer) => {
            if (chunk.toString().includes('connected')) {
              req.destroy();
              done();
            }
          });
        }
      );

      req.on('error', () => {
        // Destroyed cleanly on completion
      });
    });
  });

  describe('2. In-Memory Event Bus & Formatting', () => {
    it('formats SSE event frames according to W3C spec', () => {
      const ev = {
        id: 'ev_42',
        seq: 42,
        domain: 'vault_pearls' as const,
        itemId: 'item_123',
        rev: 3,
        action: 'upsert' as const,
        timestamp: '2026-11-01T12:00:00.000Z',
      };
      const formatted = formatSseEvent(ev);
      expect(formatted).toBe(
        `id: ev_42\nevent: vault_mutation\ndata: {"domain":"vault_pearls","id":"item_123","rev":3,"action":"upsert","timestamp":"2026-11-01T12:00:00.000Z"}\n\n`
      );
    });

    it('increments sequence numbers monotonically per owner', () => {
      const testOwner = 'test-owner-monotonic-' + Date.now();
      const ev1 = publishMutation(testOwner, 'vault_pearls', 'p1', 'upsert');
      const ev2 = publishMutation(testOwner, 'vault_secure_notes', 'n1', 'upsert');
      const ev3 = publishMutation(testOwner, 'vault_pearls', 'p1', 'delete');

      expect(ev1.seq).toBe(1);
      expect(ev1.id).toBe('ev_1');
      expect(ev2.seq).toBe(2);
      expect(ev2.id).toBe('ev_2');
      expect(ev3.seq).toBe(3);
      expect(ev3.id).toBe('ev_3');
    });

    it('tracks monotonic item revisions independently per item ID', () => {
      const testOwner = 'test-owner-rev-' + Date.now();
      const p1_v1 = publishMutation(testOwner, 'vault_pearls', 'pearl_alpha', 'upsert');
      const p2_v1 = publishMutation(testOwner, 'vault_pearls', 'pearl_beta', 'upsert');
      const p1_v2 = publishMutation(testOwner, 'vault_pearls', 'pearl_alpha', 'upsert');

      expect(p1_v1.rev).toBe(1);
      expect(p2_v1.rev).toBe(1);
      expect(p1_v2.rev).toBe(2);
    });

    it('replays events since Last-Event-ID from ring buffer', () => {
      const testOwner = 'test-owner-replay-' + Date.now();
      publishMutation(testOwner, 'vault_pearls', 'p1', 'upsert'); // ev_1
      publishMutation(testOwner, 'vault_pearls', 'p2', 'upsert'); // ev_2
      publishMutation(testOwner, 'vault_pearls', 'p3', 'upsert'); // ev_3

      const replayedFrom1 = getEventsSince(testOwner, 'ev_1');
      expect(replayedFrom1.length).toBe(2);
      expect(replayedFrom1[0].id).toBe('ev_2');
      expect(replayedFrom1[1].id).toBe('ev_3');

      const replayedFromAll = getEventsSince(testOwner, 'ev_0');
      expect(replayedFromAll.length).toBe(3);
      expect(getEventsSince(testOwner, undefined).length).toBe(0);
    });
  });

  describe('3. End-to-End Vault Mutation Broadcast & Strict Tenant Isolation', () => {
    it('broadcasts mutation when a pearl is created and respects tenant isolation', (done) => {
      let streamAConnected = false;
      let userBReceivedUserAEvent = false;

      const reqB = http.get(
        `${baseUrl}/api/sync/events?token=${encodeURIComponent(userB.token)}`,
        (resB) => {
          resB.on('data', (chunk: Buffer) => {
            const str = chunk.toString();
            if (str.includes('test-pearl-sse-stream')) {
              userBReceivedUserAEvent = true;
            }
          });
        }
      );

      reqB.on('error', () => {});

      const reqA = http.get(
        `${baseUrl}/api/sync/events?token=${encodeURIComponent(userA.token)}`,
        (resA) => {
          resA.on('data', async (chunk: Buffer) => {
            const str = chunk.toString();
            if (str.includes('connected') && !streamAConnected) {
              streamAConnected = true;

              // Trigger a POST /api/vault by User A
              const payload = makePearlPayload({
                id: 'test-pearl-sse-stream',
                name: 'Streamed Pearl',
              });

              await request(srv.app)
                .post('/api/vault')
                .set('Authorization', `Bearer ${userA.token}`)
                .send(payload);
            }

            if (str.includes('test-pearl-sse-stream')) {
              // User A received the mutation!
              expect(str).toContain('event: vault_mutation');
              expect(str).toContain('"domain":"vault_pearls"');
              expect(str).toContain('"id":"test-pearl-sse-stream"');
              expect(str).toContain('"action":"upsert"');

              // Wait a brief tick to verify User B never received it
              setTimeout(() => {
                expect(userBReceivedUserAEvent).toBe(false);
                reqA.destroy();
                reqB.destroy();
                done();
              }, 50);
            }
          });
        }
      );

      reqA.on('error', () => {});
    });
  });
});
