import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Gavel, MessageSquare, AlertTriangle, Loader2 } from "lucide-react";
import type { Trade, Dispute, ChatMessage } from "@/types";

interface Props {
  dispute: Dispute;
  trade: Trade;
  onClose: () => void;
}

export function AdminDisputeReview({ dispute, trade, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [loadingChat, setLoadingChat] = useState(true);

  // Escuchar el chat del trade en tiempo real
  useEffect(() => {
    const q = collection(db, "trades", trade.id, "messages");
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
      setLoadingChat(false);
    });
  }, [trade.id]);

  const resolveDispute = async (result: "resolved_buyer" | "resolved_seller") => {
    if (!adminNote.trim()) {
      alert("Debes escribir una justificación para la auditoría.");
      return;
    }

    setLoading(true);
    try {
      // 1. Actualizar estado de la Disputa
      await updateDoc(doc(db, "disputes", dispute.id), {
        status: result,
        resolution: adminNote,
        resolvedAt: Date.now(),
        resolvedBy: "admin" // Ajusta con tu ID de Auth si es necesario
      });

      // 2. Actualizar estado del Trade (devolvemos a un estado de finalización)
      await updateDoc(doc(db, "trades", trade.id), {
        status: "crypto_released",
        updatedAt: Date.now()
      });

      // 3. Notificar al ganador
      await addDoc(collection(db, "notifications"), {
        userId: result === "resolved_buyer" ? dispute.buyerId : dispute.sellerId,
        title: "✅ Disputa resuelta a tu favor",
        body: `El administrador ha fallado a tu favor. Motivo: ${adminNote.substring(0, 50)}...`,
        type: "trade",
        read: false,
        createdAt: Date.now()
      });

      onClose();
    } catch (e) {
      console.error("Error al resolver:", e);
      alert("Error al procesar la resolución.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Gavel className="text-brand-500" /> Resolución de Disputa
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Info del caso */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-sm">
          <div><p className="text-gray-400 text-xs">Trade ID</p><p className="font-bold">{trade.id.slice(-8)}</p></div>
          <div><p className="text-gray-400 text-xs">Monto</p><p className="font-bold">{trade.amount} {trade.asset}</p></div>
          <div className="col-span-2"><p className="text-gray-400 text-xs">Razón de la disputa</p><p className="italic">"{dispute.reason}"</p></div>
        </div>

        {/* Historial del Chat */}
        <div className="flex-1 overflow-hidden space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase">Historial del Chat</p>
          <div className="h-48 overflow-y-auto bg-gray-100 dark:bg-white/5 p-3 rounded-lg space-y-2 border">
            {loadingChat ? <Loader2 className="animate-spin mx-auto mt-10" /> : messages.map((m) => (
              <div key={m.id} className={`text-xs p-2 rounded-lg ${m.senderId === dispute.buyerId ? "bg-blue-100 dark:bg-blue-900/20" : "bg-white dark:bg-gray-800"}`}>
                <span className="font-bold">{m.senderName}: </span> {m.text}
              </div>
            ))}
          </div>
        </div>

        {/* Nota de Auditoría */}
        <textarea 
          placeholder="Escribe la resolución para el registro de auditoría..."
          className="w-full p-3 border rounded-xl text-sm bg-white dark:bg-white/5 focus:ring-2 focus:ring-brand-500 outline-none"
          rows={3}
          onChange={(e) => setAdminNote(e.target.value)}
        />

        {/* Decisiones */}
        <div className="flex gap-3 pt-2">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700" 
            loading={loading} 
            onClick={() => resolveDispute("resolved_buyer")}
          >
            Fallar a favor del Comprador
          </Button>
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700" 
            loading={loading} 
            onClick={() => resolveDispute("resolved_seller")}
          >
            Fallar a favor del Vendedor
          </Button>
        </div>
      </Card>
    </div>
  );
}

