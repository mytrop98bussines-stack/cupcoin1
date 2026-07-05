import { db } from "@/lib/firebase/config";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, X, ExternalLink } from "lucide-react";

export function MembershipList({ payments }: { payments: any[] }) {
  
  // Función para aprobar
  const approveMembership = async (payment: any) => {
    try {
      await updateDoc(doc(db, "membership_payments", payment.id), { 
        status: "completed",
        reviewedAt: serverTimestamp()
      });
      await updateDoc(doc(db, "users", payment.userId), {
        "membership.status": "active",
        "membership.expiresAt": Date.now() + 30 * 24 * 60 * 60 * 1000
      });
      await addDoc(collection(db, "notifications"), {
        userId: payment.userId,
        title: "¡Membresía activada!",
        body: "Tu pago ha sido verificado.",
        type: "membership",
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error("Error al aprobar:", e); }
  };

  // Función para RECHAZAR (Nueva)
  const rejectMembership = async (payment: any) => {
    if (!confirm("¿Estás seguro de que deseas RECHAZAR este pago?")) return;
    
    try {
      // 1. Marcar el pago como rechazado
      await updateDoc(doc(db, "membership_payments", payment.id), { 
        status: "rejected",
        reviewedAt: serverTimestamp()
      });

      // 2. Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId: payment.userId,
        title: "Pago rechazado",
        body: "Tu comprobante de pago no pudo ser verificado. Por favor, contacta a soporte.",
        type: "membership",
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) { 
      console.error("Error al rechazar:", e); 
      alert("Error al procesar el rechazo.");
    }
  };

  const pendingPayments = payments.filter(p => p.status === "pending");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Pagos Pendientes ({pendingPayments.length})</h2>
      
      {pendingPayments.map((p) => (
        <Card key={p.id} className="p-4 space-y-4 border-l-4 border-l-yellow-500">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Usuario</p>
              <p className="font-bold">{p.userName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Monto</p>
              <p className="font-bold">{p.amount} {p.currency}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Método</p>
              <p className="uppercase font-semibold">{p.method}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Referencia</p>
              <p className="font-mono bg-gray-100 px-2 py-0.5 rounded">{p.reference}</p>
            </div>
          </div>

          {p.screenshot && (
            <div className="mt-2">
              <a href={p.screenshot} target="_blank" rel="noreferrer" className="block text-blue-500 underline text-xs">
                Ver comprobante de pago <ExternalLink className="inline h-3 w-3" />
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 bg-green-600" onClick={() => approveMembership(p)}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar
            </Button>
            {/* Botón de rechazar conectado */}
            <Button variant="destructive" className="flex-1" onClick={() => rejectMembership(p)}>
              <X className="mr-2 h-4 w-4" /> Rechazar
            </Button>
          </div>
        </Card>
      ))}
      
      {pendingPayments.length === 0 && (
        <p className="text-center text-gray-400 py-10">No hay pagos pendientes.</p>
      )}
    </div>
  );
}
