import { Router } from 'express';
import crypto from 'crypto';
import db from '../database/index.js';
import { getRotationManifest, isTlsServerActive } from '../utils/tlsManager.js';
import { buildReachabilityVectors, detectHostTopology } from '../utils/networkTopology.js';
import { getInstancePublicKeyHex } from '../utils/instanceKey.js';
import { isDisableSignupsEnforced } from '../config/envValidator.js';

const router = Router();

// Warm MagicDNS topology cache asynchronously at module load so /endpoints stays <2ms
void detectHostTopology().catch(() => {});

router.get('/endpoints', (req, res) => {
  const protocol: 'http' | 'https' =
    isTlsServerActive() || req.secure || process.env.TLS_ENABLED === 'true' ? 'https' : 'http';
  const parsedPort = parseInt(process.env.PORT || '6565', 10);
  const port = Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535 ? 6565 : parsedPort;

  const data = buildReachabilityVectors({
    protocol,
    port,
    currentHost: req.hostname,
  });

  res.json({ success: true, data });
});

router.get('/tls-manifest', (_req, res) => {
  const manifest = getRotationManifest();
  if (!manifest) return res.status(404).json({ success: false, error: 'Manifest not found' });
  res.json({ success: true, data: { certFingerprint: manifest.certFingerprint, instancePublicKey: getInstancePublicKeyHex(), timestamp: manifest.timestamp, signature: manifest.signature } });
});

function areSignupsDisabled(): boolean {
  if (isDisableSignupsEnforced()) return true;
  try {
    const row = db.prepare("SELECT value FROM system_settings WHERE key = 'allow_signups'").get() as { value: string } | undefined;
    if (row && row.value === 'false') return true;
  } catch {}
  return false;
}

router.get('/signup-status', (req, res) => {
  const invite = req.query.invite as string;
  const isSignupsDisabled = areSignupsDisabled();

  const lobsterCountRow = db.prepare('SELECT COUNT(*) as count FROM lobsters').get() as { count: number };
  if (lobsterCountRow.count === 0) return res.json({ success: true, data: { signupsAllowed: true, reason: 'genesis' } });

  if (!isSignupsDisabled) return res.json({ success: true, data: { signupsAllowed: true, reason: 'open' } });

  if (invite) {
    const hashedInvite = crypto.createHash('sha256').update(invite).digest('hex');
    const tokenRow = db.prepare("SELECT expires_at FROM api_tokens WHERE key = ? AND owner_type = 'invite'").get(hashedInvite) as { expires_at: string } | undefined;
    if (tokenRow && new Date(tokenRow.expires_at).getTime() > Date.now()) {
      return res.json({ success: true, data: { signupsAllowed: true, reason: 'valid_invite' } });
    } else {
      return res.json({ success: true, data: { signupsAllowed: false, reason: 'invalid_invite' } });
    }
  }
  return res.json({ success: true, data: { signupsAllowed: false, reason: 'disabled' } });
});

export default router;
