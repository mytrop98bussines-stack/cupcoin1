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

// ✅ Añadidas nuevas vistas
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
  | "admin-kyc"
  | "membership"; // ✅ nueva

// ✅ Tipos de membresía
export type MembershipStatus =
  | "free_trial"  // primer mes gratis
  | "active"      // pagado y activo
  | "expired"     // vencido sin pagar
  | "grace"       // vencido con 3 días de gracia
  | "manual";     // dado por el admin

export type MembershipPaymentMethod =
  | "wallet_usdt"    // descuento del saldo
  | "transfermovil"  // pago móvil manual
  | "enzona"         // pago móvil manual
  | "manual_admin";  // dado gratis por admin

// ─── Entidades ────────────────────────────────────────────

export interface User {
  uid:              string;
  email:            string;
  displayName:      string;
  photoURL:         string | null;
  kycStatus:        KYCStatus;
  createdAt:        number;
  totalTrades:      number;
  rating:           number;
  walletAddress:    string | null;
  role?:            "user" | "admin";
  fcmToken?:        string;
  depositAddresses?: Record<string, string>;
  // ✅ Membresía embebida en el usuario
  membership?: {
    status:      MembershipStatus;
    startedAt:   number;
    expiresAt:   number;
    plan:        "monthly";
    lastPayment?: number;
  };
}

export interface CryptoBalance {
  asset:    CryptoAsset;
  amount:   number;
  usdValue: number;
}

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
  id:              string;
  orderId:         string;
  buyerId:         string;
  buyerName:       string;
  sellerId:        string;
  sellerName:      string;
  asset:           CryptoAsset;
  amount:          number;
  pricePerUnit:    number;
  totalFiat:       number;
  currency:        string;
  paymentMethod:   PaymentMethod;
  status:          TradeStatus;
  escrowTxHash:    string | null;
  releaseTxHash:   string | null;
  escrowAmount?:   number;
  escrowAsset?:    CryptoAsset;
  escrowFundedAt?: number;
  paymentSentAt?:  number;
  releasedAt?:     number;
  disputedBy?:     string;
  disputedAt?:     number;
  cancelledBy?:    string;
  cancelledAt?:    number;
  createdAt:       number;
  updatedAt:       number;
  paymentDetails:  PaymentDetails | null;
}

export interface ChatMessage {
  id:         string;
  tradeId?:   string;
  senderId:   string;
  senderName: string;
  text:       string;
  createdAt:  number;
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
  status:          "active" | "sold" | "paused" | "cancelled";
  createdAt:       number;
}

export interface Notification {
  id:        string;
  userId:    string;
  title:     string;
  body:      string;
  type:      "trade" | "kyc" | "system" | "product" | "new_trade" | "payment_sent" | "trade_completed" | "membership";
  read:      boolean;
  createdAt: number;
  data?:     Record<string, string>;
  link?:     string;
}

// ✅ Configuración global editable por el admin
export interface AppConfig {
  membership: {
    priceCUP:       number;  // precio en pesos cubanos
    priceUSDT:      number;  // precio en USDT
    freeTrialDays:  number;  // días de prueba gratis
    graceDays:      number;  // días de gracia al vencer
    warnDaysBefore: number;  // días antes de vencer para avisar
  };
  // Se puede ampliar con más configuraciones en el futuro
}

// ✅ Pago de membresía
export interface MembershipPayment {
  id:          string;
  userId:      string;
  userName:    string;
  amount:      number;
  currency:    "CUP" | "USDT";
  method:      MembershipPaymentMethod;
  status:      "pending" | "completed" | "rejected";
  reference?:  string;   // número de confirmación Transfermóvil/Enzona
  screenshot?: string;   // captura de pantalla del pago
  period:      string;   // "2026-06" mes que cubre
  createdAt:   number;
  reviewedAt?: number;
  reviewedBy?: string;
}

// ✅ Disputa de trade
export interface Dispute {
  id:          string;
  tradeId:     string;
  buyerId:     string;
  buyerName:   string;
  sellerId:    string;
  sellerName:  string;
  asset:       CryptoAsset;
  amount:      number;
  initiatedBy: string;
  reason?:     string;
  status:      "open" | "reviewing" | "resolved_buyer" | "resolved_seller" | "cancelled";
  resolution?: string;
  createdAt:   number;
  resolvedAt?: number;
  resolvedBy?: string;
}
