import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import {
  Users, Search, Ban, CheckCircle2, Shield,
  Loader2, AlertTriangle, X, Filter,
  TrendingUp, UserCheck, UserX, Clock,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function AdminUsersPage() {
  const { user } = useAppStore();

  const [users, setUsers]         = useState<any[]>([]);
  const [stats, setStats]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<"all" | "suspended" | "active">("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    void loadData();
  }, [user, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cubax_token");

      const [usersRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/admin/users?filter=${filter}&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/admin/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (statsData.success) setStats(statsData.stats);
    } catch {
      setError("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res = await fetch(
        `${BACKEND_URL}/admin/users?search=${encodeURIComponent(search)}&filter=${filter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) {
      setError("Debes indicar un motivo");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res = await fetch(`${BACKEND_URL}/admin/users/suspend`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUid: selectedUser.uid,
          reason:    suspendReason.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`✅ Usuario ${selectedUser.email} suspendido`);
        setShowSuspendModal(false);
        setSuspendReason("");
        setSelectedUser(null);
        setTimeout(() => setSuccess(null), 3000);
        await loadData();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsuspend = async (targetUser: any) => {
    if (!confirm(`¿Reactivar la cuenta de ${targetUser.email}?`)) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res = await fetch(`${BACKEND_URL}/admin/users/unsuspend`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUid: targetUser.uid }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`✅ Usuario ${targetUser.email} reactivado`);
        setTimeout(() => setSuccess(null), 3000);
        await loadData();
      } else {
        setError(data.error);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No tienes permisos de admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-xs text-gray-400">Panel Admin CupCoin</p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}><X className="h-3.5 w-3.5 text-red-400" /></button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Users,     label: "Total",       value: stats.totalUsers,      color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: UserCheck, label: "KYC Verif.",  value: stats.kycVerified,     color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { icon: UserX,     label: "Suspendidos", value: stats.suspendedUsers,  color: "text-red-500", bg: "bg-red-500/10" },
            { icon: TrendingUp, label: "Nuevos 24h", value: stats.newLast24h,      color: "text-violet-500", bg: "bg-violet-500/10" },
          ].map((s) => (
            <Card key={s.label} padding="md">
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-7 w-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">{s.label}</p>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Búsqueda */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email, nombre o UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold"
        >
          Buscar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5">
        {[
          { key: "all",       label: "Todos" },
          { key: "active",    label: "Activos" },
          { key: "suspended", label: "Suspendidos" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f.key
                ? "bg-brand-500 text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 text-brand-500 animate-spin mx-auto" />
        </div>
      ) : users.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-sm text-gray-500">Sin resultados</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.uid} padding="md">
              <div className="flex items-center gap-3">
                <Avatar name={u.displayName} src={u.photoURL} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {u.displayName || "Sin nombre"}
                    </p>
                    {u.role === "admin" && (
                      <Shield className="h-3 w-3 text-brand-500 flex-shrink-0" />
                    )}
                    {u.suspended && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold">
                        SUSPENDIDO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      u.kycStatus === "verified"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500"
                    } font-bold`}>
                      {u.kycStatus === "verified" ? "KYC ✓" : "Sin KYC"}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {u.totalTrades} trades
                    </span>
                  </div>
                </div>

                {u.role !== "admin" && (
                  u.suspended ? (
                    <button
                      onClick={() => handleUnsuspend(u)}
                      disabled={processing}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500/20 flex-shrink-0"
                    >
                      Reactivar
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setShowSuspendModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 flex-shrink-0"
                    >
                      Suspender
                    </button>
                  )
                )}
              </div>

              {u.suspended && u.suspendReason && (
                <div className="mt-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <p className="text-[10px] text-red-600 dark:text-red-400">
                    <strong>Motivo:</strong> {u.suspendReason}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal suspender */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                🚫 Suspender usuario
              </h3>
              <button onClick={() => setShowSuspendModal(false)}>
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <Avatar name={selectedUser.displayName} src={selectedUser.photoURL} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{selectedUser.displayName}</p>
                <p className="text-xs text-gray-400 truncate">{selectedUser.email}</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Motivo de suspensión
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Ej: Actividad fraudulenta detectada..."
                rows={3}
                className="w-full px-4 py-3 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowSuspendModal(false)}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                loading={processing}
                disabled={!suspendReason.trim()}
                onClick={handleSuspend}
                className="bg-red-500 hover:bg-red-600"
              >
                Suspender
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
