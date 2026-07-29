import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCryptoPrices } from "@/lib/coingecko/prices";
import { CryptoIcon } from "@/components/ui/CryptoIcon";
import { EmailVerifyBanner } from "@/components/EmailVerificationBanner";
import { PromoBanner } from "@/components/PromoBanner"; // ✅ Añadido
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
  Bell,
  Zap,
  Package,
  Star,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";

export function DashboardPage() {
  const {
    user,
    balances,
    navigate,
    notifications,
    subscribeToNotifications,
    fetchPrices,
    prices,
  } = useAppStore();

  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  // ─── CoinGecko en tiempo real ─────────────────────────────
  const { data: cryptoPrices, isLoading: loadingMarket } = useCryptoPrices();

  // ─── Balance total memorizado ─────────────────────────────
  const totalUSD = useMemo(() => {
    if (!balances || balances.length === 0) return 0;
    return balances.reduce((sum, b) => sum + (b.usdValue || 0), 0);
  }, [balances]);

  // ─── Notificaciones no leídas ─────────────────────────────
  const unreadNotifs = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications]
  );

  // ─── Suscripción a notificaciones ────────────────────────
  useEffect(() => {
    if (
      user?.uid &&
      user.uid !== "invitado" &&
      typeof subscribeToNotifications === "function"
    ) {
      const unsubscribe = subscribeToNotifications(user.uid);
      return () => unsubscribe();
    }
  }, [user?.uid, subscribeToNotifications]);

  // ─── Refrescar precios ────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrices();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchPrices]);

  if (!user) return null;

  // ─── KYC config ───────────────────────────────────────────
  const kycStatusConfig = {
    unverified: {
      label:   "Sin verificar",
      variant: "warning" as const,
      icon:    <AlertTriangle className="h-3.5 w-3.5" />,
      color:   "text-amber-500",
    },
    pending_verification: {
      label:   "En revisión",
      variant: "info" as const,
      icon:    <Clock className="h-3.5 w-3.5" />,
      color:   "text-blue-500",
    },
    verified: {
      label:   "Verificado ✓",
      variant: "success" as const,
      icon:    <CheckCircle2 className="h-3.5 w-3.5" />,
      color:   "text-emerald-500",
    },
    rejected: {
      label:   "Rechazado",
      variant: "danger" as const,
      icon:    <AlertTriangle className="h-3.5 w-3.5" />,
      color:   "text-red-500",
    },
  };

  const kycConfig =
    kycStatusConfig[user.kycStatus as keyof typeof kycStatusConfig] ||
    kycStatusConfig.unverified;

  // ─── Acciones rápidas ─────────────────────────────────────
  const quickActions = [
    {
      icon:  <ArrowLeftRight className="h-5 w-5" />,
      label: "P2P",
      view:  "p2p"          as const,
      bg:    "bg-brand-500/10",
      color: "text-brand-500",
    },
    {
      icon:  <Plus className="h-5 w-5" />,
      label: "Publicar",
      view:  "create-order" as const,
      bg:    "bg-emerald-500/10",
      color: "text-emerald-500",
    },
    {
      icon:  <ShoppingBag className="h-5 w-5" />,
      label: "Tienda",
      view:  "marketplace"  as const,
      bg:    "bg-violet-500/10",
      color: "text-violet-500",
    },
    {
      icon:  <Shield className="h-5 w-5" />,
      label: "KYC",
      view:  "kyc"          as const,
      bg:    "bg-amber-500/10",
      color: "text-amber-500",
    },
  ];

  // ─── Hora del día ─────────────────────────────────────────
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* ═══ 🆕 BANNER VERIFICAR EMAIL ═══════════════════════ */}
      <EmailVerifyBanner />

      {/* ═══ GREETING ════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {getGreeting()} 👋
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {user.displayName?.split(" ")[0] || "Usuario"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <button
            onClick={() => navigate("notifications")}
            className="relative p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-500 text-white text-[9px] font-black flex items-center justify-center">
                {unreadNotifs.length > 9 ? "9+" : unreadNotifs.length}
              </span>
            )}
          </button>

          {/* KYC Badge */}
          <Badge variant={kycConfig.variant} size="sm">
            {kycConfig.icon}
            <span className="ml-1">{kycConfig.label}</span>
          </Badge>
        </div>
      </div>

      {/* ═══ BALANCE CARD ════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.02] p-5 border border-gray-800 dark:border-white/[0.08] shadow-2xl">

        {/* Decoración */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Balance total
              </span>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {hideBalance ? (
                <Eye    className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Monto */}
          <div className="mb-4">
            <p className="text-4xl font-black text-white tracking-tight leading-none">
              {hideBalance
                ? "••••••"
                : `$${totalUSD.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </p>
            <p className="text-sm text-gray-400 mt-1.5 font-medium">
              ≈{" "}
              {hideBalance
                ? "••••••"
                : `${(totalUSD * 395).toLocaleString("es-CU")} CUP`}
            </p>
          </div>

          {/* Stats rápidos */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-300">
                {(user as any).rating || "5.0"}
              </span>
            </div>
            <div className="h-3 w-px bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-xs font-semibold text-gray-300">
                {user.totalTrades || 0} trades
              </span>
            </div>
            <div className="h-3 w-px bg-gray-700" />
            <div className={`flex items-center gap-1 text-xs font-semibold ${kycConfig.color}`}>
              {kycConfig.icon}
              <span>{kycConfig.label}</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2.5">
            <button
              onClick={() => navigate("p2p")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25 active:scale-[0.98]"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Intercambiar
            </button>
            <button
              onClick={() => navigate("wallet")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all active:scale-[0.98]"
            >
              <Wallet className="h-4 w-4" />
              Mi Wallet
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 🎯 PROMO BANNER (auto-rotación) ═════════════════ */}
      <PromoBanner />

      {/* ═══ ACCIONES RÁPIDAS ════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.view)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] hover:border-gray-200 dark:hover:border-white/10 transition-all active:scale-[0.96]"
          >
            <div
              className={`h-10 w-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center`}
            >
              {action.icon}
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ ALERTA KYC ══════════════════════════════════════ */}
      {user.kycStatus === "unverified" && (
        <button
          onClick={() => navigate("kyc")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left active:scale-[0.99]"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Completa tu verificación KYC
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Verifica tu identidad para operar sin límites
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-500 flex-shrink-0" />
        </button>
      )}
            {/* ═══ MIS ACTIVOS ═════════════════════════════════════ */}
      {balances.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Mis activos
            </h2>
            <button
              onClick={() => navigate("wallet")}
              className="text-xs text-brand-500 font-semibold flex items-center gap-0.5 hover:text-brand-400"
            >
              Ver todo <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            {balances
              .filter((b) => b.amount > 0)
              .slice(0, 4)
              .map((balance) => {
                const liveCoin = cryptoPrices?.find(
                  (p) => p.symbol.toUpperCase() === balance.asset.toUpperCase()
                );
                const change = liveCoin?.price_change_percentage_24h ?? 0;
                const isUp   = change >= 0;

                return (
                  <button
                    key={balance.asset}
                    onClick={() => navigate("wallet")}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] hover:border-gray-200 dark:hover:border-white/10 transition-all text-left active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <CryptoIcon symbol={balance.asset} size={40} />
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                          {balance.asset}
                        </p>
                        <p className="text-xs text-gray-400">
                          {hideBalance
                            ? "••••"
                            : `${balance.amount.toFixed(
                                balance.asset === "BTC"
                                  ? 6
                                  : balance.asset === "ETH"
                                  ? 4
                                  : balance.asset === "XLM"
                                  ? 4
                                  : 2
                              )} ${balance.asset}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {hideBalance
                          ? "••••"
                          : `$${balance.usdValue.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}`}
                      </p>
                      <div
                        className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                          isUp ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {isUp ? (
                          <TrendingUp  className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(change).toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })}

            {balances.filter((b) => b.amount > 0).length === 0 && (
              <div className="text-center py-6">
                <Wallet className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Sin saldo aún
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Deposita cripto para empezar a operar
                </p>
                <button
                  onClick={() => navigate("wallet")}
                  className="text-xs font-bold text-brand-500 hover:text-brand-400"
                >
                  Ir a Wallet →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ STELLAR WALLET (usa el icono oficial) ═══════════ */}
      <button
        onClick={() => navigate("stellar")}
        className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors w-full"
      >
        <div className="h-10 w-10 rounded-xl bg-white dark:bg-black/40 flex items-center justify-center p-1.5 overflow-hidden">
          <CryptoIcon symbol="XLM" size={32} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-sm text-gray-900 dark:text-white">
            Stellar Wallet
          </p>
          <p className="text-xs text-gray-400">
            Envía y recibe XLM al instante
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-blue-500 flex-shrink-0" />
      </button>

      {/* ═══ MERCADO EN VIVO (incluye XLM automáticamente) ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Mercado
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
              {loadingMarket && (
                <Loader2 className="h-2.5 w-2.5 animate-spin text-brand-500" />
              )}
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CoinGecko
            </div>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <RefreshCw
                className={`h-3 w-3 text-gray-400 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {loadingMarket && !cryptoPrices ? (
          <div className="grid grid-cols-2 gap-2">
            {/* ✅ 6 placeholders para alinear con 5-6 cryptos (BTC, ETH, USDT, USDC, XLM) */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {cryptoPrices?.map((coin) => {
              const symbolUpper = coin.symbol.toUpperCase();
              const isUp        = coin.price_change_percentage_24h >= 0;

              return (
                <button
                  key={coin.id}
                  onClick={() => navigate("p2p")}
                  className="flex flex-col p-3.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] hover:border-brand-500/20 transition-all text-left active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CryptoIcon symbol={symbolUpper} size={28} />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {symbolUpper}
                      </p>
                      <p className="text-[9px] text-gray-400 truncate max-w-[60px]">
                        {coin.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white font-mono leading-none">
                    $
                    {coin.current_price >= 1
                      ? coin.current_price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : coin.current_price.toFixed(4)}
                  </p>
                  <div
                    className={`text-[11px] font-bold flex items-center gap-0.5 mt-1 ${
                      isUp ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp  className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {isUp ? "+" : ""}
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ ACCESO RÁPIDO EXTRA ═════════════════════════════ */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate("trade-history")}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] hover:border-brand-500/20 transition-all text-left active:scale-[0.98]"
        >
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <ArrowLeftRight className="h-4 w-4 text-brand-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              Mis trades
            </p>
            <p className="text-[10px] text-gray-400">
              {user.totalTrades || 0} completados
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("my-orders")}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] hover:border-brand-500/20 transition-all text-left active:scale-[0.98]"
        >
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              Mis anuncios
            </p>
            <p className="text-[10px] text-gray-400">
              P2P activos
            </p>
          </div>
        </button>
      </div>

      {/* ═══ NOTIFICACIONES RECIENTES ════════════════════════ */}
      {unreadNotifs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Notificaciones
              </h2>
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-brand-500 text-white text-[9px] font-black flex items-center justify-center">
                {unreadNotifs.length}
              </span>
            </div>
            <button
              onClick={() => navigate("notifications")}
              className="text-xs text-brand-500 font-semibold flex items-center gap-0.5 hover:text-brand-400"
            >
              Ver todo <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            {unreadNotifs.slice(0, 3).map((notif) => {
              const iconMap: Record<string, JSX.Element> = {
                trade:   <ArrowLeftRight className="h-4 w-4 text-brand-500"   />,
                kyc:     <Shield         className="h-4 w-4 text-amber-500"   />,
                product: <ShoppingBag    className="h-4 w-4 text-violet-500"  />,
                alert:   <AlertTriangle  className="h-4 w-4 text-red-500"     />,
              };

              return (
                <button
                  key={notif.id}
                  onClick={() => navigate("notifications")}
                  className="w-full flex items-start gap-3 p-3.5 rounded-2xl bg-brand-500/[0.02] border border-brand-500/10 hover:border-brand-500/20 transition-all text-left active:scale-[0.99]"
                >
                  <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {iconMap[notif.type] || (
                      <Zap className="h-4 w-4 text-brand-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {notif.message}
                    </p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5 animate-pulse" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ BANNER PROMO CTA ════════════════════════════════ */}
      <button
        onClick={() => navigate("create-order")}
        className="w-full relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-left active:scale-[0.99] transition-all"
      >
        <div className="absolute -top-4 -right-4 h-20 w-20 bg-white/5 rounded-full" />
        <div className="absolute -bottom-3 -left-3 h-16 w-16 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black">
              Publica tu primera oferta P2P
            </p>
            <p className="text-xs text-white/70 mt-0.5">
              Compra o vende cripto sin comisiones
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-white/60 flex-shrink-0" />
        </div>
      </button>
    </div>
  );
}
