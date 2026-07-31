import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import {
  requestNotificationPermission,
  onForegroundMessage,
  sendTestNotification,
  getStoredPreferences,
  saveNotificationPreferences,
  isNotificationEnabled,
  type NotificationPreferences,
} from "@/lib/firebase/messaging";
import {
  Bell, BellOff, ArrowLeftRight, ShoppingBag,
  Shield, TrendingUp, CheckCircle2, AlertTriangle,
  Loader2, X, Volume2, VolumeX, Vibrate, Moon,
  DollarSign, MessageCircle, Gift, Info,
  Smartphone, Monitor, Trash2, Zap, TestTube,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface FCMDevice {
  token:      string;
  platform:   "web" | "android" | "ios";
  deviceInfo?: {
    browser?:  string;
    os?:       string;
    isMobile?: boolean;
    isPWA?:    boolean;
  };
  createdAt:  number;
  lastActive: number;
}

export function NotificationSettingsPage() {
  const { user, setUser } = useAppStore();

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabling, setEnabling]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);
  const [devices, setDevices]       = useState<FCMDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Preferencias (sincronizadas con backend)
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    return getStoredPreferences();
  });

  // ─── Estado actual del permiso ────────────────────────────
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // ─── Cargar preferencias del backend ─────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const userPrefs = (user as any).notificationPreferences;
    if (userPrefs) {
      setPrefs({
        trade:       userPrefs.trade       ?? true,
        payment:     userPrefs.payment     ?? true,
        kyc:         userPrefs.kyc         ?? true,
        message:     userPrefs.message     ?? true,
        marketplace: userPrefs.marketplace ?? true,
        security:    true, // Siempre activo
        promo:       userPrefs.promo       ?? false,
        system:      userPrefs.system      ?? true,
        sound:       userPrefs.sound       ?? true,
        vibration:   userPrefs.vibration   ?? true,
        quietHours: {
          enabled: userPrefs.quietHours?.enabled ?? false,
          from:    userPrefs.quietHours?.from    ?? "22:00",
          to:      userPrefs.quietHours?.to      ?? "08:00",
        },
      });
    }
  }, [user]);

  // ─── Cargar dispositivos conectados ──────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    loadDevices();
  }, [user?.uid]);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const userData = user as any;
      const tokens = userData.fcmTokens || [];
      setDevices(Array.isArray(tokens) ? tokens : []);
    } catch (err) {
      console.warn("Error cargando dispositivos:", err);
    } finally {
      setLoadingDevices(false);
    }
  };

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
        setSuccess("✅ Notificaciones activadas correctamente");
        setTimeout(() => setSuccess(null), 3000);
        loadDevices();
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
  const savePreferences = useCallback(
    async (newPrefs: NotificationPreferences) => {
      if (!user?.uid) return;

      setSaving(true);
      setError(null);

      try {
        const token = localStorage.getItem("cubax_token");

        const res = await fetch(`${BACKEND_URL}/notifications/preferences`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ preferences: newPrefs }),
        });

        const data = await res.json();

        if (!data.success) throw new Error(data.error);

        // Guardar en localStorage también
        saveNotificationPreferences(newPrefs);

        setUser({ ...user, notificationPreferences: newPrefs } as any);

        setSuccess("✅ Preferencias guardadas");
        setTimeout(() => setSuccess(null), 2000);
      } catch (err: any) {
        console.error("Error guardando preferencias:", err);
        setError("Error al guardar preferencias");
      } finally {
        setSaving(false);
      }
    },
    [user, setUser]
  );

  // ─── Toggle categoría de notificación ────────────────────
  const handleToggleType = (
    key: keyof Omit<NotificationPreferences, "quietHours">
  ) => {
    if (key === "security") return; // No se puede desactivar

    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
  };

  // ─── Toggle quiet hours ──────────────────────────────────
  const handleToggleQuietHours = () => {
    const newPrefs = {
      ...prefs,
      quietHours: {
        ...prefs.quietHours,
        enabled: !prefs.quietHours.enabled,
      },
    };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
  };

  // ─── Cambiar hora de quiet hours ─────────────────────────
  const handleQuietHoursChange = (field: "from" | "to", value: string) => {
    const newPrefs = {
      ...prefs,
      quietHours: {
        ...prefs.quietHours,
        [field]: value,
      },
    };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
  };

  // ─── Test notification ───────────────────────────────────
