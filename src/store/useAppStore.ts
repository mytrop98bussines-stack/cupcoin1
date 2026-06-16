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
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// 🚀 ENLACE OFICIAL A TU BACKEND EN REPLIT
const REPLIT_API_URL = "https://9135d135-ea80-4a99-9924-bbd7c9f38add-00-3lqvjidfldz1p.worf.replit.dev/api";

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
  
  // 🏦 MODELO COINEX: Direcciones de depósito asignadas dinámicamente o leídas del perfil
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
  
  // 🏦 COINEX GATEWAY OPERATIONS (Alineadas de forma reactiva con el listener del backend)
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

  fetchPrices: async () => {
    set({ loadingPrices: true });
    try {
      const response = await fetch(`${REPLIT_API_URL}/coinex/balance`);
      if (!response.ok) throw new Error(`Error al conectar con Replit API`);
      const json = await response.json();

      if (json.prices && Array.isArray(json.prices)) {
        set({ prices: json.prices, loadingPrices: false });
      } else {
        set({ loadingPrices: false });
      }
    } catch (error) {
      console.error("Fallo al consultar Replit, aplicando precios de rescate para evitar pantalla blanca:", error);
      
      const fallbackPrices: CryptoPrice[] = [
        { id: "1", symbol: "USDT", name: "Tether", priceUSD: 1.00, change24h: 0 },
        { id: "2", symbol: "USDC", name: "USD Coin", priceUSD: 1.00, change24h: 0 },
        { id: "3", symbol: "BTC", name: "Bitcoin", priceUSD: 66800.00, change24h: 0.5 },
        { id: "4", symbol: "ETH", name: "Ethereum", priceUSD: 3450.00, change24h: -0.2 },
      ];
      set({ prices: fallbackPrices, loadingPrices: false });
    }
  },

  // 📥 REPARADOR AUTOMÁTICO DE USUARIO REAL: Inyecta mapas financieros sin romper el KYC existente
  fetchDepositAddress: async (asset, chain) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado" || currentUser.uid === "{uid}") return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const address = userData.depositAddresses?.[asset.toUpperCase()];
        
        // Si el usuario ya tiene la dirección asignada por CoinEx, la actualizamos localmente
        if (address) {
          set((state) => ({
            depositAddresses: { ...state.depositAddresses, [asset.toUpperCase()]: address }
          }));
          return;
        }

        // Si el documento existe pero le faltan los mapas financieros esenciales, se los inyectamos de forma segura
        if (!userData.balances || !userData.depositAddresses) {
          console.log(`[Firebase] Fusionando esquemas de Wallet en el usuario real: ${currentUser.uid}`);
          await setDoc(userDocRef, {
            balances: userData.balances || { USDT: 0, USDC: 0, BTC: 0, ETH: 0 },
            depositAddresses: userData.depositAddresses || { USDT: "", USDC: "", BTC: "", ETH: "" }
          }, { merge: true });
        }
      }
      console.warn(`[Wallet] Estructura lista en el usuario real. Esperando que Replit procese y asigne la wallet de ${asset}.`);
    } catch (error) {
      console.error("Error gestionando el documento del usuario real en Firestore:", error);
    }
  },

  // 📤 FUNDADOR ATÓMICO DE RETIROS: Fuerza la creación de la colección withdrawals usando un ID personalizado
  requestWithdrawal: async (asset, amount, toAddress, chain) => {
    const currentUser = get().user;
    if (!currentUser?.uid || currentUser.uid === "invitado" || currentUser.uid === "{uid}") {
      return { success: false, message: "Operación no permitida o ID de usuario no válido." };
    }

    try {
      // Forzamos la creación del documento utilizando setDoc sobre una referencia con ID automático
      const withdrawalCollectionRef = collection(db, "withdrawals");
      const newWithdrawalDocRef = doc(withdrawalCollectionRef); 

      const withdrawalRequest = {
        id: newWithdrawalDocRef.id,
        userId: currentUser.uid,
        asset: asset.toUpperCase(),
        amount: amount,
        destinationAddress: toAddress,
        chain: chain ? chain.toUpperCase() : "TRC20",
        status: "pending", 
        intentos: 0,
        createdAt: Date.now()
      };

      // Esto asegura la creación inmediata de la colección en la raíz de Firestore
      await setDoc(newWithdrawalDocRef, withdrawalRequest);
      console.log(`[Retiros] Solicitud 'pending' enviada con éxito. ID Documento: ${newWithdrawalDocRef.id}`);
      
      return { 
        success: true, 
        txId: newWithdrawalDocRef.id, 
        message: "Solicitud registrada de forma atómica. El motor de CubaX está procesando el envío." 
      };
    } catch (error: any) {
      console.error("Error crítico al inyectar retiro en la colección raíz de Firestore:", error);
      let friendlyMessage = error.message || "Error de red con el proveedor de bases de datos.";
      if (error.code === "permission-denied") {
        friendlyMessage = "Escritura denegada. Revisa que tus Reglas de Seguridad permitan escribir en la colección 'withdrawals'.";
      }
      return { 
        success: false, 
        message: friendlyMessage 
      };
    }
  },

  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set({ orders: [order, ...get().orders] }),
  setActiveTrade: (trade) => set({ activeTrade: trade }),

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
  
