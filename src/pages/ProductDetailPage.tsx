import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CONDITION_LABELS, CATEGORY_LABELS, CRYPTO_ICONS } from "@/data/data";
import {
  MapPin, Calendar, Star, MessageCircle,
  ShoppingCart, Share2, Heart, Loader2,
  Trash2, AlertTriangle, ChevronLeft, ChevronRight,
  Package, CheckCircle2, X, Send, Truck, CreditCard,
  Clock, ShoppingBag,
} from "lucide-react";
import type {
  Product, ChatMessage, DeliveryMethod,
  ProductPaymentTiming,
} from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com";

export function ProductDetailPage() {
  const {
    selectedProductId,
    products,
    setProducts,
    user,
    navigate,
  } = useAppStore();

  // ─── Estados base ─────────────────────────────────────────
  const [liked, setLiked]                         = useState(false);
  const [buying, setBuying]                       = useState(false);
  const [deleting, setDeleting]                   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [orderCreated, setOrderCreated]           = useState(false);
  const [orderId, setOrderId]                     = useState<string | null>(null);
  const [shareMsg, setShareMsg]                   = useState(false);
  const [buyError, setBuyError]                   = useState<string | null>(null);

  // ─── Estados del chat ─────────────────────────────────────
  const [showChat, setShowChat]                 = useState(false);
  const [chatMessages, setChatMessages]         = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage]             = useState("");
  const [sendingMsg, setSendingMsg]             = useState(false);
  const [chatRoomId, setChatRoomId]             = useState<string | null>(null);
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);
  const [productChats, setProductChats]         = useState<Array<{
    roomId:       string;
    buyerId:      string;
    buyerName:    string;
    lastMessage?: string;
  }>>([]);

  // ─── Opciones de compra ───────────────────────────────────
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryMethod>("pickup");
  const [deliveryAddress, setDeliveryAddress]   = useState("");
  const [showBuyModal, setShowBuyModal]         = useState(false);

  // ─── Cargar productos si el store está vacío ──────────────
  useEffect(() => {
    if (products.length > 0) return;

    fetch(`${BACKEND_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setProducts(data.products); })
      .catch(console.error);
  }, []);

  const product = products.find((p) => p.id === selectedProductId);
  const isOwner = user?.uid === product?.sellerId;

  // ─── Chat comprador — sala única ──────────────────────────
  useEffect(() => {
    if (!showChat || !product || !user || isOwner) return;

    const roomId = `product_${product.id}_${user.uid}`;
    setChatRoomId(roomId);
    setSelectedChatRoom(roomId);

    let stopped = false;

    const loadMessages = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(
          `${BACKEND_URL}/api/chats/${encodeURIComponent(roomId)}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && !stopped) setChatMessages(data.messages);
      } catch (err) {
        console.warn("Error chat comprador:", err);
      }
    };

    void loadMessages();
    const intervalId = window.setInterval(loadMessages, 5000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [showChat, product?.id, user?.uid, isOwner]);

  // ─── Chat vendedor — todos los chats del producto ─────────
  useEffect(() => {
    if (!showChat || !product || !user || !isOwner) return;

    let stopped = false;

    const loadChats = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(
          `${BACKEND_URL}/api/products/${product.id}/chats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && !stopped) {
          setProductChats(data.chats);
          if (data.chats.length > 0 && !selectedChatRoom) {
            setSelectedChatRoom(data.chats[0].roomId);
            setChatRoomId(data.chats[0].roomId);
          }
        }
      } catch (err) {
        console.warn("Error chats vendedor:", err);
      }
    };

    void loadChats();
    const intervalId = window.setInterval(loadChats, 10000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [showChat, product?.id, user?.uid, isOwner]);

  // ─── Vendedor — mensajes del chat seleccionado ────────────
  useEffect(() => {
    if (!isOwner || !selectedChatRoom || !showChat) return;

    setChatRoomId(selectedChatRoom);
    let stopped = false;

    const loadMessages = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(
          `${BACKEND_URL}/api/chats/${encodeURIComponent(selectedChatRoom)}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && !stopped) setChatMessages(data.messages);
      } catch (err) {
        console.warn("Error mensajes vendedor:", err);
      }
    };

    void loadMessages();
    const intervalId = window.setInterval(loadMessages, 5000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [selectedChatRoom, isOwner, showChat]);

  // ─── Enviar mensaje ───────────────────────────────────────
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || !user || sendingMsg) return;

    setSendingMsg(true);
    const msgText = newMessage.trim();
    setNewMessage("");

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(
        `${BACKEND_URL}/api/chats/${encodeURIComponent(chatRoomId)}/messages`,
        {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ text: msgText }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, data.message]);
      }
    } catch (err: any) {
      console.error("❌ Error enviando mensaje:", err);
      setNewMessage(msgText);
    } finally {
      setSendingMsg(false);
    }
  };

  // ─── Abrir chat desde notificación ───────────────────────
  useEffect(() => {
    // Extensible desde el store si se pasa el chatRoomId
  }, []);

  // ─── Compartir ────────────────────────────────────────────
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text:  `Mira este producto en CubaX: ${product?.title} por $${product?.priceUSD}`,
          url:   window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareMsg(true);
      setTimeout(() => setShareMsg(false), 2000);
    }
  };

  // ─── Borrar producto ──────────────────────────────────────
  const handleDelete = async () => {
    if (!product || !user || user.uid !== product.sellerId) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/api/products/delete`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: user.uid, productId: product.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setProducts(products.filter((p) => p.id !== product.id));
      navigate("marketplace");
    } catch (error: any) {
      alert("Error al borrar: " + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ─── Comprar ──────────────────────────────────────────────
  const handleBuy = async () => {
    if (!user)    return alert("Debes iniciar sesión.");
    if (isOwner)  return alert("No puedes comprar tu propio producto.");
    if (!product) return;

    if (selectedDelivery === "delivery" && !deliveryAddress.trim()) {
      setBuyError("Ingresa tu dirección de entrega.");
      return;
    }

    setBuying(true);
    setBuyError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/api/marketplace/buy`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId:       product.id,
          buyerId:         user.uid,
          buyerName:       user.displayName || "Comprador CubaX",
          deliveryMethod:  selectedDelivery,
          deliveryAddress: selectedDelivery === "delivery" ? deliveryAddress : null,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al procesar.");

      setOrderId(data.orderId);
      setOrderCreated(true);
      setShowBuyModal(false);

      const roomId = data.roomId || `product_${product.id}_${user.uid}`;
      setChatRoomId(roomId);
      setSelectedChatRoom(roomId);

      setTimeout(() => setShowChat(true), 300);

    } catch (error: any) {
      setBuyError(error.message || "Hubo un problema.");
    } finally {
      setBuying(false);
    }
  };

  // ─── Categoría emoji ──────────────────────────────────────
  const categoryEmoji: Record<string, string> = {
    phones:      "📱",
    computers:   "💻",
    electronics: "🔌",
    services:    "🛠",
    clothing:    "👕",
    home:        "🏠",
    vehicles:    "🚗",
    other:       "📦",
  };

  const paymentTimingLabel = (timing?: ProductPaymentTiming) => {
    switch (timing) {
      case "before":      return "Pago antes de recibir";
      case "on_delivery": return "Pago al recibir";
      default:            return "Coordinado entre ambos";
    }
  };

  // ─── Loading ──────────────────────────────────────────────
  if (!product) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-10 w-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Cargando producto...
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate("marketplace")}>
          Volver al Marketplace
        </Button>
      </div>
    );
  }

  // ─── RENDER PRINCIPAL ─────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto pb-24 animate-fade-in">
      
      {/* ═══ GALERÍA ════════════════════════════════════════ */}
      <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images[currentImageIndex]}
              alt={product.title}
              className="h-full w-full object-cover transition-all duration-300"
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((i) => Math.max(0, i - 1))}
                  disabled={currentImageIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((i) =>
                      Math.min(product.images!.length - 1, i + 1)
                    )
                  }
                  disabled={currentImageIndex === product.images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/40 text-white text-[10px] font-bold">
                  {currentImageIndex + 1}/{product.images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-7xl">{categoryEmoji[product.category] || "📦"}</span>
          </div>
        )}

        {/* Botones flotantes */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className="p-2 rounded-full backdrop-blur-md bg-white/80 dark:bg-black/40 shadow-sm"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full backdrop-blur-md bg-white/80 dark:bg-black/40 shadow-sm"
          >
            <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {shareMsg && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs">
            ✅ Enlace copiado
          </div>
        )}

        {isOwner && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">
              Tu publicación
            </span>
          </div>
        )}

        {/* ✅ Badge de ventas realizadas */}
        {(product.totalSold || 0) > 0 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" />
            {product.totalSold} vendidos
          </div>
        )}
      </div>

      {/* ═══ CONTENIDO ════════════════════════════════════════ */}
      <div className="px-4 py-4 space-y-4">

        {/* Título y precio */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight flex-1">
              {product.title}
            </h1>
            <Badge variant={product.condition === "new" ? "success" : "default"} size="md">
              {CONDITION_LABELS[product.condition] || product.condition}
            </Badge>
          </div>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-black text-brand-500">
              ${product.priceUSD.toLocaleString("en-US")}
            </p>
            <p className="text-xs text-gray-400 pb-0.5">
              ≈ {(product.priceUSD * 395).toLocaleString("es-CU")} CUP
            </p>
          </div>
        </div>

        {/* Criptos */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">Acepta:</span>
          {product.acceptedCryptos?.map((c) => (
            <span key={c} className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-500 text-xs font-bold">
              {CRYPTO_ICONS[c] || "🪙"} {c}
            </span>
          ))}
        </div>

        {/* Info */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {product.location}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(product.createdAt).toLocaleDateString("es-CU")}
          </div>
          <Badge size="sm">
            {CATEGORY_LABELS[product.category] || product.category}
          </Badge>
        </div>

        {/* ✅ Opciones de entrega y pago */}
        <Card padding="md">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Entrega y pago
          </p>
          <div className="space-y-2">
            {/* Entrega */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.delivery?.pickup && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <MapPin className="h-3.5 w-3.5 text-brand-500" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Recogida
                  </span>
                </div>
              )}
              {product.delivery?.homeDelivery && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <Truck className="h-3.5 w-3.5 text-brand-500" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Envío a domicilio
                    {product.delivery.deliveryFee !== undefined
                      ? product.delivery.deliveryFee === 0
                        ? " — Gratis"
                        : ` — $${product.delivery.deliveryFee}`
                      : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Info de entrega */}
            {product.delivery?.deliveryInfo && (
              <p className="text-[11px] text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-xl">
                📍 {product.delivery.deliveryInfo}
              </p>
            )}

            {/* Momento de pago */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              {product.paymentTiming === "before"      && <CreditCard className="h-3.5 w-3.5 text-brand-500" />}
              {product.paymentTiming === "on_delivery" && <Truck       className="h-3.5 w-3.5 text-brand-500" />}
              {product.paymentTiming === "flexible"    && <Clock       className="h-3.5 w-3.5 text-brand-500" />}
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {paymentTimingLabel(product.paymentTiming)}
              </span>
            </div>
          </div>
        </Card>

        {/* Descripción */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-brand-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Descripción
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {product.description}
          </p>
        </Card>

        {/* Vendedor */}
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Avatar name={product.sellerName} size="md" />
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {product.sellerName}
                {isOwner && (
                  <span className="ml-2 text-[10px] font-semibold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-full">
                    Tú
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span>Vendedor verificado</span>
              </div>
            </div>

            {/* ✅ Botón chat para todos */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChat(!showChat)}
              icon={<MessageCircle className="h-3.5 w-3.5" />}
            >
              {isOwner
                ? `Chats${productChats.length > 0 ? ` (${productChats.length})` : ""}`
                : showChat ? "Cerrar" : "Chat"
              }
            </Button>
          </div>
        </Card>

        {/* ✅ CHAT ─────────────────────────────────────────── */}
        {showChat && (
          <Card padding="none" className="overflow-hidden animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {isOwner ? `Conversaciones — ${product.title}` : `Chat con ${product.sellerName}`}
                </span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>

            {/* Vendedor: tabs de compradores */}
            {isOwner && productChats.length > 1 && (
              <div className="px-3 py-2 bg-gray-50 dark:bg-white/[0.01] border-b border-gray-100 dark:border-white/[0.04] flex gap-2 overflow-x-auto scrollbar-hide">
                {productChats.map((chat) => (
                  <button
                    key={chat.roomId}
                    onClick={() => {
                      setSelectedChatRoom(chat.roomId);
                      setChatRoomId(chat.roomId);
                      setChatMessages([]);
                    }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedChatRoom === chat.roomId
                        ? "bg-brand-500 text-white"
                        : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {chat.buyerName || "Comprador"}
                  </button>
                ))}
              </div>
            )}

            {/* Sin chats — vendedor */}
            {isOwner && productChats.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                <MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs font-semibold text-gray-400">Sin mensajes aún</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Los compradores te escribirán aquí
                </p>
              </div>
            ) : (
              <>
                {/* Mensajes */}
                <div className="h-52 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-white/[0.01]">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-xs font-semibold text-gray-400">Sin mensajes aún</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isOwner ? "Responde al comprador aquí" : "Pregunta al vendedor"}
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isMe     = msg.senderId === user?.uid;
                      const isSystem = msg.senderId === "SYSTEM";

                      if (isSystem) {
                        return (
                          <div key={idx} className="flex justify-center">
                            <div className="px-3 py-1.5 rounded-full bg-gray-200 dark:bg-white/10 max-w-[90%]">
                              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center whitespace-pre-line">
                                {msg.text}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-1 mb-0.5 px-1">
                            <span className="text-[10px] font-bold text-gray-400">
                              {isMe ? "Tú" : msg.senderName}
                            </span>
                            <span className="text-[9px] text-gray-300 dark:text-gray-600 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                            isMe
                              ? "bg-brand-500 text-white rounded-tr-none"
                              : "bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="p-3 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isOwner ? "Responder..." : "Escribe un mensaje..."}
                    disabled={sendingMsg}
                    className="flex-1 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMsg}
                    className="h-8 w-8 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            )}
          </Card>
        )}

        {/* ✅ Orden creada — banner de confirmación */}
        {orderCreated && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 animate-slide-up">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                ¡Orden creada! Coordina con el vendedor por el chat.
              </p>
              {orderId && (
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                  Orden #{orderId.slice(-8)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {buyError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 flex-1">{buyError}</p>
            <button onClick={() => setBuyError(null)}>
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}

        {/* ═══ BOTONES DE ACCIÓN ═══════════════════════════════ */}
        {isOwner ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Esta es tu publicación. Los compradores interesados te contactarán por chat.
              </p>
            </div>
            <Button
              size="lg"
              fullWidth
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="border-red-500/30 text-red-500 hover:bg-red-500/5"
              icon={<Trash2 className="h-4 w-4" />}
            >
              Eliminar publicación
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* ✅ Botón comprar — abre modal de opciones */}
            {!orderCreated ? (
              <Button
                size="lg"
                fullWidth
                onClick={() => setShowBuyModal(true)}
                icon={<ShoppingCart className="h-4 w-4" />}
              >
                Comprar por ${product.priceUSD.toLocaleString("en-US")} USD
              </Button>
            ) : (
              <Button
                size="lg"
                fullWidth
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => setShowChat(true)}
                icon={<MessageCircle className="h-4 w-4" />}
              >
                Ver chat con el vendedor
              </Button>
            )}

            <Button
              size="lg"
              fullWidth
              variant="outline"
              onClick={() => setShowChat(!showChat)}
              icon={<MessageCircle className="h-4 w-4" />}
            >
              {showChat ? "Cerrar chat" : "Contactar al vendedor"}
            </Button>
          </div>
        )}
      </div>

      {/* ═══ MODAL DE COMPRA ══════════════════════════════════ */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-slide-up">

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Opciones de compra
              </h3>
              <button
                onClick={() => setShowBuyModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Resumen del producto */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                    <span className="text-xl">{categoryEmoji[product.category]}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {product.title}
                </p>
                <p className="text-brand-500 font-black">
                  ${product.priceUSD.toLocaleString("en-US")} USD
                </p>
              </div>
            </div>

            {/* ✅ Método de entrega */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                ¿Cómo quieres recibirlo?
              </p>
              <div className="space-y-2">
                {product.delivery?.pickup && (
                  <button
                    onClick={() => setSelectedDelivery("pickup")}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedDelivery === "pickup"
                        ? "border-brand-500 bg-brand-500/5"
                        : "border-gray-200 dark:border-white/10"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedDelivery === "pickup"
                        ? "border-brand-500 bg-brand-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {selectedDelivery === "pickup" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Recogida en persona
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Coordina con el vendedor en {product.location}
                      </p>
                    </div>
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </button>
                )}

                {product.delivery?.homeDelivery && (
                  <button
                    onClick={() => setSelectedDelivery("delivery")}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedDelivery === "delivery"
                        ? "border-brand-500 bg-brand-500/5"
                        : "border-gray-200 dark:border-white/10"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedDelivery === "delivery"
                        ? "border-brand-500 bg-brand-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {selectedDelivery === "delivery" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Envío a domicilio
                        {product.delivery.deliveryFee !== undefined
                          ? product.delivery.deliveryFee === 0
                            ? " — Gratis"
                            : ` — $${product.delivery.deliveryFee} USD`
                          : ""}
                      </p>
                      {product.delivery.deliveryInfo && (
                        <p className="text-[11px] text-gray-400">
                          {product.delivery.deliveryInfo}
                        </p>
                      )}
                    </div>
                    <Truck className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Dirección de entrega */}
            {selectedDelivery === "delivery" && (
              <div className="animate-slide-up">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Tu dirección de entrega
                </label>
                <textarea
                  placeholder="Calle, número, municipio, provincia..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 px-4 py-2.5 text-sm focus:border-brand-500 outline-none resize-none"
                />
              </div>
            )}

            {/* Info de pago */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
              {product.paymentTiming === "before"      && <CreditCard className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              {product.paymentTiming === "on_delivery" && <Truck       className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              {product.paymentTiming === "flexible"    && <Clock       className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
                Pago: {paymentTimingLabel(product.paymentTiming)}
              </p>
            </div>

            {buyError && (
              <p className="text-xs text-red-500 font-semibold text-center">
                {buyError}
              </p>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowBuyModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleBuy}
                disabled={buying || (selectedDelivery === "delivery" && !deliveryAddress.trim())}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold disabled:opacity-50 transition-colors"
              >
                {buying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                ) : (
                  <><ShoppingCart className="h-4 w-4" /> Confirmar orden</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL CONFIRMAR BORRADO ══════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-slide-up">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Eliminar publicación
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                    <span className="text-xl">{categoryEmoji[product.category]}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {product.title}
                </p>
                <p className="text-xs text-gray-400">
                  ${product.priceUSD.toLocaleString("en-US")} USD
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">
                Esta acción eliminará tu publicación del Marketplace.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50"
              >
                {deleting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando...</>
                  : <><Trash2  className="h-4 w-4" /> Sí, eliminar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
          
