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

// Importaciones de Firebase para la sincronización real
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Configuración del URL del Core en Replit y Token de seguridad
const BACKEND_URL = "https://tu-proyecto.replit.app/api"; 
const ADMIN_TOKEN = "TU_ADMIN_TOKEN_CONFIGURADO"; // Vinculado a tu env de producción

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
  
  // 🏦 MODELO COINEX: Direcciones de depósito asignadas dinámicamente
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
  
  // 🔄 MAPEADOR CENTRAL: Procesa los saldos planos de Firestore cruzándolos con los precios del store
  setWalletData: (firestoreBalances: Record<string, number>, depositAddresses?: Record<string, string>) => void;
  
  setPrices: (prices: CryptoPrice[]) => void;
  fetchPrices: () => Promise<void>; 
  setOrders: (orders: P2POrder[]) => void;
  addOrder: (order: P2POrder) => void;
  setActiveTrade: (trade: Trade | null) => void;
  
  // 🔥 FIRESTORE CORE: Mutación en caliente del estado financiero de un intercambio
  updateTradeStatus: (tradeId: string, status: Trade["status"]) => Promise<void>;
  
  // 🏦 COINEX GATEWAY OPERATIONS (Nuevas interfaces conectadas al Core de Replit)
  fetchDepositAddress: (asset: string, chain: string) => Promise<void>;
  requestWithdrawal: (asset: string, amount: number, toAddress: string, chain: string) => Promise<{ success: boolean; txId?: string; message: string }>;

  // 💬 CHAT P2P INTERFACES ESTILO BINANCE
  setTradeMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  subscribeToTradeMessages: (tradeId: string) => (() => void);
  sendMessage: (tradeId: string, text: string) => Promise<void>;
  
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
  depositAddresses: {}, 
  
  prices: [
    { id: "1", symbol: "USDT", name: "Tether", priceUSD: 1.00, change24h: 0 },
    { id: "2", symbol: "USDC", name: "USD Coin", priceUSD: 1.00, change24h: 0 },
    { id: "3", symbol: "BTC", name: "Bitcoin", priceUSD: 67500.00, change24h: 0 },
    { id: "4", symbol: "ETH", name: "Ethereum", priceUSD: 3500.00, change24h: 0 },
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
      tradeMessages: [],
    }),

  setWalletData: (firestoreBalances, depositAddresses = {}) => {
    const currentPrices = get().prices;
    const updatedBalances: CryptoBalance[] = Object.entries(firestoreBalances).map(([asset, amount]) => {
      const cryptoPriceInfo = currentPrices.find((p) => p.symbol.toUpperCase() === asset.toUpperCase());
      const priceUSD = cryptoPriceInfo ? cryptoPriceInfo.priceUSD : 1.00; 

      return {
        asset: asset.toUpperCase(),
        amount: amount,
        usdValue: amount * priceUSD,
      };
    });

    set({ 
      balances: updatedBalances,
      depositAddresses: { ...get().depositAddresses, ...depositAddresses } 
    });
  },

  setPrices: (prices) => set({ prices }),

  // 🔄 CONEXIÓN INTEGRADA: Consulta de cotizaciones nativas en CoinEx API v2
  fetchPrices: async () => {
    set({ loadingPrices: true });
    try {
      const response = await fetch(
        "https://api.coinex.com/v2/market/ticker?market=BTCUSDT,ETHUSDT,USDCUSDT"
      );
      if (!response.ok) throw new Error(`Error de CoinEx API`);
      const json = await response.json();

      if (json.code === 0) {
        // Inicializamos estables planos en base 1 USD
        const livePricesMap: Record<string, { price: number; change: number }> = {
          USDT: { price: 1.00, change: 0 },
          USDC: { price: 1.00, change: 0 }
        };

        json.data.forEach((item: any) => {
          if (item.market === "BTCUSDT") {
            livePricesMap["BTC"] = { price: parseFloat(item.last), change: parseFloat(item.value_24h_percent) * 100 };
          } else if (item.market === "ETHUSDT") {
            livePricesMap["ETH"] = { price: parseFloat(item.last), change: parseFloat(item.value_24h_percent) * 100 };
          } else if (item.market === "USDCUSDT") {
            // USDC respecto a USDT (Suele oscilar cerca de 1.00)
            livePricesMap["USDC"] = { price: parseFloat(item.last), change: parseFloat(item.value_24h_percent) * 100 };
          }
        });

        const updatedPrices: CryptoPrice[] = [
          { id: "1", symbol: "USDT", name: "Tether", priceUSD: livePricesMap["USDT"].price, change24h: livePricesMap["USDT"].change },
          { id: "2", symbol: "USDC", name: "USD Coin", priceUSD: livePricesMap["USDC"].price, change24h: livePricesMap["USDC"].change },
          { id: "3", symbol: "BTC", name: "Bitcoin", priceUSD: livePricesMap["BTC"]?.price || 67500.00, change24h: livePricesMap["BTC"]?.change || 0 },
          { id: "4", symbol: "ETH", name: "Ethereum", priceUSD: livePricesMap["ETH"]?.price || 3500.00, change24h: livePricesMap["ETH"]?.change || 0 },
        ];

        set({ prices: updatedPrices, loadingPrices: false });
      } else {
        throw new Error(json.message);
      }
    } catch (error) {
      console.error("Fallo al consultar CoinEx v2, manteniendo precios estáticos:", error);
      set({ loadingPrices: false }); 
    }
  },

  // 📥 COINEX FLOW: Solicitar wallet fija de depósitos al backend seguro
  fetchDepositAddress: async (asset, chain) => {
    try {
      const response = await fetch(`${BACKEND_URL}/wallet/deposit-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": ADMIN_TOKEN
        },
        body: JSON.stringify({ ccy: asset, chain })
      });
      const data = await response.json();
      
      if (data.success) {
        set((state) => ({
          depositAddresses: { ...state.depositAddresses, [asset.toUpperCase()]: data.address }
        }));
      } else {
        console.error("Core Rechazó la petición de wallet:", data.message);
      }
    } catch (error) {
      console.error("Fallo de red conectando con sub-rutas de depósito:", error);
    }
  },

  // 📤 COINEX FLOW: Disparar retiro automatizado validado al Core de Replit
  requestWithdrawal: async (asset, amount, toAddress, chain) => {
    try {
      const response = await fetch(`${BACKEND_URL}/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": ADMIN_TOKEN
        },
        body: JSON.stringify({
          ccy: asset.toUpperCase(),
          amount: amount,
          toAddress: toAddress,
          chain: chain
        })
      });
      const data = await response.json();
      
      if (data.success) {
        return { success: true, txId: data.txId, message: data.message };
      } else {
        return { success: false, message: data.message || "Error interno devuelto por CoinEx" };
      }
    } catch (error) {
      return { success: false, message: "Error de enlace de red con la pasarela distribuidora" };
    }
  },

  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set({ orders: [order, ...get().orders] }),
  setActiveTrade: (trade) => set({ activeTrade: trade }),

  // 🏦 ACTUALIZACIÓN SÍNCRONIZADA CON FIRESTORE CLOUD
  updateTradeStatus: async (tradeId, status) => {
    if (!tradeId) return;
    try {
      const tradeRef = doc(db, "trades", tradeId);
      await updateDoc(tradeRef, {
        status,
        updatedAt: Date.now(),
      });
      
      const currentActive = get().activeTrade;
      if (currentActive && currentActive.id === tradeId) {
        set({ activeTrade: { ...currentActive, status, updatedAt: Date.now() } });
      }
    } catch (error) {
      console.error("Error al mutar el estado del trade en Firebase:", error);
    }
  },

  setTradeMessages: (messages) => set({ tradeMessages: messages }),
  addMessage: (message) => set({ tradeMessages: [...get().tradeMessages, message] }),

  subscribeToTradeMessages: (tradeId: string) => {
    if (!tradeId) return () => {};
    const q = query(collection(db, "trades", tradeId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      set({ tradeMessages: messagesList });
    }, (error) => {
      console.error("Error en Snapshot de mensajes P2P:", error);
    });
    return unsubscribe; 
  },

  sendMessage: async (tradeId: string, text: string) => {
    const currentUser = get().user;
    if (!currentUser?.uid || !tradeId || !text.trim()) return;
    try {
      const messageData = {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Usuario",
        text: text.trim(),
        createdAt: Date.now(),
      };
      await addDoc(collection(db, "trades", tradeId, "messages"), messageData);
    } catch (error) {
      console.error("Error al enviar mensaje P2P:", error);
    }
  },

  setProducts: (products) => set({ products }),
  addProduct: (product) => set({ products: [product, ...get().products] }),
  setNotifications: (notifications) => set({ notifications }),

  subscribeToNotifications: (userId: string) => {
    if (!userId || userId === "invitado") return () => {};
    const q = query(collection(db, "users", userId, "notifications"), orderBy("createdAt", "desc"));
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
        notifications: get().notifications.map((n) => n.id === id ? { ...n, read: true } : n),
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
                             
