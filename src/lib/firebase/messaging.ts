import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";
import { app } from "./config";

// ─── Types ────────────────────────────────────────────────
export type NotificationType =
  | "trade"           // 💰 Trades P2P
  | "payment"         // 💵 Pagos recibidos
  | "kyc"             // ✅ KYC updates
  | "message"         // 💬 Mensajes de chat
  | "marketplace"     // 🛍️ Marketplace/productos
  | "security"        // 🔐 Seguridad
  | "promo"           // 🎁 Promociones
  | "system";         // 🔔 Sistema general

export type NotificationPriority = "high" | "normal" | "low";

interface EnhancedNotification {
  title:         string;
  body:          string;
  type:          NotificationType;
  priority?:     NotificationPriority;
  image?:        string;
  icon?:         string;
  badge?:        string;
  data?:         Record<string, string>;
  actions?:      NotificationAction[];
  requireInteraction?: boolean;
  silent?:       boolean;
  vibrate?:      number[];
}

interface NotificationAction {
  action: string;
  title:  string;
  icon?:  string;
}

let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("⚠️ Firebase Messaging no disponible:", error);
}

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

// ═══════════════════════════════════════════════════════════
// 🔔 CONFIGURACIÓN DE NOTIFICACIONES POR TIPO
// ═══════════════════════════════════════════════════════════

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon:     string;
  badge:    string;
  color:    string;
  vibrate:  number[];
  priority: NotificationPriority;
  sound:    string;
}> = {
  trade: {
    icon:     "/icons/notif-trade.png",
    badge:    "/icons/badge-trade.png",
    color:    "#f59e0b",
    vibrate:  [200, 100, 200],
    priority: "high",
    sound:    "trade.mp3",
  },
  payment: {
    icon:     "/icons/notif-payment.png",
    badge:    "/icons/badge-payment.png",
    color:    "#10b981",
    vibrate:  [300, 100, 300, 100, 300],
    priority: "high",
    sound:    "cash.mp3",
  },
  kyc: {
    icon:     "/icons/notif-kyc.png",
    badge:    "/icons/badge-kyc.png",
    color:    "#3b82f6",
    vibrate:  [200],
    priority: "high",
    sound:    "notification.mp3",
  },
  message: {
    icon:     "/icons/notif-message.png",
    badge:    "/icons/badge-message.png",
    color:    "#8b5cf6",
    vibrate:  [100, 50, 100],
    priority: "normal",
    sound:    "message.mp3",
  },
  marketplace: {
    icon:     "/icons/notif-shop.png",
    badge:    "/icons/badge-shop.png",
    color:    "#ec4899",
    vibrate:  [200, 100, 200],
    priority: "normal",
    sound:    "notification.mp3",
  },
  security: {
    icon:     "/icons/notif-security.png",
    badge:    "/icons/badge-security.png",
    color:    "#ef4444",
    vibrate:  [500, 200, 500],
    priority: "high",
    sound:    "alert.mp3",
  },
  promo: {
    icon:     "/icons/notif-promo.png",
    badge:    "/icons/badge-promo.png",
    color:    "#f59e0b",
    vibrate:  [100],
    priority: "low",
    sound:    "",
  },
  system: {
    icon:     "/icons/notif-system.png",
    badge:    "/icons/badge-system.png",
    color:    "#6b7280",
    vibrate:  [100],
    priority: "normal",
    sound:    "",
  },
};

// ═══════════════════════════════════════════════════════════
// 🎯 SOLICITAR PERMISO Y GUARDAR TOKEN
// ═══════════════════════════════════════════════════════════

