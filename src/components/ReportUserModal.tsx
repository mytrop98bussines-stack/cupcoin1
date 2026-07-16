import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

const REPORT_REASONS = [
  { value: "scam",          label: "🚨 Estafa / Fraude"            },
  { value: "fake_profile",  label: "🎭 Perfil falso / Suplantación" },
  { value: "spam",          label: "📨 Spam o mensajes no deseados" },
  { value: "inappropriate", label: "⚠️ Comportamiento inapropiado"  },
  { value: "other",         label: "📝 Otro motivo"                 },
];

interface Props {
  reportedUserId:   string;
  reportedUserName: string;
  onClose:          () => void;
}

export function ReportUserModal({ reportedUserId, reportedUserName, onClose }: Props) {
  const [reason, setReason]           = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      setError("Selecciona un motivo.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(
        `${BACKEND_URL}/users/${reportedUserId}/report`,
        {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ reason, description }),
        }
      );
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error enviando el reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6">
      <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Reportar a {reportedUserName}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {success ? (
          // ─── Pantalla de éxito ────────────────────────────
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Reporte enviado
            </p>
            <p className="text-xs text-gray-400">
              Nuestro equipo revisará el reporte y tomará las medidas necesarias.
              Gracias por ayudar a mantener CubaX seguro.
            </p>
            <Button size="lg" fullWidth onClick={onClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            {/* Aviso */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Los reportes falsos pueden resultar en la suspensión de tu cuenta.
                Úsalo solo si tienes evidencia real de mal comportamiento.
              </p>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Motivo del reporte
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      reason === r.value
                        ? "border-red-500 bg-red-500/5"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300"
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 transition-all ${
                      reason === r.value
                        ? "border-red-500 bg-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {reason === r.value && (
                        <div className="h-full w-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      reason === r.value
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descripción (opcional)
              </label>
              <textarea
                placeholder="Describe con detalle qué ocurrió..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 px-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
              />
              <p className="text-[10px] text-gray-400 text-right">
                {description.length}/500
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-500"
              >
                Cancelar
              </button>
              <Button
                size="lg"
                loading={loading}
                onClick={handleSubmit}
                disabled={!reason}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Enviar reporte
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
 }
