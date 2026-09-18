/**
 * In-browser SSH keypair generation (Phase 18, Task 35).
 *
 * Uses WebCrypto `crypto.subtle.generateKey` — available ONLY in secure
 * contexts (HTTPS / localhost). On bare-LAN HTTP origins `crypto.subtle` is
 * undefined and the pure-TS fallback engine (webCryptoFallback.ts) does NOT
 * implement keypair generation by design (that would be a vast new crypto
 * surface) — callers must feature-detect via `keypairGenerationSupported()`
 * and degrade gracefully (import remains the path there).
 *
 * Outputs:
 *  - public (OpenSSH one-line):  `ssh-ed25519 AAAA... shellguard-generated`
 *  - public (RFC-4716 wrapper):  `---- BEGIN SSH2 PUBLIC KEY ----` block
 *  - private (PKCS#8 PEM):       `-----BEGIN PRIVATE KEY-----` (OpenSSH >=7.8
 *    imports Ed25519 PKCS#8; universally readable) — stored ShellCrypted in
 *    `key_value` (AAD `vault_ssh_keys:{id}`), same as imported keys.
 */

export type SshKeyAlgorithm = 'ed25519' | 'rsa-4096';

export interface GeneratedSshKeyPair {
  algorithm: SshKeyAlgorithm;
  publicKeyOpenSsh: string;
  publicKeyRfc4716: string;
  privateKeyPkcs8Pem: string;
}

export function keypairGenerationSupported(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    !!crypto.subtle &&
    typeof crypto.subtle.generateKey === 'function' &&
    typeof crypto.subtle.exportKey === 'function'
  );
}

const SSH_COMMENT = 'shellguard-generated';

function b64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64Wrap(bytes: Uint8Array, width = 70): string {
  const raw = b64(bytes);
  return raw.replace(new RegExp(`(.{${width}})`, 'g'), '$1\n').trim();
}

function pem(tag: string, der: Uint8Array): string {
  return `-----BEGIN ${tag}-----\n${b64Wrap(der)}\n-----END ${tag}-----`;
}

/** SSH wire format: string-length-prefixed fields, concatenated, base64. */
function sshWireBlob(parts: Uint8Array[]): Uint8Array {
  const len = (n: number) => new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
  let size = 0;
  for (const p of parts) size += 4 + p.length;
  const out = new Uint8Array(size);
  let off = 0;
  for (const p of parts) {
    out.set(len(p.length), off); off += 4;
    out.set(p, off); off += p.length;
  }
  return out;
}

function encodeString(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function toBigIntBytes(v: bigint): Uint8Array {
  let hex = v.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function stripLeadingZero(b: Uint8Array): Uint8Array {
  let i = 0;
  while (i < b.length - 1 && b[i] === 0) i++;
  return b.slice(i);
}

/** Minimal DER walk to pull RSA (e, n) out of an SPKI structure. */
function parseRsaSpki(spki: Uint8Array): { e: bigint; n: Uint8Array } {
  let off = 0;
  const readLen = (): number => {
    const b = spki[off++];
    if (b & 0x80) {
      const n = b & 0x7f;
      let v = 0;
      for (let i = 0; i < n; i++) v = v * 256 + spki[off++];
      return v;
    }
    return b;
  };
  const skip = (n: number) => { off += n; };
  // SPKI: SEQUENCE { SEQUENCE { oid... }, BIT STRING { SEQUENCE { n INT, e INT } } }
  skip(1); readLen();            // outer SEQUENCE header
  skip(1);                       // alg SEQ tag
  const algLen = readLen();      // alg SEQ content length
  skip(algLen);                  // skip AlgorithmIdentifier (OID + NULL)
  skip(1);                       // BIT STRING tag
  readLen();                     // bit-string length
  off += 1;                      // unused-bits byte
  skip(1); readLen();            // inner SEQUENCE header
  // first INTEGER = modulus (n), second = exponent (e)
  skip(1); const nLen = readLen();
  const nRaw = spki.slice(off, off + nLen); off += nLen;
  skip(1); const eLen = readLen();
  const eRaw = spki.slice(off, off + eLen);
  const e = BigInt('0x' + Array.from(eRaw).map((x) => x.toString(16).padStart(2, '0')).join(''));
  return { e, n: nRaw };
}

export async function generateSshKeyPair(
  algorithm: SshKeyAlgorithm = 'ed25519',
  comment: string = SSH_COMMENT,
): Promise<GeneratedSshKeyPair> {
  if (!keypairGenerationSupported()) {
    throw new Error(
      'Keypair generation requires a secure context (HTTPS or localhost). ' +
      'On plain-HTTP LAN origins, import an existing SSH key instead.',
    );
  }

  let keyPair: CryptoKeyPair;
  let wire: Uint8Array;
  let kind: 'ssh-ed25519' | 'ssh-rsa';
  let privDer: Uint8Array;

  if (algorithm === 'ed25519') {
    keyPair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    kind = 'ssh-ed25519';
    // Ed25519 SSH wire: kind-string + raw 32-byte public key (SPKI's last 32 bytes).
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey));
    wire = sshWireBlob([encodeString(kind), spki.slice(spki.length - 32)]);
    privDer = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  } else {
    keyPair = (await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    kind = 'ssh-rsa';
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey));
    const { e, n } = parseRsaSpki(spki);
    // SSH mpint is SIGNED: keep DER's leading 0x00 when the high bit is set —
    // stripping it produces a different (yet still valid-ish) base64 that does
    // NOT match ssh-keygen's canonical encoding. Verified against ssh-keygen -y.
    wire = sshWireBlob([encodeString(kind), toBigIntBytes(e), n]);
    privDer = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  }

  const publicKeyOpenSsh = `${kind} ${b64(wire)} ${comment}`;
  const publicKeyRfc4716 =
    `---- BEGIN SSH2 PUBLIC KEY ----\n${b64Wrap(wire)}\nComment: ${comment}\n---- END SSH2 PUBLIC KEY ----`;
  const privateKeyPkcs8Pem = pem('PRIVATE KEY', privDer);

  return { algorithm, publicKeyOpenSsh, publicKeyRfc4716, privateKeyPkcs8Pem };
}