export async function requestNotificationPermission(
  userId: string
): Promise<string | null> {
  if (!messaging) {
    console.warn("⚠️ Messaging no disponible en este navegador");
    return null;
  }
  if (typeof Notification === "undefined") {
    console.warn("⚠️ Notification API no soportada");
    return null;
  }

  try {
    let permission = Notification.permission;

    // ✅ Solicitar solo si nunca decidió
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.warn("⚠️ Notificaciones no permitidas:", permission);
      localStorage.setItem("notif_permission_denied", "1");
      return null;
    }

    // ✅ Registrar Service Worker
    let swRegistration: ServiceWorkerRegistration | undefined;

    if ("serviceWorker" in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        
        // Esperar a que esté activo
        await navigator.serviceWorker.ready;
        
        console.log("✅ Service Worker registrado y activo");
      } catch (err) {
        console.warn("⚠️ SW no registrado:", err);
      }
    }

    const token = await getToken(messaging, {
      vapidKey:                  import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn("⚠️ No se obtuvo token FCM.");
      return null;
    }

    // ✅ Detectar plataforma
    const platform = getPlatform();
    const deviceInfo = getDeviceInfo();

    const authToken = localStorage.getItem("cubax_token");

    await fetch(`${BACKEND_URL}/notifications/fcm-token`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId,
        fcmToken:   token,
        platform,
        deviceInfo,
        preferences: getStoredPreferences(),
      }),
    });

    console.log(`✅ FCM Token guardado (${platform}):`, token.slice(0, 20) + "...");
    return token;

  } catch (error: any) {
    console.warn("⚠️ Error FCM:", error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 DETECTAR PLATAFORMA Y DISPOSITIVO
// ═══════════════════════════════════════════════════════════

function getPlatform(): "ios" | "android" | "web" {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "web";
}

function getDeviceInfo(): {
  browser:    string;
  os:         string;
  isMobile:   boolean;
  isPWA:      boolean;
} {
  const ua = navigator.userAgent;
  
  let browser = "Unknown";
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";
  
  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac/i.test(ua)) os = "MacOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;
  
  return { browser, os, isMobile, isPWA };
}

// ═══════════════════════════════════════════════════════════
// 🎯 PREFERENCIAS DE USUARIO
// ═══════════════════════════════════════════════════════════

export interface NotificationPreferences {
  trade:       boolean;
  payment:     boolean;
  kyc:         boolean;
  message:     boolean;
  marketplace: boolean;
  security:    boolean;
  promo:       boolean;
  system:      boolean;
  sound:       boolean;
  vibration:   boolean;
  quietHours:  { enabled: boolean; from: string; to: string };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  trade:       true,
  payment:     true,
  kyc:         true,
  message:     true,
  marketplace: true,
  security:    true,  // NUNCA se puede desactivar
  promo:       false, // Off por defecto
  system:      true,
  sound:       true,
  vibration:   true,
  quietHours:  { enabled: false, from: "22:00", to: "08:00" },
};

export function getStoredPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem("cupcoin_notif_prefs");
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.warn("⚠️ Error leyendo preferencias:", err);
  }
  return DEFAULT_PREFERENCES;
}

export function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): void {
  const current = getStoredPreferences();
  const updated = { ...current, ...prefs, security: true }; // Security siempre on
  localStorage.setItem("cupcoin_notif_prefs", JSON.stringify(updated));
  
  // Sincronizar con backend
  syncPreferencesToBackend(updated);
}

async function syncPreferencesToBackend(
  prefs: NotificationPreferences
): Promise<void> {
  try {
    const authToken = localStorage.getItem("cubax_token");
    const uid = localStorage.getItem("cubax_uid");
    
    if (!authToken || !uid) return;
    
    await fetch(`${BACKEND_URL}/notifications/preferences`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId: uid, preferences: prefs }),
    });
  } catch (err) {
    console.warn("⚠️ Error sincronizando preferencias:", err);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 ESCUCHAR MENSAJES EN PRIMER PLANO
// ═══════════════════════════════════════════════════════════

export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): (() => void) | undefined {
  if (!messaging) return undefined;
  
  return onMessage(messaging, (payload) => {
    console.log("📩 Notificación en foreground:", payload);
    
    const type = (payload.data?.type as NotificationType) || "system";
    const config = NOTIFICATION_CONFIG[type];
    const prefs = getStoredPreferences();
    
    // ✅ Verificar preferencias del usuario
    if (!prefs[type]) {
      console.log(`🔕 Notificación de tipo "${type}" desactivada por usuario`);
      return;
    }
    
    // ✅ Verificar quiet hours
    if (isInQuietHours(prefs)) {
      console.log("🌙 En horario silencioso, notificación silenciada");
      return;
    }
    
    // ✅ Mostrar notificación custom (async pero no bloqueamos)
    void showRichNotification(payload, config, prefs);
    
    // ✅ Callback custom
    callback(payload);
    
    // ✅ Reproducir sonido si está activado
    if (prefs.sound && config.sound) {
      playNotificationSound(config.sound);
    }
    
    // ✅ Vibrar si está activado
    if (prefs.vibration && "vibrate" in navigator) {
      navigator.vibrate(config.vibrate);
    }
  });
}

// ═══════════════════════════════════════════════════════════
// 🎯 MOSTRAR NOTIFICACIÓN RICA (foreground) — FIX Android
// ═══════════════════════════════════════════════════════════

