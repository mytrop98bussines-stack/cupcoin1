import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "/",
  plugins: [wasm(), react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  define: {
    global: "globalThis",
  },

  optimizeDeps: {
    include: ["ethers", "tronweb", "tiny-secp256k1"],
  },

  build: {
    chunkSizeWarningLimit: 1000,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          ethers:    ["ethers"],
          tronweb:   ["tronweb"],
          firebase:  ["firebase/app", "firebase/auth", "firebase/firestore"],
          react:     ["react", "react-dom"],
        },
      },
    },
  },
});
