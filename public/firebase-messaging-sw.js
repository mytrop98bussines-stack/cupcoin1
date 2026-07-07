// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// 💡 Dejamos los placeholders. El plugin de Vite los cambiará por tus secretos reales al compilar.
firebase.initializeApp({
  apiKey: "VITE_FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: "VITE_FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: "VITE_FIREBASE_APP_ID_PLACEHOLDER"
});

const messaging = firebase.messaging();

// Manejador de notificaciones cuando la app está CERRADA o en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Push recibido en segundo plano:', payload);
  
  const notificationTitle = payload.notification?.title || "CupCoin Alerta";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva actualización.",
    icon: '/logo.png', // Icono público de tu app
    badge: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
