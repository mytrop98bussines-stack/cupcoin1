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
// ✅ Eliminado "auth" — ya no se usa
import { db }                          from "@/lib/firebase/config";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore"; // ✅ añadido getDoc
import {
  requestNotificationPermission,
  onForegroundMessage,
} from "@/lib/firebase/messaging";

import { MOCK_USER }            from "@/data/mock";
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
    modalOpen,
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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-navy-950">
      <Header
        title={VIEW_TITLES[currentView] || ""}
        showBack={SHOW_BACK_VIEWS.includes(currentView)}
      />
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

        {currentView === "profile"               && <ProfilePage />}
        {currentView === "security"              && <SecurityPage />}
        {currentView === "help"                  && <HelpPage />}
        {currentView === "terms"                 && <TermsPage />}
        {currentView === "language"              && <LanguagePage />}
        {currentView === "notification-settings" && <NotificationSettingsPage />}
        {currentView === "trade-history"         && <TradeHistoryPage />}
        {currentView === "my-orders"             && <MyOrdersPage />}

        {currentView === "admin-kyc" && user?.role === "admin" && (
          <AdminKYCPage />
        )}
      </main>

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
    const savedToken = localStorage.getItem("cubax_token");
    const savedUid   = localStorage.getItem("cubax_uid");

    if (savedToken && savedUid) {
      const verifySession = async () => {
        try {
          const userSnap = await getDoc(doc(db, "users", savedUid));

          if (userSnap.exists()) {
            const userData = userSnap.data() as AppUser;
            login(userData);
          } else {
            // Usuario no existe en Firestore
            localStorage.removeItem("cubax_token");
            localStorage.removeItem("cubax_refresh_token");
            localStorage.removeItem("cubax_uid");
            navigate("landing");
          }
        } catch (error) {
          console.error("Error verificando sesión:", error);
          // ✅ Si hay error de red no cerramos sesión
          // intentamos con los datos del store si existen
        } finally {
          setAuthLoading(false);
        }
      };

      verifySession();
    } else {
      setAuthLoading(false);
      if (AUTHENTICATED_VIEWS.includes(currentView) || !currentView) {
        navigate("landing");
      }
    }
  }, []);

  // ─── Refrescar token cada 50 minutos ─────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem("cubax_refresh_token");
      if (!refreshToken) return;

      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
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
          // Token inválido — cerrar sesión
          console.warn("⚠️ Token expirado — cerrando sesión");
          localStorage.removeItem("cubax_token");
          localStorage.removeItem("cubax_refresh_token");
          localStorage.removeItem("cubax_uid");
          logout();
          navigate("landing");
        }
      } catch (err) {
        console.warn("⚠️ Error refrescando token:", err);
      }
    }, 50 * 60 * 1000); // cada 50 minutos

    return () => clearInterval(interval);
  }, [user?.uid]);

  // ─── Notificaciones push ──────────────────────────────────
  useEffect(() => {
    if (!user?.uid || user.uid === "invitado") return;

    setTimeout(() => {
      requestNotificationPermission(user.uid).catch(
        (err) => console.warn("Push silenciado:", err)
      );
    }, 1000);
  }, [user?.uid]);

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
            // ✅ Crear documento si no existe
            const templateUser = {
              uid,
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
            console.log(`[Firebase] Documento creado para: ${uid}`);
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
      <div className={`min-h-screen flex flex-col items-center justify-center ${
        theme === "dark"
          ? "bg-navy-950 text-white"
          : "bg-white text-gray-900"
      }`}>
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/20 animate-bounce">
          <span className="text-white font-black text-xl">CX</span>
        </div>
        <div className={`h-1 w-24 rounded-full overflow-hidden ${
          theme === "dark" ? "bg-white/10" : "bg-gray-200"
        }`}>
          <div className="h-full bg-brand-500 rounded-full animate-pulse w-full" />
        </div>
        <p className={`text-xs mt-3 font-medium ${
          theme === "dark" ? "text-gray-500" : "text-gray-400"
        }`}>
          Cargando CubaX...
        </p>
      </div>
    );
  }

  return <AppContent />;
        }
