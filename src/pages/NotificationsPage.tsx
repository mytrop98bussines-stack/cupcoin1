import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeftRight, Shield, TrendingUp, Bell,
  ShoppingBag, CheckCheck, AlertTriangle,
  Info, Package, Crown, ChevronRight, DollarSign,
  MessageCircle, Gift, Trash2, ArrowUp,
} from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function NotificationsPage() {
  const {
    user,
    notifications,
    markNotificationRead,
    navigate,
    subscribeToNotifications,
    setActiveTrade,
    setSelectedTradeId,
    setSelectedProductId,
  } = useAppStore();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // ─── Scroll para mostrar botón "ir arriba" ────────────────
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Navegación inteligente ───────────────────────────────
  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) markNotificationRead(notif.id);

    const data = notif.data || {};

    switch (notif.type) {

      // 💰 Trades P2P
      case "trade":
      case "new_trade":
      case "payment_sent":
      case "trade_completed": {
        if (data.tradeId || data.id) {
          setSelectedTradeId(data.tradeId || data.id);
          navigate("trade");
        } else {
          navigate("trade-history");
        }
        break;
      }

      // 💵 Pagos
      case "payment": {
        navigate("wallet");
        break;
      }

      // 💬 Mensajes de chat
      case "message": {
        if (data.tradeId) {
          setSelectedTradeId(data.tradeId);
          navigate("trade");
        } else if (data.productId) {
          setSelectedProductId(data.productId);
          if (data.chatRoomId) {
            sessionStorage.setItem("openChatRoomId", data.chatRoomId);
            sessionStorage.setItem("openChat", "true");
          }
          navigate("product-detail");
        }
        break;
      }

      // ✅ KYC
      case "kyc": {
        navigate("kyc");
        break;
      }

      // 🛍️ Productos / Marketplace
      case "product":
      case "marketplace":
      case "marketplace_order": {
        if (data.productId || data.id) {
          setSelectedProductId(data.productId || data.id);
          if (data.chatRoomId) {
            sessionStorage.setItem("openChatRoomId", data.chatRoomId);
            sessionStorage.setItem("openChat", "true");
          }
          navigate("product-detail");
        } else {
          navigate("marketplace");
        }
        break;
      }

      // 🔐 Seguridad
      case "security": {
        navigate("security");
        break;
      }

      // 🎁 Promociones
      case "promo": {
        navigate("wallet");
        break;
      }

      // 💳 Membresía
      case "membership": {
        navigate("membership");
        break;
      }

      // 🔔 Sistema y por defecto
      case "system":
      default: {
        if (data.tradeId) {
          setSelectedTradeId(data.tradeId);
          navigate("trade");
        } else if (data.productId) {
          setSelectedProductId(data.productId);
          navigate("product-detail");
        } else if (notif.link) {
          navigate(notif.link as any);
        }
        break;
      }
    }
  };

  // ─── Label del destino ────────────────────────────────────
  const getDestinationLabel = (notif: any): string | null => {
    const data = notif.data || {};
    switch (notif.type) {
      case "trade":
      case "new_trade":
      case "payment_sent":
      case "trade_completed":
        return data.tradeId || data.id ? "Ir al trade" : "Ver historial";
      case "payment":
        return "Ver wallet";
      case "message":
        return "Abrir chat";
      case "kyc":
        return "Ver verificación";
      case "product":
      case "marketplace":
      case "marketplace_order":
        return data.chatRoomId ? "Ir al chat" : "Ver producto";
      case "security":
        return "Ver seguridad";
      case "promo":
        return "Ver detalles";
      case "membership":
        return "Ver membresía";
      default:
        return data.tradeId || data.productId || notif.link ? "Ver detalles" : null;
    }
  };

  // ─── Icono por tipo (actualizado con todos los tipos) ─────
  const getIcon = (type: string) => {
    const base = "h-4 w-4";
    switch (type) {
      // Trades
      case "trade":
      case "new_trade":
      case "payment_sent":
      case "trade_completed":
        return (
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <ArrowLeftRight className={`${base} text-amber-500`} />
          </div>
        );

      // Pagos
      case "payment":
        return (
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className={`${base} text-emerald-500`} />
          </div>
        );

      // Mensajes
      case "message":
        return (
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className={`${base} text-violet-500`} />
          </div>
        );

      // KYC
      case "kyc":
        return (
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className={`${base} text-blue-500`} />
          </div>
        );

      // Marketplace
      case "product":
      case "marketplace":
      case "marketplace_order":
        return (
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className={`${base} text-pink-500`} />
          </div>
        );

      // Seguridad
      case "security":
        return (
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className={`${base} text-red-500`} />
          </div>
        );

      // Promociones
      case "promo":
        return (
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <Gift className={`${base} text-orange-500`} />
          </div>
        );

      // Membresía
      case "membership":
        return (
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Crown className={`${base} text-brand-500`} />
          </div>
        );

      // Alertas
      case "alert":
        return (
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className={`${base} text-red-500`} />
          </div>
        );

      // Órdenes
      case "order":
        return (
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <Package className={`${base} text-violet-500`} />
          </div>
        );

      // Sistema
      case "system":
        return (
          <div className="h-10 w-10 rounded-xl bg-gray-500/10 flex items-center justify-center flex-shrink-0">
            <Info className={`${base} text-gray-500`} />
          </div>
        );

      default:
        return (
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Bell className={`${base} text-brand-500`} />
          </div>
        );
    }
  };

  // ─── Badge de prioridad ───────────────────────────────────
  const getPriorityBadge = (notif: any) => {
    if (notif.priority === "high") {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
          Urgente
        </span>
      );
    }
    return null;
  };

  // ─── Tiempo relativo mejorado ─────────────────────────────
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
      day: "numeric", month: "short",
    });
  };

  // ─── Agrupar por fecha ────────────────────────────────────
  const groupedNotifications = useMemo(() => {
    const filtered = notifications.filter(
      (n) => filter === "all" || !n.read
    );

    const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    const groups: {
      today: any[];
      yesterday: any[];
      thisWeek: any[];
      older: any[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    sorted.forEach((notif) => {
      if (notif.createdAt >= today) {
        groups.today.push(notif);
      } else if (notif.createdAt >= yesterday) {
        groups.yesterday.push(notif);
      } else if (notif.createdAt >= weekAgo) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    return groups;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalCount = notifications.length;

  const handleMarkAllRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
  };

  // ─── Eliminar notificación ────────────────────────────────
  const handleDelete = async (notif: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("¿Eliminar esta notificación?")) return;

    setDeletingId(notif.id);

    try {
      const token = localStorage.getItem("cubax_token");

      await fetch(`${BACKEND_URL}/notifications/${notif.id}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // El store se actualizará automáticamente si tienes suscripción
      // Si no, remuévelo manualmente
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
    // ═══════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in" ref={scrollRef}>

      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              Notificaciones
              {unreadCount > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-gray-400">
              {totalCount > 0
                ? `${totalCount} notificación${totalCount !== 1 ? "es" : ""}`
                : "Sin notificaciones"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 text-xs font-bold transition-all"
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
                <span className="flex items-center justify-center gap-1.5">
                  Todas
                  <span className="text-[10px] opacity-60">({notifications.length})</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
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

      {/* ═══ EMPTY STATES ════════════════════════════════════ */}
      {notifications.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            No tienes notificaciones
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Aquí aparecerán tus alertas de trades, pagos y más.
          </p>
          <button
            onClick={() => navigate("notification-settings")}
            className="text-xs text-brand-500 font-bold hover:text-brand-400"
          >
            Configurar notificaciones →
          </button>
        </Card>
      ) : filter === "unread" && unreadCount === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            ¡Estás al día! 🎉
          </p>
          <p className="text-xs text-gray-400 mb-4">
            No tienes notificaciones sin leer.
          </p>
          <button
            onClick={() => setFilter("all")}
            className="text-xs text-brand-500 font-bold hover:text-brand-400"
          >
            Ver todas →
          </button>
        </Card>
      ) : (
        <>
          {/* ═══ GRUPO: HOY ═══════════════════════════════════ */}
          {groupedNotifications.today.length > 0 && (
            <NotificationGroup
              title="Hoy"
              notifications={groupedNotifications.today}
              onClick={handleNotificationClick}
              onDelete={handleDelete}
              getIcon={getIcon}
              getDestinationLabel={getDestinationLabel}
              getPriorityBadge={getPriorityBadge}
              getTimeAgo={getTimeAgo}
              deletingId={deletingId}
            />
          )}

          {/* ═══ GRUPO: AYER ══════════════════════════════════ */}
          {groupedNotifications.yesterday.length > 0 && (
            <NotificationGroup
              title="Ayer"
              notifications={groupedNotifications.yesterday}
              onClick={handleNotificationClick}
              onDelete={handleDelete}
              getIcon={getIcon}
              getDestinationLabel={getDestinationLabel}
              getPriorityBadge={getPriorityBadge}
              getTimeAgo={getTimeAgo}
              deletingId={deletingId}
            />
          )}

          {/* ═══ GRUPO: ESTA SEMANA ═══════════════════════════ */}
          {groupedNotifications.thisWeek.length > 0 && (
            <NotificationGroup
              title="Esta semana"
              notifications={groupedNotifications.thisWeek}
              onClick={handleNotificationClick}
              onDelete={handleDelete}
              getIcon={getIcon}
              getDestinationLabel={getDestinationLabel}
              getPriorityBadge={getPriorityBadge}
              getTimeAgo={getTimeAgo}
              deletingId={deletingId}
            />
          )}

          {/* ═══ GRUPO: ANTERIOR ══════════════════════════════ */}
          {groupedNotifications.older.length > 0 && (
            <NotificationGroup
              title="Anteriores"
              notifications={groupedNotifications.older}
              onClick={handleNotificationClick}
              onDelete={handleDelete}
              getIcon={getIcon}
              getDestinationLabel={getDestinationLabel}
              getPriorityBadge={getPriorityBadge}
              getTimeAgo={getTimeAgo}
              deletingId={deletingId}
            />
          )}

          {/* ═══ FOOTER INFO ══════════════════════════════════ */}
          <div className="text-center pt-4 space-y-2">
            <p className="text-[11px] text-gray-400">
              {filter === "all"
                ? `Mostrando ${totalCount} notificacion${totalCount !== 1 ? "es" : ""}`
                : `Mostrando ${unreadCount} sin leer`}
            </p>
            <button
              onClick={() => navigate("notification-settings")}
              className="text-xs text-brand-500 font-semibold hover:text-brand-400 inline-flex items-center gap-1"
            >
              ⚙️ Configurar preferencias
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </>
      )}

      {/* ═══ BOTÓN SCROLL TO TOP ═════════════════════════════ */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 h-11 w-11 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/25 flex items-center justify-center z-30 transition-all active:scale-95 animate-fade-in"
          title="Ir arriba"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎨 COMPONENTE AUXILIAR: GRUPO DE NOTIFICACIONES
// ═══════════════════════════════════════════════════════════

interface NotificationGroupProps {
  title:               string;
  notifications:       any[];
  onClick:             (notif: any) => void;
  onDelete:            (notif: any, e: React.MouseEvent) => void;
  getIcon:             (type: string) => JSX.Element;
  getDestinationLabel: (notif: any) => string | null;
  getPriorityBadge:    (notif: any) => JSX.Element | null;
  getTimeAgo:          (timestamp: number) => string;
  deletingId:          string | null;
}

function NotificationGroup({
  title,
  notifications,
  onClick,
  onDelete,
  getIcon,
  getDestinationLabel,
  getPriorityBadge,
  getTimeAgo,
  deletingId,
}: NotificationGroupProps) {
  return (
    <div>
      <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
        <span>{title}</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
        <span className="text-gray-400 font-bold">{notifications.length}</span>
      </h3>
      <div className="space-y-2">
        {notifications.map((notif) => (
          <NotificationCard
            key={notif.id}
            notif={notif}
            onClick={() => onClick(notif)}
            onDelete={(e) => onDelete(notif, e)}
            getIcon={getIcon}
            getDestinationLabel={getDestinationLabel}
            getPriorityBadge={getPriorityBadge}
            getTimeAgo={getTimeAgo}
            isDeleting={deletingId === notif.id}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎨 COMPONENTE AUXILIAR: CARD INDIVIDUAL
// ═══════════════════════════════════════════════════════════

interface NotificationCardProps {
  notif:               any;
  onClick:             () => void;
  onDelete:            (e: React.MouseEvent) => void;
  getIcon:             (type: string) => JSX.Element;
  getDestinationLabel: (notif: any) => string | null;
  getPriorityBadge:    (notif: any) => JSX.Element | null;
  getTimeAgo:          (timestamp: number) => string;
  isDeleting:          boolean;
}

function NotificationCard({
  notif,
  onClick,
  onDelete,
  getIcon,
  getDestinationLabel,
  getPriorityBadge,
  getTimeAgo,
  isDeleting,
}: NotificationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const destinationLabel = getDestinationLabel(notif);
  const isClickable = !!destinationLabel;
  const priorityBadge = getPriorityBadge(notif);

  return (
    <div
      className={`relative overflow-hidden transition-all ${
        isDeleting ? "opacity-0 scale-95" : "opacity-100"
      }`}
    >
      <div
        onClick={onClick}
        onTouchStart={() => setShowActions(true)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all active:scale-[0.98] ${
          isClickable ? "cursor-pointer" : "cursor-default"
        } ${
          notif.read
            ? "bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.05]"
            : "bg-brand-500/[0.03] dark:bg-brand-500/[0.05] border-brand-500/20 hover:border-brand-500/40 shadow-sm shadow-brand-500/5"
        }`}
      >
        {/* Barra lateral (no leído) */}
        {!notif.read && (
          <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-500 rounded-full" />
        )}

        {/* Icono */}
        {getIcon(notif.type)}

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p
                  className={`text-sm leading-tight ${
                    notif.read
                      ? "font-semibold text-gray-700 dark:text-gray-300"
                      : "font-bold text-gray-900 dark:text-white"
                  }`}
                >
                  {notif.title}
                </p>
                {priorityBadge}
              </div>
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5 font-medium">
              {getTimeAgo(notif.createdAt)}
            </span>
          </div>

          {/* Body */}
          <p className={`text-xs leading-relaxed line-clamp-2 ${
            notif.read
              ? "text-gray-500 dark:text-gray-400"
              : "text-gray-600 dark:text-gray-300"
          }`}>
            {notif.body}
          </p>

          {/* Imagen opcional */}
          {notif.image && (
            <img
              src={notif.image}
              alt=""
              className="mt-2 rounded-lg max-h-32 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}

          {/* Botón de acción */}
          {destinationLabel && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
              <p className="text-[11px] text-brand-500 font-bold flex items-center gap-0.5">
                {destinationLabel}
                <ChevronRight className="h-3 w-3" />
              </p>

              {/* Botón eliminar */}
              <button
                onClick={onDelete}
                className="p-1 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Indicador no leído */}
        {!notif.read && (
          <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}
