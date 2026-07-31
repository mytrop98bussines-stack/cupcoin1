// ═══════════════════════════════════════════════════════════
// 🔔 CUPCOIN — FIREBASE MESSAGING SERVICE WORKER
// Versión: 2.1 (con favicon correcto + sin import.meta.env)
// ═══════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ─── Configuración Firebase (HARDCODEADO — el SW no lee env) ──
// ⚠️ IMPORTANTE: Reemplaza con TUS valores reales del proyecto
firebase.initializeApp({
  apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain:        "cupcoin-b2b4f.firebaseapp.com",
  projectId:         "cupcoin-b2b4f",
  storageBucket:     "cupcoin-b2b4f.firebasestorage.app",
  messagingSenderId: "XXXXXXXXXXXX",
  appId:             "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXXXX",
});

const messaging = firebase.messaging();

// ═══════════════════════════════════════════════════════════
// 🎨 CONFIGURACIÓN — TODAS USAN TU FAVICON
// ═══════════════════════════════════════════════════════════

// ✅ Un solo icono para todo (tu favicon)
const APP_ICON = '/favicon.svg';

const NOTIFICATION_CONFIG = {
  trade: {
    icon:     APP_ICON,
    badge:    APP_ICON,
    color:    '#f59e0b',
    vibrate:  [200, 100, 200],
    tag:      'cupcoin-trade',
    requireInteraction: true,
  },
  payment: {
    icon:     APP_ICON,
    badge:    APP_ICON,
    color:    '#10b981',
    vibrate:  [300, 100, 300, 100, 300],
    tag:      'cupcoin-payment',
    requireInteraction: true,
  },
  kyc: {
    icon:     APP_ICON,
    badge:    APP_ICON,
    color:    '#3b82f6',
    vibrate:  [200],
    tag:      'cupcoin-kyc',
    requireInteraction: false,
  },
  message: {
    icon:     APP_ICON,
    badge:    APP_ICON,
    color:    '#8b5cf6',
    vibrate:  [100, 50, 100],
    tag:      'cupcoin-message',
    requireInteraction: false,
  },
  marketplace: {
    icon:     APP_ICON,
    badge:    APP_ICON,
    color:    '#ec4899',
    vibrate:  [200, 100, 200],
    tag:      'cupcoin-shop',
    requireInteraction: false,
  },
  security: {
    icon:     APP_ICON,
    badge:    APP_ICON,
    color:    '#ef4444',
    vibrate:  [500, 200, 500],
    tag:      'cupcoin-security',
    requireInteraction: true,
  },
  promo: {
    icon:     APP_ICON,
    badge:    APP_ICON,
    color:    '#f59e0b',
    vibrate:  [100],
    tag:      'cupcoin-promo',
    requireInteraction: false,
  },
  system: {
    icon:     APP_ICON,
    badge:    APP_ICON,
    color:    '#6b7280',
    vibrate:  [100],
    tag:      'cupcoin-system',
    requireInteraction: false,
  },
};

const DEFAULT_ICON = APP_ICON;
const DEFAULT_BADGE = APP_ICON;

// ═══════════════════════════════════════════════════════════
// 🔔 MANEJADOR DE NOTIFICACIONES EN SEGUNDO PLANO
// ═══════════════════════════════════════════════════════════

