import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { auth } from "@/lib/firebase/config";
import { signInWithCustomToken } from "firebase/auth";
import {
  Mail, Lock, User, Eye, EyeOff,
  ArrowLeft, CheckCircle2, AlertTriangle, Shield,
} from "lucide-react";
import type { User as AppUser } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com";

export function AuthPage() {
  const { currentView, navigate, login } = useAppStore();
  const isLogin = currentView === "login";

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [name, setName]                 = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [globalError, setGlobalError]   = useState<string | null>(null);
  const [resetSent, setResetSent]       = useState(false);
  const [showReset, setShowReset]       = useState(false);
  const [resetEmail, setResetEmail]     = useState("");
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

  // ─── Autenticar SDK del cliente con custom token ──────────
  // Esto permite que las reglas de Firestore funcionen
  const authenticateFirebaseSDK = async (uid: string) => {
    try {
      const ctRes  = await fetch(`${BACKEND_URL}/api/auth/custom-token`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid }),
      });
      const ctData = await ctRes.json();

      if (ctData.success && ctData.customToken) {
        await signInWithCustomToken(auth, ctData.customToken);
        console.log("✅ SDK Firestore autenticado correctamente");
      }
    } catch (err) {
      // No es crítico — la app funciona igual
      // El backend usa Admin SDK que bypasea las reglas
      console.warn("⚠️ Auth SDK opcional falló:", err);
    }
  };

  // ─── Login / Registro via backend ─────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setErrors({});
      setGlobalError(null);

      try {
        const endpoint = isLogin
          ? `${BACKEND_URL}/api/auth/login`
          : `${BACKEND_URL}/api/auth/register`;

        const body = isLogin
          ? { email: email.trim(), password }
          : { email: email.trim(), password, displayName: name.trim() };

        const res  = await fetch(endpoint, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });

        const data = await res.json();

        if (!data.success) {
          if (
            data.code === "EMAIL_EXISTS" ||
            data.code === "INVALID_EMAIL"
          ) {
            setErrors({ email: data.error });
          } else if (
            data.code === "INVALID_PASSWORD" ||
            data.code === "INVALID_LOGIN_CREDENTIALS"
          ) {
            setErrors({ password: data.error });
          } else {
            setGlobalError(data.error);
          }
          setLoading(false);
          return;
        }

        // ✅ Guardar en localStorage
        localStorage.setItem("cubax_token",        data.token);
        localStorage.setItem("cubax_refresh_token", data.refreshToken);
        localStorage.setItem("cubax_uid",           data.uid);
        localStorage.setItem("cubax_email",         data.email);
        localStorage.setItem("cubax_name",          data.displayName);

        // ✅ Autenticar SDK del cliente para que las reglas
        // de Firestore funcionen correctamente
        await authenticateFirebaseSDK(data.uid);

        // ✅ Construir objeto de usuario
        const userData = data.userData || {};
        const appUser: AppUser = {
          uid:           data.uid,
          email:         data.email,
          displayName:   data.displayName,
          photoURL:      data.photoURL    || null,
          kycStatus:     userData.kycStatus     || "unverified",
          createdAt:     userData.createdAt     || Date.now(),
          totalTrades:   userData.totalTrades   || 0,
          rating:        userData.rating        || 5.0,
          walletAddress: userData.walletAddress || null,
          role:          userData.role          || "user",
        };

        login(appUser);
        navigate("dashboard");

      } catch (err: any) {
        console.error("Error de autenticación:", err.message);
        setGlobalError("Error de conexión. Verifica tu internet.");
        setLoading(false);
      }
    },
    [email, password, name, isLogin, validate, login, navigate]
  );

  // ─── Reset de contraseña ──────────────────────────────────
  const handlePasswordReset = useCallback(async () => {
    if (
      !resetEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)
    ) {
      setGlobalError("Ingresa un correo válido.");
      return;
    }

    setResetLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setResetSent(true);
      } else {
        setGlobalError(data.error);
      }
    } catch {
      setGlobalError("Error de conexión.");
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
                  <strong>{resetEmail}</strong>.
                </p>
              </div>
              <button
                onClick={() => { setShowReset(false); setResetSent(false); }}
                className="text-sm text-brand-500 font-semibold"
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

      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("landing")}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8">

        {/* Logo */}
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
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />
                }
              </button>
            }
          />

          {/* Indicador contraseña */}
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
                className="text-xs text-brand-500 hover:text-brand-400 font-semibold"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Términos */}
          {!isLogin && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
              Al registrarte aceptas nuestros{" "}
              <button
                type="button"
                onClick={() => navigate("terms")}
                className="text-brand-500 font-semibold"
              >
                Términos de Uso
              </button>{" "}
              y{" "}
              <button
                type="button"
                onClick={() => navigate("terms")}
                className="text-brand-500 font-semibold"
              >
                Política de Privacidad
              </button>.
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
            className="shadow-lg shadow-brand-500/20"
          >
            {isLogin ? "Iniciar sesión" : "Crear cuenta gratis"}
          </Button>
        </form>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-5">
          {["Sin VPN", "Cifrado SSL", "Sin comisiones"].map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-1 text-[10px] font-semibold text-gray-400"
            >
              <Shield className="h-3 w-3 text-emerald-500" />
              {badge}
            </div>
          ))}
        </div>

        {/* Switch */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            onClick={handleSwitchView}
            className="text-brand-500 hover:text-brand-400 font-bold"
          >
            {isLogin ? "Regístrate gratis" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
          }
