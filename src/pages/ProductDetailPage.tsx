import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CONDITION_LABELS, CATEGORY_LABELS, CRYPTO_ICONS } from "@/data/mock";
import { db } from "@/lib/firebase/config";
import {
  collection, doc, addDoc, setDoc,
  query, where, orderBy, onSnapshot, updateDoc,
} from "firebase/firestore";
import {
  MapPin, Calendar, Star, MessageCircle,
  ShoppingCart, Share2, Heart, Loader2,
  Trash2, AlertTriangle, ChevronLeft, ChevronRight,
  Package, CheckCircle2, X, Send, Zap,
} from "lucide-react";
import type { Product, ChatMessage } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com";

export function ProductDetailPage() {
  const {
    selectedProductId,
    products,
    setProducts,
    user,
    navigate,
  } = useAppStore();

  const [liked, setLiked]                         = useState(false);
  const [buying, setBuying]                       = useState(false);
  const [deleting, setDeleting]                   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [buySuccess, setBuySuccess]               = useState(false);
  const [shareMsg, setShareMsg]                   = useState(false);
  const [buyError, setBuyError]                   = useState<string | null>(null);

  // ✅ Chat con el vendedor
  const [showChat, setShowChat]       = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage]   = useState("");
  const [sendingMsg, setSendingMsg]   = useState(false);
  const [chatRoomId, setChatRoomId]   = useState<string | null>(null);

  // ─── Cargar productos si el store está vacío ──────────────
  useEffect(() => {
    if (products.length > 0) return;

    const q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveProducts: Product[] = snapshot.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Product)
      );
      setProducts(liveProducts);
    });

    return () => unsubscribe();
  }, []);

  const product = products.find((p) => p.id === selectedProductId);
  const isOwner = user?.uid === product?.sellerId;

  // ─── Chat con el vendedor ─────────────────────────────────
  // El chatRoomId es una combinación del productId + buyerId
  useEffect(() => {
    if (!showChat || !product || !user) return;

    // ✅ ID único para esta conversación
    const roomId = `product_${product.id}_${
      isOwner ? "seller" : user.uid
    }`;
    setChatRoomId(roomId);

    // ✅ Escuchar mensajes en tiempo real
    const q = query(
      collection(db, "product_chats", roomId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id:         d.id,
            senderId:   data.senderId   || "",
            senderName: data.senderName || "",
            text:       data.text       || "",
            createdAt:  data.createdAt  || Date.now(),
            type:       data.type       || "text",
          } as ChatMessage;
        });
        setChatMessages(msgs);
      },
      (err) => {
        console.warn("Error en chat:", err.message);
      }
    );

    return () => unsubscribe();
  }, [showChat, product?.id, user?.uid]);

  // ─── Enviar mensaje ───────────────────────────────────────
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || !user || sendingMsg) return;

    setSendingMsg(true);
    try {
      // ✅ Crear sala si no existe y enviar mensaje
      await setDoc(
        doc(db, "product_chats", chatRoomId),
        {
          productId:    product?.id,
          productTitle: product?.title,
          buyerId:      isOwner ? null : user.uid,
          buyerName:    isOwner ? null : user.displayName,
          sellerId:     product?.sellerId,
          sellerName:   product?.sellerName,
          createdAt:    Date.now(),
        },
        { merge: true }
      );

      await addDoc(
        collection(db, "product_chats", chatRoomId, "messages"),
        {
          senderId:   user.uid,
          senderName: user.displayName || "Usuario",
          text:       newMessage.trim(),
          createdAt:  Date.now(),
          type:       "text",
        }
      );

      setNewMessage("");

      // ✅ Notificar a la contraparte
      const recipientId = isOwner ? chatRoomId.split("_")[2] : product?.sellerId;
      if (recipientId && recipientId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          userId:    recipientId,
          title:     `💬 Nuevo mensaje`,
          body:      `${user.displayName}: ${newMessage.trim().slice(0, 50)}`,
          type:      "product",
          read:      false,
          createdAt: Date.now(),
        });
      }
    } catch (err: any) {
      console.error("Error enviando mensaje:", err);
    } finally {
      setSendingMsg(false);
    }
  };

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
      await updateDoc(doc(db, "products", product.id), {
        status:    "cancelled",
        deletedAt: Date.now(),
        deletedBy: user.uid,
      });

      setProducts(products.filter((p) => p.id !== product.id));
      navigate("marketplace");
    } catch (error: any) {
      console.error("Error al borrar producto:", error);
      alert("Error al borrar el producto: " + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ─── Comprar — via backend ────────────────────────────────
  // ✅ Movido al backend para bypasear las reglas de Firestore
  const handleBuy = async () => {
    if (!user)    return alert("Debes iniciar sesión para comprar.");
    if (isOwner)  return alert("No puedes comprar tu propio producto.");
    if (!product) return;

    setBuying(true);
    setBuyError(null);

    try {
      const res  = await fetch(`${BACKEND_URL}/api/marketplace/buy`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          buyerId:   user.uid,
          buyerName: user.displayName || "Comprador CubaX",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Error al procesar la compra.");
      }

      setBuySuccess(true);
      setTimeout(() => navigate("marketplace"), 2500);

    } catch (error: any) {
      console.error("Error en la compra:", error);
      setBuyError(error.message || "Hubo un problema al procesar el pago.");
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

  // ─── Éxito de compra ──────────────────────────────────────
  if (buySuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Compra exitosa! 🎉
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          <strong>{product.title}</strong> es tuyo ahora.
        </p>
        <p className="text-xs text-gray-400">
          Coordina la entrega con el vendedor. Redirigiendo...
        </p>
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
                        i === currentImageIndex
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/50"
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
            <span className="text-7xl">
              {categoryEmoji[product.category] || "📦"}
            </span>
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
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-medium">
            ✅ Enlace copiado
          </div>
        )}

        {product.status === "sold" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="px-6 py-3 rounded-2xl bg-red-500 text-white font-black text-xl rotate-[-15deg] shadow-2xl">
              VENDIDO
            </div>
          </div>
        )}

        {isOwner && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">
              Tu publicación
            </span>
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

        {/* Criptos aceptadas */}
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
            {!isOwner && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowChat(!showChat)}
                icon={<MessageCircle className="h-3.5 w-3.5" />}
              >
                Chat
              </Button>
            )}
          </div>
        </Card>

        {/* ✅ CHAT CON EL VENDEDOR ──────────────────────────── */}
        {showChat && !isOwner && (
          <Card padding="none" className="overflow-hidden animate-slide-up">

            {/* Header del chat */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Chat con {product.sellerName}
                </span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="h-48 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-white/[0.01]">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs font-semibold text-gray-400">
                    Sin mensajes aún
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Pregunta al vendedor sobre el producto
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
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
                placeholder="Escribe un mensaje..."
                disabled={sendingMsg}
                className="flex-1 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMsg}
                className="h-8 w-8 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 transition-all active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </Card>
        )}

        {/* Error de compra */}
        {buyError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">{buyError}</p>
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
                Esta es tu publicación. Puedes eliminarla si ya no deseas ofrecerla.
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
            <Button
              size="lg"
              fullWidth
              loading={buying}
              disabled={buying || product.status === "sold"}
              onClick={handleBuy}
              icon={
                buying
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ShoppingCart className="h-4 w-4" />
              }
            >
              {product.status === "sold"
                ? "Producto vendido"
                : buying
                ? "Procesando pago..."
                : `Comprar por $${product.priceUSD.toLocaleString("en-US")} USD`}
            </Button>

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
              <button onClick={() => setShowDeleteConfirm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl">{categoryEmoji[product.category] || "📦"}</span>
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
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                Esta acción eliminará tu publicación del Marketplace.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
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
                {deleting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Sí, eliminar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
