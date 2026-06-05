import { useEffect } from "react";
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

// Importaciones para sincronizar Firebase en tiempo real
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
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
  const { theme, login, logout, navigate, setBalances, setNotifications } = useAppStore();

  // 1. Efecto para controlar el modo oscuro (Tu lógica original)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // 2. NUEVO: Guardián Global de Firebase Auth conectado a Zustand
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Si hay una sesión activa, escuchamos Firestore en tiempo real
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        onSnapshot(userDocRef, (docSnap) => {
          let loggedUser: AppUser;
          
          if (docSnap.exists()) {
            loggedUser = docSnap.data() as AppUser;
          } else {
            // Estructura de emergencia si es un registro limpio
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

          // Rellenamos el objeto en mock por compatibilidad estática
          Object.assign(MOCK_USER, loggedUser);

          // Actualizamos Zustand de golpe con los datos reales
          setBalances(MOCK_BALANCES);
          setNotifications(MOCK_NOTIFICATIONS);
          login(loggedUser);
          
          // Rompemos el bucle y nos vamos directo al interior de la dApp
          navigate("dashboard");
        });
      } else {
        // Si no hay sesión, limpiamos el objeto estático y cerramos en el Store
        Object.keys(MOCK_USER).forEach((key) => delete (MOCK_USER as any)[key]);
        logout();
      }
    });

    return () => unsubscribe();
  }, [login, logout, navigate, setBalances, setNotifications]);

  return (
    <div className={`${theme === "dark" ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-white transition-colors duration-300">
        <AppContent />
      </div>
    </div>
  );
}
