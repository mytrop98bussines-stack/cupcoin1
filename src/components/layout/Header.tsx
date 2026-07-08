import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/Avatar";
import {
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/utils/cn";

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const showLogo = !showBack && ["dashboard", "p2p", "marketplace"].includes(currentView);

  return (
    <header className="sticky top-0 z-50 glass bg-white/80 dark:bg-navy-950/80 border-b border-gray-100 dark:border-white/[0.06]">
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
            <div className="flex items-center gap-1.5">
              <img 
                src="/favicon.svg" 
                alt="CubaX Logo" 
                className="h-7 w-7 rounded-lg"
              />
              <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                Cuba<span className="text-brand-500">X</span>
              </span>
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

          <button
            onClick={() => navigate("notifications")}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <Bell className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
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
            { view: "dashboard" as const, label: "Dashboard" },
            { view: "p2p" as const, label: "Mercado P2P" },
            { view: "marketplace" as const, label: "Marketplace" },
            { view: "wallet" as const, label: "Wallet" },
            { view: "kyc" as const, label: "Verificación KYC" },
            { view: "settings" as const, label: "Configuración" },
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
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
