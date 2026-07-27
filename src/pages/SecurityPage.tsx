import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import {
  Lock, Eye, EyeOff, Shield, CheckCircle2,
  AlertTriangle, Clock, X, Loader2,
  QrCode, KeyRound, Copy, Check,
  Fingerprint, Trash2,
} from "lucide-react";
import {
  isBiometricSupported,
  getBiometricType,
  getBiometricStatus,
  registerBiometric,
  removeBiometric,
} from "@/lib/biometric";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

// ─── Tipos ────────────────────────────────────────────────
type TwoFAStep =
  | "idle"        // pantalla principal
  | "setup_qr"    // mostrando QR
  | "setup_verify"// verificando código de activación
  | "disable";    // desactivando

export function SecurityPage() {
  const { user } = useAppStore();

  // ─── Estados contraseña ───────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  // ─── Estados 2FA ──────────────────────────────────────────
  const [twoFAStep, setTwoFAStep]         = useState<TwoFAStep>("idle");
  const [twoFALoading, setTwoFALoading]   = useState(false);
  const [twoFAError, setTwoFAError]       = useState<string | null>(null);
  const [twoFASuccess, setTwoFASuccess]   = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl]         = useState<string | null>(null);
  const [manualKey, setManualKey]         = useState<string | null>(null);
  const [setupCode, setSetupCode]         = useState("");
  const [disableCode, setDisableCode]     = useState("");
  const [keyCopied, setKeyCopied]         = useState(false);

  // ─── 🆕 Estados Biometría ─────────────────────────────────
  const [bioSupported, setBioSupported] = useState(false);
  const [bioType, setBioType]           = useState("biometría");
  const [bioDevices, setBioDevices]     = useState<any[]>([]);
  const [bioLoading, setBioLoading]     = useState(false);

  const twoFAEnabled = (user as any)?.twoFAEnabled || false;

  // ─── 🆕 useEffect: chequear soporte biométrico ────────────
  useEffect(() => {
    const check = async () => {
      const sup = isBiometricSupported();
      setBioSupported(sup);
      if (sup) {
        const type = await getBiometricType();
        setBioType(type);
        const status = await getBiometricStatus();
        if (status.success) setBioDevices(status.devices || []);
      }
    };
    void check();
  }, []);

  // ─── 🆕 Handler: activar biometría ────────────────────────
  const handleActivateBio = async () => {
    setBioLoading(true);
    const result = await registerBiometric();
    if (result.success) {
      localStorage.setItem("biometric_enabled", "1");
      const status = await getBiometricStatus();
      if (status.success) setBioDevices(status.devices || []);
      alert(`✅ ${bioType} activado`);
    } else {
      alert("Error: " + result.error);
    }
    setBioLoading(false);
  };

  // ─── 🆕 Handler: quitar dispositivo biométrico ────────────
  const handleRemoveBio = async (deviceId?: string) => {
    if (!confirm("¿Eliminar este dispositivo?")) return;
    await removeBiometric(deviceId);
    if (!deviceId) localStorage.removeItem("biometric_enabled");
    const status = await getBiometricStatus();
    if (status.success) setBioDevices(status.devices || []);
  };

  // ─── Fuerza de contraseña ─────────────────────────────────
  const passwordStrength = (() => {
    if (!newPassword)            return { level: 0, label: "",           color: ""               };
    if (newPassword.length < 6)  return { level: 1, label: "Muy débil",  color: "bg-red-500"     };
    if (newPassword.length < 8)  return { level: 2, label: "Débil",      color: "bg-orange-500"  };
    if (newPassword.length < 12) return { level: 3, label: "Buena",      color: "bg-amber-500"   };
    return                              { level: 4, label: "Fuerte ✓",   color: "bg-emerald-500" };
  })();

  // ─── Helper: mostrar éxito temporal ───────────────────────
  const showTwoFASuccess = (msg: string) => {
    setTwoFASuccess(msg);
    setTimeout(() => setTwoFASuccess(null), 3000);
  };

  // ─── Helper: limpiar estado 2FA ───────────────────────────
  const resetTwoFAState = () => {
    setTwoFAStep("idle");
    setTwoFAError(null);
    setQrDataUrl(null);
    setManualKey(null);
    setSetupCode("");
    setDisableCode("");
    setKeyCopied(false);
  };

  // ─── Cambiar contraseña ───────────────────────────────────
  const handleChangePassword = useCallback(async () => {
    setError(null);

    if (!currentPassword) {
      setError("Ingresa tu contraseña actual.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/security/change-password`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  // ─── Iniciar setup 2FA → obtener QR ──────────────────────
  const handleStart2FASetup = async () => {
    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/auth/2fa/setup/init`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!data.success) {
        setTwoFAError(data.error || "Error al generar el QR.");
        return;
      }

      setQrDataUrl(data.qrDataUrl);
      setManualKey(data.manualEntryKey);
      setTwoFAStep("setup_qr");
    } catch {
      setTwoFAError("Error de conexión.");
    } finally {
      setTwoFALoading(false);
    }
  };

  // ─── Confirmar activación 2FA ─────────────────────────────
  const handleConfirm2FASetup = async () => {
    if (setupCode.length !== 6) {
      setTwoFAError("Ingresa el código de 6 dígitos.");
      return;
    }

    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/auth/2fa/setup/confirm`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ code: setupCode }),
      });
      const data = await res.json();

      if (!data.success) {
        setTwoFAError(data.error || "Código incorrecto.");
        return;
      }

      useAppStore.setState((state) => ({
        user: state.user
          ? { ...state.user, twoFAEnabled: true }
          : null,
      }));

      resetTwoFAState();
      showTwoFASuccess("✅ 2FA activado correctamente.");
    } catch {
      setTwoFAError("Error de conexión.");
    } finally {
      setTwoFALoading(false);
    }
  };

  // ─── Desactivar 2FA ───────────────────────────────────────
  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      setTwoFAError("Ingresa el código de 6 dígitos.");
      return;
    }

    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/auth/2fa/disable`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();

      if (!data.success) {
        setTwoFAError(data.error || "Código incorrecto.");
        return;
      }

      useAppStore.setState((state) => ({
        user: state.user
          ? { ...state.user, twoFAEnabled: false }
          : null,
      }));

      resetTwoFAState();
      showTwoFASuccess("✅ 2FA desactivado.");
    } catch {
      setTwoFAError("Error de conexión.");
    } finally {
      setTwoFALoading(false);
    }
  };

  // ─── Copiar clave manual ──────────────────────────────────
  const handleCopyKey = async () => {
    if (!manualKey) return;
    await navigator.clipboard.writeText(manualKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  if (!user) return null;

  const lastLogin = localStorage.getItem("cubax_last_login")
    ? new Date(Number(localStorage.getItem("cubax_last_login"))).toLocaleString("es-CU")
    : "—";

  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleString("es-CU")
    : "—";
  // ─── PANTALLA: QR de activación ───────────────────────────
  if (twoFAStep === "setup_qr") {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

        <div className="flex items-center gap-3">
          <button
            onClick={resetTwoFAState}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Activar 2FA
            </h1>
            <p className="text-xs text-gray-400">
              Paso 1 — Escanea el código QR
            </p>
          </div>
        </div>

        {twoFAError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 flex-1">{twoFAError}</p>
            <button onClick={() => setTwoFAError(null)}>
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}

        <Card padding="md" className="space-y-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Instrucciones
          </p>
          {[
            { n: "1", text: 'Descarga "Google Authenticator", "Aegis" o "Microsoft Authenticator".' },
            { n: "2", text: "Abre la app y selecciona agregar cuenta." },
            { n: "3", text: "Escanea el QR de abajo o ingresa la clave manual." },
            { n: "4", text: "Pulsa continuar e ingresa el código que te muestre la app." },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-white">{step.n}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">{step.text}</p>
            </div>
          ))}
        </Card>

        <Card padding="md">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Código QR
          </p>
          <div className="flex justify-center">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <img src={qrDataUrl} alt="QR 2FA" className="h-48 w-48" />
              </div>
            ) : (
              <div className="h-48 w-48 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="h-4 w-4 text-brand-500" />
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Clave manual
            </p>
          </div>
          <p className="text-[11px] text-gray-400 mb-3">
            Si no puedes escanear el QR usa esta clave directamente en la app.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <p className="flex-1 font-mono text-sm font-bold text-gray-900 dark:text-white tracking-widest break-all">
              {manualKey || "—"}
            </p>
            <button
              onClick={handleCopyKey}
              className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-brand-500/20"
            >
              {keyCopied
                ? <Check className="h-4 w-4 text-emerald-500" />
                : <Copy  className="h-4 w-4 text-brand-500"   />
              }
            </button>
          </div>
        </Card>

        <Button
          size="lg"
          fullWidth
          onClick={() => {
            setTwoFAStep("setup_verify");
            setTwoFAError(null);
            setSetupCode("");
          }}
          icon={<Shield className="h-4 w-4" />}
        >
          Continuar → Verificar código
        </Button>

      </div>
    );
  }

  // ─── PANTALLA: Verificar código de activación ─────────────
  if (twoFAStep === "setup_verify") {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTwoFAStep("setup_qr")}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Verificar código
            </h1>
            <p className="text-xs text-gray-400">
              Paso 2 — Confirma que todo funciona
            </p>
          </div>
        </div>

        {twoFAError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 flex-1">{twoFAError}</p>
            <button onClick={() => setTwoFAError(null)}>
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}

        <Card padding="md" className="space-y-4">
          <div className="text-center py-2">
            <div className="h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-8 w-8 text-brand-500" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Ingresa el código de tu app
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Abre Google Authenticator o Aegis y escribe el código de 6 dígitos que aparece para CubaX.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Código de verificación
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={setupCode}
              maxLength={6}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setSetupCode(val);
                if (twoFAError) setTwoFAError(null);
              }}
              className="w-full px-4 py-4 text-center text-2xl font-black tracking-widest rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>

          <Button
            size="lg"
            fullWidth
            loading={twoFALoading}
            disabled={setupCode.length !== 6}
            onClick={handleConfirm2FASetup}
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Activar 2FA
          </Button>
        </Card>

        <button
          onClick={() => setTwoFAStep("setup_qr")}
          className="w-full text-xs text-brand-500 font-semibold text-center py-2"
        >
          ← Volver al código QR
        </button>

      </div>
    );
  }

  // ─── PANTALLA: Desactivar 2FA ─────────────────────────────
  if (twoFAStep === "disable") {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

        <div className="flex items-center gap-3">
          <button
            onClick={resetTwoFAState}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Desactivar 2FA
            </h1>
            <p className="text-xs text-gray-400">
              Confirma con tu app de autenticación
            </p>
          </div>
        </div>

        {twoFAError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 flex-1">{twoFAError}</p>
            <button onClick={() => setTwoFAError(null)}>
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ⚠️ Desactivar el 2FA reduce la seguridad de tu cuenta.
            Solo hazlo si realmente es necesario.
          </p>
        </div>

        <Card padding="md" className="space-y-4">
          <div className="text-center py-2">
            <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Ingresa el código de tu app
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Para confirmar que eres tú, ingresa el código actual de tu app de autenticación.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Código de verificación
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={disableCode}
              maxLength={6}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setDisableCode(val);
                if (twoFAError) setTwoFAError(null);
              }}
              className="w-full px-4 py-4 text-center text-2xl font-black tracking-widest rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>

          <Button
            size="lg"
            fullWidth
            loading={twoFALoading}
            disabled={disableCode.length !== 6}
            onClick={handleDisable2FA}
            className="!bg-red-500 hover:!bg-red-600"
            icon={<X className="h-4 w-4" />}
          >
            Desactivar 2FA
          </Button>
        </Card>

        <button
          onClick={resetTwoFAState}
          className="w-full text-xs text-gray-400 font-semibold text-center py-2"
        >
          Cancelar
        </button>

      </div>
    );
  }

  // ─── PANTALLA PRINCIPAL ───────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Seguridad
          </h1>
          <p className="text-xs text-gray-400">
            Gestiona tu contraseña y sesiones
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex-1">
            ✅ Contraseña actualizada correctamente.
          </p>
          <button onClick={() => setSuccess(false)}>
            <X className="h-3.5 w-3.5 text-emerald-400" />
          </button>
        </div>
      )}

      {twoFASuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{twoFASuccess}</p>
        </div>
      )}

      {/* ═══ 🆕 BIOMETRÍA ═════════════════════════════════════ */}
      {bioSupported && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            Biometría
          </h3>
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <Fingerprint className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {bioType}
                </p>
                <p className="text-xs text-gray-400">
                  {bioDevices.length > 0
                    ? `${bioDevices.length} dispositivo${bioDevices.length !== 1 ? "s" : ""} activo${bioDevices.length !== 1 ? "s" : ""}`
                    : "Acceso rápido y seguro"}
                </p>
              </div>
            </div>

            {bioDevices.length > 0 ? (
              <>
                <div className="space-y-1.5">
                  {bioDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {device.deviceName}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(device.createdAt).toLocaleDateString("es-CU")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveBio(device.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  fullWidth
                  loading={bioLoading}
                  onClick={handleActivateBio}
                  variant="outline"
                  icon={<Fingerprint className="h-4 w-4" />}
                >
                  Agregar otro dispositivo
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                fullWidth
                loading={bioLoading}
                onClick={handleActivateBio}
                icon={<Fingerprint className="h-4 w-4" />}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90"
              >
                Activar {bioType}
              </Button>
            )}
          </Card>
        </div>
      )}

      {/* ═══ 2FA ════════════════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Doble autenticación (2FA)
        </h3>
        <Card padding="md" className="space-y-3">

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-brand-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {twoFAEnabled ? "2FA Activado ✅" : "2FA Desactivado"}
              </p>
              <p className="text-xs text-gray-400">
                {twoFAEnabled
                  ? "Tu cuenta está protegida con Google Authenticator."
                  : "Activa 2FA para mayor seguridad."}
              </p>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            twoFAEnabled
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-amber-500/10 border-amber-500/20"
          }`}>
            <p className={`text-xs text-center ${
              twoFAEnabled
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              {twoFAEnabled
                ? "🔐 Al iniciar sesión necesitarás el código de tu app de autenticación."
                : "⚠️ Sin 2FA tu cuenta es más vulnerable. Recomendamos activarlo."}
            </p>
          </div>

          {!twoFAEnabled && (
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mb-1">
                Apps compatibles:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Google Authenticator", "Aegis (Android)", "Microsoft Authenticator"].map((app) => (
                  <span
                    key={app}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {twoFAEnabled ? (
            <Button
              size="sm"
              fullWidth
              loading={twoFALoading}
              onClick={() => {
                setTwoFAStep("disable");
                setTwoFAError(null);
                setDisableCode("");
              }}
              className="!bg-red-500/10 !text-red-600 dark:!text-red-400 hover:!bg-red-500/20 !border-0"
              icon={<X className="h-4 w-4" />}
            >
              Desactivar 2FA
            </Button>
          ) : (
            <Button
              size="sm"
              fullWidth
              loading={twoFALoading}
              onClick={handleStart2FASetup}
              icon={<QrCode className="h-4 w-4" />}
            >
              Activar 2FA con Authenticator
            </Button>
          )}

          {twoFAError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400 flex-1">{twoFAError}</p>
              <button onClick={() => setTwoFAError(null)}>
                <X className="h-3.5 w-3.5 text-red-400" />
              </button>
            </div>
          )}

        </Card>
      </div>

      {/* ═══ CAMBIAR CONTRASEÑA ══════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Cambiar contraseña
        </h3>
        <Card padding="md" className="space-y-4">

          <Input
            label="Contraseña actual"
            type={showCurrent ? "text" : "password"}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            rightElement={
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <div className="space-y-2">
            <Input
              label="Nueva contraseña"
              type={showNew ? "text" : "password"}
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-1 rounded-full transition-all ${
                        level <= passwordStrength.level
                          ? passwordStrength.color
                          : "bg-gray-200 dark:bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400">{passwordStrength.label}</p>
              </div>
            )}
          </div>

          <Input
            label="Confirmar nueva contraseña"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={
              confirmPassword && confirmPassword !== newPassword
                ? "Las contraseñas no coinciden"
                : undefined
            }
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <Button
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleChangePassword}
            disabled={
              !currentPassword ||
              !newPassword     ||
              !confirmPassword ||
              newPassword !== confirmPassword
            }
            icon={<Shield className="h-4 w-4" />}
          >
            Actualizar contraseña
          </Button>
        </Card>
      </div>

      {/* ═══ INFORMACIÓN DE SESIÓN ═══════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Información de sesión
        </h3>
        <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {[
            {
              icon:  <Clock        className="h-4 w-4 text-blue-500"    />,
              label: "Último acceso",
              value: lastLogin,
            },
            {
              icon:  <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
              label: "Cuenta creada",
              value: createdAt,
            },
            {
              icon:  <Shield       className="h-4 w-4 text-brand-500"   />,
              label: "Método 2FA",
              value: twoFAEnabled ? "Google Authenticator (TOTP)" : "No activado",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* ═══ CONSEJOS DE SEGURIDAD ═══════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Consejos de seguridad
        </h3>
        <Card padding="md" className="space-y-3">
          {[
            { icon: "🔐", title: "Usa una contraseña fuerte",  desc: "Mínimo 12 caracteres con letras, números y símbolos."   },
            { icon: "🚫", title: "No compartas tu contraseña", desc: "CubaX nunca te pedirá tu contraseña por chat o correo." },
            { icon: "📱", title: "Protege tu dispositivo",     desc: "Activa el bloqueo de pantalla en tu teléfono."          },
            { icon: "⚠️", title: "Cuidado con el phishing",    desc: "Verifica siempre que estés en la app oficial de CubaX." },
          ].map((tip) => (
            <div key={tip.title} className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{tip.icon}</span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{tip.title}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>

    </div>
  );
}
