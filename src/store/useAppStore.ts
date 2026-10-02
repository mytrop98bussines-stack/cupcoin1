import { create } from "zustand";
import type {
  User,
  CryptoPrice,
  P2POrder,
  Trade,
  ChatMessage,
  Product,
  Notification,
  ThemeMode,
  AppView,
} from "@/types";
import { setCache, getCache } from "@/lib/cache";

const RENDER_API_URL = "https://cubax-backend.onrender.com/api";

const getToken = (): string | null =>
  localStorage.getItem("cubax_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization:  `Bearer ${getToken()}`,
});

// =========================================================
// INTERFACE (Simplificada y adaptada a Custodia de USDT TRC20)
// =========================================================
interface AppState {
  theme:           ThemeMode;
  currentView:     AppView;
  previousView:    AppView | null;
  user:            User | null;
  isAuthenticated: boolean;

  // 💰 Wallet Custodial USDT (TRC-20)
  custodialAddress: string | null;
  usdtBalance:      number;
  walletHistory:    any[];
  walletLoading:    boolean;

  prices:        CryptoPrice[];
  orders:        P2POrder[];
  activeTrade:   Trade | null;
  tradeMessages: ChatMessage[];
  products:      Product[];
  notifications: Notification[];

  selectedTradeId:        string | null;
  selectedProductId:      string | null;
  selectedPublicUserId:   string | null;
  selectedSalesProductId: string | null;

  isLoading:      boolean;
  mobileMenuOpen: boolean;
  loadingPrices:  boolean;
  modalOpen:      boolean;
  language:       "es" | "en";

  // ─── Tema ────────────────────────────────────────────
  setTheme:    (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // ─── Navegación ──────────────────────────────────────
  navigate:          (view: AppView) => void;
  goBack:            () => void;
  navigateToProfile: (userId: string) => void;

  // ─── Usuario ─────────────────────────────────────────
  setUser:  (user: User | null) => void;
  login:    (user: User) => void;
  logout:   () => void;

  // ─── Wallet Custodial (USDT TRC20) ────────────────────
  loadCustodialWallet: () => Promise<void>;
  fetchWalletHistory:  () => Promise<void>;

  // ─── Precios (Solo USDT para rendimiento) ─────────────
  setPrices:   (prices: CryptoPrice[]) => void;
  fetchPrices: () => Promise<void>;

  // ─── Órdenes P2P ─────────────────────────────────────
  setOrders:     (orders: P2POrder[]) => void;
  addOrder:      (order: P2POrder) => void;
  fetchOrders:   () => Promise<void>;
  fetchMyOrders: () => Promise<void>;
  createOrder:   (orderData: Partial<P2POrder>) => Promise<{ success: boolean; message: string }>;
  cancelOrder:   (orderId: string) => Promise<{ success: boolean; message: string }>;

  // ─── Trades ──────────────────────────────────────────
  setActiveTrade:    (trade: Trade | null) => void;
  updateTradeStatus: (tradeId: string, status: Trade["status"]) => Promise<void>;

  // ─── Mensajes ────────────────────────────────────────
  setTradeMessages:         (messages: ChatMessage[]) => void;
  addMessage:               (message: ChatMessage) => void;
  subscribeToTradeMessages: (tradeId: string) => () => void;
  sendMessage:              (tradeId: string, text: string) => Promise<void>;

  // ─── Productos ───────────────────────────────────────
  setProducts:         (products: Product[]) => void;
  fetchProducts:       () => Promise<void>;
  addProduct:          (product: Partial<Product>) => Promise<{ success: boolean }>;
  deleteProduct:       (productId: string) => Promise<void>;
  subscribeToProducts: () => () => void;

  // ─── Notificaciones ──────────────────────────────────
  setNotifications:         (notifications: Notification[]) => void;
  fetchNotifications:       (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
  markNotificationRead:     (id: string) => Promise<void>;

  // ─── Idioma ──────────────────────────────────────────
  setLanguage: (lang: "es" | "en") => void;

  // ─── UI ──────────────────────────────────────────────
  setSelectedTradeId:        (id: string | null) => void;
  setSelectedProductId:      (id: string | null) => void;
  setSelectedPublicUserId:   (id: string | null) => void;
  setSelectedSalesProductId: (id: string | null) => void;
  setLoading:                (loading: boolean) => void;
  setMobileMenuOpen:         (open: boolean) => void;
  setModalOpen:              (open: boolean) => void;
}

// =========================================================
// HELPERS
// =========================================================
const getInitialTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("cubax-theme") as ThemeMode | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};

const getInitialView = (): AppView => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const hasOAuthCallback =
      params.has("token")          ||
      params.has("requires2FA")    ||
      params.has("challengeToken") ||
      params.has("error");

