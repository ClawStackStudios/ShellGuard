import { describe, it, expect } from 'vitest'
import { generateSshKeyPair, keypairGenerationSupported, parseSshKeySecret, serializeSshKeySecret, formatAuthorizedKeysCommand } from '../../src/lib/keyGen'
import { buildPodTree } from '../../src/lib/podUtils'
import type { VaultItem } from '../../src/types'

/**
 * Phase 18 Task 35 oracle:
 *  A. Keypair engine — real WebCrypto generation (Node 22 webcrypto supports
 *     Ed25519 + RSA-4096), format-verified against the SSH/RFC wire specs.
 *  B. Pod-count decoupling — attachment-type items in the in-memory corpus
 *     NEVER inflate pod tallies (buildPodTree filters to primary types).
 */

const subtle = globalThis.crypto?.subtle
const d = subtle ? describe : describe.skip

function decodeWireB64(line: string): { kind: string; parts: Uint8Array[] } {
  const b = line.trim().split(/\s+/)[1]
  const buf = Uint8Array.from(atob(b), (c) => c.charCodeAt(0))
  const view = (o: number, l: number) => buf.slice(o, o + l)
  const readStr = (o: number): [string, number] => {
    const len = (buf[o] << 24) | (buf[o + 1] << 16) | (buf[o + 2] << 8) | buf[o + 3]
    return [new TextDecoder().decode(view(o + 4, len)), o + 4 + len]
  }
  const [kind, o1] = readStr(0)
  const parts: Uint8Array[] = []
  let o = o1
  while (o < buf.length) {
    const len = (buf[o] << 24) | (buf[o + 1] << 16) | (buf[o + 2] << 8) | buf[o + 3]
    parts.push(view(o + 4, len))
    o += 4 + len
  }
  return { kind, parts }
}

d('keypair generation engine (secure-context WebCrypto)', () => {
  it('reports support in this environment', () => {
    expect(keypairGenerationSupported()).toBe(true)
  })

  it('generates an Ed25519 keypair with valid OpenSSH + RFC-4716 + PKCS#8 output', async () => {
    const kp = await generateSshKeyPair('ed25519')
    expect(kp.algorithm).toBe('ed25519')
    // OpenSSH line: kind + base64 blob + comment
    expect(kp.publicKeyOpenSsh).toMatch(/^ssh-ed25519 [A-Za-z0-9+/=]+ shellguard-generated$/)
    const { kind, parts } = decodeWireB64(kp.publicKeyOpenSsh)
    expect(kind).toBe('ssh-ed25519')
    expect(parts).toHaveLength(1)
    expect(parts[0]).toHaveLength(32) // raw Ed25519 public bits
    // RFC-4716 block wraps the same wire bytes
    expect(kp.publicKeyRfc4716).toContain('---- BEGIN SSH2 PUBLIC KEY ----')
    expect(kp.publicKeyRfc4716).toContain('Comment: shellguard-generated')
    expect(kp.publicKeyRfc4716).toContain('---- END SSH2 PUBLIC KEY ----')
    // PKCS#8 PEM structure
    expect(kp.privateKeyPkcs8Pem).toMatch(/^-----BEGIN PRIVATE KEY-----\n[A-Za-z0-9+/=\n]+-----END PRIVATE KEY-----\n?$/)
    const derB64 = kp.privateKeyPkcs8Pem.replace(/-----(BEGIN|END) PRIVATE KEY-----|\n/g, '')
    const der = Uint8Array.from(atob(derB64), (c) => c.charCodeAt(0))
    expect(der[0]).toBe(0x30) // DER SEQUENCE
    // Ed25519 PKCS#8 is small (~48 bytes); RSA-4096 is not
    expect(der.length).toBeLessThan(100)
  })

  it('generates an RSA-4096 keypair with correct SSH wire (e, n) fields', async () => {
    const kp = await generateSshKeyPair('rsa-4096')
    expect(kp.publicKeyOpenSsh).toMatch(/^ssh-rsa [A-Za-z0-9+/=]+ shellguard-generated$/)
    const { kind, parts } = decodeWireB64(kp.publicKeyOpenSsh)
    expect(kind).toBe('ssh-rsa')
    expect(parts).toHaveLength(2) // exponent + modulus
    const e = parts[0]
    // standard public exponent 0x010001 (possibly with leading zero stripped)
    const eHex = Array.from(e).map((x) => x.toString(16).padStart(2, '0')).join('')
    expect(eHex).toBe('010001')
    expect(parts[1].length).toBeGreaterThanOrEqual(512) // 4096-bit modulus
    // PKCS#8 PEM is large for RSA-4096
    expect(kp.privateKeyPkcs8Pem.length).toBeGreaterThan(3000)
  }, 30000)

  it('throws the honest LAN-HTTP error when subtle is unavailable', async () => {
    const g = globalThis as any
    const saved = g.crypto
    try {
      Object.defineProperty(g, 'crypto', { value: undefined, configurable: true })
      expect(keypairGenerationSupported()).toBe(false)
      await expect(generateSshKeyPair('ed25519')).rejects.toThrow(/secure context/)
    } finally {
      Object.defineProperty(g, 'crypto', { value: saved, configurable: true })
    }
  })
})

