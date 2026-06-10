import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Shield,
  Bell,
  Moon,
  Sun,
  Globe,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  ArrowLeftRight,
  Wallet,
  FileText,
  ExternalLink,
  Wrench, // Icono para el panel de administración
} from "lucide-react";

export function SettingsPage() {
  const { user, setUser, theme, toggleTheme, navigate, logout } = useAppStore();

  // ==========================================
  // SOLUCIÓN EN CALIENTE PARA EL MODO OSCURO
  // ==========================================
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // ==========================================
  // ESCUCHADOR EN TIEMPO REAL DEL PERFIL (FIRESTORE)
  // ==========================================
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUser({ ...user, ...docSnap.data() });
      }
    }, (error) => {
      console.error("Error sincronizando perfil con Firestore:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, setUser]);

  if (!user) return null;

  const kycStatus = {
    unverified: { label: "Sin verificar", variant: "warning" as const },
    pending_verification: { label: "En revisión", variant: "info" as const },
    verified: { label: "Verificado", variant: "success" as const },
    rejected: { label: "Rechazado", variant: "danger" as const },
  };

  const currentKyc = kycStatus[user.kycStatus as keyof typeof kycStatus] || kycStatus.unverified;

  const menuSections = [
    {
      title: "Cuenta",
      items: [
        {
          icon: <Shield className="h-4 w-4" />,
          label: "Verificación KYC",
          subtitle: currentKyc.label,
          badge: currentKyc.variant,
          action: () => navigate("kyc"),
        },
        {
          icon: <Wallet className="h-4 w-4" />,
          label: "Mi Wallet",
          subtitle: "Gestionar conexión Web3",
          action: () => navigate("wallet"),
        },
        {
          icon: <Bell className="h-4 w-4" />,
          label: "Notificaciones",
          subtitle: "Gestionar alertas",
          action: () => navigate("notifications"),
        },
      ],
    },
    {
      title: "Preferencias",
      items: [
        {
          icon: theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />,
          label: "Tema",
          subtitle: theme === "dark" ? "Modo oscuro" : "Modo claro",
          action: toggleTheme,
          toggle: true,
        },
        {
          icon: <Globe className="h-4 w-4" />,
          label: "Idioma",
          subtitle: "Español (Cuba)",
          action: () => {},
        },
      ],
    },
    {
      title: "Actividad",
      items: [
        {
          icon: <ArrowLeftRight className="h-4 w-4" />,
          label: "Historial de trades",
          subtitle: `${user.totalTrades || 0} trades completados`,
          action: () => navigate("p2p"),
        },
        {
          icon: <FileText className="h-4 w-4" />,
          label: "Mis anuncios",
          subtitle: "Gestionar ofertas P2P",
          action: () => navigate("p2p"),
        },
      ],
    },
    {
      title: "Soporte",
      items: [
        {
          icon: <HelpCircle className="h-4 w-4" />,
          label: "Centro de ayuda",
          subtitle: "FAQ y guías",
          action: () => {},
        },
        {
          icon: <Lock className="h-4 w-4" />,
          label: "Seguridad",
          subtitle: "Contraseña y 2FA",
          action: () => {},
        },
        {
          icon: <ExternalLink className="h-4 w-4" />,
          label: "Términos y condiciones",
          subtitle: "Política de privacidad",
          action: () => {},
        },
      ],
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-5 animate-fade-in">
      {/* Profile Card */}
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <Avatar name={user.displayName} src={user.photoURL} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate">
              {user.displayName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-xs font-semibold">{user.rating || "5.0"}</span>
              </div>
              <span className="text-[10px] text-gray-400">•</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {user.totalTrades || 0} trades
              </span>
              <Badge variant={currentKyc.variant} size="sm">
                {currentKyc.label}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================
          BLOQUE EXCLUSIVO DE ADMIN: SOLO APRECE SI TU ROL ES 'admin'
         ======================================================== */}
      {user?.role === "admin" && (
        <div className="animate-fade-in">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-2 px-1 flex items-center gap-1.5">
            <Wrench className="h-3 w-3" /> Configuración Interna
          </h3>
          <Card padding="none" className="border border-amber-500/20 dark:border-amber-500/10 bg-amber-500/[0.01]">
            <button
              onClick={() => navigate("admin-kyc")}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-500/[0.04] transition-colors rounded-2xl"
            >
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white">
                  Panel de Control KYC
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate">
                  Revisar y aprobar solicitudes de usuarios pendientes
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-500/60 flex-shrink-0" />
            </button>
          </Card>
        </div>
      )}

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {section.title
              ? section.title === "Actividad" && user.uid === "invitado"
                ? "" 
                : section.title
              : ""}
          </h3>
          <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {item.subtitle}
                  </p>
                </div>
                {"toggle" in item && item.toggle ? (
                  <div
                    className={`relative h-6 w-11 rounded-full transition-colors flex items-center ${
                      theme === "dark" ? "bg-brand-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        theme === "dark" ? "translate-x-5.5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </Card>
        </div>
      ))}

      {/* Logout */}
      <Button
        variant="ghost"
        size="lg"
        fullWidth
        onClick={logout}
        icon={<LogOut className="h-4 w-4" />}
        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 hover:text-red-600"
      >
        Cerrar sesión
      </Button>

      {/* Version */}
      <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
        CubaX v1.0.0 • Build 2026.06
      </p>
    </div>
  );
    }
      
                  