    if (hasOAuthCallback) return "login";

    const token = localStorage.getItem("cubax_token");
    if (token) return "dashboard";

    const stored = localStorage.getItem("cubax_last_view") as AppView | null;
    if (stored) return stored;
  }
  return "landing";
};

// =========================================================
// STORE
// =========================================================
export const useAppStore = create<AppState>((set, get) => ({
  theme:           getInitialTheme(),
  currentView:     getInitialView(),
  previousView:    null,
  user:            null,
  isAuthenticated: false,

  // 💰 Wallet Custodial USDT TRC20 Inicialización
  custodialAddress: null,
  usdtBalance:      0.0,
  walletHistory:    [],
  walletLoading:    false,

  language: (localStorage.getItem("cubax_language") as "es" | "en") || "es",

  prices: [
    { id: "1", symbol: "USDT", name: "Tether", priceUSD: 1, change24h: 0 }
  ],

  orders:                  [],
  activeTrade:             null,
  tradeMessages:           [],
  products:                [],
  notifications:           [],
  selectedTradeId:         null,
  selectedProductId:       null,
  selectedPublicUserId:    null,
  selectedSalesProductId:  null,
  isLoading:               false,
  mobileMenuOpen:          false,
  loadingPrices:           false,
  modalOpen:               false,

  // =========================================================
  // TEMA
  // =========================================================
  setTheme: (theme) => {
    localStorage.setItem("cubax-theme", theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("cubax-theme", newTheme);
    set({ theme: newTheme });
  },

  // =========================================================
  // NAVEGACIÓN
  // =========================================================
  navigate: (view) => {
    localStorage.setItem("cubax_last_view", view);
    set({
      previousView:   get().currentView,
      currentView:    view,
      mobileMenuOpen: false,
    });
  },

  goBack: () => {
    const prev = get().previousView;
    if (prev) {
      localStorage.setItem("cubax_last_view", prev);
      set({ currentView: prev, previousView: null });
    }
  },

  navigateToProfile: (userId: string) => {
    set({ selectedPublicUserId: userId });
    get().navigate("public-profile" as AppView);
  },

  // =========================================================
  // USUARIO / AUTH
  // =========================================================
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: (user) => {
    localStorage.setItem("cubax_last_view", "dashboard");
    set({
      user,
      isAuthenticated: true,
      currentView:     "dashboard",
    });

    // Cargar automáticamente su wallet custodia de USDT
    void get().loadCustodialWallet();
  },

  logout: () => {
    const savedUid         = localStorage.getItem("cubax_uid");
    const savedEmail       = localStorage.getItem("cubax_email");
    const biometricEnabled = localStorage.getItem("biometric_enabled");

    localStorage.removeItem("cubax_token");
    localStorage.removeItem("cubax_refresh_token");
    localStorage.removeItem("cubax_last_view");
    localStorage.removeItem("cubax_name");

    if (biometricEnabled === "1" && savedUid) {
      if (savedEmail) localStorage.setItem("cubax_email", savedEmail);
      localStorage.setItem("cubax_uid",         savedUid);
      localStorage.setItem("biometric_enabled", "1");
    } else {
      localStorage.removeItem("cubax_uid");
      localStorage.removeItem("cubax_email");
    }

    set({
      user:             null,
      isAuthenticated:  false,
      currentView:      "landing",
      custodialAddress: null,
      usdtBalance:      0,
      walletHistory:    [],
      notifications:    [],
      activeTrade:      null,
      tradeMessages:    [],
      products:         [],
      modalOpen:        false,
    });
  },

  // =========================================================
  // 💰 WALLET CUSTODIAL INTEGRATION (USDT TRC20)
  // =========================================================
  loadCustodialWallet: async () => {
    const currentUser = get().user;
    if (!currentUser?.uid) return;

    set({ walletLoading: true });
    try {
      // 1. Obtener/Crear la dirección de Tron asignada en custodia
      const addressRes = await fetch(`${RENDER_API_URL}/tron/deposit-address`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ uid: currentUser.uid }),
      });
      const addressData = await addressRes.json();

      if (addressData.success && addressData.coin_address) {
        const address = addressData.coin_address;
        
        // 2. Obtener balance del backend usando la dirección custodial
        const balanceRes = await fetch(`${RENDER_API_URL}/tron/balance/${address}`, {
          headers: authHeaders(),
        });
        const balanceData = await balanceRes.json();
        
        // Si el backend te devuelve un objeto como { balance: 50 } o { balance: "50" }
        const rawBalance = balanceData.balance ?? balanceData.usdt ?? 0;

        set({
          custodialAddress: address,
          usdtBalance:      parseFloat(rawBalance),
        });

        // 3. Traer el historial de transacciones de Tron
        void get().fetchWalletHistory();
      }
    } catch (err) {
      console.error("❌ [Store] Error cargando wallet custodial TRC20:", err);
    } finally {
      set({ walletLoading: false });
    }
  },

  fetchWalletHistory: async () => {
    const address = get().custodialAddress;
    if (!address) return;

    try {
      const res = await fetch(`${RENDER_API_URL}/tron/transactions/${address}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success || Array.isArray(data)) {
        // Adaptar según el formato que retorne tu API (ej: data.transactions o data directo)
        const txs = Array.isArray(data) ? data : (data.transactions || []);
        set({ walletHistory: txs });
      }
    } catch (err) {
      console.error("❌ [Store] Error obteniendo historial TRC20:", err);
    }
  },

  // =========================================================
  // PRECIOS
  // =========================================================
  setPrices: (prices) => set({ prices }),

  fetchPrices: async () => {
    set({ loadingPrices: true });
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd&include_24hr_change=true"
      );
      if (!response.ok) throw new Error("Error CoinGecko");
      const data = await response.json();

      const prices: CryptoPrice[] = [
        { 
          id: "1", 
          symbol: "USDT", 
          name: "Tether", 
          priceUSD: data.tether?.usd ?? 1.0, 
          change24h: data.tether?.usd_24h_change ?? 0.0 
        }
      ];

      set({ prices, loadingPrices: false });
    } catch (error) {
      console.error("❌ [Prices] Error:", error);
      set({ loadingPrices: false });
    }
  },

  // =========================================================
  // ÓRDENES P2P (Mantiene el JWT Headers)
  // =========================================================
  setOrders: (orders) => set({ orders }),
  addOrder:  (order)  => set({ orders: [order, ...get().orders] }),

  fetchOrders: async () => {
    const cached = getCache<P2POrder[]>("orders");
    if (cached) set({ orders: cached });
    try {
      const res  = await fetch(`${RENDER_API_URL}/orders`);
      const data = await res.json();
      if (data.success) {
        set({ orders: data.orders });
        setCache("orders", data.orders);
      }
    } catch (error) {
      console.error("❌ [Orders] Error fetchOrders:", error);
    }
  },

  fetchMyOrders: async () => {
    const currentUser = get().user;
    if (!currentUser?.uid) return;
    try {
      const res  = await fetch(`${RENDER_API_URL}/orders/my-orders`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ uid: currentUser.uid }),
      });
      const data = await res.json();
      if (data.success) set({ orders: data.orders });
    } catch (error) {
      console.error("❌ [Orders] Error fetchMyOrders:", error);
    }
  },

  createOrder: async (orderData) => {
    const currentUser = get().user;
    if (!currentUser?.uid) return { success: false, message: "No autenticado" };
    try {
      const res  = await fetch(`${RENDER_API_URL}/orders/create`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ ...orderData, uid: currentUser.uid }),
      });
      const data = await res.json();
      if (data.success) {
        get().addOrder(data.order);
        return { success: true, message: "Orden creada" };
      }
      return { success: false, message: data.error || "Error creando orden" };
    } catch (error) {
      console.error("❌ [Orders] Error createOrder:", error);
      return { success: false, message: "Error de conexión" };
    }
  },

  cancelOrder: async (orderId) => {
    const currentUser = get().user;
    if (!currentUser?.uid) return { success: false, message: "No autenticado" };
    try {
      const res  = await fetch(`${RENDER_API_URL}/orders/cancel`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ uid: currentUser.uid, orderId }),
      });
      const data = await res.json();
      if (data.success) {
        set({ orders: get().orders.filter((o) => o.id !== orderId) });
        return { success: true, message: "Orden cancelada" };
      }
      return { success: false, message: data.error || "Error" };
    } catch (error) {
      console.error("❌ [Orders] Error cancelOrder:", error);
      return { success: false, message: "Error de conexión" };
    }
  },

  // =========================================================
  // TRADES
  // =========================================================
  setActiveTrade: (trade) => set({ activeTrade: trade }),

  updateTradeStatus: async (tradeId, status) => {
    if (!tradeId) return;
    try {
      const res  = await fetch(`${RENDER_API_URL}/trades/${tradeId}/status`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch (error) {
      console.error("❌ [Trade] Error updateTradeStatus:", error);
    }
  },

  // =========================================================
  // MENSAJES
  // =========================================================
  setTradeMessages: (messages) => set({ tradeMessages: messages }),
  addMessage:       (message)  => set({ tradeMessages: [...get().tradeMessages, message] }),

  subscribeToTradeMessages: (tradeId: string) => {
    if (!tradeId) return () => {};
    let stopped = false;

    const loadMessages = async () => {
      const token = getToken();
      if (!token || stopped) return;
      try {
        const res  = await fetch(
          `${RENDER_API_URL}/trades/${encodeURIComponent(tradeId)}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && !stopped) {
          set({ tradeMessages: data.messages });
        }
      } catch (error) {
        console.error("❌ Error cargando mensajes:", error);
      }
    };

    void loadMessages();
    const intervalId = window.setInterval(loadMessages, 5000);
    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  },

  sendMessage: async (tradeId: string, text: string) => {
    if (!tradeId || !text.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      const res  = await fetch(
        `${RENDER_API_URL}/trades/${encodeURIComponent(tradeId)}/messages`,
        {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ text: text.trim() }),
        }
      );
      const data = await res.json();
      if (data.success) {
        set({ tradeMessages: [...get().tradeMessages, data.message] });
      }
    } catch (error) {
      console.error("❌ Error enviando mensaje:", error);
    }
  },

  // =========================================================
  // PRODUCTOS
  // =========================================================
  setProducts: (products) => set({ products }),

  fetchProducts: async () => {
    const cached = getCache<Product[]>("products");
    if (cached) set({ products: cached });
    try {
      const res  = await fetch(`${RENDER_API_URL}/products`);
      const data = await res.json();
      if (data.success) {
        set({ products: data.products });
        setCache("products", data.products);
      }
    } catch (error) {
      console.error("❌ [Marketplace] Error fetchProducts:", error);
    }
  },

  addProduct: async (productData) => {
    const currentUser = get().user;
    if (!currentUser?.uid) return { success: false };
    try {
      const res  = await fetch(`${RENDER_API_URL}/products/create`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ ...productData, uid: currentUser.uid }),
      });
      const data = await res.json();
      if (data.success) {
        set({ products: [data.product, ...get().products] });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("❌ Error addProduct:", error);
      return { success: false };
    }
  },

  deleteProduct: async (productId: string) => {
    const currentUser = get().user;
    if (!currentUser?.uid) return;
    try {
      const res  = await fetch(`${RENDER_API_URL}/products/delete`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ uid: currentUser.uid, productId }),
      });
      const data = await res.json();
      if (data.success) {
        set({ products: get().products.filter((p) => p.id !== productId) });
      }
    } catch (error) {
      console.error("❌ Error deleteProduct:", error);
    }
  },

  subscribeToProducts: () => {
    void get().fetchProducts();
    return () => {};
  },

  // =========================================================
  // NOTIFICACIONES
  // =========================================================
  setNotifications: (notifications) => set({ notifications }),

  fetchNotifications: async (userId: string) => {
    if (!userId || userId === "invitado") return;
    const cached = getCache<Notification[]>(`notifications_${userId}`);
    if (cached) set({ notifications: cached });
    try {
      const res  = await fetch(`${RENDER_API_URL}/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        set({ notifications: data.notifications });
        setCache(`notifications_${userId}`, data.notifications);
      }
    } catch (error) {
      console.error("❌ Error fetchNotifications:", error);
    }
  },

  subscribeToNotifications: (userId: string) => {
    if (!userId || userId === "invitado") return () => {};
    let stopped = false;

    const load = async () => {
      if (stopped) return;
      await get().fetchNotifications(userId);
    };

    void load();
    const intervalId = window.setInterval(load, 30000);
    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  },

  markNotificationRead: async (id: string) => {
    try {
      const res  = await fetch(`${RENDER_API_URL}/notifications/read`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        });
      }
    } catch (error) {
      console.error("❌ Error markNotificationRead:", error);
    }
  },

  // =========================================================
  // IDIOMA
  // =========================================================
  setLanguage: (lang) => {
    localStorage.setItem("cubax_language", lang);
    set({ language: lang });
  },

  // =========================================================
  // UI
  // =========================================================
  setSelectedTradeId:        (id)      => set({ selectedTradeId:        id }),
  setSelectedProductId:      (id)      => set({ selectedProductId:      id }),
  setSelectedSalesProductId: (id)      => set({ selectedSalesProductId: id }),
  setSelectedPublicUserId:   (id)      => set({ selectedPublicUserId:   id }),
  setLoading:                (loading) => set({ isLoading:              loading }),
  setMobileMenuOpen:         (open)    => set({ mobileMenuOpen:         open }),
  setModalOpen:              (open)    => set({ modalOpen:              open }),
}));
