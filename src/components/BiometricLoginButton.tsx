import { useState, useEffect } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import {
  authenticateBiometric,
  isBiometricSupported,
  getBiometricType,
} from "@/lib/biometric";

interface BiometricLoginButtonProps {
  onSuccess: (data: any) => void;
}

export function BiometricLoginButton({ onSuccess }: BiometricLoginButtonProps) {
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState("biometría");
  const [show, setShow]               = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!isBiometricSupported()) return;

      const savedUid = localStorage.getItem("cubax_uid");
      const hadBio   = localStorage.getItem("biometric_enabled");

      // Solo mostrar si el usuario ya se logueó antes en este dispositivo Y activó biometría
      if (savedUid && hadBio === "1") {
        const type = await getBiometricType();
        setBiometricType(type);
        setShow(true);
      }
    };
    void check();
  }, []);

  const handleLogin = async () => {
    const uid = localStorage.getItem("cubax_uid");
    if (!uid) return;

    setLoading(true);
    setError(null);

    const result = await authenticateBiometric(uid);

    if (result.success && result.data) {
      onSuccess(result.data);
    } else {
      setError(result.error || "Error autenticando");
      // Si falla, quitar la opción biométrica
      if (result.error?.includes("no encontrada") || result.error?.includes("No hay credenciales")) {
        localStorage.removeItem("biometric_enabled");
        setShow(false);
      }
    }

    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-500 text-center font-semibold">
          {error}
        </p>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 hover:border-indigo-500/50 hover:from-indigo-500/10 hover:to-purple-500/10 transition-all disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        ) : (
          <Fingerprint className="h-5 w-5 text-indigo-500" />
        )}
        <span className="text-sm font-bold text-indigo-500">
          {loading ? "Verificando..." : `Iniciar con ${biometricType}`}
        </span>
      </button>
    </div>
  );
        }
