import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CONDITION_LABELS, CATEGORY_LABELS, CRYPTO_ICONS } from "@/data/mock";
import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  runTransaction,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  ShoppingCart,
  Share2,
  Heart,
  Loader2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle2,
  X,
} from "lucide-react";
import type { Product } from "@/types";

export function ProductDetailPage() {
  const {
    selectedProductId,
    products,
    setProducts,
    user,
    navigate,
  } = useAppStore();

  // ─── Estados ─────────────────────────────────────────────
  const [liked, setLiked]               = useState(false);
  const [buying, setBuying]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [buySuccess, setBuySuccess]     = useState(false);
  const [shareMsg, setShareMsg]         = useState(false);

  // ─── Cargar productos si el store está vacío ──────────────
  useEffect(() => {
    if (products.length > 0) return;

    const q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        liveProducts.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(liveProducts);
    });

    return () => unsubscribe();
  }, []);

  // ─── Producto actual ──────────────────────────────────────
  const product = products.find((p) => p.id === selectedProductId);

  // ─── Emoji por categoría ──────────────────────────────────
  const categoryEmoji: Record<string, string> = {
    phones:     "📱",
    computers:  "💻",
    electronics:"🔌",
    services:   "🛠",
    clothing:   "👕",
    home:       "🏠",
    vehicles:   "🚗",
    other:      "📦",
  };

  // ─── Es el dueño del producto ─────────────────────────────
  const isOwner = user?.uid === product?.sellerId;

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
    if (!product || !user) return;
    if (user.uid !== product.sellerId) return;

    setDeleting(true);
    try {
      // ✅ Marcar como inactivo en vez de borrar físicamente
      // Así conservamos el historial
      await updateDoc(doc(db, "products", product.id), {
        status:    "deleted",
        deletedAt: Date.now(),
        deletedBy: user.uid,
      });

      // ✅ Actualizar store local
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

  // ─── Comprar ──────────────────────────────────────────────
  const handleBuy = async () => {
    if (!user)    return alert("Debes iniciar sesión para comprar.");
    if (isOwner)  return alert("No puedes comprar tu propio producto.");
    if (!product) return;

    setBuying(true);
    try {
      await runTransaction(db, async (transaction) => {
        const buyerRef   = doc(db, "users", user.uid);
        const sellerRef  = doc(db, "users", product.sellerId);
        const productRef = doc(db, "products", product.id);
        const orderRef   = doc(collection(db, "orders"));

        const buyerDoc  = await transaction.get(buyerRef);
        // ✅ Leer balance real del vendedor
        const sellerDoc = await transaction.get(sellerRef);

        if (!buyerDoc.exists())  throw new Error("Tu usuario no existe en Firestore.");
        if (!sellerDoc.exists()) throw new Error("El vendedor no existe en Firestore.");

        const buyerBalance  = buyerDoc.data().balanceUSD  || 0;
        const sellerBalance = sellerDoc.data().balanceUSD || 0;

        if (buyerBalance < product.priceUSD) {
          throw new Error(
            `Saldo insuficiente. Tienes $${buyerBalance.toFixed(2)} USD y el producto cuesta $${product.priceUSD} USD.`
          );
        }

        // ✅ Mover fondos de forma atómica
        transaction.update(buyerRef, {
          balanceUSD: buyerBalance - product.priceUSD,
        });
        transaction.update(sellerRef, {
          balanceUSD: sellerBalance + product.priceUSD,
        });

        // ✅ Marcar producto como vendido
        transaction.update(productRef, {
          status:   "sold",
          soldAt:   Date.now(),
          soldTo:   user.uid,
        });

        // ✅ Crear orden de compra
        transaction.set(orderRef, {
          id:           orderRef.id,
          productId:    product.id,
          productTitle: product.title,
          productImage: product.images?.[0] || null,
          priceUSD:     product.priceUSD,
          buyerId:      user.uid,
          buyerName:    user.displayName || "Comprador CubaX",
          sellerId:     product.sellerId,
          sellerName:   product.sellerName,
          status:       "completed",
          createdAt:    Date.now(),
        });
      });

      setBuySuccess(true);
      setTimeout(() => navigate("marketplace"), 2500);

    } catch (error: any) {
      console.error("Error en la transacción:", error);
      alert(error.message || "Hubo un problema al procesar el pago.");
    } finally {
      setBuying(false);
    }
  };

  // ─── Loading state ────────────────────────────────────────
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

  // ─── Pantalla de éxito de compra ──────────────────────────
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

      {/* ═══ GALERÍA DE IMÁGENES ══════════════════════════════ */}
      <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images[currentImageIndex]}
              alt={product.title}
              className="h-full w-full object-cover transition-all duration-300"
            />

            {/* Navegación de imágenes */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((i) => Math.max(0, i - 1))}
                  disabled={currentImageIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 transition-all hover:bg-black/60"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 transition-all hover:bg-black/60"
                >
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>

                {/* Indicadores de imagen */}
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
              </>
            )}

            {/* Contador de imágenes */}
            {product.images.length > 1 && (
              <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold">
                {currentImageIndex + 1}/{product.images.length}
              </div>
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
            className="p-2 rounded-full backdrop-blur-md bg-white/80 dark:bg-black/40 shadow-sm transition-all active:scale-90"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                liked
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full backdrop-blur-md bg-white/80 dark:bg-black/40 shadow-sm transition-all active:scale-90"
          >
            <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Msg copiado */}
        {shareMsg && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-medium">
            ✅ Enlace copiado
          </div>
        )}

        {/* Badge de estado */}
        {product.status === "sold" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="px-6 py-3 rounded-2xl bg-red-500 text-white font-black text-xl rotate-[-15deg] shadow-2xl">
              VENDIDO
            </div>
          </div>
        )}

        {/* Badge dueño */}
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
            <Badge
              variant={product.condition === "new" ? "success" : "default"}
              size="md"
            >
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
            <span
              key={c}
              className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-500 text-xs font-bold"
            >
              {CRYPTO_ICONS[c] || "🪙"} {c}
            </span>
          ))}
        </div>

        {/* Info: ubicación, fecha, categoría */}
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
                <span>4.8 • Vendedor verificado</span>
              </div>
            </div>
            {!isOwner && (
              <Button
                size="sm"
                variant="ghost"
                icon={<MessageCircle className="h-3.5 w-3.5" />}
              >
                Chat
              </Button>
            )}
          </div>
        </Card>

        {/* ═══ BOTONES DE ACCIÓN ════════════════════════════════ */}

        {/* Si es el dueño */}
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
          /* Si no es el dueño */
          <div className="space-y-2">
            <Button
              size="lg"
              fullWidth
              loading={buying}
              disabled={buying || product.status === "sold"}
              onClick={handleBuy}
              icon={
                buying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )
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
              icon={<MessageCircle className="h-4 w-4" />}
            >
              Contactar al vendedor
            </Button>
          </div>
        )}
      </div>

      {/* ═══ MODAL CONFIRMAR BORRADO ══════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-slide-up">

            {/* Header */}
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

            {/* Producto a borrar */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl">
                    {categoryEmoji[product.category] || "📦"}
                  </span>
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

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                Esta acción eliminará tu publicación del Marketplace. Los
                interesados ya no podrán verla ni comprarla.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Sí, eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
         