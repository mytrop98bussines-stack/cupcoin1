import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Dispute } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DisputeList({ disputes }: { disputes: Dispute[] }) {
  const resolveDispute = async (dispute: Dispute, winner: "buyer" | "seller") => {
    // 1. Marcar disputa como resuelta
    await updateDoc(doc(db, "system_alerts", dispute.id), {
      status: winner === "buyer" ? "resolved_buyer" : "resolved_seller",
      resolvedAt: serverTimestamp(),
    });
    // 2. Aquí llamarías a la lógica de actualizar el trade...
  };

  return (
    <div className="space-y-4">
      {disputes.filter(d => d.status === "open").map(d => (
        <Card key={d.id} className="p-4">
          <p>Trade: {d.tradeId} | Motivo: {d.reason}</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => resolveDispute(d, "buyer")}>Fallar a favor Comprador</Button>
            <Button onClick={() => resolveDispute(d, "seller")} variant="danger">Fallar a favor Vendedor</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
