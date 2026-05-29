# 🇨🇺 CubaX — Plataforma P2P & Crypto para Cuba

> Plataforma integral de finanzas, P2P y comercio cripto diseñada para el mercado cubano. Mobile-First, optimizada para redes 3G/4G.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-MVP%20Demo-orange)

---

## 📋 Tabla de Contenidos

- [Estado Actual del Proyecto](#-estado-actual-del-proyecto)
- [Arquitectura](#-arquitectura)
- [Lo que Falta para Producción](#-lo-que-falta-para-producción)
- [Configuración de Servicios](#-configuración-de-servicios)
- [Despliegue](#-despliegue)
- [Variables de Entorno](#-variables-de-entorno)
- [Estructura del Proyecto](#-estructura-del-proyecto)

---

## ✅ Estado Actual del Proyecto

### Implementado (Frontend Demo)

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| 🎨 UI/UX Mobile-First | ✅ Completo | Diseño premium con Tailwind CSS, modo oscuro/claro |
| 🔐 Auth UI | ✅ Completo | Pantallas de login/registro con Google y email |
| 📊 Dashboard | ✅ Completo | Panel con balances, precios, accesos rápidos |
| 💱 Mercado P2P | ✅ Completo | OrderBook, filtros, creación de órdenes |
| 💬 Trade Screen | ✅ Completo | Chat en tiempo real, estados de escrow, acciones |
| 🛡️ KYC Flow | ✅ Completo | Formulario multi-paso con upload de documentos |
| 🛒 Marketplace | ✅ Completo | Catálogo de productos, detalle, publicación |
| 👛 Wallet | ✅ Completo | Conexión Web3 simulada, balances |
| ⚙️ Settings | ✅ Completo | Perfil, preferencias, logout |
| 🔔 Notificaciones | ✅ Completo | Centro de notificaciones |

### Datos Mock Incluidos
- Precios de CoinGecko simulados (BTC, ETH, USDT, USDC)
- Órdenes P2P de ejemplo
- Productos del marketplace
- Mensajes de chat
- Notificaciones de sistema

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │    State (Zustand)      │  │
│  │  - Landing  │  │  - UI Kit   │  │  - User Session         │  │
│  │  - Auth     │  │  - Layout   │  │  - Balances/Prices      │  │
│  │  - Dashboard│  │  - Forms    │  │  - Orders/Trades        │  │
│  │  - P2P      │  │             │  │  - Notifications        │  │
│  │  - Trade    │  │             │  │                         │  │
│  │  - KYC      │  │             │  │                         │  │
│  │  - Market   │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Por Implementar)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Firebase   │  │  Cloudinary │  │      Blockchain         │  │
│  │  - Auth     │  │  - Images   │  │  - Smart Contracts      │  │
│  │  - Firestore│  │  - KYC Docs │  │  - Escrow System        │  │
│  │  - Functions│  │  - Signed   │  │  - WalletConnect        │  │
│  │  - Hosting  │  │    Uploads  │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚧 Lo que Falta para Producción

### 1. 🔥 Firebase (Autenticación + Base de Datos)

#### Archivos a Crear:

```typescript
// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

```typescript
// src/lib/firebase/auth.ts
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await createUserProfileIfNew(result.user);
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfileIfNew(result.user, displayName);
  return result.user;
}

export async function createUserProfileIfNew(user: User, displayName?: string) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || 'Usuario',
      photoURL: user.photoURL,
      kycStatus: 'unverified',
      createdAt: serverTimestamp(),
      totalTrades: 0,
      rating: 5.0,
      walletAddress: null,
    });
  }
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
```

#### Colecciones de Firestore:

```
users/
  {uid}/
    - email: string
    - displayName: string
    - photoURL: string | null
    - kycStatus: 'unverified' | 'pending_verification' | 'verified' | 'rejected'
    - kycDocuments: { idFront: string, selfie: string } | null
    - createdAt: timestamp
    - totalTrades: number
    - rating: number
    - walletAddress: string | null

orders/
  {orderId}/
    - userId: string
    - type: 'buy' | 'sell'
    - asset: 'BTC' | 'ETH' | 'USDT' | 'USDC'
    - pricePerUnit: number
    - currency: 'CUP'
    - minAmount: number
    - maxAmount: number
    - availableAmount: number
    - paymentMethods: string[]
    - status: 'active' | 'in_progress' | 'completed' | 'cancelled'
    - createdAt: timestamp

trades/
  {tradeId}/
    - orderId: string
    - buyerId: string
    - sellerId: string
    - asset: string
    - amount: number
    - pricePerUnit: number
    - totalFiat: number
    - paymentMethod: string
    - status: 'awaiting_escrow' | 'escrow_funded' | 'payment_sent' | ...
    - escrowTxHash: string | null
    - releaseTxHash: string | null
    - createdAt: timestamp
    - updatedAt: timestamp
    - paymentDetails: object

trades/{tradeId}/messages/
  {messageId}/
    - senderId: string
    - senderName: string
    - message: string
    - timestamp: timestamp
    - type: 'text' | 'system' | 'image'

products/
  {productId}/
    - sellerId: string
    - title: string
    - description: string
    - priceUSD: number
    - acceptedCryptos: string[]
    - images: string[]
    - category: string
    - condition: string
    - location: string
    - status: 'active' | 'sold' | 'paused'
    - createdAt: timestamp

notifications/
  {notificationId}/
    - userId: string
    - title: string
    - message: string
    - type: 'trade' | 'kyc' | 'system' | 'product'
    - read: boolean
    - createdAt: timestamp
    - link: string | null
```

#### Reglas de Seguridad (firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios: solo pueden leer/escribir su propio documento
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Órdenes: lectura pública, escritura solo propietario
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Trades: solo participantes
    match /trades/{tradeId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.buyerId || 
         request.auth.uid == resource.data.sellerId);
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (request.auth.uid == resource.data.buyerId || 
         request.auth.uid == resource.data.sellerId);
    }
    
    // Mensajes de trade
    match /trades/{tradeId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Productos: lectura pública
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Notificaciones: solo propietario
    match /notifications/{notificationId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

### 2. ☁️ Cloudinary (Imágenes con Firma Segura)

#### Backend Function para Firma (Firebase Functions):

```typescript
// functions/src/cloudinary.ts
import * as functions from 'firebase-functions';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getCloudinarySignature = functions.https.onCall(
  async (data, context) => {
    // Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuario no autenticado'
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = data.folder || 'cubax';
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        upload_preset: 'cubax_signed',
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    };
  }
);
```

#### Cliente para Upload Firmado:

```typescript
// src/lib/cloudinary/upload.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

interface SignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export async function uploadToCloudinary(
  file: File,
  folder: 'kyc' | 'products' | 'chat'
): Promise<string> {
  // 1. Obtener firma del servidor
  const getSignature = httpsCallable<{ folder: string }, SignatureResponse>(
    functions,
    'getCloudinarySignature'
  );
  
  const { data } = await getSignature({ folder: `cubax/${folder}` });
  
  // 2. Subir imagen con firma
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', data.signature);
  formData.append('timestamp', data.timestamp.toString());
  formData.append('api_key', data.apiKey);
  formData.append('folder', data.folder);
  formData.append('upload_preset', 'cubax_signed');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const result = await response.json();
  return result.secure_url;
}
```

---

### 3. 🔗 Web3 / WalletConnect (Escrow)

#### Configuración de Wagmi + AppKit:

```typescript
// src/config/wagmi.ts
import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { walletConnect, injected } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const config = createConfig({
  chains: [polygon, polygonAmoy],
  connectors: [
    walletConnect({ projectId }),
    injected(),
  ],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
});
```

```typescript
// src/context/Web3Provider.tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../config/wagmi';

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

#### Smart Contract de Escrow (Solidity):

```solidity
// contracts/CubaXEscrow.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CubaXEscrow is ReentrancyGuard {
    struct Trade {
        address seller;
        address buyer;
        address token;
        uint256 amount;
        uint256 createdAt;
        TradeStatus status;
    }
    
    enum TradeStatus { 
        Created,
        Funded,
        PaymentConfirmed,
        Released,
        Disputed,
        Cancelled
    }
    
    mapping(bytes32 => Trade) public trades;
    address public arbiter;
    uint256 public feePercent = 50; // 0.5%
    
    event TradeCreated(bytes32 indexed tradeId, address seller, address buyer);
    event TradeFunded(bytes32 indexed tradeId);
    event TradeReleased(bytes32 indexed tradeId);
    event TradeDisputed(bytes32 indexed tradeId);
    
    constructor(address _arbiter) {
        arbiter = _arbiter;
    }
    
    function createTrade(
        bytes32 tradeId,
        address buyer,
        address token,
        uint256 amount
    ) external {
        require(trades[tradeId].seller == address(0), "Trade exists");
        
        trades[tradeId] = Trade({
            seller: msg.sender,
            buyer: buyer,
            token: token,
            amount: amount,
            createdAt: block.timestamp,
            status: TradeStatus.Created
        });
        
        emit TradeCreated(tradeId, msg.sender, buyer);
    }
    
    function fundTrade(bytes32 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(msg.sender == trade.seller, "Not seller");
        require(trade.status == TradeStatus.Created, "Invalid status");
        
        IERC20(trade.token).transferFrom(msg.sender, address(this), trade.amount);
        trade.status = TradeStatus.Funded;
        
        emit TradeFunded(tradeId);
    }
    
    function releaseFunds(bytes32 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(
            msg.sender == trade.seller || msg.sender == arbiter,
            "Not authorized"
        );
        require(trade.status == TradeStatus.Funded, "Not funded");
        
        uint256 fee = (trade.amount * feePercent) / 10000;
        uint256 buyerAmount = trade.amount - fee;
        
        IERC20(trade.token).transfer(trade.buyer, buyerAmount);
        IERC20(trade.token).transfer(arbiter, fee);
        
        trade.status = TradeStatus.Released;
        emit TradeReleased(tradeId);
    }
    
    function disputeTrade(bytes32 tradeId) external {
        Trade storage trade = trades[tradeId];
        require(
            msg.sender == trade.buyer || msg.sender == trade.seller,
            "Not participant"
        );
        require(trade.status == TradeStatus.Funded, "Not funded");
        
        trade.status = TradeStatus.Disputed;
        emit TradeDisputed(tradeId);
    }
    
    function resolveDispute(
        bytes32 tradeId,
        address winner
    ) external nonReentrant {
        require(msg.sender == arbiter, "Not arbiter");
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.Disputed, "Not disputed");
        
        IERC20(trade.token).transfer(winner, trade.amount);
        trade.status = TradeStatus.Released;
    }
}
```

---

### 4. 📊 CoinGecko API (Precios en Tiempo Real)

```typescript
// src/lib/coingecko/prices.ts
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
  total_volume: number;
}

export async function fetchCryptoPrices(): Promise<CoinGeckoPrice[]> {
  const ids = 'bitcoin,ethereum,tether,usd-coin';
  
  const response = await fetch(
    `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  
  return response.json();
}

