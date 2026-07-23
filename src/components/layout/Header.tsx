import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/Avatar";
import { Logo }   from "@/components/Logo";
import {
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/utils/cn";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title, showBack = false }: HeaderProps) {
  const {
    theme,
    toggleTheme,
    user,
    notifications,
    navigate,
    goBack,
    mobileMenuOpen,
    setMobileMenuOpen,
    currentView,
  } = useAppStore();

  const [realtimeCount, setRealtimeCount] = useState(0);
  const [hasNewNotif, setHasNewNotif]     = useState(false);
  const previousCountRef                   = useRef(0);
  const audioRef                           = useRef<HTMLAudioElement | null>(null);

  // ─── Fetch contador cada 15 segundos ─────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const loadCount = async () => {
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(
          `${BACKEND_URL}/notifications/${user.uid}/unread-count`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        if (data.success) {
          const newCount = data.count || 0;

          // Si aumentó el número, activar animación y sonido
          if (newCount > previousCountRef.current && previousCountRef.current > 0) {
            setHasNewNotif(true);

            // Vibración en móvil
            if ("vibrate" in navigator) {
              navigator.vibrate([100, 50, 100]);
            }

            // Sonido opcional
            try {
              if (audioRef.current) {
                audioRef.current.play().catch(() => {});
              }
            } catch {}

            // Quitar animación después de 3s
            setTimeout(() => setHasNewNotif(false), 3000);
          }

          previousCountRef.current = newCount;
          setRealtimeCount(newCount);
        }
      } catch (err) {
        console.warn("⚠️ Error contador notificaciones:", err);
      }
    };

    void loadCount();
    const interval = window.setInterval(loadCount, 15000);

    return () => window.clearInterval(interval);
  }, [user?.uid]);

  // Fallback: contar del store local si el backend no responde
  const localUnread   = notifications.filter((n) => !n.read).length;
  const unreadCount   = realtimeCount > 0 ? realtimeCount : localUnread;

  const showLogo = !showBack && ["dashboard", "p2p", "marketplace"].includes(currentView);

  return (
    <header className="sticky top-0 z-50 glass bg-white/80 dark:bg-navy-950/80 border-b border-gray-100 dark:border-white/[0.06]">

      {/* Audio invisible para sonido */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRhwMAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfgLAAA="
      />

      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={goBack}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          )}

          {showLogo && !showBack && (
            <div className="flex items-center">
              <Logo size={26} className="text-black dark:text-white" />
            </div>
          )}

          {title && (
            <h1 className="font-semibold text-gray-900 dark:text-white text-base truncate">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-gray-500" />
            )}
          </button>

          {/* Botón de notificaciones con badge mejorado */}
          <button
            onClick={() => {
              navigate("notifications");
              setHasNewNotif(false);
            }}
            className={cn(
              "relative p-2 rounded-lg transition-all",
              hasNewNotif
                ? "bg-red-500/10 animate-pulse"
                : "hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            <Bell
              className={cn(
                "h-4.5 w-4.5 transition-colors",
                hasNewNotif
                  ? "text-red-500"
                  : unreadCount > 0
                  ? "text-brand-500"
                  : "text-gray-500 dark:text-gray-400"
              )}
            />

            {unreadCount > 0 && (
              <>
                {/* Punto de pulso animado */}
                {hasNewNotif && (
                  <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-red-500 animate-ping" />
                )}

                {/* Badge con número */}
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm",
                  hasNewNotif && "ring-2 ring-red-300 dark:ring-red-500/50"
                )}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </>
            )}
          </button>

          {user && (
            <button
              onClick={() => navigate("settings")}
              className="ml-1"
            >
              <Avatar name={user.displayName} src={user.photoURL} size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile slide menu */}
      <div
        className={cn(
          "absolute top-14 left-0 right-0 bg-white dark:bg-navy-950 border-b border-gray-100 dark:border-white/[0.06] transition-all duration-300 overflow-hidden lg:hidden",
          mobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="p-4 space-y-1">
          {[
            { view: "dashboard"   as const, label: "Dashboard" },
            { view: "p2p"         as const, label: "Mercado P2P" },
            { view: "marketplace" as const, label: "Marketplace" },
            { view: "wallet"      as const, label: "Wallet" },
            { view: "kyc"         as const, label: "Verificación KYC" },
            { view: "settings"    as const, label: "Configuración" },
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => {
                navigate(item.view);
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                currentView === item.view
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
        }
