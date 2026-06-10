import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { P2PPage } from "@/pages/P2PPage";
import { CreateOrderPage } from "@/pages/CreateOrderPage";
import { TradePage } from "@/pages/TradePage";
import { KYCPage } from "@/pages/KYCPage";
import { MarketplacePage } from "@/pages/MarketplacePage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { CreateProductPage } from "@/pages/CreateProductPage";
import { WalletPage } from "@/pages/WalletPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";

// 1. Vista de administración
import { AdminKYCPage } from "@/pages/AdminKYCPage";

// Sincronización en tiempo real con Firebase Auth y Firestore
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Integración de Firebase Cloud Messaging (Notificaciones Push)
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase/messaging";

import { MOCK_USER, MOCK_BALANCES } from "@/data/mock";
import type { User as AppUser } from "@/types";

// Variable global para controlar la desensamblación del listener de Firestore
let unsubscribeNotifications: (() => void) | null = null;

function AppContent() {
  const { currentView, user, navigate } = useAppStore();

  const viewTitles: Record<string, string> = {
    dashboard: "",
    p2p: "",
    marketplace: "",
    "create-order": "Nueva oferta P2P",
    trade: "Trade en curso",
    kyc: "Verificación KYC",
    "product-detail": "Detalle del producto",
    "create-product": "Publicar producto",
    wallet: "Mi Wallet",
    settings: "Perfil",
    notifications: "Notificaciones",
    "admin-kyc": "Panel de Control KYC", 
  };

  const showBackViews = [
    "create-order",
    "trade",
    "kyc",
    "product-detail",
    "create-product",
    "notifications",
    "admin-kyc", 
  ];

  const authenticatedViews = [
    "dashboard",
    "p2p",
    "marketplace",
    "create-order",
    "trade",
    "kyc",
    "product-detail",
    "create-product",
    "wallet",
    "settings",
    "notifications",
    "admin-kyc", 
  ];

  // Interceptor de seguridad del lado del cliente para la ruta Admin
  useEffect(() => {
    if (currentView === "admin-kyc" && user?.role !== "admin") {
      navigate("dashboard");
    }
  }, [currentView, user, navigate]);

  // Escuchador nativo para notificaciones push en primer plano (App abierta)
  useEffect(() => {
    const unsubscribePushForeground = onForegroundMessage((payload) => {
      console.log("Push recibido en primer plano:", payload);
      if (payload.notification) {
        alert(`🔔 ${payload.notification.title}\n${payload.notification.body}`);
      }
    });

    return () => {
      if (unsubscribePushForeground) unsubscribePushForeground();
    };
  }, []);

  if (authenticatedViews.includes(currentView) && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse font-medium">
          Sincronizando perfil de usuario...
        </p>
      </div>
    );
  }

  const showBottomNav = authenticatedViews.includes(currentView);

  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login" || currentView === "register") return <AuthPage />;

  return (
    <>
      <Header
        title={viewTitles[currentView]}
        showBack={showBackViews.includes(currentView)}
      />
      <main className="min-h-[calc(100vh-3.5rem-4rem)]">
        {currentView === "dashboard" && <DashboardPage />}
        {currentView === "p2p" && <P2PPage />}
        {currentView === "create-order" && <CreateOrderPage />}
        {currentView === "trade" && <TradePage />}
        {currentView === "kyc" && <KYCPage />}
        {currentView === "marketplace" && <MarketplacePage />}
        {currentView === "product-detail" && <ProductDetailPage />}
        {currentView === "create-product" && <CreateProductPage />}
        {currentView === "wallet" && <WalletPage />}
        {currentView === "settings" && <SettingsPage />}
        {currentView === "notifications" && <NotificationsPage />}
        
        {currentView === "admin-kyc" && user?.role === "admin" && <AdminKYCPage />}
      </main>
      {showBottomNav && <BottomNav />}
    </>
  );
}

export default function App() {
  const { theme, login, logout, currentView, isAuthenticated, navigate, setBalances } = useAppStore();
  const [authLoading, setAuthLoading] = useState(true);

  // Control estructural del Dark Mode
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Guardián Central de Sesión + Activación de canales de comunicación en tiempo real
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          let loggedUser: AppUser;
          
          if (docSnap.exists()) {
            loggedUser = docSnap.data() as AppUser;
          } else {
            // Aseguramos la creación del documento base si el usuario es totalmente nuevo
            loggedUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Usuario",
              photoURL: firebaseUser.photoURL || null,
              kycStatus: "unverified",
              createdAt: Date.now(),
              totalTrades: 0,
              rating: 5.0,
              walletAddress: null,
              role: "user",
            };
            await setDoc(userDocRef, loggedUser);
          }

          Object.assign(MOCK_USER, loggedUser);
          setBalances(MOCK_BALANCES);

          // ➡️ 1. CONEXIÓN REAL FIRESTORE NOTIFICATIONS
          if (unsubscribeNotifications) unsubscribeNotifications();
          unsubscribeNotifications = useAppStore.getState().subscribeToNotifications(firebaseUser.uid);

          // ➡️ 2. LOGIN DE ZUSTAND PRIMERO (Estabiliza el estado de la app)
          login(loggedUser);

          // ➡️ 3. REGISTRO ASÍNCRONO SEGURO DEL TOKEN PUSH
          // Lo ejecutamos con un pequeño retraso para asegurar que las reglas de la BD no reboten la petición
          if (firebaseUser.uid !== "invitado") {
            setTimeout(() => {
              requestNotificationPermission(firebaseUser.uid).catch((err) =>
                console.error("Registro push silenciado para evitar bloqueos:", err)
              );
            }, 300);
          }

        } else {
          if (unsubscribeNotifications) {
            unsubscribeNotifications();
            unsubscribeNotifications = null;
          }
          Object.keys(MOCK_USER).forEach((key) => delete (MOCK_USER as any)[key]);
          logout();
        }
      } catch (error) {
        console.error("Error controlando sesión de Firebase:", error);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [login, logout, setBalances]);

  // Redirección automática de seguridad para rutas públicas estando logueado
  useEffect(() => {
    if (isAuthenticated && ["landing", "login", "register"].includes(currentView)) {
      navigate("dashboard");
    }
  }, [isAuthenticated, currentView, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-navy-950 flex flex-col items-center justify-center">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-4 animate-bounce shadow-lg shadow-brand-500/20">
          <span className="text-white font-black text-xl">CX</span>
        </div>
        <div className="h-1 w-24 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme === "dark" ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-white transition-colors duration-300">
        <AppContent />
      </div>
    </div>
  );
      }
        
