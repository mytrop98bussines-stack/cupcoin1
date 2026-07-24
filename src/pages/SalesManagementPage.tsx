import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  ShoppingBag, MapPin, Truck, MessageCircle,
  Loader2, ArrowLeft, Filter, Search, X,
  CheckCircle2, Clock, Package, DollarSign,
  TrendingUp, Users, RefreshCw,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com";

type SaleStatus = "all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "⏳ Pendiente",   color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10 border-amber-500/20" },
  confirmed: { label: "✅ Confirmado",  color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/10 border-blue-500/20" },
  shipped:   { label: "🚚 Enviado",     color: "text-indigo-600 dark:text-indigo-400",   bg: "bg-indigo-500/10 border-indigo-500/20" },
  delivered: { label: "📦 Entregado",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  cancelled: { label: "❌ Cancelado",   color: "text-red-600 dark:text-red-400",         bg: "bg-red-500/10 border-red-500/20" },
};

export function SalesManagementPage() {
  const {
    user, navigate,
    selectedSalesProductId,
    setSelectedSalesProductId,
  } = useAppStore();

  const [sales, setSales]                 = useState<any[]>([]);
  const [stats, setStats]                 = useState<any>(null);
  const [productInfo, setProductInfo]     = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [filterStatus, setFilterStatus]   = useState<SaleStatus>("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [showFilters, setShowFilters]     = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // ─── Cargar ventas ────────────────────────────────────────
  const loadSales = async () => {
    try {
      const token = localStorage.getItem("cubax_token");
      const url   = selectedSalesProductId
        ? `${BACKEND_URL}/api/products/${selectedSalesProductId}/sales`
        : `${BACKEND_URL}/api/seller/sales`;

      const res  = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setSales(data.sales || []);
        if (data.stats)   setStats(data.stats);
        if (data.product) setProductInfo(data.product);
      }
    } catch (err) {
      console.error("❌ Error cargando ventas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    void loadSales();

    const intervalId = window.setInterval(loadSales, 15000);
    return () => window.clearInterval(intervalId);
  }, [user?.uid, selectedSalesProductId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSales();
    setTimeout(() => setRefreshing(false), 800);
  };

  // ─── Actualizar estado de venta ──────────────────────────
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(
        `${BACKEND_URL}/api/marketplace/orders/${orderId}/status`,
        {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSales((prev) =>
          prev.map((s) => s.id === orderId ? { ...s, status: newStatus } : s)
        );
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setUpdatingOrder(null);
    }
  };

  // ─── Filtrar ventas ──────────────────────────────────────
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (filterStatus !== "all" && sale.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !sale.buyerName?.toLowerCase().includes(q) &&
          !sale.productTitle?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [sales, filterStatus, searchQuery]);

  // ─── Handler volver ──────────────────────────────────────
  const handleBack = () => {
    setSelectedSalesProductId(null);
    if (selectedSalesProductId) {
      navigate("product-detail");
    } else {
      navigate("marketplace");
    }
  };

  // ─── Handler abrir chat ──────────────────────────────────
  const handleOpenChat = (sale: any) => {
    // Navegar al producto y activar chat
    useAppStore.setState({ selectedProductId: sale.productId });
    setSelectedSalesProductId(null);
    navigate("product-detail");
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">Cargando ventas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {productInfo ? "Ventas del producto" : "Gestión de Ventas"}
          </h1>
          <p className="text-[10px] text-gray-400">
            {productInfo?.title || `${sales.length} ventas totales`}
          </p>
        </div>
        <button onClick={handleRefresh} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5">
          <RefreshCw className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Info del producto (si viene de detalle) */}
      {productInfo && productInfo.image && (
        <Card padding="md">
          <div className="flex items-center gap-3">
            <img
              src={productInfo.image}
              alt={productInfo.title}
              className="h-14 w-14 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {productInfo.title}
              </p>
              <p className="text-xs text-gray-400">
                {sales.length} {sales.length === 1 ? "venta" : "ventas"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Estadísticas globales (solo si no es de un producto específico) */}
      {!productInfo && stats && (
        <div className="grid grid-cols-2 gap-2">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <ShoppingBag className="h-3.5 w-3.5 text-brand-500" />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Ventas</p>
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </Card>

          <Card padding="md" className="bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Ingresos</p>
            </div>
            <p className="text-xl font-black text-emerald-500">
              ${stats.totalRevenue?.toLocaleString("en-US") || 0}
            </p>
          </Card>

          <Card padding="md" className="bg-amber-500/5 border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Pendientes</p>
            </div>
            <p className="text-xl font-black text-amber-500">
              {stats.pending}
            </p>
          </Card>

          <Card padding="md" className="bg-indigo-500/5 border-indigo-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-3.5 w-3.5 text-indigo-500" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">En camino</p>
            </div>
            <p className="text-xl font-black text-indigo-500">
              {stats.shipped}
            </p>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
            showFilters || filterStatus !== "all" || searchQuery
              ? "bg-brand-500/10 text-brand-500"
              : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros
          {(filterStatus !== "all" || searchQuery) && (
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          )}
        </button>

        <span className="text-xs text-gray-400 font-medium">
          {filteredSales.length} {filteredSales.length === 1 ? "resultado" : "resultados"}
        </span>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <Card padding="md" className="space-y-3 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por comprador o producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Estado</p>
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as SaleStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    filterStatus === s
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {s === "all" ? "Todas" : STATUS_CONFIG[s]?.label.replace(/[⏳✅🚚📦❌]\s?/, "")}
                </button>
              ))}
            </div>
          </div>

          {(filterStatus !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setFilterStatus("all");
                setSearchQuery("");
              }}
              className="text-xs text-red-500 font-bold flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          )}
        </Card>
      )}

      {/* Lista de ventas */}
      {filteredSales.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <ShoppingBag className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            {sales.length === 0 ? "Sin ventas aún" : "Sin resultados"}
          </p>
          <p className="text-xs text-gray-400">
            {sales.length === 0
              ? "Cuando alguien compre tu producto aparecerá aquí"
              : "Prueba cambiando los filtros"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredSales.map((sale) => {
            const cfg = STATUS_CONFIG[sale.status] || STATUS_CONFIG.pending;
            const isUpdating = updatingOrder === sale.id;

            return (
              <Card key={sale.id} padding="md" className="space-y-3">

                {/* Header con comprador y estado */}
                <div className="flex items-center gap-3">
                  <Avatar name={sale.buyerName} src={sale.buyerPhoto} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {sale.buyerName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(sale.createdAt).toLocaleString("es-CU", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Producto (solo si es vista global) */}
                {!productInfo && sale.productTitle && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    {sale.productImage && (
                      <img
                        src={sale.productImage}
                        alt={sale.productTitle}
                        className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {sale.productTitle}
                    </p>
                  </div>
                )}

                {/* Detalles */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-brand-500/5 border border-brand-500/20">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Monto</p>
                    <p className="text-sm font-bold text-brand-500">
                      ${sale.amount} {sale.currency}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Entrega</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                      {sale.deliveryMethod === "delivery"
                        ? <><Truck className="h-3 w-3" /> Envío</>
                        : <><MapPin className="h-3 w-3" /> Recogida</>
                      }
                    </p>
                  </div>
                </div>

                {/* Dirección */}
                {sale.deliveryAddress && (
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Dirección
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {sale.deliveryAddress}
                    </p>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenChat(sale)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-brand-500/10 text-brand-500 text-xs font-bold hover:bg-brand-500/20"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </button>

                  {sale.status === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus(sale.id, "confirmed")}
                      disabled={isUpdating}
                      className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold hover:bg-blue-500/20 disabled:opacity-40"
                    >
                      {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "✅ Confirmar"}
                    </button>
                  )}
                  {sale.status === "confirmed" && (
                    <button
                      onClick={() => handleUpdateStatus(sale.id, "shipped")}
                      disabled={isUpdating}
                      className="flex-1 py-2 rounded-lg bg-indigo-500/10 text-indigo-500 text-xs font-bold hover:bg-indigo-500/20 disabled:opacity-40"
                    >
                      {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "🚚 Enviar"}
                    </button>
                  )}
                  {sale.status === "shipped" && (
                    <button
                      onClick={() => handleUpdateStatus(sale.id, "delivered")}
                      disabled={isUpdating}
                      className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                      {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "📦 Entregar"}
                    </button>
                  )}
                </div>

                {/* Cancelar (solo si está pendiente o confirmado) */}
                {(sale.status === "pending" || sale.status === "confirmed") && (
                  <button
                    onClick={() => {
                      if (confirm("¿Cancelar este pedido?")) {
                        handleUpdateStatus(sale.id, "cancelled");
                      }
                    }}
                    disabled={isUpdating}
                    className="w-full py-1.5 text-[10px] text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/5 rounded-lg"
                  >
                    Cancelar pedido
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
 }
