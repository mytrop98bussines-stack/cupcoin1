import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, MessageSquare, Gavel } from "lucide-react";
import { AdminDisputeReview } from "./AdminDisputeReview"; // El componente que definimos antes

export function DisputeList() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

  // 1. Escuchar todas las disputas activas (donde el status del trade sea 'dispute')
  useEffect(() => {
    const q = query(
      collection(db, "trades"),
      where("status", "==", "dispute"),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      setDisputes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-10">Cargando disputas...</div>;

  return (
    <div className="space-y-4 px-4 pb-20">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <AlertTriangle className="text-amber-500" /> Disputas Activas ({disputes.length})
      </h2>

      {disputes.length === 0 ? (
        <Card className="p-10 text-center text-gray-400">No hay disputas abiertas.</Card>
      ) : (
        disputes.map((trade) => (
          <Card key={trade.id} className="p-4 space-y-3 border-l-4 border-l-amber-500">
            <div className="flex justify-between">
              <div>
                <p className="font-bold">{trade.buyerName} vs {trade.sellerName}</p>
                <p className="text-xs text-gray-500">{trade.asset} | {trade.totalFiat} CUP</p>
              </div>
              <Badge variant="warning">En Disputa</Badge>
            </div>

            <Button 
              size="sm" 
              className="w-full bg-amber-600" 
              onClick={() => setSelectedTrade(trade)}
            >
              <Gavel className="mr-2 h-4 w-4" /> Revisar y Resolver
            </Button>
          </Card>
        ))
      )}

      {/* Modal de Resolución */}
      {selectedTrade && (
        <AdminDisputeReview 
          trade={selectedTrade} 
          onClose={() => setSelectedTrade(null)} 
        />
      )}
    </div>
  );
}
