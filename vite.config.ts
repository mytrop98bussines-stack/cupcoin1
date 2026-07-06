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

  // 💡 Inyección global de variables durante el compilado para el Service Worker
  define: {
    "self.VITE_FIREBASE_API_KEY": JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    "self.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    "self.VITE_FIREBASE_PROJECT_ID": JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    "self.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
    "self.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    "self.VITE_FIREBASE_APP_ID": JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
  },
  
  // ⚡ Optimización y configuración de empaquetado multi-entrada
  build: {
    chunkSizeWarningLimit: 1000,
    assetsDir: "assets",
    rollupOptions: {
      input: {
        // Tu punto de entrada normal de la app
        main: path.resolve(__dirname, "index.html"),
        // El Service Worker que moviste a la carpeta src/
        "firebase-messaging-sw": path.resolve(__dirname, "src/firebase-messaging-sw.js"),
      },
      output: {
        // 🔥 Crucial: Asegura que el SW mantenga su nombre exacto en la raíz de la carpeta dist/
        // Si cambia de nombre o se le mete un hash, Firebase no lo va a encontrar.
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "firebase-messaging-sw" 
            ? "[name].js" 
            : "assets/[name]-[hash].js";
        },
      },
    },
  }
});
