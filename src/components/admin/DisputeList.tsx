import { useState } from "react";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Gavel } from "lucide-react";
import { AdminDisputeReview } from "@/components/admin/AdminDisputeReview";
import type { Dispute, Trade } from "@/types";

interface Props {
  disputes: Dispute[];
}

export function DisputeList({ disputes }: Props) {
  const [selectedDispute, setSelectedDispute] = useState<{
    dispute: Dispute;
    trade:   Trade;
  } | null>(null);

  if (disputes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 bg-white dark:bg-white/5 rounded-2xl border border-dashed">
        <AlertTriangle className="mx-auto mb-2 h-10 w-10 opacity-30" />
        <p className="font-semibold">No hay disputas abiertas.</p>
        <p className="text-xs mt-1">¡Todo en orden!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Disputas abiertas ({disputes.length})
      </h2>

      {disputes.map((d) => (
        <Card
          key={d.id}
          padding="md"
          className="border-l-4 border-l-amber-500 space-y-3"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {d.buyerName} vs {d.sellerName}
              </p>
              <p className="text-xs text-gray-400">
                {d.amount} {d.asset} en juego
              </p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                Trade: {d.tradeId?.slice(-8)}
              </p>
            </div>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-bold uppercase">
              Abierta
            </span>
          </div>

          {/* Razón */}
          {d.reason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-xl">
              "{d.reason}"
            </p>
          )}

          {/* Botón gestionar */}
          <Button
            size="sm"
            fullWidth
            onClick={() =>
              setSelectedDispute({
                dispute: d,
                trade:   { id: d.tradeId } as Trade,
              })
            }
          >
            <Gavel className="mr-2 h-4 w-4" />
            Gestionar caso
          </Button>
        </Card>
      ))}

      {/* Modal de revisión */}
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
