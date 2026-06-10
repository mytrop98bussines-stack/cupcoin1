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

// Importaciones de Firebase para las notificaciones reales
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
  walletConnected: boolean;
  walletAddress: string | null;
  selectedTradeId: string | null;
  selectedProductId: string | null;
  isLoading: boolean;
  mobileMenuOpen: boolean;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  navigate: (view: AppView) => void;
  goBack: () => void;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  setBalances: (balances: CryptoBalance[]) => void;
  setPrices: (prices: CryptoPrice[]) => void;
  setOrders: (orders: P2POrder[]) => void;
  addOrder: (order: P2POrder) => void;
  setActiveTrade: (trade: Trade | null) => void;
  updateTradeStatus: (status: Trade["status"]) => void;
  setTradeMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  
  // Métodos de notificaciones actualizados para Firebase
  setNotifications: (notifications: Notification[]) => void;
  subscribeToNotifications: (userId: string) => (() => void);
  markNotificationRead: (id: string) => Promise<void>;
  
  setWallet: (connected: boolean, address: string | null) => void;
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
  prices: [],
  orders: [],
  activeTrade: null,
  tradeMessages: [],
  products: [],
  notifications: [],
  walletConnected: false,
  walletAddress: null,
  selectedTradeId: null,
  selectedProductId: null,
  isLoading: false,
  mobileMenuOpen: false,

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
      walletConnected: false,
      walletAddress: null,
      notifications: [],
      activeTrade: null,
    }),

  setBalances: (balances) => set({ balances }),
  setPrices: (prices) => set({ prices }),
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

  // ========================================================
  // ESCUCHADOR REAL DE NOTIFICACIONES DESDE FIRESTORE
  // ========================================================
  subscribeToNotifications: (userId: string) => {
    if (!userId || userId === "invitado") return () => {};

    // Apuntamos a la subcolección interna: users/{uid}/notifications
    const q = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc")
    );

    // Abrimos el canal en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      snapshot.forEach((doc) => {
        notificationsList.push({ id: doc.id, ...doc.data() } as Notification);
      });
      
      // Actualizamos Zustand automáticamente cada vez que cambie algo en la DB
      set({ notifications: notificationsList });
    }, (error) => {
      console.error("Error en Snapshot de notificaciones:", error);
    });

    return unsubscribe; // Nos permite cerrarlo desde App.tsx en el logout
  },

  // ========================================================
  // ACTUALIZACIÓN DE LECTURA ASÍNCRONA EN FIRESTORE
  // ========================================================
  markNotificationRead: async (id) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado") return;

    try {
      // Referencia al documento específico dentro de la subcolección del usuario
      const notifRef = doc(db, "users", currentUser.uid, "notifications", id);
      
      // Impactamos la base de datos de Firebase cambiando 'read' a true
      await updateDoc(notifRef, { read: true });

      // Modificación optimista local en Zustand para mantener la UI instantánea
      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      });
    } catch (error) {
      console.error("Error al marcar notificación como leída en Firebase:", error);
    }
  },

  setWallet: (connected, address) =>
    set({ walletConnected: connected, walletAddress: address }),
  setSelectedTradeId: (id) => set({ selectedTradeId: id }),
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
      