messaging.onBackgroundMessage((payload) => {
  console.log('📩 [SW] Push recibido en background:', payload);

  const type = payload.data?.type || 'system';
  const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.system;
  
  const notificationTitle = 
    payload.notification?.title || 
    payload.data?.title || 
    'CupCoin';
  
  const notificationBody = 
    payload.notification?.body || 
    payload.data?.body || 
    'Nueva actualización';

  const notificationOptions = {
    body:      notificationBody,
    icon:      APP_ICON,  // ✅ Siempre tu favicon
    badge:     APP_ICON,  // ✅ Siempre tu favicon
    image:     payload.notification?.image || payload.data?.image,
    tag:       payload.data?.tag || config.tag,
    data:      {
      ...payload.data,
      timestamp: Date.now(),
      url:       payload.data?.url || getUrlByType(type, payload.data),
    },
    vibrate:   parseVibratePattern(payload.data?.vibrate) || config.vibrate,
    silent:    payload.data?.silent === 'true',
    requireInteraction: 
      payload.data?.requireInteraction === 'true' || 
      config.requireInteraction,
    renotify:  true,
    timestamp: Date.now(),
  };

  if (payload.data?.actions) {
    try {
      const actions = JSON.parse(payload.data.actions);
      notificationOptions.actions = actions;
    } catch (e) {
      console.warn('⚠️ Error parseando actions:', e);
    }
  } else {
    notificationOptions.actions = getDefaultActions(type);
  }

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// ═══════════════════════════════════════════════════════════
// 🎯 ACCIONES POR DEFECTO SEGÚN TIPO
// ═══════════════════════════════════════════════════════════

function getDefaultActions(type) {
  switch (type) {
    case 'trade':
      return [
        { action: 'view',    title: '👀 Ver Trade' },
        { action: 'dismiss', title: '✖ Descartar' },
      ];
    case 'message':
      return [
        { action: 'reply', title: '💬 Responder' },
        { action: 'view',  title: '👀 Ver chat' },
      ];
    case 'payment':
      return [
        { action: 'view',    title: '💵 Ver pago' },
        { action: 'dismiss', title: '✖' },
      ];
    case 'security':
      return [
        { action: 'confirm', title: '✅ Fui yo' },
        { action: 'block',   title: '🚨 Bloquear' },
      ];
    case 'marketplace':
      return [
        { action: 'view',    title: '🛍️ Ver orden' },
        { action: 'dismiss', title: '✖' },
      ];
    case 'kyc':
      return [
        { action: 'view', title: '📄 Ver detalles' },
      ];
    default:
      return [
        { action: 'view',    title: 'Ver' },
        { action: 'dismiss', title: 'Descartar' },
      ];
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 DEEP LINKING — URL SEGÚN TIPO
// ═══════════════════════════════════════════════════════════

function getUrlByType(type, data) {
  const baseUrl = self.location.origin;
  
  if (!data) return baseUrl;
  
  switch (type) {
    case 'trade':
      return data.id 
        ? `${baseUrl}/?view=trade&id=${data.id}`
        : `${baseUrl}/?view=trade-history`;
    case 'payment':
      return `${baseUrl}/?view=wallet`;
    case 'message':
      return data.id 
        ? `${baseUrl}/?view=chat&id=${data.id}`
        : `${baseUrl}/?view=notifications`;
    case 'marketplace':
      return data.id 
        ? `${baseUrl}/?view=product-detail&id=${data.id}`
        : `${baseUrl}/?view=marketplace`;
    case 'kyc':
      return `${baseUrl}/?view=kyc`;
    case 'security':
      return `${baseUrl}/?view=security`;
    case 'promo':
      return `${baseUrl}/?view=wallet`;
    default:
      return baseUrl;
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 PARSER DE PATRÓN DE VIBRACIÓN
// ═══════════════════════════════════════════════════════════

function parseVibratePattern(vibrate) {
  if (!vibrate) return null;
  
  try {
    if (typeof vibrate === 'string') {
      return JSON.parse(vibrate);
    }
    if (Array.isArray(vibrate)) {
      return vibrate;
    }
  } catch (e) {
    console.warn('⚠️ Error parseando vibrate:', e);
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════
// 🖱️ MANEJADOR DE CLICK EN NOTIFICACIÓN
// ═══════════════════════════════════════════════════════════

self.addEventListener('notificationclick', (event) => {
  console.log('👆 [SW] Notificación clickeada:', event.notification);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') return;
  
  if (action === 'block') {
    event.waitUntil(blockDevice(data));
    return;
  }
  
  if (action === 'confirm') {
    event.waitUntil(confirmLogin(data));
    return;
  }
  
  if (action === 'reply') {
    event.waitUntil(openWindow(data.url + '&reply=true'));
    return;
  }

  const url = data.url || self.location.origin;
  event.waitUntil(openWindow(url));
});

// ═══════════════════════════════════════════════════════════
// 🎯 ABRIR VENTANA
// ═══════════════════════════════════════════════════════════

async function openWindow(url) {
  try {
    const allClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    for (const client of allClients) {
      if (client.url.startsWith(self.location.origin)) {
        await client.focus();
        client.postMessage({
          type: 'NAVIGATE_FROM_NOTIFICATION',
          url:  url,
        });
        return client;
      }
    }

    return await self.clients.openWindow(url);
  } catch (error) {
    console.error('❌ [SW] Error abriendo ventana:', error);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 ACCIONES ESPECÍFICAS (Bloquear / Confirmar)
// ═══════════════════════════════════════════════════════════

async function blockDevice(data) {
  try {
    const response = await fetch(
      'https://cubax-backend.onrender.com/api/security/block-device',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: data.deviceId,
          reason:   'user_blocked_from_notification',
        }),
      }
    );
    
    if (response.ok) {
      self.registration.showNotification('🚨 Dispositivo bloqueado', {
        body: 'El acceso desde ese dispositivo fue bloqueado por seguridad.',
        icon: APP_ICON,
        tag:  'security-blocked',
      });
    }
  } catch (error) {
    console.error('❌ [SW] Error bloqueando:', error);
  }
}

async function confirmLogin(data) {
  try {
    await fetch(
      'https://cubax-backend.onrender.com/api/security/confirm-login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: data.deviceId,
        }),
      }
    );
  } catch (error) {
    console.error('❌ [SW] Error confirmando:', error);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 CIERRE DE NOTIFICACIÓN
// ═══════════════════════════════════════════════════════════

self.addEventListener('notificationclose', (event) => {
  console.log('🚪 [SW] Notificación cerrada:', event.notification.tag);
});

// ═══════════════════════════════════════════════════════════
// 🎯 INSTALACIÓN Y ACTIVACIÓN
// ═══════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('📦 [SW] Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Activado');
  event.waitUntil(self.clients.claim());
});

// ═══════════════════════════════════════════════════════════
// 🎯 SYNC EN BACKGROUND
// ═══════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncPendingNotifications());
  }
});

async function syncPendingNotifications() {
  console.log('🔄 [SW] Sincronizando notificaciones pendientes...');
}

// ═══════════════════════════════════════════════════════════
// 🎯 PUSH EVENT — FALLBACK
// ═══════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    console.log('📨 [SW] Push nativo:', data);
    
    const options = {
      body:  data.body || 'Nueva notificación',
      icon:  APP_ICON,
      badge: APP_ICON,
      data:  data.data || {},
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'CupCoin',
        options
      )
    );
  } catch (e) {
    console.warn('⚠️ [SW] Error en push event:', e);
  }
});
