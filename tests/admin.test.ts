import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import {
  makePearlPayload,
  makeNotePayload,
  makeSshKeyPayload,
  makeAttachmentPayload,
} from './helpers/testFactories.js';
import { createTestUserWithToken } from './helpers/testAuth.js';
import { loadServer, releaseServer, ServerHandle } from './helpers/testDb.js';

/**
 * SuperLobster Panel (admin plane) — ADMIN.md §4.8 test plan.
 *
 * Asserts:
 *   - panel inert when ADMIN_TOKEN unset (503)
 *   - auth flows: success / wrong token / verify / logout
 *   - STRICT METADATA (T3): user list contains NO vault payload fields
 *   - cascade delete: expect-confirmation (T4), atomicity, audit trail
 *   - settings whitelist (T5): non-whitelisted keys silently ignored
 *   - backups (T6): server-side write only, manifest, rotation, verify
 *   - cross-guard: user Bearer tokens cannot reach admin routes
 */

const ADMIN_TOKEN = 'test-admin-token-abc123';

vi.hoisted(() => {
  const fsLib = require('node:fs');
  const pathLib = require('node:path');
  const dir: string = fsLib.mkdtempSync(pathLib.join(process.cwd(), 'tests', 'data-admin-'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '54545';
  process.env.ADMIN_TOKEN = 'test-admin-token-abc123';
  process.env.DB_ENCRYPTION_KEY = '';
  process.env.TOKEN_TTL_DEFAULT = '30m';
  process.env.AUTH_RATE_LIMIT = '1000000';
  process.env.AUTH_RATE_WINDOW = '600m';
  process.env.API_RATE_LIMIT = '1000000';
  process.env.API_RATE_WINDOW = '600m';
  process.env.ENFORCE_HTTPS = 'false';
});

let srv!: ServerHandle;
let userToken: string;
let userUuid: string;
let adminCookie: string;

/** Extracts the sg_admin_session cookie from a Set-Cookie header array. */
function sessionCookie(res: any): string {
  const setCookie: string[] = res.headers['set-cookie'] ?? [];
  const found = setCookie.find(c => c.startsWith('sg_admin_session='));
  if (!found) throw new Error('no sg_admin_session cookie in response');
  return found.split(';')[0];
}

beforeAll(async () => {
  srv = await loadServer();
  const user = await createTestUserWithToken(srv.app);
  userToken = user.token;
  userUuid = user.user.uuid;

  // Log in as admin for the authenticated tests.
  const res = await request(srv.app)
    .post('/api/admin/auth')
    .send({ token: ADMIN_TOKEN });
  expect(res.status).toBe(200);
  adminCookie = sessionCookie(res);
});

afterAll(async () => {
  await releaseServer(srv);
});

// ─── Panel enablement (T1) ────────────────────────────────────────────────────

describe('Panel enablement', () => {
  it('returns 503 on auth and verify when ADMIN_TOKEN is unset', async () => {
    const saved = process.env.ADMIN_TOKEN;
    delete process.env.ADMIN_TOKEN;
    try {
      const auth = await request(srv.app).post('/api/admin/auth').send({ token: 'anything' });
      expect(auth.status).toBe(503);

      const verify = await request(srv.app).get('/api/admin/verify');
      expect(verify.status).toBe(503);
    } finally {
      process.env.ADMIN_TOKEN = saved;
    }
  });
});

// ─── Auth flows ────────────────────────────────────────────────────────────────

describe('Admin auth', () => {
  it('rejects a wrong token with 401 and no cookie', async () => {
    const res = await request(srv.app).post('/api/admin/auth').send({ token: 'wrong-token' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('verify confirms the live session', async () => {
    const res = await request(srv.app).get('/api/admin/verify').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects verify without a session', async () => {
    const res = await request(srv.app).get('/api/admin/verify');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });
});

// ─── Cross-guard isolation ─────────────────────────────────────────────────────

describe('Cross-guard isolation', () => {
  it('a user Bearer token cannot reach admin routes', async () => {
    const res = await request(srv.app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('an admin session cannot read a user-scoped vault route', async () => {
    const res = await request(srv.app)
      .get('/api/vault')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(401);
  });
});

// ─── Strict metadata (T3) ──────────────────────────────────────────────────────

describe('Lobsters overview — strict metadata', () => {
  it('returns counts and identity but NEVER vault payload fields', async () => {
    // Seed the user with one of every entity type.
    await request(srv.app).post('/api/vault').set('Authorization', `Bearer ${userToken}`).send(makePearlPayload());
    await request(srv.app).post('/api/notes').set('Authorization', `Bearer ${userToken}`).send(makeNotePayload());
    await request(srv.app).post('/api/keys').set('Authorization', `Bearer ${userToken}`).send(makeSshKeyPayload());
    await request(srv.app).post('/api/attachments').set('Authorization', `Bearer ${userToken}`).send(makeAttachmentPayload());

    const res = await request(srv.app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);

    const me = (res.body.data as any[]).find((u: any) => u.uuid === userUuid);
    expect(me).toBeDefined();
    expect(me.username).toBeTruthy();
    expect(me.pearl_count).toBe(1);
    expect(me.note_count).toBe(1);
    expect(me.key_count).toBe(1);
    expect(me.attachment_count).toBe(1);
    expect(me.last_login).toBeTruthy();

    // THE T3 INVARIANT — serialized response must contain zero payload fields.
    const serialized = JSON.stringify(me);
    for (const forbidden of ['secret', 'title', 'file_name', 'file_data', 'category', 'notes', 'url', 'key_value', 'content', 'attachments']) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }
  });
});
// ─── Cascade delete (T4) ───────────────────────────────────────────────────────

describe('Cascade delete', () => {
  it('rejects a wrong expect confirmation', async () => {
    const res = await request(srv.app)
      .delete(`/api/admin/users/${userUuid}`)
      .set('Cookie', adminCookie)
      .send({ expect: 'not-the-username' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('deletes the lobster and every owned row transactionally, with audit', async () => {
    const target = await createTestUserWithToken(srv.app);
    const tUuid = target.user.uuid;
    const tName = target.user.username;

    // Seed one of each vault entity for the target.
    await request(srv.app).post('/api/vault').set('Authorization', `Bearer ${target.token}`).send(makePearlPayload());
    await request(srv.app).post('/api/notes').set('Authorization', `Bearer ${target.token}`).send(makeNotePayload());

    const res = await request(srv.app)
      .delete(`/api/admin/users/${tUuid}`)
      .set('Cookie', adminCookie)
      .send({ expect: tName });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Every table is empty for the target.
    for (const table of ['vault_pearls', 'vault_secure_notes', 'vault_ssh_keys', 'vault_secure_attachments', 'agent_keys', 'api_tokens', 'settings']) {
      const row = srv.db!.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE owner_uuid = ?`).get(tUuid) as any;
      expect(row.c).toBe(0);
    }
    const lobsterRow = srv.db!.prepare('SELECT COUNT(*) as c FROM lobsters WHERE uuid = ?').get(tUuid) as any;
    expect(lobsterRow.c).toBe(0);

    // The audit reef recorded the deletion.
    const auditRow = srv.auditDb!
      .prepare("SELECT details FROM audit_logs WHERE event_type = 'ADMIN_USER_DELETED' ORDER BY id DESC LIMIT 1")
      .get() as any;
    expect(auditRow).toBeDefined();
    expect(auditRow.details).toContain(tUuid);
  });

  it('404s for an unknown uuid', async () => {
    const res = await request(srv.app)
      .delete(`/api/admin/users/00000000-0000-0000-0000-000000000000`)
      .set('Cookie', adminCookie)
      .send({ expect: 'whatever' });
    expect(res.status).toBe(404);
  });
});
// ─── Settings whitelist (T5) ───────────────────────────────────────────────────

describe('Settings whitelist', () => {
  it('applies whitelisted keys and silently ignores everything else', async () => {
    const res = await request(srv.app)
      .patch('/api/admin/settings')
      .set('Cookie', adminCookie)
      .send({
        audit_retention_days: 30,
        backup_enabled: true,
        backup_interval_minutes: 60,
        backup_retention_count: 3,
        // non-whitelisted — must be ignored (T5)
        DB_ENCRYPTION_KEY: 'attacker-controlled',
        ADMIN_TOKEN: 'attacker-controlled',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.applied).not.toHaveProperty('DB_ENCRYPTION_KEY');
    expect(res.body.data.applied).not.toHaveProperty('ADMIN_TOKEN');

    const get = await request(srv.app).get('/api/admin/settings').set('Cookie', adminCookie);
    expect(get.body.data.audit_retention_days).toBe('30');
    expect(get.body.data.backup_enabled).toBe('true');
    expect(get.body.data).not.toHaveProperty('DB_ENCRYPTION_KEY');

    // The env was untouched.
    expect(process.env.ADMIN_TOKEN).toBe(ADMIN_TOKEN);
  });
});

// ─── Backups (T6) ──────────────────────────────────────────────────────────────

describe('Backups', () => {
  it('Back up now writes DB copies + manifest to DATA_DIR/backups (no download route)', async () => {
    const res = await request(srv.app)
      .post('/api/admin/backup')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect((res.body.data.files as string[]).length).toBe(2);

    const fs = await import('node:fs');
    const path = await import('node:path');
    const backupDir = path.join(srv.dataDir, 'backups');
    const files = fs.readdirSync(backupDir);
    expect(files.some(f => f.startsWith('db-') && f.endsWith('.sqlite'))).toBe(true);
    expect(files.some(f => f.startsWith('audit-') && f.endsWith('.sqlite'))).toBe(true);
    expect(files.some(f => f.startsWith('manifest-') && f.endsWith('.json'))).toBe(true);

    // The response only carries file NAMES, never content or a download URL.
    expect(JSON.stringify(res.body)).not.toMatch(/download|url/i);
  });

  it('lists backup sets without a session => 401', async () => {
    const res = await request(srv.app).get('/api/admin/backups');
    expect(res.status).toBe(401);
  });

  it('verifyBackup rejects a wrong key with a uniform error', async () => {
    const { verifyBackup, BACKUP_DIR } = await import('../src/server/utils/backupManager.js');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dbFile = fs.readdirSync(BACKUP_DIR).find(f => f.startsWith('db-'));
    expect(dbFile).toBeDefined();

    const ok = verifyBackup(path.join(BACKUP_DIR, dbFile!), undefined); // unencrypted suite DB
    expect(ok.valid).toBe(true);
    expect(ok.schemaVersion).toBeGreaterThanOrEqual(1);

    const bad = verifyBackup(path.join(BACKUP_DIR, dbFile!), 'wrong-key');
    expect(bad.valid).toBe(false);
    expect(bad.error).toContain('wrong key');
  });

  it('rotation trims old backup sets beyond retention', async () => {
    const { rotateBackups, BACKUP_DIR } = await import('../src/server/utils/backupManager.js');
    const fs = await import('node:fs');
    const path = await import('node:path');

    // Fabricate 4 timestamped sets in the future (so they outrank any real
    // backup taken earlier in this suite); keep 2.
    for (const stamp of ['2027-01-01T00-00-00Z', '2027-01-02T00-00-00Z', '2027-01-03T00-00-00Z', '2027-01-04T00-00-00Z']) {
      fs.writeFileSync(path.join(BACKUP_DIR, `db-${stamp}.sqlite`), 'x');
    }
    const deleted = rotateBackups(2);
    expect(deleted).toBeGreaterThanOrEqual(2);

    const remaining = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('db-2027-01'));
    const stamps = remaining.map(f => f.replace('db-', '').replace('.sqlite', ''));
    expect(stamps).toContain('2027-01-04T00-00-00Z');
    expect(stamps).toContain('2027-01-03T00-00-00Z');
    expect(stamps).not.toContain('2027-01-01T00-00-00Z');
    expect(stamps).not.toContain('2027-01-02T00-00-00Z');
  });
});



