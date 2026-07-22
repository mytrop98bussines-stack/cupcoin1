import { useState, useMemo, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_COLORS,
  CRYPTO_ICONS,
} from "@/data/data";
import {
  TrendingUp, TrendingDown, Star, Plus,
  Search, Filter, X, Loader2,
  AlertTriangle, RefreshCw, ShieldCheck, Trash2,
  BadgeCheck,
} from "lucide-react";
import type {
  OrderType, CryptoAsset, PaymentMethod, P2POrder,
} from "@/types";

// ─── Constante del backend ────────────────────────────────
const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function P2PPage() {
  const {
    navigate, setSelectedTradeId, setActiveTrade,
    orders, setOrders, user, prices, fetchPrices,
  } = useAppStore();

  const [activeTab, setActiveTab]             = useState<OrderType>("buy");
  const [selectedAsset, setSelectedAsset]     = useState<CryptoAsset | "all">("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | "all">("all");
  const [onlyVerified, setOnlyVerified]       = useState(false);
  const [searchQuery, setSearchQuery]         = useState("");
  const [showFilters, setShowFilters]         = useState(false);
  const [loadingOrders, setLoadingOrders]     = useState(true);
  const [creatingTrade, setCreatingTrade]     = useState<string | null>(null);
  const [tradeError, setTradeError]           = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);

  const [tradeModal, setTradeModal] = useState<{
    order:  P2POrder;
    amount: string;
  } | null>(null);

  // ─── Barra de precios ─────────────────────────────────────
  const priceBar = useMemo(() => [
    {
      id:     "btc",
      symbol: "BTC",
      current_price:               prices.find((p) => p.symbol === "BTC")?.priceUSD  || 67500,
      price_change_percentage_24h: prices.find((p) => p.symbol === "BTC")?.change24h || 0,
    },
    {
      id:     "eth",
      symbol: "ETH",
      current_price:               prices.find((p) => p.symbol === "ETH")?.priceUSD  || 3500,
      price_change_percentage_24h: prices.find((p) => p.symbol === "ETH")?.change24h || 0,
    },
    {
      id:     "usdt",
      symbol: "USDT",
      current_price:               prices.find((p) => p.symbol === "USDT")?.priceUSD || 1,
      price_change_percentage_24h: prices.find((p) => p.symbol === "USDT")?.change24h || 0,
    },
    {
      id:     "usdc",
      symbol: "USDC",
      current_price:               prices.find((p) => p.symbol === "USDC")?.priceUSD || 1,
      price_change_percentage_24h: prices.find((p) => p.symbol === "USDC")?.change24h || 0,
    },
  ], [prices]);

  // ─── Cargar órdenes via backend ───────────────────────────
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/orders`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("❌ Error cargando órdenes:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, [setOrders]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // ─── Refrescar precios ────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrices();
    await loadOrders();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchPrices, loadOrders]);

  // ─── Filtrado ─────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === "buy"  && order.type !== "sell") return false;
      if (activeTab === "sell" && order.type !== "buy")  return false;
      if (selectedAsset   !== "all" && order.asset !== selectedAsset)                      return false;
      if (selectedPayment !== "all" && !order.paymentMethods.includes(selectedPayment))    return false;
      if (searchQuery && !order.userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // ✅ Filtro "Solo traders verificados"
      if (onlyVerified && !(order as any).userVerified) return false;

      return true;
    });
  }, [orders, activeTab, selectedAsset, selectedPayment, searchQuery, onlyVerified]);

  // ─── Mis órdenes activas ──────────────────────────────────
  const myOrders = useMemo(
    () => orders.filter((o) => o.userId === user?.uid),
    [orders, user?.uid]
  );

  // ─── Abrir modal ──────────────────────────────────────────
  const handleTrade = useCallback((orderId: string) => {
    setTradeError(null);

    if (!user?.uid) {
      setTradeError("Debes iniciar sesión para operar.");
      return;
    }

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.userId === user.uid) {
      setTradeError("No puedes operar con tu propia orden.");
      return;
    }

    setTradeModal({ order, amount: String(order.minAmount) });
  }, [user, orders]);

  // ─── Ejecutar trade via backend ───────────────────────────
  const executeTrade = useCallback(async () => {
    if (!tradeModal || !user?.uid) return;

    const { order, amount } = tradeModal;
    const amountNum = parseFloat(amount);

    if (
      isNaN(amountNum) ||
      amountNum < order.minAmount ||
      amountNum > order.maxAmount
    ) {
      setTradeError(
        `El monto debe estar entre ${order.minAmount} y ${order.maxAmount} ${order.asset}.`
      );
      return;
    }

    setTradeModal(null);
    setCreatingTrade(order.id);
    setTradeError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/trades/create`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          amount:  amountNum,
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setActiveTrade(data.trade);
      setSelectedTradeId(data.trade.id);
      navigate("trade");

    } catch (error: any) {
      console.error("❌ Error creando trade:", error);
      setTradeError(error.message || "Error al iniciar el trade.");
    } finally {
      setCreatingTrade(null);
    }
  }, [tradeModal, user, navigate, setActiveTrade, setSelectedTradeId]);

  // ─── Eliminar orden propia via backend ────────────────────
  const handleDeleteOrder = useCallback(async (orderId: string) => {
    if (!user?.uid) return;
    if (!window.confirm("¿Seguro que quieres eliminar este anuncio?")) return;

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/orders/cancel`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: user.uid,
          orderId,
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setOrders(orders.filter((o) => o.id !== orderId));

    } catch (error: any) {
      setTradeError(error.message || "Error al eliminar la orden.");
    }
  }, [user?.uid, orders, setOrders]);

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* ═══ BARRA DE PRECIOS ════════════════════════════════ */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {priceBar.map((coin) => {
          const isUp = coin.price_change_percentage_24h >= 0;
          return (
            <div
              key={coin.id}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
            >
              <span className="text-lg">
                {CRYPTO_ICONS[coin.symbol.toUpperCase()] || "🪙"}
              </span>
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  ${coin.current_price.toLocaleString("en-US")}
                </div>
                <div className={`text-[10px] font-semibold flex items-center gap-0.5 ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                  {isUp
                    ? <TrendingUp  className="h-2.5 w-2.5" />
                    : <TrendingDown className="h-2.5 w-2.5" />
                  }
                  {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
        <button
          onClick={handleRefresh}
          className="flex-shrink-0 flex items-center justify-center px-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] text-gray-400 hover:text-brand-500 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Mercado P2P
          </h1>
          <p className="text-[11px] text-gray-400">
            {loadingOrders
              ? "Cargando..."
              : `${filteredOrders.length} orden${filteredOrders.length !== 1 ? "es" : ""} disponible${filteredOrders.length !== 1 ? "s" : ""}`
            }
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("create-order")}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Publicar
        </Button>
      </div>

      {/* ═══ MIS ÓRDENES ACTIVAS ═════════════════════════════ */}
      {myOrders.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20">
          <ShieldCheck className="h-4 w-4 text-brand-500 flex-shrink-0" />
          <p className="text-xs text-brand-600 dark:text-brand-400 flex-1">
            Tienes <strong>{myOrders.length}</strong> orden{myOrders.length !== 1 ? "es" : ""} activa{myOrders.length !== 1 ? "s" : ""} en el mercado.
          </p>
        </div>
      )}

      {/* ═══ ERROR BANNER ════════════════════════════════════ */}
      {tradeError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{tradeError}</p>
          <button onClick={() => setTradeError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ═══ TABS ════════════════════════════════════════════ */}
      <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
        {(["buy", "sell"] as OrderType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === tab
                ? tab === "buy"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-red-500 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab === "buy" ? "🟢 Comprar" : "🔴 Vender"}
          </button>
        ))}
      </div>

      {/* ═══ TOGGLE VERIFIED ═════════════════════════════════ */}
      <button
        onClick={() => setOnlyVerified(!onlyVerified)}
        className={`w-full flex items-center gap-2 p-3 rounded-xl border transition-all ${
          onlyVerified
            ? "bg-blue-500/10 border-blue-500/30"
            : "bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06]"
        }`}
      >
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          onlyVerified ? "bg-blue-500" : "bg-gray-200 dark:bg-white/10"
        }`}>
          <BadgeCheck className={`h-4 w-4 ${onlyVerified ? "text-white" : "text-gray-400"}`} />
        </div>
        <div className="flex-1 text-left">
          <p className={`text-xs font-bold ${
            onlyVerified ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
          }`}>
            Solo traders verificados
          </p>
          <p className="text-[10px] text-gray-400">
            Traders con +20 trades y rating 4.5⭐
          </p>
        </div>
        <div className={`relative h-5 w-9 rounded-full transition-colors flex items-center flex-shrink-0 ${
          onlyVerified ? "bg-blue-500" : "bg-gray-300 dark:bg-white/20"
        }`}>
          <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            onlyVerified ? "translate-x-[18px]" : "translate-x-0.5"
          }`} />
        </div>
      </button>
            {/* ═══ BÚSQUEDA Y FILTROS ══════════════════════════════ */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-colors relative ${
            showFilters
              ? "border-brand-500 bg-brand-500/10 text-brand-500"
              : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
          }`}
        >
          <Filter className="h-4 w-4" />
          {(selectedAsset !== "all" || selectedPayment !== "all") && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-brand-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ═══ PANEL DE FILTROS ════════════════════════════════ */}
      {showFilters && (
        <Card padding="md" className="animate-slide-up space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Criptomoneda
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "USDT", "USDC", "BTC", "ETH"] as const).map((asset) => (
                <button
                  key={asset}
                  onClick={() => setSelectedAsset(asset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedAsset === asset
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {asset === "all" ? "Todas" : `${CRYPTO_ICONS[asset] || ""} ${asset}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Método de pago
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "transfermovil", "enzona", "efectivo"] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedPayment === method
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {method === "all" ? "Todos" : PAYMENT_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedAsset("all");
              setSelectedPayment("all");
              setSearchQuery("");
              setOnlyVerified(false);
              setShowFilters(false);
            }}
            className="text-xs text-red-500 font-bold flex items-center gap-1 hover:text-red-400 transition-colors"
          >
            <X className="h-3 w-3" /> Limpiar todos los filtros
          </button>
        </Card>
      )}

      {/* ═══ LISTA DE ÓRDENES ════════════════════════════════ */}
      <div className="space-y-2">
        {loadingOrders ? (
          <div className="text-center py-12">
            <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Escaneando órdenes en la red...</p>
          </div>

        ) : filteredOrders.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Sin órdenes disponibles
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {onlyVerified
                ? "No hay traders verificados con esos filtros. Prueba desactivando el filtro."
                : "Prueba cambiando los filtros o publica tu propia oferta."
              }
            </p>
            <Button
              size="sm"
              onClick={() => navigate("create-order")}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Publicar oferta
            </Button>
          </Card>

        ) : (
          filteredOrders.map((order) => {
            const isVerified = (order as any).userVerified === true;

            return (
              <Card key={order.id} padding="md" className={`space-y-3 ${
                isVerified ? "border-blue-500/20" : ""
              }`}>

                {/* Info del usuario */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <Avatar name={order.userName} size="sm" />
                      {isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border border-white dark:border-gray-900">
                          <VerifiedBadge verified={true} size="sm" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {order.userName}
                        </span>
                        {isVerified && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                            Verificado
                          </span>
                        )}
                        {order.userId === user?.uid && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500">
                            Tuya
                          </span>
                        )}
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-[10px] font-bold">
                            {order.userRating?.toFixed(1) || "5.0"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {order.userTrades || 0} trades completados
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={order.type === "sell" ? "success" : "danger"}
                    size="sm"
                  >
                    {order.type === "sell" ? "Vende" : "Compra"}
                  </Badge>
                </div>

                {/* Precio y disponible */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">
                      Precio por {order.asset}
                    </p>
                    <p className="text-xl font-black text-gray-900 dark:text-white leading-none">
                      {order.pricePerUnit.toLocaleString("es-CU")}
                      <span className="text-xs font-medium text-gray-400 ml-1">
                        {order.currency}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">Rango</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {order.minAmount} – {order.maxAmount}{" "}
                      <span className="text-xs font-medium text-gray-400">
                        {order.asset}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Métodos */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {order.paymentMethods.map((method) => (
                      <span
                        key={method}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          PAYMENT_METHOD_COLORS[method] ||
                          "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {PAYMENT_METHOD_LABELS[method] || method}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                    {order.availableAmount} {order.asset} disp.
                  </p>
                </div>

                {/* Botón acción */}
                {order.userId === user?.uid ? (
                  <div className="flex gap-2">
                    <div className="flex-1 py-2 text-center text-xs text-gray-400 font-medium bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      📌 Tu anuncio activo
                    </div>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      title="Eliminar anuncio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    fullWidth
                    disabled={!!creatingTrade}
                    onClick={() => handleTrade(order.id)}
                    className={
                      activeTab === "buy"
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                        : "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/20"
                    }
                  >
                    {creatingTrade === order.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Iniciando trade...
                      </span>
                    ) : activeTab === "buy" ? (
                      `Comprar ${order.asset}`
                    ) : (
                      `Vender ${order.asset}`
                    )}
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ═══ MODAL DE CANTIDAD ═══════════════════════════════ */}
      {tradeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-2xl shadow-2xl p-5 space-y-4 animate-slide-up">

            {/* Cabecera del modal */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {activeTab === "buy" ? "Comprar" : "Vender"}{" "}
                {tradeModal.order.asset}
              </h3>
              <button
                onClick={() => setTradeModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Info del precio */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Precio por {tradeModal.order.asset}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {tradeModal.order.pricePerUnit.toLocaleString("es-CU")} CUP
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Rango disponible</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {tradeModal.order.minAmount} – {tradeModal.order.maxAmount}{" "}
                  {tradeModal.order.asset}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {tradeModal.order.type === "sell" ? "Vendedor" : "Comprador"}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  {tradeModal.order.userName}
                  {(tradeModal.order as any).userVerified && (
                    <VerifiedBadge verified={true} size="sm" />
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Métodos de pago</span>
                <span className="font-semibold text-gray-900 dark:text-white text-right">
                  {tradeModal.order.paymentMethods
                    .map((m) => PAYMENT_METHOD_LABELS[m])
                    .join(", ")}
                </span>
              </div>
            </div>

            {/* Input de cantidad */}
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Cantidad a {activeTab === "buy" ? "comprar" : "vender"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={tradeModal.amount}
                  onChange={(e) =>
                    setTradeModal((prev) =>
                      prev ? { ...prev, amount: e.target.value } : null
                    )
                  }
                  min={tradeModal.order.minAmount}
                  max={tradeModal.order.maxAmount}
                  step="0.01"
                  className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm font-bold focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  {tradeModal.order.asset}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={tradeModal.order.minAmount}
                max={tradeModal.order.maxAmount}
                step="0.01"
                value={tradeModal.amount}
                onChange={(e) =>
                  setTradeModal((prev) =>
                    prev ? { ...prev, amount: e.target.value } : null
                  )
                }
                className="w-full mt-2 accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>Mín: {tradeModal.order.minAmount} {tradeModal.order.asset}</span>
                <span>Máx: {tradeModal.order.maxAmount} {tradeModal.order.asset}</span>
              </div>
            </div>

            {/* Total calculado en tiempo real */}
            {tradeModal.amount && parseFloat(tradeModal.amount) > 0 && (
              <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/20">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Total a pagar en CUP</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {parseFloat(tradeModal.amount)} {tradeModal.order.asset}{" "}
                      × {tradeModal.order.pricePerUnit.toLocaleString("es-CU")} CUP
                    </p>
                  </div>
                  <span className="text-xl font-black text-brand-500">
                    {(
                      parseFloat(tradeModal.amount) *
                      tradeModal.order.pricePerUnit
                    ).toLocaleString("es-CU")}{" "}
                    CUP
                  </span>
                </div>
              </div>
            )}

            {/* Botones del modal */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setTradeModal(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeTrade}
                disabled={
                  !tradeModal.amount ||
                  parseFloat(tradeModal.amount) < tradeModal.order.minAmount ||
                  parseFloat(tradeModal.amount) > tradeModal.order.maxAmount ||
                  !!creatingTrade
                }
                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeTab === "buy"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {creatingTrade
                  ? "Iniciando..."
                  : activeTab === "buy"
                  ? `Comprar ${tradeModal.order.asset}`
                  : `Vender ${tradeModal.order.asset}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                  }