async function showRichNotification(
  payload: MessagePayload,
  config: typeof NOTIFICATION_CONFIG[NotificationType],
  prefs: NotificationPreferences
): Promise<void> {
  if (Notification.permission !== "granted") return;
  
  const title = payload.notification?.title || "CupCoin";
  const options: NotificationOptions = {
    body:     payload.notification?.body || "",
    icon:     payload.notification?.image || config.icon,
    badge:    config.badge,
    tag:      payload.data?.tag || "cupcoin-notif",
    data:     payload.data,
    silent:   !prefs.sound,
    vibrate:  prefs.vibration ? config.vibrate : [0],
    requireInteraction: config.priority === "high",
  };
  
  // ✅ Agregar botones si vienen en el payload
  if (payload.data?.actions) {
    try {
      const actions = JSON.parse(payload.data.actions);
      (options as any).actions = actions;
    } catch {}
  }
  
  try {
    // ✅ FIX: Usar Service Worker en vez de new Notification()
    // (Requerido en Chrome Android)
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      // Fallback para navegadores sin SW (raro)
      // eslint-disable-next-line no-new
      new Notification(title, options);
    }
  } catch (err) {
    console.warn("⚠️ Error mostrando notificación:", err);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 MANEJAR CLICK EN NOTIFICACIÓN
// ═══════════════════════════════════════════════════════════

function handleNotificationClick(data?: { [key: string]: string }): void {
  if (!data) {
    window.location.href = "/";
    return;
  }
  
  const type = data.type;
  const targetView = data.view;
  const targetId = data.id;
  
  // ✅ Deep linking basado en tipo
  const routes: Record<string, string> = {
    trade:       `/trade/${targetId}`,
    payment:     `/wallet`,
    message:     `/chat/${targetId}`,
    marketplace: `/product/${targetId}`,
    kyc:         `/kyc`,
    security:    `/settings/security`,
  };
  
  const url = routes[type] || targetView || "/";
  
  // Enviar mensaje al app principal para navegar
  window.postMessage({
    type: "NAVIGATE_FROM_NOTIFICATION",
    url,
    data,
  }, "*");
}

// ═══════════════════════════════════════════════════════════
// 🎯 HORARIO SILENCIOSO
// ═══════════════════════════════════════════════════════════

function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHours.enabled) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [fromH, fromM] = prefs.quietHours.from.split(":").map(Number);
  const [toH, toM] = prefs.quietHours.to.split(":").map(Number);
  const fromTime = fromH * 60 + fromM;
  const toTime = toH * 60 + toM;
  
  // Si cruza medianoche (ej: 22:00 → 08:00)
  if (fromTime > toTime) {
    return currentTime >= fromTime || currentTime <= toTime;
  }
  
  return currentTime >= fromTime && currentTime <= toTime;
}

// ═══════════════════════════════════════════════════════════
// 🎯 REPRODUCIR SONIDO
// ═══════════════════════════════════════════════════════════

