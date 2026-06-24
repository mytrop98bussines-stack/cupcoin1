import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeftRight,
  Shield,
  TrendingUp,
  Bell,
  ShoppingBag,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";

export function NotificationsPage() {
  const {
    user,
    notifications,
    markNotificationRead,
    navigate,
    subscribeToNotifications,
  } = useAppStore();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  // ─── Listener en tiempo real ──────────────────────────────
  useEffect(() => {
    if (
      user?.uid &&
      user.uid !== "invitado" &&
      typeof subscribeToNotifications === "function"
    ) {
      const unsubscribe = subscribeToNotifications(user.uid);
      return () => unsubscribe();
    }
  }, [user?.uid, subscribeToNotifications]);

  // ─── Ordenar y filtrar ────────────────────────────────────
  const sortedNotifications = [...notifications]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((n) => filter === "all" || !n.read);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Marcar todas como leídas ────────────────────────────
  const handleMarkAllRead = () => {
    notifications
      .filter((n) => !n.read)
      .forEach((n) => markNotificationRead(n.id));
  };

  // ─── Icono por tipo ───────────────────────────────────────
  const getIcon = (type: string) => {
    const base = "h-4 w-4";
    switch (type) {
      case "trade":
        return (
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <ArrowLeftRight className={`${base} text-blue-500`} />
          </div>
        );
      case "kyc":
        return (
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className={`${base} text-amber-500`} />
          </div>
        );
      case "product":
        return (
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className={`${base} text-emerald-500`} />
          </div>
        );
      case "alert":
        return (
          <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className={`${base} text-red-500`} />
          </div>
        );
      case "order":
        return (
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <Package className={`${base} text-violet-500`} />
          </div>
        );
      case "info":
        return (
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Info className={`${base} text-brand-500`} />
          </div>
        );
      default:
        return (
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className={`${base} text-brand-500`} />
          </div>
        );
    }
  };

  // ─── Tiempo relativo ──────────────────────────────────────
  const getTimeAgo = (timestamp: number) => {
    const diff    = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours   = Math.floor(diff / 3600000);
    const days    = Math.floor(diff / 86400000);

    if (minutes < 1)  return "Ahora";
    if (minutes < 60) return `${minutes}m`;
    if (hours   < 24) return `${hours}h`;
    if (days    < 7)  return `${days}d`;
    return new Date(timestamp).toLocaleDateString("es-CU", {
      day:   "numeric",
      month: "short",
    });
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-brand-500 text-white text-[10px] font-black flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-brand-500 hover:text-brand-400 font-semibold flex items-center gap-1 transition-colors active:opacity-70"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      {/* ═══ FILTROS ═════════════════════════════════════════ */}
      {notifications.length > 0 && (
        <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {f === "all" ? (
                `Todas (${notifications.length})`
              ) : (
                <span className="flex items-center justify-center gap-1">
                  Sin leer
                  {unreadCount > 0 && (
                    <span className="h-4 w-4 rounded-full bg-brand-500 text-white text-[9px] font-black flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ═══ LISTA DE NOTIFICACIONES ═════════════════════════ */}
      {sortedNotifications.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Bell className="h-6 w-6 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {filter === "unread"
              ? "No tienes notificaciones sin leer"
              : "No tienes notificaciones"}
          </p>
          <p className="text-xs text-gray-400">
            {filter === "unread"
              ? "¡Estás al día con todo!"
              : "Aquí aparecerán tus alertas de trades, KYC y más."}
          </p>
          {filter === "unread" && (
            <button
              onClick={() => setFilter("all")}
              className="text-xs text-brand-500 font-semibold mt-3 hover:text-brand-400"
            >
              Ver todas las notificaciones →
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) markNotificationRead(notif.id);
                if (notif.link) navigate(notif.link as any);
              }}
              className={`relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
                notif.read
                  ? "bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.05] opacity-70"
                  : "bg-brand-500/[0.02] dark:bg-brand-500/[0.05] border-brand-500/20 hover:border-brand-500/40"
              }`}
            >
              {/* Línea izquierda si no leída */}
              {!notif.read && (
                <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-brand-500 rounded-full" />
              )}

              {/* Icono */}
              {getIcon(notif.type)}

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p
                    className={`text-sm leading-tight truncate ${
                      notif.read
                        ? "font-medium text-gray-700 dark:text-gray-300"
                        : "font-bold text-gray-900 dark:text-white"
                    }`}
                  >
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                    {getTimeAgo(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>

                {/* Link si tiene */}
                {notif.link && (
                  <p className="text-[10px] text-brand-500 font-semibold mt-1.5">
                    Ver detalles →
                  </p>
                )}
              </div>

              {/* Punto de no leída */}
              {!notif.read && (
                <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ FOOTER INFO ═════════════════════════════════════ */}
      {sortedNotifications.length > 0 && (
        <p className="text-center text-[10px] text-gray-400 pb-2">
          Mostrando {sortedNotifications.length} de {notifications.length} notificaciones
        </p>
      )}
    </div>
  );
}