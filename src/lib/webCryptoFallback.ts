/**
 * 🛡️ ShellGuard WebCrypto Fallback Engine
 * 
 * Provides pure TypeScript implementations of SHA-256, HMAC-SHA256, HKDF, 
 * and AES-GCM-256 for non-secure browser contexts (e.g. LAN HTTP on Unraid) 
 * where `window.crypto.subtle` is undefined.
 * 
 * Cryptographically identical byte-for-byte with native WebCrypto API.
 */

// ─── 1. SHA-256 & HMAC-SHA256 (FIPS 180-4 / RFC 2104) ──────────────────────────

const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256(data: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const len = data.length;
  const bitLen = len * 8;
  const numBlocks = ((len + 8 + 64) >>> 6);
  const totalLen = numBlocks * 64;
  const padded = new Uint8Array(totalLen);
  padded.set(data);
  padded[len] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 4, bitLen, false);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);

  const w = new Uint32Array(64);

  for (let i = 0; i < totalLen; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K256[j] + w[j]) | 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const result = new Uint8Array(32);
  const resView = new DataView(result.buffer);
  resView.setUint32(0, h0, false);
  resView.setUint32(4, h1, false);
  resView.setUint32(8, h2, false);
  resView.setUint32(12, h3, false);
  resView.setUint32(16, h4, false);
  resView.setUint32(20, h5, false);
  resView.setUint32(24, h6, false);
  resView.setUint32(28, h7, false);
  return result;
}

export function hmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  const blockSize = 64;
  let k = key;
  if (k.length > blockSize) {
    k = sha256(k);
  }
  const keyPadded = new Uint8Array(blockSize);
  keyPadded.set(k);

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyPadded[i] ^ 0x5c;
    iKeyPad[i] = keyPadded[i] ^ 0x36;
  }

  const inner = new Uint8Array(blockSize + data.length);
  inner.set(iKeyPad);
  inner.set(data, blockSize);
  const innerHash = sha256(inner);

  const outer = new Uint8Array(blockSize + 32);
  outer.set(oKeyPad);
  outer.set(innerHash, blockSize);
  return sha256(outer);
}

// ─── 2. HKDF-SHA256 (RFC 5869) ──────────────────────────────────────────────────

