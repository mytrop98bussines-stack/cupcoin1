import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header }     from "@/components/layout/Header";
import { BottomNav }  from "@/components/layout/BottomNav";
import { WifiOff }    from "lucide-react";

// ─── Logo ─────────────────────────────────────────────────
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

// ─── Páginas públicas ─────────────────────────────────────
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage }    from "@/pages/AuthPage";

// ─── Páginas principales ──────────────────────────────────
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
import { PublicProfilePage } from "@/pages/PublicProfilePage"; // ← nuevo

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
import { AdminKYCPage }      from "@/pages/AdminKYCPage";
import { AdminDisputesPage } from "@/components/admin/AdminDisputesPage";

import type { User as AppUser } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com";

// =========================================================
// CONFIGURACIÓN DE VISTAS
// =========================================================
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
  "public-profile":        "Perfil",              // ← nuevo
};

const SHOW_BACK_VIEWS = [
  "create-order", "trade", "kyc", "product-detail",
  "create-product", "notifications", "admin-kyc",
  "admin-disputes", "profile", "security", "help",
  "terms", "language", "notification-settings",
  "trade-history", "my-orders", "membership",
  "public-profile",                               // ← nuevo
];

const AUTHENTICATED_VIEWS = [
  "dashboard", "p2p", "marketplace", "create-order",
  "trade", "kyc", "product-detail", "create-product",
  "wallet", "settings", "notifications", "admin-kyc",
  "admin-disputes", "profile", "security", "help",
  "terms", "language", "notification-settings",
  "trade-history", "my-orders", "membership",
  "public-profile",                               // ← nuevo
];

// =========================================================
// APP CONTENT
// =========================================================
function AppContent() {
  const {
    currentView,
    user,
    navigate,
    modalOpen,
    setWalletData,
    theme,
    fetchOrders,
    fetchProducts,
    subscribeToNotifications,
  } = useAppStore();

  // ─── Detector de conexión ─────────────────────────────────
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  // ─── Modo oscuro ──────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ─── Sincronización via backend ───────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    let stopped = false;

    const syncUser = async () => {
      if (stopped) return;
      try {
        const res  = await fetch(`${BACKEND_URL}/api/auth/me`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ uid: user.uid }),
        });
        const data = await res.json();

        if (data.success && data.userData && !stopped) {
          const fullUserData = data.userData as AppUser;
          useAppStore.setState({ user: fullUserData });

          const balances         = (fullUserData as any).balances         || { USDT: 0, BTC: 0, ETH: 0, USDC: 0 };
          const depositAddresses = (fullUserData as any).depositAddresses || {};
          setWalletData(balances, depositAddresses);
        }
      } catch (err) {
        console.warn("⚠️ Error sincronizando usuario:", err);
      }
    };

    void syncUser();
    const intervalId = window.setInterval(syncUser, 30000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [user?.uid, setWalletData]);

  // ─── Cargar datos iniciales ───────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    void fetchOrders();
    void fetchProducts();
    const unsubNotifs = subscribeToNotifications(user.uid);

    return () => { unsubNotifs(); };
  }, [user?.uid]);

  // ─── Seguridad: solo admin ────────────────────────────────
  useEffect(() => {
    if (
      (currentView === "admin-kyc" || currentView === "admin-disputes") &&
      user?.role !== "admin"
    ) {
      navigate("dashboard");
    }
  }, [currentView, user, navigate]);

  // ─── Loading ──────────────────────────────────────────────
  if (AUTHENTICATED_VIEWS.includes(currentView) && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black gap-4">
        <CubaXLogo size={48} />
        <p className="text-sm font-semibold tracking-wide animate-pulse text-gray-900 dark:text-white">
          Sincronizando cuenta...
        </p>
      </div>
    );
  }

  const isAdminView   = currentView.startsWith("admin-");
  const showBottomNav = AUTHENTICATED_VIEWS.includes(currentView) && !isAdminView;

  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login" || currentView === "register") return <AuthPage />;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-black">

      {/* ✅ Banner offline */}
      {isOffline && (
        <div className="w-full bg-amber-500 text-white text-xs font-bold text-center py-2 px-4 flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
          Sin conexión — mostrando datos guardados
        </div>
      )}

      <Header
        title={VIEW_TITLES[currentView] || ""}
        showBack={SHOW_BACK_VIEWS.includes(currentView)}
      />

      <main
        className="flex-1 min-h-0 overflow-y-auto pb-16"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY:     "auto",
          overscrollBehaviorX:     "none",
        }}
      >
        {currentView === "dashboard"       && <DashboardPage />}
        {currentView === "p2p"             && <P2PPage />}
        {currentView === "create-order"    && <CreateOrderPage />}
        {currentView === "trade"           && <TradePage />}
        {currentView === "kyc"             && <KYCPage />}
        {currentView === "marketplace"     && <MarketplacePage />}
        {currentView === "product-detail"  && <ProductDetailPage />}
        {currentView === "create-product"  && <CreateProductPage />}
        {currentView === "wallet"          && <WalletPage />}
        {currentView === "settings"        && <SettingsPage />}
        {currentView === "notifications"   && <NotificationsPage />}
        {currentView === "membership"      && <MembershipPage />}
        {currentView === "profile"         && <ProfilePage />}
        {currentView === "security"        && <SecurityPage />}
        {currentView === "help"            && <HelpPage />}
        {currentView === "terms"           && <TermsPage />}
        {currentView === "language"        && <LanguagePage />}
        {currentView === "notification-settings" && <NotificationSettingsPage />}
        {currentView === "trade-history"   && <TradeHistoryPage />}
        {currentView === "my-orders"       && <MyOrdersPage />}
        {currentView === "public-profile"  && <PublicProfilePage />}  {/* ← nuevo */}
        {currentView === "admin-kyc"       && user?.role === "admin" && <AdminKYCPage />}
        {currentView === "admin-disputes"  && user?.role === "admin" && <AdminDisputesPage />}
      </main>

      {showBottomNav && !modalOpen && <BottomNav />}
    </div>
  );
}

