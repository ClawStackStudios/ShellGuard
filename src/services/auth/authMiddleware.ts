import { Request, Response, NextFunction } from "express";
import db from "../../server/database/index.ts";

export interface LobsterAuthRequest extends Request {
  lobster?: {
    uuid: string;
    type: "human" | "lobster";
    permissions?: any;
  };
}

/**
 * 🛡️ requireAuth Middleware (The Carapace Guard)
 */
export function requireAuth(req: LobsterAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No identity artifact presented." });
  }

  const token = authHeader.split(" ")[1];
  // Expiry is compared as JS dates: ISO8601 strings do NOT order correctly
  // against SQLite's CURRENT_TIMESTAMP format.
  const session = db.prepare("SELECT * FROM api_tokens WHERE key = ?").get(token) as any;

  if (!session || (session.expires_at && new Date(session.expires_at) <= new Date())) {
    return res.status(401).json({ error: "Identity artifact expired or invalid." });
  }

  req.lobster = {
    uuid: session.owner_uuid,
    type: session.owner_type,
    permissions: session.permissions ? JSON.parse(session.permissions) : undefined,
  };

  next();
}

/**
 * 🛡️ requirePermission Middleware (Claw Strength Check)
 */
export function requirePermission(permission: string) {
  return (req: LobsterAuthRequest, res: Response, next: NextFunction) => {
    if (!req.lobster) return res.status(401).json({ error: "Not authenticated." });

    if (req.lobster.type === "human") return next(); // Humans have full claw strength

    const perms = req.lobster.permissions;
    if (!perms || !perms[permission]) {
      return res.status(403).json({ error: "Insufficient claw strength for this action." });
    }

    next();
  };
}
