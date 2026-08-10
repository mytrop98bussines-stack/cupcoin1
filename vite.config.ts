import path           from "path";
import { fileURLToPath } from "url";
import tailwindcss    from "@tailwindcss/vite";
import react          from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default defineConfig({
  base: "/",
  plugins: [wasm(), react(), tailwindcss()],

  resolve: {
    alias: {
      "@":     path.resolve(__dirname, "src"),
      // ✅ Polyfills para bitcoinjs-lib y tronweb
      buffer:  "buffer",
      process: "process/browser",
      stream:  "stream-browserify",
      crypto:  "crypto-browserify",
      events:  "events",
    },
  },

  // ✅ Variables globales necesarias
  define: {
    global:              "globalThis",
    "process.env":       "{}",
    "process.version":   '"v18.0.0"',
    "process.browser":   "true",
  },

  optimizeDeps: {
    include: [
      "ethers",
      "bip39",
      "bip32",
      "tiny-secp256k1",
      "bitcoinjs-lib",
      "buffer",
      "tronweb",
    ],
    esbuildOptions: {
      // ✅ Necesario para módulos CommonJS
      target: "es2020",
    },
  },

  build: {
    target:               "es2020",
    chunkSizeWarningLimit: 2000,
    assetsDir:            "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          ethers:    ["ethers"],
          bitcoin:   ["bitcoinjs-lib", "bip32", "bip39", "tiny-secp256k1"],
          tron:      ["tronweb"],
          firebase:  ["firebase/app", "firebase/auth", "firebase/firestore"],
          react:     ["react", "react-dom"],
        },
      },
    },
  },
});
