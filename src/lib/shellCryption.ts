import { hkdfSha256, aesGcmEncrypt, aesGcmDecrypt } from './webCryptoFallback.ts';

export interface ShellKeyFallback {
  _rawKey: Uint8Array;
  type: 'secret';
  extractable: boolean;
  algorithm: { name: 'AES-GCM'; length: 256 };
  usages: KeyUsage[];
}

export type ShellKey = CryptoKey | ShellKeyFallback;

export async function deriveShellKey(huKey: string, userUuid: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const ikm = encoder.encode(huKey);
  const salt = encoder.encode(userUuid);
  const info = encoder.encode("clawchives-shellcryption-v1");

  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.importKey === 'function') {
    try {
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        ikm,
        { name: "HKDF" },
        false,
        ["deriveKey"]
      );

      return await crypto.subtle.deriveKey(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt,
          info
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
    } catch {
      // Fall through to fallback
    }
  }

  // Pure TypeScript fallback engine for non-secure HTTP contexts (Unraid LAN)
  const rawKey = hkdfSha256(ikm, salt, info, 32);
  const keyObj: ShellKeyFallback = {
    _rawKey: rawKey,
    type: 'secret',
    extractable: false,
    algorithm: { name: 'AES-GCM', length: 256 },
    usages: ['encrypt', 'decrypt']
  };
  return keyObj as unknown as CryptoKey;
}

export interface EncryptedField {
  v: number;
  alg: string;
  iv: string;
  ct: string;
  aad: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptField(plaintext: string, shellKey: CryptoKey, table: string, recordId: string): Promise<string> {
  if ((import.meta as any).env?.VITE_SHELLCRYPTION_ENABLED === 'false') {
    return plaintext;
  }

  const encoder = new TextEncoder();
  const iv = (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function')
    ? crypto.getRandomValues(new Uint8Array(12))
    : new Uint8Array(12).map(() => (Math.random() * 256) | 0);
  const aadString = `${table}:${recordId}`;
  const aad = encoder.encode(aadString);

  let ciphertextBuffer: ArrayBuffer;

  if ((shellKey as any)?._rawKey) {
    const rawKey = (shellKey as any)._rawKey as Uint8Array;
    const ctAndTag = aesGcmEncrypt(rawKey, iv, encoder.encode(plaintext), aad);
    ciphertextBuffer = ctAndTag.buffer.slice(ctAndTag.byteOffset, ctAndTag.byteOffset + ctAndTag.byteLength);
  } else if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.encrypt === 'function') {
    ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: aad
      },
      shellKey,
      encoder.encode(plaintext)
    );
  } else {
    // If shellKey is a CryptoKey but subtle is gone, fallback by deriving key again
    throw new Error("No cryptographic engine available for AES-GCM encryption");
  }

  const encryptedField: EncryptedField = {
    v: 1,
    alg: "AES-GCM-256",
    iv: arrayBufferToBase64(iv.buffer),
    ct: arrayBufferToBase64(ciphertextBuffer),
    aad: aadString
  };

  return JSON.stringify(encryptedField);
}

export async function decryptField(encryptedJson: string, shellKey: CryptoKey, table: string, recordId: string): Promise<string> {
  try {
    const encryptedField: EncryptedField = JSON.parse(encryptedJson);
    
    // Check if it matches our EncryptedField shape
    if (!encryptedField.v || !encryptedField.alg || !encryptedField.iv || !encryptedField.ct) {
      return encryptedJson; // Plaintext that happens to be JSON
    }

    const iv = base64ToArrayBuffer(encryptedField.iv);
    const ciphertext = base64ToArrayBuffer(encryptedField.ct);
    const encoder = new TextEncoder();
    const expectedAad = `${table}:${recordId}`;
    
    if (encryptedField.aad !== expectedAad) {
      throw new Error("AAD mismatch");
    }

    let decryptedBuffer: ArrayBuffer;

    if ((shellKey as any)?._rawKey) {
      const rawKey = (shellKey as any)._rawKey as Uint8Array;
      const pt = aesGcmDecrypt(
        rawKey, 
        new Uint8Array(iv), 
        new Uint8Array(ciphertext), 
        encoder.encode(expectedAad)
      );
      decryptedBuffer = pt.buffer.slice(pt.byteOffset, pt.byteOffset + pt.byteLength);
    } else if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.decrypt === 'function') {
      decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(iv),
          additionalData: encoder.encode(expectedAad)
        },
        shellKey,
        ciphertext
      );
    } else {
      throw new Error("No cryptographic engine available for AES-GCM decryption");
    }

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (e) {
    if (e instanceof SyntaxError) {
      // It's not JSON, so it must be plaintext (unencrypted)
      return encryptedJson;
    }
    console.error("Decryption failed", e);
    return "⚠️ [Decryption Failed]";
  }
}
