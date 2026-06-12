import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Send, Zap, ShieldAlert, User2 } from "lucide-react";

interface TradeChatProps {
  tradeId: string;
}

export function TradeChat({ tradeId }: TradeChatProps) {
  const { user, tradeMessages, subscribeToTradeMessages, sendMessage } = useAppStore();
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Plantillas de respuesta rápida comunes en Binance P2P
  const quickReplies = [
    "Hola, buenas. Procedo a realizar la transferencia.",
    "Listo, ya realicé el pago. Por favor revise y libere.",
    "Buenas, su pago aún no se refleja. ¿Podría enviarme el comprobante?",
    "Gracias por el comercio. ¡Feliz día!",
  ];

  // 🔄 Conexión en vivo con el canal del trade
  useEffect(() => {
    if (!tradeId) return;
    const unsubscribeChat = subscribeToTradeMessages(tradeId);
    return () => unsubscribeChat();
  }, [tradeId, subscribeToTradeMessages]);

  // 📜 Autoscroll para mantener el último mensaje siempre a la vista
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tradeMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    await sendMessage(tradeId, newMessage);
    setNewMessage("");
  };

  const handleQuickReply = async (reply: string) => {
    await sendMessage(tradeId, reply);
  };

  if (!user) return null;

  return (
    <Card padding="none" className="flex flex-col h-[500px] border-gray-100 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-navy-900 shadow-sm rounded-2xl">
      {/* Cabecera del Chat */}
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Chat de la Orden
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">ID: {tradeId.slice(0, 8)}...</span>
      </div>

      {/* Alerta de Seguridad Estilo Binance */}
      <div className="bg-amber-500/10 border-b border-amber-500/10 px-4 py-2 flex items-start gap-2">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
          <b>Atención:</b> Nunca liberes criptomonedas antes de confirmar que el dinero real está disponible en tu cuenta bancaria (Enzona, Transfermóvil). CubaX nunca te pedirá contraseñas por aquí.
        </p>
      </div>

      {/* Cuerpo del Chat (Mensajes) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
        {tradeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <User2 className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2 animate-pulse" />
            <p className="text-xs font-medium text-gray-400">El chat está vacío. Escribe un mensaje para iniciar el contacto con la contraparte.</p>
          </div>
        ) : (
          tradeMessages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div
                key={msg.id || msg.createdAt}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    {isMe ? "Tú" : msg.senderName}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    isMe
                      ? "bg-brand-500 text-white rounded-tr-none"
                      : "bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Respuestas Rápidas (Scroll Horizontal) */}
      <div className="px-3 py-1.5 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/[0.04] flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            onClick={() => handleQuickReply(reply)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-navy-950 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 rounded-full text-[11px] font-medium border border-gray-200 dark:border-white/10 transition-colors"
          >
            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
            {reply}
          </button>
        ))}
      </div>

      {/* Input de Envío */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje de comercio..."
          className="flex-1 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="h-8 w-8 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 transition-all flex-shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </Card>
  );
      }

