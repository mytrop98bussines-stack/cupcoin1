import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

// ─── Componente Interno del Logo de CubaX ─────────────────
function CubaXLogo({ size = 48 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15 15H42L85 85H58L15 15Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
      <path d="M85 15H58L45.5 35L57.5 45L85 15Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
      <path d="M15 85H42L54.5 65L42.5 55L15 85Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
    </svg>
  );
}

// ─── Páginas públicas y principales ───────────────────────
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

// ─── Páginas de configuración ─────────────────────────────
import { ProfilePage }              from "@/pages/ProfilePage";
import { SecurityPage }             from "@/pages/SecurityPage";
import { HelpPage }                 from "@/pages/HelpPage";
import { TermsPage }                from "@/pages/TermsPage";
import { LanguagePage }             from "@/pages/LanguagePage";
import { NotificationSettingsPage } from "@/pages/NotificationSettingsPage";
import { TradeHistoryPage }         from "@/pages/TradeHistoryPage";
import { MyOrdersPage }             from "@/pages/MyOrdersPage";

// ─── Admin ────────────────────────────────────────────────
import { AdminKYCPage }       from "@/pages/AdminKYCPage";
import { AdminDisputesPage } from "@/components/admin/AdminDisputesPage";

// ─── Firebase y Utils ─────────────────────────────────────
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import type { User as AppUser } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com";

const VIEW_TITLES: Record<string, string> = {
  dashboard:               "",
  p2p:                     "",
  marketplace:             "",
  "create-order":          "Nueva oferta P2P",
  trade:                   "Trade en curso",
  kyc:                     "Verificación KYC",
  "product-detail":        "Detalle del producto",
  "create-product":        "Publicar producto",
  wallet:                  "Mi Wallet",
  settings:                "Ajustes",
  notifications:           "Notificaciones",
  "admin-kyc":             "Panel KYC Admin",
  "admin-disputes":        "Panel Disputas Admin",
  profile:                 "Mi Perfil",
  security:                "Seguridad",
  help:                    "Centro de ayuda",
  terms:                   "Términos y Privacidad",
  language:                "Idioma",
  "notification-settings": "Notificaciones",
  "trade-history":         "Historial de Trades",
  "my-orders":             "Mis Anuncios P2P",
  membership:              "Membresía CubaX",
};

const SHOW_BACK_VIEWS = [
  "create-order", "trade", "kyc", "product-detail", "create-product", "notifications",
  "admin-kyc", "admin-disputes", "profile", "security", "help", "terms", "language",
  "notification-settings", "trade-history", "my-orders", "membership",
];

const AUTHENTICATED_VIEWS = [
  "dashboard", "p2p", "marketplace", "create-order", "trade", "kyc", "product-detail",
  "create-product", "wallet", "settings", "notifications", "admin-kyc", "admin-disputes",
  "profile", "security", "help", "terms", "language", "notification-settings",
  "trade-history", "my-orders", "membership",
];

function AppContent() {
  const { currentView, user, navigate, modalOpen, setWalletData, theme } = useAppStore();

  // ─── Sincronización del Modo Oscuro ─────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ─── Sincronización en tiempo real (Balances y Usuario) ───
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

  // ─── Seguridad: solo admin ────────────────────────────────
  useEffect(() => {
    if ((currentView === "admin-kyc" || currentView === "admin-disputes") && user?.role !== "admin") {
      navigate("dashboard");
    }
  }, [currentView, user, navigate]);

  // CORREGIDO: Pantalla de carga autenticando con el nuevo logo
  if (AUTHENTICATED_VIEWS.includes(currentView) && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-white gap-4">
        <CubaXLogo size={48} />
        <p className="text-sm font-semibold tracking-wide animate-pulse">Sincronizando cuenta...</p>
      </div>
    );
  }

  const isAdminView = currentView.startsWith("admin-");
  const showBottomNav = AUTHENTICATED_VIEWS.includes(currentView) && !isAdminView;

  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login" || currentView === "register") return <AuthPage />;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-black">
      <Header title={VIEW_TITLES[currentView] || ""} showBack={SHOW_BACK_VIEWS.includes(currentView)} />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-16">
        {currentView === "dashboard"      && <DashboardPage />}
        {currentView === "p2p"            && <P2PPage />}
        {currentView === "create-order"   && <CreateOrderPage />}
        {currentView === "trade"          && <TradePage />}
        {currentView === "kyc"            && <KYCPage />}
        {currentView === "marketplace"    && <MarketplacePage />}
        {currentView === "product-detail" && <ProductDetailPage />}
        {currentView === "create-product" && <CreateProductPage />}
        {currentView === "wallet"         && <WalletPage />}
        {currentView === "settings"       && <SettingsPage />}
        {currentView === "notifications"  && <NotificationsPage />}
        {currentView === "membership"     && <MembershipPage />}
        {currentView === "profile"        && <ProfilePage />}
        {currentView === "security"       && <SecurityPage />}
        {currentView === "help"           && <HelpPage />}
        {currentView === "terms"          && <TermsPage />}
        {currentView === "language"       && <LanguagePage />}
        {currentView === "notification-settings" && <NotificationSettingsPage />}
        {currentView === "trade-history"  && <TradeHistoryPage />}
        {currentView === "my-orders"      && <MyOrdersPage />}
        {currentView === "admin-kyc"      && user?.role === "admin" && <AdminKYCPage />}
        {currentView === "admin-disputes" && user?.role === "admin" && <AdminDisputesPage />}
      </main>

      {showBottomNav && !modalOpen && <BottomNav />}
    </div>
  );
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { setUser, navigate } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Usuario",
        } as any);

        const lastView = localStorage.getItem("cubax_last_view") || "dashboard";
        
        if (lastView === "landing" || lastView === "login" || lastView === "register") {
          navigate("dashboard");
        } else {
          navigate(lastView as any);
        }
      } else {
        localStorage.removeItem("cubax_last_view");
        navigate("landing");
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser, navigate]);

  // CORREGIDO: Pantalla de inicialización de la App ("Cargando CubaX") optimizada con SVG y fondo oscuro puro
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-white gap-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <CubaXLogo size={56} />
          <h2 className="text-lg font-black tracking-tight mt-1">
            Cargando <span className="text-brand-500">CubaX</span>
          </h2>
        </div>
      </div>
    );
  }

  return <AppContent />;
        }
