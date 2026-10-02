import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }        from "@/components/ui/Card";
import { Button }      from "@/components/ui/Button";
import {
  Clock, Filter, Search, Download,
  ChevronLeft, ChevronRight, X,
  ArrowDownLeft, ArrowUpRight, RefreshCw,
  Loader2, ArrowLeft, TrendingUp,
  ExternalLink,
} from "lucide-react";

const BACKEND_URL    = "https://cubax-backend.onrender.com";
const ITEMS_PER_PAGE = 10;

type FilterType = "all" | "deposit" | "withdraw" | "trade";

export function HistoryPage() {
  const { user, navigate } = useAppStore();

  const [movements, setMovements]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType]   = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ─── Cargar historial custodial ───────────────────────────
  const loadHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/api/wallet/history`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
      });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.movements)) {
        setMovements(data.movements);
      } else if (Array.isArray(data)) {
        setMovements(data);
      }
    } catch (err) {
      console.error("❌ Error cargando historial custodial:", err);
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
      const label = (mov.label || mov.description || mov.type || "").toLowerCase();
      const isDeposit  = mov.amount > 0 && (label.includes("depósito") || label.includes("deposit") || label.includes("in"));
      const isWithdraw = mov.amount < 0 || label.includes("retiro") || label.includes("withdraw") || label.includes("out");
      const isTrade    = label.includes("trade") || label.includes("p2p") || label.includes("orden") || label.includes("venta") || label.includes("compra");

      // Filtro por tipo
      if (filterType === "deposit"  && !isDeposit)  return false;
      if (filterType === "withdraw" && !isWithdraw) return false;
      if (filterType === "trade"    && !isTrade)    return false;

      // Búsqueda por hash, concepto o dirección
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hashMatch    = mov.txHash?.toLowerCase().includes(q) || mov.txId?.toLowerCase().includes(q);
        const labelMatch   = label.includes(q);
        const addressMatch = mov.toAddress?.toLowerCase().includes(q) || mov.fromAddress?.toLowerCase().includes(q);
        if (!hashMatch && !labelMatch && !addressMatch) return false;
      }

      return true;
    });
  }, [movements, filterType, searchQuery]);

  // ─── Paginación ──────────────────────────────────────────
  const totalPages   = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const startIdx     = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMov = filteredMovements.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  // ─── Exportar CSV ────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      alert("No hay movimientos para exportar");
      return;
    }

    const headers = ["Fecha", "Descripción", "Tipo", "Monto", "Moneda", "Red", "Estado", "TxHash"];
    const rows    = filteredMovements.map((mov) => [
      new Date(mov.createdAt || mov.timestamp || Date.now()).toLocaleString("es-CU"),
      mov.label || mov.description || "Movimiento",
      mov.amount > 0 ? "Entrada" : "Salida",
      Math.abs(mov.amount || mov.value || 0),
      "USDT",
      "Tron (TRC-20)",
      mov.status || "completed",
      mov.txHash || mov.txId || "—",
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
    link.download = `cubax_historial_usdt_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Estadísticas rápidas ────────────────────────────────
  const stats = useMemo(() => {
    const totalDeposits  = movements.filter((m) => m.amount > 0).length;
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

      {/* ═══ HEADER ══════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("wallet")}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Historial
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">
              Movimientos en USDT (TRC-20)
            </p>
          </div>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ═══ STATS RÁPIDAS ═══════════════════════════════ */}
      <div className="grid grid-cols-3 gap-2">
        <Card padding="md" className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
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
          <p className="text-[9px] text-gray-400 font-semibold uppercase">Depósitos</p>
        </Card>

        <Card padding="md" className="text-center bg-red-500/5 border-red-500/20">
          <div className="flex items-center justify-center mb-1">
            <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
          </div>
          <p className="text-lg font-black text-red-500">
            {stats.withdraws}
          </p>
          <p className="text-[9px] text-gray-400 font-semibold uppercase">Retiros</p>
        </Card>
      </div>

      {/* ═══ ACCIONES Y BOTÓN DE FILTRO ══════════════════ */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            showFilters || filterType !== "all"
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtrar
          {filterType !== "all" && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={handleExportCSV}
          disabled={filteredMovements.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 shadow-sm transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar CSV
        </button>
      </div>

      {/* ═══ FILTROS EXPANDIBLES ═════════════════════════ */}
      {showFilters && (
        <Card padding="md" className="space-y-3 animate-slide-up border border-gray-200 dark:border-white/10">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por hash, dirección o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por tipo */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Tipo de Movimiento</p>
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "deposit", "withdraw", "trade"] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === t
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {t === "all"      ? "Todos"     :
                   t === "deposit"  ? "Depósitos" :
                   t === "withdraw" ? "Retiros"   : "Trades P2P"}
                </button>
              ))}
            </div>
          </div>

          {/* Botón limpiar */}
          {(filterType !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setFilterType("all");
                setSearchQuery("");
              }}
              className="text-xs text-red-500 font-bold flex items-center gap-1 pt-1"
            >
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          )}
        </Card>
      )}

      {/* ═══ LISTADO DE MOVIMIENTOS ══════════════════════ */}
      {loading ? (
        <div className="text-center py-16 space-y-2">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Consultando movimientos en backend...</p>
        </div>
      ) : filteredMovements.length === 0 ? (
        <Card padding="lg" className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            {movements.length === 0 ? "Sin movimientos registrados" : "No hay resultados"}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {movements.length === 0
              ? "Las transferencias, depósitos y retiros aparecerán aquí."
              : "Intenta cambiar el criterio de búsqueda."}
          </p>
          {movements.length === 0 && (
            <Button size="sm" onClick={() => navigate("wallet")} className="bg-emerald-500 text-white">
              Ir a mi Wallet
            </Button>
          )}
        </Card>
      ) : (
        <>
          <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.06] overflow-hidden">
            {paginatedMov.map((mov, idx) => {
              const amount = parseFloat(mov.amount || mov.value || 0);
              const isPositive = amount > 0;
              const txHash = mov.txHash || mov.txId;
              const date = new Date(mov.createdAt || mov.timestamp || Date.now());

              return (
                <div key={mov.id || txHash || idx} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {isPositive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {mov.label || mov.description || (isPositive ? "Depósito USDT" : "Retiro USDT")}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="text-[10px] text-gray-400">
                        {date.toLocaleDateString("es-CU", {
                          day:   "numeric",
                          month: "short",
                          hour:  "2-digit",
                          minute:"2-digit"
                        })}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        mov.status === "completed" || !mov.status
                          ? "bg-emerald-500/10 text-emerald-500"
                          : mov.status === "pending"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {mov.status === "completed" || !mov.status ? "✓ Completado" :
                         mov.status === "pending"   ? "⏳ Pendiente"  : "❌ Fallido"}
                      </span>
                    </div>

                    {txHash && (
                      <a
                        href={`https://tronscan.org/#/transaction/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] text-emerald-500 font-mono hover:underline mt-0.5"
                      >
                        Tx: {txHash.slice(0, 8)}...{txHash.slice(-6)}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-black ${isPositive ? "text-emerald-500" : "text-gray-900 dark:text-white"}`}>
                      {isPositive ? "+" : ""}{amount.toFixed(2)} USDT
                    </p>
                    <span className="text-[9px] text-gray-400 font-mono">TRC-20</span>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* ═══ PAGINACIÓN ════════════════════════════════ */}
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
