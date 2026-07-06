import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Dispute } from "@/types";

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Consulta: traer todas las disputas ordenadas por fecha
    const q = query(collection(db, "disputes"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Dispute[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Dispute));
        
        setDisputes(list);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error cargando disputas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-4 text-center">Cargando disputas...</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold dark:text-white">Gestión de Disputas</h2>
      
      {disputes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No hay disputas abiertas.</p>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="p-4 bg-white dark:bg-navy-800 rounded-lg shadow border border-gray-200 dark:border-navy-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold dark:text-white">Trade: {dispute.tradeId}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Razón: {dispute.reason}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  dispute.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
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
