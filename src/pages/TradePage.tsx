import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TradeChat } from "@/components/TradeChat"; 
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
    sendMessage: sendChatMessage,
    setActiveTrade,
    navigate,
  } = useAppStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trade) {
      setActiveTrade(MOCK_TRADE);
    }
  }, [trade, setActiveTrade]);

  const currentTrade = trade || MOCK_TRADE;
  const statusConfig = STATUS_CONFIG[currentTrade.status];
  const isBuyer = user?.uid === currentTrade.buyerId;

  // 🔥 ACCIONES REALES DIRECTAS CONTRA FIRESTORE CLOUD
  const handleAction = useCallback(
    async (action: string) => {
      setLoading(true);
      let newStatus: TradeStatus = currentTrade.status;
      let systemMsg = "";

      switch (action) {
        case "fund_escrow":
          newStatus = "escrow_funded";
          systemMsg = `💥 DEPÓSITO: El vendedor ha colocado los fondos en Escrow. El comprador ya puede enviar de forma segura el saldo en CUP.`;
          break;
        case "mark_paid":
          newStatus = "payment_sent";
          systemMsg = `💸 ACCIÓN: El comprador ha pulsado "Pago Realizado" (Ya pagué). Vendedor, verifique sus aplicaciones bancarias locales (Transfermóvil/Enzona).`;
          break;
        case "confirm_payment":
          newStatus = "payment_confirmed";
          systemMsg = `✅ CONFIRMACIÓN: El vendedor corroboró el dinero en moneda nacional fiduciaria.`;
          break;
        case "release":
          newStatus = "crypto_released";
          systemMsg = `🎉 COMPLETO: Criptomonedas liberadas hacia el comprador. Operación cerrada con éxito.`;
          break;
        case "dispute":
          newStatus = "disputed";
          systemMsg = "⚠️ ALERTA: Operación bajo reclamo / disputa técnica. Un moderador de CubaX auditará los logs del chat.";
          break;
      }

      // Ejecuta la promesa global contra Firebase pasando el ID del trade y el nuevo estado
      await updateTradeStatus(currentTrade.id, newStatus);
      
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

        {/* ======================================================== */}
        {/* 🏦 BOTONERA OPERATIVA BINANCE EN TIEMPO REAL             */}
        {/* ======================================================== */}
        <div className="space-y-2">
          
          {/* CASO 1: ESPERANDO FONDOS (Solo Vendedor ve botón) */}
          {currentTrade.status === "awaiting_escrow" && !isBuyer && (
            <Button
              size="lg"
              fullWidth
              loading={loading}
              onClick={() => handleAction("fund_escrow")}
              icon={<Lock className="h-4 w-4" />}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              Depositar Garantía en Escrow
            </Button>
          )}

          {/* CASO 2: COMPRADOR VE QUE FALTA GARANTÍA (Seguridad antibloqueo) */}
          {currentTrade.status === "awaiting_escrow" && isBuyer && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Espera a que el vendedor deposite las criptomonedas en garantía. No envíes dinero aún.
              </p>
            </div>
          )}

          {/* CASO 3: ESCROW FONDEADO (Botón "Ya pagué" listo para el Comprador) */}
          {currentTrade.status === "escrow_funded" && isBuyer && (
            <Button
              size="lg"
              fullWidth
              loading={loading}
              onClick={() => handleAction("mark_paid")}
              icon={<Send className="h-4 w-4" />}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10 font-bold"
            >
              Pago Realizado (Ya pagué)
            </Button>
          )}

          {/* CASO 4: ESCROW FONDEADO (Vendedor esperando transferencia) */}
          {currentTrade.status === "escrow_funded" && !isBuyer && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center animate-pulse">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Fondos en garantía asegurados. Esperando transferencia fiat (CUP) del comprador.
              </p>
            </div>
          )}

          {/* CASO 5: PAGO ENVIADO (Vendedor confirma y libera) */}
          {currentTrade.status === "payment_sent" && !isBuyer && (
            <div className="space-y-2">
              <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-center">
                <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                  ⚠️ Revisa tu Transfermóvil o Enzona personalmente. No te fíes solo de capturas de pantalla.
                </p>
              </div>
              <Button
                size="lg"
                fullWidth
                loading={loading}
                onClick={() => handleAction("release")}
                icon={<Unlock className="h-4 w-4" />}
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10 font-bold"
              >
                Confirmar Recibo y Liberar Cripto
              </Button>
            </div>
          )}

          {/* CASO 6: PAGO ENVIADO (Comprador esperando liberación) */}
          {currentTrade.status === "payment_sent" && isBuyer && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Marcado como pagado. El vendedor está verificando sus cuentas bancarias para liberar los activos.
              </p>
            </div>
          )}

          {/* CASO 7: TRADE FINALIZADO CON ÉXITO */}
          {currentTrade.status === "crypto_released" && (
            <Button
              size="lg"
              fullWidth
              variant="secondary"
              onClick={() => navigate("p2p")}
            >
              Volver al Mercado P2P
            </Button>
          )}

          {/* BOTÓN DE DISPUTA GENERAL */}
          {!["crypto_released", "cancelled", "disputed", "awaiting_escrow"].includes(currentTrade.status) && (
            <Button
              size="sm"
              fullWidth
              variant="ghost"
              onClick={() => handleAction("dispute")}
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/5 font-semibold"
            >
              Apelar / Iniciar Disputa
            </Button>
          )}
        </div>
      </div>

      {/* Chat en vivo */}
      <div className="px-4 mt-4">
        <TradeChat tradeId={currentTrade.id} />
      </div>
    </div>
  );
                       }
          