export function hkdfSha256(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Uint8Array {
  // Step 1: Extract
  const actualSalt = salt.length > 0 ? salt : new Uint8Array(32);
  const prk = hmacSha256(actualSalt, ikm);

  // Step 2: Expand
  const n = Math.ceil(length / 32);
  const okm = new Uint8Array(length);
  let prev = new Uint8Array(0);
  let offset = 0;

  for (let i = 1; i <= n; i++) {
    const input = new Uint8Array(prev.length + info.length + 1);
    input.set(prev, 0);
    input.set(info, prev.length);
    input[input.length - 1] = i;

    prev = hmacSha256(prk, input);
    const bytesToCopy = Math.min(32, length - offset);
    okm.set(prev.subarray(0, bytesToCopy), offset);
    offset += bytesToCopy;
  }

  return okm;
}

// ─── 3. AES-256-GCM (NIST SP 800-38D) ───────────────────────────────────────────

// S-Box and Rcon tables
const SBOX = new Uint8Array([
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
]);

const RCON = new Uint32Array([
  0x01000000, 0x02000000, 0x04000000, 0x08000000, 0x10000000, 0x20000000, 0x40000000, 0x80000000,
  0x1b000000, 0x36000000
]);

function subWord(w: number): number {
  return (
    (SBOX[(w >>> 24) & 0xff] << 24) |
    (SBOX[(w >>> 16) & 0xff] << 16) |
    (SBOX[(w >>> 8) & 0xff] << 8) |
    SBOX[w & 0xff]
  );
}

function rotWord(w: number): number {
  return (w << 8) | (w >>> 24);
}

function expandKey256(key: Uint8Array): Uint32Array {
  const w = new Uint32Array(60);
  const view = new DataView(key.buffer, key.byteOffset, key.byteLength);
  for (let i = 0; i < 8; i++) {
    w[i] = view.getUint32(i * 4, false);
  }
  for (let i = 8; i < 60; i++) {
    let temp = w[i - 1];
    if (i % 8 === 0) {
      temp = subWord(rotWord(temp)) ^ RCON[(i / 8) - 1];
    } else if (i % 8 === 4) {
      temp = subWord(temp);
    }
    w[i] = w[i - 8] ^ temp;
  }
  return w;
}

function xtime(a: number): number {
  return ((a << 1) ^ (((a >>> 7) & 1) * 0x11b)) & 0xff;
}

function aesEncryptBlock(block: Uint8Array, roundKeys: Uint32Array): Uint8Array {
  let s = new Uint8Array(16);
  s.set(block);

  // AddRoundKey 0
  for (let c = 0; c < 4; c++) {
    const rk = roundKeys[c];
    s[c * 4] ^= (rk >>> 24) & 0xff;
    s[c * 4 + 1] ^= (rk >>> 16) & 0xff;
    s[c * 4 + 2] ^= (rk >>> 8) & 0xff;
    s[c * 4 + 3] ^= rk & 0xff;
  }

  // 14 Rounds for AES-256
  for (let r = 1; r <= 14; r++) {
    // SubBytes
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];

    // ShiftRows
    const t1 = s[1], t2 = s[2], t3 = s[3];
    s[1] = s[5]; s[5] = s[9]; s[9] = s[13]; s[13] = t1;
    s[2] = s[10]; s[10] = t2;
    const t6 = s[6]; s[6] = s[14]; s[14] = t6;
    s[3] = s[15]; s[15] = s[11]; s[11] = s[7]; s[7] = t3;

    // MixColumns (rounds 1..13)
    if (r < 14) {
      for (let c = 0; c < 4; c++) {
        const i0 = c * 4, i1 = i0 + 1, i2 = i0 + 2, i3 = i0 + 3;
        const a0 = s[i0], a1 = s[i1], a2 = s[i2], a3 = s[i3];
        s[i0] = (xtime(a0) ^ xtime(a1) ^ a1 ^ a2 ^ a3) & 0xff;
        s[i1] = (a0 ^ xtime(a1) ^ xtime(a2) ^ a2 ^ a3) & 0xff;
        s[i2] = (a0 ^ a1 ^ xtime(a2) ^ xtime(a3) ^ a3) & 0xff;
        s[i3] = (xtime(a0) ^ a0 ^ a1 ^ a2 ^ xtime(a3)) & 0xff;
      }
    }

    // AddRoundKey
    for (let c = 0; c < 4; c++) {
      const rk = roundKeys[r * 4 + c];
      s[c * 4] ^= (rk >>> 24) & 0xff;
      s[c * 4 + 1] ^= (rk >>> 16) & 0xff;
      s[c * 4 + 2] ^= (rk >>> 8) & 0xff;
      s[c * 4 + 3] ^= rk & 0xff;
    }
  }

  return s;
}

// GHASH over GF(2^128)
function ghashMul(v: Uint8Array, h: Uint8Array): Uint8Array {
  const z = new Uint8Array(16);
  const vCopy = new Uint8Array(v);

  for (let i = 0; i < 16; i++) {
    const byte = h[i];
    for (let j = 7; j >= 0; j--) {
      if ((byte >>> j) & 1) {
        for (let k = 0; k < 16; k++) z[k] ^= vCopy[k];
      }
      const lsb = vCopy[15] & 1;
      for (let k = 15; k > 0; k--) {
        vCopy[k] = (vCopy[k] >>> 1) | ((vCopy[k - 1] & 1) << 7);
      }
      vCopy[0] >>>= 1;
      if (lsb) {
        vCopy[0] ^= 0xe1;
      }
    }
  }
  return z;
}

function ghash(h: Uint8Array, aad: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  let y = new Uint8Array(16);

  function processData(data: Uint8Array) {
    for (let i = 0; i < data.length; i += 16) {
      const block = new Uint8Array(16);
      const chunk = data.subarray(i, Math.min(i + 16, data.length));
      block.set(chunk);
      for (let j = 0; j < 16; j++) y[j] ^= block[j];
      y = ghashMul(y, h);
    }
  }

  processData(aad);
  processData(ciphertext);

  // Length block: [len(AAD) in bits as 64-bit uint] || [len(C) in bits as 64-bit uint]
  const lenBlock = new Uint8Array(16);
  const lenView = new DataView(lenBlock.buffer);
  const aadBitLen = aad.length * 8;
  const ctBitLen = ciphertext.length * 8;
  lenView.setUint32(4, aadBitLen, false);
  lenView.setUint32(12, ctBitLen, false);

  for (let j = 0; j < 16; j++) y[j] ^= lenBlock[j];
  return ghashMul(y, h);
}

