import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

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
import { AdminKYCPage } from "@/pages/AdminKYCPage";

// ─── Firebase ─────────────────────────────────────────────
import { auth, db }           from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  requestNotificationPermission,
  onForegroundMessage,
} from "@/lib/firebase/messaging";

import { MOCK_USER }        from "@/data/mock";
import type { User as AppUser } from "@/types";

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
  profile:                 "Mi Perfil",
  security:                "Seguridad",
  help:                    "Centro de ayuda",
  terms:                   "Términos y Privacidad",
  language:                "Idioma",
  "notification-settings": "Notificaciones",
  "trade-history":         "Historial de Trades",
  "my-orders":             "Mis Anuncios P2P",
};

const SHOW_BACK_VIEWS = [
  "create-order",
  "trade",
  "kyc",
  "product-detail",
  "create-product",
  "notifications",
  "admin-kyc",
  "profile",
  "security",
  "help",
  "terms",
  "language",
  "notification-settings",
  "trade-history",
  "my-orders",
];

const AUTHENTICATED_VIEWS = [
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
  "profile",
  "security",
  "help",
  "terms",
  "language",
  "notification-settings",
  "trade-history",
  "my-orders",
];

// =========================================================
// APP CONTENT
// =========================================================
function AppContent() {
  const {
    currentView,
    user,
    navigate,
    modalOpen, // ✅ NUEVO
  } = useAppStore();

  // ─── Seguridad: solo admin ────────────────────────────────
  useEffect(() => {
    if (currentView === "admin-kyc" && user?.role !== "admin") {
      navigate("dashboard");
    }
  }, [currentView, user, navigate]);

  // ─── Push en primer plano ─────────────────────────────────
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log("📬 Push en primer plano:", payload);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ─── Loading si requiere auth ─────────────────────────────
  if (AUTHENTICATED_VIEWS.includes(currentView) && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse font-medium">
          Sincronizando perfil...
        </p>
      </div>
    );
  }

  const showBottomNav = AUTHENTICATED_VIEWS.includes(currentView);

  // ─── Páginas sin layout ───────────────────────────────────
  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login" || currentView === "register") return <AuthPage />;

  // ─── Layout principal ─────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-navy-950">
      <Header
        title={VIEW_TITLES[currentView] || ""}
        showBack={SHOW_BACK_VIEWS.includes(currentView)}
      />

      <main className="flex-1 min-h-[calc(100vh-3.5rem-4rem)]">

        {/* ─── Páginas principales ──────────────────────── */}
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

        {/* ─── Páginas de configuración ─────────────────── */}
        {currentView === "profile"                && <ProfilePage />}
        {currentView === "security"               && <SecurityPage />}
        {currentView === "help"                   && <HelpPage />}
        {currentView === "terms"                  && <TermsPage />}
        {currentView === "language"               && <LanguagePage />}
        {currentView === "notification-settings"  && <NotificationSettingsPage />}
        {currentView === "trade-history"          && <TradeHistoryPage />}
        {currentView === "my-orders"              && <MyOrdersPage />}

        {/* ─── Admin ───────────────────────────────────── */}
        {currentView === "admin-kyc" && user?.role === "admin" && (
          <AdminKYCPage />
        )}
      </main>

      {/* ✅ BottomNav se oculta cuando hay un modal abierto */}
      {showBottomNav && !modalOpen && <BottomNav />}
    </div>
  );
}

