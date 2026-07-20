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
  | "stellar"
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
  | "membership";

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

// ✅ Tipos de entrega
export type DeliveryMethod = "pickup" | "delivery";

// ✅ Tipos de pago del producto
export type ProductPaymentTiming = "before" | "on_delivery" | "flexible";

// ✅ Estado de orden de marketplace
export type MarketplaceOrderStatus =
  | "pending"        // orden creada, esperando coordinación
  | "paid"           // comprador pagó
  | "shipped"        // vendedor envió
  | "delivered"      // producto entregado
  | "completed"      // ambos confirman
  | "cancelled"      // cancelada
  | "disputed";      // en disputa

// ─── Entidades ────────────────────────────────────────────

export interface User {
  uid:               string;
  email:             string;
  displayName:       string;
  photoURL:          string | null;
  kycStatus:         KYCStatus;
  createdAt:         number;
  totalTrades:       number;
  rating:            number;
  walletAddress:     string | null;
  role?:             "user" | "admin";
  fcmToken?:         string;
  balances?:         Record<string, number>;
  depositAddresses?: Record<string, string>;
  membership?: {
    status:       MembershipStatus;
    startedAt:    number;
    expiresAt:    number;
    plan:         "monthly";
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

// ✅ Producto actualizado — no desaparece al venderse
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
  status:          "active" | "paused" | "cancelled";  // ✅ eliminado "sold"
  createdAt:       number;
  totalSold?:      number;                              // ✅ contador de ventas

  // ✅ Opciones de entrega
  delivery: {
    pickup:        boolean;     // recogida en persona
    homeDelivery:  boolean;     // envío a domicilio
    deliveryFee?:  number;      // costo de envío en USD
    deliveryInfo?: string;      // zona de cobertura, tiempo estimado, etc
  };

  // ✅ Opciones de pago
  paymentTiming: ProductPaymentTiming;  // antes, al recibir, o flexible
}

// ✅ Orden de compra en el marketplace
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
  chatRoomId:     string;     // ✅ ID del chat para navegar directo

  // ✅ Entrega
  deliveryMethod:  DeliveryMethod;
  deliveryAddress?: string;
  deliveryFee?:    number;

  // ✅ Pago
  paymentTiming:   ProductPaymentTiming;
  paidAt?:         number;
  paidAmount?:     number;

  // ✅ Seguimiento
  shippedAt?:      number;
  deliveredAt?:    number;
  completedAt?:    number;
  cancelledAt?:    number;
  cancelledBy?:    string;

  createdAt:       number;
  updatedAt:       number;
}

export interface Notification {
  id:        string;
  userId:    string;
  title:     string;
  body:      string;
  type:      "trade" | "kyc" | "system" | "product" | "new_trade" | "payment_sent" | "trade_completed" | "membership" | "marketplace_order";
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
  status:      "open" | "reviewing" | "resolved_buyer" | "resolved_seller" | "cancelled";
  resolution?: string;
  createdAt:   number;
  resolvedAt?: number;
  resolvedBy?: string;
}

// ✅ Chat de producto
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
