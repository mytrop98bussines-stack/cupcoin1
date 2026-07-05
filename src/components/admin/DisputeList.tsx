import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DisputeList({ disputes, userId }: { disputes: any[], userId: string | undefined }) {
  const handleResolve = async (disputeId: string, tradeId: string, favor: "buyer" | "seller") => {
    try {
      const tradeSnap = await getDoc(doc(db, "trades", tradeId));
      if (!tradeSnap.exists()) throw new Error("Trade no encontrado");
      const tradeData = tradeSnap.data();
      const winnerId = favor === "buyer" ? tradeData.buyerId : tradeData.sellerId;
      
      await updateDoc(doc(db, "system_alerts", disputeId), { resuelto: true, resolvedBy: userId, resolvedAt: serverTimestamp(), resolution: favor });
      await updateDoc(doc(db, "trades", tradeId), { status: favor === "buyer" ? "crypto_released" : "cancelled", resolvedBy: userId, resolvedAt: serverTimestamp() });
      
      const winnerRef = doc(db, "users", winnerId);
      const winnerSnap = await getDoc(winnerRef);
      if (winnerSnap.exists()) {
        const currentBalance = winnerSnap.data().balances?.[tradeData.asset] || 0;
        await updateDoc(winnerRef, { [`balances.${tradeData.asset}`]: currentBalance + tradeData.amount });
      }
      await addDoc(collection(db, "notifications"), { userId: winnerId, title: "Disputa resuelta", body: "A tu favor", type: "trade", read: false, createdAt: Date.now() });
    } catch (e) { console.error(e); }
  };

  return <div className="space-y-4">{disputes.map(d => (
    <Card key={d.id} className="p-4">
      <p>Trade: {d.tradeId}</p>
      <div className="flex gap-2">
        <Button onClick={() => handleResolve(d.id, d.tradeId, "buyer")}>Fallar Comprador</Button>
        <Button onClick={() => handleResolve(d.id, d.tradeId, "seller")}>Fallar Vendedor</Button>
      </div>
    </Card>
  ))}</div>;
}

