import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

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

// ─── Firebase — solo Firestore, sin Auth del cliente ──────
// ✅ No importamos firebase/auth aquí
// La autenticación se maneja via backend para funcionar sin VPN
import { db }              from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
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
};

const SHOW_BACK_VIEWS = [
  "create-order", "trade", "kyc", "product-detail",
  "create-product", "notifications", "admin-kyc",
  "admin-disputes", "profile", "security", "help",
  "terms", "language", "notification-settings",
  "trade-history", "my-orders", "membership",
];

const AUTHENTICATED_VIEWS = [
  "dashboard", "p2p", "marketplace", "create-order",
  "trade", "kyc", "product-detail", "create-product",
  "wallet", "settings", "notifications", "admin-kyc",
  "admin-disputes", "profile", "security", "help",
  "terms", "language", "notification-settings",
  "trade-history", "my-orders", "membership",
];

// =========================================================
// APP CONTENT
// =========================================================
function AppContent() {
  const {
    currentView, user, navigate,
    modalOpen, setWalletData, theme,
  } = useAppStore();

  // ─── Modo oscuro ──────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ─── Sincronización Firestore en tiempo real ──────────────
  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef  = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const fullUserData = docSnap.data() as AppUser;
          useAppStore.setState({ user: fullUserData });

          const balances         = (fullUserData as any).balances         || { USDT: 0, BTC: 0, ETH: 0, USDC: 0 };
          const depositAddresses = (fullUserData as any).depositAddresses || {};
          setWalletData(balances, depositAddresses);
        }
      },
      (err) => {
        console.warn("Error en listener de usuario:", err.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, setWalletData]);

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
      <Header
        title={VIEW_TITLES[currentView] || ""}
        showBack={SHOW_BACK_VIEWS.includes(currentView)}
      />

      {/*
        ✅ SCROLL CORREGIDO:
        - Sin overscroll-contain — causaba pegado en móvil
        - WebkitOverflowScrolling touch para iOS nativo
        - overscrollBehaviorY auto para rebote natural
        - overscrollBehaviorX none para evitar scroll horizontal
      */}
      <main
        className="flex-1 min-h-0 overflow-y-auto pb-16"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY:     "auto",
          overscrollBehaviorX:     "none",
        }}
      >
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

// =========================================================
// APP ROOT — Auth via backend (sin VPN en Cuba)
// =========================================================
export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { navigate }                        = useAppStore();

  useEffect(() => {
    const savedToken = localStorage.getItem("cubax_token");
    const savedUid   = localStorage.getItem("cubax_uid");

    if (savedToken && savedUid) {
      // ✅ Restaurar sesión leyendo datos desde el backend
      // El backend usa Firebase Admin SDK que no está bloqueado en Cuba
      fetch(`${BACKEND_URL}/api/auth/me`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: savedUid }),
      })
        .then((r) => r.json())
        .then(async (data) => {
          if (data.success && data.userData) {

            // ✅ Restaurar la última vista guardada
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
            // ✅ Token inválido — limpiar y mandar al landing
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
          console.warn("Error restaurando sesión:", err.message);

          // ✅ Si hay error de red usar datos del localStorage como fallback
          const emailSaved = localStorage.getItem("cubax_email");
          const nameSaved  = localStorage.getItem("cubax_name");

          if (emailSaved) {
            // Tenemos datos suficientes — mantener sesión offline
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
      // ✅ Sin sesión guardada — ir al landing
      navigate("landing");
      setIsInitializing(false);
    }
  }, []);

  // ─── Refrescar token cada 50 minutos ─────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem("cubax_refresh_token");
      const savedUid     = localStorage.getItem("cubax_uid");
      if (!refreshToken || !savedUid) return;

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
          // Token expirado — cerrar sesión
          console.warn("⚠️ Token expirado");
          localStorage.removeItem("cubax_token");
          localStorage.removeItem("cubax_refresh_token");
          localStorage.removeItem("cubax_uid");
          localStorage.removeItem("cubax_last_view");
          localStorage.removeItem("cubax_email");
          localStorage.removeItem("cubax_name");
          useAppStore.getState().logout();
          navigate("landing");
        }
      } catch (err) {
        console.warn("⚠️ Error refrescando token — manteniendo sesión");
      }
    }, 50 * 60 * 1000); // cada 50 minutos

    return () => clearInterval(interval);
  }, []);

  // ─── Guardar la vista actual en localStorage ──────────────
  // Para restaurarla al recargar
  const { currentView } = useAppStore();
  useEffect(() => {
    if (AUTHENTICATED_VIEWS.includes(currentView)) {
      localStorage.setItem("cubax_last_view", currentView);
    }
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
