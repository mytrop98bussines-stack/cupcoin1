import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }        from "@/components/ui/Card";
import { Button }      from "@/components/ui/Button";
import {
  Clock, Filter, Search, Download,
  ChevronLeft, ChevronRight, X,
  ArrowDownLeft, ArrowUpRight, RefreshCw,
  Loader2, ArrowLeft, TrendingUp,
  CheckCircle2, AlertTriangle,
} from "lucide-react";

const BACKEND_URL    = "https://cubax-backend.onrender.com";
const ITEMS_PER_PAGE = 10;

type FilterType  = "all" | "deposit" | "withdraw" | "trade";
type FilterAsset = "all" | "USDT" | "BTC" | "ETH" | "USDC" | "XLM";

export function HistoryPage() {
  const { user, navigate } = useAppStore();

  const [movements, setMovements]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType]   = useState<FilterType>("all");
  const [filterAsset, setFilterAsset] = useState<FilterAsset>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ─── Cargar historial ─────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/api/wallet/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMovements(data.movements);
    } catch (err) {
      console.error("❌ Error cargando historial:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setTimeout(() => setRefreshing(false), 800);
  };

  // ─── Filtrar movimientos ─────────────────────────────────
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      // Filtro por tipo
      if (filterType !== "all") {
        const isDeposit  = mov.amount > 0 && mov.label?.toLowerCase().includes("depósito");
        const isWithdraw = mov.amount < 0 && mov.label?.toLowerCase().includes("retiro");
        const isTrade    = mov.label?.toLowerCase().includes("trade") || mov.label?.toLowerCase().includes("p2p");

        if (filterType === "deposit"  && !isDeposit)  return false;
        if (filterType === "withdraw" && !isWithdraw) return false;
        if (filterType === "trade"    && !isTrade)    return false;
      }

      // Filtro por moneda
      if (filterAsset !== "all" && mov.asset !== filterAsset) return false;

      // Búsqueda por hash o label
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hashMatch  = mov.txHash?.toLowerCase().includes(q);
        const labelMatch = mov.label?.toLowerCase().includes(q);
        if (!hashMatch && !labelMatch) return false;
      }

      return true;
    });
  }, [movements, filterType, filterAsset, searchQuery]);

  // ─── Paginación ──────────────────────────────────────────
  const totalPages   = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const startIdx     = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMov = filteredMovements.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterAsset, searchQuery]);

  // ─── Exportar CSV ────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      alert("No hay movimientos para exportar");
      return;
    }

    const headers = ["Fecha", "Descripción", "Tipo", "Monto", "Moneda", "Estado", "TxHash"];
    const rows    = filteredMovements.map((mov) => [
      new Date(mov.createdAt).toLocaleString("es-CU"),
      mov.label || "—",
      mov.amount > 0 ? "Entrada" : "Salida",
      Math.abs(mov.amount),
      mov.asset || "—",
      mov.status || "—",
      mov.txHash || "—",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `cupcoin_wallet_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Estadísticas rápidas ────────────────────────────────
  const stats = useMemo(() => {
    const totalDeposits = movements.filter((m) => m.amount > 0).length;
    const totalWithdraws = movements.filter((m) => m.amount < 0).length;
    return {
      total:     movements.length,
      deposits:  totalDeposits,
      withdraws: totalWithdraws,
    };
  }, [movements]);

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("wallet")}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Historial
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">
              Todos tus movimientos
            </p>
          </div>
        </div>
        <button onClick={handleRefresh} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5">
          <RefreshCw className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-2">
        <Card padding="md" className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-brand-500" />
          </div>
          <p className="text-lg font-black text-gray-900 dark:text-white">
            {stats.total}
          </p>
          <p className="text-[9px] text-gray-400 font-semibold uppercase">Total</p>
        </Card>

        <Card padding="md" className="text-center bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center justify-center mb-1">
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-500">
            {stats.deposits}
          </p>
          <p className="text-[9px] text-gray-400 font-semibold uppercase">Entradas</p>
        </Card>

        <Card padding="md" className="text-center bg-red-500/5 border-red-500/20">
          <div className="flex items-center justify-center mb-1">
            <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
          </div>
          <p className="text-lg font-black text-red-500">
            {stats.withdraws}
          </p>
          <p className="text-[9px] text-gray-400 font-semibold uppercase">Salidas</p>
        </Card>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            showFilters || filterType !== "all" || filterAsset !== "all"
              ? "bg-brand-500/10 text-brand-500"
              : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros
          {(filterType !== "all" || filterAsset !== "all") && (
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          )}
        </button>

        <button
          onClick={handleExportCSV}
          disabled={filteredMovements.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros expandibles */}
      {showFilters && (
        <Card padding="md" className="space-y-3 animate-slide-up">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por hash o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
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

          {/* Filtro por tipo */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Tipo</p>
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "deposit", "withdraw", "trade"] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filterType === t
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {t === "all"      ? "Todos"    :
                   t === "deposit"  ? "Depósitos" :
                   t === "withdraw" ? "Retiros"  : "Trades"}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por moneda */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Moneda</p>
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "USDT", "USDC", "BTC", "ETH", "XLM"] as FilterAsset[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setFilterAsset(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filterAsset === a
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {a === "all" ? "Todas" : a}
                </button>
              ))}
            </div>
          </div>

          {/* Limpiar */}
          {(filterType !== "all" || filterAsset !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setFilterType("all");
                setFilterAsset("all");
                setSearchQuery("");
              }}
              className="text-xs text-red-500 font-bold flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpiar todos los filtros
            </button>
          )}
        </Card>
      )}

      {/* Lista de movimientos */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-400">Cargando historial...</p>
        </div>
      ) : filteredMovements.length === 0 ? (
        <Card padding="lg" className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            {movements.length === 0 ? "Sin movimientos" : "Sin resultados"}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {movements.length === 0
              ? "Aquí aparecerán tus depósitos, retiros y trades."
              : "Prueba cambiando los filtros o la búsqueda."}
          </p>
          {movements.length === 0 && (
            <Button size="sm" onClick={() => navigate("wallet")}>
              Volver a Wallet
            </Button>
          )}
        </Card>
      ) : (
        <>
          <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.06] overflow-hidden">
            {paginatedMov.map((mov) => {
              const isPositive = mov.amount > 0;
              return (
                <div key={mov.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                    isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}>
                    {mov.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {mov.label}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[10px] text-gray-400">
                        {new Date(mov.createdAt).toLocaleDateString("es-CU", {
                          day:   "numeric",
                          month: "short",
                          year:  "numeric",
                        })}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        mov.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : mov.status === "pending"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {mov.status === "completed" ? "✓ Completado" :
                         mov.status === "pending"   ? "⏳ Pendiente" : "❌ Fallido"}
                      </span>
                    </div>
                    {mov.txHash && (
                      <p className="text-[9px] text-gray-400 font-mono truncate mt-0.5">
                        Tx: {mov.txHash.slice(0, 20)}...
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-black ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                      {isPositive ? "+" : ""}{mov.amount} {mov.asset}
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 px-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>

              <span className="text-xs text-gray-400 font-medium">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <p className="text-center text-[10px] text-gray-400 mt-2">
            Mostrando {paginatedMov.length} de {filteredMovements.length} movimientos
          </p>
        </>
      )}
    </div>
  );
}
