import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeftRight,
  Shield,
  TrendingUp,
  Bell,
  ShoppingBag,
  CheckCheck,
} from "lucide-react";
import { useEffect } from "react";

export function NotificationsPage() {
  const { user, notifications, markNotificationRead, navigate, subscribeToNotifications } = useAppStore();

  // 🔥 ENLACE REACTIVO: Mantiene la pantalla de notificaciones sincronizada en vivo
  useEffect(() => {
    if (user?.uid && user.uid !== "invitado" && typeof subscribeToNotifications === "function") {
      console.log(`[Firebase] Escuchando notificaciones en vivo desde la página principal.`);
      const unsubscribe = subscribeToNotifications(user.uid);
      
      return () => {
        console.log("[Firebase] Desconectando listener de la página de notificaciones.");
        unsubscribe();
      };
    }
  }, [user?.uid, subscribeToNotifications]);

  const sortedNotifications = [...notifications].sort((a, b) => b.createdAt - a.createdAt);

  const getIcon = (type: string) => {
    switch (type) {
      case "trade":
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      case "kyc":
        return <Shield className="h-4 w-4 text-amber-500" />;
      case "product":
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-brand-500" />;
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Notificaciones
        </h1>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={() => notifications.forEach((n) => !n.read && markNotificationRead(n.id))}
            className="text-xs text-brand-500 font-medium flex items-center gap-1 active:opacity-70"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {sortedNotifications.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No tienes notificaciones.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedNotifications.map((notif) => (
            <Card
              key={notif.id}
              hover
              padding="md"
              className={notif.read ? "opacity-60" : "border-l-2 border-l-brand-500"}
              onClick={() => {
                if (!notif.read) {
                  markNotificationRead(notif.id);
                }
                if (notif.link) {
                  // 🛠️ TIPADO FLEXIBLE: Permite navegar a cualquier vista válida de tu AppView
                  navigate(notif.link as any);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {getTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0 mt-2 animate-pulse" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
