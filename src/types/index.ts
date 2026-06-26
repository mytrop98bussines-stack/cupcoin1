// ─── Tipos base ───────────────────────────────────────────

export type KYCStatus =
  | "unverified"
  | "pending_verification"
  | "verified"
  | "rejected";

export type PaymentMethod = "transfermovil" | "enzona" | "efectivo";

export type OrderType = "buy" | "sell";

export type OrderStatus =
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type TradeStatus =
  | "awaiting_escrow"
  | "escrow_funded"
  | "payment_sent"
  | "payment_confirmed"
  | "crypto_released"
  | "disputed"
  | "cancelled";

export type CryptoAsset = "BTC" | "ETH" | "USDT" | "USDC";

export type ProductCategory =
  | "electronics"
  | "phones"
  | "computers"
  | "clothing"
  | "home"
  | "vehicles"
  | "services"
  | "other";

export type ThemeMode = "light" | "dark";

export type AppView =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "p2p"
  | "trade"
  | "wallet"
  | "marketplace"
  | "product-detail"
  | "create-product"
  | "create-order"
  | "notifications"
  | "settings"
  | "profile"
  | "security"
  | "help"
  | "terms"
  | "language"
  | "notification-settings"
  | "trade-history"
  | "my-orders"
  | "kyc"
  | "admin-kyc";

// ─── Entidades ────────────────────────────────────────────

export interface User {
  uid:             string;
  email:           string;
  displayName:     string;
  photoURL:        string | null;
  kycStatus:       KYCStatus;
  createdAt:       number;
  totalTrades:     number;
  rating:          number;
  walletAddress:   string | null;
  role?:           "user" | "admin";      // ✅ añadido para admin
  fcmToken?:       string;                // ✅ añadido para notificaciones push
  depositAddresses?: Record<string, string>;
}

export interface CryptoBalance {
  asset:    CryptoAsset;
  amount:   number;
  usdValue: number;
}

// ✅ Unificado: usa priceUSD y change24h en toda la app
export interface CryptoPrice {
  id:        string;
  symbol:    string;
  name:      string;
  priceUSD:  number;
  change24h: number;
}

export interface P2POrder {
  id:              string;
  userId:          string;
  userName:        string;
  userRating:      number;
  userTrades:      number;
  type:            OrderType;
  asset:           CryptoAsset;
  pricePerUnit:    number;
  currency:        string;
  minAmount:       number;
  maxAmount:       number;
  availableAmount: number;
  paymentMethods:  PaymentMethod[];
  status:          OrderStatus;
  createdAt:       number;
}

export interface PaymentDetails {
  method:        PaymentMethod;
  phone?:        string;
  accountName?:  string;
  bankCard?:     string;
  instructions?: string;
}

export interface Trade {
  id:             string;
  orderId:        string;
  buyerId:        string;
  buyerName:      string;
  sellerId:       string;
  sellerName:     string;
  asset:          CryptoAsset;
  amount:         number;
  pricePerUnit:   number;
  totalFiat:      number;
  currency:       string;
  paymentMethod:  PaymentMethod;
  status:         TradeStatus;
  escrowTxHash:   string | null;
  releaseTxHash:  string | null;
  escrowAmount?:  number;
  escrowAsset?:   CryptoAsset;
  escrowFundedAt?: number;
  paymentSentAt?: number;
  releasedAt?:    number;
  disputedBy?:    string;
  disputedAt?:    number;
  cancelledBy?:   string;
  cancelledAt?:   number;
  createdAt:      number;
  updatedAt:      number;
  paymentDetails: PaymentDetails | null;
}

// ✅ Unificado: usa text y createdAt en toda la app
export interface ChatMessage {
  id:         string;
  tradeId?:   string;
  senderId:   string;
  senderName: string;
  text:       string;       // ✅ antes era "message"
  createdAt:  number;       // ✅ antes era "timestamp"
  type:       "text" | "system" | "image";
}

export interface Product {
  id:              string;
  sellerId:        string;
  sellerName:      string;
  title:           string;
  description:     string;
  priceUSD:        number;
  acceptedCryptos: CryptoAsset[];
  images:          string[];
  category:        ProductCategory;
  condition:       "new" | "used" | "refurbished";
  location:        string;
  status:          "active" | "sold" | "paused" | "cancelled"; // ✅ añadido cancelled
  createdAt:       number;
}

// ✅ Unificado: usa body en vez de message para no confundir con ChatMessage
export interface Notification {
  id:        string;
  userId:    string;
  title:     string;
  body:      string;        // ✅ antes era "message"
  type:      "trade" | "kyc" | "system" | "product" | "new_trade" | "payment_sent" | "trade_completed";
  read:      boolean;
  createdAt: number;
  data?:     Record<string, string>;
  link?:     string;
  }
