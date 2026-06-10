import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CONDITION_LABELS, CATEGORY_LABELS, CRYPTO_ICONS } from "@/data/mock";
import { db } from "@/lib/firebase/config";
import { collection, doc, runTransaction } from "firebase/firestore";
import {
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  ShoppingCart,
  Share2,
  Heart,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export function ProductDetailPage() {
  const { selectedProductId, products, user, navigate } = useAppStore();
  const [liked, setLiked] = useState(false);
  const [buying, setBuying] = useState(false);

  // ➡️ 1. LEER DEL POOL DE PRODUCTOS REALES SINCRONIZADOS DE FIRESTORE
  const product = products.find((p) => p.id === selectedProductId);

  if (!product) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">Producto no encontrado.</p>
        <Button size="sm" className="mt-4" onClick={() => navigate("marketplace")}>
          Volver al Marketplace
        </Button>
      </div>
    );
  }

  // ➡️ 2. OPERACIÓN TRANSACCIONAL DE COMPRA REAL
  const handleBuy = async () => {
    if (!user) return alert("Debes iniciar sesión para comprar.");
    if (user.uid === product.sellerId) return alert("No puedes comprar tu propio producto, asere.");

    const confirmBuy = window.confirm(
      `¿Confirmas la compra de "${product.title}" por $${product.priceUSD} USD?`
    );
    if (!confirmBuy) return;

    setBuying(true);

    try {
      // Usamos una transacción atómica de Firestore para asegurar que el dinero y el estado muten al unísono
      await runTransaction(db, async (transaction) => {
        const buyerRef = doc(db, "users", user.uid);
        const sellerRef = doc(db, "users", product.sellerId);
        const productRef = doc(db, "products", product.id);
        const orderRef = doc(collection(db, "orders"));

        const buyerDoc = await transaction.get(buyerRef);
        if (!buyerDoc.exists()) throw new Error("Tu usuario no existe en Firestore.");

        // Validar saldo disponible en CubaX (Asumiendo que manejas balanceUSD)
        const buyerBalance = buyerDoc.data().balanceUSD || 0;
        if (buyerBalance < product.priceUSD) {
          throw new Error("Saldo insuficiente en CubaX para completar la compra.");
        }

        // Ejecutar los movimientos de saldo de forma segura en caliente
        transaction.update(buyerRef, { balanceUSD: buyerBalance - product.priceUSD });
        transaction.update(sellerRef, { 
          balanceUSD: (buyerDoc.data().balanceUSD || 0) + product.priceUSD 
        });

        // Cambiar el estado del producto para sacarlo del Marketplace
        transaction.update(productRef, { status: "sold" });

        // Generar factura u orden real de compra
        transaction.set(orderRef, {
          id: orderRef.id,
          productId: product.id,
          productTitle: product.title,
          priceUSD: product.priceUSD,
          buyerId: user.uid,
          buyerName: user.displayName || "Comprador CubaX",
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          status: "completed",
          createdAt: Date.now(),
        });
      });

      alert("¡Compra procesada con éxito! 🎉 El saldo ha sido transferido.");
      
      // TODO: Disparar función push de Cloud Functions para notificar al vendedor aquí
      
      navigate("marketplace");
    } catch (error: any) {
      console.error("Error en la transacción de compra:", error);
      alert(error.message || "Hubo un problema al procesar el pago.");
    } finally {
      setBuying(false);
    }
  };

  const categoryEmoji: Record<string, string> = {
    phones: "📱",
    computers: "💻",
    electronics: "🔌",
    services: "🛠",
    clothing: "👕",
    home: "🏠",
    vehicles: "🚗",
    other: "📦",
  };

  return (
    <div className="max-w-lg mx-auto pb-24 animate-fade-in">
      {/* Image Container */}
      <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 flex items-center justify-center relative overflow-hidden border-b border-gray-200 dark:border-white/10">
        {/* 📸 CARGA DE IMAGEN REAL DESDE CLOUDINARY */}
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl">{categoryEmoji[product.category] || "📦"}</span>
        )}
        
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className="p-2 rounded-full backdrop-blur-md bg-white/80 dark:bg-black/40 shadow-sm"
          >
            <Heart
              className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}`}
            />
          </button>
          <button className="p-2 rounded-full backdrop-blur-md bg-white/80 dark:bg-black/40 shadow-sm">
            <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Title & Price */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {product.title}
            </h1>
            <Badge
              variant={product.condition === "new" ? "success" : "default"}
              size="md"
            >
              {CONDITION_LABELS[product.condition] || product.condition}
            </Badge>
          </div>
          <p className="text-2xl font-black text-brand-500 mt-1">
            ${product.priceUSD.toLocaleString("en-US")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            ≈ {(product.priceUSD * 395).toLocaleString("es-CU")} CUP
          </p>
        </div>

        {/* Accepted Cryptos */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Acepta:</span>
          {product.acceptedCryptos?.map((c) => (
            <span
              key={c}
              className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-500 text-xs font-semibold"
            >
              {CRYPTO_ICONS[c] || "🪙"} {c}
            </span>
          ))}
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {product.location}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(product.createdAt).toLocaleDateString("es-CU")}
          </div>
          <Badge size="sm">{CATEGORY_LABELS[product.category] || product.category}</Badge>
        </div>

        {/* Description */}
        <Card padding="md">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
            Descripción
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {product.description}
          </p>
        </Card>

        {/* Seller */}
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Avatar name={product.sellerName} size="md" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {product.sellerName}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span>4.8 • Vendedor verificado</span>
              </div>
            </div>
            <Button size="sm" variant="ghost" icon={<MessageCircle className="h-3.5 w-3.5" />}>
              Chat
            </Button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="lg"
            fullWidth
            loading={buying}
            disabled={buying}
            onClick={handleBuy}
            icon={buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          >
            {buying ? "Transaccionando saldo..." : "Comprar con Cripto"}
          </Button>
        </div>

        <Button
          size="lg"
          fullWidth
          variant="outline"
          icon={<MessageCircle className="h-4 w-4" />}
        >
          Contactar vendedor
        </Button>
      </div>
    </div>
  );
      }
