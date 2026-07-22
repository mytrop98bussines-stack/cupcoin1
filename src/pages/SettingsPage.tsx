import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  Shield, Bell, Moon, Sun, Globe, Lock,
  HelpCircle, LogOut, ChevronRight, Star,
  ArrowLeftRight, Wallet, FileText, ExternalLink,
  Wrench, Copy, Check, User, AlertTriangle,
  Smartphone, CheckCircle2, Clock, X, Crown,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function SettingsPage() {
  const { user, theme, toggleTheme, navigate, logout } = useAppStore();

  const [copied, setCopied]                       = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ─── Modo oscuro ──────────────────────────────────────────
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // ─── Polling perfil cada 60 segundos ─────────────────────
  useEffect(() => {
    if (!user?.uid || user.uid === "invitado") return;

    let stopped = false;

    const syncProfile = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/auth/me`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ uid: user.uid }),
        });
        const data = await res.json();
        if (data.success && data.userData && !stopped) {
          useAppStore.setState((state) => ({
            user: state.user
              ? { ...state.user, ...data.userData }
              : null,
          }));
        }
      } catch (err) {
        console.warn("Error sincronizando perfil:", err);
      }
    };

    void syncProfile();
    const intervalId = window.setInterval(syncProfile, 60000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [user?.uid]);

  if (!user) return null;

  // ─── KYC config ───────────────────────────────────────────
  const kycConfig = {
    unverified: {
      label:   "Sin verificar",
      variant: "warning" as const,
      color:   "text-amber-500",
      bg:      "bg-amber-500/10",
    },
    pending_verification: {
      label:   "En revisión",
      variant: "info" as const,
      color:   "text-blue-500",
      bg:      "bg-blue-500/10",
    },
    verified: {
      label:   "Verificado ✓",
      variant: "success" as const,
      color:   "text-emerald-500",
      bg:      "bg-emerald-500/10",
    },
    rejected: {
      label:   "Rechazado",
      variant: "danger" as const,
      color:   "text-red-500",
      bg:      "bg-red-500/10",
    },
  };

  const currentKyc =
    kycConfig[user.kycStatus as keyof typeof kycConfig] ||
    kycConfig.unverified;

  const handleKycAction = () => {
    if (user.kycStatus === "verified") return;
    navigate("kyc");
  };

  const handleCopyUID = () => {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate("landing");
  };

  const kycSubtitle = () => {
    switch (user.kycStatus) {
      case "verified":             return "Identidad verificada ✓";
      case "pending_verification": return "En revisión — esperando aprobación";
      case "rejected":             return "Rechazado — toca para reintentar";
      default:                     return "Verifica tu identidad";
    }
  };

  const membershipSubtitle = () => {
    const m = (user as any).membership;
    if (!m || m.status === "expired") return "Sin membresía activa";
    if (m.status === "free_trial")    return "Prueba gratuita activa";
    if (m.status === "manual")        return "Cortesía del admin";
    const days = Math.ceil((m.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `Activa · ${days} días restantes` : "Vencida";
  };

  const menuSections = [
    {
      title: "Cuenta",
      items: [
        {
          icon:      <User className="h-4 w-4" />,
          label:     "Mi Perfil",
          subtitle:  "Foto, nombre y datos personales",
          iconBg:    "bg-blue-500/10",
          iconColor: "text-blue-500",
          action:    () => navigate("profile"),
        },
        {
          icon:      <Crown className="h-4 w-4" />,
          label:     "Membresía",
          subtitle:  membershipSubtitle(),
          iconBg:    "bg-brand-500/10",
          iconColor: "text-brand-500",
          action:    () => navigate("membership"),
        },
        {
          icon:      <Shield className="h-4 w-4" />,
          label:     "Verificación KYC",
          subtitle:  kycSubtitle(),
          iconBg:    currentKyc.bg,
          iconColor: currentKyc.color,
          action:    user.kycStatus !== "verified" ? handleKycAction : undefined,
          disabled:  user.kycStatus === "verified",
        },
        {
          icon:      <Wallet className="h-4 w-4" />,
          label:     "Mi Wallet",
          subtitle:  "Depósitos, retiros y balance",
          iconBg:    "bg-brand-500/10",
          iconColor: "text-brand-500",
          action:    () => navigate("wallet"),
        },
        {
          icon:      <Bell className="h-4 w-4" />,
          label:     "Notificaciones",
          subtitle:  "Gestionar alertas y preferencias",
          iconBg:    "bg-violet-500/10",
          iconColor: "text-violet-500",
          action:    () => navigate("notification-settings"),
        },
      ],
    },
    {
      title: "Preferencias",
      items: [
        {
          icon:      theme === "dark"
            ? <Moon className="h-4 w-4" />
            : <Sun  className="h-4 w-4" />,
          label:     "Tema",
          subtitle:  theme === "dark" ? "Modo oscuro" : "Modo claro",
          iconBg:    "bg-gray-500/10",
          iconColor: "text-gray-500",
          action:    toggleTheme,
          toggle:    true,
        },
        {
          icon:      <Globe className="h-4 w-4" />,
          label:     "Idioma",
          subtitle:  "Español (Cuba)",
          iconBg:    "bg-emerald-500/10",
          iconColor: "text-emerald-500",
          action:    () => navigate("language"),
        },
        {
          icon:      <Smartphone className="h-4 w-4" />,
          label:     "Notificaciones push",
          subtitle:  "Alertas en tiempo real",
          iconBg:    "bg-amber-500/10",
          iconColor: "text-amber-500",
          action:    () => navigate("notification-settings"),
        },
      ],
    },
    {
      title: "Actividad",
      items: [
        {
          icon:      <ArrowLeftRight className="h-4 w-4" />,
          label:     "Historial de trades",
          subtitle:  `${user.totalTrades || 0} trades completados`,
          iconBg:    "bg-brand-500/10",
          iconColor: "text-brand-500",
          action:    () => navigate("trade-history"),
        },
        {
          icon:      <FileText className="h-4 w-4" />,
          label:     "Mis anuncios P2P",
          subtitle:  "Gestionar órdenes activas",
          iconBg:    "bg-indigo-500/10",
          iconColor: "text-indigo-500",
          action:    () => navigate("my-orders"),
        },
      ],
    },
    {
      title: "Soporte y Legal",
      items: [
        {
          icon:      <HelpCircle className="h-4 w-4" />,
          label:     "Centro de ayuda",
          subtitle:  "FAQ y guías de uso",
          iconBg:    "bg-blue-500/10",
          iconColor: "text-blue-500",
          action:    () => navigate("help"),
        },
        {
          icon:      <Lock className="h-4 w-4" />,
          label:     "Seguridad",
          subtitle:  "Contraseña y autenticación",
          iconBg:    "bg-red-500/10",
          iconColor: "text-red-500",
          action:    () => navigate("security"),
        },
        {
          icon:      <ExternalLink className="h-4 w-4" />,
          label:     "Términos y privacidad",
          subtitle:  "Leer política de uso",
          iconBg:    "bg-gray-500/10",
          iconColor: "text-gray-500",
          action:    () => navigate("terms"),
        },
      ],
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-5 animate-fade-in">

      {/* ═══ PROFILE CARD ════════════════════════════════════ */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={user.displayName} src={user.photoURL} size="lg" />
            {user.kycStatus === "verified" && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate leading-tight">
              {user.displayName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-xs font-bold">
                  {(user as any).rating || "5.0"}
                </span>
              </div>
              <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                {user.totalTrades || 0} trades
              </span>
              <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
              <Badge variant={currentKyc.variant} size="sm">
                {currentKyc.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* UID copiable */}
        <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
          <p className="text-[10px] text-gray-400 flex-1 font-mono truncate">
            ID: {user.uid}
          </p>
          <button
            onClick={handleCopyUID}
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
            }`}
          >
            {copied
              ? <><Check className="h-3 w-3" /> Copiado</>
              : <><Copy className="h-3 w-3" /> Copiar</>
            }
          </button>
        </div>

        {/* Banner KYC dinámico */}
        {user.kycStatus === "unverified" && (
          <button
            onClick={() => navigate("kyc")}
            className="mt-3 w-full flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors text-left"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Completa tu verificación KYC
              </p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                Aumenta tus límites verificando tu identidad.
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          </button>
        )}

        {user.kycStatus === "pending_verification" && (
          <div className="mt-3 w-full flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                Verificación en proceso
              </p>
              <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
                Tu solicitud está siendo revisada. 24-48 horas.
              </p>
            </div>
          </div>
        )}

        {user.kycStatus === "verified" && (
          <div className="mt-3 w-full flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                Identidad verificada
              </p>
              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                Operas sin restricciones en CubaX.
              </p>
            </div>
          </div>
        )}

        {user.kycStatus === "rejected" && (
          <button
            onClick={() => navigate("kyc")}
            className="mt-3 w-full flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors text-left"
          >
            <X className="h-4 w-4 text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-red-700 dark:text-red-400">
                Verificación rechazada
              </p>
              <p className="text-[10px] text-red-600/70 dark:text-red-400/70">
                Toca para volver a intentarlo.
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          </button>
        )}
      </Card>

      {/* ═══ PANEL ADMIN ═════════════════════════════════════ */}
      {user?.role === "admin" && (
        <div className="animate-fade-in">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Wrench className="h-3 w-3" />
            Administración
          </h3>
          <Card padding="none" className="border border-amber-500/20 dark:border-amber-500/10 bg-amber-500/[0.01]">
            <button
              onClick={() => navigate("admin-kyc")}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-500/5 transition-colors rounded-2xl"
            >
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white">Panel Admin</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  KYC · Disputas · Membresías
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-500/60 flex-shrink-0" />
            </button>
          </Card>
        </div>
      )}
      
      {user?.role === "admin" && (
  <button
    onClick={() => navigate("admin-users")}
    className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20"
  >
    <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
      <Users className="h-5 w-5 text-red-500" />
    </div>
    <div className="flex-1 text-left">
      <p className="text-sm font-bold">Gestión de Usuarios</p>
      <p className="text-[11px] text-gray-400">Suspender, reactivar y ver stats</p>
    </div>
  </button>
)}

      {/* ═══ SECCIONES DEL MENÚ ══════════════════════════════ */}
      {menuSections.map((section) => {
        if (section.title === "Actividad" && user.uid === "invitado") return null;
        return (
          <div key={section.title}>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.06] overflow-hidden">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={"disabled" in item && item.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl text-left ${
                    "disabled" in item && item.disabled
                      ? "opacity-60 cursor-default"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg ${item.iconBg} flex items-center justify-center ${item.iconColor} flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  {"toggle" in item && item.toggle ? (
                    <div className={`relative h-6 w-11 rounded-full transition-colors flex items-center flex-shrink-0 ${
                      theme === "dark" ? "bg-brand-500" : "bg-gray-300"
                    }`}>
                      <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        theme === "dark" ? "translate-x-[22px]" : "translate-x-0.5"
                      }`} />
                    </div>
                  ) : "disabled" in item && item.disabled ? (
                    <Badge variant="success" size="sm">Verificado ✓</Badge>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </Card>
          </div>
        );
      })}

      {/* ═══ CERRAR SESIÓN ═══════════════════════════════════ */}
      {!showLogoutConfirm ? (
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all text-sm font-bold"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      ) : (
        <Card padding="md" className="border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1 text-center">
            ¿Cerrar sesión?
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
            Tendrás que volver a iniciar sesión para acceder a tu cuenta.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sí, salir
            </button>
          </div>
        </Card>
      )}

      {/* ═══ VERSIÓN ═════════════════════════════════════════ */}
      <div className="text-center space-y-1 pb-2">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          CubaX v1.0.0 • Build 2026.06
        </p>
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          Hecho con ❤️ para Cuba
        </p>
      </div>
    </div>
  );
}
