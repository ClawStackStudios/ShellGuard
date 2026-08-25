import { Router } from "express";
import db from "../../server/database/index.ts";
import crypto from "crypto";

const router = Router();

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * 🦞 POST /api/auth/register
 * Initialize a new Lobster identity.
 */
router.post("/register", (req, res) => {
  const { username, displayName, keyHash, uuid } = req.body;

  if (!username || !keyHash || !uuid) {
    return res.status(400).json({ error: "Username, KeyHash, and UUID are required." });
  }

  const finalDisplayName = displayName?.trim() || username;

  try {
    db.prepare("INSERT INTO lobsters (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(
      uuid,
      username,
      finalDisplayName,
      keyHash,
      new Date().toISOString()
    );
    res.status(201).json({ uuid, username, displayName: finalDisplayName, message: "Shell hardened. Identity created." });
  } catch (err: any) {
    console.error("Registration error:", err);
    if (err.code === "SQLITE_CONSTRAINT" || err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Username already scuttled." });
    }
    res.status(500).json({ error: "Bedrock failure: " + err.message });
  }
});

/**
 * 🦞 POST /api/auth/lookup
 * Look up user by keyHash for paste login.
 */
router.post("/lookup", (req, res) => {
  const { keyHash } = req.body;

  if (!keyHash) {
    return res.status(400).json({ error: "KeyHash is required." });
  }

  try {
    const lobster = db.prepare("SELECT * FROM lobsters WHERE key_hash = ?").get(keyHash) as any;

    if (!lobster) {
      return res.status(404).json({ error: "Identity not found." });
    }

    res.json({
      uuid: lobster.uuid,
      username: lobster.username,
      displayName: lobster.display_name || lobster.username
    });
  } catch (err: any) {
    console.error("Lookup error:", err);
    res.status(500).json({ error: "Bedrock failure looking up identity." });
  }
});

/**
 * 🦞 POST /api/auth/token
 * Exchange hu- key hash for an api- token.
 */
router.post("/token", (req, res) => {
  const { uuid, keyHash } = req.body;

  if (!uuid || !keyHash) {
    return res.status(400).json({ error: "UUID and KeyHash are required." });
  }

  try {
    const lobster = db.prepare("SELECT * FROM lobsters WHERE uuid = ?").get(uuid) as any;

    if (!lobster || !constantTimeCompare(lobster.key_hash, keyHash)) {
      return res.status(401).json({ error: "Identity mismatch." });
    }

    const token = `api-${crypto.randomBytes(16).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins

    db.prepare("INSERT INTO api_tokens (key, owner_uuid, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").run(
      token,
      lobster.uuid,
      "human",
      new Date().toISOString(),
      expiresAt
    );

    res.json({ 
      token, 
      uuid: lobster.uuid, 
      username: lobster.username, 
      displayName: lobster.display_name || lobster.username,
      type: "human" 
    });
  } catch (err: any) {
    console.error("Token generation error:", err);
    res.status(500).json({ error: "Bedrock failure generating token." });
  }
});

/**
 * 🦞 PUT /api/auth/profile
 * Update user display name.
 */
router.put("/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const token = authHeader.split(" ")[1];
  const { displayName } = req.body;

  if (!displayName || !displayName.trim()) {
    return res.status(400).json({ error: "Display name cannot be empty." });
  }

  try {
    const tokenRecord = db.prepare("SELECT * FROM api_tokens WHERE key = ?").get(token) as any;
    if (!tokenRecord) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const trimmedDisplayName = displayName.trim();
    db.prepare("UPDATE lobsters SET display_name = ? WHERE uuid = ?").run(trimmedDisplayName, tokenRecord.owner_uuid);

    const updatedLobster = db.prepare("SELECT uuid, username, display_name FROM lobsters WHERE uuid = ?").get(tokenRecord.owner_uuid) as any;

    res.json({ 
      success: true, 
      uuid: updatedLobster.uuid, 
      username: updatedLobster.username, 
      displayName: updatedLobster.display_name || updatedLobster.username 
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile: " + err.message });
  }
});

/**
 * 🦞 GET /api/auth/me
 * Fetch current user profile.
 */
router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const tokenRecord = db.prepare("SELECT * FROM api_tokens WHERE key = ?").get(token) as any;
    if (!tokenRecord) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const lobster = db.prepare("SELECT uuid, username, display_name, created_at FROM lobsters WHERE uuid = ?").get(tokenRecord.owner_uuid) as any;
    if (!lobster) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ 
      uuid: lobster.uuid, 
      username: lobster.username, 
      displayName: lobster.display_name || lobster.username,
      created_at: lobster.created_at
    });
  } catch (err: any) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

export default router;
