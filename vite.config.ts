import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; // 💡 Importación limpia y nativa de Node
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "./", 
    plugins: [
      react(), 
      tailwindcss(),
      // ⚡ Plugin limpio sin 'require' para no romper la pantalla en local
      {
        name: "transform-service-worker",
        closeBundle() {
          const swPath = path.resolve(__dirname, "dist/firebase-messaging-sw.js");
          if (fs.existsSync(swPath)) {
            let swContent = fs.readFileSync(swPath, "utf8");
            swContent = swContent.replace("VITE_FIREBASE_API_KEY_PLACEHOLDER", env.VITE_FIREBASE_API_KEY || "");
            swContent = swContent.replace("VITE_FIREBASE_AUTH_DOMAIN_PLACEHOLDER", env.VITE_FIREBASE_AUTH_DOMAIN || "");
            swContent = swContent.replace("VITE_FIREBASE_PROJECT_ID_PLACEHOLDER", env.VITE_FIREBASE_PROJECT_ID || "");
            swContent = swContent.replace("VITE_FIREBASE_STORAGE_BUCKET_PLACEHOLDER", env.VITE_FIREBASE_STORAGE_BUCKET || "");
            swContent = swContent.replace("VITE_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER", env.VITE_FIREBASE_MESSAGING_SENDER_ID || "");
            swContent = swContent.replace("VITE_FIREBASE_APP_ID_PLACEHOLDER", env.VITE_FIREBASE_APP_ID || "");
            fs.writeFileSync(swPath, swContent, "utf8");
          }
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      assetsDir: "assets",
    }
  };
});
