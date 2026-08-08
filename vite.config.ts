import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  // ✅ Necesario para que ethers funcione en el navegador
  define: {
    global: "globalThis",
  },

  // ✅ Optimizar ethers para que no rompa el build
  optimizeDeps: {
    include: ["ethers"],
  },

  build: {
    chunkSizeWarningLimit: 1000,
    assetsDir: "assets",
    // ✅ Separar ethers en su propio chunk para no pesar en la carga inicial
    rollupOptions: {
      output: {
        manualChunks: {
          ethers:    ["ethers"],
          firebase:  ["firebase/app", "firebase/auth", "firebase/firestore"],
          react:     ["react", "react-dom"],
        },
      },
    },
  },
});
