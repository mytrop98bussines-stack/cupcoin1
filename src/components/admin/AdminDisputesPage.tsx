import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DisputeList } from "@/components/admin/DisputeList";

export function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<"KYC" | "Disputas" | "Membresías">("Disputas");

  return (
    <AdminLayout>
      {/* Encabezado del panel */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel Administrativo</h1>
        <p className="text-xs text-gray-400">Gestión centralizada de operaciones</p>
      </div>

      {/* Pestañas de navegación */}
      <div className="flex gap-6 border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto">
        {(["KYC", "Disputas", "Membresías"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold transition-all ${
              activeTab === tab
                ? "text-brand-500 border-b-2 border-brand-500"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenido dinámico */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "Disputas" && <DisputeList />}
        
        {/* Aquí irán tus otras vistas cuando las crees */}
        {activeTab === "KYC" && <div className="text-center py-10 text-gray-400">KYC en desarrollo...</div>}
        {activeTab === "Membresías" && <div className="text-center py-10 text-gray-400">Membresías en desarrollo...</div>}
      </div>
    </AdminLayout>
  );
}

