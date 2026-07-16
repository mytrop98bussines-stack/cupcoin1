import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import {
  Lock, Eye, EyeOff, Shield, CheckCircle2,
  AlertTriangle, Clock, X, Loader2,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

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
  const [togglingTwoFA, setTogglingTwoFA] = useState(false);
  const [twoFASuccess, setTwoFASuccess]   = useState<string | null>(null);

  const twoFAEnabled = (user as any)?.twoFAEnabled || false;

  const passwordStrength = (() => {
    if (!newPassword)            return { level: 0, label: "",          color: ""               };
    if (newPassword.length < 6)  return { level: 1, label: "Muy débil", color: "bg-red-500"     };
    if (newPassword.length < 8)  return { level: 2, label: "Débil",     color: "bg-orange-500"  };
    if (newPassword.length < 12) return { level: 3, label: "Buena",     color: "bg-amber-500"   };
    return                              { level: 4, label: "Fuerte ✓",  color: "bg-emerald-500" };
  })();

  // ─── Cambiar contraseña via backend ──────────────────────
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

  // ─── Activar/Desactivar 2FA ───────────────────────────────
  const handleToggle2FA = async () => {
    setTogglingTwoFA(true);
    setTwoFASuccess(null);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/auth/2fa/toggle`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ enable: !twoFAEnabled }),
      });
      const data = await res.json();

      if (data.success) {
        useAppStore.setState((state) => ({
          user: state.user
            ? { ...state.user, twoFAEnabled: data.twoFAEnabled }
            : null,
        }));
        setTwoFASuccess(
          data.twoFAEnabled
            ? "✅ 2FA activado correctamente."
            : "✅ 2FA desactivado."
        );
        setTimeout(() => setTwoFASuccess(null), 3000);
      }
    } catch (err: any) {
      setError("Error al cambiar el estado del 2FA.");
    } finally {
      setTogglingTwoFA(false);
    }
  };

  if (!user) return null;

  const lastLogin = localStorage.getItem("cubax_last_login")
    ? new Date(Number(localStorage.getItem("cubax_last_login"))).toLocaleString("es-CU")
    : "—";

  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleString("es-CU")
    : "—";

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

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* Éxito contraseña */}
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

      {/* Éxito 2FA */}
      {twoFASuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{twoFASuccess}</p>
        </div>
      )}

      {/* ═══ DOBLE AUTENTICACIÓN 2FA ═════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Doble autenticación (2FA)
        </h3>
        <Card padding="md">
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
                  ? "Tu cuenta está protegida con doble autenticación."
                  : "Activa 2FA para mayor seguridad en tu cuenta."}
              </p>
            </div>

            {/* Toggle */}
            <button
              onClick={handleToggle2FA}
              disabled={togglingTwoFA}
              className={`relative h-6 w-11 rounded-full transition-colors flex items-center flex-shrink-0 disabled:opacity-50 ${
                twoFAEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-white/20"
              }`}
            >
              {togglingTwoFA ? (
                <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" />
              ) : (
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  twoFAEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              )}
            </button>
          </div>

          {/* Info según estado */}
          <div className={`mt-3 p-2.5 rounded-xl border ${
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
                ? "🔐 Cada vez que inicies sesión recibirás un código de verificación en tus notificaciones."
                : "⚠️ Sin 2FA tu cuenta es más vulnerable. Recomendamos activarlo."}
            </p>
          </div>
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
              label: "Proveedor",
              value: "Correo y contraseña",
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
