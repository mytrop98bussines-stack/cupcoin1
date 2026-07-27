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
import { setCache, getCache } from "@/lib/cache";

const RENDER_API_URL = "https://cubax-backend.onrender.com/api";

// ─── Helper para obtener el token ────────────────────────
const getToken = (): string | null => localStorage.getItem("cubax_token");

// ─── Headers autenticados ─────────────────────────────────
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

interface AppState {
  theme:                    ThemeMode;
  currentView:              AppView;
  previousView:             AppView | null;
  user:                     User | null;
  isAuthenticated:          boolean;
  balances:                 CryptoBalance[];
  prices:                   CryptoPrice[];
  orders:                   P2POrder[];
  activeTrade:              Trade | null;
  tradeMessages:            ChatMessage[];
  products:                 Product[];
  notifications:            Notification[];
  depositAddresses:         Record<string, string>;
  selectedTradeId:          string | null;
  selectedProductId:        string | null;
  selectedPublicUserId:     string | null;
  selectedSalesProductId:   string | null;
  isLoading:                boolean;
  mobileMenuOpen:           boolean;
  loadingPrices:            boolean;
  modalOpen:                boolean;
  language:                 "es" | "en";

  // ─── Tema ────────────────────────────────────────────────
  setTheme:    (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // ─── Navegación ──────────────────────────────────────────
  navigate:          (view: AppView) => void;
  goBack:            () => void;
  navigateToProfile: (userId: string) => void;

  // ─── Usuario ─────────────────────────────────────────────
  setUser: (user: User | null) => void;
  login:   (user: User) => void;
  logout:  () => void;

  // ─── Wallet ──────────────────────────────────────────────
  setWalletData: (
    firestoreBalances: Record<string, number>,
    depositAddresses?: Record<string, string>
  ) => void;

  // ─── Precios ─────────────────────────────────────────────
  setPrices:   (prices: CryptoPrice[]) => void;
  fetchPrices: () => Promise<void>;

  // ─── Depósitos y Retiros ─────────────────────────────────
  fetchDepositAddress: (asset: string, chain: string) => Promise<void>;
  requestDeposit: (asset: string) => Promise<{
    success:  boolean;
    address?: string;
    message:  string;
  }>;
  requestWithdrawal: (
    asset:     string,
    amount:    number,
    toAddress: string,
    chain:     string
  ) => Promise<{ success: boolean; txId?: string; message: string }>;

  // ─── Órdenes P2P ─────────────────────────────────────────
  setOrders:     (orders: P2POrder[]) => void;
  addOrder:      (order: P2POrder) => void;
  fetchOrders:   () => Promise<void>;
  fetchMyOrders: () => Promise<void>;
  createOrder:   (orderData: Partial<P2POrder>) => Promise<{ success: boolean; message: string }>;
  cancelOrder:   (orderId: string) => Promise<{ success: boolean; message: string }>;

  // ─── Trades ──────────────────────────────────────────────
  setActiveTrade:    (trade: Trade | null) => void;
  updateTradeStatus: (tradeId: string, status: Trade["status"]) => Promise<void>;

  // ─── Mensajes ────────────────────────────────────────────
  setTradeMessages:         (messages: ChatMessage[]) => void;
  addMessage:               (message: ChatMessage) => void;
  subscribeToTradeMessages: (tradeId: string) => () => void;
  sendMessage:              (tradeId: string, text: string) => Promise<void>;

  // ─── Productos ───────────────────────────────────────────
  setProducts:         (products: Product[]) => void;
  fetchProducts:       () => Promise<void>;
  addProduct:          (product: Partial<Product>) => Promise<{ success: boolean }>;
  deleteProduct:       (productId: string) => Promise<void>;
  subscribeToProducts: () => () => void;

  // ─── Notificaciones ──────────────────────────────────────
  setNotifications:         (notifications: Notification[]) => void;
  fetchNotifications:       (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
  markNotificationRead:     (id: string) => Promise<void>;

  // ─── Idioma ──────────────────────────────────────────────
  setLanguage: (lang: "es" | "en") => void;

  // ─── UI ──────────────────────────────────────────────────
  setSelectedTradeId:        (id: string | null) => void;
  setSelectedProductId:      (id: string | null) => void;
  setSelectedPublicUserId:   (id: string | null) => void;
  setSelectedSalesProductId: (id: string | null) => void;
  setLoading:                (loading: boolean) => void;
  setMobileMenuOpen:         (open: boolean) => void;
  setModalOpen:              (open: boolean) => void;
}

// ─── Tema inicial ─────────────────────────────────────────
const getInitialTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("cubax-theme") as ThemeMode | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "dark";
};

// ─── Vista inicial ────────────────────────────────────────
const getInitialView = (): AppView => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);

    const hasOAuthCallback =
      params.has("token") ||
      params.has("requires2FA") ||
      params.has("challengeToken") ||
      params.has("error");

    if (hasOAuthCallback) {
      return "login";
    }

    const token = localStorage.getItem("cubax_token");
    if (token) {
      return "dashboard";
    }

    const stored = localStorage.getItem("cubax_last_view") as AppView | null;

    const validViews = [
      "landing", "login", "register", "dashboard", "p2p", "create-order",
      "trade", "kyc", "marketplace", "product-detail", "create-product",
      "wallet", "settings", "notifications", "membership", "profile",
      "security", "help", "terms", "language", "notification-settings",
      "trade-history", "my-orders", "admin-kyc", "admin-disputes",
      "public-profile", "sales-management",
    ];

    if (stored && validViews.includes(stored)) return stored;
  }

  return "landing";
};

