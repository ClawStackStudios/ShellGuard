import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import authRoutes from "./src/services/auth/authRoutes.ts";
import vaultRoutes from "./src/services/vault/vaultRoutes.ts";
import notesRoutes from "./src/services/vault/notesRoutes.ts";
import keysRoutes from "./src/services/vault/keysRoutes.ts";
import attachmentsRoutes from "./src/services/vault/attachmentsRoutes.ts";
import agentRoutes from "./src/services/agents/agentRoutes.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startShellGuard() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // 🦞 API Routes (The Carapace Gateway)
  app.use("/api/auth", authRoutes);
  app.use("/api/vault", vaultRoutes);
  app.use("/api/notes", notesRoutes);
  app.use("/api/keys", keysRoutes);
  app.use("/api/attachments", attachmentsRoutes);
  app.use("/api/agents", agentRoutes);
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "shell-hardened", version: "0.1.0-mvp" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🦞 ShellGuard©™ scuttling on http://localhost:${PORT}`);
  });
}

startShellGuard().catch((err) => {
  console.error("❌ Shell cracked during startup:", err);
});
