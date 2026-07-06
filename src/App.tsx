import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

// ... (Todos tus imports de páginas igual que antes)
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage }    from "@/pages/AuthPage";
import { DashboardPage }     from "@/pages/DashboardPage";
import { P2PPage }           from "@/pages/P2PPage";
import { CreateOrderPage }   from "@/pages/CreateOrderPage";
import { TradePage }         from "@/pages/TradePage";
import { KYCPage }           from "@/pages/KYCPage";
import { MarketplacePage }   from "@/pages/MarketplacePage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { CreateProductPage } from "@/pages/CreateProductPage";
import { WalletPage }        from "@/pages/WalletPage";
import { SettingsPage }      from "@/pages/SettingsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { MembershipPage }    from "@/pages/MembershipPage";
import { ProfilePage }              from "@/pages/ProfilePage";
import { SecurityPage }             from "@/pages/SecurityPage";
import { HelpPage }                 from "@/pages/HelpPage";
import { TermsPage }                from "@/pages/TermsPage";
import { LanguagePage }             from "@/pages/LanguagePage";
import { NotificationSettingsPage } from "@/pages/NotificationSettingsPage";
import { TradeHistoryPage }         from "@/pages/TradeHistoryPage";
import { MyOrdersPage }             from "@/pages/MyOrdersPage";
import { AdminKYCPage }       from "@/pages/AdminKYCPage";
import { AdminDisputesPage } from "@/components/admin/AdminDisputesPage";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { User as AppUser } from "@/types";

function AppContent() {
  const { currentView, user, navigate, modalOpen, setWalletData, theme } = useAppStore();

  // ─── 1. GESTIÓN DEL MODO OSCURO (GLOBAL) ────────────────
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // ─── 2. SINCRONIZACIÓN FIREBASE ─────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const fullUserData = docSnap.data() as AppUser;
        useAppStore.setState({ user: fullUserData });
        const balances = (fullUserData as any).balances || { USDT: 0, BTC: 0, ETH: 0, USDC: 0 };
        const depositAddresses = (fullUserData as any).depositAddresses || {};
        setWalletData(balances, depositAddresses);
      }
    });
    return () => unsubscribe();
  }, [user?.uid, setWalletData]);

  // ... (Resto de tu lógica: useEffect seguridad, AUTHENTICATED_VIEWS, etc.)
  
  // ─── SEGURIDAD ───────────────────────────────────────────
  useEffect(() => {
    if ((currentView === "admin-kyc" || currentView === "admin-disputes") && user?.role !== "admin") {
      navigate("dashboard");
    }
  }, [currentView, user, navigate]);

  const isAdminView = currentView.startsWith("admin-");
  const showBottomNav = currentView !== "landing" && currentView !== "login" && currentView !== "register" && !isAdminView;

  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login" || currentView === "register") return <AuthPage />;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
      <Header /> 
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-16">
        {/* ... (Tus renderizados de páginas: <DashboardPage />, etc.) */}
        {currentView === "dashboard" && <DashboardPage />}
        {/* ... resto de vistas ... */}
      </main>
      {showBottomNav && !modalOpen && <BottomNav />}
    </div>
  );
}

export default function App() {
  return <AppContent />;
        }
