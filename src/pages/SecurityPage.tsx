import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { auth } from "@/lib/firebase/config";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Loader2,
  LogOut,
} from "lucide-react";

export function SecurityPage() {
  const { user } = useAppStore();

  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [success, setSuccess]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  // ─── Errores de Firebase traducidos ──────────────────────
  const FIREBASE_ERRORS: Record<string, string> = {
    "auth/wrong-password":        "Contraseña actual incorrecta.",
    "auth/weak-password":         "La nueva contraseña es muy débil. Mínimo 6 caracteres.",
    "auth/requires-recent-login": "Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña.",
    "auth/too-many-requests":     "Demasiados intentos. Espera unos minutos.",
  };

  const getError = (code: string) =>
    FIREBASE_ERRORS[code] || "Error inesperado. Inténtalo de nuevo.";

  // ─── Indicador de fuerza ──────────────────────────────────
  const passwordStrength = (() => {
    if (!newPassword) return { level: 0, label: "", color: "" };
    if (newPassword.length < 6)  return { level: 1, label: "Muy débil",  color: "bg-red-500"    };
    if (newPassword.length < 8)  return { level: 2, label: "Débil",      color: "bg-orange-500" };
    if (newPassword.length < 12) return { level: 3, label: "Buena",      color: "bg-amber-500"  };
    return                               { level: 4, label: "Fuerte ✓",  color: "bg-emerald-500" };
  })();

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
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error("No hay sesión activa.");
      }

      // ✅ Reautenticar antes de cambiar contraseña
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // ✅ Cambiar contraseña
      await updatePassword(firebaseUser, newPassword);

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err: any) {
      setError(getError(err.code));
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  if (!user) return null;

  // ─── Info de sesión ───────────────────────────────────────
  const lastLogin = auth.currentUser?.metadata.lastSignInTime
    ? new Date(auth.currentUser.metadata.lastSignInTime).toLocaleString("es-CU")
    : "—";

  const createdAt = auth.currentUser?.metadata.creationTime
    ? new Date(auth.currentUser.metadata.creationTime).toLocaleString("es-CU")
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
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">
            {error}
          </p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* Éxito */}
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

      {/* ═══ CAMBIAR CONTRASEÑA ══════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Cambiar contraseña
        </h3>
        <Card padding="md" className="space-y-4">

          {/* Contraseña actual */}
          <div className="relative">
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
                  {showCurrent
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />}
                </button>
              }
            />
          </div>

          {/* Nueva contraseña */}
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
                  {showNew
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />}
                </button>
              }
            />

            {/* Indicador de fuerza */}
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
                <p className="text-[10px] text-gray-400">
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
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
                {showConfirm
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />}
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
              icon:  <Clock className="h-4 w-4 text-blue-500" />,
              label: "Último acceso",
              value: lastLogin,
            },
            {
              icon:  <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
              label: "Cuenta creada",
              value: createdAt,
            },
            {
              icon:  <Shield className="h-4 w-4 text-brand-500" />,
              label: "Proveedor",
              value: auth.currentUser?.providerData?.[0]?.providerId === "google.com"
                ? "Google"
                : "Correo y contraseña",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-4 py-3.5"
            >
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
            {
              icon:  "🔐",
              title: "Usa una contraseña fuerte",
              desc:  "Mínimo 12 caracteres con letras, números y símbolos.",
            },
            {
              icon:  "🚫",
              title: "No compartas tu contraseña",
              desc:  "CubaX nunca te pedirá tu contraseña por chat o correo.",
            },
            {
              icon:  "📱",
              title: "Protege tu dispositivo",
              desc:  "Activa el bloqueo de pantalla en tu teléfono.",
            },
            {
              icon:  "⚠️",
              title: "Cuidado con el phishing",
              desc:  "Verifica siempre que estés en la app oficial de CubaX.",
            },
          ].map((tip) => (
            <div key={tip.title} className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{tip.icon}</span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {tip.title}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}