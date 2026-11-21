import { CorsOptions } from 'cors';

const CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
const CORS_ALLOWED_HEADERS = ["Content-Type", "Authorization", "X-Requested-With"];
const CORS_EXPOSED_HEADERS = [
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
  "RateLimit-Limit",
  "RateLimit-Remaining",
  "RateLimit-Reset",
  "Retry-After",
];

/**
 * True when hostname is loopback, RFC 1918 LAN IPv4, Tailscale CGNAT/ULA,
 * or a Tailscale MagicDNS (*.ts.net) hostname.
 */
export function isPrivateNetworkHostname(rawHostname: string): boolean {
  const hostname = rawHostname.replace(/^\[|\]$/g, '').trim().toLowerCase();
  if (!hostname) return false;

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true;
  }

  const isPrivateIP =
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    hostname.startsWith('fd7a:115c:a1e0:');

  if (isPrivateIP) return true;

  // Tailscale MagicDNS (*.ts.net) — require at least one subdomain label before .ts.net
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.ts\.net$/.test(hostname);
}

export function getCorsConfig(): CorsOptions {
  // Inverted check: ONLY development and test activate permissive mode.
  // Any typos like NODE_ENV=prod or staging default strictly to production hardening.
  const isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const corsOrigin = process.env.CORS_ORIGIN;

  // Development mode: Allow all local origins (localhost + LAN IPs)
  if (isDevelopment) {
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        try {
          const url = new URL(origin);
          if (isPrivateNetworkHostname(url.hostname)) return callback(null, true);

          // In Dev: Allow all origins to prevent friction during LAN testing
          return callback(null, true);
        } catch (err) {
          callback(new Error(`CORS: Invalid origin format: ${origin}`));
        }
      },
      credentials: true,
      methods: CORS_METHODS,
      allowedHeaders: CORS_ALLOWED_HEADERS,
      exposedHeaders: CORS_EXPOSED_HEADERS,
      maxAge: 3600,
    };
  }

  // LAN mode: If CORS_ORIGIN not set, allow local network & Tailscale mesh access
  if (!corsOrigin) {
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) {
          return callback(null, true);
        }

        // Parse the origin URL
        try {
          const url = new URL(origin);
          if (isPrivateNetworkHostname(url.hostname)) {
            return callback(null, true);
          }

          // Reject public IPs/domains when in LAN mode
          console.warn(`⚠️ CORS: Rejected public origin in LAN mode: ${origin}`);
          console.warn(`   Set CORS_ORIGIN to allow this origin explicitly`);
          callback(new Error(`CORS: Public origins not allowed in LAN mode. Set CORS_ORIGIN.`));
        } catch (err) {
          callback(new Error(`CORS: Invalid origin format: ${origin}`));
        }
      },
      credentials: true,
      methods: CORS_METHODS,
      allowedHeaders: CORS_ALLOWED_HEADERS,
      exposedHeaders: CORS_EXPOSED_HEADERS,
      maxAge: 3600,
    };
  }

  // Strict mode: CORS_ORIGIN is set (for reverse proxy/CF tunnel)
  // Strip trailing slashes and support wildcard '*'
  const allowedOrigins = corsOrigin
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowsWildcard = allowedOrigins.includes("*");

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/+$/, '');

      if (allowsWildcard || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS: Rejected origin: ${origin}`);
        callback(new Error(`CORS: Origin not in allowed list`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "Retry-After"],
    maxAge: 86400,
  };
}
