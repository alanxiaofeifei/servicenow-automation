import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(projectRoot, "electron/main.ts")
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          preload: resolve(projectRoot, "electron/preload.ts")
        }
      }
    }
  },
  renderer: {
    root: projectRoot,
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve(projectRoot, "index.html")
      }
    }
  }
});
