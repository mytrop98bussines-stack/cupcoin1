import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Shield, Check, X, Eye, ExternalLink } from "lucide-react";

interface KYCUser {
  id: string;
  fullName: string;
  idNumber: string;
  address: string;
  kycStatus: string;
  kycDocuments?: {
    idFront?: string;
    selfie?: string;
  };
}

export function AdminKYCPage() {
  const [pendingUsers, setPendingUsers] = useState<KYCUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Cargar usuarios pendientes
  const fetchPendingKYC = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("kycStatus", "==", "pending_verification"));
      const querySnapshot = await getDocs(q);
      const users: KYCUser[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as KYCUser);
      });
      setPendingUsers(users);
    } catch (error) {
      console.error("Error cargando solicitudes KYC:", error);
      alert("No tienes permisos de administrador o hubo un error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingKYC();
  }, [fetchPendingKYC]);

  // Procesar decisión (Aprobar o Rechazar)
  const handleResolveKYC = async (userId: string, approve: boolean) => {
    setActionLoading(userId);
    try {
      const userRef = doc(db, "users", userId);
      const newStatus = approve ? "verified" : "rejected";
      
      await updateDoc(userRef, { kycStatus: newStatus });
      
      // Filtrar el usuario de la lista local
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      alert(approve ? "Usuario aprobado con éxito" : "Solicitud rechazada");
    } catch (error) {
      console.error("Error al procesar resolución:", error);
      alert("Fallo al actualizar el documento.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Cargando solicitudes pendientes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel de Control: Verificación KYC</h1>
          <p className="text-xs text-gray-500">Administración interna de Cubax</p>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 dark:text-gray-400">
          No hay solicitudes de verificación pendientes por el momento. ¡Buen trabajo!
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((u) => (
            <Card key={u.id} padding="md" className="border-gray-200 dark:border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{u.fullName}</h3>
                  <p className="text-xs text-gray-400">UID: {u.id}</p>
                </div>
                <Badge variant="info">Pendiente revisión</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p><span className="text-gray-400">CI (Identificación):</span> <span className="font-medium text-gray-800 dark:text-gray-200">{u.idNumber}</span></p>
                  <p><span className="text-gray-400">Dirección:</span> <span className="font-medium text-gray-800 dark:text-gray-200">{u.address}</span></p>
                </div>

                {/* Enlaces de los documentos de Cloudinary */}
                <div className="flex flex-wrap gap-2 items-center">
                  {u.kycDocuments?.idFront && (
                    <a 
                      href={u.kycDocuments.idFront} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-brand-500 bg-brand-500/5 hover:bg-brand-500/10 px-3 py-2 rounded-xl transition-colors border border-brand-500/20"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Frente ID <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {u.kycDocuments?.selfie && (
                    <a 
                      href={u.kycDocuments.selfie} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-brand-500 bg-brand-500/5 hover:bg-brand-500/10 px-3 py-2 rounded-xl transition-colors border border-brand-500/20"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Selfie <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Botones de acción rápida */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleResolveKYC(u.id, false)}
                  disabled={actionLoading !== null}
                  className="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                >
                  <X className="h-4 w-4 mr-1" /> Rechazar
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleResolveKYC(u.id, true)}
                  loading={actionLoading === u.id}
                  disabled={actionLoading !== null}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" /> Aprobar KYC
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
        }
      