export const useAppStore = create<AppState>((set, get) => ({
  theme:                  getInitialTheme(),
  currentView:            getInitialView(),
  previousView:           null,
  user:                   null,
  isAuthenticated:        false,
  balances:               [],
  depositAddresses:       {},
  modalOpen:              false,
  selectedPublicUserId:   null,
  selectedSalesProductId: null,
  language:               (localStorage.getItem("cubax_language") as "es" | "en") || "es",

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
  // USUARIO
  // =========================================================
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: (user) => {
    localStorage.setItem("cubax_last_view", "dashboard");
    set({ user, isAuthenticated: true, currentView: "dashboard" });
  },

  // 🆕 LOGOUT MODIFICADO — Preserva datos de biometría
  logout: () => {
    // Guardar datos importantes ANTES de limpiar
    const savedUid         = localStorage.getItem("cubax_uid");
    const savedEmail       = localStorage.getItem("cubax_email");
    const biometricEnabled = localStorage.getItem("biometric_enabled");

    // Limpiar tokens de sesión (esto SÍ se debe borrar)
    localStorage.removeItem("cubax_token");
    localStorage.removeItem("cubax_refresh_token");
    localStorage.removeItem("cubax_last_view");
    localStorage.removeItem("cubax_name");

    // 🔐 Preservar UID y email SOLO si tiene biometría activada
    if (biometricEnabled === "1" && savedUid) {
      // Mantener cubax_uid y cubax_email para que aparezca el botón biométrico
      if (savedEmail) localStorage.setItem("cubax_email", savedEmail);
      localStorage.setItem("cubax_uid", savedUid);
      localStorage.setItem("biometric_enabled", "1");
      console.log("🔐 [Logout] Biometría preservada para próximo login");
    } else {
      // Si NO tiene biometría, limpiar todo
      localStorage.removeItem("cubax_uid");
      localStorage.removeItem("cubax_email");
    }

    set({
      user:             null,
      isAuthenticated:  false,
      currentView:      "landing",
      balances:         [],
      depositAddresses: {},
      notifications:    [],
      activeTrade:      null,
      tradeMessages:    [],
      products:         [],
      modalOpen:        false,
    });
  },

  // =========================================================
  // WALLET
  // =========================================================
  setWalletData: (firestoreBalances, depositAddresses = {}) => {
    const currentPrices = get().prices;
    const currentUser   = get().user;

    const updatedBalances: CryptoBalance[] = Object.entries(firestoreBalances).map(
      ([asset, amount]) => {
        const cryptoPriceInfo = currentPrices.find(
          (p) => p.symbol.toUpperCase() === asset.toUpperCase()
        );
        const priceUSD = cryptoPriceInfo ? cryptoPriceInfo.priceUSD : 1.0;
        return {
          asset:    asset.toUpperCase() as any,
          amount,
          usdValue: amount * priceUSD,
        };
      }
    );

    set({
      balances:         updatedBalances,
      depositAddresses: { ...get().depositAddresses, ...depositAddresses },
      user: currentUser
        ? {
            ...currentUser,
            balances:         firestoreBalances,
            depositAddresses: { ...currentUser.depositAddresses, ...depositAddresses },
          }
        : null,
    });
  },

  // =========================================================
  // PRECIOS
  // =========================================================
  setPrices: (prices) => set({ prices }),

  fetchPrices: async () => {
    set({ loadingPrices: true });
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price" +
        "?ids=bitcoin,ethereum,tether,usd-coin" +
        "&vs_currencies=usd" +
        "&include_24hr_change=true"
      );
      if (!response.ok) throw new Error("Error CoinGecko");
      const data = await response.json();
      const prices: CryptoPrice[] = [
        { id: "1", symbol: "USDT", name: "Tether",   priceUSD: data.tether?.usd          ?? 1.00,  change24h: data.tether?.usd_24h_change          ?? 0 },
        { id: "2", symbol: "USDC", name: "USD Coin", priceUSD: data["usd-coin"]?.usd      ?? 1.00,  change24h: data["usd-coin"]?.usd_24h_change      ?? 0 },
        { id: "3", symbol: "BTC",  name: "Bitcoin",  priceUSD: data.bitcoin?.usd          ?? 67500, change24h: data.bitcoin?.usd_24h_change          ?? 0 },
        { id: "4", symbol: "ETH",  name: "Ethereum", priceUSD: data.ethereum?.usd         ?? 3500,  change24h: data.ethereum?.usd_24h_change         ?? 0 },
      ];
      set({ prices, loadingPrices: false });
      console.log("✅ [Prices] Actualizados desde CoinGecko");
    } catch (error) {
      console.error("❌ [Prices] Error fetchPrices:", error);
      set({ loadingPrices: false });
    }
  },
    // =========================================================
  // DEPÓSITOS Y RETIROS
  // =========================================================
  fetchDepositAddress: async (asset, _chain) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado") return;
    const assetKey = asset.toUpperCase();
    if (assetKey !== "USDT") return;
    if (get().depositAddresses[assetKey]) return;
    try {
      const response = await fetch(`${RENDER_API_URL}/tron/deposit-address`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: currentUser.uid }),
      });
      const data = await response.json();
      if (data?.success && data?.coin_address) {
        set({ depositAddresses: { ...get().depositAddresses, [assetKey]: data.coin_address } });
      }
    } catch (error) {
      console.error("❌ [fetchDepositAddress] Error:", error);
    }
  },

  requestDeposit: async (asset) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado") {
      return { success: false, message: "No hay un usuario autenticado." };
    }
    const assetKey = asset.toUpperCase();
    if (assetKey !== "USDT") {
      return { success: false, message: "Solo USDT/TRC20 está disponible actualmente." };
    }
    const cached = get().depositAddresses[assetKey];
    if (cached) return { success: true, address: cached, message: "Dirección desde cache." };
    try {
      const response = await fetch(`${RENDER_API_URL}/tron/deposit-address`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: currentUser.uid }),
      });
      const resData = await response.json();
      if (resData?.success && resData?.coin_address) {
        const updatedAddresses = { ...get().depositAddresses, [assetKey]: resData.coin_address };
        set({
          depositAddresses: updatedAddresses,
          user: currentUser ? { ...currentUser, depositAddresses: updatedAddresses } : null,
        });
        return { success: true, address: resData.coin_address, message: "Dirección obtenida." };
      }
      return { success: false, message: resData?.error || "Error obteniendo dirección." };
    } catch {
      return { success: false, message: "Error de conexión con backend." };
    }
  },

  requestWithdrawal: async (asset, amount, toAddress, _chain) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado") {
      return { success: false, message: "Operación no válida." };
    }
    if (asset.toUpperCase() !== "USDT") {
      return { success: false, message: "Solo retiros de USDT/TRC20 están disponibles actualmente." };
    }
    if (!toAddress.startsWith("T")) {
      return { success: false, message: "La dirección debe ser TRC20 y empezar con T." };
    }
    try {
      const response = await fetch(`${RENDER_API_URL}/tron/withdraw`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: currentUser.uid, toAddress, amount }),
      });
      const data = await response.json();
      if (data.success) return { success: true, txId: data.txHash, message: "Retiro procesado exitosamente." };
      return { success: false, message: data.error || "Error procesando el retiro." };
    } catch (error: any) {
      return { success: false, message: error.message || "Error de conexión con backend." };
    }
  },

  // =========================================================
  // ÓRDENES P2P
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
        console.log("✅ [Orders] Órdenes cargadas");
      }
    } catch (error) {
      console.error("❌ [Orders] Error fetchOrders — usando cache:", error);
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
      if (data.success) {
        set({ orders: data.orders });
        console.log("✅ [Orders] Mis órdenes cargadas");
      }
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
        return { success: true, message: "Orden creada exitosamente" };
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
      return { success: false, message: data.error || "Error cancelando orden" };
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
      const res = await fetch(`${RENDER_API_URL}/trades/${tradeId}/status`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      console.log(`✅ [Trade] Estado actualizado: ${status}`);
    } catch (error) {
      console.error("❌ Error actualizando estado del trade:", error);
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
  // PRODUCTOS MARKETPLACE
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
        console.log("✅ [Marketplace] Productos cargados");
      }
    } catch (error) {
      console.error("❌ [Marketplace] Error fetchProducts — usando cache:", error);
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
        console.log("✅ [Notifications] Cargadas");
      }
    } catch (error) {
      console.error("❌ Error fetchNotifications — usando cache:", error);
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
