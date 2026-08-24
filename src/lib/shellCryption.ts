export async function deriveShellKey(huKey: string, userUuid: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(huKey),
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode(userUuid),
      info: encoder.encode("clawchives-shellcryption-v1")
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
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
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aadString = `${table}:${recordId}`;
  const aad = encoder.encode(aadString);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      additionalData: aad
    },
    shellKey,
    encoder.encode(plaintext)
  );

  const encryptedField: EncryptedField = {
    v: 1,
    alg: "AES-GCM-256",
    iv: arrayBufferToBase64(iv),
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

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
        additionalData: encoder.encode(expectedAad)
      },
      shellKey,
      ciphertext
    );

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
