import { create } from "zustand";
import type {
  User,
  CryptoBalance,
  CryptoPrice,
  P2POrder,
  Trade,
  ChatMessage,
  Product,
  Notification,
  ThemeMode,
  AppView,
} from "@/types";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const RENDER_API_URL = "https://cubax-backend.onrender.com/api";

interface AppState {
  theme:             ThemeMode;
  currentView:       AppView;
  previousView:      AppView | null;
  user:              User | null;
  isAuthenticated:   boolean;
  balances:          CryptoBalance[];
  prices:            CryptoPrice[];
  orders:            P2POrder[];
  activeTrade:       Trade | null;
  tradeMessages:     ChatMessage[];
  products:          Product[];
  notifications:     Notification[];
  depositAddresses:  Record<string, string>;
  selectedTradeId:   string | null;
  selectedProductId: string | null;
  isLoading:         boolean;
  mobileMenuOpen:    boolean;
  loadingPrices:     boolean;
  modalOpen:         boolean;

  setTheme:      (theme: ThemeMode) => void;
  toggleTheme:   () => void;
  navigate:      (view: AppView) => void;
  goBack:        () => void;
  setUser:       (user: User | null) => void;
  login:         (user: User) => void;
  logout:        () => void;

  setWalletData: (
    firestoreBalances: Record<string, number>,
    depositAddresses?: Record<string, string>
  ) => void;

  setPrices:   (prices: CryptoPrice[]) => void;
  fetchPrices: () => Promise<void>;
  setOrders:   (orders: P2POrder[]) => void;
  addOrder:    (order: P2POrder) => void;
  setActiveTrade: (trade: Trade | null) => void;

  updateTradeStatus: (tradeId: string, status: Trade["status"]) => Promise<void>;
  fetchDepositAddress: (asset: string, chain: string) => Promise<void>;
  requestDeposit: (asset: string) => Promise<{ success: boolean; address?: string; message: string }>;
  requestWithdrawal: (asset: string, amount: number, toAddress: string, chain: string) => Promise<{ success: boolean; txId?: string; message: string }>;

  setTradeMessages:         (messages: ChatMessage[]) => void;
  addMessage:               (message: ChatMessage) => void;
  subscribeToTradeMessages: (tradeId: string) => () => void;
  sendMessage:              (tradeId: string, text: string) => Promise<void>;

  setProducts:         (products: Product[]) => void;
  addProduct:          (product: Product) => void;
  deleteProduct:       (productId: string) => Promise<void>;
  subscribeToProducts: () => () => void;

  setNotifications:         (notifications: Notification[]) => void;
  subscribeToNotifications: (userId: string) => () => void;
  markNotificationRead:     (id: string) => Promise<void>;

  setSelectedTradeId:   (id: string | null) => void;
  setSelectedProductId: (id: string | null) => void;
  setLoading:           (loading: boolean) => void;
  setMobileMenuOpen:    (open: boolean) => void;
  setModalOpen:         (open: boolean) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("cubax-theme") as ThemeMode | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};

export const useAppStore = create<AppState>((set, get) => ({
  theme:             getInitialTheme(),
  currentView:       "landing",
  previousView:      null,
  user:              null,
  isAuthenticated:   false,
  balances:          [],
  depositAddresses:  {},
  modalOpen:         false,
  prices: [
    { id: "1", symbol: "USDT", name: "Tether",   priceUSD: 1.00,     change24h: 0 },
    { id: "2", symbol: "USDC", name: "USD Coin",  priceUSD: 1.00,     change24h: 0 },
    { id: "3", symbol: "BTC",  name: "Bitcoin",   priceUSD: 67500.00, change24h: 0 },
    { id: "4", symbol: "ETH",  name: "Ethereum",  priceUSD: 3500.00,  change24h: 0 },
  ],
  orders:            [],
  activeTrade:       null,
  tradeMessages:     [],
  products:          [],
  notifications:     [],
  selectedTradeId:   null,
  selectedProductId: null,
  isLoading:         false,
  mobileMenuOpen:    false,
  loadingPrices:     false,

  setTheme: (theme) => { localStorage.setItem("cubax-theme", theme); set({ theme }); },
  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("cubax-theme", newTheme);
    set({ theme: newTheme });
  },

  navigate: (view) => set({ previousView: get().currentView, currentView: view, mobileMenuOpen: false }),
  goBack: () => { const prev = get().previousView; if (prev) set({ currentView: prev, previousView: null }); },
  setUser: (user) => set({ user }),
  login: (user) => { set({ user, isAuthenticated: true, currentView: "dashboard" }); },

  logout: () => {
    localStorage.removeItem("cubax_token");
    localStorage.removeItem("cubax_uid");
    set({ user: null, isAuthenticated: false, currentView: "landing", balances: [], depositAddresses: {} });
  },

  setWalletData: (firestoreBalances, depositAddresses = {}) => {
    const currentPrices = get().prices;
    const currentUser = get().user;

    const updatedBalances: CryptoBalance[] = Object.entries(firestoreBalances).map(([asset, amount]) => {
      const cryptoPriceInfo = currentPrices.find((p) => p.symbol.toUpperCase() === asset.toUpperCase());
      return {
        asset: asset.toUpperCase() as any,
        amount,
        usdValue: amount * (cryptoPriceInfo?.priceUSD || 1.0),
      };
    });

    set((state) => ({
      balances: updatedBalances,
      depositAddresses: { ...state.depositAddresses, ...depositAddresses },
      user: currentUser ? { 
        ...currentUser, 
        balances: firestoreBalances, 
        depositAddresses: { ...currentUser.depositAddresses, ...depositAddresses }
      } : null,
    }));
  },

  setPrices: (prices) => set({ prices }),
  fetchPrices: async () => { /* ... lógica existente ... */ },
  fetchDepositAddress: async (asset, chain) => { /* ... lógica existente ... */ },
  requestDeposit: async (asset) => { /* ... lógica existente ... */ },
  requestWithdrawal: async (asset, amount, toAddress, chain) => { /* ... lógica existente ... */ },

  setOrders:      (orders) => set({ orders }),
  addOrder:       (order)  => set({ orders: [order, ...get().orders] }),
  setActiveTrade: (trade)  => set({ activeTrade: trade }),
  updateTradeStatus: async (tradeId, status) => { await updateDoc(doc(db, "trades", tradeId), { status, updatedAt: Date.now() }); },

  setTradeMessages: (messages) => set({ tradeMessages: messages }),
  addMessage:       (message)  => set({ tradeMessages: [...get().tradeMessages, message] }),
  subscribeToTradeMessages: (tradeId) => { /* ... */ return () => {}; },
  sendMessage: async (tradeId, text) => { /* ... */ },

  setProducts: (products) => set({ products }),
  addProduct:  (product)  => set({ products: [product, ...get().products] }),
  deleteProduct: async (productId) => { await updateDoc(doc(db, "products", productId), { status: "cancelled" }); },
  subscribeToProducts: () => { /* ... */ return () => {}; },

  setNotifications: (notifications) => set({ notifications }),
  subscribeToNotifications: (userId) => { /* ... */ return () => {}; },
  markNotificationRead: async (id) => { /* ... */ },

  setSelectedTradeId:   (id)      => set({ selectedTradeId:   id }),
  setSelectedProductId: (id)      => set({ selectedProductId: id }),
  setLoading:           (loading) => set({ isLoading:         loading }),
  setMobileMenuOpen:    (open)    => set({ mobileMenuOpen:    open }),
  setModalOpen:         (open)    => set({ modalOpen:         open }),
}));
      
