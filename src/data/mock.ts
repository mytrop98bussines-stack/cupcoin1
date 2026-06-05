import { auth, db } from "@/lib/firebase.ts"; // Asegúrate de que esta ruta apunte a tu config del Paso 2
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import type {
  User,
  CryptoBalance,
  CryptoPrice,
  P2POrder,
  Trade,
  ChatMessage,
  Product,
  Notification,
} from "@/types";

// ==========================================
// CONEXIÓN REACTIVA CON FIREBASE (AUTH & FIRESTORE)
// ==========================================

// Inicializamos el objeto vacío que mantendrá la misma referencia en toda la app
export const MOCK_USER: User = {} as User;

// Escuchamos los cambios de sesión en tiempo real
onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    
    // Escuchamos el documento del usuario en Firestore
    onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        // Si ya tiene datos en la base de datos, los inyectamos en MOCK_USER
        Object.assign(MOCK_USER, docSnap.data());
      } else {
        // Plantilla base obligatoria para que tus componentes no den undefined
        Object.assign(MOCK_USER, {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Usuario",
          photoURL: firebaseUser.photoURL || null,
          kycStatus: "unverified",
          createdAt: Date.now(),
          totalTrades: 0,
          rating: 5.0,
          walletAddress: null,
        });
      }
    });
  } else {
    // Si no hay sesión activa o se desloguea, limpiamos las propiedades del objeto
    Object.keys(MOCK_USER).forEach((key) => delete (MOCK_USER as any)[key]);
  }
});

// ==========================================
// RESTO DE MOCK DATA INTACTO
// ==========================================

export const MOCK_BALANCES: CryptoBalance[] = [
  { asset: "BTC", amount: 0.00234, usdValue: 248.76 },
  { asset: "ETH", amount: 0.145, usdValue: 543.21 },
  { asset: "USDT", amount: 1250.0, usdValue: 1250.0 },
  { asset: "USDC", amount: 320.5, usdValue: 320.5 },
];

export const MOCK_PRICES: CryptoPrice[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    current_price: 106250,
    price_change_percentage_24h: 2.34,
    image: "",
    market_cap: 2090000000000,
    total_volume: 45000000000,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    current_price: 3745,
    price_change_percentage_24h: -0.87,
    image: "",
    market_cap: 450000000000,
    total_volume: 18000000000,
  },
  {
    id: "tether",
    symbol: "usdt",
    name: "Tether",
    current_price: 1.0,
    price_change_percentage_24h: 0.01,
    image: "",
    market_cap: 120000000000,
    total_volume: 65000000000,
  },
  {
    id: "usd-coin",
    symbol: "usdc",
    name: "USD Coin",
    current_price: 1.0,
    price_change_percentage_24h: -0.02,
    image: "",
    market_cap: 44000000000,
    total_volume: 8000000000,
  },
];

export const MOCK_ORDERS: P2POrder[] = [
  {
    id: "ord_001",
    userId: "user_002",
    userName: "María L.",
    userRating: 4.9,
    userTrades: 132,
    type: "sell",
    asset: "USDT",
    pricePerUnit: 395,
    currency: "CUP",
    minAmount: 10,
    maxAmount: 500,
    paymentMethods: ["transfermovil", "enzona"],
    status: "active",
    createdAt: Date.now() - 3600000,
    availableAmount: 480,
  },
  {
    id: "ord_002",
    userId: "user_003",
    userName: "Jorge R.",
    userRating: 4.7,
    userTrades: 89,
    type: "buy",
    asset: "USDT",
    pricePerUnit: 385,
    currency: "CUP",
    minAmount: 20,
    maxAmount: 1000,
    paymentMethods: ["transfermovil"],
    status: "active",
    createdAt: Date.now() - 7200000,
    availableAmount: 1000,
  },
  {
    id: "ord_003",
    userId: "user_004",
    userName: "Ana P.",
    userRating: 5.0,
    userTrades: 215,
    type: "sell",
    asset: "BTC",
    pricePerUnit: 42500000,
    currency: "CUP",
    minAmount: 0.0001,
    maxAmount: 0.01,
    paymentMethods: ["efectivo", "transfermovil"],
    status: "active",
    createdAt: Date.now() - 1800000,
    availableAmount: 0.008,
  },
  {
    id: "ord_004",
    userId: "user_005",
    userName: "Pedro G.",
    userRating: 4.6,
    userTrades: 56,
    type: "sell",
    asset: "ETH",
    pricePerUnit: 1500000,
    currency: "CUP",
    minAmount: 0.01,
    maxAmount: 0.5,
    paymentMethods: ["enzona"],
    status: "active",
    createdAt: Date.now() - 5400000,
    availableAmount: 0.45,
  },
  {
    id: "ord_005",
    userId: "user_006",
    userName: "Laura M.",
    userRating: 4.8,
    userTrades: 178,
    type: "buy",
    asset: "USDT",
    pricePerUnit: 390,
    currency: "CUP",
    minAmount: 50,
    maxAmount: 2000,
    paymentMethods: ["transfermovil", "enzona", "efectivo"],
    status: "active",
    createdAt: Date.now() - 900000,
    availableAmount: 2000,
  },
  {
    id: "ord_006",
    userId: "user_007",
    userName: "Roberto S.",
    userRating: 4.5,
    userTrades: 34,
    type: "sell",
    asset: "USDC",
    pricePerUnit: 393,
    currency: "CUP",
    minAmount: 5,
    maxAmount: 300,
    paymentMethods: ["transfermovil"],
    status: "active",
    createdAt: Date.now() - 10800000,
    availableAmount: 275,
  },
];

