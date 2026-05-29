import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MOCK_TRADE, MOCK_MESSAGES, PAYMENT_METHOD_LABELS } from "@/data/mock";
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Copy,
  Phone,
  MessageCircle,
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
    tradeMessages,
    user,
    updateTradeStatus,
    addMessage,
    setActiveTrade,
    setTradeMessages,
    navigate,
  } = useAppStore();

  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trade) {
      setActiveTrade(MOCK_TRADE);
      setTradeMessages(MOCK_MESSAGES);
    }
  }, [trade, setActiveTrade, setTradeMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tradeMessages]);

  const currentTrade = trade || MOCK_TRADE;
  const statusConfig = STATUS_CONFIG[currentTrade.status];
  const isBuyer = user?.uid === currentTrade.buyerId;

  const handleAction = useCallback(
    async (action: string) => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1200));

      let newStatus: TradeStatus = currentTrade.status;
      let systemMsg = "";

      switch (action) {
        case "fund_escrow":
          newStatus = "escrow_funded";
          systemMsg = `${currentTrade.sellerName} depositó ${currentTrade.amount} ${currentTrade.asset} en el escrow.`;
          break;
        case "mark_paid":
          newStatus = "payment_sent";
          systemMsg = `${currentTrade.buyerName} marcó el pago como enviado.`;
          break;
        case "confirm_payment":
          newStatus = "payment_confirmed";
          systemMsg = `${currentTrade.sellerName} confirmó la recepción del pago.`;
          break;
        case "release":
          newStatus = "crypto_released";
          systemMsg = `¡Trade completado! ${currentTrade.amount} ${currentTrade.asset} liberados a ${currentTrade.buyerName}.`;
          break;
        case "dispute":
          newStatus = "disputed";
          systemMsg = "Se ha iniciado una disputa. Un mediador revisará el caso.";
          break;
      }

      updateTradeStatus(newStatus);
      if (systemMsg) {
        addMessage({
          id: `msg_${Date.now()}`,
          tradeId: currentTrade.id,
          senderId: "system",
          senderName: "Sistema",
          message: systemMsg,
          timestamp: Date.now(),
          type: "system",
        });
      }
      setLoading(false);
    },
    [currentTrade, updateTradeStatus, addMessage]
  );

  const sendMessage = useCallback(() => {
    if (!chatInput.trim() || !user) return;
    addMessage({
      id: `msg_${Date.now()}`,
      tradeId: currentTrade.id,
      senderId: user.uid,
      senderName: user.displayName,
      message: chatInput.trim(),
      timestamp: Date.now(),
      type: "text",
    });
    setChatInput("");
  }, [chatInput, user, currentTrade.id, addMessage]);

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

      {/* Chat */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-4 w-4 text-brand-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            Chat del trade
          </h3>
        </div>

        <Card padding="none" className="overflow-hidden">
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {tradeMessages.map((msg) => {
              const isSystem = msg.type === "system";
              const isMe = msg.senderId === user?.uid;

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="text-center py-1"
                  >
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/[0.03] px-3 py-1 rounded-full">
                      🔔 {msg.message}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                      isMe
                        ? "bg-brand-500 text-white rounded-br-md"
                        : "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-bl-md"
                    }`}
                  >
                    {!isMe && (
                      <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p
                      className={`text-[9px] mt-0.5 ${
                        isMe ? "text-white/60" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString("es-CU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-100 dark:border-white/[0.06] p-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500/20 border border-transparent focus:border-brand-500"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-brand-500 text-white disabled:opacity-50 hover:bg-brand-600 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
