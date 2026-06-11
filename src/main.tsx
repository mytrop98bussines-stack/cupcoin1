import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// 🔄 Importamos las herramientas de React Query necesarias
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 🛠️ Creamos el cliente de control con configuraciones optimizadas para Cuba (redes móviles)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita que gaste datos extras si el usuario cambia de pestaña y vuelve
      retry: 2,                     // Si la conexión 3G/4G parpadea, reintenta dos veces antes de dar error
      staleTime: 1000 * 30,         // Considera los precios "frescos" por 30 segundos para no saturar con peticiones
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 👑 Envolvemos la app completa con el proveedor de datos */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
