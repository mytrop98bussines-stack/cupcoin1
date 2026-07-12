import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TradeChat } from "@/components/TradeChat";
import { PAYMENT_METHOD_LABELS } from "@/data/mock";
import { notifyUser } from "@/lib/firebase/messaging";
import {
  Shield, Clock, CheckCircle2, AlertTriangle,
  Send, Copy, Phone, Lock, Unlock, XCircle,
  Loader2, ArrowLeft,
} from "lucide-react";
import type { Trade, TradeStatus } from "@/types";

// ─── Backend URL ──────────────────────────────────────────
const BACKEND_URL = "https://cubax-backend.onrender.com";

// ─── Configuración de estados ─────────────────────────────
const STATUS_CONFIG: Record<
  TradeStatus,
  { label: string; color: string; icon: React.ReactNode; desc: string }
> = {
  awaiting_escrow: {
    label: "Esperando depósito",
    color: "text-amber-500",
    icon:  <Clock className="h-5 w-5" />,
    desc:  "El vendedor debe depositar los fondos en el escrow.",
  },
  escrow_funded: {
    label: "Escrow fondeado",
    color: "text-blue-500",
    icon:  <Lock className="h-5 w-5" />,
    desc:  "Fondos seguros en escrow. Realiza el pago móvil ahora.",
  },
  payment_sent: {
    label: "Pago enviado",
    color: "text-indigo-500",
    icon:  <Send className="h-5 w-5" />,
    desc:  "Comprador marcó pago como enviado. Vendedor, verifica.",
  },
  payment_confirmed: {
    label: "Pago confirmado",
    color: "text-emerald-500",
    icon:  <CheckCircle2 className="h-5 w-5" />,
    desc:  "Vendedor confirmó el pago. Liberando cripto...",
  },
  crypto_released: {
    label: "Completado",
    color: "text-emerald-500",
    icon:  <Unlock className="h-5 w-5" />,
    desc:  "¡Trade completado! Los fondos han sido liberados.",
  },
  disputed: {
    label: "En disputa",
    color: "text-red-500",
    icon:  <AlertTriangle className="h-5 w-5" />,
    desc:  "Un mediador revisará el caso.",
  },
  cancelled: {
    label: "Cancelado",
    color: "text-gray-500",
    icon:  <XCircle className="h-5 w-5" />,
    desc:  "Trade cancelado. Fondos devueltos al vendedor.",
  },
};

