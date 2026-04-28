import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/users": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/unit-kerja": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/asset-category": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/asset": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/framework": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/risk-programs": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/program-frameworks": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/contexts": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/working-papers": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/entries": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/system-config": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/dashboard": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
