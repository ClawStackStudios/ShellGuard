import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '../database/connection.js';

const KEY_PATH = path.join(DATA_DIR, 'instance.key');

let privateKeyObject: crypto.KeyObject | null = null;
let publicKeyHex: string | null = null;

function loadOrGenerateKey(): void {
  if (privateKeyObject) return; // Already loaded

  if (fs.existsSync(KEY_PATH)) {
    const pem = fs.readFileSync(KEY_PATH, 'utf8');
    privateKeyObject = crypto.createPrivateKey(pem);
  } else {
    // Generate new EC P-256 keypair
    const { privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    privateKeyObject = privateKey;
    const pem = privateKey.export({ type: 'sec1', format: 'pem' });
    fs.mkdirSync(path.dirname(KEY_PATH), { recursive: true, mode: 0o700 });
    fs.writeFileSync(KEY_PATH, pem, { mode: 0o600 });
    fs.chmodSync(KEY_PATH, 0o600); // Belt-and-braces
  }

  // Derive public key as uncompressed hex
  const pubKey = crypto.createPublicKey(privateKeyObject);
  const jwk = pubKey.export({ format: 'jwk' });
  if (!jwk.x || !jwk.y) throw new Error('Invalid instance key JWK format');

  const x = Buffer.from(jwk.x, 'base64url').toString('hex');
  const y = Buffer.from(jwk.y, 'base64url').toString('hex');
  publicKeyHex = `04${x}${y}`;
}

export function getInstancePublicKeyHex(): string {
  if (!publicKeyHex) loadOrGenerateKey();
  return publicKeyHex!;
}

export function signWithInstanceKey(data: Buffer | string): string {
  if (!privateKeyObject) loadOrGenerateKey();
  const signer = crypto.createSign('SHA256');
  signer.update(data);
  signer.end();
  return signer.sign(privateKeyObject!, 'hex');
}
