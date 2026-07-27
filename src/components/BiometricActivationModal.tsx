import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Fingerprint, X, Shield, Zap, CheckCircle2,
  Loader2, AlertTriangle,
} from "lucide-react";
import {
  registerBiometric,
  getBiometricType,
  isBiometricSupported,
} from "@/lib/biometric";

interface BiometricActivationModalProps {
  onClose:     () => void;
  onActivated?: () => void;
}

export function BiometricActivationModal({
  onClose,
  onActivated,
}: BiometricActivationModalProps) {
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState("biometría");
  const [supported, setSupported]     = useState(true);

  useEffect(() => {
    const check = async () => {
      const sup = isBiometricSupported();
      setSupported(sup);
      if (sup) {
        const type = await getBiometricType();
        setBiometricType(type);
      }
    };
    void check();
  }, []);

  const handleActivate = async () => {
    setLoading(true);
    setError(null);

    const result = await registerBiometric();

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onActivated?.();
        onClose();
      }, 2000);
    } else {
      setError(result.error || "Error desconocido");
    }

    setLoading(false);
  };

  const handleSkip = () => {
    // No preguntar de nuevo en esta sesión
    const uid = localStorage.getItem("cubax_uid");
    if (uid) {
      localStorage.setItem(`biometric_prompted_${uid}`, "1");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up">

        {success ? (
          // ─── Éxito ─────────────────────────────────────
          <div className="p-8 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto animate-scale-in">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                ¡Biometría activada!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ahora podrás acceder más rápido con {biometricType}.
              </p>
            </div>
          </div>

        ) : !supported ? (
          // ─── No soportado ──────────────────────────────
          <div className="p-8 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                No disponible
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Tu dispositivo no soporta biometría o no la tienes configurada.
              </p>
            </div>
            <Button fullWidth onClick={onClose}>
              Entendido
            </Button>
          </div>

        ) : (
          <>
            {/* Header con gradiente */}
            <div className="relative p-6 pt-8 pb-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-center">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icono con animación */}
              <div className="relative h-24 w-24 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                <div className="relative h-24 w-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40">
                  <Fingerprint className="h-12 w-12 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black mb-1">
                Inicia sesión con {biometricType}
              </h2>
              <p className="text-sm text-white/80">
                Rápido, seguro y sin contraseñas
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
                </div>
              )}

              {/* Beneficios */}
              <div className="space-y-3">
                {[
                  { icon: Zap,    title: "Acceso instantáneo",  desc: "Un toque y estás dentro"        },
                  { icon: Shield, title: "Máxima seguridad",    desc: "Tu huella nunca sale del dispositivo" },
                  { icon: CheckCircle2, title: "Sin contraseñas", desc: "Olvídate de escribir tu contraseña" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info seguridad */}
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-[11px] text-blue-700 dark:text-blue-400 text-center leading-relaxed">
                  🔒 Tu información biométrica se procesa localmente en tu dispositivo.
                  CupCoin nunca ve tu huella ni tu rostro.
                </p>
              </div>

              {/* Botones */}
              <div className="space-y-2 pt-2">
                <Button
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={handleActivate}
                  icon={<Fingerprint className="h-4 w-4" />}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 shadow-xl shadow-indigo-500/30"
                >
                  Activar {biometricType}
                </Button>

                <button
                  onClick={handleSkip}
                  className="w-full py-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
            }
