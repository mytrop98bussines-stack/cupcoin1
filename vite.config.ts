import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite"; // 👈 Añade loadEnv aquí

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // 💡 Esto carga el archivo .env local en desarrollo y los secretos en producción
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "./", 
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    // 💡 Cambiamos process.env por env
    define: {
      "self.VITE_FIREBASE_API_KEY": JSON.stringify(env.VITE_FIREBASE_API_KEY),
      "self.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      "self.VITE_FIREBASE_PROJECT_ID": JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      "self.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      "self.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      "self.VITE_FIREBASE_APP_ID": JSON.stringify(env.VITE_FIREBASE_APP_ID),
    },
    build: {
      chunkSizeWarningLimit: 1000,
      assetsDir: "assets",
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
          "firebase-messaging-sw": path.resolve(__dirname, "src/firebase-messaging-sw.js"),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === "firebase-messaging-sw" 
              ? "[name].js" 
              : "assets/[name]-[hash].js";
          },
        },
      },
    }
  };
});
