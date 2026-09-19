import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { ServerHandle } from './helpers/testDb.js';
import { loadServer, releaseServer } from './helpers/testDb.js';
import { createTestUserWithToken } from './helpers/testAuth.js';
import { makePearlPayload, makeNotePayload, makeSshKeyPayload } from './helpers/testFactories.js';
import { MAX_ATTACHMENT_BYTES, GROTTO_QUOTA_BYTES } from '../src/server/routes/attachments.js';
import { hashStringToColor, getPodColor, getTagColor, setTagColor, deleteTagColor } from '../src/lib/podUtils.js';
import { parseTags, extractAllTags, filterItemsByTags } from '../src/lib/tagUtils.js';
import { VaultItem } from '../src/types.js';

// ─── Isolation preamble ──────────────────────────────────────────────────────
vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-vault-tags-'));
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
let token: string;
let ownerUuid: string;

beforeAll(async () => {
  srv = await loadServer();
  const user = await createTestUserWithToken(srv.app);
  token = user.token;
  ownerUuid = user.user.uuid;
});

afterAll(async () => {
  await releaseServer(srv);
});

describe('Phase 20: Vault Tagging System & Granular Filter Bar', () => {
  describe('Task 39: Database Migration & Schema Invariants', () => {
    it('applies migration 0006_vault_tags recorded in schema_migrations', () => {
      const db = srv.db;
      if (!db) throw new Error('Database handle missing');
      const row = db.prepare('SELECT * FROM schema_migrations WHERE version = 6').get() as { version: number; name: string };
      expect(row).toBeDefined();
      expect(row.version).toBe(6);
      expect(row.name).toBe('vault_tags');
    });

    it('has `tags` column across vault_pearls, vault_secure_notes, and vault_ssh_keys', () => {
      const db = srv.db;
      if (!db) throw new Error('Database handle missing');
      for (const table of ['vault_pearls', 'vault_secure_notes', 'vault_ssh_keys']) {
        const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
        const hasTags = columns.some(c => c.name === 'tags');
        expect(hasTags, `Table ${table} should contain tags column`).toBe(true);
      }
    });
  });

  describe('Task 39: Server Route Tagging CRUD & Filtering', () => {
    it('creates, retrieves, and updates pearls with tags', async () => {
      const pearl = makePearlPayload();
      const initialTags = ['finance', 'prod'];

      const postRes = await request(srv.app)
        .post('/api/vault')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...pearl, tags: initialTags });

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.tags).toBe(JSON.stringify(initialTags));

      // Fetch list
      const getRes = await request(srv.app)
        .get('/api/vault')
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      const fetched = getRes.body.data.find((p: any) => p.id === pearl.id);
      expect(fetched).toBeDefined();
      expect(fetched.tags).toBe(JSON.stringify(initialTags));

      // Update tags
      const updatedTags = ['finance', 'infra', 'audit'];
      const putRes = await request(srv.app)
        .put(`/api/vault/${pearl.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...pearl, tags: updatedTags });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.tags).toBe(JSON.stringify(updatedTags));
    });

    it('filters pearls by tags intersection (?tags=a,b)', async () => {
      const p1 = makePearlPayload();
      const p2 = makePearlPayload();
      const p3 = makePearlPayload();

      await request(srv.app)
        .post('/api/vault')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...p1, tags: ['frontend', 'react'] });

      await request(srv.app)
        .post('/api/vault')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...p2, tags: ['frontend', 'backend'] });

      await request(srv.app)
        .post('/api/vault')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...p3, tags: ['backend', 'database'] });

      // Query ?tags=frontend -> p1, p2
      const resFrontend = await request(srv.app)
        .get('/api/vault?tags=frontend')
        .set('Authorization', `Bearer ${token}`);

      const idsFrontend = resFrontend.body.data.map((x: any) => x.id);
      expect(idsFrontend).toContain(p1.id);
      expect(idsFrontend).toContain(p2.id);
      expect(idsFrontend).not.toContain(p3.id);

      // Query ?tags=frontend,backend -> p2 only
      const resBoth = await request(srv.app)
        .get('/api/vault?tags=frontend,backend')
        .set('Authorization', `Bearer ${token}`);

      const idsBoth = resBoth.body.data.map((x: any) => x.id);
      expect(idsBoth).not.toContain(p1.id);
      expect(idsBoth).toContain(p2.id);
      expect(idsBoth).not.toContain(p3.id);
    });

    it('creates, retrieves, and filters secure notes with tags', async () => {
      const note = makeNotePayload();
      const tags = ['confidential', 'legal'];

      const postRes = await request(srv.app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...note, tags });

      expect(postRes.status).toBe(201);
      expect(postRes.body.data.tags).toBe(JSON.stringify(tags));

      const filterRes = await request(srv.app)
        .get('/api/notes?tags=legal')
        .set('Authorization', `Bearer ${token}`);

      expect(filterRes.status).toBe(200);
      const found = filterRes.body.data.find((n: any) => n.id === note.id);
      expect(found).toBeDefined();
    });

    it('creates, retrieves, and filters SSH keys with tags', async () => {
      const ssh = makeSshKeyPayload();
      const tags = ['bastion', 'aws'];

      const postRes = await request(srv.app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...ssh, tags });

      expect(postRes.status).toBe(201);
      expect(postRes.body.data.tags).toBe(JSON.stringify(tags));

      const filterRes = await request(srv.app)
        .get('/api/keys?tags=bastion')
        .set('Authorization', `Bearer ${token}`);

      expect(filterRes.status).toBe(200);
      const found = filterRes.body.data.find((k: any) => k.id === ssh.id);
      expect(found).toBeDefined();
    });

    it('records tag metadata in audit log details', () => {
      const auditDb = srv.auditDb;
      if (!auditDb) throw new Error('Audit DB handle missing');
      const rows = auditDb.prepare("SELECT * FROM audit_logs WHERE action = 'vault_item_created' ORDER BY timestamp DESC LIMIT 5").all() as any[];
      expect(rows.length).toBeGreaterThan(0);
      const parsedDetails = rows.map(r => JSON.parse(r.details));
      const hasTags = parsedDetails.some(d => d.tags !== undefined);
      expect(hasTags).toBe(true);
    });
  });

  describe('Sub-task: 500MB Attachment Storage Ceiling', () => {
    it('defaults MAX_ATTACHMENT_BYTES to 500MB and GROTTO_QUOTA_BYTES to 1000MB', () => {
      // In this isolated test without overrides, default is 500MB / 1000MB
      expect(MAX_ATTACHMENT_BYTES).toBe(500 * 1024 * 1024);
      expect(GROTTO_QUOTA_BYTES).toBe(1000 * 1024 * 1024);
    });
  });

  describe('Task 40: Unified Color Engine & Tag Utilities', () => {
    it('deterministically hashes strings to palette colors', () => {
      const c1 = hashStringToColor('production');
      const c2 = hashStringToColor('production');
      const c3 = hashStringToColor('staging');

      expect(c1).toBe(c2);
      expect(typeof c1).toBe('string');
      expect(c1.startsWith('#')).toBe(true);
    });

    it('respects explicit color overrides in getPodColor and getTagColor', () => {
      const explicit = '#ff0055';
      expect(getPodColor('Work', explicit)).toBe(explicit);
      expect(getTagColor('urgent', explicit)).toBe(explicit);
    });

    it('parses various tag representations correctly via parseTags', () => {
      expect(parseTags(null)).toEqual([]);
      expect(parseTags('')).toEqual([]);
      expect(parseTags('[]')).toEqual([]);

      const fromArray = parseTags(['ops', 'dev']);
      expect(fromArray.map(t => t.name)).toEqual(['ops', 'dev']);

      const fromJson = parseTags(JSON.stringify([{ name: 'security', color: '#10b981' }]));
      expect(fromJson.length).toBe(1);
      expect(fromJson[0].name).toBe('security');
      expect(fromJson[0].color).toBe('#10b981');

      const fromCsv = parseTags('alpha, beta, gamma');
      expect(fromCsv.map(t => t.name)).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('extracts all unique tags with frequency counts via extractAllTags', () => {
      const items = [
        { id: '1', type: 'password', title: 'A', secret: 's', created_at: '', tags: JSON.stringify(['ops', 'prod']) },
        { id: '2', type: 'password', title: 'B', secret: 's', created_at: '', tags: JSON.stringify(['ops']) },
        { id: '3', type: 'note', title: 'C', secret: 's', created_at: '', tags: JSON.stringify(['dev', 'prod']) },
      ] as VaultItem[];

      const summary = extractAllTags(items);
      const ops = summary.find(s => s.name === 'ops');
      const prod = summary.find(s => s.name === 'prod');
      const dev = summary.find(s => s.name === 'dev');

      expect(ops?.count).toBe(2);
      expect(prod?.count).toBe(2);
      expect(dev?.count).toBe(1);
    });

    it('filters items by tags in AND vs OR modes via filterItemsByTags', () => {
      const items = [
        { id: '1', type: 'password', title: 'A', secret: 's', created_at: '', tags: JSON.stringify(['frontend', 'react']) },
        { id: '2', type: 'password', title: 'B', secret: 's', created_at: '', tags: JSON.stringify(['frontend', 'vue']) },
        { id: '3', type: 'password', title: 'C', secret: 's', created_at: '', tags: JSON.stringify(['backend', 'node']) },
      ] as VaultItem[];

      // AND mode: must have both 'frontend' AND 'react'
      const andResults = filterItemsByTags(items, ['frontend', 'react'], 'AND');
      expect(andResults.map(i => i.id)).toEqual(['1']);

      // OR mode: must have either 'react' OR 'vue'
      const orResults = filterItemsByTags(items, ['react', 'vue'], 'OR');
      expect(orResults.map(i => i.id)).toEqual(['1', '2']);
    });
  });
});
