export type KYCStatus = "unverified" | "pending_verification" | "verified" | "rejected";

export type PaymentMethod = "transfermovil" | "enzona" | "efectivo";

export type OrderType = "buy" | "sell";

export type OrderStatus = "active" | "in_progress" | "completed" | "cancelled" | "disputed";

export type TradeStatus =
  | "awaiting_escrow"
  | "escrow_funded"
  | "payment_sent"
  | "payment_confirmed"
  | "crypto_released"
  | "disputed"
  | "cancelled";

export type CryptoAsset = "BTC" | "ETH" | "USDT" | "USDC";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  kycStatus: KYCStatus;
  createdAt: number;
  totalTrades: number;
  rating: number;
  walletAddress: string | null;
}

export interface CryptoBalance {
  asset: CryptoAsset;
  amount: number;
  usdValue: number;
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
  total_volume: number;
}

export interface P2POrder {
  id: string;
  userId: string;
  userName: string;
  userRating: number;
  userTrades: number;
  type: OrderType;
  asset: CryptoAsset;
  pricePerUnit: number;
  currency: string;
  minAmount: number;
  maxAmount: number;
  paymentMethods: PaymentMethod[];
  status: OrderStatus;
  createdAt: number;
  availableAmount: number;
}

export interface Trade {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  asset: CryptoAsset;
  amount: number;
  pricePerUnit: number;
  totalFiat: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: TradeStatus;
  escrowTxHash: string | null;
  releaseTxHash: string | null;
  createdAt: number;
  updatedAt: number;
  paymentDetails: PaymentDetails | null;
}

export interface PaymentDetails {
  method: PaymentMethod;
  phone?: string;
  accountName?: string;
  bankCard?: string;
  instructions?: string;
}

export interface ChatMessage {
  id: string;
  tradeId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  type: "text" | "system" | "image";
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  priceUSD: number;
  acceptedCryptos: CryptoAsset[];
  images: string[];
  category: ProductCategory;
  condition: "new" | "used" | "refurbished";
  location: string;
  status: "active" | "sold" | "paused";
  createdAt: number;
}

export type ProductCategory =
  | "electronics"
  | "phones"
  | "computers"
  | "clothing"
  | "home"
  | "vehicles"
  | "services"
  | "other";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "trade" | "kyc" | "system" | "product";
  read: boolean;
  createdAt: number;
  link?: string;
}

export type ThemeMode = "light" | "dark";

export type AppView =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "kyc"
  | "p2p"
  | "create-order"
  | "trade"
  | "marketplace"
  | "product-detail"
  | "create-product"
  | "wallet"
  | "settings"
  | "notifications";