// Hook para React Query
import { useQuery } from '@tanstack/react-query';

export function useCryptoPrices() {
  return useQuery({
    queryKey: ['crypto-prices'],
    queryFn: fetchCryptoPrices,
    refetchInterval: 30000, // Actualizar cada 30 segundos
    staleTime: 15000,
  });
}
```

---

### 5. 🔔 Notificaciones Push (Firebase Cloud Messaging)

```typescript
// src/lib/firebase/messaging.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import app, { db } from './config';

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
```

---

## 🔧 Configuración de Servicios

### Firebase Setup

1. **Crear proyecto en [Firebase Console](https://console.firebase.google.com/)**

2. **Habilitar servicios:**
   - Authentication → Email/Password + Google
   - Firestore Database
   - Functions (plan Blaze requerido)
   - Hosting

3. **Instalar Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

4. **Configurar Functions:**
   ```bash
   cd functions
   npm install
   npm run deploy
   ```

### Cloudinary Setup

1. **Crear cuenta en [Cloudinary](https://cloudinary.com/)**

2. **Configurar Upload Preset:**
   - Settings → Upload → Add upload preset
   - Nombre: `cubax_signed`
   - Signing Mode: `Signed`
   - Folder: `cubax`

3. **Obtener credenciales:**
   - Dashboard → API Keys

### WalletConnect Setup

1. **Crear proyecto en [WalletConnect Cloud](https://cloud.walletconnect.com/)**

2. **Obtener Project ID**

3. **Configurar dominios permitidos**

---

## 🚀 Despliegue

### Firebase Hosting

```bash
# Instalar dependencias
npm install

