/**
 * Build Validation Gates — architecture-parity prerequisites.
 *
 * These files land via OTHER tracks (Phases 0–2 infra, Phase 5 containers/CI).
 * Every content gate therefore self-skips while its target artifact is absent
 * (`it.skipIf(!existsSync(...))`) so the suite is green pre-merge and becomes
 * ENFORCING the moment each artifact lands. See tests/README.md.
 *
 * Delta #10 guard: the lockfile must stay OUT of .dockerignore so images build
 * with `npm ci` (reproducible installs) — CC's exclusion bug is not inherited.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const readIfExists = (rel: string): string | null => {
  const p = path.join(PROJECT_ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
};

describe('Build gates — always-on repository shape', () => {
  it('has a package.json with lint and build scripts', () => {
    const pkg = JSON.parse(readIfExists('package.json') ?? 'null');

    expect(pkg.scripts?.lint).toBeDefined();
    expect(pkg.scripts?.build).toContain('vite build');
  });

  it('has an Express entrypoint at server.ts', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'server.ts'))).toBe(true);
  });

  it('keeps vitest.config.ts standalone (no React plugin needed server-side)', () => {
    const cfg = readIfExists('vitest.config.ts');
    expect(cfg).not.toBeNull();
    expect(cfg).toContain("environment: 'node'");
    expect(cfg).not.toContain('@vitejs/plugin-react');
  });
});

// ─── TypeScript strictness ───────────────────────────────────────────────────
const tsconfigRaw = readIfExists('tsconfig.json');
const strictLanded = tsconfigRaw !== null && /["']strict["']\s*:\s*true/.test(tsconfigRaw);

describe.skipIf(!strictLanded)('Build gates — TypeScript strict mode (Phase 4 flip)', () => {
  it('enables the CC compiler-option set', () => {
    const raw = readIfExists('tsconfig.json')!;

    expect(raw).toMatch(/["']strict["']\s*:\s*true/);
    expect(raw).toMatch(/["']noUnusedLocals["']\s*:\s*true/);
    expect(raw).toMatch(/["']noUnusedParameters["']\s*:\s*true/);
    expect(raw).toMatch(/["']noFallthroughCasesInSwitch["']\s*:\s*true/);
  });
});

// ─── Docker image ────────────────────────────────────────────────────────────
describe.skipIf(!fs.existsSync(path.join(PROJECT_ROOT, 'Dockerfile')))('Build gates — Dockerfile', () => {
  const dockerfile = () => readIfExists('Dockerfile')!;

  it('is a multi-stage node:20-alpine image', () => {
    expect(dockerfile()).toContain('FROM node:20-alpine');
    expect((dockerfile().match(/FROM /g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('declares a HEALTHCHECK hitting /api/health', () => {
    const raw = dockerfile();
    expect(raw).toMatch(/HEALTHCHECK/);
    expect(raw).toContain('/api/health');
    expect(raw).toMatch(/wget|curl/);
  });

  it('drops privileges via the non-root entrypoint', () => {
    const raw = dockerfile();
    expect(raw).toMatch(/ENTRYPOINT.*docker-entrypoint\.sh/);
    expect(raw).toMatch(/su-exec|USER node/);
  });

  it('installs reproducibly with npm ci and copies the lockfile (delta #10)', () => {
    const raw = dockerfile();
    expect(raw).toContain('npm ci');
    expect(raw).toContain('package-lock.json');
  });

  it('exposes the web port and mounts DATA_DIR=/app/data', () => {
    const raw = dockerfile();
    expect(raw).toMatch(/EXPOSE\s+6464/);
    expect(raw).toMatch(/DATA_DIR[= ]\/app\/data/);
  });
});

describe.skipIf(!fs.existsSync(path.join(PROJECT_ROOT, 'docker-entrypoint.sh')))(
  'Build gates — docker-entrypoint.sh',
  () => {
    it('exists and is executable', () => {
      const stat = fs.statSync(path.join(PROJECT_ROOT, 'docker-entrypoint.sh'));
      // owner+group+other execute bits, any of them suffices for a shebang script in Linux images
      expect(stat.mode & 0o111).not.toBe(0);
    });

    it('handles PUID/PGID remap and privilege drop', () => {
      const raw = readIfExists('docker-entrypoint.sh')!;
      expect(raw).toContain('PUID');
      expect(raw).toContain('PGID');
      expect(raw).toMatch(/su-exec|gosu/);
    });
  }
);

// ─── .dockerignore (delta #10 guard) ─────────────────────────────────────────
describe.skipIf(!fs.existsSync(path.join(PROJECT_ROOT, '.dockerignore')))('Build gates — .dockerignore', () => {
  const patterns = (): string[] =>
    (readIfExists('.dockerignore')!)
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

  it('excludes node_modules from the build context', () => {
    expect(patterns().some((p) => p === 'node_modules' || p.startsWith('node_modules/'))).toBe(true);
  });

  it('NEVER ignores package-lock.json — npm ci depends on it (delta #10)', () => {
    const offenders = patterns().filter(
      (p) => p.includes('package-lock.json') || p.includes('package-lock')
    );
    expect(offenders, `.dockerignore must not exclude the lockfile (found: ${offenders.join(', ')})`).toEqual([]);
  });

  it('excludes local data dirs and databases', () => {
    const joined = patterns().join('\n');
    expect(joined).toMatch(/data/);
    expect(joined).toMatch(/\*\.db|\*\.sqlite/);
  });
});

// ─── Migrations ──────────────────────────────────────────────────────────────
const migrationUp = 'migrations/0001_initial.up.sql';
describe.skipIf(!fs.existsSync(path.join(PROJECT_ROOT, migrationUp)))('Build gates — schema v1 migrations', () => {
  it('ships a matching up/down pair', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'migrations/0001_initial.up.sql'))).toBe(true);
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'migrations/0001_initial.down.sql'))).toBe(true);
  });

  it('defines the identity and vault tables with owner_uuid columns (delta #5)', () => {
    const up = readIfExists(migrationUp)!;
    expect(up).toMatch(/CREATE TABLE/i);
    expect(up).toContain('lobsters');
    expect(up).toContain('vault_pearls');
    expect(up).toContain('owner_uuid');
  });

  it('the down migration actually tears down', () => {
    const down = readIfExists('migrations/0001_initial.down.sql')!;
    expect(down.trim().length).toBeGreaterThan(0);
    expect(down).toMatch(/DROP TABLE/i);
  });
});

// ─── Compose ─────────────────────────────────────────────────────────────────
for (const composeFile of ['docker-compose.yml', 'docker-compose.dev.yml']) {
  describe.skipIf(!fs.existsSync(path.join(PROJECT_ROOT, composeFile)))(`Build gates — ${composeFile}`, () => {
    it('defines a healthcheck against /api/health', () => {
      const raw = readIfExists(composeFile)!;
      expect(raw).toMatch(/healthcheck/);
      expect(raw).toContain('/api/health');
    });

    it('persists DATA_DIR via a ./data volume mount', () => {
      const raw = readIfExists(composeFile)!;
      expect(raw).toMatch(/data[:]/);
    });
  });
}

// ─── Unraid template ─────────────────────────────────────────────────────────
const unraidFile = 'shellguard-unraid-template.xml';
describe.skipIf(!fs.existsSync(path.join(PROJECT_ROOT, unraidFile)))('Build gates — Unraid template', () => {
  /** Dependency-free XML well-formedness smoke check (xmllint still runs in P5 verify). */
  function assertBalancedXml(xml: string): void {
    const stripped = xml
      .replace(/<\?[\s\S]*?\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');

    const stack: string[] = [];
    const tagRe = /<(\/?)([A-Za-z_][\w.:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
    let match: RegExpExecArray | null;
    while ((match = tagRe.exec(stripped)) !== null) {
      const [, closing, name, , selfClosing] = match;
      if (selfClosing === '/') continue;
      if (closing === '/') {
        const open = stack.pop();
        expect(open, `unbalanced XML: </${name}> closes nothing (expected </${open ?? '???'}>)`).toBe(name);
      } else {
        stack.push(name);
      }
    }
    expect(stack, `unclosed XML tags: ${stack.join(', ')}`).toEqual([]);
  }

  it('parses as balanced XML', () => {
    assertBalancedXml(readIfExists(unraidFile)!);
  });

  it('targets the published ghcr image and masks secrets', () => {
    const raw = readIfExists(unraidFile)!;
    expect(raw).toContain('ghcr.io/clawstackstudios/shellguard');
    expect(raw).toMatch(/DB_ENCRYPTION_KEY/);
    expect(raw).toMatch(/WebUI[\s\S]{0,80}6464/);
  });
});
