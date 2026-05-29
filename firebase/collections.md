# 📦 Estructura de Colecciones Firestore — CubaFinance

## Resumen de Servicios Firebase Necesarios

| Servicio | ¿Necesario? | Uso |
|----------|-------------|-----|
| **Authentication** | ✅ SÍ | Email/Password (básico) |
| **Firestore** | ✅ SÍ | Base de datos principal |
| **Storage** | ❌ NO | Usamos Cloudinary para imágenes |
| **Functions** | ⚡ OPCIONAL | Para notificaciones, KYC approval, escrow |
| **Hosting** | ⚡ OPCIONAL | Puedes usar Vercel/Netlify |

---

## 📊 Colecciones

### 1. `users` — Perfiles de Usuario

```typescript
// Documento: users/{userId}
interface UserDocument {
  // Datos básicos
  email: string;                    // Del auth
  displayName: string;              // Nombre público
  phone?: string;                   // Teléfono de contacto
  
  // KYC
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  kycFullName?: string;             // Nombre completo según CI
  kycIdNumber?: string;             // Número de carnet (encriptado idealmente)
  kycDocumentUrl?: string;          // URL de Cloudinary
  kycRejectionReason?: string;      // Si fue rechazado
  kycApprovedAt?: Timestamp;
  
  // Web3
  walletAddress?: string;           // Dirección ETH/BSC conectada
  
  // Estadísticas (denormalizadas para performance)
  stats: {
    totalP2PTrades: number;
    successfulTrades: number;
    totalProducts: number;
    rating: number;                 // 0-5
    ratingCount: number;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt?: Timestamp;
}
```

---

### 2. `p2p_orders` — Ofertas P2P

```typescript
// Documento: p2p_orders/{orderId}
interface P2POrderDocument {
  // Dueño
  userId: string;
  userDisplayName: string;
  
  // Tipo de orden
  type: 'buy' | 'sell';             // buy = quiero comprar crypto, sell = quiero vender
  
  // Crypto
  crypto: 'USDT' | 'BTC' | 'ETH';
  amount: number;                   // Cantidad disponible
  originalAmount: number;           // Cantidad original (para tracking)
  
  // Precio
  pricePerUnit: number;             // Precio por 1 unidad de crypto
  currency: 'CUP' | 'USD';          // Moneda fiat
  
  // Límites por transacción
  minLimit: number;                 // Mínimo en fiat
  maxLimit: number;                 // Máximo en fiat
  
  // Métodos de pago aceptados
  paymentMethods: Array<'transfermovil' | 'enzona' | 'efectivo' | 'usdt_trc20'>;
  
  // Instrucciones adicionales
  instructions?: string;            // Ej: "Solo banco X", "Zona Vedado"
  
  // Estado
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  
  // Estadísticas de esta orden
  completedTrades: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;            // Auto-expiración opcional
}
```

---

### 3. `p2p_trades` — Transacciones P2P

```typescript
// Documento: p2p_trades/{tradeId}
interface P2PTradeDocument {
  // Referencias
  orderId: string;                  // ID de la orden original
  
  // Participantes
  buyerId: string;                  // Quien compra crypto
  buyerDisplayName: string;
  sellerId: string;                 // Quien vende crypto
  sellerDisplayName: string;
  
  // Detalles de la transacción
  crypto: 'USDT' | 'BTC' | 'ETH';
  amount: number;                   // Cantidad de crypto
  pricePerUnit: number;             // Precio acordado
  totalPrice: number;               // amount * pricePerUnit
  currency: 'CUP' | 'USD';
  paymentMethod: 'transfermovil' | 'enzona' | 'efectivo' | 'usdt_trc20';
  
  // Estado del trade
  status: 
    | 'pending'                     // Trade iniciado, esperando pago
    | 'paid'                        // Comprador marcó como pagado
    | 'confirmed'                   // Vendedor confirmó recepción
    | 'completed'                   // Crypto liberado, trade exitoso
    | 'disputed'                    // En disputa
    | 'cancelled';                  // Cancelado
  
  // Datos de pago (encriptar en producción)
  paymentDetails?: {
    accountNumber?: string;
    accountName?: string;
    reference?: string;
    proofImageUrl?: string;         // Comprobante
  };
  
  // Disputa (si aplica)
  dispute?: {
    reason: string;
    initiatedBy: string;            // UserId
    initiatedAt: Timestamp;
    resolvedAt?: Timestamp;
    resolution?: 'buyer_wins' | 'seller_wins' | 'split';
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  
  // TTL - auto-cancelar si no hay actividad
  expiresAt: Timestamp;             // 30 min desde creación
}

// Subcolección: p2p_trades/{tradeId}/messages
interface TradeMessage {
  senderId: string;
  text: string;
  imageUrl?: string;                // Comprobantes
  createdAt: Timestamp;
}
```

---

### 4. `products` — Marketplace

```typescript
// Documento: products/{productId}
interface ProductDocument {
  // Dueño
  userId: string;
  userDisplayName: string;
  
  // Producto
  title: string;                    // Max 100 chars
  description: string;              // Max 500 chars
  price: number;
  currency: 'USD' | 'CUP';
  
  // Categorización
  category: 'electronica' | 'ropa' | 'hogar' | 'vehiculos' | 
            'servicios' | 'alimentos' | 'otros';
  condition: 'nuevo' | 'como_nuevo' | 'usado' | 'para_piezas';
  
  // Media (URLs de Cloudinary)
  images: string[];                 // 1-5 imágenes
  
  // Ubicación
  location: string;                 // Texto libre: "La Habana, Vedado"
  province?: string;                // Para filtros
  
  // Contacto
  contactPhone?: string;
  contactWhatsApp?: string;
  
  // Estado
  isActive: boolean;
  isSold: boolean;
  
  // Estadísticas
  views: number;
  favoritesCount: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  soldAt?: Timestamp;
}
```

