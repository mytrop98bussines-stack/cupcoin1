import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Shield,
} from "lucide-react";

import { auth, db } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User as AppUser } from "@/types";

// ─── Errores de Firebase traducidos al español ────────────
const FIREBASE_ERRORS: Record<string, string> = {
  "auth/user-not-found":       "No existe una cuenta con este correo.",
  "auth/wrong-password":       "Contraseña incorrecta. Inténtalo de nuevo.",
  "auth/invalid-credential":   "Credenciales incorrectas. Verifica tu correo y contraseña.",
  "auth/email-already-in-use": "Este correo ya está registrado. Inicia sesión.",
  "auth/weak-password":        "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email":        "El formato del correo no es válido.",
  "auth/too-many-requests":    "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
  "auth/popup-closed-by-user": "Ventana de Google cerrada. Inténtalo de nuevo.",
  "auth/cancelled-popup-request": "Operación cancelada.",
};

const getFirebaseError = (code: string): string =>
  FIREBASE_ERRORS[code] || "Error inesperado. Inténtalo de nuevo.";

export function AuthPage() {
  const { currentView, navigate } = useAppStore();
  const isLogin = currentView === "login";

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [name, setName]             = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [resetSent, setResetSent]   = useState(false);
  const [showReset, setShowReset]   = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ─── Validación ───────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Correo requerido.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Formato de correo inválido.";
    }

    if (!password) {
      newErrors.password = "Contraseña requerida.";
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres.";
    }

    if (!isLogin && !name.trim()) {
      newErrors.name = "Nombre requerido.";
    }

    if (!isLogin && name.trim().length < 2) {
      newErrors.name = "Nombre demasiado corto.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, name, isLogin]);

  // ─── Login / Registro con email ───────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setErrors({});
      setGlobalError(null);

      try {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
          // App.tsx maneja el onAuthStateChanged y navega automáticamente
        } else {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const fUser = userCredential.user;

          await updateProfile(fUser, { displayName: name.trim() });

          const newUser: AppUser = {
            uid:          fUser.uid,
            email:        email.toLowerCase().trim(),
            displayName:  name.trim(),
            photoURL:     null,
            kycStatus:    "unverified",
            createdAt:    Date.now(),
            totalTrades:  0,
            rating:       5.0,
            walletAddress: null,
          };

          await setDoc(doc(db, "users", fUser.uid), newUser);
        }
      } catch (error: any) {
        console.error("Error de autenticación:", error.code, error.message);
        const msg = getFirebaseError(error.code);

        // Errores específicos del campo
        if (
          error.code === "auth/email-already-in-use" ||
          error.code === "auth/invalid-email"
        ) {
          setErrors({ email: msg });
        } else if (
          error.code === "auth/wrong-password" ||
          error.code === "auth/invalid-credential"
        ) {
          setErrors({ password: msg });
        } else {
          setGlobalError(msg);
        }

        setLoading(false);
      }
    },
    [email, password, name, isLogin, validate]
  );

  // ─── Login con Google ─────────────────────────────────────
  const handleGoogleLogin = useCallback(async () => {
    setGoogleLoading(true);
    setErrors({});
    setGlobalError(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result  = await signInWithPopup(auth, provider);
      const fUser   = result.user;
      const userRef = doc(db, "users", fUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const newUser: AppUser = {
          uid:          fUser.uid,
          email:        fUser.email || "",
          displayName:  fUser.displayName || "Usuario CubaX",
          photoURL:     fUser.photoURL || null,
          kycStatus:    "unverified",
          createdAt:    Date.now(),
          totalTrades:  0,
          rating:       5.0,
          walletAddress: null,
        };
        await setDoc(userRef, newUser);
      }
      // App.tsx maneja la navegación via onAuthStateChanged
    } catch (error: any) {
      console.error("Error Google Auth:", error.code);
      setGlobalError(getFirebaseError(error.code));
      setGoogleLoading(false);
    }
  }, []);

  // ─── Reset de contraseña ──────────────────────────────────
  const handlePasswordReset = useCallback(async () => {
    if (!resetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setGlobalError("Ingresa un correo válido para recuperar la contraseña.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (error: any) {
      setGlobalError(getFirebaseError(error.code));
    } finally {
      setResetLoading(false);
    }
  }, [resetEmail]);

  // ─── Limpiar al cambiar de vista ──────────────────────────
  const handleSwitchView = () => {
    setErrors({});
    setGlobalError(null);
    setShowReset(false);
    setResetSent(false);
    navigate(isLogin ? "register" : "login");
  };

  // ─── PANTALLA DE RESET ────────────────────────────────────
  if (showReset) {
    return (
      <div className="min-h-screen bg-white dark:bg-navy-950 flex flex-col">
        <div className="px-4 pt-4">
          <button
            onClick={() => {
              setShowReset(false);
              setResetSent(false);
              setGlobalError(null);
            }}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8">
          <div className="text-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recuperar contraseña
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          {resetSent ? (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  ¡Correo enviado!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Revisa tu bandeja de entrada en{" "}
                  <strong>{resetEmail}</strong> y sigue las instrucciones.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReset(false);
                  setResetSent(false);
                }}
                className="text-sm text-brand-500 font-semibold hover:text-brand-400"
              >
                Volver al inicio de sesión →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {globalError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-400">
                    {globalError}
                  </p>
                </div>
              )}

              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@correo.com"
                icon={<Mail className="h-4 w-4" />}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
              />

              <Button
                size="lg"
                fullWidth
                loading={resetLoading}
                onClick={handlePasswordReset}
              >
                Enviar enlace de recuperación
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RENDER PRINCIPAL ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 flex flex-col">

      {/* Header */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("landing")}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
            <span className="text-white font-black text-xl">CX</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLogin ? "Bienvenido de vuelta" : "Crear cuenta"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLogin
              ? "Inicia sesión para acceder a tu cuenta"
              : "Regístrate gratis y empieza a operar hoy"}
          </p>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">
              {globalError}
            </p>
          </div>
        )}

        {/* Botón Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all disabled:opacity-50 font-semibold text-sm text-gray-700 dark:text-gray-300 mb-4 shadow-sm"
        >
          {googleLoading ? (
            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {googleLoading ? "Conectando..." : "Continuar con Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          <span className="text-xs text-gray-400 font-medium">
            o con correo
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              label="Nombre completo"
              placeholder="Tu nombre completo"
              icon={<User className="h-4 w-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              autoComplete="name"
            />
          )}

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
            }}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: "" }));
            }}
            error={errors.password}
            autoComplete={isLogin ? "current-password" : "new-password"}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />

          {/* Indicador de fuerza de contraseña — Solo en registro */}
          {!isLogin && password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      password.length >= level * 2
                        ? password.length >= 8
                          ? "bg-emerald-500"
                          : password.length >= 6
                          ? "bg-amber-500"
                          : "bg-red-500"
                        : "bg-gray-200 dark:bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-400">
                {password.length < 6
                  ? "Contraseña muy débil"
                  : password.length < 8
                  ? "Contraseña débil"
                  : password.length < 12
                  ? "Contraseña buena"
                  : "Contraseña fuerte ✓"}
              </p>
            </div>
          )}

          {/* Olvidé contraseña */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowReset(true);
                  setGlobalError(null);
                }}
                className="text-xs text-brand-500 hover:text-brand-400 font-semibold transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Términos — Solo en registro */}
          {!isLogin && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
              Al registrarte aceptas nuestros{" "}
              <button
                type="button"
                className="text-brand-500 font-semibold hover:text-brand-400"
              >
                Términos de Uso
              </button>{" "}
              y{" "}
              <button
                type="button"
                className="text-brand-500 font-semibold hover:text-brand-400"
              >
                Política de Privacidad
              </button>
              .
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
            disabled={googleLoading}
            className="shadow-lg shadow-brand-500/20"
          >
            {isLogin ? "Iniciar sesión" : "Crear cuenta gratis"}
          </Button>
        </form>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-5">
          {["Cifrado SSL", "2FA disponible", "Sin comisiones"].map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-1 text-[10px] font-semibold text-gray-400"
            >
              <Shield className="h-3 w-3 text-emerald-500" />
              {badge}
            </div>
          ))}
        </div>

        {/* Switch login/register */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            onClick={handleSwitchView}
            className="text-brand-500 hover:text-brand-400 font-bold transition-colors"
          >
            {isLogin ? "Regístrate gratis" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}