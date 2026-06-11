import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// 🔄 Conexión directa al feed real de CoinGecko
import { useCryptoPrices } from "@/lib/coingecko/prices";

import { CRYPTO_ICONS } from "@/data/mock";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  ArrowLeftRight,
  ShoppingBag,
  Wallet,
  Plus,
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export function DashboardPage() {
  const { user, balances, navigate, notifications } = useAppStore();
  const [hideBalance, setHideBalance] = useState(false);

  // 🔥 React Query maneja el caché global y el tiempo real pasivo
  const { data: cryptoPrices, isLoading: loadingMarket } = useCryptoPrices();

  if (!user) return null;

  const totalUSD = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const unreadNotifs = notifications.filter((n) => !n.read);

  const kycStatusConfig = {
    unverified: { label: "Sin verificar", variant: "warning" as const, icon: <AlertTriangle className="h-4 w-4" /> },
    pending_verification: { label: "En revisión", variant: "info" as const, icon: <Clock className="h-4 w-4" /> },
    verified: { label: "Verificado", variant: "success" as const, icon: <CheckCircle2 className="h-4 w-4" /> },
    rejected: { label: "Rechazado", variant: "danger" as const, icon: <AlertTriangle className="h-4 w-4" /> },
  };

  const kycConfig = kycStatusConfig[user.kycStatus];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Bienvenido de vuelta
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {user.displayName} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={kycConfig.variant} size="md">
            {kycConfig.icon}
            <span className="ml-1">{kycConfig.label}</span>
          </Badge>
        </div>
      </div>

      {/* Balance Card - 🥷 MODO OSCURO PREMIUM SIN GRILLADO */}
      <Card 
        padding="lg" 
        className="bg-slate-900 dark:bg-navy-900 border border-brand-500/30 dark:border-white/[0.08] text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
            Balance total
          </span>
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            {hideBalance ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="text-3xl font-black font-mono tracking-tight text-white mb-1">
          {hideBalance ? "•••••" : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        </div>
        <p className="text-xs font-semibold text-brand-400 font-mono mb-4">
          ≈ {hideBalance ? "••••" : `${(totalUSD * 395).toLocaleString("es-CU")} CUP`}
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold"
            onClick={() => navigate("p2p")}
            icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
          >
            Intercambiar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 bg-white/10 hover:bg-white/15 text-white border-0 font-bold"
            onClick={() => navigate("wallet")}
            icon={<Wallet className="h-3.5 w-3.5" />}
          >
            Wallet
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <ArrowLeftRight className="h-5 w-5" />, label: "P2P", view: "p2p" as const },
          { icon: <Plus className="h-5 w-5" />, label: "Publicar", view: "create-order" as const },
          { icon: <ShoppingBag className="h-5 w-5" />, label: "Tienda", view: "marketplace" as const },
          { icon: <Shield className="h-5 w-5" />, label: "KYC", view: "kyc" as const },
        ].map((action) => (
          <Card
            key={action.label}
            hover
            padding="sm"
            className="text-center"
            onClick={() => navigate(action.view)}
          >
            <div className="h-10 w-10 mx-auto rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 mb-1.5">
              {action.icon}
            </div>
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
              {action.label}
            </span>
          </Card>
        ))}
      </div>

      {/* KYC Alert */}
      {user.kycStatus === "unverified" && (
        <Card
          hover
          padding="md"
          className="border-amber-500/20 bg-amber-50 dark:bg-amber-500/5"
          onClick={() => navigate("kyc")}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                Completa tu verificación
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Verifica tu identidad para operar sin límites
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </Card>
      )}

      {/* Assets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Mis activos
          </h2>
          <button
            onClick={() => navigate("wallet")}
            className="text-xs text-brand-500 font-medium flex items-center gap-0.5"
          >
            Ver todo <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2">
          {balances.map((balance) => {
            const liveCoin = cryptoPrices?.find((p) => p.symbol.toUpperCase() === balance.asset.toUpperCase());
            const change = liveCoin?.price_change_percentage_24h ?? 0;
            const isUp = change >= 0;

            return (
              <Card key={balance.asset} hover padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-lg">
                      {CRYPTO_ICONS[balance.asset]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {balance.asset}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {hideBalance ? "••••" : balance.amount.toFixed(balance.asset === "BTC" ? 5 : balance.asset === "ETH" ? 4 : 2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {hideBalance ? "••••" : `$${balance.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </div>
                    <div
                      className={`text-xs font-medium flex items-center gap-0.5 justify-end ${
                        isUp ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Prices (Mercado en vivo) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Mercado
          </h2>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono flex items-center gap-1">
            {loadingMarket && <Loader2 className="h-2.5 w-2.5 animate-spin text-brand-500" />}
            CoinGecko • 60s
          </span>
        </div>

        {loadingMarket && !cryptoPrices ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {cryptoPrices?.map((coin) => {
              const symbolUpper = coin.symbol.toUpperCase();
              const isUp = coin.price_change_percentage_24h >= 0;
              
              return (
                <Card key={coin.id} hover padding="md" className="border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-xs">
                      {CRYPTO_ICONS[symbolUpper] || symbolUpper.charAt(0)}
                    </div>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white">
                      {symbolUpper}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white font-mono">
                    ${coin.current_price >= 1 
                      ? coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2 }) 
                      : coin.current_price.toFixed(4)
                    }
                  </div>
                  <div
                    className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                      isUp ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {isUp ? "+" : ""}
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      {unreadNotifs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notificaciones
            </h2>
            <button
              onClick={() => navigate("notifications")}
              className="text-xs text-brand-500 font-medium flex items-center gap-0.5"
            >
              Ver todo <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {unreadNotifs.slice(0, 3).map((notif) => (
              <Card key={notif.id} hover padding="sm">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0 mt-0.5">
                    {notif.type === "trade" ? (
                      <ArrowLeftRight className="h-4 w-4" />
                    ) : notif.type === "kyc" ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-gray-900 dark:text-white">
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
          }
          
