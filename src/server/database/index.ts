import dbInstance, { createConnection } from './connection.js';
import { initializeAuditSchema } from './schema.js';
import { runMigrations } from './migrationRunner.js';
import { createAuditLogger } from '../utils/auditLogger.js';

// Initialize and migrate on load
runMigrations(dbInstance);

// Initialize Audit DB (Segregated)
const auditDb = createConnection('audit.sqlite', process.env.DB_ENCRYPTION_KEY);
initializeAuditSchema(auditDb);

// Centralized Audit Logger Singleton
const audit = createAuditLogger(auditDb);

/** Purge expired tokens utility */
export function purgeExpiredTokens(): number {
  const result = dbInstance.prepare(
    `DELETE FROM api_tokens WHERE datetime(expires_at) <= datetime('now')`
  ).run();
  if (result.changes > 0) console.log(`[DB] Purged ${result.changes} expired token(s)`);
  return result.changes;
}

export default dbInstance;
export { dbInstance as db, auditDb, audit };
