// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "REPLACE_API_KEY",
  authDomain: "REPLACE_AUTH_DOMAIN",
  projectId: "REPLACE_PROJECT_ID",
  storageBucket: "REPLACE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_MESSAGING_SENDER_ID",
  appId: "REPLACE_APP_ID",
  vapidKey: "REPLACE_VAPID_KEY"
});

const messaging = firebase.messaging();

// Manejador en segundo plano para las notificaciones de CupCoin
messaging.onBackgroundMessage((payload) => {
  console.log('Push recibido en segundo plano:', payload);
  
  const notificationTitle = payload.notification?.title || "CupCoin Alerta";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva actualización.",
    icon: '/favicon.svg',
    badge: '/favicon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
