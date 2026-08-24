import { Router } from "express";
import db from "../database/db.ts";
import { requireAuth, requirePermission, LobsterAuthRequest } from "../auth/authMiddleware.ts";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/**
 * 🦞 GET /api/agents
 * List all active Lobster Keys©™ for the human.
 */
router.get("/", requireAuth, requirePermission("canRead"), (req: LobsterAuthRequest, res) => {
  if (req.lobster!.type !== "human") {
    return res.status(403).json({ error: "Only humans can manage agents." });
  }

  try {
    const agents = db.prepare("SELECT * FROM lobster_keys WHERE owner_uuid = ?").all(req.lobster!.uuid);
    res.json(agents);
  } catch (err: any) {
    console.error("Agents GET error:", err);
    res.status(500).json({ error: "Bedrock failure retrieving agents." });
  }
});

/**
 * 🦞 POST /api/agents
 * Create a new Lobster Key©™ (Agent).
 */
router.post("/", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  if (req.lobster!.type !== "human") {
    return res.status(403).json({ error: "Only humans can spawn agents." });
  }

  const { name, permissions } = req.body;

  if (!name || !permissions) {
    return res.status(400).json({ error: "Name and Permissions are required." });
  }

  const id = uuidv4();
  const apiKey = `lb-${crypto.randomBytes(32).toString("hex")}`;
  
  try {
    db.prepare("INSERT INTO lobster_keys (id, owner_uuid, api_key, name, permissions) VALUES (?, ?, ?, ?, ?)").run(
      id,
      req.lobster!.uuid,
      apiKey,
      name,
      JSON.stringify(permissions)
    );

    res.status(201).json({ id, name, apiKey, permissions });
  } catch (err: any) {
    console.error("Agents POST error:", err);
    res.status(500).json({ error: "Bedrock failure spawning agent." });
  }
});

/**
 * 🦞 DELETE /api/agents/:id
 * Revoke a Lobster Key©™ instantly.
 */
router.delete("/:id", requireAuth, requirePermission("canDelete"), (req: LobsterAuthRequest, res) => {
  if (req.lobster!.type !== "human") {
    return res.status(403).json({ error: "Only humans can revoke agents." });
  }

  const { id } = req.params;
  try {
    const result = db.prepare("DELETE FROM lobster_keys WHERE id = ? AND owner_uuid = ?").run(id, req.lobster!.uuid);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Agent not found in your reef." });
    }

    res.json({ message: "Lobster key revoked and agent scuttled." });
  } catch (err: any) {
    console.error("Agents DELETE error:", err);
    res.status(500).json({ error: "Bedrock failure revoking agent." });
  }
});

export default router;
