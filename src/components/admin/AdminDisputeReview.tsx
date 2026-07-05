import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShieldCheck, MessageSquare, AlertTriangle, User, Gavel } from "lucide-react";

export function AdminDisputeReview({ trade, onClose }: { trade: any; onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  // 1. Escuchar el chat del trade en tiempo real
  useEffect(() => {
    const q = collection(db, "trades", trade.id, "messages");
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [trade.id]);

  // 2. Acción de resolución profesional
  const resolveDispute = async (winner: "buyer" | "seller") => {
    if (!adminNote.trim()) return alert("Por favor, escribe el motivo de la resolución para la auditoría.");
    setLoading(true);

    try {
      // Actualizar el estado del trade y cerrar la disputa
      await updateDoc(doc(db, "trades", trade.id), {
        status: "resolved",
        winner: winner,
        adminComment: adminNote,
        resolvedAt: serverTimestamp()
      });

      // Notificar a las partes
      await addDoc(collection(db, "notifications"), {
        userId: winner === "buyer" ? trade.buyerId : trade.sellerId,
        title: "✅ Disputa resuelta a tu favor",
        body: `El administrador ha fallado a tu favor. Motivo: ${adminNote}`,
        createdAt: serverTimestamp()
      });

      onClose();
    } catch (e) {
      console.error(e);
      alert("Error al resolver la disputa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Gavel /> Resolución de Disputa</h2>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>

        {/* Info del Trade */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
          <p><strong>Trade ID:</strong> {trade.id.slice(-6)}</p>
          <p><strong>Monto:</strong> {trade.amount} {trade.asset}</p>
          <p><strong>Comprador:</strong> {trade.buyerName}</p>
          <p><strong>Vendedor:</strong> {trade.sellerName}</p>
        </div>

        {/* Historial del Chat */}
        <div className="space-y-2">
          <p className="text-sm font-bold flex items-center gap-2"><MessageSquare size={16}/> Historial del Chat:</p>
          <div className="h-48 overflow-y-auto bg-gray-100 p-3 rounded-lg space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`text-xs p-2 rounded ${m.senderId === trade.buyerId ? "bg-blue-100" : "bg-white"}`}>
                <span className="font-bold">{m.senderName}:</span> {m.text}
              </div>
            ))}
          </div>
        </div>

        {/* Nota de Auditoría */}
        <textarea 
          placeholder="Escribe aquí tu motivo de resolución (obligatorio para auditoría)..."
          className="w-full p-3 border rounded-lg text-sm"
          onChange={(e) => setAdminNote(e.target.value)}
        />

        {/* Decisiones */}
        <div className="flex gap-4">
          <Button className="flex-1 bg-blue-600" loading={loading} onClick={() => resolveDispute("buyer")}>
            Fallar a favor del Comprador
          </Button>
          <Button className="flex-1 bg-red-600" loading={loading} onClick={() => resolveDispute("seller")}>
            Fallar a favor del Vendedor
          </Button>
        </div>
      </Card>
    </div>
  );
      }
