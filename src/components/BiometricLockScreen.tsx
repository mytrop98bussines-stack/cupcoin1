import { useState, useEffect, useRef } from "react";
import { Fingerprint, Lock, Loader2, LogOut } from "lucide-react";
import { authenticateBiometric, getBiometricType, isBiometricSupported } from "@/lib/biometric";
import { Logo } from "@/components/Logo";

interface BiometricLockScreenProps {
  onUnlock: (data: any) => void;
  onCancel: () => void;
}

export function BiometricLockScreen({ onUnlock, onCancel }: BiometricLockScreenProps) {
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState("biometría");
  const [initError, setInitError]         = useState(false);
  const autoLaunchedRef                    = useRef(false);

  const userName  = localStorage.getItem("cubax_name")  || "Usuario";
  const userEmail = localStorage.getItem("cubax_email") || "";

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // ✅ Verificar soporte antes de todo
        if (!isBiometricSupported()) {
          if (!cancelled) setInitError(true);
          return;
        }

        // ✅ Obtener tipo de biometría con protección
        try {
          const type = await getBiometricType();
          if (!cancelled && type && typeof type === "string") {
            setBiometricType(type);
          }
        } catch (err) {
          console.warn("⚠️ No se pudo detectar tipo de biometría:", err);
        }

        // ✅ Auto-lanzar el prompt SOLO UNA VEZ y protegido
        if (!autoLaunchedRef.current && !cancelled) {
          autoLaunchedRef.current = true;
          setTimeout(() => {
            if (!cancelled) void handleUnlock();
          }, 500);
        }
      } catch (err) {
        console.error("❌ Error inicializando BiometricLockScreen:", err);
        if (!cancelled) setInitError(true);
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnlock = async () => {
    try {
      const uid = localStorage.getItem("cubax_uid");
      if (!uid) {
        setError("No se encontró UID");
        return;
      }

      setLoading(true);
      setError(null);

      const result = await authenticateBiometric(uid);

      if (result.success && result.data) {
        onUnlock(result.data);
      } else {
        setError(result.error || "Error autenticando");
      }
    } catch (err: any) {
      console.error("❌ Error en handleUnlock:", err);
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleUsePassword = () => {
    localStorage.removeItem("biometric_enabled");
    localStorage.removeItem("cubax_token");
    localStorage.removeItem("cubax_refresh_token");
    onCancel();
  };

  // ✅ Si la biometría no está disponible o hubo error de init, redirige al login
  useEffect(() => {
    if (initError) {
      console.warn("⚠️ Biometría no disponible, redirigiendo a login...");
      localStorage.removeItem("biometric_enabled");
      onCancel();
    }
  }, [initError, onCancel]);

  if (initError) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decoración */}
      <div className="absolute top-0 left-0 h-96 w-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 h-96 w-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">

        {/* Logo */}
        <div className="mb-8 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
          <Logo size={48} className="text-white" />
        </div>

        {/* Saludo */}
        <p className="text-white/80 text-sm font-medium mb-1">
          Hola de nuevo,
        </p>
        <h1 className="text-white text-2xl font-black mb-1">
          {userName.split(" ")[0]}
        </h1>
        {userEmail && (
          <p className="text-white/60 text-xs mb-8 truncate max-w-full">
            {userEmail}
          </p>
        )}

        {/* Ícono de huella pulsante */}
        <button
          onClick={handleUnlock}
          disabled={loading}
          className="mb-8 relative"
        >
          {!loading && (
            <>
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
            </>
          )}

          <div className="relative h-32 w-32 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/40 flex items-center justify-center hover:bg-white/30 transition-all active:scale-95">
            {loading ? (
              <Loader2 className="h-16 w-16 text-white animate-spin" />
            ) : (
              <Fingerprint className="h-16 w-16 text-white" />
            )}
          </div>
        </button>

        {/* Texto */}
        <p className="text-white text-lg font-bold mb-2 text-center">
          {loading ? "Verificando..." : `Toca para desbloquear`}
        </p>
        <p className="text-white/70 text-xs text-center mb-6">
          Usa tu {biometricType} para acceder a CupCoin
        </p>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-2 rounded-xl bg-red-500/20 backdrop-blur-xl border border-red-300/30">
            <p className="text-white text-xs text-center font-semibold">
              {error}
            </p>
          </div>
        )}

        {/* Botón retry */}
        {error && !loading && (
          <button
            onClick={handleUnlock}
            className="mb-4 px-6 py-2.5 rounded-xl bg-white text-indigo-600 font-bold text-sm shadow-lg"
          >
            Reintentar
          </button>
        )}

        {/* Cerrar sesión */}
        <button
          onClick={handleUsePassword}
          className="flex items-center gap-1.5 text-white/70 text-xs font-semibold hover:text-white transition-colors mt-4"
        >
          <LogOut className="h-3 w-3" />
          Usar otra cuenta
        </button>

        {/* Info seguridad */}
        <div className="mt-8 flex items-center gap-1.5 text-white/60">
          <Lock className="h-3 w-3" />
          <p className="text-[10px] font-medium">
            Protegido por WebAuthn
          </p>
        </div>
      </div>
    </div>
  );
        }