const handleTestNotification = async () => {
  if (permission !== "granted") {
    setError("Primero activa las notificaciones");
    return;
  }

  try {
    await sendTestNotification();
    setSuccess("🧪 Notificación de prueba enviada");
    setTimeout(() => setSuccess(null), 3000);
  } catch (err: any) {
    setError("Error al enviar test: " + err.message);
  }
};

  // ─── Eliminar dispositivo ────────────────────────────────
  const handleRemoveDevice = async (token: string) => {
    if (!confirm("¿Quitar este dispositivo? Ya no recibirá notificaciones.")) return;

    try {
      const authToken = localStorage.getItem("cubax_token");

      await fetch(`${BACKEND_URL}/notifications/fcm-token/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fcmToken: token }),
      });

      setDevices(devices.filter((d) => d.token !== token));
      setSuccess("✅ Dispositivo eliminado");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError("Error eliminando dispositivo");
    }
  };

  if (!user) return null;

  // ─── Configuración de tipos de notificaciones ────────────
  const notifTypes = [
    {
      key:   "trade" as const,
      icon:  <ArrowLeftRight className="h-4 w-4" />,
      color: "text-amber-500",
      bg:    "bg-amber-500/10",
      label: "Trades P2P",
      desc:  "Trades iniciados, pagos, disputas",
      critical: true,
    },
    {
      key:   "payment" as const,
      icon:  <DollarSign className="h-4 w-4" />,
      color: "text-emerald-500",
      bg:    "bg-emerald-500/10",
      label: "Pagos",
      desc:  "Pagos recibidos, retiros completados",
      critical: true,
    },
    {
      key:   "kyc" as const,
      icon:  <Shield className="h-4 w-4" />,
      color: "text-blue-500",
      bg:    "bg-blue-500/10",
      label: "Verificación KYC",
      desc:  "Estado de tu verificación de identidad",
      critical: false,
    },
    {
      key:   "message" as const,
      icon:  <MessageCircle className="h-4 w-4" />,
      color: "text-violet-500",
      bg:    "bg-violet-500/10",
      label: "Mensajes",
      desc:  "Mensajes de chats P2P y marketplace",
      critical: false,
    },
    {
      key:   "marketplace" as const,
      icon:  <ShoppingBag className="h-4 w-4" />,
      color: "text-pink-500",
      bg:    "bg-pink-500/10",
      label: "Marketplace",
      desc:  "Ventas de productos, nuevas órdenes",
      critical: false,
    },
    {
      key:   "security" as const,
      icon:  <Shield className="h-4 w-4" />,
      color: "text-red-500",
      bg:    "bg-red-500/10",
      label: "Seguridad",
      desc:  "Logins nuevos, cambios sensibles (siempre activo)",
      critical: true,
      locked: true,
    },
    {
      key:   "promo" as const,
      icon:  <Gift className="h-4 w-4" />,
      color: "text-amber-500",
      bg:    "bg-amber-500/10",
      label: "Promociones",
      desc:  "Ofertas, recompensas, nuevos productos",
      critical: false,
    },
    {
      key:   "system" as const,
      icon:  <Info className="h-4 w-4" />,
      color: "text-gray-500",
      bg:    "bg-gray-500/10",
      label: "Sistema",
      desc:  "Actualizaciones y anuncios de CupCoin",
      critical: false,
    },
  ];

  // ═══════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Bell className="h-5 w-5 text-violet-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Notificaciones
          </h1>
          <p className="text-xs text-gray-400">
            Configura tus alertas y preferencias
          </p>
        </div>
        {saving && (
          <Loader2 className="h-4 w-4 text-brand-500 animate-spin" />
        )}
      </div>

      {/* ═══ ERROR ═══════════════════════════════════════════ */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 animate-slide-up">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* ═══ ÉXITO ═══════════════════════════════════════════ */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 animate-slide-up">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* ═══ ESTADO DEL PERMISO ══════════════════════════════ */}
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
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              permission === "granted"
                ? "bg-emerald-500/10"
                : permission === "denied"
                ? "bg-red-500/10"
                : "bg-amber-500/10"
            }`}
          >
            {permission === "granted" ? (
              <Bell className="h-5 w-5 text-emerald-500" />
            ) : (
              <BellOff className="h-5 w-5 text-amber-500" />
            )}
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
              {enabling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
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

          {/* Botón Test (si está activo) */}
          {permission === "granted" && (
            <button
              onClick={handleTestNotification}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all flex-shrink-0"
            >
              <TestTube className="h-3.5 w-3.5" />
              Test
            </button>
          )}
        </div>
      </Card>

      {/* ═══ TIPOS DE NOTIFICACIÓN ═══════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" />
          Tipos de notificación
        </h3>
        <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05] overflow-hidden">
          {notifTypes.map((type) => {
            const isEnabled = prefs[type.key];
            const isLocked = (type as any).locked;

            return (
              <div
                key={type.key}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  isLocked ? "bg-gray-50 dark:bg-white/[0.02]" : ""
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl ${type.bg} ${type.color} flex items-center justify-center flex-shrink-0`}
                >
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {type.label}
                    </p>
                    {type.critical && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
                        Importante
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        🔒 Fijo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">
                    {type.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleType(type.key)}
                  disabled={permission !== "granted" || isLocked || saving}
                  className={`relative h-6 w-11 rounded-full transition-colors flex items-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-white/20"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </Card>
      </div>

      {/* ═══ SONIDO Y VIBRACIÓN ══════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          Alertas
        </h3>
        <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05] overflow-hidden">
          {/* Sonido */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
              {prefs.sound ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Sonido
              </p>
              <p className="text-[11px] text-gray-400">
                Reproducir sonido al recibir notificaciones
              </p>
            </div>
            <button
              onClick={() =>
                handleToggleType("sound" as any)
              }
              disabled={permission !== "granted" || saving}
              className={`relative h-6 w-11 rounded-full transition-colors flex items-center flex-shrink-0 disabled:opacity-40 ${
                prefs.sound ? "bg-brand-500" : "bg-gray-300 dark:bg-white/20"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.sound ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Vibración */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
              <Vibrate className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Vibración
              </p>
              <p className="text-[11px] text-gray-400">
                Vibrar el dispositivo al recibir notificaciones
              </p>
            </div>
            <button
              onClick={() =>
                handleToggleType("vibration" as any)
              }
              disabled={permission !== "granted" || saving}
              className={`relative h-6 w-11 rounded-full transition-colors flex items-center flex-shrink-0 disabled:opacity-40 ${
                prefs.vibration ? "bg-brand-500" : "bg-gray-300 dark:bg-white/20"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.vibration ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </Card>
      </div>

      {/* ═══ HORARIO SILENCIOSO ══════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
          <Moon className="h-3.5 w-3.5" />
          Horario silencioso
        </h3>
        <Card padding="md" className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <Moon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                No molestar
              </p>
              <p className="text-[11px] text-gray-400">
                Silenciar notificaciones en ciertas horas
              </p>
            </div>
            <button
              onClick={handleToggleQuietHours}
              disabled={permission !== "granted" || saving}
              className={`relative h-6 w-11 rounded-full transition-colors flex items-center flex-shrink-0 disabled:opacity-40 ${
                prefs.quietHours.enabled ? "bg-indigo-500" : "bg-gray-300 dark:bg-white/20"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.quietHours.enabled ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Selectores de hora */}
          {prefs.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-3 pt-2 animate-slide-up border-t border-gray-100 dark:border-white/[0.05]">
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                  Desde
                </label>
                <input
                  type="time"
                  value={prefs.quietHours.from}
                  onChange={(e) => handleQuietHoursChange("from", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm font-mono focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                  Hasta
                </label>
                <input
                  type="time"
                  value={prefs.quietHours.to}
                  onChange={(e) => handleQuietHoursChange("to", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm font-mono focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          )}

          {prefs.quietHours.enabled && (
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/5 p-2 rounded-lg">
              🌙 Las notificaciones estarán silenciadas de{" "}
              <strong>{prefs.quietHours.from}</strong> a{" "}
              <strong>{prefs.quietHours.to}</strong>. Las notificaciones de{" "}
              <strong>seguridad</strong> siempre llegarán.
            </p>
          )}
        </Card>
      </div>

      {/* ═══ DISPOSITIVOS CONECTADOS ═════════════════════════ */}
      {devices.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" />
            Dispositivos conectados ({devices.length})
          </h3>
          <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05] overflow-hidden">
            {devices.map((device, index) => {
              const isMobile = device.deviceInfo?.isMobile;
              const isPWA = device.deviceInfo?.isPWA;
              const deviceName = isPWA
                ? "App instalada"
                : device.deviceInfo?.browser || "Navegador";
              const os = device.deviceInfo?.os || "Unknown";
              const lastActive = device.lastActive
                ? new Date(device.lastActive).toLocaleDateString("es-CU")
                : "Desconocido";

              return (
                <div key={device.token + index} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                    {isMobile ? (
                      <Smartphone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Monitor className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {deviceName} · {os}
                      </p>
                      {isPWA && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                          PWA
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Último uso: {lastActive}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device.token)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Quitar dispositivo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ═══ INFO ADICIONAL ══════════════════════════════════ */}
      <Card padding="md" className="border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              ¿Sabías esto?
            </p>
            <ul className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
              <li>💡 Las notificaciones de <strong>seguridad</strong> nunca se pueden desactivar</li>
              <li>💡 Las de <strong>trades</strong> y <strong>pagos</strong> son críticas para no perder dinero</li>
              <li>💡 El <strong>horario silencioso</strong> no afecta a las de seguridad</li>
              <li>💡 Se guardan en el historial aunque estén silenciadas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
