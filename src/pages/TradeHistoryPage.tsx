import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebase/config";
import {
  collection, query, where, or,
  orderBy, onSnapshot, limit,
} from "firebase/firestore";
import {
  ArrowLeftRight, ArrowDownLeft, ArrowUpRight,
  Clock, CheckCircle2, AlertTriangle, XCircle,
  Search, X, ExternalLink,
} from "lucide-react";
import type { Trade, TradeStatus } from "@/types";

// ─── Configuración de estados ─────────────────────────────
const STATUS_CONFIG: Record<
  TradeStatus,
  {
    label:   string;
    variant: "success" | "danger" | "info" | "warning" | "default";
    icon:    React.ReactNode;
  }
> = {
  awaiting_escrow:   { label: "Esperando escrow", variant: "warning", icon: <Clock        className="h-3 w-3" /> },
  escrow_funded:     { label: "Escrow fondeado",  variant: "info",    icon: <Clock        className="h-3 w-3" /> },
  payment_sent:      { label: "Pago enviado",     variant: "info",    icon: <Clock        className="h-3 w-3" /> },
  payment_confirmed: { label: "Pago confirmado",  variant: "info",    icon: <CheckCircle2 className="h-3 w-3" /> },
  crypto_released:   { label: "Completado",       variant: "success", icon: <CheckCircle2 className="h-3 w-3" /> },
  disputed:          { label: "En disputa",       variant: "danger",  icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled:         { label: "Cancelado",        variant: "default", icon: <XCircle      className="h-3 w-3" /> },
};

// ✅ Estados que se consideran "activos" (el usuario puede entrar al trade)
const ACTIVE_STATUSES: TradeStatus[] = [
  "awaiting_escrow",
  "escrow_funded",
  "payment_sent",
  "payment_confirmed",
];

export function TradeHistoryPage() {
  const { user, navigate, setActiveTrade, setSelectedTradeId } = useAppStore();

  const [trades, setTrades]               = useState<Trade[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<"all" | "buy" | "sell">("all");
  const [statusFilter, setStatusFilter]   = useState<TradeStatus | "all">("all");
  const [searchQuery, setSearchQuery]     = useState("");

  // ─── Cargar trades en tiempo real ────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    const q = query(
      collection(db, "trades"),
      or(
        where("buyerId",  "==", user.uid),
        where("sellerId", "==", user.uid)
      ),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tradesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Trade[];
        setTrades(tradesList);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando historial:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // ─── Entrar a un trade activo ─────────────────────────────
  const handleEnterTrade = (trade: Trade) => {
    setActiveTrade(trade);
    setSelectedTradeId(trade.id);
    navigate("trade");
  };

  // ─── Filtrado ─────────────────────────────────────────────
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

  // ─── Estadísticas ─────────────────────────────────────────
  const completedTrades = trades.filter((t) => t.status === "crypto_released");
  const buyTrades       = trades.filter((t) => t.buyerId  === user?.uid).length;
  const sellTrades      = trades.filter((t) => t.sellerId === user?.uid).length;
  const activeTrades    = trades.filter((t) => ACTIVE_STATUSES.includes(t.status));

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
            Historial de Trades
          </h1>
          <p className="text-xs text-gray-400">
            {trades.length} trades en total
          </p>
        </div>
      </div>

      {/* ═══ TRADES ACTIVOS — ACCESO RÁPIDO ═════════════════ */}
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
                {/* Ícono */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isBuyer ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}>
                  {isBuyer
                    ? <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                    : <ArrowUpRight  className="h-4 w-4 text-red-500" />
                  }
                </div>

                {/* Info */}
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

                {/* Botón entrar */}
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

      {/* ═══ STATS ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Completados",
            value: String(completedTrades.length),
            color: "text-emerald-500",
            bg:    "bg-emerald-500/10",
          },
          {
            label: "Compras",
            value: String(buyTrades),
            color: "text-blue-500",
            bg:    "bg-blue-500/10",
          },
          {
            label: "Ventas",
            value: String(sellTrades),
            color: "text-violet-500",
            bg:    "bg-violet-500/10",
          },
        ].map((stat) => (
          <div key={stat.label} className={`p-3 rounded-xl ${stat.bg} text-center`}>
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ═══ BÚSQUEDA ════════════════════════════════════════ */}
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
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* ═══ FILTROS ═════════════════════════════════════════ */}
      <div className="space-y-2">
        {/* Tipo */}
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

        {/* Estado */}
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

      {/* ═══ LISTA DE TRADES ═════════════════════════════════ */}
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
                  {/* Ícono */}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isBuyer ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}>
                    {isBuyer
                      ? <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                      : <ArrowUpRight  className="h-5 w-5 text-red-500" />
                    }
                  </div>

                  {/* Info */}
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

                    {/* ✅ Botón entrar — solo para trades activos */}
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
    </div>
  );
                    }
