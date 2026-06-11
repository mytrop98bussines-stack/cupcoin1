import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // ✨ Mantenemos la base relativa para que Firebase no pierda las rutas de los archivos indexados
  base: "./", 
  
  // ✂️ Eliminamos viteSingleFile() para que divida el código limpiamente en trozos ligeros para redes 3G/4G
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  
  // ⚡ Optimización para que compile sin problemas de memoria en el Runner
  build: {
    chunkSizeWarningLimit: 1000,
    assetsDir: "assets",
  }
});

