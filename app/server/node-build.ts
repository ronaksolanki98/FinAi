import path from "path";
import { createServer } from "./index";
import * as express from "express";
import { initializeDatabase, closePool } from "./db";

async function start() {
  try {
    // Initialize database
    console.log("[Server] Initializing database...");
    await initializeDatabase();
    console.log("[Server] ✓ Database initialized\n");

    const app = createServer();
    const port = process.env.PORT || 3000;

    // In production, serve the built SPA files
    const __dirname = import.meta.dirname;
    const distPath = path.join(__dirname, "../spa");

    // Serve static files
    app.use(express.static(distPath));

    // Handle React Router - serve index.html for all non-API routes
    app.use((req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      res.sendFile(path.join(distPath, "index.html"));
    });

    app.listen(port, () => {
      console.log(`🚀 Fusion Starter server running on port ${port}`);
      console.log(`📱 Frontend: http://localhost:${port}`);
      console.log(`🔧 API: http://localhost:${port}/api`);
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("🛑 Received SIGTERM, shutting down gracefully");
      await closePool();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("🛑 Received SIGINT, shutting down gracefully");
      await closePool();
      process.exit(0);
    });
  } catch (error) {
    console.error("[Server] ❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
