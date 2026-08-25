import request from 'supertest';
import type { Express } from 'express';
import type { Identity } from './testFactories.js';
import { createLobsterKey, registerIdentity } from './testFactories.js';

/**
 * Authentication helpers for tests (CC verbatim, minus the jina-era extras,
 * adapted to ShellGuard's identity model: hu- human keys, lb- Lobster Keys,
 * api- session tokens).
 */

/**
 * Exchanges a human identity (uuid + keyHash) for an api- session token.
 * Used to authenticate subsequent human API requests.
 */
export async function getHumanToken(app: Express, uuid: string, keyHash: string): Promise<string> {
  const res = await request(app).post('/api/auth/token').send({ type: 'human', uuid, keyHash });

  if (res.status !== 201 || !res.body.data?.token) {
    throw new Error(`Failed to get human token: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

/**
 * Exchanges a Lobster Key (lb-) for an api- agent session token.
 */
export async function getAgentToken(app: Express, lobsterApiKey: string): Promise<string> {
  const res = await request(app).post('/api/auth/token').send({ type: 'agent', ownerKey: lobsterApiKey });

  if (res.status !== 201 || !res.body.data?.token) {
    throw new Error(`Failed to get agent token: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

/**
 * Registers a test identity through the API and returns its credentials.
 */
export async function createTestUser(app: Express, overrides?: Partial<Identity>): Promise<Identity> {
  return registerIdentity(app, overrides);
}

/**
 * Creates a test user AND acquires a human session token — the standard
 * setup for most suites.
 */
export async function createTestUserWithToken(
  app: Express,
  userOverrides?: Partial<Identity>
): Promise<{ user: Identity; token: string }> {
  const user = await createTestUser(app, userOverrides);
  const token = await getHumanToken(app, user.uuid, user.keyHash);
  return { user, token };
}

/**
 * Creates a test user plus a Lobster Key and both tokens. Useful for
 * permission-matrix and requireHuman scenarios.
 */
export async function createTestUserWithAgent(
  app: Express,
  userOverrides?: Partial<Identity>,
  permissions?: Partial<Record<string, boolean>>
): Promise<{
  user: Identity;
  humanToken: string;
  agentApiKey: string;
  agentKeyId: string;
  agentToken: string;
}> {
  const { user, token: humanToken } = await createTestUserWithToken(app, userOverrides);
  const key = await createLobsterKey(app, humanToken, permissions);
  const agentToken = await getAgentToken(app, key.apiKey);
  return { user, humanToken, agentApiKey: key.apiKey, agentKeyId: key.id, agentToken };
}

/**
 * Second, fully independent identity — for cross-owner isolation tests.
 */
export async function createSecondUser(
  app: Express,
  overrides?: Partial<Identity>
): Promise<{ user: Identity; token: string }> {
  return createTestUserWithToken(app, overrides);
}

/**
 * PATCH /api/agent-keys/:id/revoke as the owning human.
 */
export async function revokeLobsterKey(app: Express, humanToken: string, keyId: string): Promise<void> {
  const res = await request(app)
    .patch(`/api/agent-keys/${keyId}/revoke`)
    .set('Authorization', `Bearer ${humanToken}`)
    .send({});

  if (res.status !== 200) {
    throw new Error(`Failed to revoke lobster key: ${res.status} ${JSON.stringify(res.body)}`);
  }
}
