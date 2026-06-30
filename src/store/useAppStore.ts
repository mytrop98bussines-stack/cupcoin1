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
  setDoc,
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

  updateTradeStatus: (
    tradeId: string,
    status:  Trade["status"]
  ) => Promise<void>;

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
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
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

  // ─── TEMA ────────────────────────────────────────────────
  setTheme: (theme) => {
    localStorage.setItem("cubax-theme", theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("cubax-theme", newTheme);
    set({ theme: newTheme });
  },

  // ─── NAVEGACIÓN ──────────────────────────────────────────
  navigate: (view) =>
    set({
      previousView:   get().currentView,
      currentView:    view,
      mobileMenuOpen: false,
    }),

  goBack: () => {
    const prev = get().previousView;
    if (prev) set({ currentView: prev, previousView: null });
  },

  // ─── USUARIO ─────────────────────────────────────────────
  setUser: (user) => set({ user }),

  login: (user) =>
    set({ user, isAuthenticated: true, currentView: "dashboard" }),

  // ✅ logout limpia localStorage
  logout: () => {
    localStorage.removeItem("cubax_token");
    localStorage.removeItem("cubax_refresh_token");
    localStorage.removeItem("cubax_uid");

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

  // ─── WALLET DATA ─────────────────────────────────────────
  setWalletData: (firestoreBalances, depositAddresses = {}) => {
    const currentPrices = get().prices;
    const updatedBalances: CryptoBalance[] = Object.entries(
      firestoreBalances
    ).map(([asset, amount]) => {
      const cryptoPriceInfo = currentPrices.find(
        (p) => p.symbol.toUpperCase() === asset.toUpperCase()
      );
      const priceUSD = cryptoPriceInfo ? cryptoPriceInfo.priceUSD : 1.0;
      return {
        asset:    asset.toUpperCase() as any,
        amount,
        usdValue: amount * priceUSD,
      };
    });

    set({
      balances:         updatedBalances,
      depositAddresses: { ...get().depositAddresses, ...depositAddresses },
    });
  },

  setPrices: (prices) => set({ prices }),

  // ─── FETCH PRICES — COINGECKO ────────────────────────────
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
        {
          id:        "1",
          symbol:    "USDT",
          name:      "Tether",
          priceUSD:  data.tether?.usd            ?? 1.00,
          change24h: data.tether?.usd_24h_change ?? 0,
        },
        {
          id:        "2",
          symbol:    "USDC",
          name:      "USD Coin",
          priceUSD:  data["usd-coin"]?.usd            ?? 1.00,
          change24h: data["usd-coin"]?.usd_24h_change ?? 0,
        },
        {
          id:        "3",
          symbol:    "BTC",
          name:      "Bitcoin",
          priceUSD:  data.bitcoin?.usd            ?? 67500,
          change24h: data.bitcoin?.usd_24h_change ?? 0,
        },
        {
          id:        "4",
          symbol:    "ETH",
          name:      "Ethereum",
          priceUSD:  data.ethereum?.usd            ?? 3500,
          change24h: data.ethereum?.usd_24h_change ?? 0,
        },
      ];

      set({ prices, loadingPrices: false });
      console.log("✅ [Prices] Actualizados desde CoinGecko");

    } catch (error) {
      console.error("❌ [Prices] Error fetchPrices:", error);
      set({
        loadingPrices: false,
        prices: [
          { id: "1", symbol: "USDT", name: "Tether",   priceUSD: 1.00,  change24h: 0    },
          { id: "2", symbol: "USDC", name: "USD Coin",  priceUSD: 1.00,  change24h: 0    },
          { id: "3", symbol: "BTC",  name: "Bitcoin",   priceUSD: 67500, change24h: 0.5  },
          { id: "4", symbol: "ETH",  name: "Ethereum",  priceUSD: 3500,  change24h: -0.2 },
        ],
      });
    }
  },

  // ─── FETCH DEPOSIT ADDRESS — TRONGRID ────────────────────
  // ✅ Cambiado de CoinEx a TronGrid
  fetchDepositAddress: async (asset: string, _chain: string) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado") return;

    const assetKey = asset.toUpperCase();

    // Solo USDT soportado por TronGrid actualmente
    if (assetKey !== "USDT") return;

    // Si ya tiene dirección no pedir de nuevo
    if (get().depositAddresses[assetKey]) return;

    try {
      const response = await fetch(`${RENDER_API_URL}/tron/deposit-address`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid }),
      });

      const data = await response.json();

      if (data?.success && data?.coin_address) {
        set({
          depositAddresses: {
            ...get().depositAddresses,
            [assetKey]: data.coin_address,
          },
        });
        console.log(`✅ Dirección TRC20: ${data.coin_address}`);
      } else {
        console.warn(`⚠️ Sin dirección para ${assetKey}:`, data?.error);
      }
    } catch (error) {
      console.error("❌ [fetchDepositAddress] Error:", error);
    }
  },

  // ─── REQUEST DEPOSIT — TRONGRID ──────────────────────────
  // ✅ Cambiado de CoinEx a TronGrid
  requestDeposit: async (asset: string) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado") {
      return { success: false, message: "No hay un usuario autenticado." };
    }

    const assetKey = asset.toUpperCase();

    // Solo USDT soportado actualmente
    if (assetKey !== "USDT") {
      return {
        success: false,
        message: "Solo USDT/TRC20 está disponible actualmente.",
      };
    }

    // Ver si ya tiene dirección en cache
    const cached = get().depositAddresses[assetKey];
    if (cached) {
      return { success: true, address: cached, message: "Dirección desde cache." };
    }

    try {
      const response = await fetch(`${RENDER_API_URL}/tron/deposit-address`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid }),
      });

      const resData = await response.json();

      if (resData?.success && resData?.coin_address) {
        const updatedAddresses = {
          ...get().depositAddresses,
          [assetKey]: resData.coin_address,
        };
        set({
          depositAddresses: updatedAddresses,
          user: currentUser
            ? { ...currentUser, depositAddresses: updatedAddresses }
            : null,
        });
        return {
          success: true,
          address: resData.coin_address,
          message: "Dirección obtenida.",
        };
      }

      return {
        success: false,
        message: resData?.error || "Error obteniendo dirección.",
      };
    } catch {
      return { success: false, message: "Error de conexión con backend." };
    }
  },

  // ─── REQUEST WITHDRAWAL — TRONGRID ───────────────────────
  // ✅ Cambiado de Firestore directo a backend TronGrid
  requestWithdrawal: async (asset, amount, toAddress, _chain) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado") {
      return { success: false, message: "Operación no válida." };
    }

    // Solo USDT soportado actualmente
    if (asset.toUpperCase() !== "USDT") {
      return {
        success: false,
        message: "Solo retiros de USDT/TRC20 están disponibles actualmente.",
      };
    }

    // Validar dirección TRC20
    if (!toAddress.startsWith("T")) {
      return {
        success: false,
        message: "La dirección debe ser TRC20 y empezar con T.",
      };
    }

    try {
      const response = await fetch(`${RENDER_API_URL}/tron/withdraw`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid:       currentUser.uid,
          toAddress,
          amount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          txId:    data.txHash,
          message: "Retiro procesado exitosamente.",
        };
      }

      return {
        success: false,
        message: data.error || "Error procesando el retiro.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error de conexión con backend.",
      };
    }
  },

  // ─── ÓRDENES ─────────────────────────────────────────────
  setOrders:      (orders) => set({ orders }),
  addOrder:       (order)  => set({ orders: [order, ...get().orders] }),
  setActiveTrade: (trade)  => set({ activeTrade: trade }),

  // ─── TRADE STATUS ────────────────────────────────────────
  updateTradeStatus: async (tradeId, status) => {
    if (!tradeId) return;
    try {
      await updateDoc(doc(db, "trades", tradeId), {
        status,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error actualizando estado del trade:", error);
    }
  },

  // ─── CHAT P2P ────────────────────────────────────────────
  setTradeMessages: (messages) => set({ tradeMessages: messages }),
  addMessage:       (message)  =>
    set({ tradeMessages: [...get().tradeMessages, message] }),

  subscribeToTradeMessages: (tradeId: string) => {
    if (!tradeId) return () => {};

    const q = query(
      collection(db, "trades", tradeId, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id:         docSnap.id,
          tradeId,
          senderId:   data.senderId   ?? "SYSTEM",
          senderName: data.senderName ?? "Sistema",
          text:       data.text       ?? data.message ?? "",
          createdAt:  data.createdAt  ?? data.timestamp ?? Date.now(),
          type:       data.type       ?? "text",
        };
      });
      set({ tradeMessages: messages });
    });
  },

  sendMessage: async (tradeId: string, text: string) => {
    const currentUser = get().user;
    if (!currentUser?.uid || !tradeId || !text.trim()) return;
    try {
      await addDoc(collection(db, "trades", tradeId, "messages"), {
        senderId:   currentUser.uid,
        senderName: currentUser.displayName || "Usuario",
        text:       text.trim(),
        createdAt:  Date.now(),
        type:       "text",
      });
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  },

  // ─── PRODUCTOS ───────────────────────────────────────────
  setProducts: (products) => set({ products }),
  addProduct:  (product)  => set({ products: [product, ...get().products] }),

  deleteProduct: async (productId: string) => {
    try {
      await updateDoc(doc(db, "products", productId), {
        status:      "cancelled",
        cancelledAt: Date.now(),
      });
      console.log(`✅ Producto ${productId} cancelado en Firestore`);
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error);
    }
  },

  subscribeToProducts: () => {
    const q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const productsList: Product[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Product));
        set({ products: productsList });
        console.log(`✅ [Products] ${productsList.length} productos`);
      },
      (error) => {
        console.error("❌ [Products] Error en snapshot:", error);
      }
    );
  },

  // ─── NOTIFICACIONES ──────────────────────────────────────
  setNotifications: (notifications) => set({ notifications }),

  subscribeToNotifications: (userId: string) => {
    if (!userId || userId === "invitado") return () => {};

    const q = query(
      collection(db, "notifications"),
      where("userId",      "==", userId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: Notification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id:        docSnap.id,
            userId:    data.userId    ?? userId,
            title:     data.title     ?? "",
            body:      data.body      ?? data.message ?? "",
            type:      data.type      ?? "system",
            read:      data.read      ?? false,
            createdAt: data.createdAt ?? Date.now(),
            data:      data.data      ?? {},
            link:      data.link,
          } as Notification;
        });
        set({ notifications: list });
      },
      (error) => {
        console.error("❌ Error en snapshot de notificaciones:", error);
      }
    );
  },

  markNotificationRead: async (id) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      });
    } catch (error) {
      console.error("Error al marcar notificación:", error);
    }
  },

  // ─── UTILIDADES ──────────────────────────────────────────
  setSelectedTradeId:   (id)      => set({ selectedTradeId:   id }),
  setSelectedProductId: (id)      => set({ selectedProductId: id }),
  setLoading:           (loading) => set({ isLoading:         loading }),
  setMobileMenuOpen:    (open)    => set({ mobileMenuOpen:    open }),
  setModalOpen:         (open)    => set({ modalOpen:         open }),
}));
