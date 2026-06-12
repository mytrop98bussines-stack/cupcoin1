import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TradeChat } from "@/components/TradeChat"; // 🔥 Inyección del chat reactivo
import { MOCK_TRADE, PAYMENT_METHOD_LABELS } from "@/data/mock";
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Copy,
  Phone,
  Lock,
  Unlock,
  XCircle,
} from "lucide-react";
import type { TradeStatus } from "@/types";

const STATUS_CONFIG: Record<
  TradeStatus,
  { label: string; color: string; icon: React.ReactNode; desc: string }
> = {
  awaiting_escrow: {
    label: "Esperando depósito",
    color: "text-amber-500",
    icon: <Clock className="h-5 w-5" />,
    desc: "El vendedor debe depositar los fondos en el escrow.",
  },
  escrow_funded: {
    label: "Escrow fondeado",
    color: "text-blue-500",
    icon: <Lock className="h-5 w-5" />,
    desc: "Los fondos están seguros en el contrato. Realiza el pago móvil.",
  },
  payment_sent: {
    label: "Pago enviado",
    color: "text-indigo-500",
    icon: <Send className="h-5 w-5" />,
    desc: "El comprador marcó el pago como enviado. Esperando confirmación.",
  },
  payment_confirmed: {
    label: "Pago confirmado",
    color: "text-emerald-500",
    icon: <CheckCircle2 className="h-5 w-5" />,
    desc: "El vendedor confirmó el pago. Liberando cripto...",
  },
  crypto_released: {
    label: "Completado",
    color: "text-emerald-500",
    icon: <Unlock className="h-5 w-5" />,
    desc: "¡Trade completado! Los fondos han sido liberados.",
  },
  disputed: {
    label: "En disputa",
    color: "text-red-500",
    icon: <AlertTriangle className="h-5 w-5" />,
    desc: "Un mediador revisará el caso. Por favor, proporciona evidencia.",
  },
  cancelled: {
    label: "Cancelado",
    color: "text-gray-500",
    icon: <XCircle className="h-5 w-5" />,
    desc: "Este trade fue cancelado. Los fondos fueron devueltos.",
  },
};

