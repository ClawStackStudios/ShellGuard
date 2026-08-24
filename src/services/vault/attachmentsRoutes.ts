import { Router } from "express";
import db from "../database/db.ts";
import { requireAuth, requirePermission, LobsterAuthRequest } from "../auth/authMiddleware.ts";

const router = Router();

router.get("/", requireAuth, requirePermission("canRead"), (req: LobsterAuthRequest, res) => {
  try {
    const items = db.prepare("SELECT * FROM vault_secure_attachments WHERE owner_uuid = ? ORDER BY created_at DESC").all(req.lobster!.uuid);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure retrieving attachments." });
  }
});

router.post("/", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  const { id, title, file_data, file_name, mime_type, category } = req.body;
  if (!id || !title || !file_data) return res.status(400).json({ error: "Required fields missing." });
  try {
    db.prepare(`
      INSERT INTO vault_secure_attachments (id, owner_uuid, title, file_data, file_name, mime_type, category) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.lobster!.uuid, title.trim(), file_data, file_name || "", mime_type || "", category || "Personal");
    res.status(201).json({ id, title: title.trim(), category: category || "Personal" });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure locking attachment." });
  }
});

router.put("/:id", requireAuth, requirePermission("canWrite"), (req: LobsterAuthRequest, res) => {
  const { id } = req.params;
  const { title, file_data, file_name, mime_type, category } = req.body;
  if (!title || !file_data) return res.status(400).json({ error: "Required fields missing." });
  try {
    const result = db.prepare(`
      UPDATE vault_secure_attachments SET title = ?, file_data = ?, file_name = ?, mime_type = ?, category = ? WHERE id = ? AND owner_uuid = ?
    `).run(title.trim(), file_data, file_name || "", mime_type || "", category || "Personal", id, req.lobster!.uuid);
    if (result.changes === 0) return res.status(404).json({ error: "Attachment not found." });
    res.json({ id, title: title.trim(), category: category || "Personal" });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure updating attachment." });
  }
});

router.delete("/:id", requireAuth, requirePermission("canDelete"), (req: LobsterAuthRequest, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare("DELETE FROM vault_secure_attachments WHERE id = ? AND owner_uuid = ?").run(id, req.lobster!.uuid);
    if (result.changes === 0) return res.status(404).json({ error: "Attachment not found." });
    res.json({ message: "Attachment removed." });
  } catch (err: any) {
    res.status(500).json({ error: "Bedrock failure removing attachment." });
  }
});

export default router;
