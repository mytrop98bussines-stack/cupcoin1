import { db } from "@/lib/firebase/config";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function KYCList({ users }: { users: any[] }) {
  const handleKYCAction = async (userId: string, status: "verified" | "rejected") => {
    try {
      // 1. Actualizar estado del usuario
      await updateDoc(doc(db, "users", userId), { 
        kycStatus: status,
        updatedAt: serverTimestamp() 
      });

      // 2. Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId,
        title: status === "verified" ? "Verificación Aprobada" : "Verificación Rechazada",
        body: status === "verified" 
          ? "Tu identidad ha sido verificada exitosamente." 
          : "Tu solicitud de KYC fue rechazada. Por favor, revisa tus documentos.",
        type: "kyc",
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error en KYC:", error);
    }
  };

  return (
    <div className="space-y-4">
      {users.map((u) => (
        <Card key={u.id} className="p-4 flex justify-between items-center">
          <div>
            <p className="font-bold">{u.fullName}</p>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleKYCAction(u.id, "verified")}>Aprobar</Button>
            <Button size="sm" variant="destructive" onClick={() => handleKYCAction(u.id, "rejected")}>Rechazar</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
