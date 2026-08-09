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

// ✅ ACTUALIZADO: Agregado MATIC para Polygon
export type CryptoAsset =
  | "BTC"
  | "ETH"
  | "USDT"
  | "USDC"
  | "MATIC";

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

// ✅ ACTUALIZADO: Eliminado "stellar", agregado "wallet-history"
export type AppView =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "p2p"
  | "trade"
  | "wallet"
  | "wallet-history"
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
  | "admin-disputes"
  | "membership"
  | "public-profile"
  | "sales-management";

export type MembershipStatus =
  | "free_trial"
  | "active"
  | "expired"
  | "grace"
  | "manual";

export type MembershipPaymentMethod =
  | "wallet_usdt"
  | "transfermovil"
  | "enzona"
  | "manual_admin";

export type DeliveryMethod = "pickup" | "delivery";

export type ProductPaymentTiming = "before" | "on_delivery" | "flexible";

export type MarketplaceOrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

// ─── Entidades ────────────────────────────────────────────

export interface User {
  uid:           string;
  email:         string;
  displayName:   string;
  photoURL:      string | null;
  kycStatus:     KYCStatus;
  createdAt:     number;
  totalTrades:   number;
  rating:        number;

  // ✅ ACTUALIZADO: Solo dirección pública
  // La private key y mnemonic NUNCA van aquí
  // Se guardan cifradas en localStorage del dispositivo
  walletAddress:    string | null;
  walletCreatedAt?: number;

  role?:         "user" | "admin";
  fcmToken?:     string;

  // ✅ ELIMINADO: balances y depositAddresses custodios
  // balances?:         Record<string, number>;
  // depositAddresses?: Record<string, string>;

  membership?: {
    status:       MembershipStatus;
    startedAt:    number;
    expiresAt:    number;
    plan:         "monthly";
    lastPayment?: number;
  };
}

// ✅ ACTUALIZADO: CryptoBalance ahora refleja
// tokens reales de Polygon
export interface CryptoBalance {
  asset:    CryptoAsset;
  amount:   number;
  usdValue: number;
  // Información adicional de blockchain
  contract?: string | null;
  decimals?: number;
  network?:  "polygon";
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

  // ✅ ACTUALIZADO: Hashes apuntan a Polygon
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

  // ✅ NUEVO: Red de la transacción
  network?:        "polygon";
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
  status:          "active" | "paused" | "cancelled";
  createdAt:       number;
  totalSold?:      number;

  delivery: {
    pickup:        boolean;
    homeDelivery:  boolean;
    deliveryFee?:  number;
    deliveryInfo?: string;
  };

  paymentTiming: ProductPaymentTiming;
}

export interface MarketplaceOrder {
  id:             string;
  productId:      string;
  productTitle:   string;
  productImage:   string | null;
  priceUSDT:      number;
  buyerId:        string;
  buyerName:      string;
  sellerId:       string;
  sellerName:     string;
  status:         MarketplaceOrderStatus;
  chatRoomId:     string;

  deliveryMethod:   DeliveryMethod;
  deliveryAddress?: string;
  deliveryFee?:     number;

  paymentTiming: ProductPaymentTiming;
  paidAt?:       number;
  paidAmount?:   number;

  shippedAt?:    number;
  deliveredAt?:  number;
  completedAt?:  number;
  cancelledAt?:  number;
  cancelledBy?:  string;

  createdAt:     number;
  updatedAt:     number;
}

export interface Notification {
  id:        string;
  userId:    string;
  title:     string;
  body:      string;
  type:
    | "trade"
    | "kyc"
    | "system"
    | "product"
    | "new_trade"
    | "payment_sent"
    | "trade_completed"
    | "membership"
    | "marketplace_order"
    | "wallet";           // ✅ NUEVO: notificaciones de wallet
  read:      boolean;
  createdAt: number;
  data?:     Record<string, string>;
  link?:     string;
}

export interface AppConfig {
  membership: {
    priceCUP:       number;
    priceUSDT:      number;
    freeTrialDays:  number;
    graceDays:      number;
    warnDaysBefore: number;
  };
}

export interface MembershipPayment {
  id:          string;
  userId:      string;
  userName:    string;
  amount:      number;
  currency:    "CUP" | "USDT";
  method:      MembershipPaymentMethod;
  status:      "pending" | "completed" | "rejected";
  reference?:  string;
  screenshot?: string;
  period:      string;
  createdAt:   number;
  reviewedAt?: number;
  reviewedBy?: string;
}

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
  status:
    | "open"
    | "reviewing"
    | "resolved_buyer"
    | "resolved_seller"
    | "cancelled";
  resolution?: string;
  createdAt:   number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface ProductChat {
  id:             string;
  productId:      string;
  productTitle:   string;
  buyerId:        string;
  buyerName:      string;
  sellerId:       string;
  sellerName:     string;
  lastMessage?:   string;
  lastMessageAt?: number;
  createdAt:      number;
}

// ✅ NUEVO: Tipos para wallet no custodia
export interface WalletTransaction {
  hash:        string;
  from:        string;
  to:          string;
  value:       string;
  asset:       string;
  timestamp:   number;
  status:      "confirmed" | "pending" | "failed";
  network:     "polygon";
  explorerUrl: string;
}

// ✅ NUEVO: Tipo para el estado de la wallet en el store
export interface WalletInfo {
  address:      string;
  balances:     CryptoBalance[];
  totalUSD:     number;
  lastUpdated:  number;
  network:      "polygon";
}
