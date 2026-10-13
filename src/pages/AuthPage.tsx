import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import { Logo }   from "@/components/Logo";
import { useTranslation } from "@/lib/useTranslation";
import {
  Mail, Lock, User, Eye, EyeOff, Phone,
  ArrowLeft, CheckCircle2, AlertTriangle, Shield,
} from "lucide-react";
import type { User as AppUser } from "@/types";
import { isBiometricSupported }     from "@/lib/biometric";
import { BiometricActivationModal } from "@/components/BiometricActivationModal";
import { BiometricLoginButton }     from "@/components/BiometricLoginButton";

const BACKEND_URL = "https://cubax-backend.onrender.com";

export function AuthPage() {
  const { currentView, navigate, login } = useAppStore();
  const { t } = useTranslation();
  const isLogin = currentView === "login";

  // ─── Estados login/registro ───────────────────────────────
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [name, setName]                   = useState("");
  const [countryCode, setCountryCode]     = useState<"+53" | "+1">("+53");
  const [phoneNumber, setPhoneNumber]     = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [globalError, setGlobalError]     = useState<string | null>(null);
  const [resetSent, setResetSent]         = useState(false);
  const [showReset, setShowReset]         = useState(false);
  const [resetEmail, setResetEmail]       = useState("");
  const [resetLoading, setResetLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ─── Estados 2FA ──────────────────────────────────────────
  const [twoFARequired, setTwoFARequired]             = useState(false);
  const [twoFACode, setTwoFACode]                     = useState("");
  const [twoFAChallengeToken, setTwoFAChallengeToken] = useState("");
  const [twoFALoading, setTwoFALoading]               = useState(false);
  const [twoFAError, setTwoFAError]                   = useState<string | null>(null);

  // ─── Estados Biometría ────────────────────────────────────
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingUserData, setPendingUserData]       = useState<any>(null);

  // =========================================================
  // HELPER: Completar login
  // =========================================================
  const finishLogin = useCallback(async (data: any) => {
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
      photoURL:      data.photoURL   || null,
      kycStatus:     u.kycStatus     || "unverified",
      createdAt:     u.createdAt     || Date.now(),
      totalTrades:   u.totalTrades   || 0,
      rating:        u.rating        || 5.0,
      custodialAddress: u.custodialAddress || u.depositAddresses?.USDT || null,
      role:          u.role          || "user",
      emailVerified: u.emailVerified || false,
    } as any;

    const promptedBefore = localStorage.getItem(`biometric_prompted_${data.uid}`);
    const alreadyEnabled = localStorage.getItem("biometric_enabled");

    if (isBiometricSupported() && !promptedBefore && !alreadyEnabled) {
      setPendingUserData({ appUser, data });
      setShowBiometricModal(true);
    } else {
      login(appUser);
      navigate("dashboard");
    }
  }, [login, navigate]);

  // =========================================================
  // HANDLERS: Biometría
  // =========================================================
  const handleBiometricActivated = () => {
    localStorage.setItem("biometric_enabled", "1");
    if (pendingUserData) {
      localStorage.setItem(`biometric_prompted_${pendingUserData.data.uid}`, "1");
      login(pendingUserData.appUser);
      navigate("dashboard");
      setPendingUserData(null);
    }
    setShowBiometricModal(false);
  };

  const handleBiometricSkip = () => {
    if (pendingUserData) {
      localStorage.setItem(`biometric_prompted_${pendingUserData.data.uid}`, "1");
      login(pendingUserData.appUser);
      navigate("dashboard");
      setPendingUserData(null);
    }
    setShowBiometricModal(false);
  };

  // =========================================================
  // VALIDACIÓN
  // =========================================================
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Correo electrónico inválido";
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida";
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }

    if (!isLogin) {
      if (!name.trim()) {
        newErrors.name = "El nombre es obligatorio";
      } else if (name.trim().length < 2) {
        newErrors.name = "Nombre muy corto";
      }

      // Validación estricta de teléfono para Cuba y USA
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      if (!cleanPhone) {
        newErrors.phone = "El teléfono es obligatorio";
      } else if (countryCode === "+53") {
        if (!/^[56]\d{7}$/.test(cleanPhone)) {
          newErrors.phone = "Debe tener 8 dígitos e iniciar con 5 o 6";
        }
      } else if (countryCode === "+1") {
        if (!/^\d{10}$/.test(cleanPhone)) {
          newErrors.phone = "Debe tener 10 dígitos (Código de área + Número)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, name, isLogin, countryCode, phoneNumber]);

  // =========================================================
  // SUBMIT
  // =========================================================
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

        const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

        const body = isLogin
          ? { email: email.trim(), password }
          : { 
              email: email.trim(), 
              password, 
              displayName: name.trim(),
              phone: fullPhone 
            };

        const res  = await fetch(endpoint, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });

        const data = await res.json();

        if (!data.success) {
          if (data.code === "PHONE_EXISTS" || data.code === "INVALID_PHONE") {
            setErrors({ phone: data.error });
          } else if (data.code === "EMAIL_EXISTS" || data.code === "INVALID_EMAIL") {
            setErrors({ email: data.error });
          } else if (data.code === "INVALID_PASSWORD" || data.code === "INVALID_LOGIN_CREDENTIALS") {
            setErrors({ password: data.error });
          } else {
            setGlobalError(data.error || "Error al procesar la solicitud");
          }
          return;
        }

        if (data.requires2FA) {
          setTwoFAChallengeToken(data.challengeToken);
          setTwoFARequired(true);
          setTwoFACode("");
          setTwoFAError(null);
          return;
        }

        await finishLogin(data);

      } catch (err: any) {
        console.error("❌ Error de autenticación:", err.message);
        setGlobalError("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    },
    [email, password, name, countryCode, phoneNumber, isLogin, validate, finishLogin]
  );

  // =========================================================
  // HANDLERS: 2FA & Reset
  // =========================================================
  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) {
      setTwoFAError("Ingresa el código de 6 dígitos");
      return;
    }

    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/2fa/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: twoFAChallengeToken,
          code: twoFACode,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setTwoFAError(data.error || "Código incorrecto");
        return;
      }

      await finishLogin(data);
    } catch {
      setTwoFAError("Error de conexión");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handlePasswordReset = useCallback(async () => {
    if (!resetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setGlobalError("Correo electrónico inválido");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setResetSent(true);
      } else {
        setGlobalError(data.error);
      }
    } catch {
      setGlobalError("Error de conexión");
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

  // =========================================================
  // RENDER: Pantalla 2FA
  // =========================================================
  if (twoFARequired) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Autenticación 2FA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ingresa el código de tu aplicación de autenticación</p>
        </div>

        {twoFAError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">{twoFAError}</p>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="000000"
            value={twoFACode}
            maxLength={6}
            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full px-4 py-4 text-center text-2xl font-black tracking-widest rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-emerald-500 outline-none"
            autoFocus
          />
          <Button size="lg" fullWidth loading={twoFALoading} onClick={handleVerify2FA} disabled={twoFACode.length !== 6} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            Verificar Código
          </Button>
          <button onClick={() => setTwoFARequired(false)} className="w-full text-xs text-gray-400 font-semibold text-center">Volver al inicio de sesión</button>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER: Pantalla Reset Password
  // =========================================================
  if (showReset) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recuperar Contraseña</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Te enviaremos un enlace de recuperación</p>
        </div>

        {resetSent ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">Correo enviado a {resetEmail}</p>
            <button onClick={() => { setShowReset(false); setResetSent(false); }} className="text-sm text-emerald-500 font-semibold hover:underline">
              Volver al Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {globalError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{globalError}</div>}
            <Input label="Correo electrónico" type="email" placeholder="tu@email.com" icon={<Mail className="h-4 w-4" />} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            <Button size="lg" fullWidth loading={resetLoading} onClick={handlePasswordReset} className="bg-emerald-500 hover:bg-emerald-600 text-white">Enviar enlace</Button>
            <button onClick={() => setShowReset(false)} className="w-full text-xs text-gray-400 font-semibold text-center">Cancelar</button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // RENDER: Formulario Principal
  // =========================================================
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300">
        <div className="px-4 pt-4">
          <button onClick={() => navigate("landing")} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-gray-100 dark:border-white/[0.06] mx-auto mb-4 shadow-sm">
              <Logo size={36} className="text-black dark:text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? "Bienvenido de nuevo" : "Crear Cuenta"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isLogin ? "Ingresa tus credenciales para acceder" : "Regístrate para operar con USDT seguro"}
            </p>
          </div>

          {globalError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{globalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin && <BiometricLoginButton onSuccess={(data) => finishLogin(data)} />}

            {/* Nombre (Solo en Registro) */}
            {!isLogin && (
              <Input
                label="Nombre completo"
                placeholder="Ej. Juan Pérez"
                icon={<User className="h-4 w-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
            )}

            {/* Teléfono Obligatorio (Solo en Registro) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Número de Teléfono <span className="text-emerald-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value as "+53" | "+1");
                      setPhoneNumber("");
                      setErrors((p) => ({ ...p, phone: "" }));
                    }}
                    className="h-12 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="+53">🇨🇺 +53 (Cuba)</option>
                    <option value="+1">🇺🇸 +1 (USA)</option>
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder={countryCode === "+53" ? "5XXXXXXX" : "305XXXXXXX"}
                      maxLength={countryCode === "+53" ? 8 : 10}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/\D/g, ""));
                        if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                      }}
                      className={`w-full h-12 pl-10 pr-4 text-xs font-medium rounded-xl border ${
                        errors.phone 
                          ? "border-red-500 bg-red-50/20" 
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
                      } text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500`}
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {errors.phone && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.phone}</p>}
                <p className="text-[10px] text-gray-400 mt-1">
                  {countryCode === "+53" ? "Ingresa los 8 dígitos de tu móvil cubano" : "Ingresa los 10 dígitos (código de área + número)"}
                </p>
              </div>
            )}

                        {/* Email */}
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
              }}
              error={errors.email}
              autoComplete="email"
            />
            {/* Contraseña */}
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
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => { setResetEmail(email); setShowReset(true); }} className="text-xs text-emerald-500 font-semibold hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button type="submit" size="lg" fullWidth loading={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button onClick={handleSwitchView} className="text-emerald-500 font-bold hover:underline">
              {isLogin ? "Regístrate gratis" : "Inicia Sesión"}
            </button>
          </p>
        </div>
      </div>

      {showBiometricModal && (
        <BiometricActivationModal onClose={handleBiometricSkip} onActivated={handleBiometricActivated} />
      )}
    </>
  );
}