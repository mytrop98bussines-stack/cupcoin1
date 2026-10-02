// =========================================================
// 🪙 TIPOS BASE - MODELO 100% CUSTODIAL (USDT TRC-20)
// =========================================================

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

// ✅ Simplificado: Solo manejamos USDT en custodia
export type CryptoAsset = "USDT";

// ✅ Simplificado: Única red soportada en custodia
export type BlockchainNetwork = "tron";

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

// ✅ Mantenemos "wallet-history" para historial custodial
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
  | "admin-users"
  | "admin-disputes"
  | "admin-promos"
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

// =========================================================
// 🧑‍💼 ENTIDADES - USUARIO CUSTODIAL
// =========================================================

export interface User {
  uid:           string;
  email:         string;
  displayName:   string;
  photoURL:      string | null;
  kycStatus:     KYCStatus;
  createdAt:     number;
  totalTrades:   number;
  rating:        number;

  // ✅ Dirección custodial de Tron asignada por el backend
  custodialAddress?: string | null;

  role?:         "user" | "admin";
  fcmToken?:     string;
  emailVerified?: boolean;

  // ✅ Saldo centralizado en el backend (devuelto por /api/tron/balance)
  usdtBalance?: number;

  membership?: {
    status:       MembershipStatus;
    startedAt:    number;
    expiresAt:    number;
    plan:         "monthly";
    lastPayment?: number;
  };
}

// =========================================================
// 💰 BALANCE Y PRECIOS CUSTODIALES
// =========================================================

export interface CryptoBalance {
  asset:    CryptoAsset;    // Siempre USDT
  amount:   number;
  usdValue: number;
  network:  BlockchainNetwork; // Siempre "tron"
}

export interface CryptoPrice {
  id:        string;
  symbol:    string;
  name:      string;
  priceUSD:  number;
  change24h: number;
}

// =========================================================
// 💱 ÓRDENES P2P
// =========================================================

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

// =========================================================
// 🤝 TRADES CON ESCROW CUSTODIAL
// =========================================================

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

  // ✅ Hashes de transacciones en red TRON (TronGrid)
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

  // ✅ Red fija de la transacción custodial
  network?:        BlockchainNetwork;
}

// =========================================================
// 💬 CHAT Y MENSAJES
// =========================================================

export interface ChatMessage {
  id:         string;
  tradeId?:   string;
  senderId:   string;
  senderName: string;
  text:       string;
  createdAt:  number;
  type:       "text" | "system" | "image";
}

// =========================================================
// 🛍️ MARKETPLACE
// =========================================================

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

// =========================================================
// 🔔 NOTIFICACIONES
// =========================================================

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
    | "wallet"
    | "deposit"      // ✅ Notificación cuando llega un depósito TRC-20
    | "withdrawal";  // ✅ Notificación de retiro procesado
  read:      boolean;
  createdAt: number;
  data?:     Record<string, string>;
  link?:     string;
}

// =========================================================
// ⚙️ CONFIGURACIÓN GENERAL
// =========================================================

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

// =========================================================
// ⚠️ DISPUTAS
// =========================================================

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

// =========================================================
// 🏦 TIPOS DE WALLET CUSTODIAL (TRON TRC-20)
// =========================================================

export interface WalletTransaction {
  hash:        string;        // txID de TronGrid
  txID?:       string;        // Alias de hash
  from:        string;        // Dirección origen
  to:          string;        // Dirección destino
  amount:      number;        // Monto en USDT
  value?:      number;        // Alias de amount
  asset:       CryptoAsset;   // Siempre USDT
  timestamp:   number;        // Fecha Unix
  status:      "confirmed" | "pending" | "failed";
  network:     BlockchainNetwork; // Siempre "tron"
  explorerUrl: string;        // Link a TronScan
  type?:       "deposit" | "withdrawal" | "trade" | "internal";
  fee?:        number;        // Comisión de red (TRX)
}

// ✅ Estado de la wallet custodial manejada por el backend
export interface WalletInfo {
  address:      string;              // Dirección de depósito Tron
  usdtBalance:  number;              // Balance total en USDT
  totalUSD:     number;              // Equivalente en USD (1:1)
  lastUpdated:  number;              // Última sincronización
  network:      BlockchainNetwork;   // "tron"
}

// ✅ Respuesta estandarizada del backend custodial
export interface CustodialResponse<T = any> {
  success:     boolean;
  message?:    string;
  error?:      string;
  code?:       string;
  data?:       T;
}

// ✅ Respuesta al solicitar dirección de depósito
export interface DepositAddressResponse {
  success:        boolean;
  coin_address:   string;
  network:        "TRC20";
  qr?:            string;
  minDeposit?:    number;
}

// ✅ Respuesta al ejecutar un retiro
export interface WithdrawResponse {
  success:    boolean;
  txHash?:    string;
  txId?:      string;
  message?:   string;
  error?:     string;
  amount?:    number;
  fee?:       number;
  explorerUrl?: string;
  }
