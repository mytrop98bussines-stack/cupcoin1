import { useState } from "react";
import { db } from "@/lib/firebase/config";
import {
  doc, updateDoc, addDoc,
  collection, serverTimestamp,
} from "firebase/firestore";
import { Card }  from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, X, ExternalLink, Crown } from "lucide-react";
import type { MembershipPayment } from "@/types";

interface Props {
  payments: MembershipPayment[];
}

export function MembershipList({ payments }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const pendingPayments = payments.filter((p) => p.status === "pending");

  const approveMembership = async (payment: MembershipPayment) => {
    setLoading(payment.id);
    try {
      const now       = Date.now();
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

      // ✅ Marcar pago como completado
      await updateDoc(doc(db, "membership_payments", payment.id), {
        status:     "completed",
        reviewedAt: serverTimestamp(),
      });

      // ✅ Activar membresía del usuario
      await updateDoc(doc(db, "users", payment.userId), {
        "membership.status":    "active",
        "membership.expiresAt": expiresAt,
        "membership.startedAt": now,
        "membership.lastPayment": now,
      });

      // ✅ Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId:    payment.userId,
        title:     "✅ ¡Membresía activada!",
        body:      `Tu pago de ${payment.amount} ${payment.currency} fue verificado. Membresía activa hasta ${new Date(expiresAt).toLocaleDateString("es-CU")}.`,
        type:      "membership",
        read:      false,
        createdAt: now,
      });

    } catch (e: any) {
      console.error("Error al aprobar membresía:", e);
      alert("Error: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  const rejectMembership = async (payment: MembershipPayment) => {
    if (!confirm("¿Estás seguro de que deseas RECHAZAR este pago?")) return;

    setLoading(payment.id);
    try {
      // ✅ Marcar pago como rechazado
      await updateDoc(doc(db, "membership_payments", payment.id), {
        status:     "rejected",
        reviewedAt: serverTimestamp(),
      });

      // ✅ Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId:    payment.userId,
        title:     "❌ Pago rechazado",
        body:      "Tu comprobante de pago no pudo ser verificado. Por favor verifica el monto y vuelve a intentarlo o contacta soporte.",
        type:      "membership",
        read:      false,
        createdAt: Date.now(),
      });

    } catch (e: any) {
      console.error("Error al rechazar:", e);
      alert("Error: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  if (pendingPayments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Crown className="mx-auto h-12 w-12 opacity-20 mb-3" />
        <p className="font-semibold">No hay pagos pendientes.</p>
        <p className="text-xs mt-1">¡Todo al día!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Pagos pendientes ({pendingPayments.length})
      </h2>

      {pendingPayments.map((p) => (
        <Card
          key={p.id}
          padding="md"
          className="border-l-4 border-l-yellow-500 space-y-4"
        >
          {/* Info del pago */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Usuario</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {p.userName}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Monto</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {p.amount} {p.currency}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Método</p>
              <p className="font-semibold uppercase text-gray-900 dark:text-white">
                {p.method}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Referencia</p>
              <p className="font-mono text-xs bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">
                {p.reference}
              </p>
            </div>
          </div>

          {/* Comprobante */}
          {p.screenshot && (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 uppercase font-bold">
                Comprobante
              </p>
              <div className="relative group">
                <img
                  src={p.screenshot}
                  alt="Comprobante de pago"
                  className="w-full h-40 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                />
                <a
                  href={p.screenshot}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                >
                  <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                    <ExternalLink className="h-4 w-4" />
                    Ver completo
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              loading={loading === p.id}
              onClick={() => approveMembership(p)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              loading={loading === p.id}
              onClick={() => rejectMembership(p)}
            >
              <X className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