export function TradePage() {
  const {
    activeTrade: trade,
    user,
    updateTradeStatus,
    sendMessage: sendChatMessage, // Usamos la acción reactiva de Zustand para mensajes del sistema
    setActiveTrade,
    navigate,
  } = useAppStore();

  const [loading, setLoading] = useState(false);

  // Mantenemos el fallback seguro por si no hay un trade en el store local global
  useEffect(() => {
    if (!trade) {
      setActiveTrade(MOCK_TRADE);
    }
  }, [trade, setActiveTrade]);

  const currentTrade = trade || MOCK_TRADE;
  const statusConfig = STATUS_CONFIG[currentTrade.status];
  const isBuyer = user?.uid === currentTrade.buyerId;

  // Manejo de acciones en el flujo comercial
  const handleAction = useCallback(
    async (action: string) => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1200));

      let newStatus: TradeStatus = currentTrade.status;
      let systemMsg = "";

      switch (action) {
        case "fund_escrow":
          newStatus = "escrow_funded";
          systemMsg = `🔔 BANCO: ${currentTrade.sellerName} depositó ${currentTrade.amount} ${currentTrade.asset} en el sistema de custodia segura (Escrow).`;
          break;
        case "mark_paid":
          newStatus = "payment_sent";
          systemMsg = `💸 PAGO: ${currentTrade.buyerName} marcó la orden como PAGADA. Verifique su Transfermóvil/Enzona antes de liberar.`;
          break;
        case "confirm_payment":
          newStatus = "payment_confirmed";
          systemMsg = `✅ CONFIRMACIÓN: ${currentTrade.sellerName} confirmó la recepción de los fondos fiduciarios.`;
          break;
        case "release":
          newStatus = "crypto_released";
          systemMsg = `🚀 SISTEMA: ¡Trade completado con éxito! Fondos liberados hacia la billetera de ${currentTrade.buyerName}.`;
          break;
        case "dispute":
          newStatus = "disputed";
          systemMsg = "⚠️ DISPUTA: Se abrió un reclamo formal. El chat ha sido congelado temporalmente para revisión de soporte.";
          break;
      }

      updateTradeStatus(newStatus);
      
      // Inyección del log del sistema directo en Firestore a través del backend del chat
      if (systemMsg) {
        await sendChatMessage(currentTrade.id, systemMsg);
      }
      setLoading(false);
    },
    [currentTrade, updateTradeStatus, sendChatMessage]
  );

  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const progress = (() => {
    const steps: TradeStatus[] = [
      "awaiting_escrow",
      "escrow_funded",
      "payment_sent",
      "payment_confirmed",
      "crypto_released",
    ];
    const idx = steps.indexOf(currentTrade.status);
    return idx >= 0 ? ((idx + 1) / steps.length) * 100 : 0;
  })();

  return (
    <div className="max-w-lg mx-auto pb-24 animate-fade-in">
      {/* Status Header */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${statusConfig.color}`}>{statusConfig.icon}</div>
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
              currentTrade.status === "crypto_released"
                ? "success"
                : currentTrade.status === "disputed"
                ? "danger"
                : "info"
            }
          >
            #{currentTrade.id.slice(-6)}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Trade Details */}
      <div className="px-4 space-y-3">
        <Card padding="md">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Monto</span>
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                {currentTrade.amount} {currentTrade.asset}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Precio</span>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {currentTrade.pricePerUnit.toLocaleString("es-CU")} CUP/{currentTrade.asset}
              </span>
            </div>
            <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total a pagar</span>
              <span className="font-bold text-lg text-brand-500">
                {currentTrade.totalFiat.toLocaleString("es-CU")} CUP
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Método</span>
              <span className="font-medium text-sm text-gray-900 dark:text-white">
                {PAYMENT_METHOD_LABELS[currentTrade.paymentMethod]}
              </span>
            </div>
          </div>
        </Card>

        {/* Escrow Info */}
        {currentTrade.escrowTxHash && (
          <Card padding="sm" className="border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Fondos en Escrow
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  Tx: {currentTrade.escrowTxHash}
                </p>
              </div>
              <button
                onClick={() => copyText(currentTrade.escrowTxHash || "")}
                className="p-1 rounded hover:bg-emerald-500/10"
              >
                <Copy className="h-3.5 w-3.5 text-emerald-500" />
              </button>
            </div>
          </Card>
        )}

        {/* Payment Details */}
        {currentTrade.paymentDetails &&
          (currentTrade.status === "escrow_funded" ||
            currentTrade.status === "payment_sent") && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-4 w-4 text-brand-500" />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  Datos de pago
                </h3>
              </div>
              <div className="space-y-2">
                {currentTrade.paymentDetails.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Teléfono</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {currentTrade.paymentDetails.phone}
                      </span>
                      <button
                        onClick={() => copyText(currentTrade.paymentDetails?.phone || "")}
                        className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/5"
                      >
                        <Copy className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
                {currentTrade.paymentDetails.accountName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Titular</span>
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {currentTrade.paymentDetails.accountName}
                    </span>
                  </div>
                )}
                {currentTrade.paymentDetails.instructions && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.03] p-2 rounded-lg">
                    💡 {currentTrade.paymentDetails.instructions}
                  </p>
                )}
              </div>
            </Card>
          )}

        {/* Counterparty */}
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <Avatar name={isBuyer ? currentTrade.sellerName : currentTrade.buyerName} size="sm" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {isBuyer ? currentTrade.sellerName : currentTrade.buyerName}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {isBuyer ? "Vendedor" : "Comprador"}
              </p>
            </div>
            <Badge variant="success" size="sm">Online</Badge>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          {currentTrade.status === "awaiting_escrow" && !isBuyer && (
            <Button
              size="lg"
              fullWidth
              loading={loading}
              onClick={() => handleAction("fund_escrow")}
              icon={<Lock className="h-4 w-4" />}
            >
              Depositar en Escrow
            </Button>
          )}

          {currentTrade.status === "escrow_funded" && isBuyer && (
            <Button
              size="lg"
              fullWidth
              loading={loading}
              onClick={() => handleAction("mark_paid")}
              icon={<Send className="h-4 w-4" />}
              className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
            >
              Confirmar pago enviado
            </Button>
          )}

          {currentTrade.status === "payment_sent" && !isBuyer && (
            <Button
              size="lg"
              fullWidth
              loading={loading}
              onClick={() => handleAction("confirm_payment")}
              icon={<CheckCircle2 className="h-4 w-4" />}
              className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
            >
              Confirmar pago recibido
            </Button>
          )}

          {currentTrade.status === "payment_confirmed" && (
            <Button
              size="lg"
              fullWidth
              loading={loading}
              onClick={() => handleAction("release")}
              icon={<Unlock className="h-4 w-4" />}
              className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
            >
              Liberar cripto
            </Button>
          )}

          {currentTrade.status === "crypto_released" && (
            <Button
              size="lg"
              fullWidth
              variant="secondary"
              onClick={() => navigate("p2p")}
            >
              Volver al mercado
            </Button>
          )}

          {!["crypto_released", "cancelled", "disputed"].includes(currentTrade.status) && (
            <Button
              size="sm"
              fullWidth
              variant="ghost"
              onClick={() => handleAction("dispute")}
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/5"
            >
              Iniciar disputa
            </Button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🔥 NUEVO CONTENEDOR REACTIVO CHAT P2P ESTILO BINANCE      */}
      {/* ======================================================== */}
      <div className="px-4 mt-4">
        <TradeChat tradeId={currentTrade.id} />
      </div>
    </div>
  );
    }
                    
