import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./config";

// ✅ Inicialización segura para entornos sin soporte de SW
let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("⚠️ Firebase Messaging no disponible en este entorno:", error);
}

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

// ─── Pedir permiso y guardar token FCM ───────────────────
export async function requestNotificationPermission(
  userId: string
): Promise<string | null> {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("⚠️ Permiso de notificaciones denegado.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token) {
      // ✅ Guardar token via backend en lugar de Firestore directo
      const authToken = localStorage.getItem("cubax_token");
      await fetch(`${BACKEND_URL}/notifications/fcm-token`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId, fcmToken: token }),
      });
      console.log("✅ FCM Token guardado:", token.slice(0, 20) + "...");
    }

    return token;
  } catch (error) {
    console.warn("⚠️ No se pudo obtener el token FCM:", error);
    return null;
  }
}

// ─── Escuchar mensajes en primer plano ───────────────────
export function onForegroundMessage(
  callback: (payload: any) => void
): (() => void) | undefined {
  if (!messaging) return undefined;
  return onMessage(messaging, callback);
}

// ─── Enviar notificación interna via backend ──────────────
export async function notifyUser(
  recipientUid: string,
  title:        string,
  body:         string,
  data:         Record<string, string> = {}
): Promise<void> {
  if (!recipientUid) return;

  try {
    const authToken = localStorage.getItem("cubax_token");
    await fetch(`${BACKEND_URL}/notifications/send`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        recipientUid,
        title,
        body,
        data,
        type: data.type || "system",
      }),
    });
    console.log(`✅ Notificación enviada a ${recipientUid}: ${title}`);
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
  }
}
