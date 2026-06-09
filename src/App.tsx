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

// Sincronización en tiempo real con Firebase Auth y Firestore
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { MOCK_USER, MOCK_BALANCES, MOCK_NOTIFICATIONS } from "@/data/mock";
import type { User as AppUser } from "@/types";

function AppContent() {
  const { currentView } = useAppStore();

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
  };

  const showBackViews = [
    "create-order",
    "trade",
    "kyc",
    "product-detail",
    "create-product",
    "notifications",
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
  ];

  const isAuthenticated = authenticatedViews.includes(currentView);

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
      </main>
      {isAuthenticated && <BottomNav />}
    </>
  );
}

export default function App() {
  const { theme, login, logout, currentView, isAuthenticated, navigate, setBalances, setNotifications } = useAppStore();
  const [authLoading, setAuthLoading] = useState(true);

  // 1. Efecto para controlar el modo oscuro
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // 2. Guardián Central de Firebase Auth vinculado a Zustand
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          let loggedUser: AppUser;
          
          if (docSnap.exists()) {
            loggedUser = docSnap.data() as AppUser;
          } else {
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
          };
        }

          // Rellenamos el objeto estático en mock.ts para compatibilidad legacy
          Object.assign(MOCK_USER, loggedUser);

          // Inyectamos estados al Store y ejecutamos la acción login de Zustand
          setBalances(MOCK_BALANCES);
          setNotifications(MOCK_NOTIFICATIONS);
          login(loggedUser);
        } else {
          // Si no hay sesión activa en Firebase, forzamos cierre seguro en el Store
          Object.keys(MOCK_USER).forEach((key) => delete (MOCK_USER as any)[key]);
          logout();
        }
      } catch (error) {
        console.error("Error controlando sesión de Firebase:", error);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [login, logout, setBalances, setNotifications]);

  // 3. Interceptor de redirección para evitar bloqueos del Home
  useEffect(() => {
    if (isAuthenticated && ["landing", "login", "register"].includes(currentView)) {
      navigate("dashboard");
    }
  }, [isAuthenticated, currentView, navigate]);

  // Pantalla de carga mientras se sincroniza Firebase inicialmente
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
                                       
