import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeftRight, ArrowDownLeft, ArrowUpRight,
  Clock, CheckCircle2, AlertTriangle, XCircle,
  Search, X, ExternalLink, ShoppingBag,
  ShoppingCart, Package,
} from "lucide-react";
import type { Trade, TradeStatus } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

// ─── Configuración de estados ─────────────────────────────
const STATUS_CONFIG: Record<
  TradeStatus,
  {
    label:   string;
    variant: "success" | "danger" | "info" | "warning" | "default";
    icon:    React.ReactNode;
  }
> = {
  awaiting_escrow:   { label: "Esperando escrow", variant: "warning", icon: <Clock         className="h-3 w-3" /> },
  escrow_funded:     { label: "Escrow fondeado",  variant: "info",    icon: <Clock         className="h-3 w-3" /> },
  payment_sent:      { label: "Pago enviado",     variant: "info",    icon: <Clock         className="h-3 w-3" /> },
  payment_confirmed: { label: "Pago confirmado",  variant: "info",    icon: <CheckCircle2  className="h-3 w-3" /> },
  crypto_released:   { label: "Completado",       variant: "success", icon: <CheckCircle2  className="h-3 w-3" /> },
  disputed:          { label: "En disputa",       variant: "danger",  icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled:         { label: "Cancelado",        variant: "default", icon: <XCircle       className="h-3 w-3" /> },
};

const ACTIVE_STATUSES: TradeStatus[] = [
  "awaiting_escrow",
  "escrow_funded",
  "payment_sent",
  "payment_confirmed",
];

interface MarketplaceOrder {
  id:           string;
  productId:    string;
  productTitle: string;
  productImage: string | null;
  priceUSDT:    number;
  buyerId:      string;
  buyerName:    string;
  sellerId:     string;
  sellerName:   string;
  status:       string;
  createdAt:    number;
}

type HistoryTab = "trades" | "marketplace";

export function TradeHistoryPage() {
  const { user, navigate, setActiveTrade, setSelectedTradeId } = useAppStore();

  const [activeTab, setActiveTab]                 = useState<HistoryTab>("trades");
  const [trades, setTrades]                       = useState<Trade[]>([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [loadingMarket, setLoadingMarket]         = useState(true);
  const [filter, setFilter]                       = useState<"all" | "buy" | "sell">("all");
  const [statusFilter, setStatusFilter]           = useState<TradeStatus | "all">("all");
  const [searchQuery, setSearchQuery]             = useState("");

  // ─── Cargar trades via backend ────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    let stopped = false;

    const loadTrades = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/trades/history`, {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ uid: user.uid }),
        });
        const data = await res.json();
        if (data.success && !stopped) {
          setTrades(data.trades);
        }
      } catch (err) {
        console.error("❌ Error cargando historial:", err);
      } finally {
        if (!stopped) setLoading(false);
      }
    };

    void loadTrades();
    const intervalId = window.setInterval(loadTrades, 30000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [user?.uid]);

  // ─── Cargar órdenes del marketplace via backend ───────────
  useEffect(() => {
    if (!user?.uid) return;

    setLoadingMarket(true);
    let stopped = false;

    const loadOrders = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/marketplace/orders`, {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ uid: user.uid }),
        });
        const data = await res.json();
        if (data.success && !stopped) {
          setMarketplaceOrders(data.orders);
        }
      } catch (err) {
        console.error("❌ Error cargando órdenes marketplace:", err);
      } finally {
        if (!stopped) setLoadingMarket(false);
      }
    };

    void loadOrders();
    const intervalId = window.setInterval(loadOrders, 30000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [user?.uid]);

  // ─── Entrar a un trade activo ─────────────────────────────
  const handleEnterTrade = (trade: Trade) => {
    setActiveTrade(trade);
    setSelectedTradeId(trade.id);
    navigate("trade");
  };

  // ─── Filtrado de trades ───────────────────────────────────
  const filteredTrades = trades.filter((trade) => {
    const isBuyer  = trade.buyerId  === user?.uid;
    const isSeller = trade.sellerId === user?.uid;

    if (filter === "buy"  && !isBuyer)  return false;
    if (filter === "sell" && !isSeller) return false;
    if (statusFilter !== "all" && trade.status !== statusFilter) return false;
    if (
      searchQuery &&
      !trade.asset.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(isBuyer ? trade.sellerName : trade.buyerName)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    ) return false;

    return true;
  });

  // ─── Estadísticas de trades ───────────────────────────────
  const completedTrades = trades.filter((t) => t.status === "crypto_released");
  const buyTrades       = trades.filter((t) => t.buyerId  === user?.uid).length;
  const sellTrades      = trades.filter((t) => t.sellerId === user?.uid).length;
  const activeTrades    = trades.filter((t) => ACTIVE_STATUSES.includes(t.status));

  // ─── Estadísticas de marketplace ─────────────────────────
  const marketBuys  = marketplaceOrders.filter((o) => o.buyerId  === user?.uid);
  const marketSells = marketplaceOrders.filter((o) => o.sellerId === user?.uid);

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      
      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <ArrowLeftRight className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Historial
          </h1>
          <p className="text-xs text-gray-400">
            Trades P2P y compras del Marketplace
          </p>
        </div>
      </div>

      {/* ═══ PESTAÑAS PRINCIPALES ════════════════════════════ */}
      <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("trades")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "trades"
              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Trades P2P
          {activeTrades.length > 0 && (
            <span className="h-4 w-4 rounded-full bg-brand-500 text-white text-[9px] font-black flex items-center justify-center">
              {activeTrades.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "marketplace"
              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Marketplace
        </button>
      </div>

      {/* =========================================================
          PESTAÑA: TRADES P2P
      ========================================================= */}
      {activeTab === "trades" && (
        <>
          {/* Trades activos */}
          {activeTrades.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ⚡ Trades en curso
              </p>
              {activeTrades.map((trade) => {
                const isBuyer    = trade.buyerId === user.uid;
                const statusConf = STATUS_CONFIG[trade.status];

                return (
                  <div
                    key={trade.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20"
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isBuyer ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}>
                      {isBuyer
                        ? <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                        : <ArrowUpRight  className="h-4 w-4 text-red-500" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {isBuyer ? "Compra" : "Venta"} {trade.amount} {trade.asset}
                        </p>
                        <Badge variant={statusConf.variant} size="sm">
                          {statusConf.label}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {isBuyer ? "Vendedor" : "Comprador"}:{" "}
                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                          {isBuyer ? trade.sellerName : trade.buyerName}
                        </span>
                        {" · "}
                        <span className="text-brand-500 font-bold">
                          {trade.totalFiat.toLocaleString("es-CU")} CUP
                        </span>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleEnterTrade(trade)}
                      icon={<ExternalLink className="h-3.5 w-3.5" />}
                    >
                      Entrar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Completados", value: completedTrades.length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Compras",     value: buyTrades,              color: "text-blue-500",    bg: "bg-blue-500/10"    },
              { label: "Ventas",      value: sellTrades,             color: "text-violet-500",  bg: "bg-violet-500/10"  },
            ].map((stat) => (
              <div key={stat.label} className={`p-3 rounded-xl ${stat.bg} text-center`}>
                <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por activo o usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="space-y-2">
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
              {(["all", "buy", "sell"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === f
                      ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {f === "all" ? "Todos" : f === "buy" ? "🟢 Compras" : "🔴 Ventas"}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {(["all", "awaiting_escrow", "escrow_funded", "payment_sent", "crypto_released", "disputed", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === s
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {s === "all" ? "Todos" : STATUS_CONFIG[s as TradeStatus]?.label || s}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de trades */}
          {loading ? (
            <div className="text-center py-12">
              <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Cargando historial...</p>
            </div>
          ) : filteredTrades.length === 0 ? (
            <Card padding="lg" className="text-center">
              <ArrowLeftRight className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Sin trades
              </p>
              <p className="text-xs text-gray-400">
                {searchQuery
                  ? "No encontramos trades con ese término."
                  : "Aún no has realizado ningún trade."}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTrades.map((trade) => {
                const isBuyer    = trade.buyerId === user.uid;
                const statusConf = STATUS_CONFIG[trade.status];
                const isActive   = ACTIVE_STATUSES.includes(trade.status);
                const date       = new Date(trade.createdAt).toLocaleDateString(
                  "es-CU",
                  { day: "numeric", month: "short", year: "numeric" }
                );

                return (
                  <Card
                    key={trade.id}
                    padding="md"
                    className={isActive ? "border-brand-500/30" : ""}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isBuyer ? "bg-emerald-500/10" : "bg-red-500/10"
                      }`}>
                        {isBuyer
                          ? <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                          : <ArrowUpRight  className="h-5 w-5 text-red-500" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {isBuyer ? "Compra" : "Venta"} de {trade.asset}
                          </p>
                          <Badge variant={statusConf.variant} size="sm">
                            {statusConf.label}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400">
                              {isBuyer ? "Vendedor" : "Comprador"}:{" "}
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {isBuyer ? trade.sellerName : trade.buyerName}
                              </span>
                            </p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {date} · #{trade.id.slice(-6)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                              {trade.amount} {trade.asset}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {trade.totalFiat.toLocaleString("es-CU")} CUP
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <button
                            onClick={() => handleEnterTrade(trade)}
                            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Continuar trade
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =========================================================
          PESTAÑA: MARKETPLACE
      ========================================================= */}
      {activeTab === "marketplace" && (
        <>
          {/* Stats marketplace */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Compras realizadas", value: marketBuys.length,  color: "text-emerald-500", bg: "bg-emerald-500/10", icon: <ShoppingCart className="h-4 w-4" /> },
              { label: "Ventas realizadas",  value: marketSells.length, color: "text-blue-500",    bg: "bg-blue-500/10",    icon: <Package      className="h-4 w-4" /> },
            ].map((stat) => (
              <div key={stat.label} className={`p-3 rounded-xl ${stat.bg} text-center`}>
                <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Lista de órdenes */}
          {loadingMarket ? (
            <div className="text-center py-12">
              <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Cargando historial...</p>
            </div>
          ) : marketplaceOrders.length === 0 ? (
            <Card padding="lg" className="text-center">
              <ShoppingBag className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Sin actividad en Marketplace
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Aún no has comprado ni vendido productos.
              </p>
              <Button size="sm" onClick={() => navigate("marketplace")}>
                Ir al Marketplace
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Compras */}
              {marketBuys.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    🛒 Mis compras ({marketBuys.length})
                  </p>
                  {marketBuys.map((order) => (
                    <Card key={order.id} padding="md">
                      <div className="flex items-center gap-3">
                        {/* Imagen */}
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
                          {order.productImage ? (
                            <img
                              src={order.productImage}
                              alt={order.productTitle}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {order.productTitle}
                          </p>
                          <p className="text-xs text-gray-400">
                            Vendedor:{" "}
                            <span className="font-semibold text-gray-600 dark:text-gray-300">
                              {order.sellerName}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString("es-CU", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>

                        {/* Precio y estado */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-brand-500">
                            {order.priceUSDT} USDT
                          </p>
                          <Badge variant="success" size="sm">
                            Completado
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              )}

              {/* Ventas */}
              {marketSells.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-2">
                    💰 Mis ventas ({marketSells.length})
                  </p>
                  {marketSells.map((order) => (
                    <Card key={order.id} padding="md">
                      <div className="flex items-center gap-3">
                        {/* Imagen */}
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
                          {order.productImage ? (
                            <img
                              src={order.productImage}
                              alt={order.productTitle}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {order.productTitle}
                          </p>
                          <p className="text-xs text-gray-400">
                            Comprador:{" "}
                            <span className="font-semibold text-gray-600 dark:text-gray-300">
                              {order.buyerName}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString("es-CU", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>

                        {/* Precio y estado */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-emerald-500">
                            +{order.priceUSDT} USDT
                          </p>
                          <Badge variant="success" size="sm">
                            Vendido
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
