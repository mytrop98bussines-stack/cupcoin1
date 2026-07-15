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
// REFERENCIA ESTÁTICA SEGURA PARA COMPATIBILIDAD
// ==========================================

// Estructura base limpia. Ya no se mutará dinámicamente con Object.assign.
// Sirve exclusivamente como fallback inicial seguro en Zustand.
export const MOCK_USER: User = {
  uid: "loading",
  email: "cargando@cubax.com",
  displayName: "Usuario CubaX",
  photoURL: null,
  kycStatus: "unverified",
  createdAt: Date.now(),
  totalTrades: 0,
  rating: 5.0,
  walletAddress: null,
  role: "user"
};

// ==========================================
// MOCK DATA INTACTO Y LISTO (Solo Lectura para Estado Inicial)
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
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_001",
    sellerId: "user_004",
    sellerName: "Ana P.",
    title: "iPhone 14 Pro Max 256GB",
    description: "iPhone 14 Pro Max, color Deep Purple. Batería al 94%.",
    priceUSD: 850,
    acceptedCryptos: ["USDT", "USDC", "BTC"],
    images: [],
    category: "phones",
    condition: "used",
    location: "La Habana",
    status: "active",
    createdAt: Date.now() - 86400000,
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
];

// ==========================================
// DICCIONARIOS Y MAPEOS ESTRUCTURALES
// ==========================================

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
  services: "Servicios",
  other: "Otros",
};

export const CONDITION_LABELS: Record<string, string> = {
  new: "Nuevo",
  used: "Usado",
  refurbished: "Reacondicionado",
};
    
