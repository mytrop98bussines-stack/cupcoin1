import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeftRight, Plus, Loader2, AlertTriangle,
  CheckCircle2, X, Clock, Trash2,
} from "lucide-react";
import { PAYMENT_METHOD_LABELS, CRYPTO_ICONS } from "@/data/data";
import type { P2POrder } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function MyOrdersPage() {
  const { user, navigate } = useAppStore();

  const [orders, setOrders]               = useState<P2POrder[]>([]);
  const [loading, setLoading]             = useState(true);
  const [cancellingId, setCancellingId]   = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  // ─── Cargar mis órdenes via backend ──────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    let stopped = false;

    const loadOrders = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/orders/my-orders`, {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ uid: user.uid }),
        });
        const data = await res.json();
        if (data.success && !stopped) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("❌ Error cargando órdenes:", err);
      } finally {
        if (!stopped) setLoading(false);
      }
    };

    void loadOrders();
    const intervalId = window.setInterval(loadOrders, 30000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [user?.uid]);

  // ─── Cancelar orden via backend ───────────────────────────
  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/orders/cancel`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: user?.uid, orderId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled" } : o
        )
      );
      setSuccess("Orden cancelada correctamente.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Error al cancelar la orden: " + err.message);
    } finally {
      setCancellingId(null);
      setConfirmCancel(null);
    }
  };

  // ─── Reactivar orden via backend ──────────────────────────
  const handleReactivateOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/orders/reactivate`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: user?.uid, orderId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "active" } : o
        )
      );
      setSuccess("Orden reactivada.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Error al reactivar: " + err.message);
    }
  };

  if (!user) return null;

  const activeOrders   = orders.filter((o) => o.status === "active");
  const inactiveOrders = orders.filter((o) => o.status !== "active");

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Mis Anuncios P2P
            </h1>
            <p className="text-xs text-gray-400">
              {activeOrders.length} activos · {inactiveOrders.length} inactivos
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("create-order")}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Publicar
        </Button>
      </div>

      {/* Error / Éxito */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-400">Cargando tus anuncios...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card padding="lg" className="text-center">
          <ArrowLeftRight className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            Sin anuncios publicados
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Publica tu primera oferta de compra o venta de cripto.
          </p>
          <Button
            size="sm"
            onClick={() => navigate("create-order")}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Publicar anuncio
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">

          {/* Órdenes activas */}
          {activeOrders.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                Activos ({activeOrders.length})
              </h3>
              <div className="space-y-2">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    confirmCancel={confirmCancel}
                    cancellingId={cancellingId}
                    onConfirmCancel={() => setConfirmCancel(order.id)}
                    onCancelConfirmed={() => handleCancelOrder(order.id)}
                    onCancelDismiss={() => setConfirmCancel(null)}
                    onReactivate={() => handleReactivateOrder(order.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Órdenes inactivas */}
          {inactiveOrders.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                Inactivos ({inactiveOrders.length})
              </h3>
              <div className="space-y-2 opacity-70">
                {inactiveOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    confirmCancel={confirmCancel}
                    cancellingId={cancellingId}
                    onConfirmCancel={() => setConfirmCancel(order.id)}
                    onCancelConfirmed={() => handleCancelOrder(order.id)}
                    onCancelDismiss={() => setConfirmCancel(null)}
                    onReactivate={() => handleReactivateOrder(order.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente de tarjeta de orden ──────────────────────
function OrderCard({
  order,
  confirmCancel,
  cancellingId,
  onConfirmCancel,
  onCancelConfirmed,
  onCancelDismiss,
  onReactivate,
}: {
  order:             P2POrder;
  confirmCancel:     string | null;
  cancellingId:      string | null;
  onConfirmCancel:   () => void;
  onCancelConfirmed: () => void;
  onCancelDismiss:   () => void;
  onReactivate:      () => void;
}) {
  const isActive   = order.status === "active";
  const confirming = confirmCancel === order.id;
  const cancelling = cancellingId  === order.id;

  return (
    <Card padding="md" className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {(CRYPTO_ICONS as any)[order.asset] || "🪙"}
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {order.type === "sell" ? "Vendo" : "Compro"} {order.asset}
            </p>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(order.createdAt).toLocaleDateString("es-CU")}
            </p>
          </div>
        </div>
        <Badge
          variant={
            isActive
              ? order.type === "sell" ? "success" : "danger"
              : "default"
          }
          size="sm"
        >
          {isActive
            ? order.type === "sell" ? "Venta activa" : "Compra activa"
            : "Inactiva"}
        </Badge>
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Precio",     value: `${order.pricePerUnit.toLocaleString("es-CU")} CUP` },
          { label: "Disponible", value: `${order.availableAmount} ${order.asset}`            },
          { label: "Mínimo",     value: `${order.minAmount} ${order.asset}`                  },
          { label: "Máximo",     value: `${order.maxAmount} ${order.asset}`                  },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 dark:bg-white/5 rounded-lg p-2">
            <p className="text-[10px] text-gray-400">{item.label}</p>
            <p className="text-xs font-bold text-gray-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Métodos de pago */}
      <div className="flex gap-1 flex-wrap">
        {order.paymentMethods.map((method) => (
          <span
            key={method}
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-500/10 text-brand-500"
          >
            {PAYMENT_METHOD_LABELS[method] || method}
          </span>
        ))}
      </div>

      {/* Botones */}
      {confirming ? (
        <div className="space-y-2">
          <p className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium">
            ¿Cancelar esta orden? Quedará inactiva pero puedes reactivarla.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancelDismiss}
              className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-300"
            >
              No, mantener
            </button>
            <button
              onClick={onCancelConfirmed}
              disabled={cancelling}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50"
            >
              {cancelling
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2  className="h-3.5 w-3.5"               />
              }
              Sí, cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {isActive ? (
            <button
              onClick={onConfirmCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Cancelar orden
            </button>
          ) : (
            <button
              onClick={onReactivate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Reactivar orden
            </button>
          )}
        </div>
      )}
    </Card>
  );
          }