---

### 5. `favorites` — Favoritos

```typescript
// Documento: favorites/{favoriteId}
// ID compuesto: `${userId}_${productId}`
interface FavoriteDocument {
  userId: string;
  productId: string;
  createdAt: Timestamp;
}
```

---

### 6. `notifications` — Notificaciones

```typescript
// Documento: notifications/{notificationId}
interface NotificationDocument {
  userId: string;                   // Destinatario
  
  type: 
    | 'trade_started'               // Alguien inició trade contigo
    | 'trade_paid'                  // Comprador pagó
    | 'trade_confirmed'             // Vendedor confirmó
    | 'trade_completed'             // Trade completado
    | 'trade_disputed'              // Disputa abierta
    | 'kyc_approved'                // KYC aprobado
    | 'kyc_rejected'                // KYC rechazado
    | 'product_sold'                // Tu producto fue comprado
    | 'system';                     // Mensaje del sistema
  
  title: string;
  body: string;
  
  // Referencia
  refType?: 'trade' | 'product' | 'order';
  refId?: string;
  
  // Estado
  read: boolean;
  readAt?: Timestamp;
  
  createdAt: Timestamp;
}
```

---

### 7. `app_config` — Configuración Global

```typescript
// Documento: app_config/general
interface AppConfigDocument {
  // Precios sugeridos (actualizados por admin/bot)
  suggestedPrices: {
    USDT_CUP: number;               // Ej: 378
    BTC_CUP: number;
    ETH_CUP: number;
    lastUpdated: Timestamp;
  };
  
  // Límites de la plataforma
  limits: {
    maxOrderAmount: number;
    minOrderAmount: number;
    maxProductPrice: number;
    maxImagesPerProduct: number;
  };
  
  // Comisiones (para futuro)
  fees: {
    p2pFeePercent: number;          // Ej: 0.5%
    withdrawalFeePercent: number;
  };
  
  // Mantenimiento
  maintenance: {
    enabled: boolean;
    message?: string;
  };
  
  // Versión mínima de la app
  minAppVersion: string;
}

// Documento: app_config/payment_methods
interface PaymentMethodsConfig {
  transfermovil: {
    enabled: boolean;
    instructions: string;
  };
  enzona: {
    enabled: boolean;
    instructions: string;
  };
  efectivo: {
    enabled: boolean;
    instructions: string;
  };
}
```

---

## 🔄 Diagrama de Relaciones

```
┌─────────────┐       ┌──────────────┐
│   users     │       │  p2p_orders  │
│  (profiles) │◄──────│   (offers)   │
└─────────────┘       └──────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐       ┌──────────────┐
│  products   │       │  p2p_trades  │
│(marketplace)│       │(transactions)│
└─────────────┘       └──────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐       ┌──────────────┐
│  favorites  │       │   messages   │
│             │       │ (subcollec.) │
└─────────────┘       └──────────────┘
       
        ┌──────────────┐
        │notifications │
        │   (alerts)   │
        └──────────────┘
```

---

## ⚡ Cloud Functions Recomendadas (Opcional)

```typescript
// functions/src/index.ts

// 1. Aprobar/Rechazar KYC (llamada por admin)
exports.approveKYC = functions.https.onCall(async (data, context) => {
  // Verificar que es admin
  // Actualizar user.kycStatus
  // Crear notificación
});

// 2. Auto-cancelar trades expirados
exports.cancelExpiredTrades = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    // Query trades con expiresAt < now && status == 'pending'
    // Actualizar a 'cancelled'
    // Restaurar amount en la orden original
  });

// 3. Notificaciones push (si agregas FCM)
exports.onTradeStatusChange = functions.firestore
  .document('p2p_trades/{tradeId}')
  .onUpdate(async (change, context) => {
    // Enviar notificación al otro participante
  });

// 4. Incrementar contadores (denormalización)
exports.onTradeCompleted = functions.firestore
  .document('p2p_trades/{tradeId}')
  .onUpdate(async (change, context) => {
    if (change.after.data().status === 'completed') {
      // Incrementar stats en ambos users
      // Incrementar completedTrades en la orden
    }
  });

// 5. Actualizar precios sugeridos (desde API externa)
exports.updatePrices = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    // Fetch precio de Binance P2P u otra fuente
    // Actualizar app_config/general.suggestedPrices
  });
```

---

## 🚀 Comandos de Deploy

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init firestore
firebase init functions  # Opcional

# Deploy reglas e índices
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Deploy funciones (si las usas)
firebase deploy --only functions
```

---

## 📝 Notas Importantes

1. **NO se necesita Firebase Storage** — Todas las imágenes van a Cloudinary
2. **Encriptar datos sensibles** — `kycIdNumber`, `paymentDetails` deberían encriptarse
3. **Rate limiting** — Considera usar App Check o funciones para prevenir spam
4. **Backup** — Configura exports automáticos de Firestore
5. **Índices** — Despliega los índices ANTES de hacer queries compuestas
