import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Al principio del archivo, antes de todo
window.onerror = (msg, src, line, col, error) => {
  console.error("🚨 Error global:", { msg, src, line, col, stack: error?.stack });
  alert(`Error: ${msg}\n\nStack: ${error?.stack?.slice(0, 200)}`);
};

window.onunhandledrejection = (event) => {
  console.error("🚨 Promise rechazada:", event.reason);
  alert(`Promise Error: ${event.reason}`);
};

// 🛡️ CAPTURADOR GLOBAL DE ERRORES (Pinta el error en pantalla si React se rompe)
window.addEventListener('error', function(e) {
  const div = document.createElement('div');
  div.style.cssText = 'color:white; background:red; padding:20px; position:fixed; top:0; left:0; width:100vw; height:100vh; zIndex:999999; overflow:auto; fontFamily:monospace;';
  div.innerHTML = `<h2>🚨 ERROR CRÍTICO DETECTADO:</h2>
                   <p><b>Mensaje:</b> ${e.message}</p>
                   <p><b>Archivo:</b> ${e.filename}</p>
                   <p><b>Línea:</b> ${e.lineno}:${e.colno}</p>
                   <hr/><p>Copia este mensaje para saber qué lo rompe.</p>`;
  document.body.appendChild(div);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 1000 * 30,
    },
  },
});

try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
} catch (error: any) {
  const div = document.createElement('div');
  div.style.cssText = 'color:white; background:darkred; padding:20px; position:fixed; top:0; left:0; width:100vw; height:100vh; zIndex:999999;';
  div.innerHTML = `<h2>🚨 FALLO AL RENDERIZAR:</h2><p>${error.message}</p>`;
  document.body.appendChild(div);
}
