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
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState("biometría");
  const [show, setShow]                   = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        // ✅ Verificación defensiva
        if (typeof isBiometricSupported !== "function") return;
        if (!isBiometricSupported()) return;

        const savedUid = localStorage.getItem("cubax_uid");
        const hadBio   = localStorage.getItem("biometric_enabled");

        if (savedUid && hadBio === "1") {
          // ✅ getBiometricType envuelto en try/catch por seguridad
          let type = "biometría";
          try {
            if (typeof getBiometricType === "function") {
              const result = await getBiometricType();
              if (result && typeof result === "string") {
                type = result;
              }
            }
          } catch (err) {
            console.warn("⚠️ No se pudo obtener tipo de biometría:", err);
          }

          setBiometricType(type);
          setShow(true);
        }
      } catch (err) {
        // ✅ Cualquier error en la detección → simplemente no mostramos el botón
        console.warn("⚠️ Error verificando biometría:", err);
        setShow(false);
      }
    };
    void check();
  }, []);

  const handleLogin = async () => {
    const uid = localStorage.getItem("cubax_uid");
    if (!uid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await authenticateBiometric(uid);

      if (result.success && result.data) {
        onSuccess(result.data);
      } else {
        setError(result.error || "Error autenticando");

        if (
          result.error?.includes("no encontrada") ||
          result.error?.includes("No hay credenciales") ||
          result.error?.includes("not found")
        ) {
          localStorage.removeItem("biometric_enabled");
          setShow(false);
        }
      }
    } catch (err: any) {
      console.error("❌ Error biométrico:", err);
      setError(err.message || "Error autenticando");
    } finally {
      setLoading(false);
    }
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
