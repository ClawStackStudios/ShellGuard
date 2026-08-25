import { Router } from "express";
import db from "../../server/database/index.ts";
import { requireAuth, requirePermission, LobsterAuthRequest } from "../auth/authMiddleware.ts";

const router = Router();

/**
 * 🦞 GET /api/vault
 * Scuttle all items in the vault.
 */
router.get("/", requireAuth, requirePermission("canRead"), (req: LobsterAuthRequest, res) => {
  try {
    const items = db.prepare("SELECT * FROM vault_pearls WHERE owner_uuid = ? ORDER BY created_at DESC").all(req.lobster!.uuid);
    res.json(items);
  } catch (err: any) {
    console.error("Vault GET error:", err);
    res.status(500).json({ error: "Bedrock failure retrieving vault passwords." });
  }
});

/**
 * 🦞 POST /api/vault
 * Lock a new password/item in the vault.
 */
router.post("/", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  const { id, title, secret, username, url, type, category, notes, totp_secret, attachments } = req.body;

  if (!id || !title || !secret) {
    return res.status(400).json({ error: "ID, Service Title, and Password are required." });
  }

  try {
    db.prepare(`
      INSERT INTO vault_pearls (id, owner_uuid, title, secret, username, url, type, category, notes, totp_secret, attachments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.lobster!.uuid,
      title.trim(),
      secret,
      username ? username.trim() : "",
      url ? url.trim() : "",
      type || "password",
      category || "Personal",
      notes || "",
      totp_secret || "",
      attachments || "[]",
      new Date().toISOString()
    );

    res.status(201).json({ 
      id, 
      title: title.trim(), 
      username: username ? username.trim() : "", 
      url: url ? url.trim() : "", 
      type: type || "password", 
      category: category || "Personal" 
    });
  } catch (err: any) {
    console.error("Vault POST error:", err);
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY" || err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "A vault entry with this ID already exists." });
    }
    res.status(500).json({ error: "Bedrock failure locking password in vault." });
  }
});

/**
 * 🦞 PUT /api/vault/:id
 * Update an existing password/item in the vault.
 */
router.put("/:id", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  const { id } = req.params;
  const { title, secret, username, url, type, category, notes, totp_secret, attachments } = req.body;

  if (!title || !secret) {
    return res.status(400).json({ error: "Service Title and Password are required." });
  }

  try {
    const result = db.prepare(`
      UPDATE vault_pearls 
      SET title = ?, secret = ?, username = ?, url = ?, type = ?, category = ?, notes = ?, totp_secret = ?, attachments = ?
      WHERE id = ? AND owner_uuid = ?
    `).run(
      title.trim(),
      secret,
      username ? username.trim() : "",
      url ? url.trim() : "",
      type || "password",
      category || "Personal",
      notes || "",
      totp_secret || "",
      attachments || "[]",
      id,
      req.lobster!.uuid
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Password entry not found in your vault." });
    }

    res.json({ 
      id, 
      title: title.trim(), 
      username: username ? username.trim() : "", 
      url: url ? url.trim() : "", 
      type: type || "password", 
      category: category || "Personal",
      notes: notes || ""
    });
  } catch (err: any) {
    console.error("Vault PUT error:", err);
    res.status(500).json({ error: "Bedrock failure updating password in vault." });
  }
});

/**
 * 🦞 DELETE /api/vault/:id
 * Crack a vault item and remove it.
 */
router.delete("/:id", requireAuth, requirePermission("canDelete"), (req: LobsterAuthRequest, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare("DELETE FROM vault_pearls WHERE id = ? AND owner_uuid = ?").run(id, req.lobster!.uuid);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Password entry not found in your vault." });
    }

    res.json({ message: "Password removed from vault." });
  } catch (err: any) {
    console.error("Vault DELETE error:", err);
    res.status(500).json({ error: "Bedrock failure removing password." });
  }
});

export default router;
