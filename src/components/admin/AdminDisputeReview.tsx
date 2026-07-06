import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import {
  doc, updateDoc, addDoc, getDoc,
  collection, query, orderBy, onSnapshot,
} from "firebase/firestore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Gavel, Loader2, Zap, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Dispute, Trade, ChatMessage } from "@/types";

interface Props {
  dispute: Dispute;
  trade:   Trade;
  onClose: () => void;
}

export function AdminDisputeReview({ dispute, trade, onClose }: Props) {
  const { user } = useAppStore();

  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [loading, setLoading]       = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);
  const [adminNote, setAdminNote]   = useState("");

  // ✅ Cargar chat en tiempo real
  useEffect(() => {
    if (!trade.id) return;

    const q = query(
      collection(db, "trades", trade.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id:         d.id,
            senderId:   data.senderId   ?? "SYSTEM",
            senderName: data.senderName ?? "Sistema",
            text:       data.text       ?? data.message ?? "",
            createdAt:  data.createdAt  ?? data.timestamp ?? Date.now(),
            type:       data.type       ?? "text",
          } as ChatMessage;
        });
        setMessages(msgs);
        setLoadingChat(false);
      },
      (err) => {
        console.error("Error cargando chat:", err.message);
        setLoadingChat(false);
      }
    );

    return () => unsubscribe();
  }, [trade.id]);

  const resolveDispute = async (
    result: "resolved_buyer" | "resolved_seller"
  ) => {
    if (!adminNote.trim()) {
      alert("Debes escribir una justificación para la auditoría.");
      return;
    }

    setLoading(true);
    try {
      const favor      = result === "resolved_buyer" ? "buyer" : "seller";
      const winnerId   = favor === "buyer" ? dispute.buyerId   : dispute.sellerId;
      const loserId    = favor === "buyer" ? dispute.sellerId  : dispute.buyerId;
      const winnerName = favor === "buyer" ? dispute.buyerName : dispute.sellerName;

      // ✅ 1. Actualizar la disputa en system_alerts
      await updateDoc(doc(db, "system_alerts", dispute.id), {
        resuelto:   true,
        resolution: result,
        adminNote,
        resolvedAt: Date.now(),
        resolvedBy: user?.uid || "admin",
      });

      // ✅ 2. Actualizar el trade
      await updateDoc(doc(db, "trades", trade.id), {
        status:     favor === "buyer" ? "crypto_released" : "cancelled",
        resolvedBy: user?.uid || "admin",
        resolvedAt: Date.now(),
        updatedAt:  Date.now(),
      });

      // ✅ 3. Transferir fondos si gana el comprador
      if (favor === "buyer" && dispute.amount > 0) {
        const buyerRef  = doc(db, "users", dispute.buyerId);
        const buyerSnap = await getDoc(buyerRef);
        if (buyerSnap.exists()) {
          const currentBalance =
            buyerSnap.data().balances?.[dispute.asset] || 0;
          await updateDoc(buyerRef, {
            [`balances.${dispute.asset}`]: currentBalance + dispute.amount,
          });
        }
      }

      // ✅ 4. Devolver fondos al vendedor si gana el vendedor
      if (favor === "seller" && dispute.amount > 0) {
        const sellerRef  = doc(db, "users", dispute.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          const currentBalance =
            sellerSnap.data().balances?.[dispute.asset] || 0;
          await updateDoc(sellerRef, {
            [`balances.${dispute.asset}`]: currentBalance + dispute.amount,
          });
        }
      }

      // ✅ 5. Notificar al ganador
      await addDoc(collection(db, "notifications"), {
        userId:    winnerId,
        title:     "✅ Disputa resuelta a tu favor",
        body:      `El moderador resolvió la disputa a tu favor. Motivo: ${adminNote.slice(0, 80)}...`,
        type:      "trade",
        read:      false,
        createdAt: Date.now(),
        data:      { tradeId: trade.id, resolution: "won" },
      });

      // ✅ 6. Notificar al perdedor
      await addDoc(collection(db, "notifications"), {
        userId:    loserId,
        title:     "❌ Disputa resuelta",
        body:      `El moderador resolvió la disputa a favor de ${winnerName}. Motivo: ${adminNote.slice(0, 80)}...`,
        type:      "trade",
        read:      false,
        createdAt: Date.now(),
        data:      { tradeId: trade.id, resolution: "lost" },
      });

      // ✅ 7. Mensaje del sistema en el chat
      await addDoc(collection(db, "trades", trade.id, "messages"), {
        senderId:   "SYSTEM",
        senderName: "CubaX Admin",
        text:       `⚖️ RESOLUCIÓN ADMIN: La disputa fue resuelta a favor del ${
          favor === "buyer" ? "comprador" : "vendedor"
        }. Motivo: ${adminNote}`,
        createdAt:  Date.now(),
        type:       "system",
      });

      onClose();
    } catch (e: any) {
      console.error("Error al resolver:", e);
      alert("Error al procesar la resolución: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-navy-900 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gavel className="h-5 w-5 text-brand-500" />
            Resolución de Disputa
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Info del caso */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-sm">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Trade ID</p>
              <p className="font-bold font-mono text-gray-900 dark:text-white">
                #{trade.id?.slice(-8)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Monto</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {dispute.amount} {dispute.asset}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Comprador</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                🟢 {dispute.buyerName}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Vendedor</p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">
                🔵 {dispute.sellerName}
              </p>
            </div>
            {dispute.reason && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">
                  Razón de la disputa
                </p>
                <p className="italic text-gray-600 dark:text-gray-400 text-xs">
                  "{dispute.reason}"
                </p>
              </div>
            )}
          </div>

          {/* Chat del trade */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              💬 Historial del chat
            </p>
            <div className="h-56 overflow-y-auto bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-3 space-y-2">
              {loadingChat ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-gray-400">
                    Sin mensajes en este trade
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isSystem = m.senderId === "SYSTEM";
                  const isBuyer  = m.senderId === dispute.buyerId;

                  if (isSystem) {
                    return (
                      <div key={idx} className="flex justify-center">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-200 dark:bg-white/10 max-w-[90%]">
                          <Zap className="h-3 w-3 text-brand-500 flex-shrink-0" />
                          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {m.text}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`text-xs p-2.5 rounded-xl ${
                        isBuyer
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 ml-0 mr-8"
                          : "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 ml-8 mr-0"
                      }`}
                    >
                      <p className={`font-bold mb-0.5 ${
                        isBuyer
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}>
                        {isBuyer ? "🟢" : "🔵"} {m.senderName}
                        <span className="font-normal text-gray-400 ml-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour:   "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">{m.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Nota de auditoría */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              📋 Justificación para auditoría (obligatorio)
            </label>
            <textarea
              placeholder="Escribe la resolución para el registro de auditoría..."
              className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ⚠️ La decisión es <strong>irreversible</strong>.
              Revisa el chat completo antes de resolver.
              Los fondos serán transferidos automáticamente.
            </p>
          </div>
        </div>

        {/* Botones de decisión */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex gap-3">
          <Button
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            loading={loading}
            onClick={() => resolveDispute("resolved_buyer")}
          >
            ✅ Fallar a favor del Comprador
          </Button>
          <Button
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            loading={loading}
            onClick={() => resolveDispute("resolved_seller")}
          >
            ✅ Fallar a favor del Vendedor
          </Button>
        </div>
      </div>
    </div>
  );
                              }
