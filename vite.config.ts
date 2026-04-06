import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./app/client", "./app/shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "app/server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./app/client"),
        "@shared": path.resolve(__dirname, "./app/shared"),
      },
    },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // only dev mode
    async configureServer(server) {
      const { createServer } = await import("./app/server/index.js");
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
