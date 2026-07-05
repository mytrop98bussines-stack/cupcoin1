import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { MembershipPayment } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function MembershipList({ payments }: { payments: MembershipPayment[] }) {
  const approvePayment = async (paymentId: string) => {
    await updateDoc(doc(db, "memberships", paymentId), { status: "completed" });
    // Aquí normalmente actualizarías el campo membership.status en la colección 'users'
  };

  return (
    <div className="space-y-4">
      {payments.filter(p => p.status === "pending").map(p => (
        <Card key={p.id} className="p-4 flex justify-between items-center">
          <div>
            <p className="font-bold">{p.userName}</p>
            <p>{p.amount} {p.currency} - Método: {p.method}</p>
          </div>
          <Button onClick={() => approvePayment(p.id)}>Confirmar Pago</Button>
        </Card>
      ))}
    </div>
  );
}
