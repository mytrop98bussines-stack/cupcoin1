import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, X, Loader2 } from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface DisputeModalProps {
  tradeId:    string;
  isBuyer:    boolean;
  onClose:    () => void;
  onSuccess?: () => void;
}

const DISPUTE_REASONS_BUYER = [
  { value: "payment_not_received", label: "Envié el pago pero no me liberan cripto" },
  { value: "wrong_amount",         label: "El vendedor pide un monto diferente" },
  { value: "no_response",          label: "El vendedor no responde" },
  { value: "scam_attempt",         label: "Sospecha de estafa" },
  { value: "other",                label: "Otro motivo" },
];

const DISPUTE_REASONS_SELLER = [
  { value: "payment_not_received", label: "El comprador dice que pagó pero no recibí nada" },
  { value: "wrong_amount",         label: "El comprador pagó menos del acordado" },
  { value: "fake_proof",           label: "El comprobante parece falso" },
  { value: "no_response",          label: "El comprador no responde" },
  { value: "other",                label: "Otro motivo" },
];

export function DisputeModal({
  tradeId,
  isBuyer,
  onClose,
  onSuccess,
}: DisputeModalProps) {
  const [reason, setReason]           = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [step, setStep]               = useState<1 | 2>(1);

  const reasons = isBuyer ? DISPUTE_REASONS_BUYER : DISPUTE_REASONS_SELLER;

  const handleSubmit = async () => {
    if (!reason) {
      setError("Debes seleccionar un motivo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/trades/${tradeId}/dispute`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason:      reasons.find((r) => r.value === reason)?.label || reason,
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || "Error al iniciar disputa");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Iniciar Disputa
              </h3>
              <p className="text-[10px] text-gray-400">
                Paso {step} de 2
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}>
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Warning */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
            ⚠️ <strong>Las disputas falsas se penalizan.</strong> Solo inicia una si hay un problema real.
            El sistema revisará el chat, evidencias y comportamiento de ambos.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Paso 1 — Motivo */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                ¿Cuál es el problema?
              </label>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      reason === r.value
                        ? "border-red-500 bg-red-500/5"
                        : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        reason === r.value
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}>
                        {reason === r.value && (
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <span className={`text-xs ${
                        reason === r.value
                          ? "font-bold text-red-600 dark:text-red-400"
                          : "font-medium text-gray-700 dark:text-gray-300"
                      }`}>
                        {r.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                disabled={!reason}
                onClick={() => setStep(2)}
                className="bg-red-500 hover:bg-red-600"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Paso 2 — Descripción */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Describe con más detalle (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica qué pasó exactamente. Incluye referencias, fechas, montos..."
                rows={5}
                maxLength={500}
                className="w-full px-4 py-3 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
              <p className="text-[10px] text-gray-400 text-right mt-1">
                {description.length}/500
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                💡 Después de iniciar la disputa, podrás subir capturas de pantalla
                como evidencia. La contraparte tendrá 30 min para presentar sus pruebas.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button
                fullWidth
                loading={loading}
                onClick={handleSubmit}
                className="bg-red-500 hover:bg-red-600"
                icon={<AlertTriangle className="h-4 w-4" />}
              >
                Iniciar Disputa
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
