import { Router } from "express";
import db from "../database/db.ts";
import { requireAuth, requirePermission, LobsterAuthRequest } from "../auth/authMiddleware.ts";

const router = Router();

router.get("/", requireAuth, requirePermission("canRead"), (req: LobsterAuthRequest, res) => {
  try {
    const items = db.prepare("SELECT * FROM vault_ssh_keys WHERE owner_uuid = ? ORDER BY created_at DESC").all(req.lobster!.uuid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure retrieving keys." });
  }
});

router.post("/", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  const { id, title, key_value, username, category } = req.body;
  if (!id || !title || !key_value) return res.status(400).json({ error: "Required fields missing." });
  try {
    db.prepare(`
      INSERT INTO vault_ssh_keys (id, owner_uuid, title, key_value, username, category) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.lobster!.uuid, title.trim(), key_value, username || "", category || "Personal");
    res.status(201).json({ id, title: title.trim(), category: category || "Personal" });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure locking key." });
  }
});

router.put("/:id", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  const { id } = req.params;
  const { title, key_value, username, category } = req.body;
  if (!title || !key_value) return res.status(400).json({ error: "Required fields missing." });
  try {
    const result = db.prepare(`
      UPDATE vault_ssh_keys SET title = ?, key_value = ?, username = ?, category = ? WHERE id = ? AND owner_uuid = ?
    `).run(title.trim(), key_value, username || "", category || "Personal", id, req.lobster!.uuid);
    if (result.changes === 0) return res.status(404).json({ error: "Key not found." });
    res.json({ id, title: title.trim(), category: category || "Personal" });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure updating key." });
  }
});

router.delete("/:id", requireAuth, requirePermission("canDelete"), (req: LobsterAuthRequest, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare("DELETE FROM vault_ssh_keys WHERE id = ? AND owner_uuid = ?").run(id, req.lobster!.uuid);
    if (result.changes === 0) return res.status(404).json({ error: "Key not found." });
    res.json({ message: "Key removed." });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure removing key." });
  }
});

export default router;
