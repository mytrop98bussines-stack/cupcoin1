import { db } from "@/lib/firebase/config";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function MembershipList({ payments }: { payments: any[] }) {
  const approveMembership = async (payment: any) => {
    try {
      // 1. Confirmar pago (Nombre de colección corregido a 'membership_payments')
      await updateDoc(doc(db, "membership_payments", payment.id), { 
        status: "completed",
        reviewedAt: serverTimestamp()
      });

      // 2. Activar membresía en perfil del usuario
      await updateDoc(doc(db, "users", payment.userId), {
        "membership.status": "active",
        "membership.expiresAt": Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 días
      });

      // 3. Notificar
      await addDoc(collection(db, "notifications"), {
        userId: payment.userId,
        title: "Membresía Activada",
        body: "Tu pago ha sido confirmado y tu membresía está activa.",
        type: "membership",
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) { 
      console.error("Error al aprobar membresía:", e); 
      alert("Error al procesar la aprobación");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtramos solo los pendientes para que no aparezcan los ya aprobados */}
      {payments.filter(p => p.status === "pending").map((p) => (
        <Card key={p.id} className="p-4 flex justify-between items-center">
          <div>
            <p className="font-bold">{p.userName}</p>
            <p className="text-sm">{p.amount} {p.currency}</p>
          </div>
          <Button size="sm" onClick={() => approveMembership(p)}>Confirmar Pago</Button>
        </Card>
      ))}
    </div>
  );
}
