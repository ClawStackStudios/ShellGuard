import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

/**
 * Docs Navigation-Link Integrity Suite
 *
 * Covers ALL THREE link classes in the VitePress portal:
 *   1. Config links        (docs/.vitepress/config.ts  — `link: '/...'`)
 *   2. Markdown links      (docs markdown files          — `](/path)`)
 *   3. Raw HTML hrefs      (docs markdown files + theme components — `href="/..."`)
 *
 * The third class was the blind spot of earlier link audits: custom Vue components
 * emit raw hrefs that VitePress does NOT base-rewrite (only theme-config links and
 * markdown links are handled). Every internal target must (a) resolve to a real
 * file on disk and (b) pass through `withBase()` so it survives the deployed
 * base path (VITEPRESS_BASE, e.g. /ShellGuard/).
 *
 * See ARCHITECTURE § The ClawKey Method lineage: enumerate the emitter, not the syntax.
 */

const DOCS = resolve(__dirname, '../../docs');

function walk(dir: string, acc: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (['node_modules', 'dist', 'cache'].includes(f)) continue;
      walk(p, acc);
    } else if (f.endsWith('.md')) acc.push(p);
  }
  return acc;
}

const mdFiles = walk(DOCS);

/** Resolves a site-absolute path (e.g. `/getting-started/`) to a real file under docs/. */
function targetExists(sitePath: string): boolean {
  const clean = sitePath.split('#')[0];
  if (!clean) return true; // pure fragment
  const base = clean.endsWith('/') ? clean.slice(0, -1) : clean;
  return (
    existsSync(join(DOCS, base + '.md')) ||
    existsSync(join(DOCS, base, 'index.md')) ||
    existsSync(join(DOCS, base))
  );
}

describe('docs navigation-link integrity (all three link classes)', () => {
  it('every config.ts nav/sidebar link resolves to a real page', () => {
    const cfg = readFileSync(join(DOCS, '.vitepress', 'config.ts'), 'utf-8');
    const links = [...cfg.matchAll(/link:\s*['"`](\/[^'"`?#]*)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(20);
    const dead = links.filter((l) => !targetExists(l));
    expect(dead).toEqual([]);
  });

  it('every markdown-style local link resolves to a real page', () => {
    const dead: string[] = [];
    for (const f of mdFiles) {
      const t = readFileSync(f, 'utf-8');
      for (const m of t.matchAll(/\]\((\/[^)\s'#]*)[^)]*\)/g)) {
        if (!targetExists(m[1])) dead.push(`${m[1]} (${f})`);
      }
    }
    expect(dead).toEqual([]);
  });

  it('every raw HTML href="..." in content resolves to a real page', () => {
    const dead: string[] = [];
    for (const f of mdFiles) {
      const t = readFileSync(f, 'utf-8');
      for (const m of t.matchAll(/href="(\/[^"]*)"/g)) {
        const u = m[1];
        if (/^(https?:|mailto:|file:)/.test(u)) continue;
        if (!targetExists(u)) dead.push(`${u} (${f})`);
      }
    }
    expect(dead).toEqual([]);
  });

  it('theme components base-prefix internal links (withBase regression guard)', () => {
    // Card.vue renders every CardGrid href — it MUST normalize with withBase()
    // or the deployed site (base: /ShellGuard/) 404s on every content card.
    const card = readFileSync(join(DOCS, '.vitepress', 'theme', 'components', 'Card.vue'), 'utf-8');
    expect(card).toContain("from 'vitepress'");
    expect(card).toContain('withBase');
    expect(card).toContain('normalizedHref');
    // and the template must bind the NORMALIZED href, not the raw prop
    expect(card).toContain(':href="normalizedHref"');
    expect(card).not.toContain(':href="href"');
  });

  it('dist build output (when present) emits zero unprefixed root-absolute hrefs', () => {
    // Runs against a local dist if one exists (CI/docs:build produce it).
    const distIndex = join(DOCS, '.vitepress', 'dist', 'index.html');
    if (!existsSync(distIndex)) return; // dist absent — docs:build gate covers it
    const html = readFileSync(distIndex, 'utf-8');
    // Any href="/<section>" that ALSO exists base-prefixed is a Card leak.
    const base = '/ShellGuard/';
    const unprefixed = [...html.matchAll(/href="(\/(?:getting-started|vault-features|architecture|agent-integration|superlobster|deployment|companion|reference)(?:\/[^"#]*)?)"/g)]
      .map((m) => m[1])
      .filter((u) => !u.startsWith(base));
    expect(unprefixed).toEqual([]);
  });
});