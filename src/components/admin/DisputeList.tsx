import { db } from "@/lib/firebase/config";
import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DisputeList({ disputes }: { disputes: any[] }) {
  const resolveDispute = async (dispute: any, favor: "buyer" | "seller") => {
    try {
      const tradeRef = doc(db, "trades", dispute.tradeId);
      const tradeSnap = await getDoc(tradeRef);
      if (!tradeSnap.exists()) return;
      const trade = tradeSnap.data();
      
      const winnerId = favor === "buyer" ? trade.buyerId : trade.sellerId;

      // 1. Finalizar Trade
      await updateDoc(tradeRef, { 
        status: "crypto_released",
        resolvedAt: serverTimestamp() 
      });

      // 2. Liberar fondos al ganador
      const userRef = doc(db, "users", winnerId);
      await updateDoc(userRef, {
        [`balances.${trade.asset}`]: increment(trade.amount)
      });

      // 3. Marcar disputa como resuelta
      await updateDoc(doc(db, "system_alerts", dispute.id), { 
        status: "resolved",
        resolution: favor,
        resolvedAt: serverTimestamp() 
      });

      // 4. Notificar
      await addDoc(collection(db, "notifications"), {
        userId: winnerId,
        title: "Disputa Resuelta",
        body: `La disputa del trade #${dispute.tradeId.slice(-6)} se resolvió a tu favor.`,
        type: "trade",
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      {disputes.map((d) => (
        <Card key={d.id} className="p-4">
          <p>Trade ID: {d.tradeId}</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => resolveDispute(d, "buyer")}>Ganador: Comprador</Button>
            <Button size="sm" variant="destructive" onClick={() => resolveDispute(d, "seller")}>Ganador: Vendedor</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
