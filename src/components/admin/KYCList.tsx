import { useState } from "react";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, X, ShieldAlert, Eye } from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface Props {
  users: any[];
}

export function KYCList({ users }: Props) {
  const [loading, setLoading]           = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showReject, setShowReject]     = useState<string | null>(null);

  const pendingKYCs = users.filter(
    (u) => u.kycStatus === "pending_verification"
  );

  // ─── Aprobar o rechazar KYC via backend ───────────────────
  const handleKYCAction = async (
    user:   any,
    status: "verified" | "rejected"
  ) => {
    if (status === "rejected" && !rejectReason[user.id]?.trim()) {
      alert("Escribe el motivo del rechazo.");
      return;
    }

    setLoading(user.id);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/admin/kyc/review`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId:       user.id,
          status,
          rejectReason: status === "rejected" ? rejectReason[user.id] : null,
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setShowReject(null);
    } catch (e: any) {
      console.error("❌ Error al procesar KYC:", e);
      alert("Hubo un error: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  if (pendingKYCs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <ShieldAlert className="mx-auto h-12 w-12 opacity-20 mb-3" />
        <p className="font-semibold">No hay solicitudes KYC pendientes.</p>
        <p className="text-xs mt-1">¡Todo está al día!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Solicitudes pendientes ({pendingKYCs.length})
      </h2>

      {pendingKYCs.map((user) => (
        <Card
          key={user.id}
          padding="md"
          className="border-l-4 border-l-blue-500 space-y-4"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {user.kycData?.fullName || "Sin nombre"}
              </p>
              <p className="text-xs text-gray-500">
                CI: {user.kycData?.idNumber || "—"}
              </p>
              <p className="text-xs text-gray-500">
                {user.kycData?.address || "—"}
              </p>
            </div>
            <Badge variant="warning" size="sm">Pendiente</Badge>
          </div>

          {/* UID */}
          <p className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded">
            UID: {user.id}
          </p>

          {/* Documentos */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Documento (CI)", url: user.kycDocuments?.idFront },
              { label: "Selfie con CI",  url: user.kycDocuments?.selfie  },
            ].map((docItem) => (
              <div key={docItem.label} className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {docItem.label}
                </p>
                {docItem.url ? (
                  <a
                    href={docItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative group"
                  >
                    <img
                      src={docItem.url}
                      alt={docItem.label}
                      className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-white/10 group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </a>
                ) : (
                  <div className="w-full h-32 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Sin imagen</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Formulario de rechazo */}
          {showReject === user.id && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Motivo del rechazo
              </label>
              <textarea
                value={rejectReason[user.id] || ""}
                onChange={(e) =>
                  setRejectReason((prev) => ({
                    ...prev,
                    [user.id]: e.target.value,
                  }))
                }
                placeholder="Ej: Documento no legible, foto borrosa..."
                rows={3}
                className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-red-300 dark:border-red-500/30 rounded-xl px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2">
            {showReject === user.id ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReject(null)}
                  disabled={loading === user.id}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  loading={loading === user.id}
                  onClick={() => handleKYCAction(user, "rejected")}
                >
                  <X className="h-4 w-4 mr-1" />
                  Confirmar rechazo
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-200 text-red-500 hover:bg-red-50"
                  onClick={() => setShowReject(user.id)}
                  disabled={loading === user.id}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  loading={loading === user.id}
                  onClick={() => handleKYCAction(user, "verified")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Aprobar
                </Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
