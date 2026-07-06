import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Gavel } from "lucide-react";
import { AdminDisputeReview } from "./AdminDisputeReview";
import type { Dispute, Trade } from "@/types";

export function DisputeList() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<{dispute: Dispute, trade: Trade} | null>(null);

  useEffect(() => {
    const q = query(collection(db, "disputes"), where("status", "==", "open"), orderBy("createdAt", "desc"));
    return onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Dispute));
      setDisputes(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-10">Cargando disputas...</div>;

  return (
    <div className="space-y-4">
      {disputes.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white dark:bg-white/5 rounded-2xl border border-dashed">
          <AlertTriangle className="mx-auto mb-2 opacity-50" />
          <p>No hay disputas abiertas.</p>
        </div>
      ) : (
        disputes.map((d) => (
          <Card key={d.id} className="p-4 border-l-4 border-amber-500 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-sm">{d.buyerName} vs {d.sellerName}</p>
                <p className="text-xs text-gray-400">{d.amount} {d.asset}</p>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase">Abierta</span>
            </div>
            <Button size="sm" className="w-full" onClick={() => setSelectedDispute({dispute: d, trade: {id: d.tradeId} as Trade})}>
              <Gavel className="mr-2 h-4 w-4" /> Gestionar Caso
            </Button>
          </Card>
        ))
      )}

      {selectedDispute && (
        <AdminDisputeReview 
          dispute={selectedDispute.dispute} 
          trade={selectedDispute.trade} 
          onClose={() => setSelectedDispute(null)} 
        />
      )}
    </div>
  );
}
