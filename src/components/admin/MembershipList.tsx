import { db } from "@/lib/firebase/config";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, X, ExternalLink } from "lucide-react";

export function MembershipList({ payments }: { payments: any[] }) {
  
  const approveMembership = async (payment: any) => {
    try {
      // 1. Confirmar pago en la colección de pagos
      await updateDoc(doc(db, "membership_payments", payment.id), { 
        status: "completed",
        reviewedAt: serverTimestamp()
      });

      // 2. Activar membresía en el perfil del usuario
      await updateDoc(doc(db, "users", payment.userId), {
        "membership.status": "active",
        "membership.expiresAt": Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 días
      });

      // 3. Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId: payment.userId,
        title: "¡Membresía activada!",
        body: "Tu pago ha sido verificado y tu membresía está activa por 30 días.",
        type: "membership",
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) { 
      console.error("Error al aprobar:", e); 
    }
  };

  // Filtramos para ver solo los pendientes
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

          {/* Visualización del Comprobante */}
          {p.screenshot && (
            <div className="mt-2">
              <p className="text-gray-500 text-xs mb-1">Comprobante:</p>
              <a href={p.screenshot} target="_blank" rel="noreferrer" className="block relative group">
                <img src={p.screenshot} alt="Comprobante" className="w-full h-48 object-cover rounded-lg border" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ExternalLink className="text-white" />
                </div>
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => approveMembership(p)}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar
            </Button>
            <Button variant="destructive" className="flex-1">
              <X className="mr-2 h-4 w-4" /> Rechazar
            </Button>
          </div>
        </Card>
      ))}
      
      {pendingPayments.length === 0 && (
        <p className="text-center text-gray-400 py-10">No hay pagos pendientes de revisión.</p>
      )}
    </div>
  );
              }
