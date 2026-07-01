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
import { AdminKYCPage } from "@/pages/AdminKYCPage";

// ─── Firebase ─────────────────────────────────────────────
import { db }                      from "@/lib/firebase/config";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  requestNotificationPermission,
  onForegroundMessage,
} from "@/lib/firebase/messaging";

import { MOCK_USER }            from "@/data/mock";
import type { User as AppUser } from "@/types";

// ✅ Ya no importamos getDoc ni auth de Firebase
// El guardián usa el backend en vez de Firestore directamente

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
  membership:              "Membresía CubaX",
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
  "membership",
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
  "membership",
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
    return () => { if (unsubscribe) unsubscribe(); };
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
        {currentView === "membership"     && <MembershipPage />}

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
  // ✅ Usa el backend en vez de Firestore directamente
  // Así no hay problemas de autenticación del SDK del cliente
  useEffect(() => {
    const savedToken = localStorage.getItem("cubax_token");
    const savedUid   = localStorage.getItem("cubax_uid");

    if (savedToken && savedUid) {
      const verifySession = async () => {
        try {
          // ✅ Leer datos desde el backend (bypasea las reglas de Firestore)
          const res  = await fetch(`${BACKEND_URL}/api/auth/me`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ uid: savedUid }),
          });

          const data = await res.json();

          if (data.success && data.userData) {
            // ✅ Usuario encontrado — restaurar sesión
            useAppStore.setState({
              user:            data.userData as AppUser,
              isAuthenticated: true,
              currentView:     "dashboard",
            });

          } else {
            // ✅ No existe en Firestore — crear documento básico
            console.warn("[Auth] Usuario no en Firestore — creando documento");

            const createRes = await fetch(
              `${BACKEND_URL}/api/auth/register-basic`,
              {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  uid:         savedUid,
                  email:       localStorage.getItem("cubax_email") || "",
                  displayName: localStorage.getItem("cubax_name")  || "Usuario",
                }),
              }
            );

            const createData = await createRes.json();

            if (createData.success) {
              useAppStore.setState({
                user:            createData.userData as AppUser,
                isAuthenticated: true,
                currentView:     "dashboard",
              });
            } else {
              // Usar datos mínimos del localStorage como último recurso
              const basicUser: AppUser = {
                uid:           savedUid,
                email:         localStorage.getItem("cubax_email") || "",
                displayName:   localStorage.getItem("cubax_name")  || "Usuario",
                photoURL:      null,
                kycStatus:     "unverified",
                createdAt:     Date.now(),
                totalTrades:   0,
                rating:        5.0,
                walletAddress: null,
                role:          "user",
              };
              useAppStore.setState({
                user:            basicUser,
                isAuthenticated: true,
                currentView:     "dashboard",
              });
            }
          }

        } catch (error: any) {
          console.error("Error verificando sesión:", error.message);

          // ✅ Si hay error de red usar datos del localStorage
          const emailSaved = localStorage.getItem("cubax_email");
          const nameSaved  = localStorage.getItem("cubax_name");

          if (emailSaved) {
            // Tenemos datos suficientes para no cerrar sesión
            const basicUser: AppUser = {
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
            };
            useAppStore.setState({
              user:            basicUser,
              isAuthenticated: true,
              currentView:     "dashboard",
            });
          } else {
            // Sin datos — cerrar sesión
            localStorage.removeItem("cubax_token");
            localStorage.removeItem("cubax_refresh_token");
            localStorage.removeItem("cubax_uid");
            localStorage.removeItem("cubax_last_view");
            navigate("landing");
          }
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
          console.warn("⚠️ Token expirado — cerrando sesión");
          localStorage.removeItem("cubax_token");
          localStorage.removeItem("cubax_refresh_token");
          localStorage.removeItem("cubax_uid");
          localStorage.removeItem("cubax_last_view");
          localStorage.removeItem("cubax_email");
          localStorage.removeItem("cubax_name");
          logout();
          navigate("landing");
        }
      } catch (err) {
        console.warn("⚠️ Error refrescando token — manteniendo sesión:", err);
      }
    }, 50 * 60 * 1000);

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

  // ─── Sincronización Firestore en tiempo real ──────────────
  // ✅ onSnapshot funciona porque Firestore permite lectura
  // del propio documento cuando el usuario está autenticado
  // via Firebase Auth (que sigue activo en el backend)
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
            // ✅ Documento no existe — crear via backend
            console.warn(`[Firebase] Documento no existe para ${uid} — creando via backend`);

            await fetch(`${BACKEND_URL}/api/auth/register-basic`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid,
                email:       user.email       || "",
                displayName: user.displayName || "Usuario",
              }),
            });
          }
        } catch (err) {
          console.error("Error en snapshot de usuario:", err);
        }
      },
      (err) => {
        // ✅ Si falla el listener no hacemos nada crítico
        console.warn("Error en listener de usuario (no crítico):", err.message);
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
        theme === "dark" ? "bg-navy-950 text-white" : "bg-white text-gray-900"
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
