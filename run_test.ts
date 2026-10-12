import request from 'supertest';
import { loadServer, releaseServer } from './tests/helpers/testDb.js';
import { createTestUserWithToken } from './tests/helpers/testAuth.js';
import { makeAttachmentPayload, uploadAttachment, oversizedBytes, makePearlPayload } from './tests/helpers/testFactories.js';

async function run() {
  const srv = await loadServer();
  const auth = await createTestUserWithToken(srv.app);
  const token = auth.token;

  const parentId = 'crud-att-parent-1';
  const p = makePearlPayload({ id: parentId, title: 'Parent', type: 'password', category: 'test' });
  const parentRes = await request(srv.app).post('/api/vault').set('Authorization', `Bearer ${token}`).send(p);
  console.log("Parent res:", parentRes.status, parentRes.body);

  const payload = makeAttachmentPayload({ parent_id: parentId, parent_type: 'password' });
  const res = await uploadAttachment(srv.app, token, payload);
  console.log("Att res:", res.status, res.body);
  await releaseServer(srv);
}
run().catch(console.error);
