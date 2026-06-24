import { useAppStore } from "@/store/useAppStore";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingBag,
  Wallet,
  User,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { AppView } from "@/types";

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ReactNode;
}

export function BottomNav() {
  const { currentView, navigate } = useAppStore();

  const items: NavItem[] = [
    {
      view: "dashboard",
      label: "Inicio",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      view: "p2p",
      label: "P2P",
      icon: <ArrowLeftRight className="h-5 w-5" />,
    },
    {
      view: "marketplace",
      label: "Tienda",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      view: "wallet",
      label: "Wallet",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      view: "settings",
      label: "Perfil",
      icon: <User className="h-5 w-5" />,
    },
  ];

  const isActive = (view: AppView) => {
    if (view === "p2p" && [
      "create-order",
      "trade",
      "trade-history",
      "my-orders",
    ].includes(currentView)) {
      return true;
    }

    if (view === "marketplace" && [
      "product-detail",
      "create-product",
    ].includes(currentView)) {
      return true;
    }

    if (view === "settings" && [
      "kyc",
      "notifications",
      "profile",
      "security",
      "help",
      "terms",
      "language",
      "notification-settings",
      "admin-kyc",
    ].includes(currentView)) {
      return true;
    }

    return currentView === view;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass bg-white/90 dark:bg-navy-950/90 border-t border-gray-100 dark:border-white/[0.06] pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur-md">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 h-16">
        {items.map((item) => {
          const active = isActive(item.view);

          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 min-w-[56px]",
                active
                  ? "text-brand-500"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <div
                className={cn(
                  "transition-all duration-200",
                  active && "scale-110"
                )}
              >
                {item.icon}
              </div>

              <span
                className={cn(
                  "text-[10px] font-medium",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>

              {active && (
                <div className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}