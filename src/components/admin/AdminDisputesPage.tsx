import { useEffect, useState } from "react";
import type { Dispute } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let stopped = false;

    const loadDisputes = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/admin/disputes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && !stopped) {
          setDisputes(data.disputes);
        }
      } catch (err) {
        console.error("❌ Error cargando disputas:", err);
      } finally {
        if (!stopped) setLoading(false);
      }
    };

    void loadDisputes();
    const intervalId = window.setInterval(loadDisputes, 30000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) return (
    <div className="p-4 text-center">
      <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm text-gray-400">Cargando disputas...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold dark:text-white">
        Gestión de Disputas
      </h2>

      {disputes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No hay disputas abiertas.
        </p>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="p-4 bg-white dark:bg-navy-800 rounded-lg shadow border border-gray-200 dark:border-navy-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold dark:text-white">
                    Trade: {dispute.tradeId}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Razón: {dispute.reason}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  dispute.status === "open"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {dispute.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Iniciada por: {dispute.initiatedBy}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
