import { Router } from "express";
import db from "../../server/database/index.ts";
import { requireAuth, requirePermission, LobsterAuthRequest } from "../auth/authMiddleware.ts";

const router = Router();

router.get("/", requireAuth, requirePermission("canRead"), (req: LobsterAuthRequest, res) => {
  try {
    const items = db.prepare("SELECT * FROM vault_secure_notes WHERE owner_uuid = ? ORDER BY created_at DESC").all(req.lobster!.uuid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure retrieving notes." });
  }
});

router.post("/", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  const { id, title, content, category } = req.body;
  if (!id || !title || !content) return res.status(400).json({ error: "Required fields missing." });
  try {
    db.prepare(`
      INSERT INTO vault_secure_notes (id, owner_uuid, title, content, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.lobster!.uuid, title.trim(), content, category || "Personal", new Date().toISOString());
    res.status(201).json({ id, title: title.trim(), category: category || "Personal" });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure locking note." });
  }
});

router.put("/:id", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Required fields missing." });
  try {
    const result = db.prepare(`
      UPDATE vault_secure_notes SET title = ?, content = ?, category = ? WHERE id = ? AND owner_uuid = ?
    `).run(title.trim(), content, category || "Personal", id, req.lobster!.uuid);
    if (result.changes === 0) return res.status(404).json({ error: "Note not found." });
    res.json({ id, title: title.trim(), category: category || "Personal" });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure updating note." });
  }
});

router.delete("/:id", requireAuth, requirePermission("canDelete"), (req: LobsterAuthRequest, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare("DELETE FROM vault_secure_notes WHERE id = ? AND owner_uuid = ?").run(id, req.lobster!.uuid);
    if (result.changes === 0) return res.status(404).json({ error: "Note not found." });
    res.json({ message: "Note removed." });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure removing note." });
  }
});

export default router;