export const MOCK_TRADE: Trade = {
  id: "trade_001",
  orderId: "ord_001",
  buyerId: "user_001",
  buyerName: "Carlos M.",
  sellerId: "user_002",
  sellerName: "María L.",
  asset: "USDT",
  amount: 100,
  pricePerUnit: 395,
  totalFiat: 39500,
  currency: "CUP",
  paymentMethod: "transfermovil",
  status: "escrow_funded",
  escrowTxHash: "0x7a8b9c...3d4e5f",
  releaseTxHash: null,
  createdAt: Date.now() - 600000,
  updatedAt: Date.now() - 300000,
  paymentDetails: {
    method: "transfermovil",
    phone: "+53 5X XX XX XX",
    accountName: "María L. García",
    instructions: "Enviar a este número por Transfermóvil. Confirmar en el chat.",
  },
};

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg_001",
    tradeId: "trade_001",
    senderId: "system",
    senderName: "Sistema",
    message: "Trade iniciado. 100 USDT depositados en escrow.",
    timestamp: Date.now() - 600000,
    type: "system",
  },
  {
    id: "msg_002",
    tradeId: "trade_001",
    senderId: "user_002",
    senderName: "María L.",
    message: "Hola Carlos, ya los fondos están en escrow. Puedes hacer la transferencia al número indicado.",
    timestamp: Date.now() - 540000,
    type: "text",
  },
  {
    id: "msg_003",
    tradeId: "trade_001",
    senderId: "user_001",
    senderName: "Carlos M.",
    message: "Perfecto María, voy a transferir ahora mismo por Transfermóvil.",
    timestamp: Date.now() - 480000,
    type: "text",
  },
  {
    id: "msg_004",
    tradeId: "trade_001",
    senderId: "user_001",
    senderName: "Carlos M.",
    message: "Listo, transferencia enviada. Ref: TM-2024-XXXXX",
    timestamp: Date.now() - 300000,
    type: "text",
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_001",
    sellerId: "user_004",
    sellerName: "Ana P.",
    title: "iPhone 14 Pro Max 256GB",
    description:
      "iPhone 14 Pro Max en excelente estado, 256GB, color Deep Purple. Incluye cargador y forro. Batería al 94%.",
    priceUSD: 850,
    acceptedCryptos: ["USDT", "USDC", "BTC"],
    images: [],
    category: "phones",
    condition: "used",
    location: "La Habana",
    status: "active",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "prod_002",
    sellerId: "user_005",
    sellerName: "Pedro G.",
    title: "MacBook Air M2 2023",
    description:
      "MacBook Air M2, 8GB RAM, 512GB SSD. Perfecto estado, poco uso. Con caja original y cargador.",
    priceUSD: 1100,
    acceptedCryptos: ["USDT", "BTC", "ETH"],
    images: [],
    category: "computers",
    condition: "used",
    location: "Santiago de Cuba",
    status: "active",
    createdAt: Date.now() - 172800000,
  },
  {
    id: "prod_003",
    sellerId: "user_006",
    sellerName: "Laura M.",
    title: "Samsung Galaxy S24 Ultra",
    description:
      "Galaxy S24 Ultra nuevo de paquete, 512GB, color Titanium Black. Garantía de 1 año.",
    priceUSD: 950,
    acceptedCryptos: ["USDT", "USDC"],
    images: [],
    category: "phones",
    condition: "new",
    location: "La Habana",
    status: "active",
    createdAt: Date.now() - 259200000,
  },
  {
    id: "prod_004",
    sellerId: "user_003",
    sellerName: "Jorge R.",
    title: "Servicio de Diseño Web",
    description:
      "Desarrollo de sitios web profesionales. Landing pages, tiendas online, portafolios. Entrega en 7-15 días.",
    priceUSD: 200,
    acceptedCryptos: ["USDT", "USDC", "BTC", "ETH"],
    images: [],
    category: "services",
    condition: "new",
    location: "Remoto",
    status: "active",
    createdAt: Date.now() - 345600000,
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif_001",
    userId: "user_001",
    title: "Trade en progreso",
    message: "María L. ha recibido tu pago. Esperando confirmación.",
    type: "trade",
    read: false,
    createdAt: Date.now() - 120000,
    link: "trade",
  },
  {
    id: "notif_002",
    userId: "user_001",
    title: "Verificación KYC",
    message: "Completa tu verificación de identidad para operar sin límites.",
    type: "kyc",
    read: false,
    createdAt: Date.now() - 86400000,
    link: "kyc",
  },
  {
    id: "notif_003",
    userId: "user_001",
    title: "Precios actualizados",
    message: "BTC subió +2.34% en las últimas 24h. Precio actual: $106,250",
    type: "system",
    read: true,
    createdAt: Date.now() - 3600000,
  },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transfermovil: "Transfermóvil",
  enzona: "EnZona",
  efectivo: "Efectivo",
};

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  transfermovil: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  enzona: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  efectivo: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export const CRYPTO_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  USDT: "₮",
  USDC: "$",
};

export const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electrónica",
  phones: "Teléfonos",
  computers: "Computadoras",
  clothing: "Ropa",
  home: "Hogar",
  vehicles: "Vehículos",
  services: "Servicios",
  other: "Otros",
};

export const CONDITION_LABELS: Record<string, string> = {
  new: "Nuevo",
  used: "Usado",
  refurbished: "Reacondicionado",
};
  
