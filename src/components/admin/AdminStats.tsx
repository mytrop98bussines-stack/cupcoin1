import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import {
  Users, ArrowLeftRight, TrendingUp, ShoppingBag,
  Wallet, AlertTriangle, Flag, RefreshCw,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function AdminStats() {
  const [stats, setStats]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("❌ Error cargando estadísticas:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStats();
    const intervalId = window.setInterval(loadStats, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-400">Cargando estadísticas...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Dashboard CubaX
        </h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-brand-500 font-bold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* ═══ ALERTAS URGENTES ════════════════════════════════ */}
      {(stats.alerts.openDisputes > 0 || stats.alerts.pendingReports > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {stats.alerts.openDisputes > 0 && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-black text-red-500">
                {stats.alerts.openDisputes}
              </p>
              <p className="text-[10px] text-gray-400">Disputas abiertas</p>
            </div>
          )}
          {stats.alerts.pendingReports > 0 && (
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
              <Flag className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-black text-orange-500">
                {stats.alerts.pendingReports}
              </p>
              <p className="text-[10px] text-gray-400">Reportes pendientes</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ USUARIOS ════════════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Usuarios
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total",             value: stats.users.total,          color: "text-gray-900 dark:text-white" },
            { label: "Verificados KYC",   value: stats.users.verified,       color: "text-emerald-500"              },
            { label: "Con membresía",     value: stats.users.activeMembers,  color: "text-brand-500"                },
            { label: "Nuevos hoy",        value: stats.users.newToday,       color: "text-blue-500"                 },
            { label: "Nuevos esta semana",value: stats.users.newThisWeek,    color: "text-violet-500"               },
          ].map((item) => (
            <Card key={item.label} padding="md" className="text-center">
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-gray-400 mt-1">{item.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ═══ TRADES ══════════════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ArrowLeftRight className="h-3.5 w-3.5" /> Trades P2P
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total",          value: stats.trades.total,                  color: "text-gray-900 dark:text-white" },
            { label: "Completados",    value: stats.trades.completed,              color: "text-emerald-500"              },
            { label: "Hoy",            value: stats.trades.today,                  color: "text-blue-500"                 },
            { label: "Esta semana",    value: stats.trades.thisWeek,               color: "text-violet-500"               },
            { label: "Tasa de éxito",  value: `${stats.trades.successRate}%`,      color: "text-brand-500"                },
          ].map((item) => (
            <Card key={item.label} padding="md" className="text-center">
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-gray-400 mt-1">{item.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ═══ VOLUMEN ═════════════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" /> Volumen
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Card padding="md" className="text-center">
            <p className="text-2xl font-black text-emerald-500">
              {stats.volume.totalUSDT.toLocaleString("en-US")}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">USDT total operado</p>
          </Card>
          <Card padding="md" className="text-center">
            <p className="text-2xl font-black text-blue-500">
              {stats.volume.thisWeek.toLocaleString("es-CU")}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">CUP esta semana</p>
          </Card>
        </div>
      </div>

      {/* ═══ MARKETPLACE ═════════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShoppingBag className="h-3.5 w-3.5" /> Marketplace
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Card padding="md" className="text-center">
            <p className="text-2xl font-black text-violet-500">
              {stats.marketplace.activeProducts}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Productos activos</p>
          </Card>
          <Card padding="md" className="text-center">
            <p className="text-2xl font-black text-brand-500">
              {stats.marketplace.activeOrders}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Órdenes P2P activas</p>
          </Card>
        </div>
      </div>

      {/* ═══ FINANZAS ════════════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5" /> Finanzas
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Depósitos totales",      value: `${stats.finance.totalDeposits} USDT`,          color: "text-emerald-500" },
            { label: "Retiros totales",         value: `${stats.finance.totalWithdrawals} USDT`,       color: "text-red-500"     },
            { label: "Ingresos membresías",     value: `${stats.finance.membershipRevenue} USDT`,      color: "text-brand-500"   },
            { label: "Membresías este mes",     value: `${stats.finance.membershipRevenueMonth} USDT`, color: "text-amber-500"   },
          ].map((item) => (
            <Card key={item.label} padding="md" className="text-center">
              <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-gray-400 mt-1">{item.label}</p>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
