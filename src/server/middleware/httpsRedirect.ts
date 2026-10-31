import { Request, Response, NextFunction } from 'express';
import { isTlsServerActive } from '../utils/tlsManager.js';

export function getSafeHttpsPort(): number {
  const raw = process.env.HTTPS_PORT;
  if (!raw) return 443;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    return 443;
  }
  return parsed;
}

export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  // Always exempt container health probe endpoint to prevent redirect loops on internal health checks
  if (req.path === '/api/health') {
    return next();
  }

  const shouldEnforce = process.env.ENFORCE_HTTPS === 'true' || isTlsServerActive();

  if (process.env.NODE_ENV === 'test' && !shouldEnforce) {
    return next();
  }

  if (shouldEnforce) {
    // Parse comma-separated X-Forwarded-Proto for multi-proxy chains (e.g. Cloudflare -> Nginx -> ShellGuard)
    const headerVal = req.headers['x-forwarded-proto'];
    const forwardedProto = Array.isArray(headerVal)
      ? headerVal[0]?.split(',')[0]?.trim().toLowerCase()
      : typeof headerVal === 'string'
        ? headerVal.split(',')[0]?.trim().toLowerCase()
        : undefined;

    const isSecure = req.secure || forwardedProto === 'https';
    if (!isSecure) {
      const port = getSafeHttpsPort();
      const host = req.hostname;
      const portSuffix = port === 443 ? '' : `:${port}`;
      return res.redirect(301, `https://${host}${portSuffix}${req.originalUrl}`);
    }
  }
  next();
};

