import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import {
  Mail, Lock, User, Eye, EyeOff,
  ArrowLeft, CheckCircle2, AlertTriangle, Shield,
} from "lucide-react";
import type { User as AppUser } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com";

// ─── Logo ─────────────────────────────────────────────────
function CubaXLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 15H42L85 85H58L15 15Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
      <path d="M85 15H58L45.5 35L57.5 45L85 15Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
      <path d="M15 85H42L54.5 65L42.5 55L15 85Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
    </svg>
  );
}

export function AuthPage() {
  const { currentView, navigate, login } = useAppStore();
  const isLogin = currentView === "login";

  // ─── Estados login/registro ───────────────────────────────
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [name, setName]                     = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [errors, setErrors]                 = useState<Record<string, string>>({});
  const [globalError, setGlobalError]       = useState<string | null>(null);
  const [resetSent, setResetSent]           = useState(false);
  const [showReset, setShowReset]           = useState(false);
  const [resetEmail, setResetEmail]         = useState("");
  const [resetLoading, setResetLoading]     = useState(false);
  const [googleLoading, setGoogleLoading]   = useState(false);

  // ─── Estados 2FA ──────────────────────────────────────────
  const [twoFARequired, setTwoFARequired]           = useState(false);
  const [twoFACode, setTwoFACode]                   = useState("");
  const [twoFAChallengeToken, setTwoFAChallengeToken] = useState("");
  const [twoFALoading, setTwoFALoading]             = useState(false);
  const [twoFAError, setTwoFAError]                 = useState<string | null>(null);

  // ─── Helper: completar login ───────────────────────────────
  const finishLogin = useCallback((data: any) => {
    localStorage.setItem("cubax_token",         data.token);
    localStorage.setItem("cubax_refresh_token", data.refreshToken || "");
    localStorage.setItem("cubax_uid",           data.uid);
    localStorage.setItem("cubax_email",         data.email || "");
    localStorage.setItem("cubax_name",          data.displayName || "");
    localStorage.setItem("cubax_last_login",    Date.now().toString());

    const u = data.userData || {};

    const appUser: AppUser = {
      uid:           data.uid,
      email:         data.email,
      displayName:   data.displayName,
      photoURL:      data.photoURL        || null,
      kycStatus:     u.kycStatus          || "unverified",
      createdAt:     u.createdAt          || Date.now(),
      totalTrades:   u.totalTrades        || 0,
      rating:        u.rating             || 5.0,
      walletAddress: u.walletAddress      || null,
      role:          u.role               || "user",
    };

    login(appUser);
    navigate("dashboard");
  }, [login, navigate]);

  // ─── Procesar callback de Google OAuth ────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const error         = params.get("error");
    const requires2FA   = params.get("requires2FA");
    const challengeToken = params.get("challengeToken");
    const token         = params.get("token");
    const refreshToken  = params.get("refreshToken");
    const uid           = params.get("uid");
    const emailParam    = params.get("email");
    const nameParam     = params.get("name");
    const photoParam    = params.get("photo");

    // Limpiar URL
    const clearUrl = () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    if (!error && !requires2FA && !token) return;

    // Error de Google OAuth
    if (error) {
      setGlobalError(decodeURIComponent(error));
      clearUrl();
      setGoogleLoading(false);
      return;
    }

    // Google login requiere 2FA
    if (requires2FA === "1" && challengeToken) {
      setTwoFAChallengeToken(challengeToken);
      setTwoFARequired(true);
      setTwoFACode("");
      setTwoFAError(null);
      setGoogleLoading(false);
      clearUrl();
      return;
    }

    // Google login exitoso sin 2FA
    if (token && uid) {
      clearUrl();
      setGoogleLoading(true);

      fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((me) => {
          if (!me.success) {
            setGlobalError("No se pudo cargar el usuario.");
            return;
          }

          finishLogin({
            token,
            refreshToken: refreshToken || "",
            uid,
            email:       me.user.email,
            displayName: me.user.displayName,
            photoURL:    me.user.photoURL || null,
            userData:    me.user,
          });
        })
        .catch(() => setGlobalError("Error al completar la sesión con Google."))
        .finally(() => setGoogleLoading(false));
    }
  }, [finishLogin]);

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

  // ─── Google Login ─────────────────────────────────────────
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setGlobalError(null);
    // El backend maneja todo el OAuth
    window.location.href = `${BACKEND_URL}/auth/google/start`;
  };

  // ─── Login / Registro ─────────────────────────────────────
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
          if (data.code === "EMAIL_EXISTS" || data.code === "INVALID_EMAIL") {
            setErrors({ email: data.error });
          } else if (
            data.code === "INVALID_PASSWORD" ||
            data.code === "INVALID_LOGIN_CREDENTIALS"
          ) {
            setErrors({ password: data.error });
          } else if (data.code === "ACCOUNT_SUSPENDED") {
            setGlobalError("🚫 " + data.error);
          } else {
            setGlobalError(data.error);
          }
          return;
        }

        // ✅ Requiere 2FA — NO guardar sesión todavía
        if (data.requires2FA) {
          setTwoFAChallengeToken(data.challengeToken);
          setTwoFARequired(true);
          setTwoFACode("");
          setTwoFAError(null);
          return;
        }

        // ✅ Sin 2FA → login directo
        finishLogin(data);

      } catch (err: any) {
        console.error("❌ Error de autenticación:", err.message);
        setGlobalError("Error de conexión. Verifica tu internet.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, name, isLogin, validate, finishLogin]
  );

  // ─── Verificar código 2FA (TOTP) ──────────────────────────
  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) {
      setTwoFAError("Ingresa el código de 6 dígitos.");
      return;
    }

    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/2fa/verify-login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          challengeToken: twoFAChallengeToken,
          code:           twoFACode,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setTwoFAError(data.error || "Código incorrecto.");

        // Si el challenge expiró o es inválido → volver al login
        if (data.error?.includes("expirada") || data.error?.includes("inválida")) {
          setTimeout(() => {
            setTwoFARequired(false);
            setTwoFACode("");
            setTwoFAError(null);
            setTwoFAChallengeToken("");
          }, 2000);
        }
        return;
      }

      // ✅ Código correcto → completar login
      finishLogin(data);

    } catch {
      setTwoFAError("Error de conexión.");
    } finally {
      setTwoFALoading(false);
    }
  };

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

  const handleSwitchView = () => {
    setErrors({});
    setGlobalError(null);
    setShowReset(false);
    setResetSent(false);
    navigate(isLogin ? "register" : "login");
  };

  // ─── PANTALLA 2FA ─────────────────────────────────────────
  if (twoFARequired) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300">
        <div className="px-4 pt-4">
          <button
            onClick={() => {
              setTwoFARequired(false);
              setTwoFACode("");
              setTwoFAError(null);
              setTwoFAChallengeToken("");
            }}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-brand-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verificación 2FA
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Abre tu app de autenticación e ingresa
              el código de 6 dígitos de CubaX.
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {["Google Authenticator", "Aegis", "Microsoft Authenticator"].map((app) => (
                <span
                  key={app}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>

          {/* Error */}
          {twoFAError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400">{twoFAError}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Input código */}
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Código de verificación
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={twoFACode}
                maxLength={6}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setTwoFACode(val);
                  if (twoFAError) setTwoFAError(null);
                }}
                className="w-full px-4 py-4 text-center text-2xl font-black tracking-widest rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                autoFocus
              />
            </div>

            <Button
              size="lg"
              fullWidth
              loading={twoFALoading}
              onClick={handleVerify2FA}
              disabled={twoFACode.length !== 6}
            >
              Verificar código
            </Button>

            {/* Info */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <p className="text-[11px] text-gray-400 text-center">
                🔐 El código cambia cada 30 segundos.
                Si expiró, espera al siguiente y vuelve a intentarlo.
              </p>
            </div>

            {/* Volver */}
            <button
              onClick={() => {
                setTwoFARequired(false);
                setTwoFACode("");
                setTwoFAError(null);
                setTwoFAChallengeToken("");
              }}
              className="w-full text-xs text-gray-400 font-semibold text-center py-1"
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PANTALLA RESET ───────────────────────────────────────
  if (showReset) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300">
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
                  <p className="text-xs text-red-700 dark:text-red-400">{globalError}</p>
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
    <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300">

      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("landing")}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8">

        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-gray-100 dark:border-white/[0.06] mx-auto mb-4 shadow-sm">
            <CubaXLogo size={36} />
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
            <p className="text-xs text-red-700 dark:text-red-400">{globalError}</p>
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

          {/* Fuerza de contraseña */}
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

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            <span className="text-xs text-gray-400 font-medium">o continúa con</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          </div>

           {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="h-5 w-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {googleLoading ? "Conectando..." : "Continuar con Google"}
            </span>
          </button>
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

        {/* Switch login/registro */}
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
