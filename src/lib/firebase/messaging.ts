import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { app, db } from "./config";

// ✅ Inicialización segura para entornos sin soporte de SW
let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("⚠️ Firebase Messaging no disponible en este entorno:", error);
}

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
      await updateDoc(doc(db, "users", userId), {
        fcmToken:        token,
        fcmTokenUpdated: Date.now(),
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

// ─── Enviar notificación interna via Firestore ───────────
// Las notificaciones push reales requieren Cloud Functions
// Esta función guarda la notificación en Firestore y el
// listener en tiempo real del destinatario la mostrará
export async function notifyUser(
  recipientUid:  string,
  title:         string,
  body:          string,
  data:          Record<string, string> = {}
): Promise<void> {
  if (!recipientUid) return;

  try {
    await addDoc(collection(db, "notifications"), {
      userId:    recipientUid,
      title,
      body,
      data,
      type:      data.type || "system",
      read:      false,
      createdAt: Date.now(),
    });
    console.log(`✅ Notificación enviada a ${recipientUid}: ${title}`);
  } catch (error) {
    console.error("❌ Error enviando notificación:", error);
  }
      }
