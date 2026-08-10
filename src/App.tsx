import { useEffect, useState, Component, ReactNode } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header }      from "@/components/layout/Header";
import { BottomNav }   from "@/components/layout/BottomNav";
import { WifiOff, AlertTriangle, RefreshCw } from "lucide-react";
import { requestNotificationPermission }     from "@/lib/firebase/messaging";
import { Logo }                from "@/components/Logo";
import { BiometricLockScreen } from "@/components/BiometricLockScreen";

// ─── Páginas públicas ─────────────────────────────────────
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage }    from "@/pages/AuthPage";

// ─── Páginas principales ──────────────────────────────────
import { DashboardPage }      from "@/pages/DashboardPage";
import { P2PPage }            from "@/pages/P2PPage";
import { CreateOrderPage }    from "@/pages/CreateOrderPage";
import { TradePage }          from "@/pages/TradePage";
import { KYCPage }            from "@/pages/KYCPage";
import { MarketplacePage }    from "@/pages/MarketplacePage";
import { ProductDetailPage }  from "@/pages/ProductDetailPage";
import { CreateProductPage }  from "@/pages/CreateProductPage";
import { WalletPage }         from "@/pages/WalletPage";
import { SettingsPage }       from "@/pages/SettingsPage";
import { NotificationsPage }  from "@/pages/NotificationsPage";
import { MembershipPage }     from "@/pages/MembershipPage";
import { PublicProfilePage }  from "@/pages/PublicProfilePage";
import { HistoryPage }        from "@/pages/HistoryPage";
import { SalesManagementPage } from "@/pages/SalesManagementPage";
import { AdminPromosPage }    from "@/pages/AdminPromosPage";

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
import { AdminUsersPage }    from "@/pages/AdminUsersPage";
import { AdminDisputesPage } from "@/components/admin/AdminDisputesPage";

// ✅ Wallet multi-red
import {
  getWalletAddresses,
  getStoredWalletAddress,
} from "@/lib/wallet/walletStorage";

import type { User as AppUser } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com";

