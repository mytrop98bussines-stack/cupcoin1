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
  CryptoAsset,
} from "@/types";

// Importaciones de Firebase para la sincronización real
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface AppState {
  theme: ThemeMode;
  currentView: AppView;
  previousView: AppView | null;
  user: User | null;
  isAuthenticated: boolean;
  balances: CryptoBalance[];
  prices: CryptoPrice[]; 
  orders: P2POrder[];
  activeTrade: Trade | null;
  tradeMessages: ChatMessage[];
  products: Product[];
  notifications: Notification[];
  
  // 🏦 MODELO BINANCE: Direcciones de depósito fijas asignadas al usuario por CubaX
  depositAddresses: Record<string, string>;
  
  selectedTradeId: string | null;
  selectedProductId: string | null;
  isLoading: boolean;
  mobileMenuOpen: boolean;
  loadingPrices: boolean; 

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  navigate: (view: AppView) => void;
  goBack: () => void;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  
  // 🔄 NUEVO: Mapeador central de Balances reales desde Firestore + Precios en tiempo real
  setWalletData: (firestoreBalances: Record<string, number>, depositAddresses?: Record<string, string>) => void;
  
  setPrices: (prices: CryptoPrice[]) => void;
  fetchPrices: () => Promise<void>; 
  setOrders: (orders: P2POrder[]) => void;
  addOrder: (order: P2POrder) => void;
  setActiveTrade: (trade: Trade | null) => void;
  updateTradeStatus: (status: Trade["status"]) => void;
  setTradeMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  
  setNotifications: (notifications: Notification[]) => void;
  subscribeToNotifications: (userId: string) => (() => void);
  markNotificationRead: (id: string) => Promise<void>;
  
  setSelectedTradeId: (id: string | null) => void;
  setSelectedProductId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
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
  theme: getInitialTheme(),
  currentView: "landing",
  previousView: null,
  user: null,
  isAuthenticated: false,
  balances: [],
  depositAddresses: {}, // Inicialmente vacías hasta que el documento de Firebase cargue
  
  prices: [
    { id: "1", symbol: "USDT", name: "Tether", priceUSD: 1.00, change24h: 0 },
    { id: "2", symbol: "USDC", name: "USD Coin", priceUSD: 1.00, change24h: 0 },
    { id: "3", symbol: "BTC", name: "Bitcoin", priceUSD: 67500.00, change24h: 1.5 },
    { id: "4", symbol: "ETH", name: "Ethereum", priceUSD: 3500.00, change24h: -0.8 },
  ],
  orders: [],
  activeTrade: null,
  tradeMessages: [],
  products: [],
  notifications: [],
  selectedTradeId: null,
  selectedProductId: null,
  isLoading: false,
  mobileMenuOpen: false,
  loadingPrices: false,

  setTheme: (theme) => {
    localStorage.setItem("cubax-theme", theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("cubax-theme", newTheme);
    set({ theme: newTheme });
  },

  navigate: (view) => {
    set({ previousView: get().currentView, currentView: view, mobileMenuOpen: false });
  },

  goBack: () => {
    const prev = get().previousView;
    if (prev) {
      set({ currentView: prev, previousView: null });
    }
  },

  setUser: (user) => set({ user }),

  login: (user) => set({ user, isAuthenticated: true, currentView: "dashboard" }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      currentView: "landing",
      balances: [],
      depositAddresses: {},
      notifications: [],
      activeTrade: null,
    }),

  // ========================================================
  // ⚡ PROCESADOR DE BALANCES INTERNOS ESTILO CEX
  // ========================================================
  setWalletData: (firestoreBalances, depositAddresses = {}) => {
    const currentPrices = get().prices;

    // Convertimos el mapa de Firestore { USDT: 120, BTC: 0.004 } al array de la UI calculando USD
    const updatedBalances: CryptoBalance[] = Object.entries(firestoreBalances).map(([asset, amount]) => {
      const cryptoPriceInfo = currentPrices.find((p) => p.symbol.toUpperCase() === asset.toUpperCase());
      const priceUSD = cryptoPriceInfo ? cryptoPriceInfo.priceUSD : 1.00; // Fallback a 1:1 si es estable o no la encuentra

      return {
        asset: asset.toUpperCase(),
        amount: amount,
        usdValue: amount * priceUSD,
      };
    });

    set({ 
      balances: updatedBalances,
      depositAddresses: depositAddresses 
    });
  },

  setPrices: (prices) => set({ prices }),

  fetchPrices: async () => {
    set({ loadingPrices: true });
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin&vs_currencies=usd&include_24hr_change=true"
      );

      if (!response.ok) {
        throw new Error(`Error de CoinGecko: código ${response.status}`);
      }

      const data = await response.json();

      const updatedPrices: CryptoPrice[] = [
        {
          id: "1",
          symbol: "USDT",
          name: "Tether",
          priceUSD: data.tether?.usd || 1.00,
          change24h: data.tether?.usd_24h_change || 0,
        },
        {
          id: "2",
          symbol: "USDC",
          name: "USD Coin",
          priceUSD: data["usd-coin"]?.usd || 1.00,
          change24h: data["usd-coin"]?.usd_24h_change || 0,
        },
        {
          id: "3",
          symbol: "BTC",
          name: "Bitcoin",
          priceUSD: data.bitcoin?.usd || 67500.00,
          change24h: data.bitcoin?.usd_24h_change || 0,
        },
        {
          id: "4",
          symbol: "ETH",
          name: "Ethereum",
          priceUSD: data.ethereum?.usd || 3500.00,
          change24h: data.ethereum?.usd_24h_change || 0,
        },
      ];

      set({ prices: updatedPrices, loadingPrices: false });
      
      // 🔄 Recalculo inmediato de los balances acumulados tras refrescar los valores del mercado
      const currentUser = get().user;
      if (currentUser && (currentUser as any).balances) {
        get().setWalletData((currentUser as any).balances, get().depositAddresses);
      }
    } catch (error) {
      console.error("Fallo al consultar CoinGecko, manteniendo precios en caché:", error);
      set({ loadingPrices: false }); 
    }
  },

  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set({ orders: [order, ...get().orders] }),
  setActiveTrade: (trade) => set({ activeTrade: trade }),

  updateTradeStatus: (status) => {
    const trade = get().activeTrade;
    if (trade) {
      set({ activeTrade: { ...trade, status, updatedAt: Date.now() } });
    }
  },

  setTradeMessages: (messages) => set({ tradeMessages: messages }),
  addMessage: (message) => set({ tradeMessages: [...get().tradeMessages, message] }),
  setProducts: (products) => set({ products }),
  addProduct: (product) => set({ products: [product, ...get().products] }),
  
  setNotifications: (notifications) => set({ notifications }),

  subscribeToNotifications: (userId: string) => {
    if (!userId || userId === "invitado") return () => {};

    const q = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      snapshot.forEach((doc) => {
        notificationsList.push({ id: doc.id, ...doc.data() } as Notification);
      });
      set({ notifications: notificationsList });
    }, (error) => {
      console.error("Error en Snapshot de notificaciones:", error);
    });

    return unsubscribe; 
  },

  markNotificationRead: async (id) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado") return;

    try {
      const notifRef = doc(db, "users", currentUser.uid, "notifications", id);
      await updateDoc(notifRef, { read: true });

      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      });
    } catch (error) {
      console.error("Error al marcar notificación como leída en Firebase:", error);
    }
  },

  setSelectedTradeId: (id) => set({ selectedTradeId: id }),
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
      
