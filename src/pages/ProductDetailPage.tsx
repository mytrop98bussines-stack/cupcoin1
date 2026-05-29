import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MOCK_PRODUCTS, CONDITION_LABELS, CATEGORY_LABELS, CRYPTO_ICONS } from "@/data/mock";
import {
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  ShoppingCart,
  Share2,
  Heart,
} from "lucide-react";
import { useState } from "react";

export function ProductDetailPage() {
  const { selectedProductId } = useAppStore();
  const [liked, setLiked] = useState(false);

  const product = MOCK_PRODUCTS.find((p) => p.id === selectedProductId);

  if (!product) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">Producto no encontrado.</p>
      </div>
    );
  }

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
      {/* Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/[0.02] flex items-center justify-center relative">
        <span className="text-6xl">{categoryEmoji[product.category] || "📦"}</span>
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className="p-2 rounded-full glass bg-white/80 dark:bg-black/40"
          >
            <Heart
              className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}`}
            />
          </button>
          <button className="p-2 rounded-full glass bg-white/80 dark:bg-black/40">
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
              {CONDITION_LABELS[product.condition]}
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
          {product.acceptedCryptos.map((c) => (
            <span
              key={c}
              className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-500 text-xs font-semibold"
            >
              {CRYPTO_ICONS[c]} {c}
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
          <Badge size="sm">{CATEGORY_LABELS[product.category]}</Badge>
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
        <Card padding="md" hover onClick={() => {}}>
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
            icon={<ShoppingCart className="h-4 w-4" />}
          >
            Comprar con Cripto
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
