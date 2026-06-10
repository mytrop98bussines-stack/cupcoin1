// src/lib/firebase/messaging.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { app, db } from './config';

const messaging = getMessaging(app);

export async function requestNotificationPermission(userId: string) {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    
    // Guardar token en Firestore
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token,
    });
    
    return token;
  }
  
  return null;
}

export function onForegroundMessage(callback: (payload: any) => void) {
  return onMessage(messaging, callback);
}
