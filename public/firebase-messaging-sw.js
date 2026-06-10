// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// 💡 Tus credenciales reales inyectadas directamente
firebase.initializeApp({
  apiKey: "AIzaSyAxUOLLm72in2-OM30Ywrxq9-QBuYdH334",
  authDomain: "cupcoin-b2b4f.firebaseapp.com",
  projectId: "cupcoin-b2b4f",
  storageBucket: "cupcoin-b2b4f.firebasestorage.app",
  messagingSenderId: "502564207166",
  appId: "1:502564207166:web:ef81ebbebf6e390142ef6f"
});

const messaging = firebase.messaging();

// Manejador de notificaciones cuando la app está CERRADA o en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Push recibido en segundo plano:', payload);
  
  const notificationTitle = payload.notification?.title || "CupCoin Alerta";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva actualización.",
    icon: '/logo.png', // Asegúrate de tener un icono en tu carpeta public o cámbialo
    badge: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