// =========================================================
// APP ROOT
// =========================================================
export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { navigate }                        = useAppStore();

  useEffect(() => {
    const savedToken = localStorage.getItem("cubax_token");
    const savedUid   = localStorage.getItem("cubax_uid");

    if (savedToken && savedUid) {
      fetch(`${BACKEND_URL}/api/auth/me`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: savedUid }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.userData) {
            const lastView = localStorage.getItem("cubax_last_view") || "dashboard";
            const safeView = AUTHENTICATED_VIEWS.includes(lastView)
              ? lastView
              : "dashboard";

            useAppStore.setState({
              user:            data.userData as AppUser,
              isAuthenticated: true,
              currentView:     safeView as any,
            });
          } else {
            localStorage.removeItem("cubax_token");
            localStorage.removeItem("cubax_refresh_token");
            localStorage.removeItem("cubax_uid");
            localStorage.removeItem("cubax_last_view");
            localStorage.removeItem("cubax_email");
            localStorage.removeItem("cubax_name");
            navigate("landing");
          }
        })
        .catch((err) => {
          console.warn("⚠️ Error restaurando sesión:", err.message);

          const emailSaved = localStorage.getItem("cubax_email");
          const nameSaved  = localStorage.getItem("cubax_name");

          if (emailSaved) {
            useAppStore.setState({
              user: {
                uid:           savedUid,
                email:         emailSaved,
                displayName:   nameSaved || "Usuario",
                photoURL:      null,
                kycStatus:     "unverified",
                createdAt:     Date.now(),
                totalTrades:   0,
                rating:        5.0,
                walletAddress: null,
                role:          "user",
              } as AppUser,
              isAuthenticated: true,
              currentView:     "dashboard",
            });
          } else {
            navigate("landing");
          }
        })
        .finally(() => setIsInitializing(false));

    } else {
      navigate("landing");
      setIsInitializing(false);
    }
  }, []);

  // ─── Refrescar token cada 50 minutos ─────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem("cubax_refresh_token");
      if (!refreshToken) return;

      try {
        const res  = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ refreshToken }),
        });
        const data = await res.json();

        if (data.success) {
          localStorage.setItem("cubax_token",         data.token);
          localStorage.setItem("cubax_refresh_token", data.refreshToken);
          console.log("✅ Token refrescado");
        } else {
          console.warn("⚠️ Token expirado — cerrando sesión");
          useAppStore.getState().logout();
          navigate("landing");
        }
      } catch {
        console.warn("⚠️ Error refrescando token — manteniendo sesión");
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ─── Guardar vista actual ─────────────────────────────────
  const { currentView } = useAppStore();
  useEffect(() => {
    if (AUTHENTICATED_VIEWS.includes(currentView)) {
      localStorage.setItem("cubax_last_view", currentView);
effectively    }
  }, [currentView]);

  // ─── Pantalla de carga ────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black gap-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <CubaXLogo size={56} />
          <h2 className="text-lg font-black tracking-tight mt-1 text-gray-900 dark:text-white">
            Cargando <span className="text-brand-500">CubaX</span>
          </h2>
        </div>
      </div>
    );
  }

  return <AppContent />;
    }
