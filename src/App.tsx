import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

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
import { AdminDisputesPage }  from "@/pages/admin/AdminDisputesPage";

// ─── Firebase y Utils ─────────────────────────────────────
import { auth, db } from "@/lib/firebase/config";
import { signInWithCustomToken } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase/messaging";
import { MOCK_USER } from "@/data/mock";
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
  security:                 "Seguridad",
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

async function authenticateFirebaseSDK(uid: string): Promise<void> {
  try {
    const ctRes = await fetch(`${BACKEND_URL}/api/auth/custom-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    const ctData = await ctRes.json();
    if (ctData.success && ctData.customToken) {
      await signInWithCustomToken(auth, ctData.customToken);
    }
  } catch (err) { console.warn("Auth SDK no crítico:", err); }
}

function AppContent() {
  const { currentView, user, navigate, modalOpen } = useAppStore();

  // Seguridad: solo admin
  useEffect(() => {
    if ((currentView === "admin-kyc" || currentView === "admin-disputes") && user?.role !== "admin") {
      navigate("dashboard");
    }
  }, [currentView, user, navigate]);

  if (AUTHENTICATED_VIEWS.includes(currentView) && !user) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const isAdminView = currentView.startsWith("admin-");
  const showBottomNav = AUTHENTICATED_VIEWS.includes(currentView) && !isAdminView;

  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login" || currentView === "register") return <AuthPage />;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-navy-950">
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
  /* ... (Resto de tu lógica de App raíz se mantiene igual) ... */
  return <AppContent />;
}
