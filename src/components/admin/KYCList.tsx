import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, X, ExternalLink, ShieldAlert } from "lucide-react";

export function KYCList({ users }: { users: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleKYCAction = async (user: any, status: "verified" | "rejected") => {
    setLoading(user.id);
    try {
      // 1. Actualizar estado del usuario en Firestore
      await updateDoc(doc(db, "users", user.id), {
        kycStatus: status,
        reviewedAt: serverTimestamp()
      });

      // 2. Notificar al usuario automáticamente
      await addDoc(collection(db, "notifications"), {
        userId: user.id,
        title: status === "verified" ? "✅ Identidad Verificada" : "❌ Verificación Rechazada",
        body: status === "verified" 
          ? "Tu identidad ha sido aprobada. Ya puedes operar sin límites en CubaX."
          : "Tu solicitud de KYC fue rechazada. Por favor, revisa tus documentos e intenta de nuevo.",
        type: "kyc",
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error al procesar KYC:", e);
      alert("Hubo un error al procesar la acción.");
    } finally {
      setLoading(null);
    }
  };

  const pendingKYCs = users.filter(u => u.kycStatus === "pending_verification");

  if (pendingKYCs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <ShieldAlert className="mx-auto h-12 w-12 opacity-20 mb-2" />
        <p>No hay solicitudes KYC pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Solicitudes Pendientes ({pendingKYCs.length})</h2>
      
      {pendingKYCs.map((user) => (
        <Card key={user.id} className="p-5 space-y-4 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg">{user.kycData?.fullName || "Usuario sin nombre"}</p>
              <p className="text-sm text-gray-500">CI: {user.kycData?.idNumber}</p>
            </div>
            <Badge variant="warning">Pendiente</Badge>
          </div>

          <p className="text-sm text-gray-600">Dirección: {user.kycData?.address}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400">Documento (CI)</p>
              <a href={user.kycDocuments?.idFront} target="_blank" rel="noreferrer">
                <img src={user.kycDocuments?.idFront} className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
              </a>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400">Selfie</p>
              <a href={user.kycDocuments?.selfie} target="_blank" rel="noreferrer">
                <img src={user.kycDocuments?.selfie} className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
              </a>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1 bg-emerald-600" 
              loading={loading === user.id} 
              onClick={() => handleKYCAction(user, "verified")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1" 
              loading={loading === user.id} 
              onClick={() => handleKYCAction(user, "rejected")}
            >
              <X className="mr-2 h-4 w-4" /> Rechazar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
      }
    
