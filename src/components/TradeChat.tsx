import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import {
  Send,
  Zap,
  ShieldAlert,
  User2,
  CheckCheck,
  Image as ImageIcon,
  X,
  Loader2,
  ZoomIn,
} from "lucide-react";

interface TradeChatProps {
  tradeId: string;
}

const BACKEND_URL              = "https://cubax-backend.onrender.com/api";
const CLOUDINARY_CLOUD_NAME    = "dc4caibrn";
const CLOUDINARY_UPLOAD_PRESET = "cubax_unsigned";

// ─── Mensajes del sistema (distinguibles visualmente) ────
const isSystemMessage = (senderId: string) => senderId === "SYSTEM";

export function TradeChat({ tradeId }: TradeChatProps) {
  const {
    user,
    tradeMessages,
    subscribeToTradeMessages,
    sendMessage,
  } = useAppStore();

  const [newMessage, setNewMessage]     = useState("");
  const [sending, setSending]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [lightboxUrl, setLightboxUrl]   = useState<string | null>(null);
  const chatEndRef                      = useRef<HTMLDivElement>(null);
  const inputRef                        = useRef<HTMLInputElement>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  // ─── Plantillas de respuesta rápida ──────────────────────
  const quickReplies = [
    "Hola, procedo a realizar la transferencia.",
    "Ya realicé el pago. Por favor revise y libere.",
    "Su pago aún no se refleja. ¿Puede enviarme el comprobante?",
    "¿Cuál es su número de Transfermóvil?",
    "Gracias por el comercio. ¡Feliz día! 🤝",
  ];

  // ─── Suscripción en tiempo real al chat ──────────────────
  useEffect(() => {
    if (!tradeId) return;
    const unsubscribe = subscribeToTradeMessages(tradeId);
    return () => unsubscribe();
  }, [tradeId, subscribeToTradeMessages]);

  // ─── Autoscroll al último mensaje ────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tradeMessages]);

  // ─── Enviar mensaje de texto ─────────────────────────────
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    setNewMessage("");
    await sendMessage(tradeId, text);
    setSending(false);
    inputRef.current?.focus();
  };

  const handleQuickReply = async (reply: string) => {
    if (sending) return;
    setSending(true);
    await sendMessage(tradeId, reply);
    setSending(false);
  };

  // ─── Subir imagen ─────────────────────────────────────────
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten imágenes");
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande (máx 5MB)");
      return;
    }

    setUploading(true);

    try {
      // Subir a Cloudinary
      const formData = new FormData();
      formData.append("file",          file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder",        `cubax/chat/${tradeId}`);

      const cloudRes  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const cloudData = await cloudRes.json();

      if (!cloudData.secure_url) throw new Error("Error subiendo imagen");

      // Enviar mensaje al backend
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/trades/${tradeId}/messages`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          text:     newMessage.trim() || "",
          imageUrl: cloudData.secure_url,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setNewMessage("");
    } catch (err: any) {
      alert("Error enviando imagen: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── Formatear hora ───────────────────────────────────────
  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour:   "2-digit",
      minute: "2-digit",
    });

  if (!user) return null;

  return (
    <>
      <Card
        padding="none"
        className="flex flex-col h-[520px] border-gray-100 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-navy-900 shadow-sm rounded-2xl"
      >
        {/* ═══ CABECERA ════════════════════════════════════════ */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Chat del Trade
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
            #{tradeId.slice(-8)}
          </span>
        </div>

        {/* ═══ ALERTA DE SEGURIDAD ═════════════════════════════ */}
        <div className="bg-amber-500/10 border-b border-amber-500/10 px-4 py-2 flex items-start gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
            <strong>Importante:</strong> Nunca liberes cripto antes de confirmar
            el dinero en tu cuenta real. CubaX jamás te pedirá contraseñas por
            este chat.
          </p>
        </div>

        {/* ═══ MENSAJES ════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
          {tradeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                <User2 className="h-6 w-6 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xs font-semibold text-gray-400 mb-1">
                Chat vacío
              </p>
              <p className="text-[11px] text-gray-400 max-w-[200px] leading-relaxed">
                Escribe un mensaje o envía una imagen para iniciar el contacto.
              </p>
            </div>
          ) : (
            tradeMessages.map((msg: any) => {
              const isMe     = msg.senderId === user.uid;
              const isSystem = isSystemMessage(msg.senderId);
              const hasImage = msg.type === "image" && msg.imageUrl;

              // ─── Mensaje del sistema ──────────────────────
              if (isSystem) {
                return (
                  <div
                    key={msg.id || msg.createdAt}
                    className="flex justify-center"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 max-w-[90%]">
                      <Zap className="h-3 w-3 text-brand-500 flex-shrink-0" />
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              }

              // ─── Mensaje normal ───────────────────────────
              return (
                <div
                  key={msg.id || msg.createdAt}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  {/* Nombre y hora */}
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {isMe ? "Tú" : msg.senderName}
                    </span>
                    <span className="text-[9px] text-gray-300 dark:text-gray-600 font-mono">
                      {formatTime(msg.createdAt as number)}
                    </span>
                  </div>

                  {/* Burbuja con imagen */}
                  {hasImage && (
                    <div
                      className={`max-w-[75%] rounded-2xl overflow-hidden shadow-sm cursor-pointer relative group ${
                        isMe ? "rounded-tr-none" : "rounded-tl-none"
                      }`}
                      onClick={() => setLightboxUrl(msg.imageUrl)}
                    >
                      <img
                        src={msg.imageUrl}
                        alt="Imagen enviada"
                        className="w-full max-h-[300px] object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}

                  {/* Burbuja de texto */}
                  {msg.text && (
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                        hasImage ? "mt-1" : ""
                      } ${
                        isMe
                          ? "bg-brand-500 text-white rounded-tr-none"
                          : "bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Doble check para mensajes propios */}
                  {isMe && (
                    <div className="flex items-center gap-0.5 mt-0.5 px-1">
                      <CheckCheck className="h-2.5 w-2.5 text-brand-400" />
                      <span className="text-[9px] text-gray-300 dark:text-gray-600">
                        Enviado
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ═══ RESPUESTAS RÁPIDAS ══════════════════════════════ */}
        <div className="px-3 py-1.5 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/[0.04] flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => handleQuickReply(reply)}
              disabled={sending}
              className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-navy-950 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 rounded-full text-[11px] font-medium border border-gray-200 dark:border-white/10 transition-colors disabled:opacity-40 flex-shrink-0"
            >
              <Zap className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
              {reply}
            </button>
          ))}
        </div>

        {/* ═══ INPUT DE ENVÍO ══════════════════════════════════ */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2"
        >
          {/* Botón imagen */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUploadImage}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40"
            title="Enviar imagen"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={uploading ? "Subiendo imagen..." : "Escribe un mensaje..."}
            disabled={sending || uploading}
            className="flex-1 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending || uploading}
            className="h-8 w-8 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 transition-all flex-shrink-0 active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </Card>

      {/* ═══ LIGHTBOX (imagen ampliada) ══════════════════════ */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={lightboxUrl}
            alt="Imagen ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <a
            href={lightboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 text-white/80 text-xs font-semibold underline"
            onClick={(e) => e.stopPropagation()}
          >
            Abrir en nueva pestaña
          </a>
        </div>
      )}
    </>
  );
        }
