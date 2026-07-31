// ═══════════════════════════════════════════════════════════
// 🔔 CUPCOIN — FIREBASE MESSAGING SERVICE WORKER
// Versión: 2.0 (con notificaciones ricas + deep linking)
// ═══════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ─── Configuración Firebase ──────────────────────────────
firebase.initializeApp({
  apiKey:            "REPLACE_API_KEY",
  authDomain:        "REPLACE_AUTH_DOMAIN",
  projectId:         "REPLACE_PROJECT_ID",
  storageBucket:     "REPLACE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_MESSAGING_SENDER_ID",
  appId:             "REPLACE_APP_ID",
});

const messaging = firebase.messaging();

// ═══════════════════════════════════════════════════════════
// 🎨 CONFIGURACIÓN POR TIPO DE NOTIFICACIÓN
// ═══════════════════════════════════════════════════════════

const NOTIFICATION_CONFIG = {
  trade: {
    icon:     '/icons/notif-trade.png',
    badge:    '/icons/badge-trade.png',
    color:    '#f59e0b',
    vibrate:  [200, 100, 200],
    tag:      'cupcoin-trade',
    requireInteraction: true,
  },
  payment: {
    icon:     '/icons/notif-payment.png',
    badge:    '/icons/badge-payment.png',
    color:    '#10b981',
    vibrate:  [300, 100, 300, 100, 300],
    tag:      'cupcoin-payment',
    requireInteraction: true,
  },
  kyc: {
    icon:     '/icons/notif-kyc.png',
    badge:    '/icons/badge-kyc.png',
    color:    '#3b82f6',
    vibrate:  [200],
    tag:      'cupcoin-kyc',
    requireInteraction: false,
  },
  message: {
    icon:     '/icons/notif-message.png',
    badge:    '/icons/badge-message.png',
    color:    '#8b5cf6',
    vibrate:  [100, 50, 100],
    tag:      'cupcoin-message',
    requireInteraction: false,
  },
  marketplace: {
    icon:     '/icons/notif-shop.png',
    badge:    '/icons/badge-shop.png',
    color:    '#ec4899',
    vibrate:  [200, 100, 200],
    tag:      'cupcoin-shop',
    requireInteraction: false,
  },
  security: {
    icon:     '/icons/notif-security.png',
    badge:    '/icons/badge-security.png',
    color:    '#ef4444',
    vibrate:  [500, 200, 500],
    tag:      'cupcoin-security',
    requireInteraction: true,
  },
  promo: {
    icon:     '/icons/notif-promo.png',
    badge:    '/icons/badge-promo.png',
    color:    '#f59e0b',
    vibrate:  [100],
    tag:      'cupcoin-promo',
    requireInteraction: false,
  },
  system: {
    icon:     '/icons/notif-system.png',
    badge:    '/icons/badge-system.png',
    color:    '#6b7280',
    vibrate:  [100],
    tag:      'cupcoin-system',
    requireInteraction: false,
  },
};

// Fallback si no hay iconos específicos
const DEFAULT_ICON = '/favicon.svg';
const DEFAULT_BADGE = '/favicon.svg';

// ═══════════════════════════════════════════════════════════
// 🔔 MANEJADOR DE NOTIFICACIONES EN SEGUNDO PLANO
// ═══════════════════════════════════════════════════════════

messaging.onBackgroundMessage((payload) => {
  console.log('📩 [SW] Push recibido en background:', payload);

  // ─── Extraer datos ────────────────────────────────────
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

  // ─── Construir opciones ricas ─────────────────────────
  const notificationOptions = {
    body:      notificationBody,
    icon:      payload.notification?.image || payload.data?.icon || config.icon || DEFAULT_ICON,
    badge:     payload.data?.badge || config.badge || DEFAULT_BADGE,
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

  // ─── Añadir botones de acción ─────────────────────────
  if (payload.data?.actions) {
    try {
      const actions = JSON.parse(payload.data.actions);
      notificationOptions.actions = actions;
    } catch (e) {
      console.warn('⚠️ Error parseando actions:', e);
    }
  } else {
    // Acciones por defecto según tipo
    notificationOptions.actions = getDefaultActions(type);
  }

  // ─── Mostrar notificación ─────────────────────────────
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
        { action: 'view',    title: '👀 Ver Trade', icon: '/icons/action-view.png' },
        { action: 'dismiss', title: '✖ Descartar' },
      ];
    case 'message':
      return [
        { action: 'reply', title: '💬 Responder', icon: '/icons/action-reply.png' },
        { action: 'view',  title: '👀 Ver chat' },
      ];
    case 'payment':
      return [
        { action: 'view',    title: '💵 Ver pago', icon: '/icons/action-money.png' },
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

  // ─── Manejar acciones específicas ─────────────────────
  if (action === 'dismiss') {
    return; // Solo cerrar
  }
  
  if (action === 'block') {
    // Enviar solicitud de bloqueo al backend
    event.waitUntil(blockDevice(data));
    return;
  }
  
  if (action === 'confirm') {
    // Confirmar login legítimo
    event.waitUntil(confirmLogin(data));
    return;
  }
  
  if (action === 'reply') {
    // Abrir chat en modo respuesta rápida
    event.waitUntil(openWindow(data.url + '&reply=true'));
    return;
  }

  // ─── Acción por defecto: abrir la URL ─────────────────
  const url = data.url || self.location.origin;
  
  event.waitUntil(openWindow(url));
});

// ═══════════════════════════════════════════════════════════
// 🎯 ABRIR VENTANA (o enfocar existente)
// ═══════════════════════════════════════════════════════════

async function openWindow(url) {
  try {
    // Buscar si ya hay una ventana abierta
    const allClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    // Si hay una ventana abierta, enfócala y navega
    for (const client of allClients) {
      if (client.url.startsWith(self.location.origin)) {
        await client.focus();
        
        // Enviar mensaje para navegar
        client.postMessage({
          type: 'NAVIGATE_FROM_NOTIFICATION',
          url:  url,
        });
        
        return client;
      }
    }

    // Si no hay ventana, abrir una nueva
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
      `${self.location.origin.replace('web.app', 'onrender.com')}/api/security/block-device`,
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
        icon: DEFAULT_ICON,
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
      `${self.location.origin.replace('web.app', 'onrender.com')}/api/security/confirm-login`,
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
// 🎯 MANEJADOR DE CIERRE DE NOTIFICACIÓN
// ═══════════════════════════════════════════════════════════

self.addEventListener('notificationclose', (event) => {
  console.log('🚪 [SW] Notificación cerrada:', event.notification.tag);
  
  // Opcional: track analytics
  // trackNotificationDismissal(event.notification.data);
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
// 🎯 SYNC EN BACKGROUND (opcional, para PWA offline)
// ═══════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncPendingNotifications());
  }
});

async function syncPendingNotifications() {
  // Placeholder para sync de notificaciones pendientes
  console.log('🔄 [SW] Sincronizando notificaciones pendientes...');
}

// ═══════════════════════════════════════════════════════════
// 🎯 PUSH EVENT — FALLBACK (Web Push nativo)
// ═══════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    console.log('📨 [SW] Push nativo:', data);
    
    const options = {
      body:  data.body || 'Nueva notificación',
      icon:  data.icon || DEFAULT_ICON,
      badge: data.badge || DEFAULT_BADGE,
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