describe('pod-count decoupling (attachments never inflate pod tallies)', () => {
  const item = (id: string, type: VaultItem['type'], category: string): VaultItem =>
    ({ id, title: id, type, category, secret: '', username: '', url: '' } as unknown as VaultItem)

  it('attachment rows in the corpus do not change pod counts', () => {
    const primary = [
      item('p1', 'password', 'Work'),
      item('p2', 'password', 'Work/Dev'),
      item('n1', 'note', 'Work'),
      item('k1', 'key', ''),
    ]
    const withAttachments = [
      ...primary,
      item('a1', 'attachment', 'Work'),   // same pod as p1
      item('a2', 'attachment', 'Work/Dev'),
      item('a3', 'attachment', ''),
    ]
    const clean = buildPodTree(primary)
    const dirty = buildPodTree(withAttachments)
    expect(clean.totalAllCount).toBe(4)
    expect(dirty.totalAllCount).toBe(4) // unchanged
    expect(dirty.rootNodes.map((n) => `${n.path}:${n.totalCount}`))
      .toEqual(clean.rootNodes.map((n) => `${n.path}:${n.totalCount}`))
  })

  it('pod tallies count primary items per pod (Work=2, Work/Dev nested)', () => {
    const items = [
      item('p1', 'password', 'Work'),
      item('p2', 'password', 'Work/Dev'),
      item('a9', 'attachment', 'Work'),
    ]
    const { rootNodes, totalAllCount } = buildPodTree(items)
    expect(totalAllCount).toBe(2)
    const work = rootNodes.find((n) => n.path === 'Work')
    expect(work?.totalCount).toBe(2)
  })
})

describe('SSH key material parsing, serialization & authorized_keys command formatting', () => {
  const samplePub = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE58qoWUozwISBzkLzaMxtPDPhCNoGg3MlBhaZwzItpE shellguard-generated'
  const samplePriv = '-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIN9iKiNsLv/LsOYuVVEG7ltaun2ZwJreaaPVKNgxTSeU\n-----END PRIVATE KEY-----'

  it('parses JSON payload containing publicKey and privateKey', () => {
    const rawJson = JSON.stringify({ publicKey: samplePub, privateKey: samplePriv })
    const parsed = parseSshKeySecret(rawJson)
    expect(parsed.publicKey).toBe(samplePub)
    expect(parsed.privateKey).toBe(samplePriv)
  })

  it('parses raw legacy PEM without throwing, treating it as privateKey', () => {
    const parsed = parseSshKeySecret(samplePriv)
    expect(parsed.publicKey).toBeUndefined()
    expect(parsed.privateKey).toBe(samplePriv)
  })

  it('serializes both keys as JSON when public key is provided', () => {
    const serialized = serializeSshKeySecret(samplePriv, samplePub)
    expect(JSON.parse(serialized)).toEqual({
      publicKey: samplePub,
      privateKey: samplePriv,
    })
  })

  it('serializes only raw private key when public key is omitted or empty', () => {
    expect(serializeSshKeySecret(samplePriv)).toBe(samplePriv)
    expect(serializeSshKeySecret(samplePriv, '')).toBe(samplePriv)
    expect(serializeSshKeySecret(samplePriv, '   ')).toBe(samplePriv)
  })

  it('formats a terminal-ready authorized_keys one-liner', () => {
    const cmd = formatAuthorizedKeysCommand(samplePub)
    expect(cmd).toBe(`echo "${samplePub}" >> ~/.ssh/authorized_keys`)
  })
})

