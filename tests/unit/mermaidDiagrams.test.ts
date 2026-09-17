import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it, expect } from 'vitest'

/**
 * Mermaid diagram integrity — every fenced mermaid block in README.md and the
 * docs tree must PARSE. A mermaid block that fails to parse renders as a
 * raw code block on GitHub (and, without the vitepress-plugin-mermaid plugin,
 * on the portal) — the exact defect class fixed 2026-09-16 (README's unquoted
 * `{success, data}` node label; the portal missing withMermaid() entirely).
 *
 * Parse strategy: mermaid.parse() requires a DOM; vitest's default node env
 * lacks one, so we validate the structural contract that actually killed
 * rendering twice: (1) every fence is closed; (2) no fatal label syntax —
 * unquoted { } ( ) inside node labels or unquoted edge labels. Quoted labels
 * may contain braces (valid mermaid). If a diagram breaks rendering again,
 * this suite names the file, block, and offending line.
 */

const ROOT = join(__dirname, '../..')

function walkMd(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walkMd(p))
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

const FILES = [join(ROOT, 'README.md'), ...walkMd(join(ROOT, 'docs'))]
  .map((p) => relative(ROOT, p))

interface Block { file: string; index: number; startLine: number; body: string }

function collectBlocks(): Block[] {
  const blocks: Block[] = []
  for (const file of FILES) {
    const lines = readFileSync(join(ROOT, file), 'utf-8').split('\n')
    let i = 0
    let idx = 0
    while (i < lines.length) {
      if (lines[i].trim() === '```mermaid') {
        idx += 1
        const start = i + 1
        const body: string[] = []
        let j = i + 1
        while (j < lines.length && lines[j].trim() !== '```') {
          body.push(lines[j])
          j += 1
        }
        blocks.push({ file, index: idx, startLine: start, body: body.join('\n') })
        i = j
      }
      i += 1
    }
  }
  return blocks
}

const ALL_BLOCKS = collectBlocks()

// Unquoted { } or ( ) inside a node label: Label[...] / Label("...") variants —
// any bracketed label region not wrapped in quotes containing braces or parens.
const FATAL_NODE_LABEL =
  /^\s*[\w-]+\[[^\]"'\r\n]*[{}()][^\]"'\r\n]*\]/m
// Unquoted edge label containing braces: -->|{...}|
const FATAL_EDGE_LABEL = /-->\|[^|"]*[{}][^|"]*\|/

describe('mermaid diagram integrity (README + docs/**)', () => {
  it('collects at least one mermaid block (guard against silent sweep loss)', () => {
    expect(ALL_BLOCKS.length).toBeGreaterThanOrEqual(10)
    expect(FILES).toContain('README.md')
    expect(FILES.some((f) => f.startsWith('docs/companion/'))).toBe(true)
  })

  it('every mermaid fence is closed', () => {
    const withMermaid = FILES.filter((file) =>
      readFileSync(join(ROOT, file), 'utf-8').includes('```mermaid'),
    )
    expect(withMermaid.length).toBeGreaterThanOrEqual(10)
    for (const file of withMermaid) {
      const src = readFileSync(join(ROOT, file), 'utf-8')
      const body = src.split(/^```mermaid$/m).slice(1)
      for (const seg of body) {
        expect(seg.trim().includes('```'), `${file}: unclosed mermaid fence`).toBe(true)
      }
    }
  })

  it('no fatal unquoted braces/parens in node labels', () => {
    const failures: string[] = []
    for (const b of ALL_BLOCKS) {
      b.body.split('\n').forEach((line, k) => {
        if (FATAL_NODE_LABEL.test(line)) {
          failures.push(`${b.file} block${b.index} line ${b.startLine + k}: ${line.trim()}`)
        }
      })
    }
    expect(failures, `\n${failures.join('\n')}`).toEqual([])
  })

  it('no fatal unquoted braces in edge labels', () => {
    const failures: string[] = []
    for (const b of ALL_BLOCKS) {
      b.body.split('\n').forEach((line, k) => {
        if (FATAL_EDGE_LABEL.test(line)) {
          failures.push(`${b.file} block${b.index} line ${b.startLine + k}: ${line.trim()}`)
        }
      })
    }
    expect(failures, `\n${failures.join('\n')}`).toEqual([])
  })

  it('quoted labels may contain braces (valid mermaid) — spot-check the known-good cases', () => {
    const readMe = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    expect(readMe).toContain('REST["RestAdapter<br/>unwraps {success, data}"]')
    const idx = readFileSync(join(ROOT, 'docs/index.md'), 'utf-8')
    expect(idx).toContain('-->|"{v, alg, iv, ct, aad}"|')
  })
})