export function TradePage() {
  const {
    activeTrade, selectedTradeId, user,
    setActiveTrade, navigate,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [trade, setTrade]     = useState<Trade | null>(activeTrade);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  // ─── Cargar trade en tiempo real ──────────────────────────
  useEffect(() => {
  const tradeId = selectedTradeId || activeTrade?.id;
  if (!tradeId) {
    navigate("p2p");
    return;
  }

  let stopped = false;

  const loadTrade = async () => {
    if (stopped) return;
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(
        `${BACKEND_URL}/api/trades/${tradeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && !stopped) {
        setTrade(data.trade);
        setActiveTrade(data.trade);
      } else {
        setError("Trade no encontrado.");
      }
    } catch (err) {
      console.error("Error cargando trade:", err);
    }
  };

  void loadTrade();
  const intervalId = window.setInterval(loadTrade, 5000);

  return () => {
    stopped = true;
    window.clearInterval(intervalId);
  };
}, [selectedTradeId, activeTrade?.id]);

  // ─── Validaciones ─────────────────────────────────────────
  const isBuyer       = user?.uid === trade?.buyerId;
  const isSeller      = user?.uid === trade?.sellerId;
  const isParticipant = isBuyer || isSeller;

  // ─── Progreso ─────────────────────────────────────────────
  const progress = (() => {
    const steps: TradeStatus[] = [
      "awaiting_escrow", "escrow_funded", "payment_sent",
      "payment_confirmed", "crypto_released",
    ];
    const idx = steps.indexOf(trade?.status || "awaiting_escrow");
    return idx >= 0 ? ((idx + 1) / steps.length) * 100 : 0;
  })();

  // ─── Copiar texto ─────────────────────────────────────────
  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ─── Mensaje del sistema al chat ──────────────────────────
  const sendSystemMessage = async (tradeId: string, msg: string) => {
  try {
    const token = localStorage.getItem("cubax_token");
    await fetch(`${BACKEND_URL}/api/trades/${tradeId}/messages`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({
        text:       msg,
        senderId:   "SYSTEM",
        senderName: "CubaX Sistema",
        type:       "system",
      }),
    });
  } catch (err) {
    console.error("Error enviando mensaje del sistema:", err);
  }
};

  // ─── ACCIÓN PRINCIPAL ─────────────────────────────────────
  const handleAction = useCallback(async (action: string) => {
    if (!trade || !user) return;

    if (!isParticipant) {
      setError("No tienes permiso para realizar esta acción.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tradeRef = doc(db, "trades", trade.id);

      switch (action) {

        // ✅ ESCROW — via backend (Admin SDK bypasea reglas)
        case "fund_escrow": {
          if (!isSeller) throw new Error("Solo el vendedor puede fondear el escrow.");
          if (trade.status !== "awaiting_escrow") throw new Error("Estado inválido.");

          const res  = await fetch(`${BACKEND_URL}/api/trade/fund-escrow`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              tradeId:  trade.id,
              sellerId: user.uid,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          break;
        }

        // ✅ MARCAR PAGO — via backend
        case "mark_paid": {
          if (!isBuyer) throw new Error("Solo el comprador puede marcar el pago.");
          if (trade.status !== "escrow_funded") throw new Error("Estado inválido.");

          const res  = await fetch(`${BACKEND_URL}/api/trade/mark-paid`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              tradeId: trade.id,
              buyerId: user.uid,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          break;
        }

        // ✅ LIBERAR FONDOS — via backend (Admin SDK bypasea reglas)
        case "release": {
          if (!isSeller) throw new Error("Solo el vendedor puede liberar los fondos.");
          if (trade.status !== "payment_sent") throw new Error("Estado inválido.");

          const res  = await fetch(`${BACKEND_URL}/api/trade/release`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              tradeId:  trade.id,
              sellerId: user.uid,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          break;
        }

        // ✅ DISPUTA — directo en Firestore (solo escribe en su propio trade)
        const sendSystemMessage = async (tradeId: string, msg: string) => {
  try {
    const token = localStorage.getItem("cubax_token");
    await fetch(`${BACKEND_URL}/api/trades/${tradeId}/messages`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({
        text:       msg,
        senderId:   "SYSTEM",
        senderName: "CubaX Sistema",
        type:       "system",
      }),
    });
  } catch (err) {
    console.error("Error enviando mensaje del sistema:", err);
  }
};

        // ✅ CANCELAR — directo en Firestore
        case "cancel": {
  if (trade.status !== "awaiting_escrow") {
    throw new Error("Solo se puede cancelar antes de fondear el escrow.");
  }

  const token = localStorage.getItem("cubax_token");
  const res   = await fetch(`${BACKEND_URL}/api/trades/${trade.id}/cancel`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ uid: user.uid }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  break;
        }
  // ─── LOADING STATE ────────────────────────────────────────
  if (!trade) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando trade...
        </p>
      </div>
    );
  }

  // ─── ERROR DE SEGURIDAD ───────────────────────────────────
  if (!isParticipant) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">
          Acceso denegado
        </p>
        <p className="text-xs text-gray-400 mb-4">
          No eres participante de este trade.
        </p>
        <Button size="sm" onClick={() => navigate("p2p")}>
          Volver al P2P
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[trade.status];

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto pb-24 animate-fade-in">

      {/* Header de estado */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={statusConfig.color}>{statusConfig.icon}</div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                {statusConfig.label}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {statusConfig.desc}
              </p>
            </div>
          </div>
          <Badge
            variant={
              trade.status === "crypto_released" ? "success" :
              trade.status === "disputed"         ? "danger"  : "info"
            }
          >
            #{trade.id.slice(-6)}
          </Badge>
        </div>

        {/* Barra de progreso */}
        <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-4 space-y-3">

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Detalles del trade */}
        <Card padding="md">
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Monto</span>
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                {trade.amount} {trade.asset}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Precio</span>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {trade.pricePerUnit.toLocaleString("es-CU")} CUP/{trade.asset}
              </span>
            </div>
            <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
              <span className="font-bold text-lg text-brand-500">
                {trade.totalFiat.toLocaleString("es-CU")} CUP
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Método</span>
              <span className="font-medium text-sm text-gray-900 dark:text-white">
                {PAYMENT_METHOD_LABELS[trade.paymentMethod]}
              </span>
            </div>
          </div>
        </Card>

        {/* Escrow info */}
        {trade.escrowFundedAt && trade.status !== "crypto_released" && (
          <Card padding="sm" className="border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {trade.amount} {trade.asset} en Escrow
                </p>
                <p className="text-[10px] text-gray-400">
                  Fondos bloqueados y seguros hasta completar el trade
                </p>
              </div>
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
            </div>
          </Card>
        )}

        {/* Datos de pago */}
        {trade.paymentDetails &&
          ["escrow_funded", "payment_sent"].includes(trade.status) && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-brand-500" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Datos de pago
              </h3>
            </div>
            <div className="space-y-2">
              {trade.paymentDetails.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Teléfono</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {trade.paymentDetails.phone}
                    </span>
                    <button
                      onClick={() => copyText(trade.paymentDetails?.phone || "")}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                      <Copy className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
              {trade.paymentDetails.accountName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Titular</span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {trade.paymentDetails.accountName}
                  </span>
                </div>
              )}
              {trade.paymentDetails.instructions && (
                <p className="text-xs text-gray-500 bg-gray-50 dark:bg-white/[0.03] p-2 rounded-lg">
                  💡 {trade.paymentDetails.instructions}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Contraparte */}
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <Avatar
              name={isBuyer ? trade.sellerName : trade.buyerName}
              size="sm"
            />
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {isBuyer ? trade.sellerName : trade.buyerName}
              </p>
              <p className="text-[10px] text-gray-400">
                {isBuyer ? "Vendedor" : "Comprador"}
              </p>
            </div>
            <Badge variant="success" size="sm">Online</Badge>
          </div>
        </Card>

        {/* ═══ BOTONES DE ACCIÓN ═══════════════════════════════ */}
        <div className="space-y-2">

          {/* Vendedor fondea escrow */}
          {trade.status === "awaiting_escrow" && isSeller && (
            <Button
              size="lg" fullWidth loading={loading}
              onClick={() => handleAction("fund_escrow")}
              icon={<Lock className="h-4 w-4" />}
            >
              Depositar {trade.amount} {trade.asset} en Escrow
            </Button>
          )}

          {/* Comprador espera escrow */}
          {trade.status === "awaiting_escrow" && isBuyer && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 text-center">
                ⏳ Esperando que el vendedor deposite la garantía en escrow.
                No envíes dinero aún.
              </p>
            </div>
          )}

          {/* Comprador marca pago */}
          {trade.status === "escrow_funded" && isBuyer && (
            <div className="space-y-2">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 text-center">
                  💳 Envía{" "}
                  <strong>
                    {trade.totalFiat.toLocaleString("es-CU")} CUP
                  </strong>{" "}
                  por {PAYMENT_METHOD_LABELS[trade.paymentMethod]} y luego
                  toca el botón de abajo.
                </p>
              </div>
              <Button
                size="lg"
                fullWidth
                loading={loading}
                onClick={() => handleAction("mark_paid")}
                icon={<Send className="h-4 w-4" />}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Ya envié el pago en CUP
              </Button>
            </div>
          )}

          {/* Vendedor espera pago */}
          {trade.status === "escrow_funded" && isSeller && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 text-center">
                ⏳ Escrow fondeado. Esperando que el comprador envíe{" "}
                <strong>
                  {trade.totalFiat.toLocaleString("es-CU")} CUP
                </strong>{" "}
                por {PAYMENT_METHOD_LABELS[trade.paymentMethod]}.
              </p>
            </div>
          )}

          {/* Vendedor libera fondos */}
          {trade.status === "payment_sent" && isSeller && (
            <div className="space-y-2">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 text-center">
                  ⚠️ Verifica el pago en Transfermóvil o Enzona ANTES de
                  liberar. No te fíes de capturas de pantalla.
                </p>
              </div>
              <Button
                size="lg"
                fullWidth
                loading={loading}
                onClick={() => handleAction("release")}
                icon={<Unlock className="h-4 w-4" />}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Confirmar Pago y Liberar {trade.amount} {trade.asset}
              </Button>
            </div>
          )}

          {/* Comprador espera liberación */}
          {trade.status === "payment_sent" && isBuyer && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 text-center">
                ⏳ Pago marcado. El vendedor está verificando antes de
                liberar los fondos.
              </p>
            </div>
          )}

          {/* Trade completado */}
          {trade.status === "crypto_released" && (
            <div className="space-y-2">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ¡Trade completado con éxito!
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {trade.amount} {trade.asset} enviados al comprador
                </p>
              </div>
              <Button
                size="lg" fullWidth variant="outline"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate("p2p")}
              >
                Volver al Mercado P2P
              </Button>
            </div>
          )}

          {/* Trade disputado */}
          {trade.status === "disputed" && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                Trade en disputa
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Un moderador de CubaX revisará el caso y tomará una decisión.
              </p>
            </div>
          )}

          {/* Trade cancelado */}
          {trade.status === "cancelled" && (
            <div className="space-y-2">
              <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-center">
                <p className="text-sm font-bold text-gray-500">
                  Trade cancelado
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  No se realizó ningún movimiento de fondos.
                </p>
              </div>
              <Button
                size="lg" fullWidth variant="outline"
                onClick={() => navigate("p2p")}
              >
                Volver al P2P
              </Button>
            </div>
          )}

          {/* Cancelar — Solo antes del escrow */}
          {trade.status === "awaiting_escrow" && (
            <Button
              size="sm" fullWidth variant="ghost"
              onClick={() => handleAction("cancel")}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancelar trade
            </Button>
          )}

          {/* Botón de disputa */}
          {!["crypto_released", "cancelled", "disputed", "awaiting_escrow"].includes(
            trade.status
          ) && (
            <Button
              size="sm" fullWidth variant="ghost"
              onClick={() => handleAction("dispute")}
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5"
            >
              Apelar / Iniciar Disputa
            </Button>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="px-4 mt-4">
        <TradeChat tradeId={trade.id} />
      </div>
    </div>
  );
          }
  