# Build de producción
npm run build

# Desplegar a Firebase
firebase deploy --only hosting
```

### Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Configuración de dominio personalizado

1. Firebase Console → Hosting → Add custom domain
2. Configurar DNS records
3. Esperar propagación SSL

---

## 🔐 Variables de Entorno

Crear archivo `.env.local`:

```env
# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cubax-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cubax-app
VITE_FIREBASE_STORAGE_BUCKET=cubax-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_VAPID_KEY=BLx...

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=cubax
VITE_CLOUDINARY_API_KEY=123456789

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=abc123...

# Blockchain
VITE_ESCROW_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=137  # Polygon Mainnet
```

Para Firebase Functions (`.env` en `/functions`):

```env
CLOUDINARY_CLOUD_NAME=cubax
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123secret
```

---

## 📁 Estructura del Proyecto

```
cubax/
├── public/
│   └── images/
│       └── hero-bg.jpg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── BottomNav.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       └── Avatar.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── AuthPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── P2PPage.tsx
│   │   ├── CreateOrderPage.tsx
│   │   ├── TradePage.tsx
│   │   ├── KYCPage.tsx
│   │   ├── MarketplacePage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── CreateProductPage.tsx
│   │   ├── WalletPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotificationsPage.tsx
│   ├── store/
│   │   └── useAppStore.ts
│   ├── data/
│   │   └── mock.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── cn.ts
│   ├── lib/                    # POR CREAR
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   └── messaging.ts
│   │   ├── cloudinary/
│   │   │   └── upload.ts
│   │   └── coingecko/
│   │       └── prices.ts
│   ├── config/                 # POR CREAR
│   │   └── wagmi.ts
│   ├── context/                # POR CREAR
│   │   └── Web3Provider.tsx
│   ├── hooks/                  # POR CREAR
│   │   ├── useAuth.ts
│   │   ├── useTrades.ts
│   │   └── useWeb3.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── functions/                  # POR CREAR
│   ├── src/
│   │   ├── index.ts
│   │   ├── cloudinary.ts
│   │   └── notifications.ts
│   ├── package.json
│   └── tsconfig.json
├── contracts/                  # POR CREAR
│   ├── CubaXEscrow.sol
│   └── hardhat.config.ts
├── firestore.rules
├── firebase.json
├── .env.local
├── package.json
├── vite.config.ts
└── README.md
```

---

## 📦 Paquetes NPM a Instalar para Producción

```bash
# Firebase
npm install firebase

# Web3
npm install wagmi viem @tanstack/react-query @web3modal/wagmi

# Utilidades
npm install react-hot-toast date-fns

# Development
npm install -D @types/node
```

---

## 🔒 Checklist de Seguridad para Producción

- [ ] Variables de entorno en servidor (no en código)
- [ ] Reglas de Firestore restrictivas
- [ ] Uploads de Cloudinary solo firmados
- [ ] Rate limiting en Functions
- [ ] Validación de inputs en cliente y servidor
- [ ] HTTPS obligatorio
- [ ] CSP headers configurados
- [ ] Auditoría del smart contract
- [ ] Monitoreo de errores (Sentry)
- [ ] Backups automáticos de Firestore

---

## 📞 Soporte

Para dudas sobre la implementación:
- Documentación Firebase: https://firebase.google.com/docs
- Documentación Cloudinary: https://cloudinary.com/documentation
- Documentación WalletConnect: https://docs.walletconnect.com
- Documentación Wagmi: https://wagmi.sh

---

## 📄 Licencia

MIT © 2025 CubaX
