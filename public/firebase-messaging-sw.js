// src/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// 💡 Ahora lee dinámicamente las variables globales inyectadas por Vite en el 'build'
firebase.initializeApp({
  apiKey: self.VITE_FIREBASE_API_KEY,
  authDomain: self.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: self.VITE_FIREBASE_PROJECT_ID,
  storageBucket: self.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: self.VITE_FIREBASE_APP_ID
});

const messaging = firebase.messaging();

// Manejador de notificaciones cuando la app está CERRADA o en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Push recibido en segundo plano:', payload);
  
  const notificationTitle = payload.notification?.title || "CupCoin Alerta";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva actualización.",
    icon: '/logo.png', 
    badge: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
