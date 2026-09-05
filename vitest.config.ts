import { defineConfig } from 'vitest/config';

/**
 * Standalone Vitest configuration — server-side suites only.
 *
 * Deliberately independent of vite.config.ts so the React plugin / client
 * pipeline is never loaded for API tests.
 *
 * Isolation model: NO globalSetup. Every integration suite sets its own
 * `process.env.DATA_DIR` inside `vi.hoisted(...)` BEFORE importing the server
 * module — the database singleton evaluates at module load, so each suite
 * gets a private, throwaway SQLite pair (db + audit) under a throwaway
 * `tests/data-` prefixed directory.
 * See tests/README.md and tests/helpers/testDb.ts.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,js}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      // throwaway per-suite DATA_DIRs created by the isolation preamble
      'tests/data-*/**',
    ],
    // Vault CRUD over multi-MB ShellCryption blobs (attachment cap tests) can be slow.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Each suite file owns its server singleton; keep files isolated from one another.
    isolate: true,
    fileParallelism: false,
  },
});