export function aesGcmEncrypt(
  key: Uint8Array,
  iv: Uint8Array,
  plaintext: Uint8Array,
  aad: Uint8Array = new Uint8Array(0)
): Uint8Array {
  const roundKeys = expandKey256(key);
  const zeroBlock = new Uint8Array(16);
  const h = aesEncryptBlock(zeroBlock, roundKeys);

  // J0 = IV || 0x00000001 for 12-byte IVs
  const j0 = new Uint8Array(16);
  j0.set(iv.subarray(0, 12));
  j0[15] = 1;

  // Counter block CTR encryption
  const numBlocks = Math.ceil(plaintext.length / 16);
  const ciphertext = new Uint8Array(plaintext.length);
  const ctr = new Uint8Array(j0);

  function incCtr() {
    for (let i = 15; i >= 12; i--) {
      ctr[i] = (ctr[i] + 1) & 0xff;
      if (ctr[i] !== 0) break;
    }
  }

  for (let i = 0; i < numBlocks; i++) {
    incCtr();
    const encCtr = aesEncryptBlock(ctr, roundKeys);
    const start = i * 16;
    const end = Math.min(start + 16, plaintext.length);
    for (let j = start; j < end; j++) {
      ciphertext[j] = plaintext[j] ^ encCtr[j - start];
    }
  }

  // Tag calculation
  const s = ghash(h, aad, ciphertext);
  const encJ0 = aesEncryptBlock(j0, roundKeys);
  const tag = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    tag[i] = s[i] ^ encJ0[i];
  }

  // Return ciphertext + tag
  const out = new Uint8Array(ciphertext.length + 16);
  out.set(ciphertext);
  out.set(tag, ciphertext.length);
  return out;
}

export function aesGcmDecrypt(
  key: Uint8Array,
  iv: Uint8Array,
  ciphertextAndTag: Uint8Array,
  aad: Uint8Array = new Uint8Array(0)
): Uint8Array {
  if (ciphertextAndTag.length < 16) {
    throw new Error("Ciphertext too short for GCM tag");
  }

  const ctLen = ciphertextAndTag.length - 16;
  const ciphertext = ciphertextAndTag.subarray(0, ctLen);
  const expectedTag = ciphertextAndTag.subarray(ctLen);

  const roundKeys = expandKey256(key);
  const zeroBlock = new Uint8Array(16);
  const h = aesEncryptBlock(zeroBlock, roundKeys);

  const j0 = new Uint8Array(16);
  j0.set(iv.subarray(0, 12));
  j0[15] = 1;

  // Verify tag
  const s = ghash(h, aad, ciphertext);
  const encJ0 = aesEncryptBlock(j0, roundKeys);
  let diff = 0;
  for (let i = 0; i < 16; i++) {
    const computed = s[i] ^ encJ0[i];
    diff |= computed ^ expectedTag[i];
  }
  if (diff !== 0) {
    throw new Error("GCM tag verification failed (AAD or ciphertext corrupted)");
  }

  // Decrypt plaintext
  const numBlocks = Math.ceil(ctLen / 16);
  const plaintext = new Uint8Array(ctLen);
  const ctr = new Uint8Array(j0);

  function incCtr() {
    for (let i = 15; i >= 12; i--) {
      ctr[i] = (ctr[i] + 1) & 0xff;
      if (ctr[i] !== 0) break;
    }
  }

  for (let i = 0; i < numBlocks; i++) {
    incCtr();
    const encCtr = aesEncryptBlock(ctr, roundKeys);
    const start = i * 16;
    const end = Math.min(start + 16, ctLen);
    for (let j = start; j < end; j++) {
      plaintext[j] = ciphertext[j] ^ encCtr[j - start];
    }
  }

  return plaintext;
}