// =========================================================
// APP ROOT
// =========================================================
export default function App() {
  const {
    theme,
    user,
    login,
    logout,
    currentView,
    isAuthenticated,
    navigate,
    setWalletData,
    subscribeToNotifications,
  } = useAppStore();

  const [authLoading, setAuthLoading] = useState(true);

  // ─── Modo oscuro ──────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // ─── Guardián de autenticación ────────────────────────────
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const initialUserData: AppUser = {
              uid:           firebaseUser.uid,
              email:         firebaseUser.email       || "",
              displayName:   firebaseUser.displayName || "Usuario",
              photoURL:      firebaseUser.photoURL    || null,
              kycStatus:     "unverified",
              createdAt:     Date.now(),
              totalTrades:   0,
              rating:        5.0,
              walletAddress: null,
              role:          "user",
            };

            login(initialUserData);

            if (firebaseUser.uid !== "invitado") {
              setTimeout(() => {
                requestNotificationPermission(firebaseUser.uid).catch(
                  (err) => console.warn("Push silenciado:", err)
                );
              }, 1000);
            }
          } else {
            logout();
            if (
              AUTHENTICATED_VIEWS.includes(currentView) ||
              !currentView
            ) {
              navigate("landing");
            }
          }
        } catch (error) {
          console.error("Error en guardián de auth:", error);
          navigate("landing");
        } finally {
          setAuthLoading(false);
        }
      }
    );

    return () => unsubscribeAuth();
  }, [login, logout]);

  // ─── Sincronización Firestore ─────────────────────────────
  useEffect(() => {
    if (!user?.uid || user.uid === "invitado") return;

    const uid        = user.uid;
    const userDocRef = doc(db, "users", uid);

    console.log(`[Firebase] Iniciando streams para: ${uid}`);

    const unsubscribeUserDoc = onSnapshot(
      userDocRef,
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const fullUserData = docSnap.data() as AppUser;

            useAppStore.setState({ user: fullUserData });

            if (MOCK_USER) {
              Object.keys(MOCK_USER).forEach(
                (key) => delete (MOCK_USER as any)[key]
              );
              Object.assign(MOCK_USER, fullUserData);
            }

            const firestoreBalances =
              (fullUserData as any).balances || {
                USDT: 0, BTC: 0, ETH: 0, USDC: 0,
              };
            const depositAddresses =
              (fullUserData as any).depositAddresses || {};

            setWalletData(firestoreBalances, depositAddresses);

          } else {
            const templateUser = {
              uid:              uid,
              email:            user.email       || "",
              displayName:      user.displayName || "Usuario",
              photoURL:         user.photoURL    || null,
              kycStatus:        "unverified",
              createdAt:        Date.now(),
              totalTrades:      0,
              rating:           5.0,
              role:             "user",
              balances:         { USDT: 0, BTC: 0, ETH: 0, USDC: 0 },
              depositAddresses: {},
              notifPrefs: {
                trades:      true,
                marketplace: true,
                kyc:         true,
                precios:     false,
                sistema:     true,
              },
            };
            await setDoc(userDocRef, templateUser);
            console.log(
              `[Firebase] Documento creado para nuevo usuario: ${uid}`
            );
          }
        } catch (err) {
          console.error("Error en snapshot de usuario:", err);
        }
      },
      (err) => {
        console.error("Error en listener de usuario:", err);
      }
    );

    const unsubscribeNotifications = subscribeToNotifications(uid);

    return () => {
      console.log(`[Firebase] Limpiando streams para: ${uid}`);
      unsubscribeUserDoc();
      unsubscribeNotifications();
    };
  }, [user?.uid, setWalletData, subscribeToNotifications]);

  // ─── Redirección si ya autenticado ───────────────────────
  useEffect(() => {
    if (
      isAuthenticated &&
      ["landing", "login", "register"].includes(currentView)
    ) {
      navigate("dashboard");
    }
  }, [isAuthenticated, currentView, navigate]);

  // ─── Pantalla de carga ────────────────────────────────────
  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${
          theme === "dark"
            ? "bg-navy-950 text-white"
            : "bg-white text-gray-900"
        }`}
      >
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/20 animate-bounce">
          <span className="text-white font-black text-xl">CX</span>
        </div>
        <div
          className={`h-1 w-24 rounded-full overflow-hidden ${
            theme === "dark" ? "bg-white/10" : "bg-gray-200"
          }`}
        >
          <div className="h-full bg-brand-500 rounded-full animate-pulse w-full" />
        </div>
        <p
          className={`text-xs mt-3 font-medium ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Cargando CubaX...
        </p>
      </div>
    );
  }

  return <AppContent />;
}