// =========================================================
// ERROR BOUNDARY
// =========================================================
interface ErrorBoundaryState {
  hasError: boolean;
  error:    Error | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("🚨 ErrorBoundary:", error.message);
    console.error("Componente:", errorInfo.componentStack);
  }

  handleReload = () => window.location.reload();

  // ✅ Preservar wallet al limpiar datos
  handleClearAndReload = () => {
    const walletEnc       = localStorage.getItem("cubax_wallet_enc");
    const walletAddresses = localStorage.getItem("cubax_wallet_addresses");
    localStorage.clear();
    if (walletEnc)       localStorage.setItem("cubax_wallet_enc",       walletEnc);
    if (walletAddresses) localStorage.setItem("cubax_wallet_addresses", walletAddresses);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-6 py-8">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Algo salió mal
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ocurrió un error inesperado. Puedes recargar
                la página o limpiar los datos guardados.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <summary className="text-xs font-bold text-gray-500 cursor-pointer">
                  Detalles técnicos
                </summary>
                <pre className="text-[10px] text-red-500 mt-2 overflow-auto max-h-40 font-mono">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Recargar página
              </button>
              <button
                onClick={this.handleClearAndReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold transition-colors"
              >
                Limpiar datos y recargar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =========================================================
// CONFIG DE VISTAS
// =========================================================
const VIEW_TITLES: Record<string, string> = {
  dashboard:               "",
  p2p:                     "",
  marketplace:             "",
  "create-order":          "Nueva oferta P2P",
  trade:                   "Trade en curso",
  kyc:                     "Verificación KYC",
  "product-detail":        "Detalle del producto",
  "sales-management":      "Gestión de Ventas",
  "create-product":        "Publicar producto",
  wallet:                  "Mi Wallet",
  "wallet-history":        "Historial de Wallet",
  settings:                "Ajustes",
  notifications:           "Notificaciones",
  "admin-kyc":             "Panel KYC Admin",
  "admin-users":           "Gestión Usuarios",
  "admin-disputes":        "Panel Disputas Admin",
  "admin-promos":          "Promociones",
  profile:                 "Mi Perfil",
  security:                "Seguridad",
  help:                    "Centro de ayuda",
  terms:                   "Términos y Privacidad",
  language:                "Idioma",
  "notification-settings": "Notificaciones",
  "trade-history":         "Historial de Trades",
  "my-orders":             "Mis Anuncios P2P",
  membership:              "Membresía CupCoin",
  "public-profile":        "Perfil",
};

const SHOW_BACK_VIEWS = [
  "create-order", "trade", "kyc", "product-detail",
  "create-product", "sales-management", "notifications",
  "admin-kyc", "admin-users", "admin-disputes", "admin-promos",
  "profile", "security", "help", "terms", "wallet-history",
  "language", "notification-settings", "trade-history",
  "my-orders", "membership", "public-profile",
];

const AUTHENTICATED_VIEWS = [
  "dashboard", "p2p", "marketplace", "create-order",
  "trade", "kyc", "product-detail", "sales-management",
  "create-product", "wallet", "wallet-history", "settings",
  "notifications", "admin-kyc", "admin-users", "admin-promos",
  "admin-disputes", "profile", "security", "help", "terms",
  "language", "notification-settings", "trade-history",
  "my-orders", "membership", "public-profile",
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
    theme,
    fetchOrders,
    fetchProducts,
    subscribeToNotifications,
    loadWalletBalances,
    refreshWalletPrices,
  } = useAppStore();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // ─── Offline detection ────────────────────────────────
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

  // ─── Tema ─────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ─── Sincronizar usuario ──────────────────────────────
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
          useAppStore.setState({ user: data.userData as AppUser });

          // ✅ Recargar wallet si tiene direcciones
          const addresses = getWalletAddresses();
          if (addresses?.evm && !stopped) {
            void loadWalletBalances();
          }
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
  }, [user?.uid, loadWalletBalances]);

  // ─── Cargar datos iniciales ───────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    void fetchOrders();
    void fetchProducts();
    const unsubNotifs = subscribeToNotifications(user.uid);
    return () => { unsubNotifs(); };
  }, [user?.uid, fetchOrders, fetchProducts, subscribeToNotifications]);

  // ✅ Cargar saldos multi-red al entrar
  useEffect(() => {
    if (!user?.uid) return;
    const addresses = getWalletAddresses();
    if (!addresses?.evm) return;
    void loadWalletBalances();
  }, [user?.uid, loadWalletBalances]);

  // ✅ Refrescar precios cada 60s (sin llamar blockchain)
  useEffect(() => {
    if (!user?.uid) return;
    const interval = window.setInterval(() => {
      void refreshWalletPrices();
    }, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [user?.uid, refreshWalletPrices]);

  // ✅ Refrescar saldos completos cada 5 minutos
  useEffect(() => {
    if (!user?.uid) return;
    const addresses = getWalletAddresses();
    if (!addresses?.evm) return;

    const interval = window.setInterval(() => {
      void loadWalletBalances();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [user?.uid, loadWalletBalances]);

  // ─── Notificaciones push ──────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      requestNotificationPermission(user.uid);
    }
  }, [user?.uid]);

  // ─── Proteger vistas admin ────────────────────────────
  useEffect(() => {
    if (
      (currentView === "admin-kyc" || currentView === "admin-disputes") &&
      user?.role !== "admin"
    ) {
      navigate("dashboard");
    }
  }, [currentView, user, navigate]);

  // ─── Proteger vistas autenticadas ─────────────────────
  if (AUTHENTICATED_VIEWS.includes(currentView) && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black gap-4">
        <Logo size={48} className="text-black dark:text-white" />
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

      {/* Banner offline */}
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
        {/* ─── Vistas principales ─────────────────────── */}
        {currentView === "dashboard"        && <DashboardPage />}
        {currentView === "p2p"              && <P2PPage />}
        {currentView === "create-order"     && <CreateOrderPage />}
        {currentView === "trade"            && <TradePage />}
        {currentView === "kyc"              && <KYCPage />}
        {currentView === "marketplace"      && <MarketplacePage />}
        {currentView === "product-detail"   && <ProductDetailPage />}
        {currentView === "create-product"   && <CreateProductPage />}
        {currentView === "wallet"           && <WalletPage />}
        {currentView === "wallet-history"   && <HistoryPage />}

        {/* ─── Settings ───────────────────────────────── */}
        {currentView === "settings"         && <SettingsPage />}
        {currentView === "notifications"    && <NotificationsPage />}
        {currentView === "membership"       && <MembershipPage />}
        {currentView === "profile"          && <ProfilePage />}
        {currentView === "security"         && <SecurityPage />}
        {currentView === "help"             && <HelpPage />}
        {currentView === "terms"            && <TermsPage />}
        {currentView === "language"         && <LanguagePage />}
        {currentView === "notification-settings" && <NotificationSettingsPage />}
        {currentView === "trade-history"    && <TradeHistoryPage />}
        {currentView === "my-orders"        && <MyOrdersPage />}
        {currentView === "sales-management" && <SalesManagementPage />}
        {currentView === "public-profile"   && <PublicProfilePage />}

        {/* ─── Admin ──────────────────────────────────── */}
        {currentView === "admin-kyc"       && user?.role === "admin" && <AdminKYCPage />}
        {currentView === "admin-users"     && user?.role === "admin" && <AdminUsersPage />}
        {currentView === "admin-disputes"  && user?.role === "admin" && <AdminDisputesPage />}
        {currentView === "admin-promos"    && user?.role === "admin" && <AdminPromosPage />}
      </main>

      {showBottomNav && !modalOpen && <BottomNav />}
    </div>
  );
}

// =========================================================
// APP ROOT
// =========================================================
function AppRoot() {
  const [isInitializing, setIsInitializing]       = useState(true);
  const [showBiometricLock, setShowBiometricLock] = useState(false);
  const { navigate, loadWalletBalances, setWalletAddresses } = useAppStore();

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hasOAuthCallback =
        urlParams.has("token")          ||
        urlParams.has("requires2FA")    ||
        urlParams.has("challengeToken") ||
        urlParams.has("error");

      if (hasOAuthCallback) {
        navigate("login");
        setIsInitializing(false);
        return;
      }

      const savedToken       = localStorage.getItem("cubax_token");
      const savedUid         = localStorage.getItem("cubax_uid");
      const biometricEnabled = localStorage.getItem("biometric_enabled");

      // ─── CASO 1: Biometría activa ────────────────────
      if (biometricEnabled === "1" && savedUid) {
        const supportsBiometric =
          typeof window !== "undefined"                        &&
          !!window.PublicKeyCredential                         &&
          !!navigator.credentials                             &&
          typeof navigator.credentials.create === "function";

        if (supportsBiometric) {
          setShowBiometricLock(true);
          setIsInitializing(false);
          return;
        } else {
          console.warn("⚠️ Biometría no soportada. Removiendo flag.");
          localStorage.removeItem("biometric_enabled");
        }
      }

      // ─── CASO 2: Token guardado → auto-login ─────────
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

              // ✅ Cargar direcciones multi-red
              const walletAddresses = getWalletAddresses();
              const walletAddress   = walletAddresses?.evm || getStoredWalletAddress();

              useAppStore.setState({
                user:            data.userData as AppUser,
                isAuthenticated: true,
                currentView:     safeView as any,
                walletAddresses: walletAddresses || null,
                walletAddress:   walletAddress   || null,
              });

              // ✅ Cargar saldos multi-red si tiene wallet
              if (walletAddresses?.evm) {
                void loadWalletBalances();
              }
            } else {
              // ✅ Preservar wallet al limpiar sesión
              const walletEnc       = localStorage.getItem("cubax_wallet_enc");
              const walletAddresses = localStorage.getItem("cubax_wallet_addresses");
              localStorage.clear();
              if (walletEnc)       localStorage.setItem("cubax_wallet_enc",       walletEnc);
              if (walletAddresses) localStorage.setItem("cubax_wallet_addresses", walletAddresses);
              navigate("landing");
            }
          })
          .catch(() => navigate("landing"))
          .finally(() => setIsInitializing(false));
      } else {
        navigate("landing");
        setIsInitializing(false);
      }
    } catch (err) {
      console.error("❌ Error en inicialización:", err);
      navigate("landing");
      setIsInitializing(false);
    }
  }, [navigate, loadWalletBalances, setWalletAddresses]);

  /