function playNotificationSound(soundFile: string): void {
  try {
    const audio = new Audio(`/sounds/${soundFile}`);
    audio.volume = 0.5;
    audio.play().catch((err) => {
      console.warn("⚠️ No se pudo reproducir sonido:", err);
    });
  } catch (err) {
    console.warn("⚠️ Error con audio:", err);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 ENVIAR NOTIFICACIÓN (mejorada con tipos)
// ═══════════════════════════════════════════════════════════

export async function notifyUser(
  recipientUid: string,
  notification: Omit<EnhancedNotification, "priority"> & { priority?: NotificationPriority }
): Promise<void> {
  if (!recipientUid) return;

  try {
    const authToken = localStorage.getItem("cubax_token");
    const config = NOTIFICATION_CONFIG[notification.type];

    await fetch(`${BACKEND_URL}/notifications/send`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        recipientUid,
        title:              notification.title,
        body:               notification.body,
        type:               notification.type,
        priority:           notification.priority || config.priority,
        image:              notification.image,
        icon:               notification.icon || config.icon,
        badge:              notification.badge || config.badge,
        data:               notification.data || {},
        actions:            notification.actions,
        requireInteraction: notification.requireInteraction,
        silent:             notification.silent,
        vibrate:            notification.vibrate || config.vibrate,
        color:              config.color,
      }),
    });

    console.log(`✅ Notificación enviada a ${recipientUid}: ${notification.title}`);
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 HELPERS RÁPIDOS PARA CASOS COMUNES
// ═══════════════════════════════════════════════════════════

export const notify = {
  // 💰 Trade P2P iniciado
  tradeStarted: (uid: string, buyerName: string, amount: number, asset: string, tradeId: string) =>
    notifyUser(uid, {
      type:  "trade",
      title: "💰 Trade P2P iniciado",
      body:  `${buyerName} quiere comprar ${amount} ${asset}`,
      data:  { type: "trade", id: tradeId },
      actions: [
        { action: "view",   title: "Ver Trade" },
        { action: "cancel", title: "Rechazar" },
      ],
    }),

  // ✅ Pago recibido
  paymentReceived: (uid: string, amount: number, asset: string, fromName: string) =>
    notifyUser(uid, {
      type:  "payment",
      title: "💵 Pago recibido",
      body:  `Recibiste ${amount} ${asset} de ${fromName}`,
      data:  { type: "payment", view: "wallet" },
    }),

  // 💬 Nuevo mensaje
  newMessage: (uid: string, fromName: string, preview: string, chatId: string) =>
    notifyUser(uid, {
      type:  "message",
      title: `💬 ${fromName}`,
      body:  preview,
      data:  { type: "message", id: chatId, tag: `chat-${chatId}` },
      actions: [
        { action: "reply", title: "Responder" },
        { action: "view",  title: "Ver chat" },
      ],
    }),

  // 🛍️ Nueva orden en marketplace
  newOrder: (uid: string, productTitle: string, buyerName: string, orderId: string) =>
    notifyUser(uid, {
      type:  "marketplace",
      title: "🛍️ Nueva orden",
      body:  `${buyerName} compró: ${productTitle}`,
      data:  { type: "marketplace", id: orderId },
    }),

  // ✅ KYC aprobado
  kycApproved: (uid: string) =>
    notifyUser(uid, {
      type:  "kyc",
      title: "✅ KYC aprobado",
      body:  "Tu verificación fue aprobada. Ya puedes operar sin límites.",
      data:  { type: "kyc", view: "dashboard" },
    }),

  // ❌ KYC rechazado
  kycRejected: (uid: string, reason: string) =>
    notifyUser(uid, {
      type:  "kyc",
      title: "❌ KYC rechazado",
      body:  `Motivo: ${reason}. Intenta de nuevo.`,
      data:  { type: "kyc", view: "kyc" },
    }),

  // 🔐 Login desde nuevo dispositivo
  newDeviceLogin: (uid: string, device: string, location: string) =>
    notifyUser(uid, {
      type:     "security",
      title:    "🔐 Nuevo login detectado",
      body:     `${device} desde ${location}. ¿Fuiste tú?`,
      priority: "high",
      requireInteraction: true,
      data:     { type: "security", view: "security" },
      actions:  [
        { action: "confirm", title: "Sí, fui yo" },
        { action: "block",   title: "No, bloquear" },
      ],
    }),

  // ⚠️ Trade a punto de expirar
  tradeExpiring: (uid: string, tradeId: string, minutesLeft: number) =>
    notifyUser(uid, {
      type:     "trade",
      title:    "⚠️ Trade expirando",
      body:     `Trade #${tradeId.slice(-8)} expira en ${minutesLeft} min`,
      priority: "high",
      data:     { type: "trade", id: tradeId },
    }),

  // 🎁 Recompensa disponible
  rewardEarned: (uid: string, amount: number, reason: string) =>
    notifyUser(uid, {
      type:  "promo",
      title: "🎁 ¡Recompensa ganada!",
      body:  `Ganaste ${amount} CUPCOIN por ${reason}`,
      data:  { type: "promo", view: "wallet" },
    }),
};

// ═══════════════════════════════════════════════════════════
// 🎯 UTILIDADES ADICIONALES
// ═══════════════════════════════════════════════════════════

// Verificar si las notificaciones están habilitadas
export function isNotificationEnabled(): boolean {
  return Notification.permission === "granted";
}

// Solicitar permiso solo cuando es necesario (smart prompt)
export async function smartRequestPermission(reason: string): Promise<boolean> {
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  
  console.log(`💡 Solicitando permiso: ${reason}`);
  
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Cerrar todas las notificaciones abiertas
export async function closeAllNotifications(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    const notifications = await reg.getNotifications();
    notifications.forEach((n) => n.close());
  }
}

// ═══════════════════════════════════════════════════════════
// 🧪 TEST NOTIFICATION — FIX Android
// ═══════════════════════════════════════════════════════════

export async function sendTestNotification(): Promise<void> {
  if (Notification.permission !== "granted") {
    alert("Primero activa las notificaciones");
    return;
  }
  
  const options: NotificationOptions = {
    body:    "Si ves esto, las notificaciones funcionan perfectamente ✅",
    icon:    "/favicon.svg",
    badge:   "/favicon.svg",
    tag:     "cupcoin-test",
    vibrate: [200, 100, 200],
    data: {
      type: "system",
      test: "true",
    },
  };
  
  try {
    // ✅ FIX: Usar Service Worker en vez de new Notification()
    // (Requerido en Chrome Android para evitar "Illegal constructor")
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("🧪 CupCoin Test", options);
      console.log("✅ Test notification enviada via SW");
    } else {
      // Fallback para navegadores sin SW (raro)
      // eslint-disable-next-line no-new
      new Notification("🧪 CupCoin Test", options);
    }
  } catch (err) {
    console.error("❌ Error test notification:", err);
    alert("Error mostrando la notificación: " + (err as Error).message);
  }
      }
