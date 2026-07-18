import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import {
  requestNotificationPermission,
  onForegroundMessage,
} from "@/lib/firebase/messaging";
import {
  Bell, BellOff, ArrowLeftRight, ShoppingBag,
  Shield, TrendingUp, CheckCircle2, AlertTriangle,
  Loader2, X,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface NotifPrefs {
  trades:      boolean;
  marketplace: boolean;
  kyc:         boolean;
  precios:     boolean;
  sistema:     boolean;
}

export function NotificationSettingsPage() {
  const { user, setUser } = useAppStore();

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabling, setEnabling]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);

  const [prefs, setPrefs] = useState<NotifPrefs>({
    trades:      (user as any)?.notifPrefs?.trades      ?? true,
    marketplace: (user as any)?.notifPrefs?.marketplace ?? true,
    kyc:         (user as any)?.notifPrefs?.kyc         ?? true,
    precios:     (user as any)?.notifPrefs?.precios     ?? false,
    sistema:     (user as any)?.notifPrefs?.sistema     ?? true,
  });

  // ─── Estado actual del permiso ────────────────────────────
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // ─── Mensajes en primer plano ─────────────────────────────
  useEffect(() => {
    if (permission !== "granted") return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log("📬 Mensaje en primer plano:", payload);
    });

    return () => unsubscribe?.();
  }, [permission]);

  // ─── Activar notificaciones ───────────────────────────────
  const handleEnable = async () => {
    if (!user?.uid) return;

    setEnabling(true);
    setError(null);

    try {
      const token = await requestNotificationPermission(user.uid);

      if (token) {
        setPermission("granted");
        setSuccess("✅ Notificaciones activadas correctamente.");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setPermission(Notification.permission);
        if (Notification.permission === "denied") {
          setError(
            "Notificaciones bloqueadas. Toca el candado 🔒 al lado de la URL, luego Notificaciones y elige Permitir."
          );
        }
      }
    } catch (err: any) {
      setError("Error al activar notificaciones: " + err.message);
    } finally {
      setEnabling(false);
    }
  };

  // ─── Guardar preferencias via backend ────────────────────
  const handleTogglePref = async (key: keyof NotifPrefs) => {
    if (!user?.uid) return;

    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);

    try {
      const token = localStorage.getItem("cubax_token");

      const res  = await fetch(`${BACKEND_URL}/profile/update`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ notifPrefs: newPrefs }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setUser({ ...user, notifPrefs: newPrefs } as any);
    } catch (err: any) {
      setPrefs(prefs);
      setError("Error al guardar preferencias.");
    }
  };

  if (!user) return null;

  const notifTypes = [
    {
      key:   "trades" as keyof NotifPrefs,
      icon:  <ArrowLeftRight className="h-4 w-4 text-brand-500"   />,
      bg:    "bg-brand-500/10",
      label: "Trades P2P",
      desc:  "Alertas de nuevos trades, pagos y liberaciones",
    },
    {
      key:   "marketplace" as keyof NotifPrefs,
      icon:  <ShoppingBag   className="h-4 w-4 text-violet-500"   />,
      bg:    "bg-violet-500/10",
      label: "Marketplace",
      desc:  "Nuevos productos y compras completadas",
    },
    {
      key:   "kyc" as keyof NotifPrefs,
      icon:  <Shield        className="h-4 w-4 text-amber-500"    />,
      bg:    "bg-amber-500/10",
      label: "Verificación KYC",
      desc:  "Estado de tu verificación de identidad",
    },
    {
      key:   "precios" as keyof NotifPrefs,
      icon:  <TrendingUp    className="h-4 w-4 text-emerald-500"  />,
      bg:    "bg-emerald-500/10",
      label: "Alertas de precios",
      desc:  "Cambios importantes en el precio de tus criptos",
    },
    {
      key:   "sistema" as keyof NotifPrefs,
      icon:  <Bell          className="h-4 w-4 text-blue-500"     />,
      bg:    "bg-blue-500/10",
      label: "Sistema",
      desc:  "Actualizaciones y mantenimiento de CubaX",
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Bell className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Notificaciones
          </h1>
          <p className="text-xs text-gray-400">
            Gestiona tus alertas y preferencias
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* Éxito */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* Estado del permiso */}
      <Card
        padding="md"
        className={`${
          permission === "granted"
            ? "border-emerald-500/20 bg-emerald-500/5"
            : permission === "denied"
            ? "border-red-500/20 bg-red-500/5"
            : "border-amber-500/20 bg-amber-500/5"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            permission === "granted" ? "bg-emerald-500/10" :
            permission === "denied"  ? "bg-red-500/10"    : "bg-amber-500/10"
          }`}>
            {permission === "granted"
              ? <Bell    className="h-5 w-5 text-emerald-500" />
              : <BellOff className="h-5 w-5 text-amber-500"   />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {permission === "granted"
                ? "Notificaciones activas"
                : permission === "denied"
                ? "Notificaciones bloqueadas"
                : "Notificaciones desactivadas"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {permission === "granted"
                ? "Recibirás alertas en tiempo real"
                : permission === "denied"
                ? "Actívalas desde el candado 🔒 de la URL"
                : "Activa las notificaciones para no perderte nada"}
            </p>
          </div>

          {/* Botón Activar (solo si nunca decidió) */}
          {permission === "default" && (
            <button
              onClick={handleEnable}
              disabled={enabling}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {enabling
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Bell    className="h-3.5 w-3.5"               />
              }
              {enabling ? "Activando..." : "Activar"}
            </button>
          )}

          {/* Botón Ayuda (si está bloqueado) */}
          {permission === "denied" && (
            <button
              onClick={() => {
                alert(
                  "Para activar las notificaciones:\n\n" +
                  "1. Toca el candado 🔒 al lado de la URL\n" +
                  "2. Permisos → Notificaciones → Permitir\n" +
                  "3. Recarga la página"
                );
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex-shrink-0"
            >
              <BellOff className="h-3.5 w-3.5" />
              Cómo desbloquear
            </button>
          )}
        </div>
      </Card>

      {/* Preferencias por tipo */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Tipos de notificación
        </h3>
        <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {notifTypes.map((type) => (
            <div key={type.key} className="flex items-center gap-3 px-4 py-3.5">
              <div className={`h-9 w-9 rounded-xl ${type.bg} flex items-center justify-center flex-shrink-0`}>
                {type.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {type.label}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{type.desc}</p>
              </div>
              <button
                onClick={() => handleTogglePref(type.key)}
                disabled={permission !== "granted"}
                className={`relative h-6 w-11 rounded-full transition-colors flex items-center flex-shrink-0 disabled:opacity-40 ${
                  prefs[type.key] ? "bg-brand-500" : "bg-gray-300 dark:bg-white/20"
                }`}
              >
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs[type.key] ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          ))}
        </Card>
      </div>

      {/* Info */}
      <Card padding="sm">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          💡 Las notificaciones de trades son importantes para no perder
          operaciones activas. Recomendamos mantenerlas siempre activas.
        </p>
      </Card>
    </div>
  );
          }
