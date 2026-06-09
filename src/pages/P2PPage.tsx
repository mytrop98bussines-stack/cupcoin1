import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import {
  MOCK_PRICES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_COLORS,
  CRYPTO_ICONS,
} from "@/data/mock";
import {
  TrendingUp,
  TrendingDown,
  Star,
  Plus,
  Search,
  Filter,
  X,
} from "lucide-react";
import type { OrderType, CryptoAsset, PaymentMethod, P2POrder } from "@/types";

export function P2PPage() {
  const { navigate, setSelectedTradeId, setActiveTrade, orders, setOrders, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<OrderType>("buy");
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | "all">("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const prices = MOCK_PRICES;

  // ==========================================
  // ESCUCHADOR EN TIEMPO REAL DESDE FIRESTORE
  // ==========================================
  useEffect(() => {
    setLoadingOrders(true);
    
    // Consultamos solo las órdenes activas del mercado ordenadas por la más reciente
    const q = query(
      collection(db, "orders"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders: P2POrder[] = [];
      snapshot.forEach((doc) => {
        liveOrders.push(doc.data() as P2POrder);
      });
      
      // Actualizamos el estado global en Zustand
      setOrders(liveOrders);
      setLoadingOrders(false);
    }, (error) => {
      console.error("Error cargando órdenes desde Firestore:", error);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [setOrders]);

  // ==========================================
  // FILTRADO AVANZADO (MANTENIENDO TU LÓGICA)
  // ==========================================
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Si la dApp está en pestaña "Comprar", busca anuncios de "Venta" (sell), y viceversa
      if (activeTab === "buy" && order.type !== "sell") return false;
      if (activeTab === "sell" && order.type !== "buy") return false;
      if (selectedAsset !== "all" && order.asset !== selectedAsset) return false;
      if (
        selectedPayment !== "all" &&
        !order.paymentMethods.includes(selectedPayment)
      )
        return false;
      if (
        searchQuery &&
        !order.userName.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [orders, activeTab, selectedAsset, selectedPayment, searchQuery]);

  const handleTrade = (orderId: string) => {
    setSelectedTradeId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      // Vinculamos la sesión real del usuario autenticado si existe en el Store
      const currentUserId = user?.uid || "user_001";
      const currentUserName = user?.displayName || "Carlos M.";

      setActiveTrade({
        id: `trade_${Date.now()}`,
        orderId: order.id,
        buyerId: activeTab === "buy" ? currentUserId : order.userId,
        buyerName: activeTab === "buy" ? currentUserName : order.userName,
        sellerId: activeTab === "buy" ? order.userId : currentUserId,
        sellerName: activeTab === "buy" ? order.userName : currentUserName,
        asset: order.asset,
        amount: order.minAmount,
        pricePerUnit: order.pricePerUnit,
        totalFiat: order.minAmount * order.pricePerUnit,
        currency: order.currency,
        paymentMethod: order.paymentMethods[0],
        status: "awaiting_escrow",
        escrowTxHash: null,
        releaseTxHash: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        paymentDetails: {
          method: order.paymentMethods[0],
          phone: "+53 5X XX XX XX",
          accountName: order.userName,
          instructions: "Realizar transferencia al número indicado.",
        },
      });
    }
    navigate("trade");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      {/* Prices Bar */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {prices.map((coin) => {
          const isUp = coin.price_change_percentage_24h >= 0;
          return (
            <div
              key={coin.id}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
            >
              <span className="text-brand-500 font-bold text-sm">
                {CRYPTO_ICONS[coin.symbol.toUpperCase()] || coin.symbol.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  ${coin.current_price.toLocaleString("en-US")}
                </div>
                <div
                  className={`text-[10px] font-medium flex items-center gap-0.5 ${
                    isUp ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Mercado P2P
        </h1>
        <Button
          size="sm"
          onClick={() => navigate("create-order")}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Publicar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
        {(["buy", "sell"] as OrderType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab
                ? tab === "buy"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-red-500 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {tab === "buy" ? "Comprar" : "Vender"}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
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
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-colors ${
            showFilters
              ? "border-brand-500 bg-brand-500/10 text-brand-500"
              : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
          }`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card padding="md" className="animate-slide-up">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Criptomoneda
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "USDT", "USDC", "BTC", "ETH"] as const).map((asset) => (
                  <button
                    key={asset}
                    onClick={() => setSelectedAsset(asset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedAsset === asset
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {asset === "all" ? "Todas" : asset}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Método de pago
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "transfermovil", "enzona", "efectivo"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedPayment(method)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedPayment === method
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {method === "all"
                      ? "Todos"
                      : PAYMENT_METHOD_LABELS[method]}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedAsset("all");
                setSelectedPayment("all");
                setSearchQuery("");
              }}
              className="text-xs text-brand-500 font-medium flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          </div>
        </Card>
      )}

      {/* Order Book */}
      <div className="space-y-2">
        {loadingOrders ? (
          <div className="text-center py-8">
            <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-400">Escaneando órdenes en la red...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay órdenes disponibles con estos filtros.
            </p>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} padding="md" className="space-y-3">
              {/* User Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={order.userName} size="sm" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {order.userName}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-[10px] font-medium">
                          {order.userRating}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {order.userTrades} trades completados
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

              {/* Price & Details */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    Precio por {order.asset}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {order.pricePerUnit.toLocaleString("es-CU")}{" "}
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {order.currency}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Disponible
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {order.availableAmount} {order.asset}
                  </p>
                </div>
              </div>

              {/* Limits & Payment */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {order.paymentMethods.map((method) => (
                    <span
                      key={method}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${PAYMENT_METHOD_COLORS[method] || "bg-gray-100 text-gray-500"}`}
                    >
                      {PAYMENT_METHOD_LABELS[method] || method}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {order.minAmount}-{order.maxAmount} {order.asset}
                </p>
              </div>

              {/* Action */}
              <Button
                size="sm"
                fullWidth
                variant={activeTab === "buy" ? "primary" : "danger"}
                onClick={() => handleTrade(order.id)}
                className={activeTab === "buy" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : ""}
              >
                {activeTab === "buy"
                  ? `Comprar ${order.asset}`
                  : `Vender ${order.asset}`}
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
        }
              
